from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.offboarding import OffboardingRequest
from app.models.user import User
from app.models.asset import Asset
from app.models.access_request import AccessRequest
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
    if isinstance(user_obj, dict):
        return user_obj.get("user_id") or user_obj.get("id")
    return getattr(user_obj, "id", None)

def get_role_id(user_obj) -> int:
    if isinstance(user_obj, dict):
        return user_obj.get("role_id")
    return getattr(user_obj, "role_id", None)

def require_staff_role(current_user=Depends(get_current_user)):
    role_id = get_role_id(current_user)
    if role_id not in [1, 2, 3]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to perform this action"
        )
    return current_user

@router.get("/{offboarding_id}/checklist")
def get_offboarding_checklist(
    offboarding_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_staff_role)
) -> Dict[str, Any]:
    """Generates an explicit, zero-omission revocation checklist for an employee."""
    offboarding = db.query(OffboardingRequest).filter(OffboardingRequest.id == offboarding_id).first()
    if not offboarding:
        raise HTTPException(status_code=404, detail="Offboarding request not found")

    emp_id = offboarding.employee_id
    employee = db.query(User).filter(User.id == emp_id).first()

    # Query assigned hardware/licenses
    assigned_assets = db.query(Asset).filter(Asset.assigned_to == emp_id).all()
    
    # Query approved access grants using AccessRequest.requester_id
    active_access = db.query(AccessRequest).filter(
        AccessRequest.requester_id == emp_id,
        AccessRequest.status.ilike("approved")
    ).all()

    return {
        "offboarding_id": offboarding.id,
        "employee_id": emp_id,
        "employee_email": employee.email if employee else "Unknown",
        "hardware_and_assets": [
            {
                "asset_id": a.id,
                "asset_tag": a.asset_tag,
                "model": a.model,
                "serial_number": a.serial_number,
                "asset_type": a.asset_type,
                "cost": a.cost or 0.0
            }
            for a in assigned_assets
        ],
        "access_grants_to_revoke": [
            {
                "access_request_id": acc.id,
                "access_type": acc.access_type,
                "resource_name": acc.resource_name,
                "granted_at": acc.created_at
            }
            for acc in active_access
        ],
        "summary": {
            "total_assets_to_recover": len(assigned_assets),
            "total_access_grants_to_revoke": len(active_access),
            "checklist_complete": offboarding.asset_returned and offboarding.access_revoked
        }
    }

@router.post("", response_model=OffboardingResponse, status_code=status.HTTP_201_CREATED)
def create_offboarding(
    offboarding_data: OffboardingCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_staff_role)
):
    current_user_id = get_user_id(current_user)
    target_emp_id = offboarding_data.employee_id or current_user_id

    offboarding = OffboardingRequest(
        employee_id=target_emp_id,
        initiated_by=current_user_id,
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

@router.get("", response_model=List[OffboardingResponse])
def get_all_offboarding(
    db: Session = Depends(get_db),
    current_user=Depends(require_staff_role)
):
    return db.query(OffboardingRequest).order_by(OffboardingRequest.created_at.desc()).all()

@router.get("/my", response_model=List[OffboardingResponse])
def get_my_offboarding(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    current_user_id = get_user_id(current_user)
    return db.query(OffboardingRequest).filter(OffboardingRequest.employee_id == current_user_id).order_by(OffboardingRequest.created_at.desc()).all()

@router.get("/{offboarding_id}", response_model=OffboardingResponse)
def get_single_offboarding(
    offboarding_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    offboarding = db.query(OffboardingRequest).filter(OffboardingRequest.id == offboarding_id).first()
    if not offboarding:
        raise HTTPException(status_code=404, detail="Offboarding request not found")
    return offboarding

@router.patch("/{offboarding_id}", response_model=OffboardingResponse)
def update_offboarding(
    offboarding_id: int,
    update_data: OffboardingUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_staff_role)
):
    offboarding = db.query(OffboardingRequest).filter(OffboardingRequest.id == offboarding_id).first()
    if not offboarding:
        raise HTTPException(status_code=404, detail="Offboarding request not found")

    if update_data.status and update_data.status not in ["Pending", "In Progress", "Completed"]:
        raise HTTPException(status_code=400, detail="Invalid status")

    if update_data.status:
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