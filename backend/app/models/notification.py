from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    DateTime,
    ForeignKey
)

from sqlalchemy.orm import relationship

from datetime import datetime, timezone

from app.database.base import Base


class Notification(Base):

    __tablename__ = "notifications"


    id = Column(
        Integer,
        primary_key=True,
        index=True
    )


    user_id = Column(
        Integer,
        ForeignKey(
            "users.id",
            ondelete="CASCADE"
        ),
        nullable=False
    )


    title = Column(
        String(200),
        nullable=False
    )


    message = Column(
        String(500),
        nullable=False
    )


    notification_type = Column(
        String(50),
        nullable=False
    )


    is_read = Column(
        Boolean,
        default=False
    )


    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc)
    )


    # Relationship with User
    user = relationship(
        "User",
        back_populates="notifications"
    )