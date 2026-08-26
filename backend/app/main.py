import os
from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

# ============================================================
# DATABASE & MODELS IMPORT
# ============================================================
from app.database.database import engine
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

# ============================================================
# CREATE DATABASE TABLES
# ============================================================
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
# SUPPRESS BROWSER ICON 404 LOGS
# ============================================================
@app.get("/apple-touch-icon{path:path}.png", include_in_schema=False)
@app.get("/favicon.ico", include_in_schema=False)
async def ignore_icon_requests():
    return Response(status_code=204)

# ============================================================
# API ROUTERS
# ============================================================
from app.api import auth
from app.api import tickets
from app.api import slack
from app.api import asset
from app.api import access_request
from app.api import offboarding
from app.api import knowledge_base
from app.api import report
from app.api import notification

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
# FRONTEND STATIC FILES & SPA SERVING
# ============================================================
FRONTEND_DIST_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../frontend/dist"))

if os.path.exists(FRONTEND_DIST_DIR):
    assets_path = os.path.join(FRONTEND_DIST_DIR, "assets")
    if os.path.exists(assets_path):
        app.mount("/assets", StaticFiles(directory=assets_path, html=False), name="assets")

    # Catch-all route to serve index.html for React SPA routing
    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_react_app(full_path: str):
        # Exclude FastAPI documentation & internal schema paths
        if full_path in ["docs", "redoc", "openapi.json"] or full_path.startswith("api/"):
            return Response(status_code=404)

        file_path = os.path.join(FRONTEND_DIST_DIR, full_path)
        if full_path and os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
            
        return FileResponse(os.path.join(FRONTEND_DIST_DIR, "index.html"))