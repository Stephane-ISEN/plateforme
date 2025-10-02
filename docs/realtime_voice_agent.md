# Realtime Voice Agent Documentation

## Overview

This document describes the implementation of OpenAI's Realtime API for the voice agent feature. The Realtime API uses WebRTC to handle speech-to-text, language model processing, and text-to-speech in a single connection, significantly reducing latency compared to the previous approach.

## Architecture

### Previous Architecture

The previous implementation used a three-step process:

1. **Speech-to-Text (STT)**: Send audio file to `/voice-agent/transcribe` endpoint
2. **Language Model (LLM)**: Send transcription to `/voice-agent/chat` endpoint
3. **Text-to-Speech (TTS)**: Send response to `/voice-agent/tts-stream` endpoint

This approach introduced latency due to the sequential nature of the requests and the data transfers between client and server.

### New Architecture

The new implementation uses WebRTC to connect directly to OpenAI's Realtime API:

1. **WebRTC Negotiation**: Client creates an SDP offer and sends it to the backend proxy
2. **Backend Proxy**: Backend forwards the offer to OpenAI and returns the SDP answer
3. **WebRTC Connection**: Client establishes a direct WebRTC connection with OpenAI
4. **Data Channel**: Client sends configuration and receives events via a data channel
5. **Audio Streaming**: Client sends audio and receives audio responses via WebRTC

This approach significantly reduces latency by eliminating the need for multiple HTTP requests and file transfers.

```
[Client React]──(WebRTC audio + DataChannel)───►[OpenAI Realtime API]
      │                                     ▲
      ├──HTTP/WS───► [FastAPI : /webrtc-offer, /transcripts] ───► [MongoDB]
      └─────────► Gestion utilisateur / récupération historique
```

## Backend Implementation

### New Endpoints

#### `/realtime/webrtc-offer`

This endpoint proxies WebRTC SDP offers to OpenAI's Realtime API and returns the SDP answer:

```python
@router.post("/webrtc-offer", response_class=PlainTextResponse)
async def webrtc_offer(
    sdp: str = Body(..., media_type="application/sdp"),
    model: str = "gpt-4o-mini-realtime-preview",
    current_user=Security(get_current_user),
):
    # Check user role
    check_user_role(current_user, ["SuperAdmin", "Formateur-int", "Formateur-ext", "Formé"])
    
    # Forward the SDP offer to OpenAI
    url = f"https://api.openai.com/v1/realtime?model={model}"
    headers = {
        "Authorization": f"Bearer {OPENAI_KEY}",
        "Content-Type": "application/sdp"
    }
    
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(url, content=sdp, headers=headers)
            
            # Check if the response contains a valid SDP answer, even if status code is not 200
            response_text = resp.text
            if response_text.startswith("v=0"):
                # This appears to be a valid SDP answer, return it regardless of status code
                return response_text
            elif resp.status_code != 200:
                # Only raise an exception if it's not a valid SDP answer and status code is not 200
                raise HTTPException(500, f"OpenAI Realtime API error: {response_text}")
            
            return response_text  # Return the SDP answer
    except httpx.RequestError as e:
        raise HTTPException(500, f"Request to OpenAI failed: {str(e)}")
```

> **Note**: The endpoint checks if the response starts with "v=0" to identify valid SDP answers, even if the status code is not 200. This is because the OpenAI Realtime API sometimes returns valid SDP answers with non-200 status codes.

#### `/realtime/transcripts`

This endpoint saves transcripts received from the WebRTC data channel to MongoDB:

```python
@router.post("/transcripts")
async def save_transcript(
    data: TranscriptCreate,
    current_user=Security(get_current_user),
):
    # Check user role
    check_user_role(current_user, ["SuperAdmin", "Formateur-int", "Formateur-ext", "Formé"])
    
    # Ensure the user_id matches the authenticated user
    if data.user_id != current_user.id:
        raise HTTPException(403, "Cannot save transcript for another user")
    
    # Save the transcript
    result = await transcript_crud.create_transcript(data)
    return {"id": result["id"]}
```

## Frontend Implementation

### RealtimeVoiceAgent Component

The `RealtimeVoiceAgent` component handles WebRTC communication with OpenAI's Realtime API:

```tsx
const RealtimeVoiceAgent: React.FC<RealtimeVoiceAgentProps> = ({
  audioRef,
  onTranscription,
  onResponse,
  onUserInteraction,
  loading = false,
  apiBase,
}) => {
  // State and refs...

  // Initialize WebRTC connection
  const initializeWebRTC = async () => {
    try {
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Create peer connection and add audio track
      const pc = new RTCPeerConnection();
      const track = stream.getAudioTracks()[0];
      pc.addTrack(track, stream);
      
      // Create data channel
      const dataChannel = pc.createDataChannel("oai-events");
      
      // Create and exchange SDP offer/answer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      // Send offer to backend
      const response = await fetch(`${apiBase}/realtime/webrtc-offer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/sdp",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: pc.localDescription?.sdp,
      });
      
      // Set remote description
      const answerSdp = await response.text();
      const answer = new RTCSessionDescription({
        type: "answer",
        sdp: answerSdp,
      });
      await pc.setRemoteDescription(answer);
      
      // Configure session
      configureSession();
    } catch (err) {
      // Error handling...
    }
  };

  // Configure session with OpenAI
  const configureSession = () => {
    const sessionMessage = {
      type: "session.update",
      session: {
        instructions: "Tu es un assistant sympathique qui répond brièvement.",
        voice: "alloy",
        temperature: 0.8,
        input_audio_transcription: { model: "whisper-1" }
      }
    };
    
    dataChannelRef.current?.send(JSON.stringify(sessionMessage));
  };

  // Handle data channel messages
  const handleDataChannelMessage = (message: any) => {
    switch (message.type) {
      case "input_audio_buffer.transcription.completed":
        if (onTranscription && message.transcription) {
          onTranscription(message.transcription);
          saveTranscription(message.transcription);
        }
        break;
        
      case "response.audio_transcript.delta":
        if (onResponse && message.delta && message.delta.text) {
          onResponse(message.delta.text);
        }
        break;
        
      // Other event handlers...
    }
  };

  // UI rendering...
};
```

### Speech Page

The speech page uses the `RealtimeVoiceAgent` component to handle voice interactions:

```tsx
const VoiceAgentPage: React.FC = () => {
  // State and refs...

  // Handle transcription from WebRTC
  const handleTranscription = (text: string) => {
    setCurrentTranscription(text);
    
    // Add user message to history
    setMessages(prev => [
      ...prev,
      { role: "user", content: text }
    ]);
  };

  // Handle response from WebRTC
  const handleResponse = (text: string) => {
    setCurrentResponse(prev => prev + text);
    
    // Update or add assistant message
    setMessages(prev => {
      const lastMessage = prev[prev.length - 1];
      
      // If the last message is from the assistant, update it
      if (lastMessage && lastMessage.role === "assistant") {
        return [
          ...prev.slice(0, prev.length - 1),
          { role: "assistant", content: prev[prev.length - 1].content + text }
        ];
      }
      
      // Otherwise, add a new message
      return [
        ...prev,
        { role: "assistant", content: text }
      ];
    });
  };

  return (
    // UI rendering...
    <RealtimeVoiceAgent
      audioRef={audioRef}
      onTranscription={handleTranscription}
      onResponse={handleResponse}
      loading={loading}
      apiBase={apiBase}
    />
  );
};
```

## Usage

### Starting a Conversation

1. Click the microphone button to initialize the WebRTC connection
2. Once connected, speak into your microphone
3. The transcription will appear on the screen
4. The assistant will respond with both text and audio

### Configuring the Assistant

You can customize the assistant's behavior by modifying the `sessionMessage` in the `configureSession` function:

```javascript
const sessionMessage = {
  type: "session.update",
  session: {
    instructions: "Your custom instructions here",
    voice: "alloy", // or "echo", "fable", "onyx", "nova", "shimmer"
    temperature: 0.8, // 0.0 to 1.0
    input_audio_transcription: { model: "whisper-1" }
  }
};
```

### Handling Events

The data channel sends various events that you can handle:

- `input_audio_buffer.speech_started`: User started speaking
- `input_audio_buffer.speech_stopped`: User stopped speaking
- `input_audio_buffer.transcription.completed`: Transcription is complete
- `output_audio_buffer.started`: Assistant started speaking
- `output_audio_buffer.stopped`: Assistant stopped speaking
- `response.audio_transcript.delta`: Partial response text
- `response.audio_transcript.done`: Response is complete

## Benefits

The new implementation offers several benefits:

1. **Reduced Latency**: Direct WebRTC connection eliminates multiple HTTP requests
2. **Real-time Feedback**: Transcription and response are streamed in real-time
3. **Improved User Experience**: More natural conversation flow
4. **Reduced Server Load**: Audio processing is handled by OpenAI, not the backend

## Troubleshooting

### WebRTC Connection Issues

- Ensure your browser supports WebRTC (Chrome, Firefox, Safari, Edge)
- Check that your microphone is working and permissions are granted
- Verify that your network allows WebRTC connections

### Audio Issues

- Ensure your browser's audio output is working
- Check that the audio element has the `autoPlay` attribute
- Verify that the audio track is properly connected to the audio element

### Backend Issues

- Check that the OpenAI API key is valid
- Verify that the backend is properly forwarding the SDP offer
- Ensure that the user has the correct role permissions

### SDP Answer Issues

- If you see an error message that starts with "v=0" followed by SDP content, this is actually a valid SDP answer being incorrectly treated as an error
- The backend has been modified to detect valid SDP answers (starting with "v=0") and return them regardless of the status code
- If you're still seeing SDP answers as errors, check that the backend is correctly identifying valid SDP answers
- The OpenAI Realtime API sometimes returns valid SDP answers with non-200 status codes, which is why this special handling is necessary