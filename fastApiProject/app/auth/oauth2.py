from datetime import datetime, timedelta

from jose import jwt

from app.core.config import settings
from app.crud.users_crud import UserCRUD



user_crud = UserCRUD()


def create_access_token(data: dict, expires_delta: timedelta):
    """
    Créez un jeton d'accès en utilisant les données fournies et le temps d'expiration.

    Args:
        data (dict): Les données à encoder dans le jeton.
        expires_delta (timedelta): Le temps d'expiration du jeton.

    Returns:
        str: Le jeton d'accès encodé.
    """
    to_encode = data.copy()
    expire = datetime.utcnow() + expires_delta
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY.get_secret_value(), algorithm=settings.ALGORITHM)
    return encoded_jwt


def create_session_token(email: str, session_name: str, expires_delta: timedelta):
    """
    Créez un jeton de session en utilisant l'email fourni, les données de session et le temps d'expiration.

    Args:
        email (str): L'email de l'utilisateur.
        session_name (str): Le nom de la session à encoder dans le jeton.
        expires_delta (timedelta): Le temps d'expiration du jeton.

    Returns:
        str: Le jeton de session encodé.
    """
    payload = {
        "sub": email,
        "session_name": session_name
    }
    expire = datetime.utcnow() + expires_delta
    payload.update({"exp": expire})
    encoded_jwt = jwt.encode(payload, settings.SECRET_KEY.get_secret_value(), algorithm=settings.ALGORITHM)
    return encoded_jwt








