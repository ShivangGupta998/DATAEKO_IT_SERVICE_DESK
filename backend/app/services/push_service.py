from pywebpush import webpush, WebPushException
import json

def send_desktop_popup(subscription_info, title: str, message: str):
    """Sends native OS popup notification to user's desktop."""
    try:
        webpush(
            subscription_info=subscription_info,
            data=json.dumps({"title": title, "body": message, "icon": "/logo.png"}),
            vapid_private_key="YOUR_VAPID_PRIVATE_KEY",
            vapid_claims={"sub": "mailto:admin@servicedesk.com"}
        )
    except WebPushException as ex:
        print(f"Push notification error: {ex}")