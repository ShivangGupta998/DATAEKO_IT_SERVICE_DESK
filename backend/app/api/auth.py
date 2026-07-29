from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.user import User
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


# ==========================
# REGISTER USER
# ==========================

@router.post("/register")
def register(
    user: UserCreate,
    db: Session = Depends(get_db)
):

    existing_user = db.query(User).filter(
        User.email == user.email
    ).first()


    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
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



# ==========================
# LOGIN USER (JWT)
# ==========================

@router.post("/login")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):

    # Swagger sends username field
    # We are using email as username

    user = db.query(User).filter(
        User.email == form_data.username
    ).first()


    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )


    if not verify_password(
        form_data.password,
        user.hashed_password
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid password"
        )


    token = create_access_token(
        {
            "user_id": user.id,
            "role_id": user.role_id
        }
    )


    return {
        "access_token": token,
        "token_type": "bearer"
    }



# ==========================
# PROTECTED ROUTE
# ==========================

@router.get("/me")
def get_profile(
    current_user = Depends(get_current_user)
):

    return {
        "message": "Protected route accessed",
        "user": current_user
    }