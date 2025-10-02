from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, HTTPException
from fastapi.params import Security
from dotenv import load_dotenv

from app.connector.replicate_client import ReplicateClient
from app.api.dependencies import get_current_user, check_user_role
from app.models.video_model import VideoRequest, VideoResponse
from app.crud.video_crud import VideoCRUD


load_dotenv()

router = APIRouter()

replicate_client = ReplicateClient()
video_crud = VideoCRUD(replicate_client)


@router.post("/generate-video/", response_model=VideoResponse)
async def generate_video_endpoint(
        request: VideoRequest,
        current_user=Security(get_current_user)
):
    """
    Génère une vidéo basée sur une invite textuelle.

    Args:
        request (VideoRequest): L'invite pour générer une vidéo.
        current_user: L'utilisateur authentifié actuel.

    Returns:
        VideoResponse: L'URL de la vidéo générée.
    """
    check_user_role(current_user, ["SuperAdmin",
                    "Formateur-int", "Formateur-ext", "Formé"])
    try:
        # Generate the image and create the timestamp
        created_at = datetime.now(timezone.utc)
        video_url = await video_crud.create_video(request.prompt, current_user.email, created_at)

        return VideoResponse(
            id=video_url["_id"],
            prompt=request.prompt,
            video_url=video_url["video_url"],
            created_at=created_at
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/user-videos/", response_model=List[VideoResponse])
async def get_user_videos(current_user=Security(get_current_user)):
    """
    Récupère la liste des vidéos générées par l'utilisateur authentifié, uniquement celles qui sont valides.

    Args:
        current_user: L'utilisateur actuellement authentifié, obtenu via la sécurité.

    Returns:
        Une liste de réponses de vidéos valides appartenant à l'utilisateur authentifié.

    Raises:
        HTTPException: Si une erreur se produit lors de la récupération des vidéos.
    """
    try:
        videos = await video_crud.get_videos_by_user(current_user.email)
        # Filtrage des images valides en utilisant `is_image_valid`
        valid_videos = [video for video in videos if video_crud.is_video_valid(
            video.get("created_at"))]
        return [VideoResponse(**video) for video in valid_videos]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/delete-video/{video_id}")
async def delete_video(video_id: str):
    """
    Supprime une vidéo par son identifiant.

    Args:
        video_id (str): L'identifiant de la vidéo à supprimer.

    Returns:
        dict: Le résultat de l'opération de suppression.

    Raises:
        HTTPException: Si une erreur survient lors de la suppression de la vidéo.
    """
    try:
        result = await VideoCRUD(replicate_client).delete_video_by_id(video_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
