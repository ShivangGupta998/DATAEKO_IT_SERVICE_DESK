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


    full_name = Column(
        String,
        nullable=True
    )

    phone_number = Column(
        String,
        nullable=True
    )

    job_title = Column(
        String,
        nullable=True
    )

    timezone = Column(
        String,
        nullable=True
    )

    avatar_url = Column(
        String,
        nullable=True
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

    role = relationship("Role", foreign_keys=[role_id], lazy="joined")
    department = relationship("Department", foreign_keys=[department_id], lazy="joined")


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