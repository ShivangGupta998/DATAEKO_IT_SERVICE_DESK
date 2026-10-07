from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.notification import NotificationResponse
from app.services.notification_service import (
    get_user_notifications,
    mark_notification_read,
    mark_all_notifications_read,
    get_unread_notification_count
)


router = APIRouter(
    prefix="/notifications",
    tags=["Notifications"]
)


def _get_user_id(user) -> int:
    return user.get("id") if isinstance(user, dict) else user.id


@router.get("/", response_model=list[NotificationResponse])
def get_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_user_notifications(db=db, user_id=_get_user_id(current_user))


@router.patch("/{notification_id}/read", response_model=NotificationResponse)
def read_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    notification = mark_notification_read(
        db=db,
        notification_id=notification_id,
        user_id=_get_user_id(current_user)
    )

    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )

    return notification


@router.patch("/read-all")
@router.post("/read-all")
def read_all_user_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> dict:
    count = mark_all_notifications_read(db=db, user_id=_get_user_id(current_user))
    return {"status": "ok", "marked_read_count": count}


@router.get("/count")
def get_notification_count(

    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> dict:
    count = get_unread_notification_count(db=db, user_id=_get_user_id(current_user))
    return {"unread_count": count}