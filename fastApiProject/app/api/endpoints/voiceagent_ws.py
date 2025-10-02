from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, status, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.concurrency import run_in_threadpool
import json
import io
import asyncio
import logging
from typing import List, Dict, Any, Optional

from app.api.dependencies import get_current_user_ws, check_user_role_ws
from app.models.voice_agent_model import MessageSchema
from app.connector.openai_voice_client import voice_agent, openai_client
from app.crud.transcript_crud import TranscriptCRUD
from app.models.transcript_model import TranscriptCreate
import os
from dotenv import load_dotenv

load_dotenv()

VOICE_PERSONALITY = os.getenv("VOICE_PERSONALITY")

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(tags=["voice-agent-ws"])
transcript_crud = TranscriptCRUD()

# Connection manager to handle multiple WebSocket connections
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, client_id: str):
        # Remove the websocket.accept() call here
        self.active_connections[client_id] = websocket
        logger.info(f"Client {client_id} connected. Total connections: {len(self.active_connections)}")


    def disconnect(self, client_id: str):
        if client_id in self.active_connections:
            del self.active_connections[client_id]
            logger.info(f"Client {client_id} disconnected. Total connections: {len(self.active_connections)}")

    async def send_audio(self, client_id: str, audio_chunk: bytes):
        if client_id in self.active_connections:
            await self.active_connections[client_id].send_bytes(audio_chunk)

    async def send_text(self, client_id: str, message: str):
        if client_id in self.active_connections:
            await self.active_connections[client_id].send_text(message)

manager = ConnectionManager()

@router.websocket("/ws/voice")
async def voice_websocket(websocket: WebSocket):
    # Accept the connection with compression enabled
    await websocket.accept(subprotocol="permessage-deflate")
    
    # Variables to store state
    user = None
    client_id = None
    audio_chunks = []
    history = []
    stt_buffer = []
    current_transcription = ""
    
    try:
        # First message should be authentication
        auth_message = await websocket.receive_text()
        auth_data = json.loads(auth_message)
        
        # Validate token
        token = auth_data.get("token")
        if not token:
            await websocket.send_text(json.dumps({"error": "Authentication required"}))
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
        
        # Get user from token
        try:
            user = await get_current_user_ws(token)
            # Check user role
            check_user_role_ws(user, ["SuperAdmin", "Formateur-int", "Formateur-ext", "Formé"])
            client_id = str(user.id)
        except HTTPException as e:
            await websocket.send_text(json.dumps({"error": e.detail}))
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
        
        # Register connection
        await manager.connect(websocket, client_id)
        
        # Send confirmation
        await websocket.send_text(json.dumps({"status": "connected", "user_id": client_id}))
        
        # Process history if provided
        if "history" in auth_data:
            try:
                history = json.loads(auth_data["history"])
            except:
                history = []
        
        # Main processing loop
        while True:
            # Receive message (could be binary audio data or text control message)
            message = await websocket.receive()
            
            if "text" in message:
                # Handle text control messages
                control_message = json.loads(message["text"])
                command = control_message.get("command")
                
                if command == "end_audio":
                    # Process the complete audio when client signals end of recording
                    if audio_chunks:
                        # Combine all audio chunks
                        complete_audio = b''.join(audio_chunks)
                        audio_chunks = []  # Reset for next recording
                        
                        # Process in background task to not block the WebSocket
                        asyncio.create_task(
                            process_complete_audio(
                                client_id, 
                                complete_audio, 
                                history, 
                                user
                            )
                        )
                
                elif command == "reset":
                    # Reset state
                    audio_chunks = []
                    stt_buffer = []
                    current_transcription = ""
                    
                    # Optionally reset history if requested
                    if control_message.get("reset_history", False):
                        history = []
                    
                    await websocket.send_text(json.dumps({"status": "reset"}))


            elif "bytes" in message:
                # Handle binary audio data
                audio_chunk = message["bytes"]
                audio_chunks.append(audio_chunk)

                # Si nous avons suffisamment de données audio, commencer la transcription en streaming
                if len(audio_chunks) >= 3:  # Après ~300ms d'audio
                    # Créer une copie des chunks actuels pour le traitement
                    current_chunks = audio_chunks.copy()
                    # Traiter en arrière-plan sans bloquer
                    asyncio.create_task(
                        process_streaming_audio(
                            client_id,
                            current_chunks,
                            history,
                            user
                        )
                    )

                # Toujours accuser réception
                await websocket.send_text(json.dumps({"status": "chunk_received", "size": len(audio_chunk)}))
    
    except WebSocketDisconnect:
        logger.info(f"Client {client_id} disconnected")
        if client_id:
            manager.disconnect(client_id)
    
    except Exception as e:
        logger.error(f"Error in WebSocket: {str(e)}")
        if client_id:
            manager.disconnect(client_id)
        try:
            await websocket.send_text(json.dumps({"error": str(e)}))
            await websocket.close()
        except:
            pass


async def process_streaming_audio(client_id: str, audio_chunks: List[bytes], history: List[Dict[str, Any]], user):
    """Traite l'audio en streaming pendant que l'utilisateur parle encore"""
    try:
        # Combiner les chunks audio
        audio_data = b''.join(audio_chunks)

        # Transcription
        partial_text = await voice_agent.transcribe_audio(audio_data)

        # Si nous avons du texte, commencer à préparer la réponse LLM
        if partial_text.strip():
            # Informer le client
            await manager.send_text(
                client_id,
                json.dumps({
                    "status": "partial_transcription",
                    "transcription": partial_text
                })
            )

            # Préparer les messages pour le LLM
            messages = []
            if VOICE_PERSONALITY:
                messages.append({"role": "system", "content": VOICE_PERSONALITY})

            # Ajouter l'historique
            for msg in history:
                if msg["role"] in ["user", "assistant"]:
                    messages.append(msg)

            # Ajouter le message utilisateur partiel
            messages.append({"role": "user", "content": partial_text})

            # Commencer à générer la réponse en streaming
            asyncio.create_task(
                start_early_response(client_id, messages, partial_text)
            )
    except Exception as e:
        logger.error(f"Error in streaming audio processing: {str(e)}")


async def start_early_response(client_id: str, messages: List[Dict[str, Any]], partial_text: str):
    """Commence à générer une réponse avant même que l'utilisateur ait fini de parler"""
    try:
        # Informer le client
        await manager.send_text(client_id, json.dumps({"status": "early_processing"}))

        # Générer les premiers mots de réponse
        collected_text = ""
        async for text_chunk in voice_agent.chat_reply_stream(messages):
            collected_text += text_chunk

            # Après avoir obtenu quelques mots, commencer la TTS
            if len(collected_text) >= 5 or "." in text_chunk:
                # Utiliser le wrapper de priorité pour la TTS
                prioritized_tts = set_thread_priority(voice_agent.synthesize_speech)
                audio_buf = await run_in_threadpool(prioritized_tts, collected_text)
                audio_chunk = audio_buf.read()

                # Envoyer l'audio au client
                await manager.send_audio(client_id, audio_chunk)
                break  # Sortir après le premier chunk pour éviter de surcharger
    except Exception as e:
        logger.error(f"Error in early response generation: {str(e)}")

async def process_complete_audio(client_id: str, audio_data: bytes, history: List[Dict[str, Any]], user,
                                 chunkCountRef: Optional[Any] = None):
    """Process complete audio recording and send response back via WebSocket"""

    try:
        # Send status update
        await manager.send_text(client_id, json.dumps({"status": "transcribing"}))
        
        # 1. Transcribe audio
        user_text = await voice_agent.transcribe_audio(audio_data)
        
        # Save transcription to database
        await transcript_crud.create_transcript(TranscriptCreate(
            user_id=user.id, text=user_text
        ))
        
        # Send transcription to client
        await manager.send_text(
            client_id, 
            json.dumps({
                "status": "transcription_complete", 
                "transcription": user_text
            })
        )
        
        # 2. Prepare messages for LLM
        messages = []
        
        # Add system message if available
        from app.connector.openai_voice_client import VOICE_PERSONALITY
        if VOICE_PERSONALITY:
            messages.append({"role": "system", "content": VOICE_PERSONALITY})
        
        # Add history
        for msg in history:
            if msg["role"] in ["user", "assistant"]:
                messages.append(msg)
        
        # Add new user message
        messages.append({"role": "user", "content": user_text})
        
        # 3. Informer le client que le traitement parallèle commence
        await manager.send_text(client_id, json.dumps({"status": "processing_parallel"}))
        
        # 4. Utiliser le traitement parallèle
        collected_text = ""
        async for text_chunk in voice_agent.chat_reply_stream(messages):
            collected_text += text_chunk
            is_first_few_chunks = True if chunkCountRef is None else chunkCountRef < 3
            
            # Envoyer les mises à jour de texte au client
            await manager.send_text(
                client_id,
                json.dumps({
                    "status": "llm_chunk",
                    "chunk": text_chunk,
                    "text_so_far": collected_text
                })
            )
            
            # Générer et envoyer l'audio pour ce morceau

            threshold = 3 if is_first_few_chunks else 10
            if len(text_chunk) >= threshold or any(p in text_chunk for p in ".,!?"):
                # Utiliser le wrapper de priorité pour réduire la latence
                prioritized_tts = set_thread_priority(voice_agent.synthesize_speech)
                audio_buf = await run_in_threadpool(prioritized_tts, text_chunk)
                audio_chunk = audio_buf.read()
                await manager.send_audio(client_id, audio_chunk)
        
        # 5. Mise à jour de l'historique et envoi du message de complétion
        history.append({"role": "user", "content": user_text})
        history.append({"role": "assistant", "content": collected_text})
        
        # Send completion status with updated history
        await manager.send_text(
            client_id, 
            json.dumps({
                "status": "complete",
                "reply": collected_text,
                "history": history
            })
        )
        
    except Exception as e:
        logger.error(f"Error processing audio: {str(e)}")
        await manager.send_text(
            client_id, 
            json.dumps({
                "status": "error",
                "error": str(e)
            })
        )