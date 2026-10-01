from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr

from app.database.database import get_db
from app.models.user import User
from app.models.role import Role
from app.models.department import Department
from app.core.security import hash_password
from app.core.dependencies import require_roles, get_current_user


router = APIRouter(
    prefix="/admin",
    tags=["Admin User Management"]
)

# Additional router for /api/v1/admin alias
router_v1 = APIRouter(
    prefix="/api/v1/admin",
    tags=["Admin User Management"]
)


class AdminUserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    full_name: Optional[str] = None
    role_id: int
    department_id: Optional[int] = 1


def _create_user_logic(
    user_in: AdminUserCreate,
    current_user: User,
    db: Session
):
    # Only Admin (1) and Manager (2) are allowed
    if current_user.role_id not in (1, 2):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Admins and Managers can onboard new users."
        )

    # Managers cannot create Admin users
    if current_user.role_id == 2 and user_in.role_id == 1:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Managers cannot create Administrator accounts."
        )

    # Check for existing email
    existing_email = db.query(User).filter(User.email == user_in.email.strip()).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )

    # Check for existing username
    existing_username = db.query(User).filter(User.username == user_in.username.strip()).first()
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This username is already taken. Please choose another."
        )

    # Validate role exists
    role_obj = db.query(Role).filter(Role.id == user_in.role_id).first()
    if not role_obj:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid role specified."
        )

    # Validate department if provided
    dept_id = user_in.department_id or 1
    dept_obj = db.query(Department).filter(Department.id == dept_id).first()
    if not dept_obj:
        # Fallback to first available department or create one
        fallback_dept = db.query(Department).first()
        dept_id = fallback_dept.id if fallback_dept else 1

    new_user = User(
        username=user_in.username.strip(),
        email=user_in.email.strip().lower(),
        full_name=user_in.full_name.strip() if user_in.full_name else None,
        hashed_password=hash_password(user_in.password),
        role_id=user_in.role_id,
        department_id=dept_id,
        is_active=True
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    role_name = new_user.role.name if new_user.role else "Employee"
    dept_name = new_user.department.name if new_user.department else "General"

    return {
        "id": new_user.id,
        "username": new_user.username,
        "email": new_user.email,
        "full_name": new_user.full_name or "",
        "role_id": new_user.role_id,
        "role": role_name,
        "department_id": new_user.department_id,
        "department": dept_name,
        "is_active": new_user.is_active
    }


def _get_users_logic(current_user: User, db: Session):
    users = db.query(User).order_by(User.id.desc()).all()
    results = []
    for u in users:
        role_name = u.role.name if u.role else "Employee"
        dept_name = u.department.name if u.department else "General"
        results.append({
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "full_name": u.full_name or "",
            "role_id": u.role_id,
            "role": role_name,
            "department_id": u.department_id,
            "department": dept_name,
            "is_active": u.is_active,
            "slack_user_id": u.slack_user_id
        })
    return results


def _get_departments_logic(db: Session):
    depts = db.query(Department).all()
    return [{"id": d.id, "name": d.name} for d in depts]


def _get_roles_logic(db: Session):
    roles = db.query(Role).all()
    return [{"id": r.id, "name": r.name, "description": r.description} for r in roles]


# Route handlers for /admin
@router.post("/users", status_code=status.HTTP_201_CREATED)
def admin_create_user(
    user_in: AdminUserCreate,
    current_user: User = Depends(require_roles(1, 2)),
    db: Session = Depends(get_db)
):
    return _create_user_logic(user_in, current_user, db)


@router.get("/users")
def admin_get_users(
    current_user: User = Depends(require_roles(1, 2)),
    db: Session = Depends(get_db)
):
    return _get_users_logic(current_user, db)


@router.get("/departments")
def admin_get_departments(
    current_user: User = Depends(require_roles(1, 2)),
    db: Session = Depends(get_db)
):
    return _get_departments_logic(db)


@router.get("/roles")
def admin_get_roles(
    current_user: User = Depends(require_roles(1, 2)),
    db: Session = Depends(get_db)
):
    return _get_roles_logic(db)


# Route handlers for /api/v1/admin
@router_v1.post("/users", status_code=status.HTTP_201_CREATED)
def admin_create_user_v1(
    user_in: AdminUserCreate,
    current_user: User = Depends(require_roles(1, 2)),
    db: Session = Depends(get_db)
):
    return _create_user_logic(user_in, current_user, db)


@router_v1.get("/users")
def admin_get_users_v1(
    current_user: User = Depends(require_roles(1, 2)),
    db: Session = Depends(get_db)
):
    return _get_users_logic(current_user, db)


@router_v1.get("/departments")
def admin_get_departments_v1(
    current_user: User = Depends(require_roles(1, 2)),
    db: Session = Depends(get_db)
):
    return _get_departments_logic(db)


@router_v1.get("/roles")
def admin_get_roles_v1(
    current_user: User = Depends(require_roles(1, 2)),
    db: Session = Depends(get_db)
):
    return _get_roles_logic(db)
