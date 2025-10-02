import re

from bson import ObjectId
from pydantic import BaseModel, Field, validator, SecretStr
from typing import Optional, List
from passlib.context import CryptContext

from app.core.utils import load_roles, get_default_role, ROLES_FILEPATH

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Charger les rôles et le rôle par défaut depuis le fichier JSON
ROLES = load_roles(ROLES_FILEPATH)
DEFAULT_ROLE = get_default_role(ROLES_FILEPATH)


# Modèle de base pour l'utilisateur
class UserBase(BaseModel):
    """
    Classe de base pour les modèles d'utilisateur. Contient les champs communs à tous les modèles d'utilisateur.
    """
    email: str
    is_active: Optional[bool] = False
    roles: List[str] = Field(default_factory=lambda: [DEFAULT_ROLE])

    @validator('email')
    def validate_email(cls, value):
        """
        Valide que l'adresse email est dans un format correct.

        Args:
            value (str): L'adresse email à valider.

        Raises:
            ValueError: Si l'adresse email n'est pas valide.

        Returns:
            str: L'adresse email validée.
        """
        email_regex = r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"

        if not re.match(email_regex, value):
            raise ValueError(f"{value} n'est pas une adresse email valide")

        return value

    @validator('roles', each_item=True)
    def validate_role(cls, value):
        """
        Valide que le rôle est un rôle valide.

        Args:
            value (str): Le rôle à valider.

        Raises:
            ValueError: Si le rôle n'est pas valide.

        Returns:
            str: Le rôle validé.

        """
        if value not in ROLES:
            raise ValueError(f"{value} n'est pas un rôle valide")
        return value


# Modèle pour la création d'un utilisateur, inclut le mot de passe
class UserCreate(UserBase):
    """
    Modèle pour la création d'un utilisateur. Inclut un champ pour le mot de passe.
    """
    password: str

    @validator('password')
    def hash_password(cls, value: str) -> str:
        """
        Valide que le mot de passe a une longueur minimale.

        Args:
            value (str): Le mot de passe à valider.

        Raises:
            ValueError: Si le mot de passe est trop court.

        Returns:
            str: Le mot de passe validé.
        """
        if len(value) < 6:
            raise ValueError("Le mot de passe doit comporter au moins 6 caractères.")
        return pwd_context.hash(value)  # Retourne le mot de passe déjà haché


# Modèle pour l'affichage d'un utilisateur, inclut l'ID
class UserDisplay(UserBase):
    """
    Modèle pour l'affichage des informations d'un utilisateur. Inclut l'ID de l'utilisateur.
    """
    id: str = Field(default="", alias="_id")

    # Utiliser un validateur pour convertir l'ObjectId en str si nécessaire
    @validator('id', pre=True, allow_reuse=True)
    def validate_id(cls, value):
        """
        Convertit un ObjectId MongoDB en string pour l'affichage.

        Args:
            value (ObjectId | str): L'ID de l'utilisateur à valider.

        Returns:
            str: L'ID de l'utilisateur sous forme de chaîne de caractères.
        """
        if isinstance(value, ObjectId):
            return str(value)
        return value

    class Config:
        json_schema_extra = {
            "example": {
                "email": "johndoe@example.com",
                "is_active": False,
                "id": "507f1f77bcf86cd799439011",
                "roles": ["SuperAdmin"],
                "hashed_password": "hashed_password_here"
            }
        }


class UserInDB(UserBase):
    """
    Modèle pour les utilisateurs stockés dans la base de données. Inclut le mot de passe haché.
    """
    hashed_password: SecretStr

    class Config:
        json_schema_extra = {
            "example": {
                "email": " email@mail.fr",
                "is_active": False,
                "id": "507f1f77bcf86cd799439011",
                "roles": ["SuperAdmin"],
                "hashed_password": "hashed_password_here"
            }
            , "title": "UserInDB"
        }


# Modèle pour les opérations de mise à jour
class UserUpdate(BaseModel):
    """
    Modèle pour la mise à jour des informations d'un utilisateur. Permet de modifier le nom d'utilisateur, l'email et l'état actif.
    """
    email: Optional[str] = None
    is_active: Optional[bool] = None
    roles: Optional[list] = None

    class Config:
        arbitrary_types_allowed = False
        json_encoders = {ObjectId: str}


# Modèle pour le changement de mot de passe
class PasswordChange(BaseModel):
    old_password: str
    new_password: str
    confirm_new_password: str

    @validator('new_password')
    def validate_new_password(cls, value, values, **kwargs):
        if value != values.get('confirm_new_password'):
            raise ValueError('Passwords do not match')
        return value


