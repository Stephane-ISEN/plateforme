from pydantic import BaseModel
from typing import Literal, List

class MessageSchema(BaseModel):
    role:    Literal["user", "assistant"]
    content: str

    class Config:
        json_schema_extra = {
            "example": {
                "role": "user",
                "content": "Bonjour, comment puis-je vous aider ?"
            }
        }

class VoiceAgentResponse(BaseModel):
    transcription: str
    reply:         str
    history: List[MessageSchema]

    class Config:
        json_schema_extra = {
            "example": {
                "transcription": "Bonjour, comment allez-vous ?",
                "reply": "Je vais bien, merci !",
                "history": [
                    {"role": "user", "content": "Bonjour, comment ça va ?"},
                    {"role": "assistant", "content": "Je vais bien, merci !"}
                ]
            }
        }
