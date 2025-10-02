import os
import io
import asyncio
from typing import AsyncGenerator, Tuple
from dotenv import load_dotenv
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import StreamingResponse
from openai import OpenAI

# Load environment variables
load_dotenv()

OPENAI_KEY = os.getenv("OPENAI_KEY")
OPENAI_VOICE_ID = os.getenv("OPENAI_VOICE_ID")
VOICE_PERSONALITY = os.getenv("VOICE_PERSONALITY", "")

if not OPENAI_KEY:
    raise ValueError("OPENAI_KEY missing in environment")
if not OPENAI_VOICE_ID:
    raise ValueError("OPENAI_VOICE_ID missing in environment")

# Instantiate OpenAI client
openai_client = OpenAI(api_key=OPENAI_KEY)

class OpenAIVoiceClient:
    """
    Pipeline: Whisper STT → GPT-4o-mini chat streaming → OpenAI TTS streaming
    """
    def __init__(self):
        # simple cache for full-text TTS
        self._tts_cache: dict[str, bytes] = {}

    async def transcribe_audio(self, audio_bytes: bytes) -> str:
        """Transcribe with Whisper."""
        audio_file = io.BytesIO(audio_bytes)
        audio_file.name = "upload.mp3"
        resp = await run_in_threadpool(
            openai_client.audio.transcriptions.create,
            file=audio_file,
            model="whisper-1"
        )
        return resp.text or ""

    async def chat_reply_stream(self, messages: list[dict]) -> AsyncGenerator[str, None]:
        """Stream GPT chat responses in chunks."""
        # Obtain streaming generator in thread to avoid blocking
        response = await run_in_threadpool(
            lambda: openai_client.chat.completions.create(
                model="gpt-4o-mini", messages=messages, stream=True
            )
        )
        for chunk in response:
            content = getattr(chunk.choices[0].delta, 'content', None)
            if content:
                yield content

    async def chat_reply(self, messages: list[dict]) -> str:
        """Collect full chat reply synchronously from stream."""
        parts: list[str] = []
        async for piece in self.chat_reply_stream(messages):
            parts.append(piece)
        return ''.join(parts)

    async def tts_stream(self, text: str) -> AsyncGenerator[bytes, None]:
        def sync_tts():
            return openai_client.audio.speech.with_streaming_response.create(
                model="tts-1",
                voice=OPENAI_VOICE_ID,
                input=text,
                speed=1.2,
            )

        # on exécute sync_tts en thread pour ne pas bloquer l’event loop
        resp = await asyncio.get_event_loop().run_in_executor(None, sync_tts)

        # on itère sur chaque chunk de la réponse streaming
        with resp as stream:
            for chunk in stream.iter_bytes():
                if chunk:
                    yield chunk

    async def run_and_transcribe_parallel(self, audio_bytes: bytes) -> Tuple[str, str, bytes]:
        # Transcription
        user_text_task = asyncio.create_task(self.transcribe_audio(audio_bytes))

        # Attendre uniquement la transcription
        user_text = await user_text_task

        # Construire le prompt
        messages = []
        if VOICE_PERSONALITY:
            messages.append({"role": "system", "content": VOICE_PERSONALITY})
        messages.append({"role": "user", "content": user_text})

        # Lancer le chat en parallèle
        chat_task = asyncio.create_task(self.chat_reply(messages))

        # Attendre la réponse du chat
        assistant_text = await chat_task

        # Lancer la TTS
        audio_buf = bytearray()
        async for chunk in self.tts_stream(assistant_text):
            audio_buf.extend(chunk)

        return bytes(audio_buf)

# Singleton instance
global voice_agent
voice_agent = OpenAIVoiceClient()
