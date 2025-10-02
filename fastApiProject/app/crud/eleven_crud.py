from typing import List, Dict
from datetime import datetime
from bson import ObjectId
import os
from elevenlabs.client import AsyncElevenLabs

from app.connector.connectorBDD import MongoAccess
from app.models.eleven_model import SessionCreate, MessageCreate

class ElevenCRUD:
    """
    Classe CRUD pour les entités ElevenLabs :
    - Liste des agents via l'API ElevenLabs Conversational AI
    - Gestion des sessions et messages en base locales
    """
    def __init__(self):
        # Initialisation du client Async ElevenLabs pour ConvAI
        api_key = os.getenv("ELEVENLABS_API_KEY")
        if not api_key:
            raise ValueError("ELEVENLABS_API_KEY missing in environment")
        self.client = AsyncElevenLabs(api_key=api_key)

        # Accès local MongoDB pour sessions / messages
        self.db = MongoAccess().eleven_collection

    # ----- Agents -----
    async def list_agents(self) -> List[Dict]:
        resp = await self.client.conversational_ai.agents.list()
        return [
            {
                "_id": ag.agent_id,  # <- Ajout d’un champ _id
                "agent_id": ag.agent_id,
                "name": ag.name,
                "avatar_url": None,
            }
            for ag in resp.agents
        ]

    # ----- Sessions -----
    def create_session(self, user_id: str, data: SessionCreate) -> Dict:
        doc = data.dict()
        doc.update({
            "kind": "session",
            "user_id": user_id,
            "started_at": datetime.utcnow()
        })
        res = self.db.insert_one(doc)
        doc["_id"] = res.inserted_id
        return doc

    def get_sessions(self, user_id: str) -> List[Dict]:
        docs = list(self.db.find({"kind": "session", "user_id": user_id}))
        return [{**d, "_id": d.get("_id")} for d in docs]

    # ----- Messages -----
    def create_message(self, data: MessageCreate) -> Dict:
        doc = data.dict()
        doc.update({
            "kind": "message",
            "created_at": datetime.utcnow()
        })
        res = self.db.insert_one(doc)
        doc["_id"] = res.inserted_id
        return doc

    def get_messages(self, session_id: str) -> List[Dict]:
        cursor = self.db.find({"kind": "message", "session_id": session_id}) \
                        .sort("created_at", 1)
        docs = list(cursor)
        return [{**d, "_id": d.get("_id")} for d in docs]

    def delete_session(self, session_id: str) -> None:
        self.db.delete_one({"_id": ObjectId(session_id), "kind": "session"})
        self.db.delete_many({"session_id": session_id, "kind": "message"})

    def delete_message(self, message_id: str) -> None:
        self.db.delete_one({"_id": ObjectId(message_id), "kind": "message"})
