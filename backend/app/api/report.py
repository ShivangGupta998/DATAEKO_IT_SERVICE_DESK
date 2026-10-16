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

    # Agent / Technician Workload Breakdown
    technicians = db.query(User).filter(User.role_id == 3).all()
    agent_performance = []
    
    for tech in technicians:
        total_assigned = db.query(Ticket).filter(Ticket.assignee_id == tech.id).count()
        resolved_tickets = db.query(Ticket).filter(
            Ticket.assignee_id == tech.id,
            Ticket.status.in_(["resolved", "closed"])
        ).count()
        pending_queue = db.query(Ticket).filter(
            Ticket.assignee_id == tech.id,
            Ticket.status.in_(["open", "in_progress"])
        ).count()

        agent_performance.append({
            "id": tech.id,
            "user_id": tech.id,
            "agent_name": tech.username or f"User #{tech.id}",
            "username": tech.username or f"User #{tech.id}",
            "total_assigned": total_assigned,
            "resolved_tickets": resolved_tickets,
            "pending_queue": pending_queue
        })

    # CSAT Satisfaction Calculation
    csat_agg = db.query(
        func.count(Ticket.id).label("total_csat"),
        func.avg(Ticket.csat_rating).label("avg_csat"),
        func.count(case((Ticket.csat_rating >= 4, 1))).label("positive_csat")
    ).filter(Ticket.csat_rating.isnot(None)).first()

    total_csat = csat_agg.total_csat if csat_agg else 0
    avg_csat = round(float(csat_agg.avg_csat), 2) if csat_agg and csat_agg.avg_csat is not None else 0.0
    positive_csat = csat_agg.positive_csat if csat_agg else 0
    satisfaction_rate = round((positive_csat / total_csat * 100), 1) if total_csat > 0 else 0.0

    return {
        "total_volume": total_tickets,
        "active_in_flight": active_in_flight,
        "resolved_rate": resolved_rate,
        "sla_health": sla_health,
        "average_csat": avg_csat,
        "total_csat": total_csat,
        "satisfaction_rate": satisfaction_rate,
        "status_breakdown": status_breakdown,
        "priority_breakdown": priority_breakdown,
        "agent_performance": agent_performance,
        "technicians": agent_performance
    }


# ============================================================
# INDIVIDUAL SUB-REPORTS
# ============================================================
@router.get("/csat-analysis")
def csat_analysis_report(
    db: Session = Depends(get_db),
    current_user=Depends(require_admin_manager)
):
    csat_agg = db.query(
        func.count(Ticket.id).label("total_csat"),
        func.avg(Ticket.csat_rating).label("avg_csat"),
        func.count(case((Ticket.csat_rating >= 4, 1))).label("positive_csat")
    ).filter(Ticket.csat_rating.isnot(None)).first()

    total_csat = csat_agg.total_csat if csat_agg else 0
    avg_csat = round(float(csat_agg.avg_csat), 2) if csat_agg and csat_agg.avg_csat is not None else 0.0
    positive_csat = csat_agg.positive_csat if csat_agg else 0
    satisfaction_rate = round((positive_csat / total_csat * 100), 1) if total_csat > 0 else 0.0

    breakdown_rows = (
        db.query(Ticket.csat_rating, func.count(Ticket.id).label("count"))
        .filter(Ticket.csat_rating.isnot(None))
        .group_by(Ticket.csat_rating)
        .order_by(Ticket.csat_rating.asc())
        .all()
    )
    breakdown_map = {row.csat_rating: row.count for row in breakdown_rows}
    rating_breakdown = [
        {"stars": stars, "count": breakdown_map.get(stars, 0), "label": f"{stars} Stars"}
        for stars in range(1, 6)
    ]

    recent_feedback_rows = (
        db.query(Ticket)
        .filter(Ticket.csat_rating.isnot(None))
        .order_by(Ticket.csat_submitted_at.desc())
        .limit(8)
        .all()
    )
    recent_feedback = [
        {
            "ticket_id": t.id,
            "title": t.title,
            "rating": t.csat_rating,
            "feedback": t.csat_feedback,
            "submitted_at": t.csat_submitted_at.isoformat() if t.csat_submitted_at else None,
            "requester_name": getattr(t.requester, "full_name", None) or getattr(t.requester, "username", "Unknown") if t.requester else "Unknown",
            "assignee_name": getattr(t.assignee, "full_name", None) or getattr(t.assignee, "username", "Unassigned") if t.assignee else "Unassigned"
        }
        for t in recent_feedback_rows
    ]

    return {
        "average_csat": avg_csat,
        "total_responses": total_csat,
        "satisfaction_rate": satisfaction_rate,
        "rating_breakdown": rating_breakdown,
        "recent_feedback": recent_feedback
    }


@router.get("/technician-workload")
def get_technician_workload(
    db: Session = Depends(get_db),
    current_user=Depends(require_admin_manager)
):
    technicians = db.query(User).filter(User.role_id == 3).all()
    result = []
    for tech in technicians:
        total_assigned = db.query(Ticket).filter(Ticket.assignee_id == tech.id).count()
        resolved_tickets = db.query(Ticket).filter(
            Ticket.assignee_id == tech.id,
            Ticket.status.in_(["resolved", "closed"])
        ).count()
        pending_queue = db.query(Ticket).filter(
            Ticket.assignee_id == tech.id,
            Ticket.status.in_(["open", "in_progress"])
        ).count()

        result.append({
            "id": tech.id,
            "user_id": tech.id,
            "agent_name": tech.username or f"User #{tech.id}",
            "username": tech.username or f"User #{tech.id}",
            "total_assigned": total_assigned,
            "resolved_tickets": resolved_tickets,
            "pending_queue": pending_queue
        })
    return result

@router.get("/tickets-summary")
def ticket_summary_report(db: Session = Depends(get_db), current_user=Depends(require_admin_manager)):
    counts = db.query(
        func.count(Ticket.id).label("total_tickets"),
        func.count(case((Ticket.status.ilike("open"), 1))).label("open_tickets"),
        func.count(case((Ticket.status.ilike("in_progress"), 1))).label("in_progress_tickets"),
        func.count(case((Ticket.status.ilike("resolved"), 1))).label("resolved_tickets"),
        func.count(case((Ticket.status.ilike("closed"), 1))).label("closed_tickets")
    ).first()

    csat_agg = db.query(
        func.count(Ticket.id).label("total_csat"),
        func.avg(Ticket.csat_rating).label("avg_csat")
    ).filter(Ticket.csat_rating.isnot(None)).first()

    avg_csat = round(float(csat_agg.avg_csat), 2) if csat_agg and csat_agg.avg_csat is not None else 0.0
    total_csat = csat_agg.total_csat if csat_agg else 0

    return {
        "total_tickets": counts.total_tickets or 0,
        "open_tickets": counts.open_tickets or 0,
        "in_progress_tickets": counts.in_progress_tickets or 0,
        "resolved_tickets": counts.resolved_tickets or 0,
        "closed_tickets": counts.closed_tickets or 0,
        "average_csat": avg_csat,
        "total_csat": total_csat
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