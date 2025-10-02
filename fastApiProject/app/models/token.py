from pydantic import BaseModel

from app.models.users_model import UserDisplay


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: str | None = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserDisplay