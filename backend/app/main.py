from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import auth
from app.api import tickets
from app.api import slack

from app.database.database import engine
from app.database.base import Base

# Models
from app.models.role import Role
from app.models.department import Department
from app.models.user import User
from app.models.permission import Permission
from app.models.role_permission import RolePermission
from app.models.ticket import Ticket
from app.models.ticket_activity import TicketActivity


# Create database tables
Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="IT Service Desk API",
    version="0.1.0"
)


# ============================================================
# CORS CONFIGURATION
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# ROUTERS
# ============================================================

app.include_router(auth.router)
app.include_router(tickets.router)
app.include_router(slack.router)


# ============================================================
# ROOT ENDPOINT
# ============================================================

@app.get("/")
def root():
    return {
        "message": "IT Service Desk API is running"
    }