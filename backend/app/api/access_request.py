from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.access_request import AccessRequest
from app.models.user import User
from app.schemas.access_request import (
    AccessRequestCreate,
    AccessRequestResponse,
    AccessRequestUpdate,
)
from app.core.dependencies import get_current_user


router = APIRouter(
    prefix="/access-requests",
    tags=["Access Requests"]
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
    role_id = get_role_id(current_user)

    if role_id not in [1, 2, 3]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to perform this action"
        )
    return current_user


# ============================================================
# CREATE ACCESS REQUEST
# ============================================================

@router.post(
    "",
    response_model=AccessRequestResponse,
    status_code=status.HTTP_201_CREATED
)
def create_access_request(
    request_data: AccessRequestCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    current_user_id = get_user_id(current_user)
    user = db.query(User).filter(User.id == current_user_id).first()
    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    access_request = AccessRequest(
        requester_id=user.id,
        access_type=request_data.access_type,
        resource_name=request_data.resource_name,
        reason=request_data.reason,
        status="Pending"
    )

    db.add(access_request)
    db.commit()
    db.refresh(access_request)

    return access_request


# ============================================================
# GET ALL ACCESS REQUESTS
# ============================================================

@router.get(
    "",
    response_model=List[AccessRequestResponse]
)
def get_all_access_requests(
    db: Session = Depends(get_db),
    current_user=Depends(require_staff_role)
):
    requests = (
        db.query(AccessRequest)
        .order_by(AccessRequest.created_at.desc())
        .all()
    )
    return requests


# ============================================================
# GET MY ACCESS REQUESTS
# ============================================================

@router.get(
    "/my",
    response_model=List[AccessRequestResponse]
)
def get_my_access_requests(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    current_user_id = get_user_id(current_user)
    requests = (
        db.query(AccessRequest)
        .filter(AccessRequest.requester_id == current_user_id)
        .order_by(AccessRequest.created_at.desc())
        .all()
    )
    return requests


# ============================================================
# GET SINGLE ACCESS REQUEST
# ============================================================

@router.get(
    "/{request_id}",
    response_model=AccessRequestResponse
)
def get_access_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    access_request = (
        db.query(AccessRequest)
        .filter(AccessRequest.id == request_id)
        .first()
    )

    if not access_request:
        raise HTTPException(
            status_code=404,
            detail="Access request not found"
        )

    return access_request


# ============================================================
# APPROVE / REJECT ACCESS REQUEST
# ============================================================

@router.patch(
    "/{request_id}",
    response_model=AccessRequestResponse
)
def update_access_request(
    request_id: int,
    request_update: AccessRequestUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_staff_role)
):
    access_request = (
        db.query(AccessRequest)
        .filter(AccessRequest.id == request_id)
        .first()
    )

    if not access_request:
        raise HTTPException(
            status_code=404,
            detail="Access request not found"
        )

    if request_update.status not in ["Approved", "Rejected"]:
        raise HTTPException(
            status_code=400,
            detail="Status must be Approved or Rejected"
        )

    access_request.status = request_update.status
    access_request.approved_by = get_user_id(current_user)
    access_request.approval_comment = request_update.approval_comment

    db.commit()
    db.refresh(access_request)

    return access_request