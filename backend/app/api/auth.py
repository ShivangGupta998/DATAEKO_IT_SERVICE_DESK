from typing import Union
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
# LOGIN USER
# ============================================================

@router.post("/login")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):

    user = db.query(User).filter(
        User.email == form_data.username
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )

    if not verify_password(
        form_data.password,
        user.hashed_password
    ):
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
# CURRENT USER
# ============================================================

@router.get("/me")
def get_profile(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Retrieve user ID safely whether current_user is a dict or a User model instance
    if isinstance(current_user, dict):
        user_id = current_user.get("user_id") or current_user.get("id") or current_user.get("sub")
    else:
        user_id = getattr(current_user, "id", None)

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user token payload"
        )

    # Fetch fresh user record from database
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User profile not found"
        )

    # Fetch role name
    role_name = "Employee"
    if hasattr(user, "role") and user.role:
        role_name = user.role.name
    else:
        role_record = db.query(Role).filter(Role.id == user.role_id).first()
        if role_record:
            role_name = role_record.name

    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "role_id": user.role_id,
        "role": role_name,
        "department_id": user.department_id,
        "is_active": user.is_active
    }