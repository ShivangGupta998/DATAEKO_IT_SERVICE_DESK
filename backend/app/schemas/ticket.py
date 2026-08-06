from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field


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


class TicketCreate(BaseModel):

    title: str = Field(
        ...,
        min_length=5,
        max_length=200
    )

    description: str = Field(
        ...,
        min_length=10
    )

    category: str = Field(
        ...,
        min_length=2,
        max_length=100
    )

    priority: TicketPriority = "medium"


class TicketUpdate(BaseModel):

    status: Optional[TicketStatus] = None

    priority: Optional[TicketPriority] = None

    assignee_id: Optional[int] = None

    comment: Optional[str] = None


class TicketResponse(BaseModel):

    id: int

    title: str

    description: str

    category: str

    priority: str

    status: str

    source: str

    requester_id: int

    assignee_id: Optional[int]

    created_at: datetime

    updated_at: datetime

    class Config:
        from_attributes = True