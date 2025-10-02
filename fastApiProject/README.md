![AI EXPLORER](/reactapp/public/aiexplorerwhite.png)

# AI Explorer - API FastAPI

L'API **FastAPI** est le cœur de la plateforme **AI Explorer**. Un soin particulier a été apporté à son architecture, notamment sur les aspects de sécurité et de gestion des données. Nous avons respecté les concepts clés de développement **DAO** (Data Access Object) et **DTO** (Data Transfer Object), tout en utilisant le typage fort avec **Pydantic** pour contrôler précisément les données que l'API reçoit.

### Organisation des fichiers :

L'architecture du projet **FastAPI** est divisée en plusieurs modules pour assurer une gestion claire et maintenable du code :

- [api](/fastApiProject/app/api): Contient les endpoints principales de l'API, organisées par fonctionnalité.
- [auth](/fastApiProject/app/auth) : Gère toute la logique d'authentification et d'autorisation, y compris les JWT et la sécurité avec OAuth2.
- [connector](/fastApiProject/app/connector) : Regroupe les connecteurs aux bases de données et aux services externes.
- [core](/fastApiProject/app/core) : Contient la configuration principale de l'application, comme les paramètres et les configurations globales.
- [crud](/fastApiProject/app/crud) : Fournit les opérations CRUD (Create, Read, Update, Delete) pour interagir avec la base de données.
- [models](/fastApiProject/app/models) : Définit les modèles de données utilisés par l'application.
- [tests](/fastApiProject/app/tests) : Contient les tests unitaires et fonctionnels pour garantir la fiabilité du code.
- [utilitaires](/fastApiProject/app/utilitaires) : Réunit diverses fonctions utilitaires et helpers nécessaires au bon fonctionnement de l'application.

L'organisation est pensée pour faciliter la scalabilité et la séparation des préoccupations, ce qui rend le projet plus facile à maintenir et à étendre.


### Stack technique (Back) :
- [`FastAPi`](https://github.com/fastapi/fastapi)
- [`Pydantic`](https://github.com/pydantic/pydantic)
- [`Oauth2/JWT`](https://fastapi.tiangolo.com/tutorial/security/simple-oauth2/#why-use-password-hashing)
- [`MongoDB`](https://github.com/mongodb/mongo-python-driver)
- [`Bcrypt`](https://pypi.org/project/bcrypt/)
- [`Starlette`](https://github.com/encode/starlette)
- [`Pillow`](https://pypi.org/project/Pillow/)

### Installation et démarrage (Développement local) :

1. Clonez le dépôt :  
   git clone `https://github.com/managia-website`

2. Créez et activez un environnement virtuel :
   ```bash
   python3 -m venv env
   source env/bin/activate
   ```

3. Installez les dépendances :
   ```bash
   pip install -r requirements.txt
   ```

4. Lancez le serveur FastAPI :
   ```bash
   uvicorn app.main:app --reload
   ```

5. L'API est accessible à l'adresse :
   `http://localhost:8000`

### Configuration :

- Configurez vos variables d'environnement dans un fichier `.env` en utilisant le fichier `.env.example` comme modèle.
  - Exemples de variables :
    - `SECRET_KEY`
    - `MONGO_URI`
    - `MAILGUN_API_KEY`
  
- Assurez-vous d'inclure les informations nécessaires pour les intégrations externes (comme MongoDB et Mailgun).

### Déploiement :

- Utilisez Docker pour déployer l'API sur des environnements de production. Vous pouvez trouver le fichier `docker-compose.yml` dans la racine du projet.

---