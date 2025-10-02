# from fastapi import APIRouter, UploadFile, File, Form, Security, HTTPException, status
# from fastapi.responses import StreamingResponse
# from pydantic import ValidationError
# import json
# import asyncio
#
# from app.api.dependencies import get_current_user, check_user_role
# from app.crud.transcript_crud import TranscriptCRUD
# from app.models.voice_agent_model import MessageSchema, VoiceAgentResponse
# from app.models.transcript_model import TranscriptCreate
# from app.connector.openai_voice_client import voice_agent
#
# import os
# from dotenv import load_dotenv
#
# load_dotenv()
#
# # Ensure VOICE_PERSONALITY is set on the singleton
# voice_agent.VOICE_PERSONALITY = os.getenv("VOICE_PERSONALITY", "")
#
# router = APIRouter(tags=["voice-agent"])
# transcript_crud = TranscriptCRUD()
#
# @router.post(
#     "/chat",
#     response_model=VoiceAgentResponse,
#     status_code=status.HTTP_200_OK
# )
# async def voice_chat_json(
#     file: UploadFile = File(...),
#     history: str = Form("[]"),
#     current_user=Security(get_current_user),
# ):
#     # Sécurité
#     check_user_role(current_user, ["SuperAdmin", "Formateur-int", "Formateur-ext", "Formé"])
#
#     # Parser l'historique
#     try:
#         raw = json.loads(history)
#         hist_objs = [MessageSchema(**m) for m in raw]
#     except (json.JSONDecodeError, ValidationError) as e:
#         raise HTTPException(status_code=400, detail=f"Invalid history: {e}")
#
#     # Lecture du fichier audio
#     audio_bytes = await file.read()
#
#     # 1. Transcription (STT)
#     try:
#         user_text = await voice_agent.transcribe_audio(audio_bytes)
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Transcription error: {e}")
#
#     # Sauvegarde de la transcription
#     await transcript_crud.create_transcript(TranscriptCreate(
#         user_id=current_user.id,
#         text=user_text
#     ))
#
#     # Construire le prompt LLM
#     messages = []
#     if voice_agent.VOICE_PERSONALITY:
#         messages.append({"role": "system", "content": voice_agent.VOICE_PERSONALITY})
#     for m in hist_objs:
#         if m.role in ["user", "assistant"]:
#             messages.append({"role": m.role, "content": m.content})
#     messages.append({"role": "user", "content": user_text})
#
#     # 2. Chat (LLM) - collect full reply
#     try:
#         assistant_text = await voice_agent.chat_reply(messages)
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Chat error: {e}")
#
#     # Mise à jour de l'historique renvoyé
#     full_history = [*messages, {"role": "assistant", "content": assistant_text}]
#     filtered = [m for m in full_history if m["role"] in ["user", "assistant"]]
#
#     return VoiceAgentResponse(
#         transcription=user_text,
#         reply=assistant_text,
#         history=[MessageSchema(**m) for m in filtered]
#     )
#
# @router.post(
#     "/chat-stream",
#     status_code=status.HTTP_200_OK,
#     responses={200: {"content": {"audio/mpeg": {}}}}
# )
# async def voice_chat_stream(
#     file: UploadFile = File(...),
#     history: str = Form("[]"),
#     current_user=Security(get_current_user),
# ):
#     # Validation & auth
#     check_user_role(current_user, ["SuperAdmin", "Formateur-int", "Formateur-ext", "Formé"])
#     try:
#         raw = json.loads(history)
#         hist_objs = [MessageSchema(**m) for m in raw]
#     except (json.JSONDecodeError, ValidationError) as e:
#         raise HTTPException(status_code=400, detail=f"Invalid history: {e}")
#
#     audio_bytes = await file.read()
#
#     # STT
#     try:
#         user_text = await voice_agent.transcribe_audio(audio_bytes)
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Transcription error: {e}")
#
#     # Enregistrer de façon non-bloquante
#     asyncio.create_task(
#         transcript_crud.create_transcript(
#             TranscriptCreate(user_id=current_user.id, text=user_text)
#         )
#     )
#
#     # Construire le prompt
#     messages = []
#     if voice_agent.VOICE_PERSONALITY:
#         messages.append({"role": "system", "content": voice_agent.VOICE_PERSONALITY})
#     for m in hist_objs:
#         if m.role in ["user", "assistant"]:
#             messages.append({"role": m.role, "content": m.content})
#     messages.append({"role": "user", "content": user_text})
#
#     # Stream chat + TTS: first gather chat text then stream audio
#     try:
#         full_text = await voice_agent.chat_reply(messages)
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Chat error: {e}")
#
#
#     # StreamingResponse via tts_stream
#     audio_generator = voice_agent.tts_stream(full_text)
#     return StreamingResponse(audio_generator, media_type="audio/mpeg")


# app/api/routers/voice_agent.py
from fastapi import APIRouter, UploadFile, File, HTTPException, Security, status, Body
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, ValidationError
import json, asyncio

from app.api.dependencies import get_current_user, check_user_role
from app.crud.transcript_crud import TranscriptCRUD
from app.models.transcript_model import TranscriptCreate
from app.models.voice_agent_model import MessageSchema, VoiceAgentResponse
from app.connector.openai_voice_client import voice_agent
import os
from dotenv import load_dotenv

load_dotenv()

# Ensure VOICE_PERSONALITY is set on the singleton
voice_agent.VOICE_PERSONALITY = os.getenv("VOICE_PERSONALITY", "")

router = APIRouter(tags=["voice-agent"])
transcript_crud = TranscriptCRUD()

# ─── MODELS ────────────────────────────────────────────────────────────────

class TranscribeResponse(BaseModel):
    transcription: str

class ChatRequest(BaseModel):
    history: list[MessageSchema]
    user_text: str

class ChatResponse(BaseModel):
    reply: str
    history: list[MessageSchema]

class TTSRequest(BaseModel):
    text: str

# ─── 1) TRANSCRIBE ──────────────────────────────────────────────────────────

@router.post(
    "/transcribe",
    response_model=TranscribeResponse,
    status_code=status.HTTP_200_OK,
)
async def transcribe_audio(
    file: UploadFile = File(...),
    current_user=Security(get_current_user),
):
    check_user_role(current_user, ["SuperAdmin", "Formateur-int", "Formateur-ext", "Formé"])

    audio_bytes = await file.read()
    try:
        text = await voice_agent.transcribe_audio(audio_bytes)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription error: {e}")

    # Sauvegarde asynchrone hors de la latence
    await transcript_crud.create_transcript(TranscriptCreate(
            user_id=current_user.id,
            text=text
        ))

    return TranscribeResponse(transcription=text)


# ─── 2) CHAT (LLM) ──────────────────────────────────────────────────────────

@router.post(
    "/chat",
    response_model=ChatResponse,
    status_code=status.HTTP_200_OK,
)
async def chat_with_agent(
    payload: ChatRequest,
    current_user=Security(get_current_user),
):
    check_user_role(current_user, ["SuperAdmin", "Formateur-int", "Formateur-ext", "Formé"])

    # Reconstruire le prompt
    messages = []
    if voice_agent.VOICE_PERSONALITY:
        messages.append({"role": "system", "content": voice_agent.VOICE_PERSONALITY})
    for msg in payload.history:
        messages.append({"role": msg.role, "content": msg.content})
    messages.append({"role": "user", "content": payload.user_text})

    try:
        assistant_text = await voice_agent.chat_reply(messages)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat error: {e}")

    # Historique renvoyé (seulement user + assistant)
    filtered_hist = [
        MessageSchema(role=m["role"], content=m["content"])
        for m in (*messages[1:], {"role":"assistant","content":assistant_text})
        if m["role"] in ("user","assistant")
    ]

    return ChatResponse(
        reply=assistant_text,
        history=filtered_hist
    )


# ─── 3) TTS STREAM ──────────────────────────────────────────────────────────

@router.post(
    "/tts-stream",
    status_code=status.HTTP_200_OK,
    responses={200: {"content": {"audio/mpeg": {}}}}
)
async def tts_stream(
    payload: TTSRequest = Body(...),
    current_user=Security(get_current_user),
):
    # 1) Vérifie le rôle
    check_user_role(current_user, ["SuperAdmin", "Formateur-int", "Formateur-ext", "Formé"])

    # 2) On enveloppe l'appel à voice_agent.tts_stream dans un async generator
    async def audio_generator():
        try:
            # voice_agent.tts_stream doit être un async def avec yield → renvoie un AsyncGenerator[bytes, None]
            async for chunk in voice_agent.tts_stream(payload.text):
                yield chunk
        except Exception as e:
            # Propagation de l’erreur pour que FastAPI renvoie un 500
            raise HTTPException(status_code=500, detail=f"TTS error: {e}")

    # 3) On renvoie la réponse en streaming
    return StreamingResponse(
        audio_generator(),
        media_type="audio/mpeg",
        headers={
            "Cache-Control": "no-store"
        }
    )
