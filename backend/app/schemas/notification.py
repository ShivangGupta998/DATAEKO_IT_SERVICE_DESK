from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class NotificationBase(BaseModel):
    title: str
    message: str
    type: str = Field(..., alias="notification_type")
    reference_id: Optional[int] = None

    class Config:
        populate_by_name = True


class NotificationResponse(NotificationBase):
    id: int
    user_id: int
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True
        populate_by_name = True


class NotificationReadUpdate(BaseModel):
    is_read: bool = True