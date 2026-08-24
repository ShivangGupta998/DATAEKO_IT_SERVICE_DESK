from datetime import datetime
from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Boolean,
    Date,
    DateTime,
    ForeignKey
)
from sqlalchemy.orm import relationship

from app.database.base import Base


class OffboardingRequest(Base):
    __tablename__ = "offboarding_requests"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    # Employee who is leaving
    employee_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    # Admin/HR who created request
    initiated_by = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    last_working_date = Column(
        Date,
        nullable=False
    )

    reason = Column(
        String(255),
        nullable=True,
        default="Employee departure and deprovisioning"
    )

    status = Column(
        String(30),
        nullable=False,
        default="Pending"
    )

    asset_returned = Column(
        Boolean,
        default=False
    )

    access_revoked = Column(
        Boolean,
        default=False
    )

    completed_by = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True
    )

    completion_comment = Column(
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

    # ======================================================
    # Relationships
    # ======================================================

    employee = relationship(
        "User",
        foreign_keys=[employee_id]
    )

    initiator = relationship(
        "User",
        foreign_keys=[initiated_by]
    )

    completer = relationship(
        "User",
        foreign_keys=[completed_by]
    )