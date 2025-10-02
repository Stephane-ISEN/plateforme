import os

from fastapi import APIRouter, status, Security, BackgroundTasks
from fastapi.responses import FileResponse

from app.api.dependencies import get_current_user, check_user_role
from app.crud.prompt_crud import PromptCRUD
from app.utilitaires.utf8_fpdf import FPDF_UTF8


router = APIRouter()
prompt_crud = PromptCRUD()


def cleanup_file(file_path: str):
    """Supprime le fichier temporaire."""
    if os.path.exists(file_path):
        os.remove(file_path)


@router.get("/create_pdf", status_code=status.HTTP_201_CREATED)
async def create_pdf(background_tasks: BackgroundTasks, current_user=Security(get_current_user)):
    """
    Crée un nouveau pdf et renvoie les détails du pdf créé.

    Args:
        current_user: L'utilisateur actuellement authentifié (utilisé pour obtenir l'email).

    Returns:
        FileResponse: Le fichier PDF à télécharger.
    """

    check_user_role(current_user, ["SuperAdmin", "Formateur-int", "Formateur-ext", "Formé"])
    email = current_user.email
    dialogues = prompt_crud.get_prompts_by_user(email)

    pdf = FPDF_UTF8(format='letter')
    pdf.add_page()
    pdf.set_font("Arial", size=12)
    pdf.cell(200, 10, txt="Ceci est le document résumé de la séssion", ln=True, align='C')
    for dialogue in dialogues:
        pdf.set_font("Arial", size=12)
        prompt_text = f"Prompt: {dialogue['user_prompt']}"
        response_text = f"Réponse: {dialogue['generated_response']}"
        pdf.multi_cell(200, 10, txt=prompt_text, align='L')
        pdf.multi_cell(200, 10, txt=response_text, align='L')
    
    # Chemin temporaire pour enregistrer le fichier PDF
    file_path = f"{email}_résumé.pdf"
    pdf.output(file_path)
    
    # Ajoute la tâche en arrière-plan pour supprimer le fichier après l'envoi
    background_tasks.add_task(cleanup_file, file_path)
    
    return FileResponse(file_path, filename=file_path, media_type='application/pdf')