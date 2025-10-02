
from typing import Dict
from bson import ObjectId
from app.connector.connectorBDD import MongoAccess
from app.models.transcript_model import TranscriptCreate


class TranscriptCRUD:
    def __init__(self):
        self.db = MongoAccess().transcript_collection

    async def create_transcript(self, data: TranscriptCreate) -> Dict:
        doc = data.dict()
        result = self.db.insert_one(doc)
        doc["id"] = str(result.inserted_id)
        return doc

    async def get_transcripts_by_session(self, session_id: str):
        cursor = self.db.find({"session_id": session_id})
        docs = list(cursor)
        return [
            {**d, "id": str(d["_id"])} for d in docs
        ]
