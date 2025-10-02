import pytest
from fastapi.testclient import TestClient
from main import app


client = TestClient(app)

class Testsessionsendpoints:
    
    def test_creation_sessions(self):
        """
        Teste la création d'une session via l'endpoint /sessions/create.

        Cette fonction envoie une requête POST à l'endpoint /sessions/create avec un payload JSON contenant les informations
        de la session à créer. Elle vérifie ensuite que le code de statut de la réponse est 201 (Créé) et que le contenu JSON
        de la réponse correspond aux données envoyées.

        Payload:
        - name : "test"
        - description : "test"
        - start_time : "2022-01-01T00:00:00"
        - end_time : "2022-01-01T01:00:00"
        - participants : ["test1", "test2"]

        Assert:
        - Le code de statut de la réponse doit être 201.
        - Le contenu JSON de la réponse doit correspondre aux données envoyées.
        """
        response = client.post("/sessions/create", json={"name" : "test", "description" : "test", "start_time" : "2022-01-01T00:00:00",
                                                        "end_time" : "2022-01-01T01:00:00", "participants" : ["test1","test2"]})
        assert response.status_code == 201
        assert response.json() == {"name" : "test", "description" : "test", "start_time" : "2022-01-01T00:00:00",
                                    "end_time" : "2022-01-01T01:00:00", "participants" : ["test1","test2"]}
        
    def test_get_all_sessions(self):
        """
        Teste la récupération de toutes les sessions.

        Cette méthode envoie une requête GET à l'endpoint "/sessions/all_session/"
        et vérifie que le code de statut de la réponse est 200, indiquant que la
        requête a réussi et que toutes les sessions ont été récupérées avec succès.

        Assert:
            - Le code de statut de la réponse doit être 200.
        """
        response = client.get("/sessions/all_session/")
        assert response.status_code == 200

    def test_session_id(self):
        """
        Teste l'obtention d'une session par son identifiant.

        Cette méthode effectue les étapes suivantes :
        1. Envoie une requête GET à l'endpoint "/sessions/all_session/" pour récupérer toutes les sessions.
        2. Extrait l'identifiant de la première session de la réponse.
        3. Envoie une requête GET à l'endpoint "/sessions/get/{id}" avec l'identifiant extrait.
        4. Vérifie que le statut de la réponse est 200 (OK).

        Assure que l'endpoint pour obtenir une session par son identifiant fonctionne correctement.
        """
        response = client.get("/sessions/all_session/")
        id = str(response.json()[0]["_id"])
        print(id)
        response = client.get(f"/sessions/get/{id}")
        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_delete_session(self):
        """
        Test de suppression d'une session.

        Ce test effectue les opérations suivantes :
        1. Récupère toutes les sessions via une requête GET à l'endpoint "/sessions/all_session/".
        2. Extrait l'identifiant de la première session dans la réponse.
        3. Supprime la session correspondante via une requête DELETE à l'endpoint "/sessions/delete/{id}".
        4. Vérifie que le statut de la réponse est 200, indiquant une suppression réussie.

        Marqueurs:
            - pytest.mark.asyncio : Indique que le test est asynchrone.
        """
        response = client.get("/sessions/all_session/")
        id = str(response.json()[0]["_id"])
        # Supprimer la session
        response = client.delete(f"/sessions/delete/{id}")
        assert response.status_code == 200

    def test_update_session(self):
        """
        Teste la mise à jour d'une session.

        Cette méthode effectue les actions suivantes :
        1. Récupère toutes les sessions via une requête GET à l'endpoint "/sessions/all_session/".
        2. Extrait l'identifiant de la première session de la réponse.
        3. Met à jour la session avec l'identifiant extrait via une requête PUT à l'endpoint "/sessions/update/{id}" 
           avec les nouvelles données de session.
        4. Vérifie que le code de statut de la réponse est 200 (OK).
        5. Vérifie que le contenu de la réponse correspond aux nouvelles données de session, y compris l'identifiant.

        Assert:
        - Le code de statut de la réponse doit être 200.
        - Le contenu de la réponse doit correspondre aux nouvelles données de session avec l'identifiant inclus.
        """
        response = client.get("/sessions/all_session/")
        id = str(response.json()[0]["_id"])
        response = client.put(f"/sessions/update/{id}", json={"name" : "test_modification", "description" : "test_modification", "start_time" : "2022-01-01T00:00:00",
                                                        "end_time" : "2022-01-01T01:00:00", "participants" : ["test_modification_1","test_modification_2"]})
        assert response.status_code == 200
        assert response.json() == {"name" : "test_modification", "description" : "test_modification", "start_time" : "2022-01-01T00:00:00",
                                                        "end_time" : "2022-01-01T01:00:00", "participants" : ["test_modification_1","test_modification_2"],
                                                        "_id" : id}