import os
from typing import Optional

from dotenv import load_dotenv
from pydantic import SecretStr
from pydantic_settings import BaseSettings


env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '.env')
load_dotenv(env_path)


class Settings(BaseSettings):
    """
    Classe de configuration pour les paramètres de l'application.

    Attributs :
        SECRET_KEY (SecretStr) : La clé secrète pour le chiffrement.
        ALGORITHM (str) : L'algorithme de chiffrement JWT.
        ACCESS_TOKEN_EXPIRE_MINUTES (int) : La durée de validité du token d'accès.
        MONGO_DB_USERNAME (str) : Le nom d'utilisateur de la base de données MongoDB.
        MONGO_DB_PASSWORD (str) : Le mot de passe de la base de données MongoDB.
        MONGO_DB_NAME (str) : Le nom de la base de données MongoDB.
        OPENAI_KEY (Optional[str]) : La clé d'API OpenAI (si nécessaire).
        OPENAI_ORG (Optional[str]) : L'organisation OpenAI (si nécessaire).
        REPLICATE_API_KEY (Optional[str]) : La clé d'API Replicate (si nécessaire).
        MAILGUN_API_KEY (Optional[str]) : La clé d'API Mailgun (si nécessaire).

    """

    SECRET_KEY: SecretStr = SecretStr(os.getenv("SECRET_KEY", "change_this_in_production"))
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    MONGO_DB_USERNAME: str = os.getenv("MONGO_USERNAME")
    MONGO_DB_PASSWORD: str = os.getenv("MONGO_PASSWORD")
    MONGO_DB_NAME: str = os.getenv("MONGO_DB")

    OPENAI_KEY: Optional[str] = os.getenv("OPENAI_KEY")
    OPENAI_ORG: Optional[str] = os.getenv("OPENAI_ORG")

    REPLICATE_API_KEY: Optional[str] = os.getenv("REPLICATE_KEY")

    MAILGUN_API_KEY: Optional[str] = os.getenv("MAILGUN_API_KEY")

    class Config:
        extra = "allow"
        env_file = ".env"


settings = Settings()
