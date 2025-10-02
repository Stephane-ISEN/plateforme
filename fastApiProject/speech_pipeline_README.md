# Speech Pipeline

This script provides a pipeline for speech processing that combines:
1. **Speech-to-Text (STT)**: Transcribes audio input to text using OpenAI's Whisper model
2. **Chat**: Processes the transcribed text through a chat model (GPT-4o-mini)
3. **Text-to-Speech (TTS)**: Converts the chat response to speech using ElevenLabs API

## Requirements

- Python 3.7+
- OpenAI API key
- ElevenLabs API key

## Installation

1. Make sure you have the required Python packages installed:

```bash
pip install openai requests python-dotenv
```

2. Set up your environment variables:

Create a `.env` file in the same directory as the script with the following content:

```
OPENAI_API_KEY=your_openai_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key
ELEVENLABS_VOICE_ID=your_preferred_voice_id  # Optional, defaults to "21m00Tcm4TlvDq8ikWAM"
```

## Usage

```bash
python speech_pipeline.py --input <audio_file> [--output <output_file>] [--history <history_file>]
```

### Arguments

- `--input`: Path to the input audio file (required)
- `--output`: Path to save the output audio file (optional, defaults to "output.mp3")
- `--history`: Path to a JSON file containing conversation history (optional)

### Example

```bash
python speech_pipeline.py --input my_question.mp3 --output response.mp3 --history conversation.json
```

## How It Works

1. The script reads the input audio file and transcribes it to text using OpenAI's Whisper model.
2. The transcribed text is sent to the chat model (GPT-4o-mini) along with any conversation history.
3. The chat model's response is converted to speech using the ElevenLabs API.
4. The resulting audio is saved to the specified output file.
5. If a history file is provided, the updated conversation history is saved back to the file.

## Conversation History Format

The conversation history should be a JSON array of message objects, each with a "role" and "content" field:

```json
[
  {
    "role": "system",
    "content": "This is a conversation with an AI assistant. The AI assistant is helpful, creative, clever, and very friendly."
  },
  {
    "role": "user",
    "content": "Hello, how are you?"
  },
  {
    "role": "assistant",
    "content": "I'm doing great, thank you for asking! How can I help you today?"
  }
]
```

If no history file is provided or the file doesn't exist, a new conversation will be started.

## Notes

- The script uses asynchronous functions for the transcription and chat components, which allows for better performance.
- Error handling is included to provide helpful error messages if something goes wrong.
- The default ElevenLabs voice ID is "21m00Tcm4TlvDq8ikWAM", but you can change this by setting the `ELEVENLABS_VOICE_ID` environment variable.