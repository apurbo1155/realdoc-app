from typing import Dict, List
from fastapi import WebSocket

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, document_id: str):
        await websocket.accept()
        if document_id not in self.active_connections:
            self.active_connections[document_id] = []
        self.active_connections[document_id].append(websocket)

    def disconnect(self, websocket: WebSocket, document_id: str):
        if document_id in self.active_connections:
            self.active_connections[document_id].remove(websocket)
            if not self.active_connections[document_id]:
                del self.active_connections[document_id]

    async def broadcast(self, message: str, document_id: str):
        if document_id in self.active_connections:
            for connection in self.active_connections[document_id]:
                await connection.send_text(message)
