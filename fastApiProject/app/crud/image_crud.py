from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any
import bson
from app.connector.replicate_client import ReplicateClient
from app.connector.connectorBDD import MongoAccess


class ImageCRUD:
    def __init__(self, replicate_client: ReplicateClient):
        self.db = MongoAccess().image_collection
        self.replicate_client = replicate_client

    @staticmethod
    def is_image_valid(created_at) -> bool:
        """
        Vérifie si une image est valide en fonction de sa date de création.

        Cette méthode compare la date de création de l'image avec l'heure actuelle
        en UTC et détermine si l'image a été créée il y a moins d'une heure.

        Args:
            created_at (Union[str, datetime]): La date de création de l'image. 
                Peut être une chaîne de caractères au format ISO 8601 ou un objet datetime.

        Returns:
            bool: True si l'image a été créée il y a moins d'une heure, sinon False.
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

    async def create_image(self, prompt: str, user_email: str, created_at: datetime.now(timezone.utc)) -> Dict[str, Any]:
        """
        Crée une image basée sur un prompt donné et enregistre les informations dans la base de données.

        Args:
            prompt (str): Le texte descriptif pour générer l'image.
            user_email (str): L'adresse e-mail de l'utilisateur qui a demandé l'image.
            created_at (datetime): La date et l'heure de création de l'image.

        Returns:
            Dict[str, Any]: Un dictionnaire contenant l'ID de l'image créée, un message de succès, 
                            et les données de l'image (prompt, URL de l'image, e-mail de l'utilisateur, date de création).
        """
        image_url = await self.replicate_client.generate_image(prompt)
        image_data = {
            "prompt": prompt,
            "image_url": image_url,
            "user_email": user_email,
            "created_at": created_at
        }
        result = self.db.insert_one(image_data)
        image_id = result.inserted_id
        return {
            "image_id": str(image_id),
            "message": "Image created successfully",
            **image_data
        }

    async def get_image(self, image_id: str) -> Dict[str, Any]:
        """
        Récupère une image à partir de son identifiant.

        Args:
            image_id (str): L'identifiant de l'image à récupérer.

        Returns:
            Dict[str, Any]: Un dictionnaire contenant les données de l'image.
        """
        return await self.db.find_one({"_id": bson.ObjectId(image_id)})

    async def get_images_by_user(self, user_email: str) -> List[Dict[str, Any]]:
        """
        Récupère les images associées à un utilisateur spécifique par son email.

        Args:
            user_email (str): L'email de l'utilisateur dont les images doivent être récupérées.

        Returns:
            List[Dict[str, Any]]: Une liste de dictionnaires représentant les images valides associées à l'utilisateur.
        """
        images_cursor = self.db.find({"user_email": user_email})
        valid_images = []
        for image in images_cursor:
            # Assurez-vous de passer le bon `created_at` à `is_image_valid`
            if 'created_at' in image and self.is_image_valid(image['created_at']):
                valid_images.append(image)
        return valid_images

    async def delete_image_by_id(self, image_id: str):
        """
        Supprime une image spécifique de la base de données en utilisant son ID.

        Args:
            image_id (str): L'ID de l'image à supprimer.

        Returns:
            dict: Un dictionnaire contenant un message indiquant si l'image a été supprimée avec succès ou non.

        Raises:
            Exception: Si la suppression de l'image échoue pour une raison quelconque.
        """
        try:
            delete_result = self.db.delete_one({"_id": bson.ObjectId(image_id)})
            if delete_result.deleted_count == 1:
                return {"message": "Image deleted successfully"}
            else:
                return {"message": "Image not found"}
        except Exception as e:
            raise Exception(f"Failed to delete image: {e}")
