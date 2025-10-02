from fastapi import HTTPException
from bson import ObjectId

from app.connector.connectorBDD import MongoAccess
from app.models.users_model import UserCreate, UserUpdate, UserInDB, DEFAULT_ROLE
from app.core.security import verify_password


class UserCRUD:
    def __init__(self):
        """
        Initialise une nouvelle instance de la classe UserCRUD pour gérer les opérations CRUD sur les utilisateurs.

        Args:
            users_db (Collection): Une instance de Collection de pymongo pointant vers la base de données des utilisateurs.
        """

        self.db = MongoAccess().users_collection

    def create_user(self, user_data: UserCreate):
        """
        Crée un nouvel utilisateur dans la base de données.

        Args:
            user_data (UserCreate): Les données de l'utilisateur à créer.

        Raises:
            HTTPException: Si l'email est déjà enregistré dans la base de données.

        Returns:
            dict: Les données de l'utilisateur créé, avec le mot de passe haché et les rôles par défaut si non spécifiés.
        """
        if self.db.find_one({"email": user_data.email}):

            raise HTTPException(status_code=400, detail="Email already registered")
        user_data_dict = user_data.dict()
        user_data_dict["hashed_password"] = user_data_dict["password"]
        del user_data_dict['password']

        if "roles" not in user_data_dict or not user_data_dict["roles"]:
            user_data_dict["roles"] = [DEFAULT_ROLE]

        self.db.insert_one(user_data_dict)
        return user_data_dict

    def authenticate_user(self, username: str, password: str):
        """
        Authentifie un utilisateur en vérifiant son nom d'utilisateur et son mot de passe.

        Args:
            username (str): Le nom d'utilisateur ou l'email de l'utilisateur.
            password (str): Le mot de passe de l'utilisateur.

        Returns:
            UserInDB: Une instance de UserInDB si l'authentification réussit.
            None: Si l'utilisateur n'est pas trouvé ou si le mot de passe est incorrect.
        """
        user = self.db.find_one({"email": username})

        if not user:
            return None
        if not verify_password(password, user['hashed_password']):
            return None
        return UserInDB(**user)

    def get_user(self, user_id: str) -> dict:
        """
        Récupère un utilisateur à partir de son identifiant.

        Args:
            user_id (str): L'identifiant de l'utilisateur à récupérer.

        Returns:
            dict: Un dictionnaire contenant les informations de l'utilisateur, ou None si l'utilisateur n'est pas trouvé.
        """
        return self.db.find_one({"_id": ObjectId(user_id)})

    def get_all_users(self):
        """
        Récupère tous les utilisateurs de la base de données.

        Returns:
            list: Une liste de tous les utilisateurs.
        """
        users = self.db.find()
        return list(users)

    def get_user_by_email(self, email: str):
        """
        Récupère un utilisateur par son adresse e-mail.

        Args:
            email (str): L'adresse e-mail de l'utilisateur à rechercher.

        Returns:
            dict: Un dictionnaire contenant les informations de l'utilisateur.

        Raises:
            HTTPException: Si aucun utilisateur n'est trouvé avec l'adresse e-mail fournie.
        """
        user = self.db.find_one({'email': email})
        if user is None:
            raise HTTPException(status_code=404, detail="User not found")
        return user

    def update_user(self, email: str, user: UserUpdate) -> dict:
        """
        Met à jour les informations d'un utilisateur existant.

        Args:
            email (str): L'email de l'utilisateur à mettre à jour.
            user (UserUpdate): Un objet contenant les nouvelles informations de l'utilisateur.

        Returns:
            dict: Un dictionnaire représentant l'utilisateur mis à jour.

        Raises:
            HTTPException: Si l'email est vide ou si aucun champ valide n'est fourni pour la mise à jour.
        """
        original_data = user.dict(exclude_unset=True)
        update_data = {}

        if "email" in original_data:
            update_data["email"] = original_data["email"]
            if not update_data["email"]:
                raise HTTPException(status_code=400, detail="Email cannot be empty")

        if "roles" in original_data:
            update_data["roles"] = original_data["roles"]
            if not update_data["roles"]:
                update_data["roles"] = [DEFAULT_ROLE]

        if "is_active" in original_data:
            update_data["is_active"] = original_data["is_active"]

        if update_data:
            self.db.update_one({"email": email}, {"$set": update_data})
        else:
            raise HTTPException(status_code=400, detail="No valid fields provided for update")

        # Retourner l'utilisateur mis à jour
        return self.db.find_one({"email": email})

    def delete_user(self, user_id: str) -> bool:
        """
        Supprime un utilisateur de la base de données.

        Args:
            user_id (str): L'identifiant de l'utilisateur à supprimer.

        Returns:
            bool: True si l'utilisateur a été supprimé avec succès.

        Raises:
            HTTPException: Si l'utilisateur avec l'identifiant donné n'est pas trouvé.
        """
        result = self.db.delete_one({"_id": ObjectId(user_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="User not found")
        return True

    def set_user_active(self, email: str):
        """
        Active un utilisateur en définissant son statut 'is_active' à True.

        Args:
        email (str): L'adresse email de l'utilisateur à activer.

        Returns:
        None
        """
        self.db.update_one({"email": email}, {"$set": {"is_active": True}})

    def set_user_inactive(self, email: str):
        """
        Désactive un utilisateur en définissant son statut 'is_active' à False.

        Args:
        email (str): L'adresse e-mail de l'utilisateur à désactiver.

        Returns:
        None
        """
        self.db.update_one({"email": email}, {"$set": {"is_active": False}})