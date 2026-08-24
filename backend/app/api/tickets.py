from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.database import get_db

from app.models.ticket import Ticket
from app.models.ticket_activity import TicketActivity
from app.models.user import User

from app.schemas.ticket import (
    TicketCreate,
    TicketUpdate,
    TicketResponse
)

from app.core.dependencies import (
    get_current_user,
    require_roles
)

from app.services.notification_service import (
    create_notification
)

from app.services.slack_service import (
    send_slack_message
)

from app.services.sla_service import (
    calculate_sla_due,
    get_sla_status,
    get_remaining_minutes
)


router = APIRouter(
    prefix="/tickets",
    tags=["Tickets"]
)


# ============================================================
# ROLE IDS
# ============================================================

ADMIN = 1
MANAGER = 2
TECHNICIAN = 3
EMPLOYEE = 4


# ============================================================
# SLA HELPER
# ============================================================

def add_sla_details(ticket):

    if ticket.sla_due:

        ticket.sla_status = get_sla_status(
            ticket.sla_due,
            ticket.resolved_at
        )

        ticket.remaining_minutes = get_remaining_minutes(
            ticket.sla_due
        )

    else:

        ticket.sla_status = None
        ticket.remaining_minutes = None

    return ticket


# ============================================================
# CREATE TICKET
# ============================================================

@router.post(
    "/",
    response_model=TicketResponse,
    status_code=status.HTTP_201_CREATED
)
def create_ticket(
    ticket_data: TicketCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user_id = current_user.id

    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    sla_due = calculate_sla_due(
        ticket_data.priority
    )

    ticket = Ticket(
        title=ticket_data.title,
        description=ticket_data.description,
        category=ticket_data.category,
        priority=ticket_data.priority,
        status="open",
        source="web",
        requester_id=user_id,
        sla_due=sla_due
    )

    db.add(ticket)
    db.commit()
    db.refresh(ticket)

    # Activity
    activity = TicketActivity(
        ticket_id=ticket.id,
        user_id=user_id,
        action="created",
        comment="Ticket created"
    )

    db.add(activity)

    # Notification to ticket creator
    create_notification(
        db=db,
        user_id=user_id,
        title="Ticket Created",
        message=f"Your ticket #{ticket.id} has been created",
        notification_type="Ticket"
    )

    db.commit()

    return add_sla_details(ticket)


# ============================================================
# GET ALL TICKETS
# ADMIN / MANAGER / TECHNICIAN
# ============================================================

@router.get(
    "/",
    response_model=list[TicketResponse]
)
def get_tickets(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            ADMIN,
            MANAGER,
            TECHNICIAN
        )
    )
):
    tickets = (
        db.query(Ticket)
        .order_by(Ticket.created_at.desc())
        .all()
    )

    return [
        add_sla_details(ticket)
        for ticket in tickets
    ]


# ============================================================
# GET MY TICKETS
# EMPLOYEE
# ============================================================

@router.get(
    "/my",
    response_model=list[TicketResponse]
)
def get_my_tickets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user_id = current_user.id

    tickets = (
        db.query(Ticket)
        .filter(
            Ticket.requester_id == user_id
        )
        .order_by(
            Ticket.created_at.desc()
        )
        .all()
    )

    return [
        add_sla_details(ticket)
        for ticket in tickets
    ]


# ============================================================
# GET ASSIGNED TICKETS
# TECHNICIAN
# ============================================================

@router.get(
    "/assigned",
    response_model=list[TicketResponse]
)
def get_assigned_tickets(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(TECHNICIAN)
    )
):
    user_id = current_user.id

    tickets = (
        db.query(Ticket)
        .filter(
            Ticket.assignee_id == user_id
        )
        .order_by(
            Ticket.created_at.desc()
        )
        .all()
    )

    return [
        add_sla_details(ticket)
        for ticket in tickets
    ]


# ============================================================
# GET TICKET HISTORY
# ============================================================

@router.get(
    "/{ticket_id}/history"
)
def get_ticket_history(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user_id = current_user.id
    role_id = current_user.role_id

    ticket = (
        db.query(Ticket)
        .filter(
            Ticket.id == ticket_id
        )
        .first()
    )

    if not ticket:
        raise HTTPException(
            status_code=404,
            detail="Ticket not found"
        )

    # Employee can only see own history
    if role_id == EMPLOYEE:
        if ticket.requester_id != user_id:
            raise HTTPException(
                status_code=403,
                detail="You can only view your own ticket history"
            )

    # Technician can only see assigned history
    if role_id == TECHNICIAN:
        if ticket.assignee_id != user_id:
            raise HTTPException(
                status_code=403,
                detail="You can only view assigned ticket history"
            )

    activities = (
        db.query(TicketActivity)
        .filter(
            TicketActivity.ticket_id == ticket_id
        )
        .order_by(
            TicketActivity.created_at.asc()
        )
        .all()
    )

    return activities


# ============================================================
# GET SINGLE TICKET
# ============================================================

@router.get(
    "/{ticket_id}",
    response_model=TicketResponse
)
def get_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user_id = current_user.id
    role_id = current_user.role_id

    ticket = (
        db.query(Ticket)
        .filter(
            Ticket.id == ticket_id
        )
        .first()
    )

    if not ticket:
        raise HTTPException(
            status_code=404,
            detail="Ticket not found"
        )

    # Employee access
    if role_id == EMPLOYEE:
        if ticket.requester_id != user_id:
            raise HTTPException(
                status_code=403,
                detail="You can only view your own tickets"
            )

    # Technician access
    if role_id == TECHNICIAN:
        if ticket.assignee_id != user_id:
            raise HTTPException(
                status_code=403,
                detail="You can only view assigned tickets"
            )

    return add_sla_details(ticket)


# ============================================================
# UPDATE TICKET
# ADMIN / MANAGER / TECHNICIAN
# ============================================================

@router.patch(
    "/{ticket_id}",
    response_model=TicketResponse
)
def update_ticket(
    ticket_id: int,
    ticket_data: TicketUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            ADMIN,
            MANAGER,
            TECHNICIAN
        )
    )
):
    user_id = current_user.id
    role_id = current_user.role_id

    # --------------------------------------------------------
    # FIND TICKET
    # --------------------------------------------------------

    ticket = (
        db.query(Ticket)
        .filter(
            Ticket.id == ticket_id
        )
        .first()
    )

    if not ticket:
        raise HTTPException(
            status_code=404,
            detail="Ticket not found"
        )

    # --------------------------------------------------------
    # TECHNICIAN OWNERSHIP CHECK
    # --------------------------------------------------------

    if role_id == TECHNICIAN:
        if ticket.assignee_id != user_id:
            raise HTTPException(
                status_code=403,
                detail="Technician can only update assigned tickets"
            )

    # --------------------------------------------------------
    # TRACK CHANGES
    # --------------------------------------------------------

    changes = []

    status_changed = False
    priority_changed = False
    assignment_happened = False

    agent = None

    # ========================================================
    # STATUS UPDATE
    # ========================================================

    if ticket_data.status is not None:
        old_status = ticket.status

        if old_status != ticket_data.status:
            ticket.status = ticket_data.status
            status_changed = True

            changes.append(
                f"Status changed from {old_status} to {ticket.status}"
            )

            if ticket.status == "resolved":
                ticket.resolved_at = datetime.now(
                    timezone.utc
                )
            elif ticket.status in [
                "open",
                "in_progress"
            ]:
                ticket.resolved_at = None

    # ========================================================
    # PRIORITY UPDATE
    # ========================================================

    if ticket_data.priority is not None:
        old_priority = ticket.priority

        if old_priority != ticket_data.priority:
            ticket.priority = ticket_data.priority
            priority_changed = True

            ticket.sla_due = calculate_sla_due(
                ticket.priority
            )

            changes.append(
                f"Priority changed from "
                f"{old_priority} to {ticket.priority}"
            )

    # ========================================================
    # ASSIGN TECHNICIAN
    # ========================================================

    if ticket_data.assignee_id is not None:
        # Only Admin / Manager can assign
        if role_id not in [
            ADMIN,
            MANAGER
        ]:
            raise HTTPException(
                status_code=403,
                detail="Only Admin or Manager can assign tickets"
            )

        agent = (
            db.query(User)
            .filter(
                User.id == ticket_data.assignee_id
            )
            .first()
        )

        if not agent:
            raise HTTPException(
                status_code=404,
                detail="Technician not found"
            )

        # Must be technician
        if agent.role_id != TECHNICIAN:
            raise HTTPException(
                status_code=400,
                detail="Ticket can only be assigned to Technician"
            )

        # Check if assignment actually changed
        if ticket.assignee_id != ticket_data.assignee_id:
            ticket.assignee_id = ticket_data.assignee_id
            assignment_happened = True

            changes.append(
                f"Assigned to technician {agent.username}"
            )

    # ========================================================
    # COMMENT
    # ========================================================

    if ticket_data.comment:
        changes.append(
            f"Comment: {ticket_data.comment}"
        )

    # ========================================================
    # ACTIVITY LOG
    # ========================================================

    if changes:
        activity = TicketActivity(
            ticket_id=ticket.id,
            user_id=user_id,
            action="updated",
            comment=" | ".join(changes)
        )

        db.add(activity)

    # ========================================================
    # NOTIFY TICKET REQUESTER
    # ========================================================

    if changes:
        create_notification(
            db=db,
            user_id=ticket.requester_id,
            title="Ticket Updated",
            message=f"Your ticket #{ticket.id} has been updated",
            notification_type="Ticket"
        )

    # ========================================================
    # NOTIFY TECHNICIAN
    # ========================================================

    if assignment_happened:
        create_notification(
            db=db,
            user_id=ticket.assignee_id,
            title="Ticket Assigned",
            message=f"Ticket #{ticket.id} has been assigned to you.",
            notification_type="Ticket"
        )

    # ========================================================
    # SAVE DATABASE CHANGES
    # ========================================================

    db.commit()
    db.refresh(ticket)

    # ========================================================
    # UPDATED USER
    # ========================================================

    updater = (
        db.query(User)
        .filter(
            User.id == user_id
        )
        .first()
    )

    updater_name = (
        updater.username
        if updater
        else "Unknown"
    )

    # ========================================================
    # SLACK - ASSIGNMENT
    # ========================================================

    if assignment_happened:
        send_slack_message(
            f"""
🎫 *Ticket Assigned*

Ticket ID: #{ticket.id}

Title: {ticket.title}

Priority: {ticket.priority}

Assigned To: {agent.username}

Status: {ticket.status}

Please check IT Service Desk.
"""
        )

    # ========================================================
    # SLACK - STATUS
    # ========================================================

    if status_changed:
        send_slack_message(
            f"""
🎫 *Ticket Status Updated*

Ticket ID: #{ticket.id}

Title: {ticket.title}

Status: {ticket.status}

Updated By: {updater_name}

Please check IT Service Desk.
"""
        )

    # ========================================================
    # SLACK - PRIORITY
    # ========================================================

    if priority_changed:
        send_slack_message(
            f"""
🎫 *Ticket Priority Updated*

Ticket ID: #{ticket.id}

Title: {ticket.title}

Priority: {ticket.priority}

Updated By: {updater_name}

Please check IT Service Desk.
"""
        )

    return add_sla_details(ticket)