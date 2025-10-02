from typing import List

from app.connector.connectorBDD import MongoAccess
from app.models.comments_model import CommentModel, CommentModelDisplay


class CommentaireCRUD:

    def __init__(self):
        """
        Initialise une nouvelle instance de la classe avec une connexion à la collection 'commentaire' de la base de données MongoDB.
        """
        self.db = MongoAccess().commentaire_collection

    def get_all_comments(self) -> List[CommentModel]:
        """
        Récupère tous les commentaires de la base de données.

        Returns:
            List[CommentModel]: Une liste de modèles de commentaires.
        """
        comments = self.db.find()

        return [CommentModel(**comment) for comment in comments]



    def get_comment_by_id(self, id: int) -> CommentModel:
        """
        Récupère un commentaire par son identifiant.

        Args:
            id (int): L'identifiant unique du commentaire.

        Returns:
            CommentModel: Le modèle de commentaire correspondant à l'identifiant fourni.
        """
        comment = self.db.find_one({"id": id})
        return CommentModel(**comment)

    def add_comment(self, comment: CommentModelDisplay):
        """
        Ajoute un commentaire à la base de données.

        Args:
            comment (CommentModelDisplay): Le modèle de commentaire à ajouter.

        Returns:
            CommentModelDisplay: Le commentaire ajouté.
        """
        self.db.insert_one(comment.dict())
        return comment

    def delete_comment(self, id: int) -> CommentModel:
        """
        Supprime un commentaire en fonction de son identifiant.

        Args:
            id (int): L'identifiant du commentaire à supprimer.

        Returns:
            CommentModel: Le modèle de commentaire supprimé.
        """
        comment = self.get_comment_by_id(id)
        self.db.delete_one({"id": id})
        return comment