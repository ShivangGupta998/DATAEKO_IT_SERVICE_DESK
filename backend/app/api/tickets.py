import os
import uuid
import json
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, UploadFile, File
from pydantic import BaseModel
from sqlalchemy.orm import Session, joinedload

from app.database.database import get_db
from app.models.ticket import Ticket
from app.models.ticket_activity import TicketActivity
from app.models.user import User
from app.schemas.ticket import TicketCreate, TicketUpdate, TicketResponse, TicketCsatSubmit
from app.core.dependencies import get_current_user, require_roles
from app.services.notification_service import create_notification
from app.services.slack_service import (
    send_ticket_created_notification,
    send_ticket_assigned_notification,
    send_ticket_priority_notification,
    send_ticket_status_notification,
)
from app.services.sla_service import calculate_sla_due, get_sla_status, get_remaining_minutes
from app.core.sockets import notification_manager

router = APIRouter(prefix="/tickets", tags=["Tickets"])

ADMIN = 1
MANAGER = 2
TECHNICIAN = 3
EMPLOYEE = 4

ALLOWED_EXTENSIONS = {
    ".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg",
    ".pdf", ".txt", ".log", ".csv", ".json", ".doc", ".docx", ".zip"
}
MAX_FILE_SIZE = 15 * 1024 * 1024  # 15 MB


def add_sla_details(ticket):
    sla_target = getattr(ticket, 'sla_due', None) or getattr(ticket, 'sla_due_date', None)
    
    if sla_target:
        ticket.sla_due = sla_target
        ticket.sla_due_date = sla_target
        ticket.sla_status = get_sla_status(sla_target, ticket.resolved_at, ticket.status)
        ticket.remaining_minutes = get_remaining_minutes(sla_target)
    else:
        ticket.sla_status = None
        ticket.remaining_minutes = None

    if getattr(ticket, 'assignee', None):
        assignee_full_name = getattr(ticket.assignee, 'full_name', None)
        ticket.assignee_name = assignee_full_name or ticket.assignee.username

    if getattr(ticket, 'requester', None):
        requester_full_name = getattr(ticket.requester, 'full_name', None)
        ticket.requester_name = requester_full_name or ticket.requester.username

    # Parse attachments if stored as serialized JSON
    raw_attachments = getattr(ticket, 'attachments', None)
    if isinstance(raw_attachments, str):
        try:
            parsed = json.loads(raw_attachments)
            ticket.attachments = parsed if isinstance(parsed, list) else []
        except Exception:
            ticket.attachments = []
    elif not raw_attachments:
        ticket.attachments = []

    return ticket


@router.post("/upload")
async def upload_ticket_attachments(
    files: list[UploadFile] = File(...),
    current_user: User = Depends(get_current_user)
):
    upload_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../uploads/tickets"))
    os.makedirs(upload_dir, exist_ok=True)

    uploaded_items = []
    for file in files:
        ext = os.path.splitext(file.filename)[1].lower() if file.filename else ""
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"File '{file.filename}' has unsupported extension '{ext}'. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
            )

        orig_stem = os.path.splitext(file.filename)[0] if file.filename else "file"
        safe_base = "".join(c for c in orig_stem if c.isalnum() or c in ("-", "_"))[:40] or "attachment"
        unique_name = f"{uuid.uuid4().hex[:12]}_{safe_base}{ext}"
        destination = os.path.join(upload_dir, unique_name)

        file_size = 0
        with open(destination, "wb") as buffer:
            while chunk := await file.read(1024 * 1024):
                file_size += len(chunk)
                if file_size > MAX_FILE_SIZE:
                    buffer.close()
                    if os.path.exists(destination):
                        os.remove(destination)
                    raise HTTPException(
                        status_code=400,
                        detail=f"File '{file.filename}' exceeds maximum allowed size of 15MB"
                    )
                buffer.write(chunk)

        uploaded_items.append({
            "name": file.filename,
            "url": f"/uploads/tickets/{unique_name}",
            "size": file_size,
            "type": file.content_type or "application/octet-stream"
        })

    return uploaded_items


@router.post("/", response_model=TicketResponse, status_code=status.HTTP_201_CREATED)
async def create_ticket(
    ticket_data: TicketCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    user_id = current_user.id
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    sla_due = calculate_sla_due(ticket_data.priority)

    attachments_json = (
        json.dumps([a.model_dump() if hasattr(a, 'model_dump') else a.dict() if hasattr(a, 'dict') else a for a in ticket_data.attachments])
        if ticket_data.attachments else None
    )

    ticket = Ticket(
        title=ticket_data.title,
        description=ticket_data.description,
        category=ticket_data.category,
        priority=ticket_data.priority,
        status="open",
        source="web",
        requester_id=user_id,
        sla_due=sla_due,
        attachments=attachments_json
    )

    db.add(ticket)
    db.commit()
    db.refresh(ticket)

    activity = TicketActivity(
        ticket_id=ticket.id,
        user_id=user_id,
        action="created",
        comment="Ticket created",
        attachments=attachments_json
    )
    db.add(activity)

    # Bell icon notification for requester
    create_notification(
        db=db,
        user_id=user_id,
        title="Ticket Created",
        message=f"Your ticket #{ticket.id} has been created",
        notification_type="Ticket"
    )

    db.commit()

    # REAL-TIME DESKTOP WEBSOCKET POP-UP NOTIFICATION
    await notification_manager.send_personal_notification(
        user_id=str(user_id),
        title=f"Ticket #{ticket.id} Created",
        message=f"Your ticket '{ticket.title}' was created successfully.",
        link=f"/tickets/{ticket.id}"
    )

    # Re-fetch ticket with joined relationship objects
    ticket = db.query(Ticket).options(
        joinedload(Ticket.assignee),
        joinedload(Ticket.requester)
    ).filter(Ticket.id == ticket.id).first()

    # SLACK NOTIFICATION FOR TICKET CREATION (Channel Broadcast in Background)
    requester_name = user.username
    background_tasks.add_task(
        send_ticket_created_notification,
        ticket_id=ticket.id,
        ticket_title=ticket.title,
        priority=ticket.priority,
        requester_name=requester_name
    )

    return add_sla_details(ticket)



@router.get("/", response_model=list[TicketResponse])
def get_tickets(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(ADMIN, MANAGER, TECHNICIAN))
):
    tickets = (
        db.query(Ticket)
        .options(
            joinedload(Ticket.assignee),
            joinedload(Ticket.requester)
        )
        .order_by(Ticket.created_at.desc())
        .all()
    )
    return [add_sla_details(ticket) for ticket in tickets]


@router.get("/my", response_model=list[TicketResponse])
def get_my_tickets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    tickets = (
        db.query(Ticket)
        .options(
            joinedload(Ticket.assignee),
            joinedload(Ticket.requester)
        )
        .filter(Ticket.requester_id == current_user.id)
        .order_by(Ticket.created_at.desc())
        .all()
    )
    return [add_sla_details(ticket) for ticket in tickets]
@router.get("/assigned", response_model=list[TicketResponse])
def get_assigned_tickets(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(TECHNICIAN))
):
    tickets = (
        db.query(Ticket)
        .options(
            joinedload(Ticket.assignee),
            joinedload(Ticket.requester)
        )
        .filter(Ticket.assignee_id == current_user.id)
        .order_by(Ticket.created_at.desc())
        .all()
    )
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

    activities = (
        db.query(TicketActivity)
        .options(joinedload(TicketActivity.user))
        .filter(TicketActivity.ticket_id == ticket_id)
        .order_by(TicketActivity.created_at.asc())
        .all()
    )

    result = []
    for act in activities:
        att_parsed = []
        if getattr(act, "attachments", None):
            try:
                parsed = json.loads(act.attachments) if isinstance(act.attachments, str) else act.attachments
                att_parsed = parsed if isinstance(parsed, list) else []
            except Exception:
                att_parsed = []
        result.append({
            "id": act.id,
            "ticket_id": act.ticket_id,
            "user_id": act.user_id,
            "action": act.action,
            "comment": act.comment,
            "attachments": att_parsed,
            "created_at": act.created_at.strftime("%Y-%m-%dT%H:%M:%S.%fZ") if act.created_at else None,
            "user": {
                "id": act.user.id,
                "username": act.user.username,
                "full_name": getattr(act.user, "full_name", None)
            } if act.user else None
        })
    return result


@router.get("/{ticket_id}", response_model=TicketResponse)
def get_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user_id = current_user.id
    role_id = current_user.role_id

    ticket = (
        db.query(Ticket)
        .options(
            joinedload(Ticket.assignee),
            joinedload(Ticket.requester)
        )
        .filter(Ticket.id == ticket_id)
        .first()
    )
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    if role_id == EMPLOYEE and ticket.requester_id != user_id:
        raise HTTPException(status_code=403, detail="Permission denied")
    if role_id == TECHNICIAN and ticket.assignee_id != user_id:
        raise HTTPException(status_code=403, detail="Permission denied")

    return add_sla_details(ticket)


class TicketAssignRequest(BaseModel):
    assignee_id: int


@router.put("/{ticket_id}/assign", response_model=TicketResponse)
@router.post("/{ticket_id}/assign", response_model=TicketResponse)
async def assign_ticket_endpoint(
    ticket_id: int,
    assign_data: TicketAssignRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(ADMIN, MANAGER))
):
    update_data = TicketUpdate(assignee_id=assign_data.assignee_id)
    return await update_ticket(
        ticket_id=ticket_id,
        ticket_data=update_data,
        background_tasks=background_tasks,
        db=db,
        current_user=current_user
    )


@router.patch("/{ticket_id}", response_model=TicketResponse)
@router.put("/{ticket_id}", response_model=TicketResponse)
async def update_ticket(
    ticket_id: int,
    ticket_data: TicketUpdate,
    background_tasks: BackgroundTasks,
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

    new_attachments_json = None
    if ticket_data.attachments:
        new_items = [
            a.model_dump() if hasattr(a, 'model_dump') else a.dict() if hasattr(a, 'dict') else a
            for a in ticket_data.attachments
        ]
        new_attachments_json = json.dumps(new_items)
        existing_list = []
        if ticket.attachments:
            try:
                parsed = json.loads(ticket.attachments) if isinstance(ticket.attachments, str) else list(ticket.attachments)
                existing_list = parsed if isinstance(parsed, list) else []
            except Exception:
                existing_list = []
        existing_list.extend(new_items)
        ticket.attachments = json.dumps(existing_list)
        changes.append(f"Attached {len(new_items)} file(s)")

    if ticket_data.comment:
        changes.append(f"Comment: {ticket_data.comment}")

    if changes:
        activity = TicketActivity(
            ticket_id=ticket.id,
            user_id=user_id,
            action="updated",
            comment=" | ".join(changes),
            attachments=new_attachments_json
        )
        db.add(activity)

        create_notification(
            db=db,
            user_id=ticket.requester_id,
            title="Ticket Updated",
            message=f"Your ticket #{ticket.id} has been updated",
            notification_type="Ticket"
        )

        # REAL-TIME DESKTOP POP-UP FOR REQUESTER
        await notification_manager.send_personal_notification(
            user_id=str(ticket.requester_id),
            title=f"Ticket #{ticket.id} Updated",
            message=f"Your ticket #{ticket.id} has been updated.",
            link=f"/tickets/{ticket.id}"
        )

    if assignment_happened:
        create_notification(
            db=db,
            user_id=ticket.assignee_id,
            title="Ticket Assigned",
            message=f"Ticket #{ticket.id} has been assigned to you.",
            notification_type="Ticket"
        )

        # REAL-TIME DESKTOP POP-UP FOR ASSIGNED TECHNICIAN
        await notification_manager.send_personal_notification(
            user_id=str(ticket.assignee_id),
            title=f"Ticket #{ticket.id} Assigned",
            message=f"Ticket #{ticket.id} ('{ticket.title}') was assigned to you.",
            link=f"/tickets/{ticket.id}"
        )

    db.commit()

    ticket = (
        db.query(Ticket)
        .options(
            joinedload(Ticket.assignee),
            joinedload(Ticket.requester),
            joinedload(Ticket.activities)
        )
        .filter(Ticket.id == ticket_id)
        .first()
    )

    updater = db.query(User).filter(User.id == user_id).first()
    updater_name = updater.username if updater else "Unknown"

    # Pre-extract snapshot fields for safe background execution
    creator_email = getattr(ticket.requester, "email", None) if ticket.requester else None
    creator_slack_id = getattr(ticket.requester, "slack_user_id", None) if ticket.requester else None
    assignee_email = getattr(ticket.assignee, "email", None) if ticket.assignee else None
    assignee_slack_id = getattr(ticket.assignee, "slack_user_id", None) if ticket.assignee else None
    technician_name = agent.username if agent else (getattr(ticket.assignee, "username", None) if ticket.assignee else "")

    # SLACK NOTIFICATIONS EXCLUSIVELY VIA DM IN BACKGROUND (NO PUBLIC SPAM)
    if assignment_happened:
        background_tasks.add_task(
            send_ticket_assigned_notification,
            ticket_id=ticket.id,
            ticket_title=ticket.title,
            technician_name=technician_name,
            creator_email=creator_email,
            creator_slack_id=creator_slack_id,
            assignee_email=assignee_email,
            assignee_slack_id=assignee_slack_id
        )
    if status_changed:
        background_tasks.add_task(
            send_ticket_status_notification,
            ticket_id=ticket.id,
            ticket_title=ticket.title,
            status=ticket.status,
            updater_name=updater_name,
            creator_email=creator_email,
            creator_slack_id=creator_slack_id,
            assignee_email=assignee_email,
            assignee_slack_id=assignee_slack_id
        )
    if priority_changed:
        background_tasks.add_task(
            send_ticket_priority_notification,
            ticket_id=ticket.id,
            ticket_title=ticket.title,
            priority=ticket.priority,
            updater_name=updater_name,
            creator_email=creator_email,
            creator_slack_id=creator_slack_id,
            assignee_email=assignee_email,
            assignee_slack_id=assignee_slack_id
        )

    return add_sla_details(ticket)


@router.post("/{ticket_id}/csat", response_model=TicketResponse)
async def submit_ticket_csat(
    ticket_id: int,
    csat_data: TicketCsatSubmit,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ticket = (
        db.query(Ticket)
        .options(
            joinedload(Ticket.assignee),
            joinedload(Ticket.requester)
        )
        .filter(Ticket.id == ticket_id)
        .first()
    )
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    user_id = current_user.id
    role_id = current_user.role_id

    # Only ticket requester or admin/manager can submit CSAT rating
    if ticket.requester_id != user_id and role_id not in [ADMIN, MANAGER]:
        raise HTTPException(status_code=403, detail="Only the ticket requester can submit a CSAT rating")

    # Ticket must be resolved or closed
    normalized_status = (ticket.status or "").lower()
    if normalized_status not in ["resolved", "closed"]:
        raise HTTPException(
            status_code=400,
            detail="CSAT feedback can only be submitted once the ticket is marked as Resolved or Closed"
        )

    ticket.csat_rating = csat_data.rating
    ticket.csat_feedback = csat_data.feedback.strip() if csat_data.feedback else None
    ticket.csat_submitted_at = datetime.now(timezone.utc)

    # Log in TicketActivity
    feedback_snippet = f" - \"{ticket.csat_feedback}\"" if ticket.csat_feedback else ""
    activity = TicketActivity(
        ticket_id=ticket.id,
        user_id=user_id,
        action="csat_submitted",
        comment=f"CSAT: {ticket.csat_rating}/5 stars{feedback_snippet}"
    )
    db.add(activity)

    # Send notification to assigned technician if assigned
    if ticket.assignee_id:
        create_notification(
            db=db,
            user_id=ticket.assignee_id,
            title="CSAT Feedback Received",
            message=f"Ticket #{ticket.id} received a {ticket.csat_rating}/5 star satisfaction rating.",
            notification_type="Ticket"
        )
        await notification_manager.send_personal_notification(
            user_id=str(ticket.assignee_id),
            title=f"CSAT Feedback: Ticket #{ticket.id}",
            message=f"Requester rated resolution {ticket.csat_rating}/5 stars.",
            link=f"/tickets/{ticket.id}"
        )

    db.commit()
    db.refresh(ticket)

    return add_sla_details(ticket)