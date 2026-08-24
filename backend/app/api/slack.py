import json
import re

from fastapi import APIRouter, Request, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from slack_sdk import WebClient
from slack_sdk.errors import SlackApiError

from app.core.config import settings
from app.database.database import get_db

from app.models.user import User
from app.models.ticket import Ticket
from app.models.ticket_activity import TicketActivity

from app.services.slack_service import send_slack_message


router = APIRouter(
    prefix="/slack",
    tags=["Slack"],
)


# ============================================================
# SLACK CLIENT
# ============================================================

slack_client = WebClient(
    token=settings.SLACK_BOT_TOKEN
)


# ============================================================
# HEALTH CHECK
# ============================================================

@router.get("/health")
async def slack_health():

    return {
        "status": "Slack API is working"
    }


# ============================================================
# TEST SLACK NOTIFICATION
# ============================================================

@router.get("/test-notification")
async def test_slack_notification():

    success = send_slack_message(
        (
            "🔔 *IT Service Desk Test Notification*\n\n"
            "Slack notifications are working successfully."
        )
    )

    return {
        "success": success
    }


# ============================================================
# SLACK EVENTS
# ============================================================

@router.post("/events")
async def slack_events(
    request: Request,
    db: Session = Depends(get_db)
):

    print("\n")
    print("=" * 60)
    print("SLACK REQUEST RECEIVED")
    print("=" * 60)

    # ========================================================
    # READ REQUEST BODY
    # ========================================================

    body = await request.body()

    if not body:

        return JSONResponse(
            status_code=200,
            content={
                "ok": True
            }
        )

    # ========================================================
    # PARSE JSON
    # ========================================================

    try:

        data = json.loads(
            body.decode("utf-8")
        )

    except Exception as error:

        print(
            "JSON parsing error:",
            error
        )

        return JSONResponse(
            status_code=200,
            content={
                "ok": True
            }
        )

    # ========================================================
    # PRINT SLACK EVENT
    # ========================================================

    print(
        json.dumps(
            data,
            indent=2
        )
    )

    # ========================================================
    # URL VERIFICATION
    # ========================================================

    if data.get("type") == "url_verification":

        print(
            "Slack URL verification received"
        )

        return JSONResponse(
            status_code=200,
            content={
                "challenge": data.get(
                    "challenge"
                )
            }
        )
    # ========================================================
    # EVENT CALLBACK
    # ========================================================

    if data.get("type") == "event_callback":

        event = data.get(
            "event",
            {}
        )

        event_type = event.get(
            "type"
        )

        print(
            "Event type:",
            event_type
        )

        # ====================================================
        # APP MENTION
        # ====================================================

        if event_type == "app_mention":

            # ------------------------------------------------
            # GET SLACK INFORMATION
            # ------------------------------------------------

            channel_id = event.get(
                "channel"
            )

            slack_user_id = event.get(
                "user"
            )

            message = event.get(
                "text",
                ""
            )

            print(
                "Slack user:",
                slack_user_id
            )

            print(
                "Channel:",
                channel_id
            )

            print(
                "Message:",
                message
            )

            # ------------------------------------------------
            # CHANNEL CHECK
            # ------------------------------------------------

            if not channel_id:

                print(
                    "ERROR: Channel ID missing"
                )

                return {
                    "ok": True
                }

            # =================================================
            # FIND USER
            # =================================================

            user = (
                db.query(User)
                .filter(
                    User.slack_user_id ==
                    slack_user_id
                )
                .first()
            )

            # =================================================
            # USER NOT LINKED (FALLBACK TO FIRST ADMIN/USER)
            # =================================================

            if not user:

                print(
                    f"Slack user {slack_user_id} not explicitly linked. "
                    "Falling back to primary system account."
                )

                # Fetch fallback account so ticket creation succeeds
                user = db.query(User).first()

                if not user:
                    print("ERROR: No fallback user found in database.")
                    try:
                        slack_client.chat_postMessage(
                            channel=channel_id,
                            text="❌ System error: No active user accounts found in IT Service Desk."
                        )
                    except SlackApiError as error:
                        print("Slack API error:", error.response.get("error"))

                    return {"ok": True}

            # =================================================
            # REMOVE BOT MENTION
            # =================================================

            clean_message = re.sub(
                r"<@[A-Z0-9]+>",
                "",
                message
            ).strip()

            print(
                "Clean message:",
                clean_message
            )

            # =================================================
            # EMPTY MESSAGE
            # =================================================

            if not clean_message:

                try:

                    slack_client.chat_postMessage(
                        channel=channel_id,
                        text=(
                            "Please describe the issue "
                            "you want to report.\n\n"
                            "Example:\n"
                            "`@Dataeko IT Service Desk "
                            "My laptop WiFi is not working`"
                        )
                    )

                except SlackApiError as error:

                    print(
                        "Slack API error:",
                        error.response.get(
                            "error"
                        )
                    )

                return {
                    "ok": True
                }

            # =================================================
            # CREATE TICKET
            # =================================================

            ticket = Ticket(
                title=clean_message[:200],
                description=clean_message,
                category="general",
                priority="medium",
                status="open",
                source="slack",
                requester_id=user.id
            )

            db.add(ticket)

            db.commit()

            db.refresh(ticket)

            print(
                "Ticket created:",
                ticket.id
            )

            # =================================================
            # CREATE ACTIVITY
            # =================================================

            activity = TicketActivity(
                ticket_id=ticket.id,
                user_id=user.id,
                action="created",
                comment="Ticket created from Slack"
            )

            db.add(activity)

            db.commit()

            print(
                "Ticket activity created"
            )

            # =================================================
            # SLACK RESPONSE
            # =================================================

            response_text = (
                "🎫 *Ticket created successfully!*\n\n"
                f"*Ticket ID:* #{ticket.id}\n"
                f"*Title:* {ticket.title}\n"
                f"*Category:* {ticket.category}\n"
                f"*Priority:* {ticket.priority}\n"
                f"*Status:* {ticket.status}\n"
                f"*Source:* Slack"
            )

            try:

                response = slack_client.chat_postMessage(
                    channel=channel_id,
                    text=response_text
                )

                print(
                    "Slack reply sent successfully"
                )

                print(
                    "Message timestamp:",
                    response.get("ts")
                )

            except SlackApiError as error:

                print(
                    "Slack API error:",
                    error.response.get(
                        "error"
                    )
                )

        # ====================================================
        # OTHER EVENTS
        # ====================================================

        else:

            print(
                "Ignoring event type:",
                event_type
            )

    # ========================================================
    # FINAL RESPONSE
    # ========================================================

    return JSONResponse(
        status_code=200,
        content={
            "ok": True
        }
    )