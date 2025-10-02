# TTS Error Fix: 'generator' object has no attribute 'read'

## Issue Description

The application was encountering the following error when attempting to use the text-to-speech (TTS) functionality:

```
{"detail":"TTS error: 'generator' object has no attribute 'read'"}
```

This error occurred in the HTTP endpoint (`voiceagent.py`) when it tried to call `.read()` on the result of the `synthesize_speech` method, which had been modified to return a generator for streaming responses instead of a readable buffer.

## Root Cause

The root cause of the issue was a mismatch between how the `synthesize_speech` method was implemented and how it was being used:

1. The HTTP endpoint in `voiceagent.py` expected `synthesize_speech` to return a readable buffer (with a `.read()` method)
2. The WebSocket endpoint in `voiceagent_ws.py` needed streaming functionality (yielding chunks)
3. The `synthesize_speech` method was modified to support streaming (using `yield`) but no longer returned a readable buffer

Specifically, the issue was in the `synthesize_speech` method in `openai_voice_client.py`:

```python
def synthesize_speech(self, text: str) -> io.BytesIO:
    """
    TTS streaming via OpenAI Audio → renvoie un buffer MP3 dans un BytesIO.
    """
    buf = io.BytesIO()  # This buffer was created but never used

    # 1) On demande un streaming de la réponse
    response = openai_client.audio.speech.with_streaming_response.create(
        model="tts-1",
        voice=OPENAI_VOICE_ID,
        input=text,
        speed=1.2
    )

    # 2) On accède au contenu de la réponse et on l'itère correctement
    with response as stream:
        for chunk in stream.iter_bytes():
            if chunk:
                yield chunk  # This makes the method a generator

    # This return statement is never reached because of the yield
    return StreamingResponse(gen(), media_type="audio/mpeg")  # gen() is undefined
```

The method was trying to do two incompatible things:
1. Return a generator (using `yield`)
2. Return a `StreamingResponse` (which would never be reached)

Meanwhile, in `voiceagent.py`, the code was trying to call `.read()` on the result:

```python
# 3. Synthèse vocale (TTS)
audio_buf = await run_in_threadpool(voice_agent.synthesize_speech, assistant_text)
audio_out = audio_buf.read()  # Error: 'generator' object has no attribute 'read'
```

## Solution

The solution was to separate the concerns:

1. Keep the original `synthesize_speech` method for HTTP endpoints, ensuring it returns a readable buffer
2. Add a new `synthesize_speech_stream` method for WebSocket streaming

### Changes Made

1. Fixed the `synthesize_speech` method to properly collect chunks into a buffer and return it:

```python
def synthesize_speech(self, text: str) -> io.BytesIO:
    """
    TTS via OpenAI Audio → renvoie un buffer MP3 dans un BytesIO.
    Cette méthode est utilisée par l'endpoint HTTP.
    """
    buf = io.BytesIO()

    # 1) On demande un streaming de la réponse
    response = openai_client.audio.speech.with_streaming_response.create(
        model="tts-1",
        voice=OPENAI_VOICE_ID,
        input=text,
        speed=1.2
    )

    # 2) On accède au contenu de la réponse et on l'écrit dans un buffer
    with response as stream:
        for chunk in stream.iter_bytes():
            if chunk:
                buf.write(chunk)
    
    # 3) On remet le curseur au début pour permettre la lecture
    buf.seek(0)
    return buf
```

2. Added a new `synthesize_speech_stream` method for WebSocket streaming:

```python
def synthesize_speech_stream(self, text: str):
    """
    TTS streaming via OpenAI Audio → yield des chunks pour WebSocket.
    Cette méthode est utilisée par l'endpoint WebSocket.
    """
    # 1) On demande un streaming de la réponse
    response = openai_client.audio.speech.with_streaming_response.create(
        model="tts-1",
        voice=OPENAI_VOICE_ID,
        input=text,
        speed=1.2
    )

    # 2) On accède au contenu de la réponse et on yield les chunks
    with response as stream:
        for chunk in stream.iter_bytes():
            if chunk:
                yield chunk
```

Note that we didn't need to update the WebSocket endpoint (`voiceagent_ws.py`) because it was already handling streaming correctly by directly using the OpenAI client.

## Testing

A test script (`test_tts.py`) was created to verify the fix:

```python
def test_synthesize_speech():
    """Test that synthesize_speech returns a readable buffer."""
    print("Testing synthesize_speech method...")
    
    # Test text
    test_text = "This is a test of the text-to-speech functionality."
    
    try:
        # Call the synthesize_speech method
        audio_buf = voice_agent.synthesize_speech(test_text)
        
        # Check if the buffer is readable
        try:
            audio_data = audio_buf.read()
            print(f"Success! Buffer is readable. Read {len(audio_data)} bytes.")
            
            # Write the audio to a file for manual verification
            with open("test_tts_output.mp3", "wb") as f:
                f.write(audio_data)
            print("Audio saved to test_tts_output.mp3 for manual verification.")
            
            return True
        except Exception as e:
            print(f"Error reading from buffer: {e}")
            return False
    except Exception as e:
        print(f"Error calling synthesize_speech: {e}")
        return False
```

## Lessons Learned

1. **Separation of Concerns**: When a method needs to support multiple use cases (like HTTP and WebSocket), it's better to create separate methods for each use case rather than trying to make one method do everything.

2. **Generator vs. Return**: A function that uses `yield` becomes a generator and cannot also return a value in a meaningful way. The `return` statement in a generator function is only used to signal the end of the generator.

3. **API Contract**: When modifying a method, it's important to consider how it's being used elsewhere in the codebase. Breaking changes should be avoided or carefully managed.

4. **Documentation**: Clear documentation of method behavior, especially regarding return types and side effects, can help prevent these kinds of issues.

## Future Recommendations

1. Consider adding type hints to make it clear what a method returns (e.g., `-> io.BytesIO` vs. `-> Generator[bytes, None, None]`).

2. Add unit tests for critical components like the TTS functionality to catch issues early.

3. When implementing streaming functionality, consider using FastAPI's built-in streaming response types (like `StreamingResponse`) for HTTP endpoints and separate generator methods for WebSocket endpoints.