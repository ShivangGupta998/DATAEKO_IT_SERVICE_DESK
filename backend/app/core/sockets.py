import logging
from typing import Dict, List
from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    def __init__(self) -> None:
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, user_id: str, websocket: WebSocket) -> None:
        await websocket.accept()
        self.active_connections[str(user_id)] = websocket

    def disconnect(self, user_id: str) -> None:
        user_key = str(user_id)
        if user_key in self.active_connections:
            del self.active_connections[user_key]

    async def send_personal_notification(
        self, user_id: str, title: str, message: str, link: str = ""
    ) -> None:
        user_key = str(user_id)
        if user_key in self.active_connections:
            try:
                websocket = self.active_connections[user_key]
                await websocket.send_json({
                    "title": title,
                    "message": message,
                    "link": link
                })
            except Exception as e:
                logger.error(f"Error sending WS notification to user {user_id}: {e}")
                self.disconnect(user_id)

    async def broadcast_to_users(
        self, user_ids: List[str], title: str, message: str, link: str = ""
    ) -> None:
        for uid in user_ids:
            await self.send_personal_notification(uid, title, message, link)


notification_manager = ConnectionManager()