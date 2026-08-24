from pydantic import BaseModel
from typing import List


# ============================================================
# Ticket Summary Report
# ============================================================
class TicketSummaryResponse(BaseModel):
    total_tickets: int
    open_tickets: int
    in_progress_tickets: int
    resolved_tickets: int
    closed_tickets: int

    class Config:
        from_attributes = True


# ============================================================
# User Activity Report
# ============================================================
class UserActivityResponse(BaseModel):
    user: str
    total_tickets: int

    class Config:
        from_attributes = True


# ============================================================
# Priority Analysis Report
# ============================================================
class TicketPriorityResponse(BaseModel):
    priority: str
    count: int

    class Config:
        from_attributes = True


# ============================================================
# Status Analysis Report
# ============================================================
class TicketStatusResponse(BaseModel):
    status: str
    count: int

    class Config:
        from_attributes = True


# ============================================================
# Composite Dashboard Overview Report
# ============================================================
class DashboardReportResponse(BaseModel):
    total_volume: int
    active_in_flight: int
    resolved_rate: str
    sla_health: str
    status_breakdown: List[TicketStatusResponse]
    priority_breakdown: List[TicketPriorityResponse]

    class Config:
        from_attributes = True