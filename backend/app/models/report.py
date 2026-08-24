from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text, JSON, ForeignKey
from sqlalchemy.orm import relationship

from app.database.database import Base


class ReportAuditLog(Base):
    """
    Tracks report generation history for compliance and auditing.
    Records which admin/manager pulled which report and when.
    """
    __tablename__ = "report_audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    report_type = Column(String(50), nullable=False, index=True)  # e.g., 'dashboard', 'user-activity'
    export_format = Column(String(10), default="JSON")            # 'JSON', 'CSV', 'PDF'
    filters_applied = Column(JSON, nullable=True)                 # Saved query parameters
    generated_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    generated_by_user = relationship("User", foreign_keys=[user_id])

    def __repr__(self):
        return f"<ReportAuditLog id={self.id} type='{self.report_type}' user_id={self.user_id}>"


class ReportCache(Base):
    """
    Optional model for storing pre-aggregated report payloads for fast retrieval 
    on large databases.
    """
    __tablename__ = "report_caches"

    id = Column(Integer, primary_key=True, index=True)
    report_key = Column(String(100), unique=True, nullable=False, index=True) # e.g., 'dashboard_daily'
    cached_data = Column(JSON, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<ReportCache key='{self.report_key}' updated_at={self.updated_at}>"