import os
from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

# ============================================================
# DATABASE & MODELS
# ============================================================
from app.database.database import engine, SessionLocal
from app.database.base import Base

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

from app.api.auth import get_password_hash

# Create tables if they don't exist
Base.metadata.create_all(bind=engine)

# ============================================================
# FASTAPI APPLICATION
# ============================================================
app = FastAPI(
    title="IT Service Desk API",
    version="0.1.0"
)

# ============================================================
# CORS CONFIGURATION
# ============================================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# DATABASE AUTO-SEEDER (Runs on Startup)
# ============================================================
@app.on_event("startup")
def seed_database():
    db: Session = SessionLocal()
    try:
        # 1. Create Default Roles if missing
        roles_to_create = ["Admin", "Agent", "Employee"]
        for role_name in roles_to_create:
            existing_role = db.query(Role).filter(Role.name == role_name).first()
            if not existing_role:
                db.add(Role(name=role_name, description=f"Default {role_name} Role"))
        db.commit()

        # 2. Ensure Admin User exists
        admin_role = db.query(Role).filter(Role.name == "Admin").first()
        user = db.query(User).filter(User.email == "abhi@itservicedesk.com").first()
        
        if not user:
            default_admin = User(
                username="abhi",
                email="abhi@itservicedesk.com",
                hashed_password=get_password_hash("password123"),
                is_active=True,
                role_id=admin_role.id if admin_role else None
            )
            db.add(default_admin)
            db.commit()
    except Exception as e:
        print(f"Startup Seeding Exception: {e}")
        db.rollback()
    finally:
        db.close()

# ============================================================
# 1. FRONTEND STATIC ASSETS (Mounted before API routers)
# ============================================================
FRONTEND_DIST_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "../../frontend/dist")
)

if os.path.exists(FRONTEND_DIST_DIR):
    assets_path = os.path.join(FRONTEND_DIST_DIR, "assets")
    if os.path.exists(assets_path):
        app.mount("/assets", StaticFiles(directory=assets_path), name="assets")

# ============================================================
# 2. SUPPRESS BROWSER ICON LOGS
# ============================================================
@app.get("/apple-touch-icon{path:path}.png", include_in_schema=False)
@app.get("/favicon.ico", include_in_schema=False)
async def ignore_icon_requests():
    return Response(status_code=204)

# ============================================================
# 3. REGISTER API ROUTERS
# ============================================================
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
)

app.include_router(auth.router)
app.include_router(tickets.router)
app.include_router(slack.router)
app.include_router(asset.router)
app.include_router(access_request.router)
app.include_router(offboarding.router)
app.include_router(knowledge_base.router)
app.include_router(report.router)
app.include_router(notification.router)

# ============================================================
# 4. SPA CATCH-ALL ROUTE (Must be at the very end)
# ============================================================
if os.path.exists(FRONTEND_DIST_DIR):
    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_react_app(full_path: str):
        if full_path in ["docs", "redoc", "openapi.json"] or full_path.startswith("api/"):
            return Response(status_code=404)

        file_path = os.path.join(FRONTEND_DIST_DIR, full_path)
        if full_path and os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)

        return FileResponse(os.path.join(FRONTEND_DIST_DIR, "index.html"))