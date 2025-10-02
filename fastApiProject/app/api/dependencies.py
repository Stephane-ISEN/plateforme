from typing import Annotated, List, Optional

from fastapi import Depends, HTTPException, status, WebSocket
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from app.core.config import settings
from app.crud.users_crud import UserCRUD
from app.models.token import TokenData
from app.models.users_model import UserDisplay


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login/token")

user_crud = UserCRUD()


async def get_current_user(token: Annotated[str, Depends(oauth2_scheme)]):
    """
    Récupère l'utilisateur actuel à partir du token JWT.

    Args:
        token (Annotated[str, Depends(oauth2_scheme)]): Le token JWT.

    Returns:
        UserDisplay: L'utilisateur actuel.

    Raises:
        HTTPException: Si les informations du token ne sont pas valides.

    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY.get_secret_value(), algorithms=settings.ALGORITHM)
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(email=username)
    except JWTError:
        raise credentials_exception
    user = user_crud.get_user_by_email(email=token_data.email)
    if user is None:
        raise credentials_exception
    return UserDisplay(**user)


def check_user_role(current_user: UserDisplay, required_roles: List[str]):
    """
    Vérifie si l'utilisateur actuel possède un des rôles requis.

    Args:
        current_user (UserDisplay): L'utilisateur actuellement authentifié.
        required_roles (List[str]): La liste des rôles requis pour accéder à la ressource.

    Raises:
        HTTPException: Si l'utilisateur n'a pas le rôle requis.
    """
    if not any(role in current_user.roles for role in required_roles):
        raise HTTPException(status_code=403, detail="Access Denied: Insufficient permissions")


async def get_current_user_ws(token: str):
    """
    Récupère l'utilisateur actuel à partir du token JWT pour les connexions WebSocket.

    Args:
        token (str): Le token JWT.

    Returns:
        UserDisplay: L'utilisateur actuel.

    Raises:
        HTTPException: Si les informations du token ne sont pas valides.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY.get_secret_value(), algorithms=settings.ALGORITHM)
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(email=username)
    except JWTError:
        raise credentials_exception
    user = user_crud.get_user_by_email(email=token_data.email)
    if user is None:
        raise credentials_exception
    return UserDisplay(**user)


def check_user_role_ws(current_user: UserDisplay, required_roles: List[str]):
    """
    Vérifie si l'utilisateur actuel possède un des rôles requis pour les connexions WebSocket.

    Args:
        current_user (UserDisplay): L'utilisateur actuellement authentifié.
        required_roles (List[str]): La liste des rôles requis pour accéder à la ressource.

    Raises:
        HTTPException: Si l'utilisateur n'a pas le rôle requis.
    """
    if not any(role in current_user.roles for role in required_roles):
        raise HTTPException(status_code=403, detail="Access Denied: Insufficient permissions")