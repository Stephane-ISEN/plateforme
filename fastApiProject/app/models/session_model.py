from typing import List, Optional
from datetime import datetime, timedelta
import re

from pydantic import BaseModel, Field, validator
from bson import ObjectId
from email_validator import validate_email, EmailNotValidError


class SessionBase(BaseModel):
    """
    Modèle de base pour les informations de session.

    Attributs :
        emails (List[str]) : Une liste d'adresses e-mail des participants.
        description (Optional[str]) : Une description optionnelle de la session. Par défaut à None.
        start_time (datetime) : L'heure de début de la session.
        end_time (datetime) : L'heure de fin de la session.
        formateur_name (str) : nom du formateur qui a créé la liste.
    """

    session_name: str
    description: Optional[str] = None
    start_time: datetime
    end_time: datetime = None
    formateur_name: str
    emails: List[str]

    @validator('end_time', pre=True, always=True)
    def set_default_end_time(cls, v, values):
        return v or (values['start_time'] + timedelta(hours=2) if 'start_time' in values else None)

    @validator('emails', each_item=True)
    def validate_emails(cls, v):
        try:
            valid = validate_email(v)
            return valid.email
        except EmailNotValidError as e:
            raise ValueError(f'Invalid email: {e}')


class SessionDisplay(SessionBase):
    """
    Modèle pour l'affichage des informations de session,
    étendant le modèle de base de session avec un identifiant.

    Attributs hérités de session_base et :
        id (str) : L'identifiant unique de la session,
        représenté sous forme de chaîne. Par défaut à une chaîne vide.

    Le champ 'id' est aliasé à '_id' pour s'aligner avec la structure de document de MongoDB.
    """
    id: str = Field(default="", alias="_id")

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


class SessionUpdate(BaseModel):
    """
    Modèle pour la mise à jour des informations de session.

    Tous les champs sont optionnels, permettant des mises à jour partielles des données de la session.

    Attributs :
        emails (Optional[List[str]]) : Une liste d'adresses e-mail des participants. Par défaut à None.
        description (Optional[str]) : La description de la session. Par défaut à None.
        start_time (Optional[datetime]) : L'heure de début de la session. Par défaut à None.
        end_time (Optional[datetime]) : L'heure de fin de la session. Par défaut à None.
        formateur_name (Optional[str]) : nom du formateur qui a créé la liste. Par défaut à None.

    La classe interne Config comprend des paramètres pour autoriser les types arbitraires
    et pour personnaliser les encodeurs JSON.
    Elle fournit également un exemple de charge utile dans 'schema_extra' pour illustrer
    un usage typique.
    """
    emails: Optional[List[str]] = None
    description: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    formateur_name: Optional[str] = None

    @validator('emails', each_item=True, pre=True)
    def validate_email(cls, value):
        """
        Valide que l'adresse email est dans un format correct.
        """
        email_regex = r"[^@]+@[^@]+\.[^@]+"
        if not re.match(email_regex, value):
            raise ValueError(f"{value} n'est pas une adresse email valide")
        return value

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {}
        schema_extra = {
            "example": {
                "emails": ["johndoe@example.com", "janesmith@example.com"],
                "description": "A beginner's session on the basics of AI and machine learning.",
                "start_time": datetime.now(),
                "end_time": datetime.now() + timedelta(hours=24),
                "formateur_name": "John Doe"
            }
        }
