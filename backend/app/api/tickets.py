from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.ticket import Ticket
from app.models.ticket_activity import TicketActivity
from app.models.user import User
from app.schemas.ticket import TicketCreate, TicketUpdate, TicketResponse
from app.core.dependencies import get_current_user, require_roles
from app.services.notification_service import create_notification
from app.services.slack_service import send_slack_message
from app.services.sla_service import calculate_sla_due, get_sla_status, get_remaining_minutes

router = APIRouter(prefix="/tickets", tags=["Tickets"])

ADMIN = 1
MANAGER = 2
TECHNICIAN = 3
EMPLOYEE = 4

def add_sla_details(ticket):
    if hasattr(ticket, 'sla_due_date') and ticket.sla_due_date:
        ticket.sla_due = ticket.sla_due_date
    
    if getattr(ticket, 'sla_due', None):
        ticket.sla_status = get_sla_status(ticket.sla_due, ticket.resolved_at, ticket.status)
        ticket.remaining_minutes = get_remaining_minutes(ticket.sla_due)
    else:
        ticket.sla_status = None
        ticket.remaining_minutes = None
    return ticket

@router.post("/", response_model=TicketResponse, status_code=status.HTTP_201_CREATED)
def create_ticket(
    ticket_data: TicketCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user_id = current_user.id
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    sla_due = calculate_sla_due(ticket_data.priority)

    ticket = Ticket(
        title=ticket_data.title,
        description=ticket_data.description,
        category=ticket_data.category,
        priority=ticket_data.priority,
        status="open",
        source="web",
        requester_id=user_id,
        sla_due=sla_due,
        sla_due_date=sla_due
    )

    db.add(ticket)
    db.commit()
    db.refresh(ticket)

    activity = TicketActivity(
        ticket_id=ticket.id,
        user_id=user_id,
        action="created",
        comment="Ticket created"
    )
    db.add(activity)

    create_notification(
        db=db,
        user_id=user_id,
        title="Ticket Created",
        message=f"Your ticket #{ticket.id} has been created",
        notification_type="Ticket"
    )

    db.commit()
    return add_sla_details(ticket)

@router.get("/", response_model=list[TicketResponse])
def get_tickets(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(ADMIN, MANAGER, TECHNICIAN))
):
    tickets = db.query(Ticket).order_by(Ticket.created_at.desc()).all()
    return [add_sla_details(ticket) for ticket in tickets]

@router.get("/my", response_model=list[TicketResponse])
def get_my_tickets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    tickets = db.query(Ticket).filter(Ticket.requester_id == current_user.id).order_by(Ticket.created_at.desc()).all()
    return [add_sla_details(ticket) for ticket in tickets]

@router.get("/assigned", response_model=list[TicketResponse])
def get_assigned_tickets(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(TECHNICIAN))
):
    tickets = db.query(Ticket).filter(Ticket.assignee_id == current_user.id).order_by(Ticket.created_at.desc()).all()
    return [add_sla_details(ticket) for ticket in tickets]

@router.get("/{ticket_id}/history")
def get_ticket_history(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user_id = current_user.id
    role_id = current_user.role_id

    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    if role_id == EMPLOYEE and ticket.requester_id != user_id:
        raise HTTPException(status_code=403, detail="Permission denied")
    if role_id == TECHNICIAN and ticket.assignee_id != user_id:
        raise HTTPException(status_code=403, detail="Permission denied")

    return db.query(TicketActivity).filter(TicketActivity.ticket_id == ticket_id).order_by(TicketActivity.created_at.asc()).all()

@router.get("/{ticket_id}", response_model=TicketResponse)
def get_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user_id = current_user.id
    role_id = current_user.role_id

    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    if role_id == EMPLOYEE and ticket.requester_id != user_id:
        raise HTTPException(status_code=403, detail="Permission denied")
    if role_id == TECHNICIAN and ticket.assignee_id != user_id:
        raise HTTPException(status_code=403, detail="Permission denied")

    return add_sla_details(ticket)

@router.patch("/{ticket_id}", response_model=TicketResponse)
def update_ticket(
    ticket_id: int,
    ticket_data: TicketUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(ADMIN, MANAGER, TECHNICIAN))
):
    user_id = current_user.id
    role_id = current_user.role_id

    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    if role_id == TECHNICIAN and ticket.assignee_id != user_id:
        raise HTTPException(status_code=403, detail="Permission denied")

    changes = []
    status_changed = False
    priority_changed = False
    assignment_happened = False
    agent = None

    if ticket_data.status is not None:
        old_status = ticket.status
        if old_status != ticket_data.status:
            ticket.status = ticket_data.status
            status_changed = True
            changes.append(f"Status changed from {old_status} to {ticket.status}")

            if ticket.status == "resolved":
                ticket.resolved_at = datetime.now(timezone.utc)
            elif ticket.status in ["open", "in_progress"]:
                ticket.resolved_at = None

    if ticket_data.priority is not None:
        old_priority = ticket.priority
        if old_priority != ticket_data.priority:
            ticket.priority = ticket_data.priority
            priority_changed = True
            new_sla = calculate_sla_due(ticket.priority)
            ticket.sla_due = new_sla
            ticket.sla_due_date = new_sla
            changes.append(f"Priority changed from {old_priority} to {ticket.priority}")

    if ticket_data.assignee_id is not None:
        if role_id not in [ADMIN, MANAGER]:
            raise HTTPException(status_code=403, detail="Only Admin or Manager can assign tickets")

        agent = db.query(User).filter(User.id == ticket_data.assignee_id).first()
        if not agent or agent.role_id != TECHNICIAN:
            raise HTTPException(status_code=400, detail="Invalid Technician assignment")

        if ticket.assignee_id != ticket_data.assignee_id:
            ticket.assignee_id = ticket_data.assignee_id
            assignment_happened = True
            changes.append(f"Assigned to technician {agent.username}")

    if ticket_data.comment:
        changes.append(f"Comment: {ticket_data.comment}")

    if changes:
        activity = TicketActivity(
            ticket_id=ticket.id,
            user_id=user_id,
            action="updated",
            comment=" | ".join(changes)
        )
        db.add(activity)

        create_notification(
            db=db,
            user_id=ticket.requester_id,
            title="Ticket Updated",
            message=f"Your ticket #{ticket.id} has been updated",
            notification_type="Ticket"
        )

    if assignment_happened:
        create_notification(
            db=db,
            user_id=ticket.assignee_id,
            title="Ticket Assigned",
            message=f"Ticket #{ticket.id} has been assigned to you.",
            notification_type="Ticket"
        )

    db.commit()
    db.refresh(ticket)

    updater = db.query(User).filter(User.id == user_id).first()
    updater_name = updater.username if updater else "Unknown"

    if assignment_happened:
        send_slack_message(f"🎫 *Ticket Assigned*\nID: #{ticket.id}\nTitle: {ticket.title}\nAssigned To: {agent.username}")
    if status_changed:
        send_slack_message(f"🎫 *Status Updated*\nID: #{ticket.id}\nTitle: {ticket.title}\nStatus: {ticket.status}\nBy: {updater_name}")
    if priority_changed:
        send_slack_message(f"🎫 *Priority Updated*\nID: #{ticket.id}\nTitle: {ticket.title}\nPriority: {ticket.priority}\nBy: {updater_name}")

    return add_sla_details(ticket)