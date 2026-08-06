from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime

from app.database.base import Base


class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, index=True)

    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)

    category = Column(String(100), nullable=False)
    priority = Column(String(50), nullable=False, default="medium")
    status = Column(String(50), nullable=False, default="open")

    source = Column(String(50), nullable=False, default="web")

    requester_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    assignee_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    requester = relationship(
        "User",
        foreign_keys=[requester_id]
    )

    assignee = relationship(
        "User",
        foreign_keys=[assignee_id]
    )

    activities = relationship(
        "TicketActivity",
        back_populates="ticket",
        cascade="all, delete-orphan"
    )
    