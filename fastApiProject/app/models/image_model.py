from typing import Optional
from datetime import datetime, timezone

from pydantic import BaseModel, Field, validator
from bson import ObjectId


class ImageRequest(BaseModel):
    """
    Classe représentant une requête d'image.

    Attributs:
        prompt (str): Une description textuelle de l'image souhaitée. Exemple: "Une ligne d'horizon de ville futuriste au coucher du soleil".
        created_at (datetime): La date et l'heure de création de la requête. Par défaut, il s'agit de la date et l'heure actuelles en UTC.
    """
    prompt: str = Field(..., example="A futuristic city skyline at sunset")
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc))


class ImageResponse(BaseModel):
    id: str = Field(default="", alias="_id")
    prompt: str
    image_url: str
    created_at: Optional[datetime]

    @validator('id', pre=True, always=True)
    def validate_id(cls, value):
        """
        Valide et transforme l'identifiant de la session.

        Si l'identifiant est une instance de ObjectId (identifiant unique de MongoDB),
        il le convertit en chaîne. Sinon, il retourne la valeur inchangée.

        Paramètres :
            value : La valeur du champ id à valider.

        Retourne :
            La valeur de l'identifiant validé et éventuellement transformé.
        """
        if isinstance(value, ObjectId):
            return str(value)
        return value

    class Config:
        orm_mode = True
