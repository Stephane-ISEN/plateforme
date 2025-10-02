# app/api/utils/ws_manager.py
from typing import Dict, List
from fastapi import WebSocket

class ConnectionManager:
    def __init__(self):
        # session_id -> list of websockets
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, session_id: str, websocket: WebSocket):
        await websocket.accept()
        conns = self.active_connections.setdefault(session_id, [])
        conns.append(websocket)

    def disconnect(self, session_id: str, websocket: WebSocket):
        conns = self.active_connections.get(session_id, [])
        if websocket in conns:
            conns.remove(websocket)

    async def broadcast(self, session_id: str, message: dict):
        """Envoie le message JSON à tous les websockets de la session."""
        conns = self.active_connections.get(session_id, [])
        for ws in conns:
            await ws.send_json(message)
            
    async def send_text(self, session_id: str, text: str):
        """Envoie un message texte à tous les websockets de la session."""
        conns = self.active_connections.get(session_id, [])
        for ws in conns:
            await ws.send_text(text)
            
    async def send_audio(self, session_id: str, audio_chunk: bytes):
        """Envoie un chunk audio à tous les websockets de la session."""
        conns = self.active_connections.get(session_id, [])
        for ws in conns:
            await ws.send_bytes(audio_chunk)

# Singleton
manager = ConnectionManager()