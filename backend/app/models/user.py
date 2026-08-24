from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    ForeignKey
)

from sqlalchemy.orm import relationship

from app.database.base import Base


class User(Base):

    __tablename__ = "users"


    id = Column(
        Integer,
        primary_key=True,
        index=True
    )


    username = Column(
        String,
        unique=True,
        nullable=False
    )


    email = Column(
        String,
        unique=True,
        nullable=False
    )


    hashed_password = Column(
        String,
        nullable=False
    )


    is_active = Column(
        Boolean,
        default=True
    )


    role_id = Column(
        Integer,
        ForeignKey("roles.id")
    )


    department_id = Column(
        Integer,
        ForeignKey("departments.id")
    )


    # ========================================================
    # SLACK USER ID
    # ========================================================

    slack_user_id = Column(
        String,
        unique=True,
        nullable=True,
        index=True
    )


    # ========================================================
    # ACCESS REQUEST RELATIONSHIPS
    # ========================================================

    access_requests = relationship(
        "AccessRequest",
        foreign_keys="AccessRequest.requester_id",
        back_populates="requester"
    )


    approved_access_requests = relationship(
        "AccessRequest",
        foreign_keys="AccessRequest.approved_by",
        back_populates="approver"
    )


    # ========================================================
    # NOTIFICATION RELATIONSHIP
    # ========================================================

    notifications = relationship(
        "Notification",
        back_populates="user",
        cascade="all, delete"
    )