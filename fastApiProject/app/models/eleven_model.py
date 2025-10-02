# app/models/eleven_model.py
from typing import Optional, Literal
from datetime import datetime
from bson import ObjectId

from pydantic_core import core_schema
from pydantic import BaseModel, Field, field_validator

class PyObjectId(ObjectId):
    @classmethod
    def __get_pydantic_core_schema__(cls, _source, _handler):
        return core_schema.no_info_plain_validator_function(cls.validate)

    @classmethod
    def __get_pydantic_json_schema__(cls, _schema, _handler):
        return {"type": "string"}

    @classmethod
    def validate(cls, v):
        if v is None:
            return None
        if isinstance(v, ObjectId):
            return v
        try:
            return ObjectId(str(v))
        except Exception:
            raise ValueError("Invalid ObjectId")

class AgentBase(BaseModel):
    agent_id: str = Field(..., description="Identifiant de l'agent ElevenLabs")
    name: Optional[str] = Field(None, description="Nom affichable")
    avatar_url: Optional[str] = Field(None, description="URL de l'avatar")

    @field_validator('agent_id')
    def id_not_empty(cls, v):
        if not v.strip():
            raise ValueError('agent_id must not be empty')
        return v

    model_config = {
        "populate_by_name": True,
        "json_encoders": {ObjectId: str},
    }

class AgentDisplay(AgentBase):
    # Utiliser str pour l'id des agents externes
    id: Optional[str] = Field(alias='_id')

    model_config = {
        **AgentBase.model_config,
        "arbitrary_types_allowed": True,
        "json_schema_extra": {
            "example": {
                "_id": "agent_01jvy1234567890",
                "agent_id": "agent_01jvy1234567890",
                "name": "Assistant AI",
                "avatar_url": "https://elevenlabs.io/avatars/assistant.png"
            }
        }
    }

class SessionCreate(BaseModel):
    agent_id: str = Field(..., description="Agent choisi pour la session")
    model_config = {"populate_by_name": True}

class SessionDisplay(BaseModel):
    id: PyObjectId = Field(alias='_id')
    agent_id: str
    user_id: str
    started_at: datetime

    model_config = {
        "populate_by_name": True,
        "json_encoders": {ObjectId: str},
        "arbitrary_types_allowed": True,
    }

class MessageBase(BaseModel):
    session_id: str
    role: Literal['user', 'assistant']
    text: str
    audio_url: Optional[str] = None

    @field_validator('text')
    def text_not_empty(cls, v):
        if not v.strip():
            raise ValueError('text must not be empty')
        return v

    model_config = {"populate_by_name": True}

class MessageCreate(MessageBase):
    pass

class MessageDisplay(MessageBase):
    id: PyObjectId = Field(alias='_id')
    created_at: datetime

    model_config = {
        **MessageBase.model_config,
        "json_encoders": {ObjectId: str},
        "arbitrary_types_allowed": True,
    }
