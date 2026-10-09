from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.ticket import Ticket
from app.models.user import User
from app.models.role import Role
from app.models.ticket_activity import TicketActivity
from app.services.slack_service import send_ticket_assigned_notification

TECHNICIAN_ROLE_ID = 3

def auto_assign_stale_tickets(db: Session):
    """Auto-assigns unassigned tickets ONLY to registered Technicians (role_id=3) and records audit trail."""
    # 1. Fetch unassigned tickets
    stale_tickets = db.query(Ticket).filter(
        (Ticket.assignee_id == None) | (Ticket.assignee_id == 0),
        func.lower(Ticket.status).in_(["open", "unassigned", "pending", "new"])
    ).all()

    if not stale_tickets:
        return

    # 2. Query technicians strictly using role_id = 3 (Technician)
    tech_users = db.query(User).filter(
        User.is_active == True,
        User.role_id == TECHNICIAN_ROLE_ID,
        ~func.lower(User.username).in_(["abhi", "admin"])
    ).all()

    # Fallback: Check Role model by name if numeric role_id isn't directly assigned
    if not tech_users:
        tech_users = db.query(User).join(Role).filter(
            User.is_active == True,
            func.lower(Role.name).contains("tech"),
            ~func.lower(Role.name).contains("admin"),
            ~func.lower(User.username).in_(["abhi", "admin"])
        ).all()

    if not tech_users:
        print("--> AUTO-ASSIGN WARNING: No active technicians (role_id=3) found.")
        return

    # 3. Assign ticket to the least busy technician & write audit log
    for ticket in stale_tickets:
        user_workloads = []
        for user in tech_users:
            active_count = db.query(Ticket).filter(
                Ticket.assignee_id == user.id,
                func.lower(Ticket.status).in_(["open", "in_progress"])
            ).count()
            user_workloads.append((user, active_count))

        user_workloads.sort(key=lambda x: x[1])
        least_busy_tech = user_workloads[0][0]

        ticket.assignee_id = least_busy_tech.id
        ticket.status = "in_progress"

        # Create activity matching tickets.py schema (action="updated")
        activity = TicketActivity(
            ticket_id=ticket.id,
            user_id=least_busy_tech.id,
            action="updated",
            comment=f"Assigned to technician {least_busy_tech.username}"
        )
        db.add(activity)
        db.add(ticket)

        # Notify via Slack Direct Message (DM)
        send_ticket_assigned_notification(ticket, least_busy_tech.username, db=db)

        print(f"--> [AUTO-ASSIGN SUCCESS] Ticket #{ticket.id} assigned to technician '{least_busy_tech.username}'")

    db.commit()