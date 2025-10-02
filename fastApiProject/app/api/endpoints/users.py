from fastapi import APIRouter, Depends, HTTPException, status, Security
from app.api.dependencies import get_current_user, check_user_role
from app.core.security import verify_sessions_token
from app.crud.users_crud import UserCRUD
from app.models.users_model import UserCreate, UserDisplay, UserUpdate
from typing import List


router = APIRouter()

user_crud = UserCRUD()


@router.get("/users/me", response_model=UserDisplay)
async def read_users_me(current_user: UserDisplay = Security(get_current_user)):
    """
    Récupère les détails de l'utilisateur actuellement authentifié.

    Args:
        current_user (UserDisplay): L'utilisateur actuellement authentifié.

    Returns:
        UserDisplay: Les détails de l'utilisateur actuellement authentifié.

    """
    return current_user


@router.post("/register", response_model=UserDisplay, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate):
    """
    Enregistre un nouvel utilisateur et renvoie les détails de l'utilisateur créé.

    Args:
        user_data (UserCreate): Données de l'utilisateur à créer, validées par le modèle UserCreate.


    Returns:
        UserDisplay: Les données de l'utilisateur créé.
    """

    new_user = user_crud.create_user(user_data)
    return new_user


@router.get("/", response_model=List[UserDisplay])
async def read_all_users(current_user=Security(get_current_user)):
    """
    Récupère tous les utilisateurs de la base de données.

    Args:
        current_user (UserDisplay): L'utilisateur actuellement authentifié.

    Returns:
        List[UserDisplay]: La liste des utilisateurs de la base de données.

    Raises:
        HTTPException: Si l'utilisateur n'est pas authentifié.

    """
    check_user_role(current_user, ["SuperAdmin",
                    "Formateur-int", "Formateur-ext"])

    try:
        users = user_crud.get_all_users()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    return [UserDisplay(**user) for user in users]


@router.get("/by-email/{email}", response_model=UserDisplay)
async def read_user_by_email(email: str, current_user=Security(get_current_user)):
    """
    Récupère un utilisateur par son adresse email.

    Args:
        email (str): L'adresse email de l'utilisateur à récupérer.
        current_user (UserDisplay): L'utilisateur actuellement authentifié.

    Returns:
        UserDisplay: Les données de l'utilisateur récupéré.

    Raises:
        HTTPException: Si l'utilisateur n'est pas authentifié.

    """
    check_user_role(current_user, ["SuperAdmin",
                    "Formateur-int", "Formateur-ext", "Formé"])

    user = user_crud.get_user_by_email(email)
    return user


@router.delete("/delete/{user_id}", response_model=bool)
async def delete_user_by_id(user_id: str, current_user=Security(get_current_user)):
    """
    Supprime un utilisateur de la base de données.

    Args:
        user_id (str): L'ID de l'utilisateur à supprimer.
        current_user (UserDisplay): L'utilisateur actuellement authentifié.

    Returns:
        bool: True si la suppression a réussi, False sinon.

    Raises:
        HTTPException: Si l'utilisateur n'est pas authentifié.

    """
    check_user_role(current_user, ["SuperAdmin"])

    success = user_crud.delete_user(user_id)
    return success


@router.put("/update/{email}", response_model=UserDisplay)
async def update_user(email: str, user_data: UserUpdate, current_user=Security(get_current_user)):
    """
    Met à jour les données d'un utilisateur.
    @param email:
    @param user_data:
    @param current_user:
    @return:

    Args:
        user_id (str): L'ID de l'utilisateur à mettre à jour.
        user_data (UserUpdate): Les données à mettre à jour, validées par le modèle UserUpdate.
        current_user (UserDisplay): L'utilisateur actuellement authentifié.

    Returns:
        UserDisplay: Les données de l'utilisateur mis à jour.

    """

    check_user_role(current_user, ["SuperAdmin",
                    "Formateur-int", "Formateur-ext"])
    updated_user = user_crud.update_user(email, user_data)
    return updated_user


@router.post("/login", response_model=UserDisplay)
async def login_user(current_user: UserDisplay = Security(get_current_user)):
    """
    Met à jour l'état en ligne de l'utilisateur lors de la connexion.

    Args:
        current_user (UserDisplay): L'utilisateur actuellement authentifié.

    Returns:
        UserDisplay: Les détails de l'utilisateur actuellement authentifié.

    """
    user = user_crud.get_user_by_email(current_user.email)
    if user:
        user_crud.set_user_active(user['email'])
    return user


@router.post("/set_inactive/{email}")
async def set_user_inactive(email: str, current_user=Security(get_current_user)):
    """
    Définit l'utilisateur comme inactif.

    Args:
        email (str): L'email de l'utilisateur à définir comme inactif.
        current_user (UserDisplay): L'utilisateur actuellement authentifié.

    Returns:
        dict: Un message indiquant que l'utilisateur a été défini comme inactif.
    """
    check_user_role(current_user, ["SuperAdmin",
                    "Formateur-int", "Formateur-ext", "Formé"])
    try:
        user_crud.set_user_inactive(email)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    return {"message": "User set as inactive"}
