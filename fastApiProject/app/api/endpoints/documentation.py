from fastapi import APIRouter, HTTPException, Security
from app.api.dependencies import get_current_user
from app.models.documentation_model import DocDisplay
from app.crud.documentation_crud import DocCRUD

router = APIRouter()


@router.get("/all_docs/", response_model=list[DocDisplay], status_code=201)
async def read_all_docs(current_user=Security(get_current_user)):
    """    
    Récupère tous les documents de la collection 'documentation_db'.

    Args:
        current_user: L'utilisateur actuel récupéré via la sécurité.

    Returns:
        list[doc_display]: Une liste d'objets doc_display représentant tous les documents.

    Raises:
        HTTPException: Si l'accès est refusé (utilisateur non authentifié).
    """
    if not current_user:
        raise HTTPException(status_code=403, detail="Access denied")
    doc_crud = DocCRUD()
    docs = doc_crud.get_all_docs()
    return docs

@router.get("/docs/", response_model=list[DocDisplay], status_code=201)
async def read_docs_by_categorie(categorie: str, current_user=Security(get_current_user)):
    """
    Récupère les documents de la collection 'documentation_db' par catégorie.

    Args:
        categorie (str): La catégorie des documents à récupérer.
        current_user: L'utilisateur actuel récupéré via la sécurité.

    Returns:
        list[doc_display]: Une liste d'objets doc_display représentant les documents de la catégorie donnée.

    Raises:
        HTTPException: Si l'accès est refusé (utilisateur non authentifié).
    """
    if not current_user:
        raise HTTPException(status_code=403, detail="Access denied")
    doc_crud = DocCRUD()
    docs = doc_crud.get_doc_by_categorie(categorie)
    return docs
