from typing import Optional

from pydantic import BaseModel, Field, validator
from bson import ObjectId


class PromptBase(BaseModel):
    """
    Classe de base pour les modèles de prompt. Contient les validations communes.
    """

    user_prompt: str

    @validator('user_prompt')
    def text_must_not_be_empty(cls, v):
        """
        Valide que le texte du prompt n'est pas vide.

        Args:
            v (str): Le texte du prompt à valider.

        Raises:
            ValueError: Si le texte du prompt est vide ou ne contient que des espaces.

        Returns:
            str: Le texte du prompt validé.
        """
        if not v.strip():
            raise ValueError('must not be empty')
        return v


# Classe pour l'affichage d'un prompt, incluant l'ID
class PromptDisplay(PromptBase):
    """
    Modèle pour l'affichage d'un prompt, incluant l'ID et la réponse générée.
    """
    user_email: str
    prompt_id: str
    message: Optional[str]
    user_prompt: str
    generated_response: str
    model_used: str
    page: str
    image: Optional[str] = None
    image_name: Optional[str] = None

    @validator('prompt_id', pre=True, always=True)
    def validate_id(cls, v):
        """
        Valide et convertit l'ID du prompt si nécessaire.

        Args:
            v (str | ObjectId): L'ID du prompt à valider.

        Returns:
            str: L'ID du prompt sous forme de chaîne de caractères.
        """
        if isinstance(v, ObjectId):
            return str(v)
        return v

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
        schema_extra = {
            "example": {
                "prompt_id": "60f1b3b3f3e3b3b3b3b3b3b3",
                "text": "Write a short story about a robot learning to cook.",
                "user_prompt": "Write a short story about a robot learning to cook.",
                "generated_response": "Once upon a time, there was a robot named RoboChef who wanted to learn how to cook.",
                "user_email": "johndoe@exemple.com",
                "model_used": "gpt",
                "page": "conversation",
                "image": "aukgouaphqkgycouagfdluqgifuyakgkqd",
                "image_name": "image.jpg"
            }
        }


# Classe pour la création d'un prompt, sans inclure l'ID car celui-ci est généré par MongoDB
class PromptCreate(PromptBase):
    """
    Modèle pour la création d'un prompt. Ne comprend pas l'ID.
    """

    user_prompt: str = Field(..., description="The prompt text")

    class Config:
        schema_extra = {
            "example": {
                "user_prompt": "Write a short story about a robot learning to cook."
            }
        }


# Modèle pour les opérations de mise à jour
class PromptUpdate(BaseModel):
    """
    Modèle pour la mise à jour d'un prompt. Permet de modifier certains champs.
    """
    user_prompt: Optional[str] = None
    generated_response: Optional[str] = None

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
