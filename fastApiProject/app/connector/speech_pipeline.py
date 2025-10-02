#!/usr/bin/env python
"""
Speech Pipeline Script

This script provides a pipeline for speech processing:
1. Speech-to-Text (STT): Transcribes audio input to text
2. Chat: Processes the transcribed text through a chat model
3. Text-to-Speech (TTS): Converts the chat response to speech

Usage:
    python speech_pipeline.py --input <audio_file> [--output <output_file>] [--history <history_file>]

Requirements:
    - OpenAI API key set as environment variable OPENAI_API_KEY
    - ElevenLabs API key set as environment variable ELEVENLABS_API_KEY
"""

import os
import sys
import json
import base64
import argparse
from typing import List, Dict, Optional
import requests
import asyncio

import openai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Set up OpenAI API
openai.api_key = os.getenv("OPENAI_KEY")
if not openai.api_key:
    print("Error: OPENAI_API_KEY environment variable not set")
    sys.exit(1)

# Set up ElevenLabs API
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
if not ELEVENLABS_API_KEY:
    print("Error: ELEVENLABS_API_KEY environment variable not set")
    sys.exit(1)

ELEVENLABS_VOICE_ID = os.getenv("ELEVEN_VOICE_ID", "21m00Tcm4TlvDq8ikWAM")  # Default voice ID

class SpeechPipeline:
    """
    A class that implements a speech processing pipeline:
    STT -> Chat -> TTS
    """

    async def transcribe(self, audio_data) -> str:
        """
        Transcribe audio data to text using OpenAI's Whisper model.

        Args:
            audio_data: Either a file path (str) or audio bytes

        Returns:
            Transcribed text
        """
        # Handle both file path and bytes
        if isinstance(audio_data, str):
            with open(audio_data, "rb") as audio_file:
                audio_bytes = audio_file.read()
        else:
            audio_bytes = audio_data

        # Create a file-like object
        import io
        audio_file = io.BytesIO(audio_bytes)
        audio_file.name = "audio.mp3"

        # Use run_in_threadpool for the synchronous API call
        from fastapi.concurrency import run_in_threadpool
        client = openai.OpenAI(api_key=os.getenv("OPENAI_KEY"))
        resp = await run_in_threadpool(
            client.audio.transcriptions.create,
            file=audio_file,
            model="whisper-1"
        )
        return resp.text

    async def chat(self, text: str, history: List[Dict[str, str]] = None) -> str:
        """
        Process text through a chat model.

        Args:
            text: Input text
            history: Conversation history

        Returns:
            Chat model response and updated history
        """
        if history is None:
            history = []

        # Add system message if not present
        if not history or history[0].get("role") != "system":
            history.insert(0, {
                "role": "system",
                "content": "This is a conversation with an AI assistant. The AI assistant is helpful, creative, clever, and very friendly."
            })

        # Add user message
        history.append({"role": "user", "content": text})

        # Use run_in_threadpool for the synchronous API call
        from fastapi.concurrency import run_in_threadpool
        client = openai.OpenAI(api_key=os.getenv("OPENAI_KEY"))
        resp = await run_in_threadpool(
            client.chat.completions.create,
            model="gpt-3.5-turbo",
            messages=history
        )

        reply = resp.choices[0].message.content

        # Add assistant message to history
        history.append({"role": "assistant", "content": reply})

        return reply, history

    def synthesize(self, text: str, output_file: Optional[str] = None) -> bytes:
        """
        Convert text to speech using ElevenLabs API.

        Args:
            text: Text to convert to speech
            output_file: Path to save the audio file (optional)

        Returns:
            Audio bytes
        """
        url = f"https://api.elevenlabs.io/v1/text-to-speech/{ELEVENLABS_VOICE_ID}"

        headers = {
            "xi-api-key": ELEVENLABS_API_KEY,
            "Content-Type": "application/json"
        }

        data = {
            "text": text,
            "model_id": "eleven_monolingual_v1",
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.5
            }
        }

        response = requests.post(url, json=data, headers=headers)
        response.raise_for_status()

        audio_bytes = response.content

        # Save to file if output_file is provided
        if output_file:
            with open(output_file, "wb") as f:
                f.write(audio_bytes)

        return audio_bytes

async def main():
    parser = argparse.ArgumentParser(description="Speech Pipeline: STT -> Chat -> TTS")
    parser.add_argument("--input", required=True, help="Path to input audio file")
    parser.add_argument("--output", help="Path to output audio file")
    parser.add_argument("--history", help="Path to conversation history JSON file")

    args = parser.parse_args()

    # Initialize pipeline
    pipeline = SpeechPipeline()

    # Load conversation history if provided
    history = []
    if args.history and os.path.exists(args.history):
        try:
            with open(args.history, "r") as f:
                history = json.load(f)
        except json.JSONDecodeError:
            print(f"Warning: Could not parse history file {args.history}. Starting with empty history.")

    # Process audio
    try:
        # 1. Transcribe audio to text
        print("Transcribing audio...")
        text = await pipeline.transcribe(args.input)
        print(f"Transcription: {text}")

        # 2. Process text through chat model
        print("Processing through chat model...")
        reply, updated_history = await pipeline.chat(text, history)
        print(f"Chat response: {reply}")

        # 3. Convert chat response to speech
        print("Converting to speech...")
        output_file = args.output if args.output else "output.mp3"
        audio_bytes = pipeline.synthesize(reply, output_file)
        print(f"Speech saved to {output_file}")

        # Save updated history if history file was provided
        if args.history:
            with open(args.history, "w") as f:
                json.dump(updated_history, f, indent=2)
            print(f"Updated conversation history saved to {args.history}")

    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
