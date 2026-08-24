from slack_sdk import WebClient
from slack_sdk.errors import SlackApiError

from app.core.config import settings


# ============================================================
# SLACK CLIENT
# ============================================================

slack_client = WebClient(
    token=settings.SLACK_BOT_TOKEN
)


# ============================================================
# SEND SLACK MESSAGE
# ============================================================

def send_slack_message(message: str):
    """
    Send a message to the configured IT Service Desk
    Slack channel.
    """

    try:

        response = slack_client.chat_postMessage(
            channel=settings.SLACK_CHANNEL_ID,
            text=message
        )

        print(
            "Slack notification sent successfully"
        )

        print(
            "Slack message timestamp:",
            response.get("ts")
        )

        return True

    except SlackApiError as error:

        print(
            "Slack notification error:",
            error.response.get("error")
        )

        return False

    except Exception as error:

        print(
            "Unexpected Slack error:",
            error
        )

        return False