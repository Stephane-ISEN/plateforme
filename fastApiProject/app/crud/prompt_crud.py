from typing import List
import base64
import os
from io import BytesIO

import bson
from pymongo.results import DeleteResult
import google.generativeai as genai
import openai
from openai import OpenAI
import mistralai
from mistralai import Mistral
from dotenv import load_dotenv
from PIL import Image

from app.models.prompt_model import PromptUpdate
from app.connector.connectorBDD import MongoAccess

load_dotenv()

api_key = os.environ["GOOGLE_API_KEY"]

genai.configure(api_key=api_key)

client_mistral = Mistral(api_key=os.environ['MISTRAL_API_KEY'])


client = OpenAI(
    api_key=os.environ['OPENAI_KEY'],
    organization=os.environ['OPENAI_ORG']
)
openai.base_url = "https://api.openai.com/v1"
openai.default_headers = {"x-foo": "true"}


class PromptCRUD:
    """
     Une classe pour gérer les opérations CRUD (Créer, Lire, Mettre à jour, Supprimer)
     sur les prompts dans une base de données MongoDB.

    """

    def __init__(self):
        """
        Initialise une nouvelle instance de la classe PromptCRUD.

        Args:
            prompt_db (Collection): Une instance de Collection de pymongo pointant vers la base de données des prompts.
        """
        self.db = MongoAccess().prompt_collection

    def encode_image(self, image_path):
        """
        Encode une image en base64.

        Args:
            image_path (str): Le chemin vers le fichier image à encoder.

        Returns:
            str: La représentation de l'image encodée en base64.
        """
        with open(image_path, "rb") as image_file:
            return base64.b64encode(image_file.read()).decode('utf-8')

    def generate_prompt(self, prompt_data, user_email: str, page: str):
        """
        Génère une invite pour une conversation avec un assistant IA en utilisant les données fournies et l'historique des conversations.

        Args:
            prompt_data (dict): Les données de l'invite, incluant le texte de l'utilisateur et éventuellement une image en base64.
            user_email (str): L'adresse email de l'utilisateur pour récupérer l'historique des conversations.
            page (str): La page ou le contexte de la conversation.

        Returns:
            str: La réponse générée par l'assistant IA.
        """
        user_prompt = prompt_data["user_prompt"]
        historique = list(self.db.find({"user_email": user_email, "model_used": "gpt", "page": page}, {
                          "generated_response": 1, "user_prompt": 1,  "_id": 0}))
        messages = [{"role": "system",
                     "content": "This is a conversation with an AI assistant. The AI assistant is helpful, creative, clever, and very friendly."}]
        for doc in historique:
            messages.append({"role": "user", "content": doc["user_prompt"]})
            messages.append(
                {"role": "assistant", "content": doc["generated_response"]})
        if "image" in prompt_data and prompt_data["image"] is not None:
            base64_image = prompt_data["image"]
            messages.append({"role": "user", "content":[
                {"type": "text", "text": user_prompt},
                {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}}
            ]})
            print(f"il y'a bien un fichier")
        else:
            messages.append({"role": "user", "content": user_prompt})
            print(f"il n'y a pas de fichier")
        completion = client.chat.completions.create(
            model="gpt-4o",
            messages=messages,

        )
        reply = completion.choices[0].message.content
        return reply

    def create_prompt(self, prompt_data: dict, user_email: str, page: str) -> dict:
        """
        Crée une nouvelle entrée de prompt pour GPT dans la base de données.

        Args:
            prompt_data (dict): Les données du prompt fournies par l'utilisateur.
            user_email (str): L'adresse email de l'utilisateur.
            page (str): La page où le prompt est utilisé.

        Returns:
            dict: Un dictionnaire contenant l'ID du prompt créé, un message de succès, 
              le prompt de l'utilisateur, la réponse générée, l'email de l'utilisateur, 
              le modèle utilisé, la page, l'image (le cas échéant) et le nom de l'image (le cas échéant).
        """
        generated_content = self.generate_prompt(
            prompt_data, user_email=user_email, page=page)
        if "image" in prompt_data and prompt_data["image"] is not None:
            document = {
                "user_email": prompt_data["user_email"],
                "user_prompt": prompt_data["user_prompt"],
                "generated_response": generated_content,
                "model_used": "gpt",
                "page": page,
                "image": prompt_data["image"],
                "image_name": prompt_data["image_name"]
            }
        else :
            document = {
                "user_email": prompt_data["user_email"],
                "user_prompt": prompt_data["user_prompt"],
                "generated_response": generated_content,
                "model_used": "gpt",
                "page": page,
                "image": None,
                "image_name": None    
            }
        result = self.db.insert_one(document)
        prompt_id = result.inserted_id

        return {
            "prompt_id": str(prompt_id),
            "message": "Prompt created successfully",
            "user_prompt": prompt_data["user_prompt"],
            "generated_response": generated_content,
            "user_email": prompt_data["user_email"],
            "model_used": "gpt",
            "page": page,
            "image": document["image"],
            "image_name": document["image_name"]
        }

    def create_prompt_gemini(self, prompt_data, user_email: str, page: str) -> dict:
        """
        Crée un prompt pour le modèle Gemini-1.5-pro et enregistre l'historique des interactions.
        Args:
            prompt_data (dict): Les données du prompt, incluant le prompt de l'utilisateur et éventuellement une image.
            user_email (str): L'adresse email de l'utilisateur.
            page (str): La page associée au prompt.
        Returns:
            dict: Un dictionnaire contenant l'ID du prompt créé, un message de succès, le prompt de l'utilisateur,
              la réponse générée, l'email de l'utilisateur, le modèle utilisé, la page, l'image (si présente),
              et le nom de l'image (si présent).
        """
        model = genai.GenerativeModel('gemini-1.5-pro')

        user_prompt = prompt_data["user_prompt"]

        history_documents = list(self.db.find({"user_email": user_email, "model_used": "gemini-1.5-pro", "page": page}, {
                                 "generated_response": 1, "user_prompt": 1,  "_id": 0}))
        history = []
        for doc in history_documents:
            history.append(
                {"parts": [{"text": doc["user_prompt"]}], "role": "user"})
            history.append(
                {"parts": [{"text": doc["generated_response"]}], "role": "model"})
            
        if "image" in prompt_data and prompt_data["image"] is not None:
            chat = model.start_chat(history=history)
            file = base64.b64decode(prompt_data["image"])
            image = Image.open(BytesIO(file))
            generated_response = chat.send_message([image,user_prompt])
            generated_response = generated_response.text
        else:
            chat = model.start_chat(history=history)
            generated_response = chat.send_message(user_prompt)
            generated_response = generated_response.text
        if "image" in prompt_data:
            document = {
                "user_email": prompt_data["user_email"],
                "user_prompt": user_prompt,
                "generated_response": generated_response,
                "model_used": "gemini",
                "page": page,
                "image":prompt_data["image"],
                "image_name": prompt_data["image_name"]
            }
        else:
            document = {
                "user_email": prompt_data["user_email"],
                "user_prompt": user_prompt,
                "generated_response": generated_response,
                "model_used": "gemini",
                "page": page,
                "image": None,
                "image_name": None
            }
        new_prompt = self.db.insert_one(document)
        prompt_id = new_prompt.inserted_id
        return {
            "prompt_id": str(prompt_id),
            "message": "Prompt created successfully",
            "user_prompt": user_prompt,
            "generated_response": generated_response,
            "user_email": prompt_data["user_email"],
            "model_used": "gemini",
            "page": page,
            "image":document["image"],
            "image_name": document["image_name"]
        }
    
    def create_prompt_mistralai(self, prompt_data, user_email: str, page: str) -> dict:

        model = "pixtral-12b-2409" if "image" in prompt_data else "mistral-large-latest"

        # Récupérer l'historique des messages
        history_documents = list(self.db.find(
            {"user_email": user_email, "model_used": "Mistral", "page": page},
            {"generated_response": 1, "user_prompt": 1,  "_id": 0}))

        # Construire la liste des messages en simplifiant le champ content
        messages = []
        for doc in history_documents:
            messages.append({
                "role": "user",
                "content": doc["user_prompt"] 
            })
            messages.append({
                "role": "assistant",
                "content": doc["generated_response"] 
            })
        print(messages)

        # Ajouter le prompt utilisateur courant
        user_prompt = prompt_data["user_prompt"]
        messages.append({
            "role": "user",
            "content": user_prompt  # Again, plain string
        })

        # Si une image est incluse, l'ajouter aux messages
        if "image" in prompt_data and prompt_data["image"] is not None:
            image_base64 = prompt_data["image"]
            messages.append({
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": user_prompt
                    },
                    {
                        "type": "image_url",
                        "image_url": f"data:image/jpeg;base64,{image_base64}"
                    }]
            })

        # Envoyer les messages au modèle Mistral via l'API
        response = client_mistral.chat.complete(
            model=model,
            messages=messages
        )

        # Créer un document à insérer dans la base de données
        document = {
            "user_email": prompt_data["user_email"],
            "user_prompt": user_prompt,
            "generated_response": response.choices[0].message.content,
            "model_used": "mistral",
            "page": page,
            "image": prompt_data.get("image"),
            "image_name": prompt_data.get("image_name")
        }

        # Insérer dans la base de données et récupérer l'ID du nouveau prompt
        new_prompt = self.db.insert_one(document)
        prompt_id = new_prompt.inserted_id

        # Retourner les détails du prompt créé
        return {
            "prompt_id": str(prompt_id),
            "message": "Prompt created successfully",
            "user_prompt": user_prompt,
            "generated_response": response.choices[0].message.content,
            "user_email": prompt_data["user_email"],
            "model_used": "mistral",
            "page": page,
            "image": document.get("image"),
            "image_name": document.get("image_name")
        }

    def get_list_prompts(self) -> list:
        """
        Récupère une liste de tous les prompts stockés dans la base de données.

        Returns:
            list: Une liste de dictionnaires, chacun représentant un prompt et sa réponse générée.

        Raises:
            Exception: Si une erreur survient lors de la récupération des prompts.
        """
        try:
            prompts = list(
                self.db.find())
            if not prompts:
                return []  # Retourne une liste vide si aucun prompt n'est trouvé
            return prompts
        except Exception as e:
            # Gérer les erreurs potentielles ici
            print(f"An error occurred while fetching prompts: {str(e)}")
            raise e

    def get_prompt(self, prompt_id) -> dict:
        """
        Récupère un prompt spécifique par son ID.

        Args:
            prompt_id (str): L'ID du prompt à récupérer.

        Returns:
            dict: Un dictionnaire représentant le prompt trouvé, ou None si aucun prompt n'est trouvé.
        """
        return self.db.find_one({"_id": bson.ObjectId(prompt_id)})

    def get_prompts_by_user(self, user_email: str) -> List[dict]:
        """
        Retrouve les prompts en fonction de l'utilisateur.

        Args:
            user_email (str): L'email de l'utilisateur.

        Returns:
            List[dict]: La liste de prompt lié a l'utilisateur.
        """
        return list(self.db.find({"user_email": user_email}))

    def get_prompts_by_user_model(self, user_email: str, model) -> List[dict]:
        """
        Récupère une liste de prompts créés par un utilisateur spécifique.

        Args:
            user_email (str): L'ID de l'utilisateur dont on veut récupérer les prompts.

        Returns:
            List[dict]: Une liste de dictionnaires représentant les prompts créés par l'utilisateur.

        """
        return list(self.db.find({"user_email": user_email, "model_used": model}))

    def get_prompts_by_user_model_page(self, user_email: str, model, page) -> List[dict]:
        """
        Récupère les prompts par utilisateur, modèle et page.

        Args:
            user_email (str): L'adresse email de l'utilisateur.
            model: Le modèle utilisé.
            page: La page spécifique.

        Returns:
            List[dict]: Une liste de dictionnaires contenant les prompts correspondant aux critères spécifiés.
        """

        return list(self.db.find({"user_email": user_email, "model_used": model, "page": page}))

    def get_prompt_by_id_and_user(self, prompt_id: str, user_id: str) -> dict:
        """
        Récupère un prompt spécifique par son ID et l'ID de l'utilisateur qui l'a créé.

        Args:
            prompt_id: L'ID du prompt à récupérer.
            user_id: L'ID de l'utilisateur qui a créé le prompt.

        Returns:
            dict: Un dictionnaire représentant le prompt trouvé, ou None si aucun prompt n'est trouvé.

        """
        return self.db.find_one({"_id": bson.ObjectId(prompt_id), "user_id": user_id})

    def update_prompt_by_id(self, prompt_id: str, update_data: PromptUpdate) -> dict:
        """
        Met à jour un prompt existant dans la base de données en utilisant l'ID fourni.

        Args:
            prompt_id (str): L'ID du prompt à mettre à jour.
            update_data (dict): Un dictionnaire contenant les champs à mettre à jour.

        Returns:
            dict: Le résultat de l'opération de mise à jour.
        """
        # Mettre à jour le prompt en utilisant les données validées

        updated_data = {k: v for k, v in update_data.dict().items()
                        if v is not None}
        if updated_data:
            self.db.update_one({"_id": bson.ObjectId(prompt_id)}, {
                               "$set": updated_data})
        return self.get_prompt(prompt_id)

    def delete_prompt_by_id(self, prompt_id) -> DeleteResult:
        """
        Supprime un prompt spécifique de la base de données en utilisant son ID.

        Args:
            prompt_id (str): L'ID du prompt à supprimer.

        Returns:
            dict: Le résultat de l'opération de suppression.
        """
        # Effectuer la suppression du prompt spécifié par prompt_id
        return self.db.delete_one({"_id": bson.ObjectId(prompt_id)})
