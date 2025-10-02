import os
import openai
from openai import OpenAI
from fastapi import FastAPI
from fastapi.openapi.utils import get_openapi
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from app.connector.connectorBDD import MongoAccess
from app.api.endpoints import users, sessions, prompts, login, documentation, pdf_maker, mails, comments, image, video, voiceagent, eleven, realtime



load_dotenv()

client = OpenAI(
  api_key=os.environ['OPENAI_KEY'],  # c'est la clé par défaut, elle peut être omise
)
openai.base_url = "https://api.openai.com/v1"
openai.default_headers = {"x-foo": "true"}


SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES"))

app = FastAPI()
mongo_access = MongoAccess()
mongo_access.initialize_db()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(sessions.router, prefix="/sessions", tags=["sessions"])
app.include_router(prompts.router, prefix="/prompts", tags=["prompts"])
app.include_router(login.router, prefix="/login", tags=["login"])
app.include_router(documentation.router, prefix="/documentation", tags=["documentation"])
app.include_router(comments.router, prefix="/commentaire", tags=["commentaire"])
app.include_router(pdf_maker.router, prefix="/pdf_maker", tags=["pdf_maker"])
app.include_router(mails.router, prefix="/mails", tags=["mails"])
app.include_router(image.router, prefix="/image", tags=["image"])
app.include_router(video.router, prefix="/video", tags=["video"])
app.include_router(voiceagent.router, prefix="/voice-agent", tags=["voice-agent"])
app.include_router(eleven.router, prefix="/eleven", tags=["eleven"])
app.include_router(realtime.router, prefix="/realtime", tags=["realtime"])

@app.get("/")
async def root():
    return {"message": "Welcome to Manag'IA API service"}


try:
    openapi_schema = get_openapi(
        title="Votre API",
        version="1.0.0",
        description="Description de votre API",
        routes=app.routes,
    )
    print(openapi_schema)
except Exception as e:
    print("Erreur lors de la génération du schéma OpenAPI:", e)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)