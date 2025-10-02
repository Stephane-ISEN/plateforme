from typing import List

from bson import ObjectId

from app.connector.connectorBDD import MongoAccess
from app.models.session_model import SessionBase, SessionUpdate


class SessionCRUD:
    """
    Une classe utilisée pour gérer les opérations CRUD sur des documents de session dans une collection MongoDB.
    
    Args:
        db (Collection) : Une instance de collection MongoDB utilisée pour le stockage des données de session.
    """
    
    def __init__(self):
        """
        Initialise une nouvelle instance de la classe.

        Cette méthode initialise l'attribut `db` en le configurant pour accéder à la collection
        des sessions dans la base de données MongoDB via `MongoAccess`.

        Args:
            db (Collection): La collection des sessions dans la base de données MongoDB.
        """
        self.db = MongoAccess().sessions_collection

    def create_session(self, session_data: SessionBase):
        """
        Crée une nouvelle session dans la base de données.

        Args:
            session_data (SessionBase): Les données de la session à créer.

        Returns:
            dict: La nouvelle session créée avec son identifiant unique.
        """
        session_data_dict = session_data.dict()
        result = self.db.insert_one(session_data_dict)
        new_session = self.db.find_one({"_id": result.inserted_id})
        return new_session

    def get_all_sessions(self, skip: int = 0, limit: int = 10) -> List[dict]:
        """
        Récupère tous les documents de session de la base de données.

        Args:
            skip (int) : Le nombre de documents à ignorer. Par défaut à 0.
            limit (int) : Le nombre maximum de documents à retourner. Par défaut à 10.

        Returns:
            List[dict] : Une liste de documents de session.
        """
        sessions = self.db.find()
        return list(sessions)

    def get_session(self, session_id: str) -> dict:
        """
        Récupère un seul document de session par son ID.

        Args:
            session_id (str) : L'ID de la session à récupérer.

        Returns:
            dict : Le document de session s'il est trouvé, None sinon.
        """
        return self.db.find_one({"_id": ObjectId(session_id)})
    
    def delete_session(self, session_id: str) -> bool:
        """
        Supprime un document de session par son ID.

        Args:
            session_id (str) : L'ID de la session à supprimer.

        Returns:
            bool : True si un document a été supprimé, False sinon.
        """
        result = self.db.delete_one({"_id": ObjectId(session_id)})
        return True if result.deleted_count > 0 else False
    
    def update_session(self, session_id: str, session_data: SessionUpdate) -> dict:
        """
        Met à jour un document de session existant.

        Args:
            session_id (str) : L'ID de la session à mettre à jour.
            session_data (session_update) : Une instance de session_update avec les données de session mises à jour.

        Returns:
            dict : Le document de session mis à jour.
        """
        updated_data = {k: v for k, v in session_data.dict().items() if v is not None}
        if updated_data:
            self.db.update_one({"_id": ObjectId(session_id)}, {"$set": updated_data})
        return self.get_session(session_id)
