from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from datetime import datetime

from app.database.database import get_db
from app.models.ticket import Ticket
from app.models.user import User
from app.core.dependencies import get_current_user

router = APIRouter(
    prefix="/reports",
    tags=["Reports & Analytics"]
)

# ============================================================
# RBAC HELPER (Admin: 1, Manager: 2)
# ============================================================
def require_admin_manager(current_user=Depends(get_current_user)):
    role_id = current_user.get("role_id") if isinstance(current_user, dict) else getattr(current_user, "role_id", None)
    
    if role_id not in [1, 2]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access reports"
        )
    return current_user


# ============================================================
# COMPOSITE DASHBOARD REPORT (Matches Frontend Dashboard UI)
# ============================================================
@router.get("")
@router.get("/dashboard")
def get_reports_dashboard(
    db: Session = Depends(get_db),
    current_user=Depends(require_admin_manager)
):
    # Single query to compute total volume and status counts
    counts = db.query(
        func.count(Ticket.id).label("total_volume"),
        func.count(case((Ticket.status.ilike("open"), 1))).label("open_count"),
        func.count(case((Ticket.status.ilike("in_progress"), 1))).label("in_progress_count"),
        func.count(case((Ticket.status.ilike("resolved"), 1))).label("resolved_count"),
        func.count(case((Ticket.status.ilike("closed"), 1))).label("closed_count")
    ).first()

    total_tickets = counts.total_volume or 0
    open_count = counts.open_count or 0
    in_progress_count = counts.in_progress_count or 0
    resolved_count = counts.resolved_count or 0
    closed_count = counts.closed_count or 0

    active_in_flight = open_count + in_progress_count
    total_resolved = resolved_count + closed_count
    resolved_rate = f"{(total_resolved / total_tickets * 100):.1f}%" if total_tickets > 0 else "0.0%"

    # Dynamic SLA Health Calculation
    total_sla_tickets = db.query(Ticket).filter(Ticket.sla_due_date.isnot(None)).count()
    if total_sla_tickets > 0:
        breached_count = db.query(Ticket).filter(
            Ticket.sla_due_date < datetime.utcnow(),
            Ticket.status.notin_(["resolved", "closed"])
        ).count()
        sla_health_pct = max(0.0, ((total_sla_tickets - breached_count) / total_sla_tickets) * 100)
        sla_health = f"{sla_health_pct:.1f}%"
    else:
        sla_health = "100.0%"

    # Status Breakdown
    status_rows = (
        db.query(Ticket.status, func.count(Ticket.id).label("count"))
        .group_by(Ticket.status)
        .all()
    )
    status_breakdown = [
        {"status": (row.status or "UNKNOWN").upper(), "count": row.count} 
        for row in status_rows
    ]

    # Priority Breakdown
    priority_rows = (
        db.query(Ticket.priority, func.count(Ticket.id).label("count"))
        .group_by(Ticket.priority)
        .all()
    )
    priority_breakdown = [
        {"priority": (row.priority or "MEDIUM").upper(), "count": row.count} 
        for row in priority_rows
    ]

    return {
        "total_volume": total_tickets,
        "active_in_flight": active_in_flight,
        "resolved_rate": resolved_rate,
        "sla_health": sla_health,
        "status_breakdown": status_breakdown,
        "priority_breakdown": priority_breakdown
    }


# ============================================================
# INDIVIDUAL SUB-REPORTS
# ============================================================
@router.get("/tickets-summary")
def ticket_summary_report(db: Session = Depends(get_db), current_user=Depends(require_admin_manager)):
    counts = db.query(
        func.count(Ticket.id).label("total_tickets"),
        func.count(case((Ticket.status.ilike("open"), 1))).label("open_tickets"),
        func.count(case((Ticket.status.ilike("in_progress"), 1))).label("in_progress_tickets"),
        func.count(case((Ticket.status.ilike("resolved"), 1))).label("resolved_tickets"),
        func.count(case((Ticket.status.ilike("closed"), 1))).label("closed_tickets")
    ).first()

    return {
        "total_tickets": counts.total_tickets or 0,
        "open_tickets": counts.open_tickets or 0,
        "in_progress_tickets": counts.in_progress_tickets or 0,
        "resolved_tickets": counts.resolved_tickets or 0,
        "closed_tickets": counts.closed_tickets or 0
    }

@router.get("/user-activity")
def user_activity_report(db: Session = Depends(get_db), current_user=Depends(require_admin_manager)):
    result = (
        db.query(
            User.email.label("user_identifier"),
            func.count(Ticket.id).label("total_tickets")
        )
        .outerjoin(Ticket, User.id == Ticket.requester_id)
        .group_by(User.id, User.email)
        .all()
    )
    return [{"user": row.user_identifier, "total_tickets": row.total_tickets} for row in result]

@router.get("/priority-analysis")
def priority_analysis(db: Session = Depends(get_db), current_user=Depends(require_admin_manager)):
    result = (
        db.query(Ticket.priority, func.count(Ticket.id).label("count"))
        .group_by(Ticket.priority)
        .all()
    )
    return [{"priority": (row.priority or "UNKNOWN").upper(), "count": row.count} for row in result]

@router.get("/status-analysis")
def status_analysis(db: Session = Depends(get_db), current_user=Depends(require_admin_manager)):
    result = (
        db.query(Ticket.status, func.count(Ticket.id).label("count"))
        .group_by(Ticket.status)
        .all()
    )
    return [{"status": (row.status or "UNKNOWN").upper(), "count": row.count} for row in result]