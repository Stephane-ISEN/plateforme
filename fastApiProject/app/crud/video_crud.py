from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any

import bson

from app.connector.replicate_client import ReplicateClient
from app.connector.connectorBDD import MongoAccess


class VideoCRUD:
    def __init__(self, replicate_client: ReplicateClient):
        """
        Initialise une nouvelle instance de la classe avec un client Replicate.

        Args:
            replicate_client (ReplicateClient): Le client Replicate utilisé pour les opérations de réplication.
        """
        self.db = MongoAccess().video_collection
        self.replicate_client = replicate_client

    @staticmethod
    def is_video_valid(created_at) -> bool:
        """
        Vérifie si une vidéo est valide en fonction de sa date de création.

        Cette méthode compare la date de création de la vidéo avec l'heure actuelle
        pour déterminer si la vidéo a été créée dans la dernière heure.

        Args:
            created_at (Union[str, datetime]): La date de création de la vidéo. 
                Peut être une chaîne de caractères au format ISO 8601 ou un objet datetime.

        Returns:
            bool: True si la vidéo a été créée dans la dernière heure, False sinon.
        """
        now = datetime.now(timezone.utc)

        # Vérifiez si `created_at` est déjà un objet datetime
        if isinstance(created_at, str):
            # Si c'est une chaîne de caractères, convertir en datetime
            created_at_datetime = datetime.fromisoformat(created_at)
        else:
            # Sinon, considérez qu'il s'agit déjà d'un datetime
            created_at_datetime = created_at

        # S'assurer que le datetime est bien en UTC
        if created_at_datetime.tzinfo is None:
            created_at_datetime = created_at_datetime.replace(tzinfo=timezone.utc)

        return (now - created_at_datetime) <= timedelta(hours=1)

    async def create_video(self, prompt: str, user_email: str, created_at: datetime.now(timezone.utc)) -> Dict[str, Any]:
        """
        Crée une nouvelle vidéo en utilisant le client Replicate et insère les données de la vidéo dans la base de données.

        Args:
            prompt (str): Le texte de l'invite pour générer la vidéo.
            user_email (str): L'adresse e-mail de l'utilisateur qui crée la vidéo.
            created_at (datetime): La date et l'heure de création de la vidéo.

        Returns:
            Dict[str, Any]: Un dictionnaire contenant l'ID de la vidéo, un message de succès et les données de la vidéo.
        """
        video_url = await self.replicate_client.generate_video(prompt)
        video_data = {
            "prompt": prompt,
            "video_url": video_url,
            "user_email": user_email,
            "created_at": created_at
        }
        result = self.db.insert_one(video_data)
        video_id = result.inserted_id
        return {
            "video_id": str(video_id),
            "message": "Video created successfully",
            **video_data
        }

    async def get_video(self, video_id: str) -> Dict[str, Any]:
        """
        Récupère une vidéo à partir de son identifiant.

        Args:
            video_id (str): L'identifiant de la vidéo à récupérer.

        Returns:
            Dict[str, Any]: Un dictionnaire contenant les informations de la vidéo.
        """
        return await self.db.find_one({"_id": bson.ObjectId(video_id)})

    async def get_videos_by_user(self, user_email: str) -> List[Dict[str, Any]]:
        """
        Récupère les vidéos associées à un utilisateur spécifique.

        Args:
            user_email (str): L'adresse email de l'utilisateur dont les vidéos doivent être récupérées.

        Returns:
            List[Dict[str, Any]]: Une liste de dictionnaires représentant les vidéos valides associées à l'utilisateur.
        """
        video_cursor = self.db.find({"user_email": user_email})
        valid_video = []
        for video in video_cursor:
            # Assurez-vous de passer le bon `created_at` à `is_image_valid`
            if 'created_at' in video and self.is_video_valid(video['created_at']):
                valid_video.append(video)
        return valid_video

    async def delete_video_by_id(self, video_id: str):
        """
        Supprime une image spécifique de la base de données en utilisant son ID.

        Args:
            video_id (str): L'ID de l'image à supprimer.

        Returns:
            dict: Le résultat de l'opération de suppression.

        Raises:
            Exception: Si la suppression de la vidéo échoue.
        """
        try:
            delete_result = self.db.delete_one({"_id": bson.ObjectId(video_id)})
            if delete_result.deleted_count == 1:
                return {"message": "Video deleted successfully"}
            else:
                return {"message": "Video not found"}
        except Exception as e:
            raise Exception(f"Failed to delete video: {e}")
