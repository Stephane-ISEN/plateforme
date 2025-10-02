import io
from datetime import datetime, timedelta

from email_validator import EmailNotValidError
from fastapi import APIRouter, HTTPException, Security, Form, UploadFile, File
from pydantic.v1 import  validate_email
import pandas as pd

from app.api.dependencies import get_current_user, check_user_role
from app.models.session_model import SessionBase, SessionDisplay, SessionUpdate
from app.crud.sessions_crud import SessionCRUD



router = APIRouter()
session_crud = SessionCRUD()


@router.post("/create_session", response_model=SessionDisplay, status_code=201)
async def create_session(
        session_name: str = Form(...),
        description: str = Form(None),
        formateur_name: str = Form(...),
        start_time: str = Form(...),
        file: UploadFile = File(None),
        current_user=Security(get_current_user)
):
    """
    Créer une nouvelle session.

    Ce point de terminaison permet la création d'une nouvelle session avec les détails fournis.
    Il valide les données d'entrée, traite le fichier téléchargé pour les adresses e-mail,
    et crée une nouvelle session dans la base de données.

    Args:
        session_name (str): Le nom de la session.
        description (str, optionnel): Une description de la session. Par défaut à None.
        formateur_name (str): Le nom du formateur.
        start_time (str): L'heure de début de la session au format ISO (YYYY-MM-DDTHH:MM:SS).
        file (UploadFile, optionnel): Un fichier optionnel contenant une liste d'adresses e-mail. Par défaut à None.
        current_user: L'utilisateur actuellement authentifié.

    Returns:
        SessionDisplay: Les détails de la session créée.

    Raise:
        HTTPException: Si start_time n'est pas au format ISO valide.
        HTTPException: Si une adresse e-mail dans le fichier téléchargé n'est pas valide.
    """
    check_user_role(current_user, ["SuperAdmin",
                    "Formateur-int", "Formateur-ext"])
    try:
        start_time = datetime.fromisoformat(start_time)
    except ValueError:
        raise HTTPException(
            status_code=400, detail="Invalid datetime format. Use ISO format (YYYY-MM-DDTHH:MM:SS)")

    emails_list = []
    if file:
        content = await file.read()
        file_type = file.filename.split('.')[-1]
        if file_type in ['csv', 'txt']:
            emails_list = content.decode().splitlines()
        elif file_type in ['xls', 'xlsx']:
            df = pd.read_excel(io.BytesIO(content))
            emails_list = df.iloc[:, 0].tolist()

    valid_emails = []
    for email in emails_list:
        try:
            valid = validate_email(email)
            valid_emails.append(valid[1])
        except EmailNotValidError:
            raise HTTPException(
                status_code=400, detail=f"Invalid email format: {email}")

    session_data = SessionBase(
        session_name=session_name,
        description=description,
        formateur_name=formateur_name,
        start_time=start_time,
        end_time=start_time + timedelta(hours=24),
        emails=valid_emails
    )
    new_session = session_crud.create_session(session_data)
    return SessionDisplay(**new_session)


@router.get("/all_session/", response_model=list[SessionDisplay])
async def read_all_session(current_user=Security(get_current_user)):
    """
    Récupère toutes les sessions de la base de données.

    Args:
        current_user: L'utilisateur actuellement authentifié (non utilisé directement ici, mais nécessaire pour la sécurité).

    Returns:
        list[session_display] : Une liste d'objets session_display représentant toutes les sessions.
    """
    check_user_role(current_user, ["SuperAdmin",
                    "Formateur-int", "Formateur-ext"])
    sessions = session_crud.get_all_sessions()
    return [SessionDisplay(**session) for session in sessions]


@router.get("/get/{session_id}", response_model=SessionDisplay)
async def get_session(session_id: str, current_user=Security(get_current_user)):
    """
    Récupère une session par son identifiant.

    Args:
        session_id (str) : L'identifiant unique de la session.
        current_user: L'utilisateur actuellement authentifié (non utilisé directement ici, mais nécessaire pour la sécurité).

    Returns:
        session_display : Les données de la session correspondant à l'identifiant fourni.
    """
    check_user_role(current_user, ["SuperAdmin",
                    "Formateur-int", "Formateur-ext", "Formé"])
    session = session_crud.get_session(session_id)
    return session


@router.delete("/delete/{session_id}")
async def delete_session(session_id: str, current_user=Security(get_current_user)):
    """
    Supprime une session en fonction de son identifiant.

    Args:
        session_id (str) : L'identifiant unique de la session à supprimer.
        current_user: L'utilisateur actuellement authentifié (non utilisé directement ici, mais nécessaire pour la sécurité).

    Returns:
        dict : Confirmation de la suppression.
    """
    check_user_role(current_user, ["SuperAdmin", "Formateur-int", "Formateur-ext"])
    delete = session_crud.delete_session(session_id)
    return delete


@router.put("/update/{session_id}", response_model=SessionDisplay)
async def update_session(session_id: str, session_update_data: SessionUpdate, current_user=Security(get_current_user)):
    """
    Met à jour une session en fonction de son identifiant.

    Args:
        session_id (str) : L'identifiant unique de la session à mettre à jour.
        session_update_data (session_update) : Données pour la mise à jour de la session.
        current_user: L'utilisateur actuellement authentifié (non utilisé directement ici, mais nécessaire pour la sécurité).

    Returns:
        session_display : Les données de la session mise à jour.

    Raise:
        HTTPException : Si la session ne peut pas être trouvée pour la mise à jour.
    """
    check_user_role(current_user, ["SuperAdmin",
                    "Formateur-int", "Formateur-ext"])
    updated_session = session_crud.update_session(
        session_id, session_update_data)
    if updated_session:
        return updated_session
    raise HTTPException(status_code=404, detail="Session not found")
