from fastapi import HTTPException
from passlib.context import CryptContext
from jose import jwt, JWTError
from starlette import status
from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
credentials = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )


def hash_password(password):
    """
    Hash le mot de passe avec bcrypt.

    Args:
        password (str): Le mot de passe à hasher.

    Returns:
        str: Le mot de passe hashé.
    """
    return pwd_context.hash(password)


def verify_password(password, hashed_password):
    """
    Vérifie si le mot de passe correspond au mot de passe hashé.

    Args:
        password (str): Le mot de passe à vérifier.
        hashed_password (str): Le mot de passe hashé.

    Returns:
        bool: True si le mot de passe correspond, False sinon.
    """
    return pwd_context.verify(password, hashed_password)


def verify_access_token(token: str) -> str:
    """
    Vérifie l'access token et retourne le nom d'utilisateur.

    Args:
        token (str): L'access token à vérifier.

    Returns:
        str: Le nom d'utilisateur.

    Raises:
        HTTPException: Si le token est invalide ou si le nom d'utilisateur est absent du token.
    """
    credentials_exception = credentials
    try:
        payload = jwt.decode(token, settings.SECRET_KEY.get_secret_value(), algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        return username
    except JWTError:
        raise credentials_exception


def verify_sessions_token(token: str) -> str:
    """
    Vérifie le token de session et retourne le nom d'utilisateur.

    Args:
        token (str): Le token de session à vérifier.

    Returns:
        str: Le nom d'utilisateur.

    Raises:
        HTTPException: Si le token est invalide ou si le nom d'utilisateur est absent du token.
    """
    credentials_exception = credentials
    try:
        payload = jwt.decode(token, settings.SECRET_KEY.get_secret_value(), algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        return username
    except JWTError:
        raise credentials_exception
