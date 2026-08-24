from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware

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


# ============================================================
# DATABASE
# ============================================================

from app.database.database import engine
from app.database.base import Base


# ============================================================
# MODELS
# Import all models so SQLAlchemy knows them
# ============================================================

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
# Allow wildcard "*" or explicitly include the new IP network addresses
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows requests from any IP address (e.g. 10.171.40.185, 172.31.30.73, localhost)
    allow_credentials=True,
    allow_methods=["*"],  # Allows GET, POST, OPTIONS, PUT, PATCH, DELETE
    allow_headers=["*"],  # Allows Authorization, Content-Type, etc.
)


# ============================================================
# REGISTER ROUTERS
# ============================================================

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
# SUPPRESS BROWSER ICON 404 LOGS
# Intercepts automatic favicon and Apple touch icon probes
# ============================================================

@app.get("/apple-touch-icon{path:path}.png", include_in_schema=False)
@app.get("/favicon.ico", include_in_schema=False)
async def ignore_icon_requests():
    return Response(status_code=204)


# ============================================================
# ROOT ENDPOINT
# ============================================================

@app.get("/")
def root():
    return {
        "message": "IT Service Desk API is running"
    }