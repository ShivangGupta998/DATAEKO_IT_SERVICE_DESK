from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.offboarding import OffboardingRequest
from app.models.user import User
from app.schemas.offboarding import (
    OffboardingCreate,
    OffboardingResponse,
    OffboardingUpdate,
)
from app.core.dependencies import get_current_user


router = APIRouter(
    prefix="/offboarding",
    tags=["Offboarding"]
)


def get_user_id(user_obj) -> int:
    """Helper to safely extract user ID whether current_user is a dict or User model."""
    if isinstance(user_obj, dict):
        return user_obj.get("user_id") or user_obj.get("id")
    return getattr(user_obj, "id", None)


def get_role_id(user_obj) -> int:
    """Helper to safely extract role ID whether current_user is a dict or User model."""
    if isinstance(user_obj, dict):
        return user_obj.get("role_id")
    return getattr(user_obj, "role_id", None)


# ============================================================
# RBAC HELPER
# ============================================================

def require_staff_role(current_user=Depends(get_current_user)):
    # Role IDs: 1 = Admin, 2 = Manager, 3 = Technician, 4 = Employee
    role_id = get_role_id(current_user)

    if role_id not in [1, 2, 3]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to perform this action"
        )
    return current_user


# ============================================================
# CREATE OFFBOARDING REQUEST
# ============================================================

@router.post(
    "",
    response_model=OffboardingResponse,
    status_code=status.HTTP_201_CREATED
)
def create_offboarding(
    offboarding_data: OffboardingCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_staff_role)
):
    current_user_id = get_user_id(current_user)

    # Resolve initiator
    initiator = db.query(User).filter(User.id == current_user_id).first()
    if not initiator:
        initiator = db.query(User).first()

    # Resolve employee safely (fallback if ID doesn't exist)
    target_emp_id = offboarding_data.employee_id or current_user_id
    employee = db.query(User).filter(User.id == target_emp_id).first()
    if not employee:
        employee = initiator

    offboarding = OffboardingRequest(
        employee_id=employee.id,
        initiated_by=initiator.id,
        last_working_date=offboarding_data.last_working_date,
        reason=offboarding_data.reason or "Employee departure and deprovisioning",
        status="Pending",
        asset_returned=False,
        access_revoked=False
    )

    db.add(offboarding)
    db.commit()
    db.refresh(offboarding)
    return offboarding


# ============================================================
# GET ALL OFFBOARDING REQUESTS
# ============================================================

@router.get(
    "",
    response_model=List[OffboardingResponse]
)
def get_all_offboarding(
    db: Session = Depends(get_db),
    current_user=Depends(require_staff_role)
):
    requests = (
        db.query(OffboardingRequest)
        .order_by(OffboardingRequest.created_at.desc())
        .all()
    )
    return requests


# ============================================================
# GET MY OFFBOARDING REQUESTS
# ============================================================

@router.get(
    "/my",
    response_model=List[OffboardingResponse]
)
def get_my_offboarding(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    current_user_id = get_user_id(current_user)
    requests = (
        db.query(OffboardingRequest)
        .filter(OffboardingRequest.employee_id == current_user_id)
        .order_by(OffboardingRequest.created_at.desc())
        .all()
    )
    return requests


# ============================================================
# GET SINGLE OFFBOARDING REQUEST
# ============================================================

@router.get(
    "/{offboarding_id}",
    response_model=OffboardingResponse
)
def get_single_offboarding(
    offboarding_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    offboarding = (
        db.query(OffboardingRequest)
        .filter(OffboardingRequest.id == offboarding_id)
        .first()
    )

    if not offboarding:
        raise HTTPException(
            status_code=404,
            detail="Offboarding request not found"
        )

    return offboarding


# ============================================================
# UPDATE / COMPLETE OFFBOARDING REQUEST
# ============================================================

@router.patch(
    "/{offboarding_id}",
    response_model=OffboardingResponse
)
def update_offboarding(
    offboarding_id: int,
    update_data: OffboardingUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_staff_role)
):
    offboarding = (
        db.query(OffboardingRequest)
        .filter(OffboardingRequest.id == offboarding_id)
        .first()
    )

    if not offboarding:
        raise HTTPException(
            status_code=404,
            detail="Offboarding request not found"
        )

    if update_data.status not in ["Pending", "In Progress", "Completed"]:
        raise HTTPException(
            status_code=400,
            detail="Invalid status"
        )

    offboarding.status = update_data.status
    if update_data.asset_returned is not None:
        offboarding.asset_returned = update_data.asset_returned
    if update_data.access_revoked is not None:
        offboarding.access_revoked = update_data.access_revoked
    if update_data.completion_comment is not None:
        offboarding.completion_comment = update_data.completion_comment

    if update_data.status == "Completed":
        offboarding.completed_by = get_user_id(current_user)

    db.commit()
    db.refresh(offboarding)
    return offboarding