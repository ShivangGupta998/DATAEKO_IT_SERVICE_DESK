from fastapi import APIRouter, Request, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
import logging
import re
import collections

from app.database.database import get_db
from app.models.ticket import Ticket
from app.models.ticket_activity import TicketActivity
from app.models.user import User
from app.services.slack_service import send_slack_message

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/slack",
    tags=["slack"]
)

# Bounded in-memory event deduplication to prevent duplicate ticket creation
PROCESSED_EVENT_KEYS = collections.deque(maxlen=2000)
PROCESSED_EVENT_SET = set()

def is_duplicate_event(key: str) -> bool:
    if not key:
        return False
    if key in PROCESSED_EVENT_SET:
        return True
    if len(PROCESSED_EVENT_KEYS) >= 2000:
        oldest = PROCESSED_EVENT_KEYS.popleft()
        PROCESSED_EVENT_SET.discard(oldest)
    PROCESSED_EVENT_KEYS.append(key)
    PROCESSED_EVENT_SET.add(key)
    return False


@router.post("/events")
async def handle_slack_events(
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):

    """
    Handle incoming Slack Events API webhooks:
    1. In-Thread acknowledgment for Slack creation.
    2. Route user thread replies to Ticket comments (leaving thread intact).
    3. Official status/assignment updates are strictly routed to DMs.
    """
    data = await request.json()

    # 1. Handle Slack URL Verification Challenge
    if "challenge" in data:
        return {"challenge": data["challenge"]}

    event = data.get("event", {})
    event_type = event.get("type")

    # 2. Process message or app_mention events
    if event_type in ["message", "app_mention"]:
        # Avoid reacting to bot's own messages or sub-bot events
        if event.get("bot_id") or event.get("subtype") == "bot_message":
            return {"status": "ok", "message": "Ignored bot event"}

        text = event.get("text", "")
        slack_user_id = event.get("user")
        channel_id = event.get("channel")
        msg_ts = event.get("ts")
        parent_thread_ts = event.get("thread_ts")

        if not text:
            return {"status": "ok", "message": "Empty message ignored"}

        # Event Deduplication (handles duplicate app_mention + message event delivery)
        dedup_key = data.get("event_id") or f"{channel_id}:{msg_ts}"
        if is_duplicate_event(dedup_key):
            return {"status": "ok", "message": "Duplicate event ignored"}

        cleaned_text = re.sub(r'<@U[A-Z0-9]+>', '', text).strip()

        # 3. Handle Thread Replies / Comments inside existing ticket threads
        if parent_thread_ts and parent_thread_ts != msg_ts:
            # Check if this thread belongs to an existing Slack-created ticket
            matched_activity = db.query(TicketActivity).filter(
                TicketActivity.comment.contains(f"thread_ts:{parent_thread_ts}")
            ).first()

            if matched_activity:
                # Find comment author
                comment_user = db.query(User).filter(User.slack_user_id == slack_user_id).first()
                comment_user_id = comment_user.id if comment_user else matched_activity.user_id

                if cleaned_text:
                    reply_activity = TicketActivity(
                        ticket_id=matched_activity.ticket_id,
                        user_id=comment_user_id,
                        action="comment",
                        comment=f"[Slack Reply] {cleaned_text}"
                    )
                    db.add(reply_activity)
                    db.commit()
                    logger.info(f"Recorded thread reply on Ticket #{matched_activity.ticket_id} from Slack user {slack_user_id}")

                # Requirement 3: Keep conversation replies intact in thread without bot disruption
                return {"status": "ok", "message": "Thread reply recorded as ticket comment"}

        # 4. New Ticket Creation from Slack Tag / Mention
        if not cleaned_text:
            return {"status": "ok", "message": "Empty message ignored"}

        # Match internal user by slack_user_id; fallback to first active user
        user = db.query(User).filter(User.slack_user_id == slack_user_id).first()
        if not user:
            user = db.query(User).filter(User.is_active == True).first()
            if user and not user.slack_user_id and slack_user_id:
                user.slack_user_id = slack_user_id
                db.add(user)
                db.commit()

        requester_id = user.id if user else 1

        # Truncate first line for ticket title
        lines = cleaned_text.split("\n")
        title = lines[0][:100] if lines and lines[0] else "Ticket from Slack"

        try:
            # Create Ticket in DB
            new_ticket = Ticket(
                title=title,
                description=cleaned_text,
                category="General",
                priority="Medium",
                status="open",
                source="slack",
                requester_id=requester_id
            )

            db.add(new_ticket)
            db.commit()
            db.refresh(new_ticket)

            # Store creation metadata in TicketActivity for thread tracking & DM routing
            thread_identifier = parent_thread_ts or msg_ts
            slack_meta = TicketActivity(
                ticket_id=new_ticket.id,
                user_id=requester_id,
                action="created_via_slack",
                comment=f"slack_user_id:{slack_user_id}|channel:{channel_id}|thread_ts:{thread_identifier}"
            )
            db.add(slack_meta)
            db.commit()

            # 1. In-Thread Acknowledgment for Slack Creation:
            # Reply directly in that message thread with creation details
            confirmation_msg = (
                f"🎫 *Ticket created successfully!*\n\n"
                f"*Ticket ID:* #{new_ticket.id}\n"
                f"*Title:* {new_ticket.title}\n"
                f"*Category:* {new_ticket.category}\n"
                f"*Priority:* {new_ticket.priority}\n"
                f"*Status:* {new_ticket.status}\n"
                f"*Source:* Slack"
            )

            # Send in-thread confirmation in background to prevent webhook timeout
            background_tasks.add_task(
                send_slack_message,
                message=confirmation_msg,
                channel=channel_id,
                thread_ts=thread_identifier
            )

            logger.info(f"Successfully created Ticket #{new_ticket.id} via Slack Event with in-thread acknowledgment")
            return {"status": "ok", "ticket_id": new_ticket.id}


        except Exception as e:
            db.rollback()
            logger.error(f"Failed to create ticket from Slack event: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Slack ticket creation failed: {str(e)}"
            )

    return {"status": "ok"}