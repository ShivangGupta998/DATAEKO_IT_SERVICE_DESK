from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


# ============================================================
# CREATE ACCESS REQUEST
# ============================================================

class AccessRequestCreate(BaseModel):
    access_type: str = "Standard Read/Write"
    resource_name: str = "GitHub Enterprise"
    reason: Optional[str] = "Required for daily project contributions."


# ============================================================
# UPDATE ACCESS REQUEST (Approve / Reject)
# ============================================================

class AccessRequestUpdate(BaseModel):
    status: str
    approval_comment: Optional[str] = None


# ============================================================
# RESPONSE SCHEMA
# ============================================================

class AccessRequestResponse(BaseModel):
    id: int
    requester_id: int
    access_type: str
    resource_name: str
    reason: Optional[str] = None
    status: str
    approved_by: Optional[int] = None
    approval_comment: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(
        from_attributes=True
    )