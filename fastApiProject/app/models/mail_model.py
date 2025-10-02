import re
from pydantic import BaseModel, validator


class InviteRequest(BaseModel):
    email: str  # Utilise le type EmailStr de Pydantic pour validation
    session_name: str

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