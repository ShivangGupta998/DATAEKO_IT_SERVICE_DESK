from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel, Field, validator

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
    assigned_to: Optional[int] = Field(None, alias="assignee_id")

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

    # SLA Details
    sla_due: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    sla_status: Optional[str] = None
    remaining_minutes: Optional[int] = None

    # Timestamps
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
        populate_by_name = True