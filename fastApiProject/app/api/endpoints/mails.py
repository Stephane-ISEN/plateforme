import json
from datetime import timedelta
import requests
from fastapi import APIRouter, HTTPException, Security
import os

from app.api.dependencies import get_current_user, check_user_role
from app.auth.oauth2 import create_session_token
from app.models.mail_model import InviteRequest

router = APIRouter()


mailgun_key = os.environ.get('MAILGUN_API_KEY')  # Assurez-vous que la clé est correcte
domain_name = "mail.ai-explorer.tech"

if not mailgun_key:
    raise HTTPException(status_code=500, detail="MAILGUN_API_KEY environment variable not set")


@router.post("/send_invite/")
def send_invite(request: InviteRequest, current_user=Security(get_current_user)):
    """
    Point de terminaison pour envoyer un email d'invitation à un utilisateur.

    Ce point de terminaison permet aux utilisateurs avec des rôles spécifiques d'envoyer un email d'invitation à une adresse email spécifiée.
    L'email d'invitation contient un lien avec un jeton de session qui expire dans 1 jour.

    Arguments:
        request (InviteRequest): Le corps de la requête contenant l'email et le nom de la session.
        current_user: L'utilisateur authentifié actuel, obtenu via la dépendance de sécurité.

    Lève:
        HTTPException: Si la variable d'environnement MAILGUN_API_KEY n'est pas définie.
        HTTPException: S'il y a une erreur de communication avec Mailgun.
        HTTPException: S'il y a une erreur interne du serveur.

    Retourne:
        dict: Un message indiquant le succès ou l'échec de l'envoi de l'email d'invitation.
    """
    check_user_role(current_user, ["SuperAdmin", "Formateur-int", "Formateur-ext"])
    try:
        email = request.email
        session_name = request.session_name
        expires = timedelta(days=1)
        session_token = create_session_token(email=email, session_name=session_name, expires_delta=expires)

        # Création du lien avec le token
        invite_link = f"https://ai-explorer.tech/sign-up?session_token={session_token}"

        # Envoi du mail via Mailgun
        response = requests.post(
            f"https://api.eu.mailgun.net/v3/{domain_name}/messages",
            auth=("api", mailgun_key),
            data={
                "from": f"Ai Explorer's team <postmaster@{domain_name}>",
                "to": email,
                "subject": "Invitation à rejoindre notre plateforme",
                "template": "invitation template",
                "h:X-Mailgun-Variables": json.dumps({
                    "invite_link": invite_link,
                    "session_name": session_name,
                    "email": email
                })
            }
        )

        # Vérification du code de réponse
        if response.status_code == 200:
            return {"message": "Invitation envoyée avec succès"}
        else:
            raise HTTPException(status_code=response.status_code, detail=f"Mailgun error: {response.text}")

    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Error communicating with Mailgun: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
