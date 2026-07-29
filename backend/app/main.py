from fastapi import FastAPI

from app.api import auth
from app.api import test   # <-- Add this

from app.database.database import engine
from app.database.base import Base

# Import all models
from app.models.role import Role
from app.models.department import Department
from app.models.user import User
from app.models.permission import Permission
from app.models.role_permission import RolePermission

# Create all database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="IT Service Desk API",
    version="0.1.0"
)

# Register API routes
app.include_router(auth.router)
app.include_router(test.router)   # <-- Add this

@app.get("/")
def root():
    return {
        "message": "IT Service Desk API is running"
    }