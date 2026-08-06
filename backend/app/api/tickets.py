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

from app.services.slack_service import send_slack_message


router = APIRouter(
    prefix="/tickets",
    tags=["Tickets"]
)


# ============================================================
# ROLE IDs
# ============================================================

ADMIN = 1
MANAGER = 2
TECHNICIAN = 3
EMPLOYEE = 4


# ============================================================
# CREATE TICKET
# ALL AUTHENTICATED USERS
# ============================================================

@router.post(
    "/",
    response_model=TicketResponse,
    status_code=status.HTTP_201_CREATED
)
def create_ticket(
    ticket_data: TicketCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):

    user_id = current_user["user_id"]

    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Logged-in user not found"
        )

    ticket = Ticket(
        title=ticket_data.title,
        description=ticket_data.description,
        category=ticket_data.category,
        priority=ticket_data.priority,
        status="open",
        source="web",
        requester_id=user_id
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
    db.commit()

    return ticket


# ============================================================
# GET ALL TICKETS
# ADMIN / MANAGER / TECHNICIAN ONLY
# ============================================================

@router.get(
    "/",
    response_model=list[TicketResponse]
)
def get_tickets(
    db: Session = Depends(get_db),
    current_user: dict = Depends(
        require_roles(
            ADMIN,
            MANAGER,
            TECHNICIAN
        )
    )
):

    tickets = (
        db.query(Ticket)
        .order_by(
            Ticket.created_at.desc()
        )
        .all()
    )

    return tickets


# ============================================================
# GET MY TICKETS
# ALL AUTHENTICATED USERS
# ============================================================

@router.get(
    "/my",
    response_model=list[TicketResponse]
)
def get_my_tickets(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):

    user_id = current_user["user_id"]

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

    return tickets


# ============================================================
# GET ASSIGNED TICKETS
# TECHNICIAN ONLY
# ============================================================

@router.get(
    "/assigned",
    response_model=list[TicketResponse]
)
def get_assigned_tickets(
    db: Session = Depends(get_db),
    current_user: dict = Depends(
        require_roles(TECHNICIAN)
    )
):

    user_id = current_user["user_id"]

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

    return tickets


# ============================================================
# GET SINGLE TICKET
# ALL AUTHENTICATED USERS
# ============================================================

@router.get(
    "/{ticket_id}",
    response_model=TicketResponse
)
def get_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):

    user_id = current_user["user_id"]
    role_id = current_user["role_id"]

    ticket = (
        db.query(Ticket)
        .filter(
            Ticket.id == ticket_id
        )
        .first()
    )

    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found"
        )

    # Employees can only view their own tickets
    if role_id == EMPLOYEE:

        if ticket.requester_id != user_id:

            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only view your own tickets"
            )

    return ticket


# ============================================================
# UPDATE TICKET
# ADMIN / MANAGER / TECHNICIAN ONLY
# ============================================================

@router.patch(
    "/{ticket_id}",
    response_model=TicketResponse
)
def update_ticket(
    ticket_id: int,
    ticket_data: TicketUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(
        require_roles(
            ADMIN,
            MANAGER,
            TECHNICIAN
        )
    )
):

    user_id = current_user["user_id"]
    role_id = current_user["role_id"]

    # ========================================================
    # FIND TICKET
    # ========================================================

    ticket = (
        db.query(Ticket)
        .filter(
            Ticket.id == ticket_id
        )
        .first()
    )

    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found"
        )

    # ========================================================
    # TECHNICIAN OWNERSHIP CHECK
    # ========================================================

    if role_id == TECHNICIAN:

        if ticket.assignee_id != user_id:

            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "Technician can only update "
                    "tickets assigned to them"
                )
            )

    # ========================================================
    # TRACK CHANGES
    # ========================================================

    changes = []

    status_changed = False
    priority_changed = False
    assignment_happened = False

    # ========================================================
    # STATUS
    # ========================================================

    if ticket_data.status is not None:

        old_status = ticket.status

        if old_status != ticket_data.status:

            ticket.status = ticket_data.status

            status_changed = True

            changes.append(
                f"Status changed from "
                f"{old_status} to "
                f"{ticket_data.status}"
            )

    # ========================================================
    # PRIORITY
    # ========================================================

    if ticket_data.priority is not None:

        old_priority = ticket.priority

        if old_priority != ticket_data.priority:

            ticket.priority = ticket_data.priority

            priority_changed = True

            changes.append(
                f"Priority changed from "
                f"{old_priority} to "
                f"{ticket_data.priority}"
            )

    # ========================================================
    # ASSIGN TICKET
    # ADMIN / MANAGER ONLY
    # ========================================================

    agent = None

    if ticket_data.assignee_id is not None:

        if role_id not in [
            ADMIN,
            MANAGER
        ]:

            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "Only Admin or Manager "
                    "can assign tickets"
                )
            )

        # ----------------------------------------------------
        # FIND ASSIGNEE
        # ----------------------------------------------------

        agent = (
            db.query(User)
            .filter(
                User.id == ticket_data.assignee_id
            )
            .first()
        )

        if not agent:

            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assignee not found"
            )

        # ----------------------------------------------------
        # VERIFY ASSIGNEE IS TECHNICIAN
        # ----------------------------------------------------

        if agent.role_id != TECHNICIAN:

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Tickets can only be assigned "
                    "to Technicians"
                )
            )

        old_assignee = ticket.assignee_id

        if old_assignee != ticket_data.assignee_id:

            ticket.assignee_id = ticket_data.assignee_id

            assignment_happened = True

            changes.append(
                f"Ticket assigned from "
                f"{old_assignee} to "
                f"{ticket_data.assignee_id}"
            )

    # ========================================================
    # COMMENT
    # ========================================================

    if ticket_data.comment:

        changes.append(
            f"Comment: {ticket_data.comment}"
        )

    # ========================================================
    # SAVE TICKET
    # ========================================================

    db.commit()
    db.refresh(ticket)

    # ========================================================
    # SAVE ACTIVITY HISTORY
    # ========================================================

    if changes:

        activity = TicketActivity(
            ticket_id=ticket.id,
            user_id=user_id,
            action="updated",
            comment=" | ".join(changes)
        )

        db.add(activity)
        db.commit()

    # ========================================================
    # FIND CURRENT USER
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
        else "Unknown User"
    )

    # ========================================================
    # SLACK NOTIFICATION
    # ASSIGNMENT
    # ========================================================

    if assignment_happened:

        technician_name = (
            agent.username
            if agent
            else "Unknown Technician"
        )

        slack_message = (
            "🎫 *New Ticket Assigned*\n\n"
            f"*Ticket ID:* #{ticket.id}\n"
            f"*Title:* {ticket.title}\n"
            f"*Priority:* {ticket.priority}\n"
            f"*Status:* {ticket.status}\n"
            f"*Assigned To:* {technician_name}\n\n"
            "Please check the IT Service Desk."
        )

        success = send_slack_message(
            slack_message
        )

        if success:

            print(
                f"Slack assignment notification "
                f"sent for ticket #{ticket.id}"
            )

        else:

            print(
                f"Slack assignment notification "
                f"failed for ticket #{ticket.id}"
            )

    # ========================================================
    # SLACK NOTIFICATION
    # STATUS UPDATE
    # ========================================================

    if status_changed:

        slack_message = (
            "🎫 *Ticket Status Updated*\n\n"
            f"*Ticket ID:* #{ticket.id}\n"
            f"*Title:* {ticket.title}\n"
            f"*Status:* {ticket.status}\n"
            f"*Priority:* {ticket.priority}\n"
            f"*Updated By:* {updater_name}\n\n"
            "Please check the IT Service Desk."
        )

        success = send_slack_message(
            slack_message
        )

        if success:

            print(
                f"Slack status notification "
                f"sent for ticket #{ticket.id}"
            )

        else:

            print(
                f"Slack status notification "
                f"failed for ticket #{ticket.id}"
            )

    # ========================================================
    # SLACK NOTIFICATION
    # PRIORITY UPDATE
    # ========================================================

    if priority_changed:

        slack_message = (
            "🎫 *Ticket Priority Updated*\n\n"
            f"*Ticket ID:* #{ticket.id}\n"
            f"*Title:* {ticket.title}\n"
            f"*Priority:* {ticket.priority}\n"
            f"*Status:* {ticket.status}\n"
            f"*Updated By:* {updater_name}\n\n"
            "Please check the IT Service Desk."
        )

        success = send_slack_message(
            slack_message
        )

        if success:

            print(
                f"Slack priority notification "
                f"sent for ticket #{ticket.id}"
            )

        else:

            print(
                f"Slack priority notification "
                f"failed for ticket #{ticket.id}"
            )

    return ticket


# ============================================================
# GET TICKET HISTORY
# ============================================================

@router.get(
    "/{ticket_id}/history"
)
def get_ticket_history(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):

    user_id = current_user["user_id"]
    role_id = current_user["role_id"]

    # ========================================================
    # FIND TICKET
    # ========================================================

    ticket = (
        db.query(Ticket)
        .filter(
            Ticket.id == ticket_id
        )
        .first()
    )

    if not ticket:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found"
        )

    # ========================================================
    # EMPLOYEE ACCESS CONTROL
    # ========================================================

    if role_id == EMPLOYEE:

        if ticket.requester_id != user_id:

            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "You can only view "
                    "history of your own tickets"
                )
            )

    # ========================================================
    # GET ACTIVITIES
    # ========================================================

    activities = (
        db.query(TicketActivity)
        .filter(
            TicketActivity.ticket_id ==
            ticket_id
        )
        .order_by(
            TicketActivity.created_at.asc()
        )
        .all()
    )

    return activities