"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Send, Wifi, WifiOff } from "lucide-react";
import useWebSocketClient from "./WebSocketClient";

interface StreamingRecorderSenderProps {
  /** WebSocket URL for voice communication */
  wsUrl?: string;
  /** MIME type to use for recording (webm, wav, etc.) */
  mimeType?: string;
  /** Whether the component is in loading state */
  loading?: boolean;
  /** Reference to audio element to pause when recording starts */
  audioRef?: React.RefObject<HTMLAudioElement>;
  /** Callback for when user interacts with the component */
  onUserInteraction?: () => void;
  /** Authentication token for WebSocket connection */
  token: string;
  /** Conversation history */
  history?: any[];
  /** Callback for transcription */
  onTranscription?: (text: string) => void;
  /** Callback for LLM reply */
  onReply?: (text: string) => void;
  /** Callback for audio chunk */
  onAudioChunk?: (chunk: Blob) => void;
  /** Callback for status updates */
  onStatus?: (status: string, details?: any) => void;
  /** Callback for errors */
  onError?: (error: any) => void;
}

/**
 * Streaming version of RecorderSender that uses WebSockets for real-time communication.
 * 
 * Usage:
 *  <StreamingRecorderSender 
 *    token={localStorage.getItem("token")} 
 *    history={messages} 
 *    onTranscription={handleTranscription}
 *    onReply={handleReply}
 *    onAudioChunk={handleAudioChunk}
 *  />
 */
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
  
  // VAD (Voice Activity Detection) state
  const audioCtxRef = useRef<AudioContext>();
  const analyserRef = useRef<AnalyserNode>();
  const vadRafRef = useRef<number>();
  const silenceStartRef = useRef<number>(0);
  const SILENCE_MS = 800;       // duration of silence to stop
  const SILENCE_THRESH = 0.01;  // RMS threshold (0-1)

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
    onError: (err) => {
      console.error("WebSocket error:", err);
      if (onError) onError(err);
    }
  });

  useEffect(() => {
    return () => {
      // cleanup
      if (recording) stopRecording();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recording]);

  const stopRecording = useCallback(() => {
    recorderRef.current?.stop();
    setRecording(false);
    
    // Stop microphone
    streamRef.current?.getTracks().forEach(t => t.stop());
    
    // Stop VAD loop
    if (vadRafRef.current) cancelAnimationFrame(vadRafRef.current);
    
    // Send end_audio command to server
    sendEndAudio();
  }, [sendEndAudio]);

  // RMS (Root Mean Square) helper for VAD
  const computeRMS = (data: Uint8Array) => {
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      const v = (data[i] - 128) / 128; // -1..1
      sum += v * v;
    }
    return Math.sqrt(sum / data.length);
  };

  // VAD loop to detect silence
  const vadLoop = useCallback(() => {
    if (!analyserRef.current) return;
    
    const arr = new Uint8Array(analyserRef.current.fftSize);
    analyserRef.current.getByteTimeDomainData(arr);
    const rms = computeRMS(arr);

    const now = performance.now();
    if (rms < SILENCE_THRESH) {
      if (!silenceStartRef.current) silenceStartRef.current = now;
      if (now - silenceStartRef.current > SILENCE_MS) {
        stopRecording();
        return;
      }
    } else {
      silenceStartRef.current = 0;
    }
    
    vadRafRef.current = requestAnimationFrame(vadLoop);
  }, [stopRecording]);

  const toggleRecording = async () => {
    if (onUserInteraction) onUserInteraction();

    if (!recording) {
      // START RECORDING
      try {
        // Pause audio playback if needed
        audioRef?.current?.pause();

        // Reset any previous state
        sendReset();

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
        recorder.start(50);
        setRecording(true);

        // Set up VAD
        audioCtxRef.current = new AudioContext();
        analyserRef.current = audioCtxRef.current.createAnalyser();
        analyserRef.current.fftSize = 512;
        const source = audioCtxRef.current.createMediaStreamSource(stream);
        source.connect(analyserRef.current);
        silenceStartRef.current = 0;
        vadLoop();
      } catch (err) {
        console.error("Microphone error:", err);
        if (onError) onError(err);
      }
    } else {
      // STOP RECORDING
      stopRecording();
    }
  };

  return (
    <div className="flex flex-col items-center">
      <Button
        onClick={toggleRecording}
        variant={recording ? "destructive" : "default"}
        disabled={loading || (!isConnected && !recording)}
        className="rounded-full flex items-center justify-center bg-white"
      >
        {loading ? (
          <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
        ) : recording ? (
          <Send className="h-6 w-6" />
        ) : (
          <Mic className="h-6 w-6" />
        )}
      </Button>
      
      {/* Connection status indicator */}
      <div className="mt-2 text-xs flex items-center gap-1">
        {isConnected ? (
          <>
            <Wifi className="h-3 w-3 text-green-500" />
            <span className="text-green-500">Connected</span>
          </>
        ) : isConnecting ? (
          <>
            <div className="animate-pulse">
              <Wifi className="h-3 w-3 text-yellow-500" />
            </div>
            <span className="text-yellow-500">Connecting...</span>
          </>
        ) : (
          <>
            <WifiOff className="h-3 w-3 text-red-500" />
            <span className="text-red-500">Disconnected</span>
          </>
        )}
      </div>
      
      {/* Error message */}
      {wsError && (
        <div className="mt-1 text-xs text-red-500">
          {wsError}
        </div>
      )}
    </div>
  );
};

export default StreamingRecorderSender;