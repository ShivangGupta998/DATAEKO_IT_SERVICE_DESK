from sqlalchemy.orm import Session
from sqlalchemy import func, case
from app.models.ticket import Ticket
from app.models.user import User


def calculate_workload_metrics(db: Session) -> list[dict]:
    """
    Calculates workload metrics per agent / technician:
    - total_assigned: total count of assigned tickets
    - resolved_tickets: count of resolved/closed tickets (case-insensitive)
    - pending_queue: count of active/pending tickets not resolved/closed
    """
    workload_rows = (
        db.query(
            User.id.label("user_id"),
            User.username.label("username"),
            User.email.label("email"),
            User.full_name.label("full_name"),
            func.count(Ticket.id).label("total_assigned"),
            func.count(
                case(
                    (func.lower(Ticket.status).in_(["resolved", "closed"]), Ticket.id),
                    else_=None
                )
            ).label("resolved_tickets"),
            func.count(
                case(
                    (~func.lower(Ticket.status).in_(["resolved", "closed"]), Ticket.id),
                    else_=None
                )
            ).label("pending_queue")
        )
        .outerjoin(Ticket, User.id == Ticket.assignee_id)
        .filter((User.role_id.in_([1, 2, 3])) | (Ticket.id.isnot(None)))
        .group_by(User.id, User.username, User.email, User.full_name)
        .order_by(User.id.asc())
        .all()
    )

    metrics = [
        {
            "id": row.user_id,
            "user_id": row.user_id,
            "user": row.full_name or row.username or row.email or f"User #{row.user_id}",
            "agent_name": row.full_name or row.username or row.email or f"User #{row.user_id}",
            "username": row.username or row.email or f"User #{row.user_id}",
            "email": row.email,
            "full_name": row.full_name,
            "total_assigned": row.total_assigned or 0,
            "total_tickets": row.total_assigned or 0,
            "assigned_count": row.total_assigned or 0,
            "tickets_assigned": row.total_assigned or 0,
            "resolved_tickets": row.resolved_tickets or 0,
            "resolved_count": row.resolved_tickets or 0,
            "tickets_resolved": row.resolved_tickets or 0,
            "pending_queue": row.pending_queue or 0,
        }
        for row in workload_rows
    ]

    # Include unassigned tickets row if any exist
    unassigned_row = (
        db.query(
            func.count(Ticket.id).label("total_assigned"),
            func.count(
                case(
                    (func.lower(Ticket.status).in_(["resolved", "closed"]), Ticket.id),
                    else_=None
                )
            ).label("resolved_tickets"),
            func.count(
                case(
                    (~func.lower(Ticket.status).in_(["resolved", "closed"]), Ticket.id),
                    else_=None
                )
            ).label("pending_queue")
        )
        .filter(Ticket.assignee_id.is_(None))
        .first()
    )

    if unassigned_row and (unassigned_row.total_assigned or 0) > 0:
        metrics.append({
            "id": "unassigned",
            "user_id": None,
            "user": "Unassigned / Direct Resolution",
            "agent_name": "Unassigned / Direct Resolution",
            "username": "Unassigned",
            "email": None,
            "full_name": "Unassigned / Direct Resolution",
            "total_assigned": unassigned_row.total_assigned or 0,
            "total_tickets": unassigned_row.total_assigned or 0,
            "assigned_count": unassigned_row.total_assigned or 0,
            "tickets_assigned": unassigned_row.total_assigned or 0,
            "resolved_tickets": unassigned_row.resolved_tickets or 0,
            "resolved_count": unassigned_row.resolved_tickets or 0,
            "tickets_resolved": unassigned_row.resolved_tickets or 0,
            "pending_queue": unassigned_row.pending_queue or 0,
        })

    return metrics
