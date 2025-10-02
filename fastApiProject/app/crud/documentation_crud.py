from typing import List

from app.connector.connectorBDD import MongoAccess
from app.models.documentation_model import DocDisplay


class DocCRUD:
    """
    Classe pour gérer les opérations CRUD pour la collection de documentation dans la base de données.
    """
    def __init__(self):
        self.db = MongoAccess().documentation_collection

    def get_all_docs(self) -> List[DocDisplay]:
        """
        Récupère tous les documents.

        Cette méthode interroge la base de données pour récupérer tous les documents
        et les retourne sous forme de liste d'objets DocDisplay.

        Returns:
            List[DocDisplay]: Une liste de tous les documents sous forme d'objets DocDisplay.
        """
        docs = self.db.find()
        return [DocDisplay(**doc) for doc in docs]
    
    def get_doc_by_categorie(self, categorie: str) -> List[DocDisplay]:
        """
        Récupère les documents par catégorie.

        Cette méthode interroge la base de données pour récupérer les documents
        d'une catégorie donnée et les retourne sous forme de liste d'objets DocDisplay.

        Args:
            categorie (str): La catégorie des documents à récupérer.

        Returns:
            List[DocDisplay]: Une liste des documents de la catégorie donnée sous forme d'objets DocDisplay.
        """
        docs = self.db.find({"categorie": categorie})
        return [DocDisplay(**doc) for doc in docs]
    
