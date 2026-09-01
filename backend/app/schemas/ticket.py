from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel, Field, field_serializer, validator

# ============================================================
# USER NESTED SCHEMA
# ============================================================

class UserMinResponse(BaseModel):
    id: int
    username: str
    full_name: Optional[str] = None
    email: Optional[str] = None

    class Config:
        from_attributes = True


# ============================================================
# ENUM TYPES
# ============================================================

TicketPriority = Literal[
    "low",
    "medium",
    "high",
    "critical"
]

TicketStatus = Literal[
    "open",
    "in_progress",
    "resolved",
    "closed"
]


# ============================================================
# CREATE TICKET SCHEMA
# ============================================================

class TicketCreate(BaseModel):
    title: str = Field(..., min_length=5, max_length=200)
    description: str = Field(..., min_length=10)
    category: str = Field(..., min_length=2, max_length=100)
    priority: TicketPriority = "medium"
    requester_id: Optional[int] = None
    assignee_id: Optional[int] = Field(None, alias="assigned_to")

    @validator("priority", pre=True)
    def normalize_priority(cls, v):
        if isinstance(v, str):
            return v.lower().strip()
        return v

    class Config:
        populate_by_name = True


# ============================================================
# UPDATE TICKET SCHEMA
# ============================================================

class TicketUpdate(BaseModel):
    status: Optional[str] = None
    priority: Optional[str] = None
    assignee_id: Optional[int] = Field(None, alias="assigned_to")
    comment: Optional[str] = Field(None, alias="resolution_comment")

    @validator("priority", pre=True)
    def normalize_priority(cls, v):
        if isinstance(v, str) and v.strip():
            return v.lower().strip()
        return v

    @validator("status", pre=True)
    def normalize_status(cls, v):
        if isinstance(v, str) and v.strip():
            clean = v.lower().strip().replace(" ", "_")
            if clean in ["open", "in_progress", "resolved", "closed"]:
                return clean
            return v.lower().strip()
        return v

    class Config:
        populate_by_name = True


# ============================================================
# TICKET RESPONSE SCHEMA
# ============================================================

class TicketResponse(BaseModel):
    id: int
    title: str
    description: str
    category: str
    priority: str
    status: str
    source: str = "web"
    requester_id: int
    assignee_id: Optional[int] = Field(None, alias="assigned_to")

    # Relationship Objects
    requester: Optional[UserMinResponse] = None
    assignee: Optional[UserMinResponse] = None

    # Dynamic/Fallback Name Fields
    requester_name: Optional[str] = None
    assignee_name: Optional[str] = None

    # SLA Details
    sla_due: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    sla_status: Optional[str] = None
    remaining_minutes: Optional[int] = None

    # Timestamps
    created_at: datetime
    updated_at: datetime

    # Appends Z timezone indicator to ensure frontend parses timestamps as UTC
    @field_serializer("created_at", "updated_at", "sla_due", "resolved_at")
    def serialize_dt(self, dt: Optional[datetime], _info):
        if dt is None:
            return None
        return dt.strftime("%Y-%m-%dT%H:%M:%S.%fZ")

    class Config:
        from_attributes = True
        populate_by_name = True