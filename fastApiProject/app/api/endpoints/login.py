from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

from app.auth.oauth2 import create_access_token
from app.api.dependencies import get_current_user
from app.core.config import settings
from app.crud.users_crud import UserCRUD
from app.models.token import Token
from app.models.users_model import UserDisplay

router = APIRouter()


@router.post("/token", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):

    """
    Authentification de l'utilisateur et génération d'un token.

    Args:
        form_data (OAuth2PasswordRequestForm): Le formulaire de demande de mot de passe OAuth2 contenant le nom d'utilisateur et le mot de passe.

    Returns:
        Token: Génération du token si l'authentification est réussie.

    Raises:
        HTTPException: Si le nom d'utilisateur ou le mot de passe est incorrect, une erreur 401 Unauthorized est levée.
    """
    user_crud = UserCRUD()

    user = user_crud.authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user_crud.set_user_active(user.email)
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/protected-route")
async def protected_route(user: UserDisplay = Depends(get_current_user)):
    """
    Une route protégée qui renvoie un message de salutation à l'utilisateur authentifié.

    Args:
        user (UserDisplay): L'utilisateur actuellement authentifié obtenu via le token JWT.

    Returns:
        dict: Un dictionnaire contenant un message de salutation à l'utilisateur authentifié.
    """
    return {"message": "Hello, " + user["email"]}
