from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, HTTPException
from fastapi.params import Security
from dotenv import load_dotenv

from app.connector.replicate_client import ReplicateClient
from app.api.dependencies import get_current_user, check_user_role
from app.models.image_model import ImageRequest, ImageResponse
from app.crud.image_crud import ImageCRUD

load_dotenv()

router = APIRouter()

replicate_client = ReplicateClient()
image_crud = ImageCRUD(replicate_client)


@router.post("/generate-image/", response_model=ImageResponse)
async def generate_image_endpoint(
    request: ImageRequest,
    current_user=Security(get_current_user)
):
    """
    Endpoint pour générer une image à partir d'une phrase donnée.

    Args:
        request (ImageRequest): La requête pour génerer l'image.
        current_user: L'utilisateur actuel.

    Returns:
        ImageResponse: Les informations concernant l'image généré  .

    Raises:
        HTTPException: Si une érreur apparaît une erreur 500 est levé avec la description.
    """
    check_user_role(current_user, ["SuperAdmin",
                    "Formateur-int", "Formateur-ext", "Formé"])
    try:
        # Generate the image and create the timestamp
        created_at = datetime.now(timezone.utc)
        image_url = await image_crud.create_image(request.prompt, current_user.email, created_at)

        return ImageResponse(
            id=image_url["_id"],
            prompt=request.prompt,
            image_url=image_url["image_url"],
            created_at=created_at
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/user-images/", response_model=List[ImageResponse])
async def get_user_images(current_user=Security(get_current_user)):
    """
    Récupère les images de l'utilisateur actuel.

    Args:
        current_user (User): L'utilisateur actuellement authentifié, obtenu via la sécurité.

    Returns:
        List[ImageResponse]: Une liste d'objets ImageResponse représentant les images valides de l'utilisateur.

    Raises:
        HTTPException: Si une erreur se produit lors de la récupération des images, une exception HTTP 500 est levée avec le détail de l'erreur.
    """
    try:
        images = await image_crud.get_images_by_user(current_user.email)
        # Filtrage des images valides en utilisant `is_image_valid`
        valid_images = [image for image in images if image_crud.is_image_valid(
            image.get("created_at"))]
        return [ImageResponse(**image) for image in valid_images]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/delete-image/{image_id}")
async def delete_image(image_id: str):
    """
    Supprime une image par son identifiant.

    Args:
        image_id (str): L'identifiant de l'image à supprimer.

    Returns:
        dict: Le résultat de l'opération de suppression.

    Raises:
        HTTPException: Si une erreur se produit lors de la suppression de l'image.
    """
    try:
        result = await ImageCRUD(replicate_client).delete_image_by_id(image_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
