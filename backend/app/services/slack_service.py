from typing import Optional, Union, Any
import logging
from slack_sdk import WebClient
from slack_sdk.errors import SlackApiError

from app.core.config import settings

logger = logging.getLogger(__name__)

# ============================================================
# SLACK CLIENT
# ============================================================

slack_client = WebClient(
    token=settings.SLACK_BOT_TOKEN
)


# ============================================================
# USER RESOLUTION & EMAIL LOOKUP
# ============================================================

def get_slack_user_id_by_email(email: str) -> Optional[str]:
    """
    Call Slack API users.lookupByEmail to fetch the creator's Slack user ID (Uxxxxxxx).
    Safely catches exceptions, logs warnings, and never crashes calling API endpoints.
    """
    if not email:
        return None

    try:
        response = slack_client.users_lookupByEmail(email=email.strip().lower())
        user_info = response.get("user", {})
        slack_id = user_info.get("id")
        if slack_id:
            logger.info(f"Resolved Slack user ID '{slack_id}' for email '{email}'")
            return slack_id
    except SlackApiError as error:
        err_code = error.response.get("error")
        if err_code == "missing_scope":
            logger.warning(
                "Slack API missing required scope 'users:read.email'. "
                "Please add 'users:read.email' under Bot Token Scopes in api.slack.com -> OAuth & Permissions."
            )
        elif err_code == "users_not_found":
            logger.info(f"No Slack user found with email: '{email}'")
        else:
            logger.warning(f"Slack users_lookupByEmail failed for '{email}' ({err_code})")
    except Exception as error:
        logger.warning(f"Unexpected error in Slack lookup for email '{email}': {error}")

    return None


def resolve_slack_user_id(user: Any, db: Any = None) -> Optional[str]:
    """
    Resolve Slack user ID for a user model instance.
    Checks user.slack_user_id first, then falls back to users.lookupByEmail.
    Persists resolved ID to db if db session is provided.
    """
    if not user:
        return None

    # 1. Check existing slack_user_id on user model
    slack_id = getattr(user, "slack_user_id", None)
    if slack_id:
        return slack_id

    # 2. Look up by email dynamically
    email = getattr(user, "email", None)
    if email:
        slack_id = get_slack_user_id_by_email(email)
        if slack_id:
            try:
                user.slack_user_id = slack_id
                if db:
                    db.add(user)
                    db.commit()
            except Exception as e:
                logger.debug(f"Could not persist resolved slack_user_id: {e}")
            return slack_id

    return None


def resolve_ticket_creator_slack_id(ticket: Any, db: Any = None) -> Optional[str]:
    """
    Lookup creator's Slack user ID dynamically:
    1. Check if the ticket was created via Slack and has creator's slack_user_id
       recorded in its TicketActivity metadata.
    2. Check user.slack_user_id on ticket.requester.
    3. Call users.lookupByEmail for creator's email address.
    """
    if not ticket:
        return None

    # 1. Check ticket activity metadata for slack_user_id from the creation event
    activities = getattr(ticket, "activities", None)
    if activities:
        for act in activities:
            if getattr(act, "action", "") == "created_via_slack" and getattr(act, "comment", "") and "slack_user_id:" in act.comment:
                for part in act.comment.split("|"):
                    if part.startswith("slack_user_id:"):
                        sid = part.split(":", 1)[1].strip()
                        if sid:
                            return sid

    # Query DB activities if relationships were not preloaded
    if db and getattr(ticket, "id", None):
        try:
            from app.models.ticket_activity import TicketActivity
            act = db.query(TicketActivity).filter(
                TicketActivity.ticket_id == ticket.id,
                TicketActivity.action == "created_via_slack"
            ).first()
            if act and act.comment and "slack_user_id:" in act.comment:
                for part in act.comment.split("|"):
                    if part.startswith("slack_user_id:"):
                        sid = part.split(":", 1)[1].strip()
                        if sid:
                            return sid
        except Exception as e:
            logger.debug(f"Error querying ticket activities for Slack metadata: {e}")

    # 2. Check ticket requester user model
    creator = getattr(ticket, "requester", None)
    if creator:
        return resolve_slack_user_id(creator, db=db)

    # 3. Fallback: query user by requester_id if requester object not populated
    requester_id = getattr(ticket, "requester_id", None)
    if db and requester_id:
        try:
            from app.models.user import User
            user = db.query(User).filter(User.id == requester_id).first()
            if user:
                return resolve_slack_user_id(user, db=db)
        except Exception as e:
            logger.debug(f"Error querying requester user for Slack metadata: {e}")

    return None


# ============================================================
# SEND SLACK CHANNEL MESSAGE (BROADCAST)
# ============================================================

def send_slack_message(
    message: str,
    channel: Optional[str] = None,
    thread_ts: Optional[str] = None
) -> bool:
    """
    Send a message to a Slack channel (defaulting strictly to primary public channel).
    Used for public broadcasts like 'New Ticket Created' or in-thread acknowledgments.
    """
    target_channel = channel or settings.SLACK_CHANNEL_ID
    if not target_channel:
        logger.warning("No Slack channel configured.")
        return False

    try:
        kwargs = {
            "channel": target_channel,
            "text": message
        }
        if thread_ts:
            kwargs["thread_ts"] = thread_ts

        response = slack_client.chat_postMessage(**kwargs)
        logger.info(f"Slack message sent to channel {target_channel} (ts: {response.get('ts')})")
        return True

    except SlackApiError as error:
        logger.error(f"Slack channel notification error: {error.response.get('error')}")
        return False

    except Exception as error:
        logger.error(f"Unexpected Slack error: {error}")
        return False


# ============================================================
# SEND DIRECT MESSAGE (DM)
# ============================================================

def send_slack_dm(
    target: Any,
    message: str,
    db: Any = None
) -> bool:
    """
    Send a Direct Message (DM) to a Slack user using chat.postMessage
    targeting the user's Slack ID (channel: <creator_slack_user_id>).
    Never posts to public channel or thread.
    """
    slack_user_id: Optional[str] = None

    if isinstance(target, str):
        if "@" in target:
            slack_user_id = get_slack_user_id_by_email(target)
        else:
            slack_user_id = target
    else:
        slack_user_id = resolve_slack_user_id(target, db=db)

    if not slack_user_id:
        target_repr = getattr(target, 'username', None) or getattr(target, 'email', None) or target
        logger.warning(f"Cannot send Slack DM: Could not resolve Slack user ID for '{target_repr}'")
        return False

    try:
        response = slack_client.chat_postMessage(
            channel=slack_user_id,
            text=message
        )
        logger.info(f"Slack DM sent successfully to {slack_user_id} (ts: {response.get('ts')})")
        return True

    except SlackApiError as error:
        logger.error(f"Slack DM error to {slack_user_id}: {error.response.get('error')}")
        return False

    except Exception as error:
        logger.error(f"Unexpected Slack DM error to {slack_user_id}: {error}")
        return False


# ============================================================
# ROUTED NOTIFICATIONS (CHANNEL VS DM RULES)
# ============================================================

def send_ticket_created_notification(
    ticket: Any = None,
    requester_name: str = "",
    channel: Optional[str] = None,
    ticket_id: Optional[int] = None,
    ticket_title: Optional[str] = None,
    priority: Optional[str] = None,
) -> bool:
    """
    Ticket Created notification: Sent strictly to the primary public channel
    (SLACK_CHANNEL_ID / #service-desk-test) so all members can see new tickets.
    """
    tid = ticket_id or getattr(ticket, "id", None)
    title = ticket_title or getattr(ticket, "title", "Ticket")
    prio = priority or getattr(ticket, "priority", "Medium")
    rname = requester_name or "Unknown"

    message = (
        f"🎫 *New Ticket Created*\n"
        f"ID: #{tid}\n"
        f"Title: {title}\n"
        f"Priority: {prio}\n"
        f"By: {rname}"
    )
    return send_slack_message(message, channel=channel)


def send_ticket_assigned_notification(
    ticket: Any = None,
    technician_name: str = "",
    db: Any = None,
    ticket_id: Optional[int] = None,
    ticket_title: Optional[str] = None,
    creator_email: Optional[str] = None,
    creator_slack_id: Optional[str] = None,
    assignee_email: Optional[str] = None,
    assignee_slack_id: Optional[str] = None,
):
    """
    Ticket Assigned notification:
    Exclusively sent via private Direct Message (DM) to the creator's Slack User ID
    and the assigned technician.
    NEVER posted to the public channel or public thread.
    """
    try:
        tid = ticket_id or getattr(ticket, "id", None)
        title = ticket_title or getattr(ticket, "title", "Ticket")
        tech = technician_name or "Assigned Technician"

        message = (
            f"🎫 *Ticket Assigned*\n"
            f"ID: #{tid}\n"
            f"Title: {title}\n"
            f"Assigned To: {tech}"
        )

        # 1. Resolve creator Slack user ID dynamically
        c_slack_id = creator_slack_id
        if not c_slack_id and ticket:
            c_slack_id = resolve_ticket_creator_slack_id(ticket, db=db)
        if not c_slack_id and creator_email:
            c_slack_id = get_slack_user_id_by_email(creator_email)

        if c_slack_id:
            send_slack_dm(c_slack_id, message, db=db)
        else:
            logger.warning(f"Could not resolve creator Slack ID for ticket #{tid} assigned notification.")

        # 2. Resolve technician Slack user ID dynamically
        t_slack_id = assignee_slack_id
        if not t_slack_id and ticket and getattr(ticket, "assignee", None):
            t_slack_id = resolve_slack_user_id(ticket.assignee, db=db)
        if not t_slack_id and assignee_email:
            t_slack_id = get_slack_user_id_by_email(assignee_email)

        if t_slack_id and t_slack_id != c_slack_id:
            send_slack_dm(t_slack_id, message, db=db)
    except Exception as e:
        logger.warning(f"Error in send_ticket_assigned_notification: {e}")


def send_ticket_priority_notification(
    ticket: Any = None,
    updater_name: str = "",
    db: Any = None,
    ticket_id: Optional[int] = None,
    ticket_title: Optional[str] = None,
    priority: Optional[str] = None,
    creator_email: Optional[str] = None,
    creator_slack_id: Optional[str] = None,
    assignee_email: Optional[str] = None,
    assignee_slack_id: Optional[str] = None,
):
    """
    Priority Updated notification:
    Exclusively sent via private Direct Message (DM) to the creator's Slack User ID
    and the assigned technician.
    NEVER posted to the public channel or public thread.
    """
    try:
        tid = ticket_id or getattr(ticket, "id", None)
        title = ticket_title or getattr(ticket, "title", "Ticket")
        prio = priority or getattr(ticket, "priority", "Updated")
        user = updater_name or "System"

        message = (
            f"🎫 *Priority Updated*\n"
            f"ID: #{tid}\n"
            f"Title: {title}\n"
            f"Priority: {prio}\n"
            f"By: {user}"
        )

        # 1. Resolve creator Slack user ID dynamically
        c_slack_id = creator_slack_id
        if not c_slack_id and ticket:
            c_slack_id = resolve_ticket_creator_slack_id(ticket, db=db)
        if not c_slack_id and creator_email:
            c_slack_id = get_slack_user_id_by_email(creator_email)

        if c_slack_id:
            send_slack_dm(c_slack_id, message, db=db)
        else:
            logger.warning(f"Could not resolve creator Slack ID for ticket #{tid} priority update notification.")

        # 2. Also DM assigned technician if distinct
        t_slack_id = assignee_slack_id
        if not t_slack_id and ticket and getattr(ticket, "assignee", None):
            t_slack_id = resolve_slack_user_id(ticket.assignee, db=db)
        if not t_slack_id and assignee_email:
            t_slack_id = get_slack_user_id_by_email(assignee_email)

        if t_slack_id and t_slack_id != c_slack_id:
            send_slack_dm(t_slack_id, message, db=db)
    except Exception as e:
        logger.warning(f"Error in send_ticket_priority_notification: {e}")


def send_ticket_status_notification(
    ticket: Any = None,
    updater_name: str = "",
    db: Any = None,
    ticket_id: Optional[int] = None,
    ticket_title: Optional[str] = None,
    status: Optional[str] = None,
    creator_email: Optional[str] = None,
    creator_slack_id: Optional[str] = None,
    assignee_email: Optional[str] = None,
    assignee_slack_id: Optional[str] = None,
):
    """
    Status Updated notification:
    Exclusively sent via private Direct Message (DM) to the creator's Slack User ID
    and the assigned technician.
    NEVER posted to the public channel or public thread.
    """
    try:
        tid = ticket_id or getattr(ticket, "id", None)
        title = ticket_title or getattr(ticket, "title", "Ticket")
        stat = status or getattr(ticket, "status", "Updated")
        user = updater_name or "System"

        message = (
            f"🎫 *Status Updated*\n"
            f"ID: #{tid}\n"
            f"Title: {title}\n"
            f"Status: {stat}\n"
            f"By: {user}"
        )

        # 1. Resolve creator Slack user ID dynamically
        c_slack_id = creator_slack_id
        if not c_slack_id and ticket:
            c_slack_id = resolve_ticket_creator_slack_id(ticket, db=db)
        if not c_slack_id and creator_email:
            c_slack_id = get_slack_user_id_by_email(creator_email)

        if c_slack_id:
            send_slack_dm(c_slack_id, message, db=db)
        else:
            logger.warning(f"Could not resolve creator Slack ID for ticket #{tid} status update notification.")

        # 2. Also DM assigned technician if distinct
        t_slack_id = assignee_slack_id
        if not t_slack_id and ticket and getattr(ticket, "assignee", None):
            t_slack_id = resolve_slack_user_id(ticket.assignee, db=db)
        if not t_slack_id and assignee_email:
            t_slack_id = get_slack_user_id_by_email(assignee_email)

        if t_slack_id and t_slack_id != c_slack_id:
            send_slack_dm(t_slack_id, message, db=db)
    except Exception as e:
        logger.warning(f"Error in send_ticket_status_notification: {e}")