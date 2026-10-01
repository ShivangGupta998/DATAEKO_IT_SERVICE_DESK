from typing import Union, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.user import User
from app.models.role import Role
from app.models.department import Department
from app.schemas.user import UserCreate

from app.core.security import (
    hash_password,
    verify_password
)

from app.core.jwt import create_access_token
from app.core.dependencies import get_current_user


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


# ============================================================
# REGISTER USER
# ============================================================

@router.post("/register")
def register(
    user: UserCreate,
    db: Session = Depends(get_db)
):

    existing_email = db.query(User).filter(
        User.email == user.email
    ).first()

    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    existing_username = db.query(User).filter(
        User.username == user.username
    ).first()

    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )

    new_user = User(
        username=user.username,
        email=user.email,
        hashed_password=hash_password(user.password),
        role_id=user.role_id,
        department_id=user.department_id,
        is_active=True
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "id": new_user.id,
        "username": new_user.username,
        "email": new_user.email,
        "role_id": new_user.role_id,
        "department_id": new_user.department_id,
        "is_active": new_user.is_active
    }


# ============================================================
# LOGIN USER (WITH DEBUG LOGGING)
# ============================================================

@router.post("/login")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    # Look up user by Email OR Username
    user = db.query(User).filter(
        (User.email == form_data.username) | (User.username == form_data.username)
    ).first()

    if not user:
        print("DEBUG: User not found in database!")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    print(f"DEBUG: Found user -> {user.email} (Username: {user.username})")
    print(f"DEBUG: Incoming password -> {form_data.password}")
    print(f"DEBUG: Stored hash -> {user.hashed_password}")

    if not user.is_active:
        print("DEBUG: User account is inactive!")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )

    is_valid = verify_password(form_data.password, user.hashed_password)
    print(f"DEBUG: Password match result -> {is_valid}")

    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    # Fetch role name from Role table
    role_name = "Employee"
    if hasattr(user, "role") and user.role:
        role_name = user.role.name
    else:
        role_record = db.query(Role).filter(Role.id == user.role_id).first()
        if role_record:
            role_name = role_record.name

    access_token = create_access_token(
        {
            "user_id": user.id,
            "role_id": user.role_id,
            "role": role_name
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user.id,
        "role_id": user.role_id,
        "role": role_name,
        "username": user.username,
        "email": user.email
    }


# ============================================================
class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    job_title: Optional[str] = None
    timezone: Optional[str] = None
    avatar_url: Optional[str] = None


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


@router.get("/me")
def get_profile(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if isinstance(current_user, dict):
        user_id = current_user.get("user_id") or current_user.get("id") or current_user.get("sub")
    else:
        user_id = getattr(current_user, "id", None)

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user token payload"
        )

    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User profile not found"
        )

    role_name = "Employee"
    if hasattr(user, "role") and user.role:
        role_name = user.role.name
    else:
        role_record = db.query(Role).filter(Role.id == user.role_id).first()
        if role_record:
            role_name = role_record.name

    dept_name = "General IT"
    if hasattr(user, "department") and user.department:
        dept_name = user.department.name

    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "full_name": user.full_name or "",
        "phone_number": user.phone_number or "",
        "job_title": user.job_title or "",
        "timezone": user.timezone or "UTC",
        "avatar_url": user.avatar_url or "",
        "role_id": user.role_id,
        "role": role_name,
        "department_id": user.department_id,
        "department": dept_name,
        "is_active": user.is_active
    }


@router.patch("/me")
def update_profile(
    data: ProfileUpdate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if isinstance(current_user, dict):
        user_id = current_user.get("user_id") or current_user.get("id") or current_user.get("sub")
    else:
        user_id = getattr(current_user, "id", None)

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user credentials"
        )

    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    if data.full_name is not None:
        user.full_name = data.full_name.strip()
    if data.phone_number is not None:
        user.phone_number = data.phone_number.strip()
    if data.job_title is not None:
        user.job_title = data.job_title.strip()
    if data.timezone is not None:
        user.timezone = data.timezone.strip()
    if data.avatar_url is not None:
        user.avatar_url = data.avatar_url.strip()

    db.commit()
    db.refresh(user)

    role_name = user.role.name if user.role else "Employee"
    dept_name = user.department.name if user.department else "General IT"

    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "full_name": user.full_name or "",
        "phone_number": user.phone_number or "",
        "job_title": user.job_title or "",
        "timezone": user.timezone or "UTC",
        "avatar_url": user.avatar_url or "",
        "role_id": user.role_id,
        "role": role_name,
        "department_id": user.department_id,
        "department": dept_name,
        "is_active": user.is_active
    }


@router.post("/change-password")
def change_password(
    data: ChangePasswordRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if isinstance(current_user, dict):
        user_id = current_user.get("user_id") or current_user.get("id") or current_user.get("sub")
    else:
        user_id = getattr(current_user, "id", None)

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    if not verify_password(data.current_password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password does not match records"
        )

    if len(data.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 8 characters long"
        )

    user.hashed_password = hash_password(data.new_password)
    db.commit()

    return {"message": "Password updated successfully"}