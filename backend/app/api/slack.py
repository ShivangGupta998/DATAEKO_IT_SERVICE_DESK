from fastapi import APIRouter, Request, Depends, HTTPException, status
from sqlalchemy.orm import Session
import logging

from app.database.database import get_db
from app.models.ticket import Ticket
from app.models.user import User
from app.services.slack_service import send_slack_message

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/slack",
    tags=["slack"]
)

@router.post("/events")
async def handle_slack_events(request: Request, db: Session = Depends(get_db)):
    """
    Handle incoming Slack Events API webhooks to auto-create tickets from messages/mentions.
    """
    data = await request.json()

    # 1. Handle Slack URL Verification Challenge
    if "challenge" in data:
        return {"challenge": data["challenge"]}

    event = data.get("event", {})
    event_type = event.get("type")

    # 2. Process message or app_mention events
    if event_type in ["message", "app_mention"]:
        # Avoid reacting to bot's own messages
        if event.get("bot_id") or event.get("subtype") == "bot_message":
            return {"status": "ok", "message": "Ignored bot event"}

        text = event.get("text", "")
        slack_user_id = event.get("user")

        if not text:
            return {"status": "ok", "message": "Empty message ignored"}

        # Clean mention tags from text if app_mention
        cleaned_text = text.replace("<@U", "").replace(">", "").strip()

        # Find matching internal user by slack_user_id or fallback to default user
        user = db.query(User).filter(User.slack_user_id == slack_user_id).first()
        if not user:
            user = db.query(User).first()

        requester_id = user.id if user else 1

        # Truncate first line for ticket title
        lines = text.strip().split("\n")
        title = lines[0][:100] if lines else "Ticket from Slack"

        try:
            # Create Ticket in DB
            new_ticket = Ticket(
                title=title,
                description=text,
                category="General",
                priority="Medium",
                status="open",
                source="slack",
                requester_id=requester_id
            )

            db.add(new_ticket)
            db.commit()
            db.refresh(new_ticket)

            # 3. Post Confirmation Message back to Slack channel
            confirmation_msg = (
                f"🎫 *Ticket created successfully!*\n\n"
                f"*Ticket ID:* #{new_ticket.id}\n"
                f"*Title:* {new_ticket.title}\n"
                f"*Category:* {new_ticket.category}\n"
                f"*Priority:* {new_ticket.priority}\n"
                f"*Status:* {new_ticket.status}\n"
                f"*Source:* Slack"
            )
            send_slack_message(confirmation_msg)

            logger.info(f"Successfully created Ticket #{new_ticket.id} via Slack Event")
            return {"status": "ok", "ticket_id": new_ticket.id}

        except Exception as e:
            db.rollback()
            logger.error(f"Failed to create ticket from Slack event: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Slack ticket creation failed: {str(e)}"
            )

    return {"status": "ok"}