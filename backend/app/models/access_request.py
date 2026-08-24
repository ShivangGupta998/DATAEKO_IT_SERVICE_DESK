from datetime import datetime

from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    DateTime,
    ForeignKey
)

from sqlalchemy.orm import relationship

from app.database.base import Base


class AccessRequest(Base):

    __tablename__ = "access_requests"


    id = Column(
        Integer,
        primary_key=True,
        index=True
    )


    requester_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )


    access_type = Column(
        String(100),
        nullable=False
    )


    resource_name = Column(
        String(150),
        nullable=False
    )


    reason = Column(
        Text,
        nullable=False
    )


    status = Column(
        String(30),
        nullable=False,
        default="Pending"
    )


    approved_by = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True
    )


    approval_comment = Column(
        Text,
        nullable=True
    )


    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )


    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )


    # ============================================================
    # Relationships with User
    # ============================================================

    requester = relationship(
        "User",
        foreign_keys=[requester_id],
        back_populates="access_requests"
    )


    approver = relationship(
        "User",
        foreign_keys=[approved_by],
        back_populates="approved_access_requests"
    )