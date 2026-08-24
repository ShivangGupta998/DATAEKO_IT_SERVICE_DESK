from sqlalchemy import (
    Column,
    Integer,
    String,
    Date,
    DateTime,
    ForeignKey
)

from sqlalchemy.orm import relationship

from datetime import datetime

from app.database.base import Base


class Asset(Base):
    __tablename__ = "assets"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    asset_tag = Column(
        String(50),
        unique=True,
        nullable=False
    )

    asset_type = Column(
        String(100),
        nullable=False
    )

    manufacturer = Column(
        String(100),
        nullable=False
    )

    model = Column(
        String(100),
        nullable=False
    )

    serial_number = Column(
        String(100),
        unique=True,
        nullable=False
    )

    assigned_to = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True
    )

    status = Column(
        String(30),
        nullable=False,
        default="Available"
    )

    purchase_date = Column(
        Date,
        nullable=True
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    employee = relationship(
        "User",
        backref="assets"
    )