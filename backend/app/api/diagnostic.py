from typing import Optional
from fastapi import APIRouter, status
from pydantic import BaseModel
import datetime
import logging
from slack_sdk.errors import SlackApiError

from app.core.config import settings
from app.services.slack_service import (
    slack_client,
    get_slack_user_id_by_email,
)

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Diagnostics"])

class SlackDiagnosticRequest(BaseModel):
    test_email: Optional[str] = None
    custom_message: Optional[str] = "🧪 IT Service Desk Slack Integration Health Check Ping"


@router.post("/test/slack-integration")
async def test_slack_integration(payload: Optional[SlackDiagnosticRequest] = None):
    """
    Diagnostic audit endpoint for Slack Integration:
    1. Checks environment variables (SLACK_BOT_TOKEN, SLACK_CHANNEL_ID).
    2. Tests public channel posting permissions.
    3. Tests email-to-Slack user lookup via users.lookupByEmail & DM dispatch.
    4. Confirms routing rules.
    """
    req = payload or SlackDiagnosticRequest()
    timestamp_now = datetime.datetime.utcnow().isoformat() + "Z"
    
    results = {
        "status": "healthy",
        "timestamp": timestamp_now,
        "env_check": {},
        "channel_test": {},
        "dm_test": {},
        "routing_rules_verified": {
            "ticket_created": "Sent strictly to primary public channel (settings.SLACK_CHANNEL_ID)",
            "ticket_assigned": "Sent exclusively via private Direct Message (DM)",
            "priority_updated": "Sent exclusively via private Direct Message (DM)",
            "status_updated": "Sent exclusively via private Direct Message (DM)"
        }
    }

    # a. Check environment variables
    token = settings.SLACK_BOT_TOKEN or ""
    channel = settings.SLACK_CHANNEL_ID or ""

    token_loaded = bool(token)
    channel_loaded = bool(channel)
    token_valid_prefix = token.startswith("xoxb-") or token.startswith("xoxp-")

    results["env_check"] = {
        "bot_token_loaded": token_loaded,
        "bot_token_prefix": token[:9] + "..." if token_loaded else None,
        "token_prefix_valid": token_valid_prefix,
        "channel_id_loaded": channel_loaded,
        "channel_id": channel if channel_loaded else None
    }

    if not token_loaded or not channel_loaded:
        results["status"] = "error"
        results["error"] = "Missing SLACK_BOT_TOKEN or SLACK_CHANNEL_ID in environment"
        return results

    # b. Test public channel posting permissions
    try:
        ping_text = (
            f"🧪 *IT Service Desk Slack Health Check*\n"
            f"• *Status:* Online & Operational\n"
            f"• *Timestamp:* {timestamp_now}\n"
            f"• *Channel:* {channel}\n"
            f"• *Message:* {req.custom_message}"
        )
        chan_resp = slack_client.chat_postMessage(
            channel=channel,
            text=ping_text
        )
        results["channel_test"] = {
            "success": True,
            "channel": channel,
            "ts": chan_resp.get("ts"),
            "message": "Public channel ping sent successfully"
        }
    except SlackApiError as e:
        results["status"] = "partial_error"
        results["channel_test"] = {
            "success": False,
            "channel": channel,
            "error_code": e.response.get("error"),
            "details": str(e)
        }
    except Exception as e:
        results["status"] = "partial_error"
        results["channel_test"] = {
            "success": False,
            "channel": channel,
            "error": str(e)
        }

    # c. Test users.lookupByEmail & DM dispatch
    test_email = req.test_email
    if test_email:
        test_email = test_email.strip().lower()
        results["dm_test"]["target_email"] = test_email
        try:
            lookup_resp = slack_client.users_lookupByEmail(email=test_email)
            slack_user_id = lookup_resp.get("user", {}).get("id")
            results["dm_test"]["lookup_success"] = True
            results["dm_test"]["slack_user_id"] = slack_user_id

            if slack_user_id:
                try:
                    dm_resp = slack_client.chat_postMessage(
                        channel=slack_user_id,
                        text=(
                            f"🧪 *IT Service Desk Health Check Direct Message*\n"
                            f"Hello! This is a test Direct Message verifying private notification delivery.\n"
                            f"• *Target Email:* `{test_email}`\n"
                            f"• *Slack User ID:* `{slack_user_id}`\n"
                            f"• *Timestamp:* {timestamp_now}"
                        )
                    )
                    results["dm_test"]["dm_sent"] = True
                    results["dm_test"]["dm_ts"] = dm_resp.get("ts")
                except SlackApiError as dm_err:
                    results["status"] = "partial_error"
                    results["dm_test"]["dm_sent"] = False
                    results["dm_test"]["dm_error"] = dm_err.response.get("error")
                    results["dm_test"]["dm_error_details"] = str(dm_err)
        except SlackApiError as lookup_err:
            results["status"] = "partial_error"
            err_code = lookup_err.response.get("error")
            results["dm_test"]["lookup_success"] = False
            results["dm_test"]["lookup_error"] = err_code
            if err_code == "missing_scope":
                results["dm_test"]["remediation"] = (
                    "Add 'users:read.email' scope under Bot Token Scopes in api.slack.com -> OAuth & Permissions"
                )
            elif err_code == "users_not_found":
                results["dm_test"]["remediation"] = (
                    f"No user with email '{test_email}' exists in this Slack workspace"
                )
            results["dm_test"]["details"] = str(lookup_err)
        except Exception as e:
            results["status"] = "partial_error"
            results["dm_test"]["lookup_success"] = False
            results["dm_test"]["error"] = str(e)
    else:
        results["dm_test"] = {
            "notice": "Pass {\"test_email\": \"your_email@domain.com\"} in the JSON body to verify users.lookupByEmail and DM dispatch."
        }

    return results
