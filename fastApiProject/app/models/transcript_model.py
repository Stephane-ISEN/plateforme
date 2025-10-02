from pydantic import BaseModel, Field
from datetime import datetime

class TranscriptCreate(BaseModel):
    session_id: str = Field(default="default_session")
    user_id:    str
    text:       str
    timestamp:  datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_schema_extra = {
            "example": {
                "session_id": "12345",
                "user_id": "507f1f77bcf86cd799439011",
                "text": "Ceci est un exemple de transcription.",
                "timestamp": "2023-01-01T12:00:00Z"
            }
        }

class Transcript(BaseModel):
    id:         str = Field(default="", alias="_id")
    session_id: str
    user_id:    str
    text:       str
    timestamp:  datetime

    @staticmethod
    def validate_id(value):
        if not isinstance(value, str):
            raise ValueError("L'ID doit être une chaîne de caractères.")
        return value

    class Config:
        json_schema_extra = {
            "example": {
                "id": "507f1f77bcf86cd799439011",
                "session_id": "12345",
                "user_id": "507f1f77bcf86cd799439011",
                "text": "Ceci est un exemple de transcription.",
                "timestamp": "2023-01-01T12:00:00Z"
            }
        }
