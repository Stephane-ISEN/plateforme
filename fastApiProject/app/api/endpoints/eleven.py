# app/api/endpoints/eleven.py
from typing import List, Annotated
import asyncio

from fastapi import APIRouter, Security, UploadFile, File, Body, HTTPException, status, WebSocket
from fastapi.concurrency import run_in_threadpool

from app.api.dependencies import get_current_user
from app.crud.eleven_crud import ElevenCRUD
from app.models.eleven_model import (
    AgentDisplay, SessionCreate, SessionDisplay,
    MessageCreate, MessageDisplay
)
from app.connector.openai_voice_client import voice_agent
from app.connector.ws_manager import manager

router = APIRouter(tags=["eleven"])
crud = ElevenCRUD()

@router.get("/agents", response_model=List[AgentDisplay])
async def list_agents(current_user=Security(get_current_user)):
    """Liste des agents disponibles via l'API ElevenLabs."""
    docs = await crud.list_agents()
    return [AgentDisplay(**d) for d in docs]

@router.post(
    "/sessions",
    response_model=SessionDisplay,
    status_code=status.HTTP_201_CREATED
)
async def start_session(
    agent_id: Annotated[str, Body(..., embed=True)],
    current_user=Security(get_current_user)
):
    """Démarre une nouvelle session pour un agent ElevenLabs donné."""
    payload = SessionCreate(agent_id=agent_id)
    doc = await run_in_threadpool(crud.create_session, current_user.id, payload)
    return SessionDisplay(**doc)

@router.get("/sessions", response_model=List[SessionDisplay])
async def get_sessions(current_user=Security(get_current_user)):
    """Récupère toutes les sessions de l'utilisateur connecté."""
    docs = await run_in_threadpool(crud.get_sessions, current_user.id)
    return [SessionDisplay(**d) for d in docs]

@router.post(
    "/sessions/{session_id}/message",
    response_model=MessageDisplay,
    status_code=status.HTTP_201_CREATED
)
async def post_message(
    session_id: str,
    file: Annotated[UploadFile, File(...)],
    current_user=Security(get_current_user)
):
    """Reçoit un fichier audio, traite transcription, chat et TTS, puis stocke les messages."""
    audio_bytes = await file.read()
    try:
        user_text, assistant_text, audio_response = await voice_agent.run_and_transcribe(audio_bytes)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Voice agent error: {e}")

    # Stockage et broadcast via WebSocket
    user_msg = crud.create_message(MessageCreate(session_id=session_id, role="user", text=user_text))
    await manager.broadcast(session_id, {
        "role": "user", "text": user_msg["text"], "audio_url": None, "_id": str(user_msg["_id"])
    })

    assistant_msg = crud.create_message(MessageCreate(session_id=session_id, role="assistant", text=assistant_text))
    await manager.broadcast(session_id, {
        "role": "assistant", "text": assistant_msg["text"], "audio_url": audio_response, "_id": str(assistant_msg["_id"])
    })

    return MessageDisplay(**assistant_msg)

@router.post(
    "/sessions/{session_id}/message/stream",
    response_model=MessageDisplay,
    status_code=status.HTTP_201_CREATED
)
async def post_message_stream(
    session_id: str,
    websocket: WebSocket,
    current_user=Security(get_current_user)
):
    """Reçoit le flux raw audio via WebSocket pour transcription et réponse immédiate."""
    await manager.connect(session_id, websocket)
    try:
        audio_bytes = await websocket.receive_bytes()
        user_text, assistant_text, audio_response = await voice_agent.run_and_transcribe(audio_bytes)

        # Stockage et broadcast
        user_msg = crud.create_message(MessageCreate(session_id=session_id, role="user", text=user_text))
        await manager.broadcast(session_id, {"role": "user", "text": user_msg["text"], "audio_url": None, "_id": str(user_msg["_id"])})

        assistant_msg = crud.create_message(MessageCreate(session_id=session_id, role="assistant", text=assistant_text))
        await manager.broadcast(session_id, {"role": "assistant", "text": assistant_msg["text"], "audio_url": audio_response, "_id": str(assistant_msg["_id"])})
    finally:
        manager.disconnect(session_id, websocket)
        await websocket.close()
    return MessageDisplay(**assistant_msg)

@router.get(
    "/sessions/{session_id}/messages",
    response_model=List[MessageDisplay]
)
async def get_messages(
    session_id: str,
    current_user=Security(get_current_user)
):
    """Récupère l'historique complet des messages d'une session."""
    docs = await run_in_threadpool(crud.get_messages, session_id)
    return [MessageDisplay(**d) for d in docs]

@router.websocket("/sessions/{session_id}/ws")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    """WebSocket général pour recevoir et envoyer les messages en temps réel."""
    await manager.connect(session_id, websocket)
    try:
        while True:
            await asyncio.sleep(30)
    except Exception:
        manager.disconnect(session_id, websocket)
        await websocket.close()
