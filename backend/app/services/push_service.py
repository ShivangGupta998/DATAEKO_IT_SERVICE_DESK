import json
import logging
from typing import Optional, Dict, Any
from pywebpush import webpush, WebPushException

logger = logging.getLogger(__name__)

def send_desktop_popup(
    subscription_info: Optional[Dict[str, Any]], title: str, message: str
) -> None:
    """Sends native OS popup notification to user's desktop."""
    if not subscription_info:
        return

    try:
        webpush(
            subscription_info=subscription_info,
            data=json.dumps({"title": title, "body": message, "icon": "/logo.png"}),
            vapid_private_key="YOUR_VAPID_PRIVATE_KEY",
            vapid_claims={"sub": "mailto:admin@servicedesk.com"}
        )
    except WebPushException as ex:
        logger.error(f"Push notification error: {ex}")
    except Exception as ex:
        logger.error(f"Unexpected push notification error: {ex}")