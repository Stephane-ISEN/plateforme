# WebSocket Voice Communication System

## Overview

This document describes the WebSocket-based voice communication system implemented in the Manag'IA application. The system provides real-time, low-latency voice interaction with an AI assistant using a continuous streaming approach.

## Key Improvements

Compared to the previous HTTP-based implementation, the WebSocket approach offers several advantages:

1. **Lower Latency**: By streaming audio chunks in real-time rather than waiting for complete recordings, the system provides a more responsive user experience.

2. **Continuous Flow**: The STT → LLM → TTS pipeline operates as a continuous flow, with each step starting as soon as data is available.

3. **Reduced Overhead**: Eliminates base64 encoding/decoding and multiple HTTP requests, resulting in better performance and bandwidth usage.

4. **Better User Experience**: Users receive feedback throughout the process, with transcriptions and partial responses appearing as they become available.

5. **Improved Error Handling**: The WebSocket connection allows for real-time error reporting and recovery.

## Architecture

The system consists of the following components:

### Backend

1. **WebSocket Endpoint** (`voiceagent_ws.py`): Handles WebSocket connections, authentication, and message routing.

2. **Authentication** (`dependencies.py`): Provides WebSocket-specific authentication functions.

3. **Voice Processing Pipeline**:
   - **STT**: Transcribes audio using OpenAI Whisper
   - **LLM**: Processes transcriptions using OpenAI GPT models
   - **TTS**: Converts text responses to speech using OpenAI TTS

### Frontend

1. **WebSocket Client** (`WebSocketClient.tsx`): Manages WebSocket connections, authentication, and message handling.

2. **Streaming Recorder** (`StreamingRecorderSender.tsx`): Captures audio from the microphone and streams it to the server in real-time.

3. **Media Source Player** (`MediaSourcePlayer.tsx`): Plays streaming audio chunks using the MediaSource API.

4. **Voice Page** (`streaming-test-test-pages.tsx`): Integrates all components and manages the UI.

## Data Flow

1. **Client → Server**:
   - User speaks into microphone
   - Audio is captured in small chunks (100ms)
   - Chunks are sent to server via WebSocket
   - Voice Activity Detection (VAD) detects end of speech
   - End-of-audio signal is sent to server

2. **Server Processing**:
   - Audio chunks are collected
   - When end-of-audio is received, STT processing begins
   - Transcription is sent back to client
   - LLM processes the transcription
   - LLM response is sent back to client
   - TTS generates audio from the response
   - Audio chunks are streamed back to client

3. **Server → Client**:
   - Client receives status updates throughout the process
   - Transcription is displayed as soon as available
   - LLM response is displayed as soon as available
   - Audio chunks are received and played using MediaSource API
   - Visualization reacts to the audio playback

## Implementation Details

### Backend

#### WebSocket Endpoint

The WebSocket endpoint is implemented in `voiceagent_ws.py` and provides the following functionality:

- WebSocket connection handling
- Authentication using JWT tokens
- Binary message handling for audio chunks
- Text message handling for control commands
- Status updates to the client
- Error handling and reporting

```python
@router.websocket("/ws/voice")
async def voice_websocket(websocket: WebSocket):
    # Accept the connection
    await websocket.accept()
    
    # Variables to store state
    user = None
    client_id = None
    audio_chunks = []
    history = []
    
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
        user = await get_current_user_ws(token)
        
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
                        
                        # Process in background task
                        asyncio.create_task(
                            process_complete_audio(
                                client_id, 
                                complete_audio, 
                                history, 
                                user
                            )
                        )
            
            elif "bytes" in message:
                # Handle binary audio data
                audio_chunk = message["bytes"]
                audio_chunks.append(audio_chunk)
    
    except WebSocketDisconnect:
        logger.info(f"Client {client_id} disconnected")
        if client_id:
            manager.disconnect(client_id)
```

#### Authentication

WebSocket-specific authentication functions are added to `dependencies.py`:

```python
async def get_current_user_ws(token: str):
    """
    Récupère l'utilisateur actuel à partir du token JWT pour les connexions WebSocket.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY.get_secret_value(), algorithms=settings.ALGORITHM)
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(email=username)
    except JWTError:
        raise credentials_exception
    user = user_crud.get_user_by_email(email=token_data.email)
    if user is None:
        raise credentials_exception
    return UserDisplay(**user)
```

### Frontend

#### WebSocket Client

The WebSocket client is implemented as a custom React hook in `WebSocketClient.tsx`:

```typescript
export const useWebSocketClient = ({
  url,
  token,
  history = [],
  onOpen,
  onClose,
  onError,
  onMessage,
  onTranscription,
  onReply,
  onAudioChunk,
  onStatus,
}: WebSocketClientProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  
  // Connect to WebSocket
  const connect = useCallback(() => {
    // Implementation details...
  }, [url, token, history, onOpen, onClose, onError, onMessage, onTranscription, onReply, onAudioChunk, onStatus, isConnecting]);

  // Send audio chunk
  const sendAudioChunk = useCallback((chunk: Blob) => {
    return sendBinary(chunk);
  }, [sendBinary]);

  // Send end audio command
  const sendEndAudio = useCallback(() => {
    return sendMessage({
      type: "control",
      command: "end_audio"
    });
  }, [sendMessage]);

  // Connect on mount and disconnect on unmount
  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
    sendMessage,
    sendBinary,
    sendAudioChunk,
    sendEndAudio,
    sendReset
  };
};
```

#### Streaming Recorder

The streaming recorder is implemented in `StreamingRecorderSender.tsx` and provides the following functionality:

- Microphone access and recording
- Real-time streaming of audio chunks
- Voice Activity Detection (VAD) for automatic stop
- Visual feedback on recording and connection status

```typescript
const StreamingRecorderSender: React.FC<StreamingRecorderSenderProps> = ({
  wsUrl = "/voice-agent/ws/voice",
  mimeType = "audio/webm;codecs=opus",
  loading = false,
  audioRef,
  onUserInteraction,
  token,
  history = [],
  onTranscription,
  onReply,
  onAudioChunk,
  onStatus,
  onError
}) => {
  const [recording, setRecording] = useState(false);
  const recorderRef = useRef<MediaRecorder>();
  const streamRef = useRef<MediaStream>();
  
  // WebSocket client
  const {
    isConnected,
    isConnecting,
    error: wsError,
    connect,
    disconnect,
    sendAudioChunk,
    sendEndAudio,
    sendReset
  } = useWebSocketClient({
    url: wsUrl,
    token,
    history,
    onTranscription,
    onReply,
    onAudioChunk,
    onStatus,
    onError
  });

  const toggleRecording = async () => {
    if (!recording) {
      // START RECORDING
      try {
        // Get microphone access
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;

        // Create MediaRecorder with smaller timeslice for more frequent chunks
        const recorder = new MediaRecorder(stream, { mimeType });
        recorderRef.current = recorder;

        // Set up data handler to stream chunks to WebSocket
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            // Send audio chunk to WebSocket server
            sendAudioChunk(e.data);
          }
        };

        // Start recording with 100ms timeslice to get frequent chunks
        recorder.start(100);
        setRecording(true);
      } catch (err) {
        console.error("Microphone error:", err);
        if (onError) onError(err);
      }
    } else {
      // STOP RECORDING
      stopRecording();
    }
  };
```

#### Media Source Player

The media source player is implemented in `MediaSourcePlayer.tsx` and provides the following functionality:

- Creation and management of MediaSource objects
- Handling of streaming audio chunks
- Queuing and processing of audio data
- Error handling and reporting

```typescript
const MediaSourcePlayer = React.forwardRef<
  { appendChunk: (chunk: Blob) => void; reset: () => void },
  MediaSourcePlayerProps
>(({
  mimeType = "audio/mpeg",
  autoPlay = true,
  onReady,
  onPlay,
  onEnded,
  onError,
  className = "",
}, ref) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const mediaSourceRef = useRef<MediaSource | null>(null);
  const sourceBufferRef = useRef<SourceBuffer | null>(null);
  const queueRef = useRef<Blob[]>([]);
  const processingRef = useRef<boolean>(false);
  
  // Initialize MediaSource
  useEffect(() => {
    // Implementation details...
  }, [mimeType, onError, onReady]);

  // Process the queue of audio chunks
  const processQueue = useCallback(() => {
    if (
      processingRef.current ||
      queueRef.current.length === 0 ||
      !sourceBufferRef.current ||
      sourceBufferRef.current.updating
    ) {
      return;
    }

    processingRef.current = true;
    const chunk = queueRef.current.shift();
    
    if (chunk) {
      chunk.arrayBuffer().then(buffer => {
        try {
          if (sourceBufferRef.current && !sourceBufferRef.current.updating) {
            sourceBufferRef.current.appendBuffer(buffer);
            
            // Start playback if autoPlay is enabled and audio is not already playing
            if (autoPlay && audioRef.current && audioRef.current.paused) {
              audioRef.current.play().catch(e => {
                console.error("Error starting playback:", e);
                if (onError) onError(e);
              });
            }
          } else {
            // Put the chunk back at the beginning of the queue
            queueRef.current.unshift(chunk);
            processingRef.current = false;
          }
        } catch (e) {
          console.error("Error appending buffer:", e);
          setError(`Error appending buffer: ${e instanceof Error ? e.message : String(e)}`);
          if (onError) onError(e);
          processingRef.current = false;
        }
      });
    }
  }, [autoPlay, onError]);

  // Append a chunk to the queue
  const appendChunk = useCallback((chunk: Blob) => {
    if (!isReady) {
      console.warn("MediaSourcePlayer: Not ready to receive chunks yet");
      return;
    }

    queueRef.current.push(chunk);
    processQueue();
  }, [isReady, processQueue]);
```

## Usage

### Backend Setup

1. Add the WebSocket endpoint to your FastAPI application:

```python
# main.py
from app.api.endpoints import voiceagent_ws

app.include_router(voiceagent_ws.router, prefix="/voice-agent", tags=["voice-agent-ws"])
```

2. Ensure the required dependencies are installed:

```
websockets==10.4
```

### Frontend Setup

1. Add the WebSocket client library to your package.json:

```json
"dependencies": {
  "websocket": "^1.0.34",
  "@types/websocket": "^1.0.10"
}
```

2. Import and use the streaming components:

```tsx
import StreamingRecorderSender from "@/components/voice/StreamingRecorderSender";
import MediaSourcePlayer from "@/components/voice/MediaSourcePlayer";

const VoicePage = () => {
  const mediaSourcePlayerRef = useRef<{ appendChunk: (chunk: Blob) => void; reset: () => void } | null>(null);
  
  const handleAudioChunk = (chunk: Blob) => {
    if (mediaSourcePlayerRef.current) {
      mediaSourcePlayerRef.current.appendChunk(chunk);
    }
  };
  
  return (
    <div>
      <MediaSourcePlayer
        ref={mediaSourcePlayerRef}
        mimeType="audio/mpeg"
        autoPlay={true}
      />
      
      <StreamingRecorderSender
        token={localStorage.getItem("token") || ""}
        onAudioChunk={handleAudioChunk}
        onTranscription={(text) => console.log("Transcription:", text)}
        onReply={(text) => console.log("Reply:", text)}
      />
    </div>
  );
};
```

## Testing

A test script is provided to verify the WebSocket communication and ensure that the implementation works as expected:

```javascript
// test_websocket_voice.js

// Run this script in the browser console when on the streaming voice page
console.log("Starting WebSocket Voice Communication Test...");

// Test 1: Check if WebSocket is supported
if (!window.WebSocket) {
  console.error("WebSocket is not supported in this browser!");
  throw new Error("WebSocket not supported");
}
console.log("✅ WebSocket is supported");

// Additional tests...
```

## Best Practices

1. **Error Handling**: Always handle WebSocket errors and provide appropriate feedback to the user.

2. **Reconnection**: Implement automatic reconnection with exponential backoff for better reliability.

3. **Authentication**: Secure WebSocket connections with proper authentication.

4. **Binary Data**: Use binary WebSocket messages for audio data to reduce overhead.

5. **Chunking**: Use small audio chunks (100ms) for lower latency.

6. **Voice Activity Detection**: Implement VAD to automatically detect the end of speech.

7. **MediaSource API**: Use the MediaSource API for streaming audio playback.

8. **Performance Monitoring**: Monitor WebSocket message sizes and latency.

## Future Improvements

1. **Streaming STT**: Implement streaming speech-to-text for even lower latency.

2. **WebRTC**: Consider using WebRTC for peer-to-peer audio streaming.

3. **OpenAI Realtime API**: Evaluate the OpenAI Realtime API (gpt-4o/mini realtime) for an all-in-one solution.

4. **Compression**: Implement audio compression for better bandwidth usage.

5. **Fallback Mechanism**: Add fallback to HTTP for environments where WebSockets are not supported.

## Conclusion

The WebSocket-based voice communication system provides a significant improvement in latency and user experience compared to the previous HTTP-based implementation. By streaming audio chunks in real-time and processing them as they become available, the system creates a more natural and responsive conversation with the AI assistant.