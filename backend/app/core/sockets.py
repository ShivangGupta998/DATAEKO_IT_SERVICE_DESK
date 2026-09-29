from fastapi import WebSocket
from typing import Dict, List

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, user_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[str(user_id)] = websocket

    def disconnect(self, user_id: str):
        user_key = str(user_id)
        if user_key in self.active_connections:
            del self.active_connections[user_key]

    async def send_personal_notification(self, user_id: str, title: str, message: str, link: str = ""):
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
                print(f"Error sending WS notification to user {user_id}: {e}")
                self.disconnect(user_id)

    async def broadcast_to_users(self, user_ids: List[str], title: str, message: str, link: str = ""):
        for uid in user_ids:
            await self.send_personal_notification(uid, title, message, link)

notification_manager = ConnectionManager()