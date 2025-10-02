from bson import ObjectId
from pydantic import BaseModel
from typing import Optional

from pydantic.v1 import validator


class CommentModel(BaseModel):

    user_email: Optional[str]
    titre: str
    rating: int
    contenu: str


class CommentModelDisplay(CommentModel):

    id: str

    @validator('id', pre=True, always=True)
    def validate_id(cls, value):
        """
        Valide et transforme l'identifiant de la session.

        Si l'identifiant est une instance de ObjectId (identifiant unique de MongoDB),
        il le convertit en chaîne. Sinon, il retourne la valeur inchangée.

        Args:
            value : La valeur du champ id à valider.

        Returns:
            La valeur de l'identifiant validé et éventuellement transformé.
        """
        if isinstance(value, ObjectId):
            return str(value)
        return value

