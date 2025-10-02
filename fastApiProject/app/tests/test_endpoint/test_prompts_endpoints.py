import pytest
from fastapi.testclient import TestClient
from main import app


client = TestClient(app)


class Testpromptsendpoints:

    def test_creation_prompts(self):
        """
        Tester la création de prompts via l'endpoint /prompts/create_prompt.

        Ce test envoie une requête POST à l'endpoint /prompts/create_prompt avec une charge utile JSON contenant un prompt utilisateur.
        Il vérifie que le code de statut de la réponse est 201, indiquant la création réussie du prompt.

        Endpoint:
            POST /prompts/create_prompt

        Payload:
            {
            "user_prompt": "quel est le diamètre de la terre au niveau de l'équateur et des pôles ?"
            }

        Assert:
            - Le code de statut de la réponse est 201.
        """
        response = client.post("/prompts/create_prompt", json={
                               "user_prompt": "quel est le diamètre de la terre au niveau de l'équateur et des pôles ?"})
        assert response.status_code == 201

    def test_get_all_prompts(self):
        """
        Tester l'endpoint pour récupérer tous les prompts.

        Ce test envoie une requête GET à l'endpoint /prompts/prompts et vérifie que le code de statut de la réponse est 200, indiquant une récupération réussie de tous les prompts.

        Endpoint:
            GET /prompts/prompts

        Assert:
            - Le code de statut de la réponse est 200.
        """
        response = client.get("/prompts/prompts")
        assert response.status_code == 200

    def test_prompt_id(self):
        """
        Teste l'endpoint pour récupérer un prompt par son ID.

        Cette méthode effectue les actions suivantes :
        1. Envoie une requête GET à l'endpoint "/prompts/prompts" pour récupérer la liste des prompts.
        2. Extrait l'ID du premier prompt de la liste.
        3. Envoie une requête GET à l'endpoint "/prompts/prompts/{id}" en utilisant l'ID extrait.
        4. Vérifie que le statut de la réponse est 200 (OK).

        Assure que l'endpoint pour récupérer un prompt par son ID fonctionne correctement.
        """
        response = client.get("/prompts/prompts")
        id = str(response.json()[0]["prompt_id"])
        print(id)
        response = client.get(f"/prompts/prompts/{id}")
        assert response.status_code == 200

    def test_update_prompt(self):
        """
        Test la mise à jour d'un prompt via l'endpoint PUT.

        Cette fonction effectue les étapes suivantes :
        1. Envoie une requête GET pour récupérer la liste des prompts.
        2. Extrait l'identifiant du premier prompt de la liste.
        3. Envoie une requête PUT pour mettre à jour le prompt avec un nouvel 'user_prompt' et 'generated_response'.
        4. Vérifie que le code de statut de la réponse est 200 (succès).
        5. Vérifie que le 'user_prompt' et le 'generated_response' de la réponse sont corrects.

        Assure que l'endpoint PUT pour la mise à jour des prompts fonctionne correctement.
        """
        response = client.get("/prompts/prompts")
        id = str(response.json()[0]["prompt_id"])
        response = client.put(f"/prompts/prompts/{id}", json={
                              "user_prompt": "Quel est la couleur d'un chat noir ?", "generated_response": "La couleur d'un chat noir est le noir."})
        assert response.status_code == 200
        assert response.json()[
            "user_prompt"] == "Quel est la couleur d'un chat noir ?"
        assert response.json()[
            "generated_response"] == "La couleur d'un chat noir est le noir."

    def test_delete_prompt(self):
        """
        Teste la suppression d'un prompt.

        Cette fonction effectue les étapes suivantes :
        1. Récupère la liste des prompts via une requête GET.
        2. Extrait l'identifiant du premier prompt de la liste.
        3. Supprime le prompt correspondant via une requête DELETE.
        4. Vérifie que le statut de la réponse est 200 (succès).
        5. Vérifie que le message de la réponse indique que le prompt a été supprimé avec succès.

        Asserts:
            - Le statut de la réponse DELETE doit être 200.
            - Le message de la réponse DELETE doit être {"message": "Prompt successfully deleted"}.
        """
        response = client.get("/prompts/prompts")
        id = str(response.json()[0]["prompt_id"])
        response = client.delete(f"/prompts/prompts/{id}")
        assert response.status_code == 200
        assert response.json() == {"message": "Prompt successfully deleted"}
