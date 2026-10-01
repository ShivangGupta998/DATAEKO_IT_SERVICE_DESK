import os
import asyncio
import bcrypt
from fastapi import FastAPI, Response, APIRouter, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

# Import Connection Manager
from app.core.sockets import notification_manager

# Background Task Scheduler
from app.services.sla_service import start_sla_and_auto_assign_scheduler

from app.database.database import engine, SessionLocal
from app.database.base import Base
from app.core.config import settings

from app.models.asset import Asset
from app.models.role import Role
from app.models.department import Department
from app.models.user import User
from app.models.permission import Permission
from app.models.role_permission import RolePermission
from app.models.ticket import Ticket
from app.models.ticket_activity import TicketActivity
from app.models.access_request import AccessRequest
from app.models.offboarding import OffboardingRequest
from app.models.knowledge_base import KnowledgeArticle
from app.models.notification import Notification

# Routers Import
from app.api import (
    auth,
    tickets,
    slack,
    asset,
    access_request,
    offboarding,
    knowledge_base,
    report,
    notification,
    admin,
)

def hash_password_direct(password: str) -> str:
    password_bytes = password.encode('utf-8')[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password_bytes, salt).decode('utf-8')

# Initialize DB Tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="IT Service Desk API",
    version="0.1.0"
)

# Enable CORS across local IP networks and devices
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 1. Dedicated WebSocket Route Definition (Must be evaluated before static mounts)
ws_router = APIRouter()

@ws_router.websocket("/ws/notifications/{user_id}")
async def websocket_notifications_endpoint(websocket: WebSocket, user_id: str):
    await notification_manager.connect(user_id, websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        notification_manager.disconnect(user_id)
    except Exception as e:
        print(f"WebSocket session terminated for user {user_id}: {e}")
        notification_manager.disconnect(user_id)

app.include_router(ws_router)

# 2. Include REST API Routers
app.include_router(auth.router)
app.include_router(tickets.router)
app.include_router(slack.router)
app.include_router(asset.router)
app.include_router(access_request.router)
app.include_router(offboarding.router)
app.include_router(knowledge_base.router)
app.include_router(report.router)
app.include_router(notification.router)
app.include_router(admin.router)
app.include_router(admin.router_v1)

# 3. Startup & Seed Logic
@app.on_event("startup")
async def startup_event():
    asyncio.create_task(start_sla_and_auto_assign_scheduler())

    db: Session = SessionLocal()
    try:
        admin_role = db.query(Role).filter(Role.name == "Admin").first()
        if not admin_role:
            admin_role = Role(name="Admin", description="System Administrator")
            db.add(admin_role)
            db.commit()
            db.refresh(admin_role)

        for role_name in ["Agent", "Employee"]:
            if not db.query(Role).filter(Role.name == role_name).first():
                db.add(Role(name=role_name, description=f"Default {role_name} Role"))
        db.commit()

        default_admin_email = getattr(settings, "DEFAULT_ADMIN_EMAIL", None)
        default_admin_username = getattr(settings, "DEFAULT_ADMIN_USERNAME", None)
        default_admin_password = getattr(settings, "DEFAULT_ADMIN_PASSWORD", None)

        if default_admin_email and default_admin_password:
            user = db.query(User).filter(User.email == default_admin_email).first()
            if not user:
                hashed_pw = hash_password_direct(default_admin_password)
                user = User(
                    username=default_admin_username or default_admin_email.split("@")[0],
                    email=default_admin_email,
                    hashed_password=hashed_pw,
                    is_active=True,
                    role_id=admin_role.id
                )
                db.add(user)
                db.commit()
                print(f"--> SEED SUCCESS: Default admin {default_admin_email} initialized")
            else:
                print(f"--> SEED SKIPPED: Admin {default_admin_email} already exists")
        else:
            print("--> SEED SKIPPED: No default admin configured. Set DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_USERNAME, and DEFAULT_ADMIN_PASSWORD in the environment to enable one.")

    except Exception as e:
        print(f"--> SEED ERROR: {e}")
        db.rollback()
    finally:
        db.close()

# 4. Icon Handlers
@app.get("/apple-touch-icon{path:path}.png", include_in_schema=False)
@app.get("/favicon.ico", include_in_schema=False)
async def ignore_icon_requests():
    return Response(status_code=204)

# 5. Static Assets & SPA Catch-All Route
FRONTEND_DIST_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "../../frontend/dist")
)

if os.path.exists(FRONTEND_DIST_DIR):
    static_path = os.path.join(FRONTEND_DIST_DIR, "static")
    if os.path.exists(static_path):
        app.mount("/static", StaticFiles(directory=static_path), name="static")

    assets_path = os.path.join(FRONTEND_DIST_DIR, "assets")
    if os.path.exists(assets_path):
        app.mount("/assets", StaticFiles(directory=assets_path), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_react_app(full_path: str):
        # Exclude WebSocket and API paths from returning index.html
        if full_path.startswith("ws") or full_path.startswith("api") or full_path in ["docs", "redoc", "openapi.json"]:
            return Response(status_code=404)

        file_path = os.path.join(FRONTEND_DIST_DIR, full_path)
        if full_path and os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)

        return FileResponse(os.path.join(FRONTEND_DIST_DIR, "index.html"))