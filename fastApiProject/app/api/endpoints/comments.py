import uuid
from typing import List

from fastapi import APIRouter, Security, Form

from app.api.dependencies import get_current_user, check_user_role
from app.models.comments_model import CommentModelDisplay, CommentModel
from app.crud.comments_crud import CommentaireCRUD

router = APIRouter()

crud = CommentaireCRUD()


@router.post("/comments/create_comments", response_model=CommentModelDisplay, status_code=201)
async def create_commentaire(
        titre: str = Form(...),
        rating: int = Form(...),
        contenu: str = Form(...),
        current_user=Security(get_current_user)):
    """
    Création d'un nouveau commentaire.

    Args:
        titre (str): Le titre du commentaire.
        rating (int): La note du commentaire.
        contenu (str): La description de la note.
        current_user: Obtention de l'utilisateur actuel.

    Returns:
        CommentModelDisplay: Le commentaire formater avec le model pydantic.

    Raises:
        HTTPException: Une http exception si l'utilisateur n'as pas les accès.
    """
    check_user_role(current_user, ["SuperAdmin",
                                   "Formateur-int", "Formateur-ext", "Formé"])
    user_email = current_user.email
    user_id = str(uuid.uuid4())
    commentaire = CommentModelDisplay(
        id=user_id, user_email=user_email, titre=titre, rating=rating, contenu=contenu)
    return crud.add_comment(commentaire)


@router.post("/comments/read_all", response_model=List[CommentModel])
async def read_commentaires(current_user=Security(get_current_user)):
    """
    Autorise les superadmins a lire tout les commentaires.

    Args:
        current_user: Obtention de l'utilisateur actuel.

    Returns:
        List[CommentModel]: La liste de tout les commentaires.

    Raises:
        HTTPException: Si l'utilisateur n'est pas un SuperAdmin.
    """
    check_user_role(current_user, ["SuperAdmin"])
    return crud.get_all_comments()


@router.get("/comments/{comments_id}", response_model=CommentModel)
async def read_commentaire(commentaire_id: int, current_user=Security(get_current_user)):
    """
    Permet aux superadmins de retrouver un commentaire spécific grace a son id.

    Args:
        commentaire_id (int): l'id du commentaire a retrouver.
        current_user (User): L'utilisateur actuel.

    Returns:
        CommentModel: Les données du commentaire demander.

    Raises:
        HTTPException: Si l'utilisateur n'est pas un superadmin ou si le commentaire n'est pas trouvé.
    """
    check_user_role(current_user, ["SuperAdmin"])
    return crud.get_comment_by_id(commentaire_id)


@router.delete("/comments/{comments_id}", response_model=CommentModel)
async def delete_commentaire(commentaire_id: int, current_user=Security(get_current_user)):
    """
    Permet aux superadmins de supprimer un commentaire spécific grace a son id.
    Args:
        commentaire_id (int): L'id du commentaire a supprimer.
        current_user: L'utilisateur actuel.

    Returns:
        L'id du commentaire supprimer.

    Raises:
        HTTPException: Si l'utilisateur n'est pas un superadmin.
    """
    check_user_role(current_user, ["SuperAdmin"])
    return crud.delete_comment(commentaire_id)
