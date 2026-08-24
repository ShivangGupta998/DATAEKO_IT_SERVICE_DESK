from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel, ConfigDict


# ============================================================
# CREATE OFFBOARDING REQUEST
# ============================================================

class OffboardingCreate(BaseModel):
    employee_id: Optional[int] = 6
    last_working_date: Optional[date] = date(2026, 8, 19)
    reason: Optional[str] = "Employee departure and deprovisioning"


# ============================================================
# UPDATE OFFBOARDING REQUEST
# ============================================================

class OffboardingUpdate(BaseModel):
    status: str
    asset_returned: Optional[bool] = False
    access_revoked: Optional[bool] = False
    completion_comment: Optional[str] = None


# ============================================================
# RESPONSE SCHEMA
# ============================================================

class OffboardingResponse(BaseModel):
    id: int
    employee_id: int
    initiated_by: int
    last_working_date: date
    reason: Optional[str] = None
    status: str
    asset_returned: Optional[bool] = False
    access_revoked: Optional[bool] = False
    completed_by: Optional[int] = None
    completion_comment: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(
        from_attributes=True
    )