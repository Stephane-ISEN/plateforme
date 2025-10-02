from pydantic import BaseModel


class DocBase(BaseModel):
    """
    Classe DocBase représentant un modèle de documentation.

    Attributs:
        title (str): Le titre de la documentation.
        url (str): L'URL de la documentation.
        avatar (str): L'avatar associé à la documentation.
        description (str): La description de la documentation.
    """

    title:  str
    url: str
    avatar: str
    description: str
    categorie: str


class DocDisplay(BaseModel):
    """
    DocDisplay est un modèle Pydantic utilisé pour représenter les informations d'affichage d'un document.

    Attributs:
        title (str): Le titre du document.
        url (str): L'URL où le document peut être consulté.
        description (str): Une brève description du document.
    """

    title: str
    url: str
    description: str
    categorie: str
    