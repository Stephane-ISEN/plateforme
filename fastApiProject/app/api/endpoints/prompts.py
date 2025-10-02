from typing import List, Annotated
import base64

from fastapi import APIRouter, HTTPException, status, Security, UploadFile, Form

from app.api.dependencies import get_current_user, check_user_role
from app.crud.prompt_crud import PromptCRUD
from app.models.prompt_model import PromptDisplay, PromptUpdate



router = APIRouter()

class PromptServices:
    def __init__(self):
        self.prompt_crud = PromptCRUD()

    async def files(self, file: UploadFile ):
        if file:
            images_bytes = await file.read()
            image_base64 = base64.b64encode(images_bytes).decode("utf-8")
            return {"image": image_base64, "image_name": file.filename}
        return {"image": None, "image_name": None}

    def transform_prompt(self, prompt):
        transformed_prompt = {
            "user_email": prompt["user_email"],
            "user_prompt": prompt["user_prompt"],
            "generated_response": prompt["generated_response"],
            "prompt_id": str(prompt.get("_id", None)),
            "message": None,
            "model_used": prompt["model_used"],
            "page": prompt["page"],
            "image": prompt["image"],
            "image_name": prompt["image_name"]
        }
        return transformed_prompt

    async def create_prompt(self, user_prompt: str, page: str, current_user, file: UploadFile, model_type: str):

        prompt_data = {
            "user_email": current_user.email,
            "user_prompt": user_prompt
        }
        file_data = await self.files(file)
        prompt_data.update(file_data)

        if model_type == "gpt":
            return self.prompt_crud.create_prompt(prompt_data, current_user.email, page)
        elif model_type == "gemini":
            return self.prompt_crud.create_prompt_gemini(prompt_data, current_user.email, page)
        elif model_type == "mistral":
            return self.prompt_crud.create_prompt_mistralai(prompt_data, current_user.email, page)


prompt_services = PromptServices()


@router.post("/create_prompt/{model_type}", response_model=PromptDisplay, status_code=status.HTTP_201_CREATED)
async def create_prompt(
    model_type: str,
    page: str,
    user_prompt: Annotated[str, Form()],
    file: Annotated[UploadFile, None] = None,
    current_user=Security(get_current_user)
):
    """
    Crée un nouveau prompt et renvoie les détails du prompt créé.

    Args:
        user_prompt (str): Le texte du prompt à créer.
        page (str): La page associée au prompt.
        current_user: L'utilisateur actuellement authentifié (utilisé pour obtenir l'email).
        file (UploadFile, optional): Un fichier optionnel à télécharger.

    Returns:
        PromptDisplay: Les données du prompt créé, y compris l'ID et la réponse générée.
    """
    new_prompt = await prompt_services.create_prompt(user_prompt, page, current_user, file, model_type)
    return PromptDisplay(**new_prompt)


@router.get("/list_prompt_model", response_model=List[PromptDisplay])
async def list_prompts_model(model, current_user=Security(get_current_user)):
    """
    Récupère une liste de tous les prompts stockés dans la base de données.

    Args:
        model: Le modèle à utiliser pour générer les prompts.
        current_user: L'utilisateur actuellement authentifié (non utilisé directement ici, mais nécessaire pour la sécurité).


    Returns:
        List[PromptDisplay]: Une liste des prompts, chacun formaté selon le modèle PromptDisplay.
    """
    check_user_role(current_user, ["SuperAdmin",
                    "Formateur-int", "Formateur-ext", "Formé"])

    prompts = prompt_services.prompt_crud.get_prompts_by_user_model(current_user.email, model)
    transformed_prompts = []

    for prompt in prompts:
        transformed_prompt = prompt_services.transform_prompt(prompt)
        transformed_prompts.append(transformed_prompt)

    # Utilisation du modèle PromptDisplay avec les données transformées
    return [PromptDisplay(**prompt) for prompt in transformed_prompts]


@router.get("/list_prompts_page", response_model=List[PromptDisplay])
async def list_prompts_page(model, page, current_user=Security(get_current_user)):
    """
    Point de terminaison pour lister les prompts pour une page et un modèle spécifiques.

    Args:
        model (str): Le modèle utiliser pour générer les prompts.
        page (int): Le nom de la page pour récupérer les prompts.
        current_user (User): L'utilisateur actuellement authentifié, obtenu via la dépendance de sécurité.

    Returns:
        List[PromptDisplay]: Une liste de prompts transformés en modèle PromptDisplay.

    Raises:
        HTTPException: Si l'utilisateur n'a pas le rôle requis.

    Notes:
        - L'utilisateur doit avoir l'un des rôles suivants : "SuperAdmin", "Formateur-int", "Formateur-ext", "Formé".
        - Les prompts sont filtrés en fonction de l'email de l'utilisateur, du modèle spécifié et du numéro de page.
    """
    check_user_role(current_user, ["SuperAdmin",
                    "Formateur-int", "Formateur-ext", "Formé"])

    prompts = prompt_services.prompt_crud.get_prompts_by_user_model_page(
        current_user.email, model, page)
    transformed_prompts = []

    for prompt in prompts:
        transformed_prompt = prompt_services.transform_prompt(prompt)
        transformed_prompts.append(transformed_prompt)

    # Utilisation du modèle PromptDisplay avec les données transformées
    return [PromptDisplay(**prompt) for prompt in transformed_prompts]


@router.get("/list_prompt_user", response_model=List[PromptDisplay])
async def list_prompts_user(current_user=Security(get_current_user)):
    """
    Retrouve la liste de prompt lié a l'utilisateur.
    
    Parameters:
    - current_user: L'utilisateur actuel .
    
    Returns:
    - La liste des prompts sous forme de liste de promptdisplay .
    """
    check_user_role(current_user, ["SuperAdmin",
                    "Formateur-int", "Formateur-ext", "Formé"])
    prompts = prompt_services.prompt_crud.get_prompts_by_user(current_user.email)
    transformed_prompts = []

    for prompt in prompts:
        transformed_prompt = prompt_services.transform_prompt(prompt)
        transformed_prompts.append(transformed_prompt)

    # Utilisation du modèle PromptDisplay avec les données transformées
    return [PromptDisplay(**prompt) for prompt in transformed_prompts]


@router.get("/prompts/{prompt_id}", response_model=PromptDisplay)
async def get_prompt(prompt_id: str, current_user=Security(get_current_user)):
    """
    Récupère les détails d'un prompt spécifique par son ID.

    Args:
        prompt_id (str): L'ID du prompt à récupérer.

        current_user: L'utilisateur actuellement authentifié (non utilisé directement ici, mais nécessaire pour la sécurité).

    Returns:
        PromptDisplay: Les données du prompt demandé.

    Raises:
        HTTPException: Si le prompt n'est pas trouvé.
    """
    check_user_role(current_user, ["SuperAdmin",
                    "Formateur-int", "Formateur-ext", "Formé"])

    prompt = prompt_services.prompt_crud.get_prompt(prompt_id)
    if prompt is None:
        raise HTTPException(status_code=404, detail="Prompt not found")

    transformed_prompt = prompt_services.transform_prompt(prompt)

    # Utilisation du modèle PromptDisplay avec les données transformées
    return PromptDisplay(**transformed_prompt)


@router.put("/prompts/{prompt_id}", response_model=PromptDisplay)
async def update_prompt(prompt_id: str, prompt_update: PromptUpdate, current_user=Security(get_current_user)):
    """
    Met à jour un prompt existant par son ID.

    Args:
        prompt_id (str): L'ID du prompt à mettre à jour.
        prompt_update (PromptUpdate): Les données pour mettre à jour le prompt, validées par le modèle PromptUpdate.

        current_user: L'utilisateur actuellement authentifié (non utilisé directement ici, mais nécessaire pour la sécurité).

    Returns:
        PromptDisplay: Les données mises à jour du prompt.

    Raises:
        HTTPException: Si le prompt à mettre à jour n'est pas trouvé.
    """
    check_user_role(current_user, ["SuperAdmin",
                    "Formateur-int", "Formateur-ext", "Formé"])

    updated_result = prompt_services.prompt_crud.update_prompt_by_id(prompt_id, prompt_update)

    updated_prompt = prompt_services.prompt_crud.get_prompt(prompt_id)
    transformed_prompt = prompt_services.transform_prompt(updated_prompt)
    return PromptDisplay(**transformed_prompt)
