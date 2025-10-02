"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Send, StopCircle } from "lucide-react";

interface RealtimeVoiceAgentProps {
  /** Reference to audio element to play the response */
  audioRef: React.RefObject<HTMLAudioElement>;
  /** Callback for when transcription is received */
  onTranscription?: (text: string) => void;
  /** Callback for when response is received */
  onResponse?: (text: string) => void;
  /** Callback for when user interacts with the component */
  onUserInteraction?: () => void;
  /** Whether the component is in loading state */
  loading?: boolean;
  /** API base URL */
  apiBase: string;
  /** Callback for when the WebRTC stream is ready */
  onStreamReady?: (stream: MediaStream) => void;
}

/**
 * RealtimeVoiceAgent component that uses WebRTC to connect directly to OpenAI's Realtime API.
 * 
 * This component handles:
 * 1. Capturing audio from the user's microphone
 * 2. Establishing a WebRTC connection with OpenAI via the backend proxy
 * 3. Sending audio data and receiving responses via WebRTC
 * 4. Processing events from the data channel
 */

type RealtimeVoiceAgentComponent = React.FC<RealtimeVoiceAgentProps> & {
  remoteStreamRef: MediaStream | null;
  getRemoteStream: () => MediaStream | null;
};


const RealtimeVoiceAgent: RealtimeVoiceAgentComponent = ({
  audioRef,
  onTranscription,
  onResponse,
  onUserInteraction,
  loading = false,
  apiBase,
  onStreamReady,
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isResponding, setIsResponding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // WebRTC references
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  
  // Exposer le flux pour le visualizer
  const getRemoteStream = () => remoteStreamRef.current;

  // Cleanup function
  const cleanup = () => {
    if (dataChannelRef.current) {
      dataChannelRef.current.close();
    }
    
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    // Clear the remote stream reference
    remoteStreamRef.current = null;
    
    setIsConnected(false);
    setIsListening(false);
    setIsResponding(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  // Initialize WebRTC connection
  const initializeWebRTC = async () => {
    try {
      console.log("Initializing WebRTC connection");
      if (onUserInteraction) onUserInteraction();
      
      // Get user media
      console.log("Requesting microphone access");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      console.log("Microphone access granted");
      
      // Create peer connection with STUN servers for better connectivity
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" }
        ]
      });
      peerConnectionRef.current = pc;
      
      // Set up connection state monitoring
      pc.oniceconnectionstatechange = () => {
        console.log("ICE connection state:", pc.iceConnectionState);
        if (pc.iceConnectionState === "failed" || pc.iceConnectionState === "disconnected") {
          setError(`WebRTC connection ${pc.iceConnectionState}`);
        }
      };
      
      pc.onconnectionstatechange = () => {
        console.log("Connection state:", pc.connectionState);
        if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
          setError(`WebRTC connection ${pc.connectionState}`);
        }
      };
      
      // Add audio track to peer connection
      console.log("Adding audio track to peer connection");
      const track = stream.getAudioTracks()[0];
      pc.addTrack(track, stream);
      
      // Create data channel
      console.log("Creating data channel");
      const dataChannel = pc.createDataChannel("oai-events");
      dataChannelRef.current = dataChannel;
      
      // Set up data channel event handlers
      setupDataChannel(dataChannel);
      
      // Set up remote stream handler
      pc.ontrack = (event) => {
        console.log("Received remote track:", event.track.kind);
        remoteStreamRef.current = event.streams[0];
        
        // Update the static property for external access
        RealtimeVoiceAgent.remoteStreamRef = event.streams[0];
        
        // Notifier le parent que le flux est prêt
        if (onStreamReady && event.streams[0]) {
          onStreamReady(event.streams[0]);
        }
        
        if (audioRef.current) {
          console.log("Setting audio element srcObject");
          audioRef.current.srcObject = event.streams[0];
          audioRef.current.dispatchEvent(new Event('srcObjectChanged'));

          // Forcer la lecture audio avec plusieurs tentatives
          const playAudio = () => {
            console.log("Attempting to play audio");
            audioRef.current?.play()
              .then(() => console.log("Audio playback started successfully"))
              .catch(err => {
                console.error("Error playing audio:", err);
                // Créer un contexte audio pour débloquer l'audio
                const audioContext = new AudioContext();
                audioContext.resume().then(() => {
                  console.log("AudioContext resumed");
                  audioRef.current?.play().catch(console.error);
                });
              });
          };

          playAudio();

          // Ajouter des écouteurs d'événements pour détecter quand l'audio est prêt
          audioRef.current.addEventListener('loadedmetadata', playAudio);
          audioRef.current.addEventListener('canplaythrough', playAudio);
        }
      };
      
      // Create offer
      console.log("Creating offer");
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      // Wait for ICE gathering to complete
      console.log("Waiting for ICE gathering to complete");
      await waitForIceGatheringComplete(pc);
      
      // Send offer to backend
      console.log("Sending offer to backend");
      const response = await fetch(`${apiBase}/realtime/webrtc-offer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/sdp",
          "Authorization": `Bearer ${typeof window !== 'undefined' ? localStorage.getItem("token") : ''}`,
        },
        body: pc.localDescription?.sdp,
      });
      
      // Check for valid SDP answer even if status code is not 200
      const answerSdp = await response.text();
      
      if (!answerSdp.startsWith("v=0") && !response.ok) {
        throw new Error(`Failed to negotiate WebRTC: ${response.status} - ${answerSdp}`);
      }
      
      console.log("Received SDP answer");
      
      // Set remote description
      console.log("Setting remote description");
      const answer = new RTCSessionDescription({
        type: "answer",
        sdp: answerSdp,
      });
      
      await pc.setRemoteDescription(answer);
      console.log("Remote description set successfully");
      
      setIsConnected(true);
      setError(null);
      
      // Session will be configured when the data channel opens
      console.log("WebRTC connection established, waiting for data channel to open");
    } catch (err) {
      console.error("WebRTC initialization error:", err);
      setError(`Failed to initialize WebRTC: ${err instanceof Error ? err.message : String(err)}`);
      cleanup();
    }
  };

  // Wait for ICE gathering to complete
  const waitForIceGatheringComplete = (pc: RTCPeerConnection): Promise<void> => {
    return new Promise((resolve) => {
      if (pc.iceGatheringState === "complete") {
        resolve();
        return;
      }
      
      const checkState = () => {
        if (pc.iceGatheringState === "complete") {
          pc.removeEventListener("icegatheringstatechange", checkState);
          resolve();
        }
      };
      
      pc.addEventListener("icegatheringstatechange", checkState);
    });
  };

  // Set up data channel event handlers
  const setupDataChannel = (dataChannel: RTCDataChannel) => {
    dataChannel.onopen = () => {
      console.log("Data channel opened");

      // Configure the session as soon as the data channel is open
      configureSession();
    };

    dataChannel.onclose = () => {
      console.log("Data channel closed");
    };

    dataChannel.onerror = (error) => {
      console.error("Data channel error:", error);
      setError(`Data channel error: ${error}`);
    };

    dataChannel.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log("Received data channel message:", message);
        handleDataChannelMessage(message);
      } catch (err) {
        console.error("Error parsing data channel message:", err);
      }
    };
  };

  // Handle data channel messages
  const handleDataChannelMessage = (message: any) => {
    console.log("Processing message:", message.type);
    
    switch (message.type) {
      case "input_audio_buffer.speech_started":
        console.log("User started speaking");
        setIsListening(true);
        break;
        
      case "input_audio_buffer.speech_stopped":
        console.log("User stopped speaking");
        setIsListening(false);
        break;
        
      case "input_audio_buffer.transcription.completed":
        console.log("Transcription completed:", message.transcription);
        if (onTranscription && message.transcription) {
          onTranscription(message.transcription);
          
          // Save transcription to backend
          saveTranscription(message.transcription);
          
          // Automatically trigger a response after receiving transcription
          console.log("Automatically triggering response");
          triggerResponse();
        }
        break;
        
      case "output_audio_buffer.started":
        console.log("Assistant started speaking");
        setIsResponding(true);
        break;
        
      case "output_audio_buffer.stopped":
        console.log("Assistant stopped speaking");
        setIsResponding(false);
        break;
        
      case "response.audio_transcript.delta":
        if (onResponse && message.delta && message.delta.text) {
          console.log("Response delta:", message.delta.text);
          onResponse(message.delta.text);
        }
        break;
        
      case "response.audio_transcript.done":
        console.log("Response complete");
        break;
        
      case "error":
        console.error("Error from OpenAI:", message.error);
        setError(`Error from OpenAI: ${message.error}`);
        break;
        
      default:
        console.log("Unhandled message type:", message.type);
    }
  };

  // Save transcription to backend
  const saveTranscription = async (text: string) => {
    try {
      await fetch(`${apiBase}/realtime/transcripts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${typeof window !== 'undefined' ? localStorage.getItem("token") : ''}`,
        },
        body: JSON.stringify({
          user_id: "current_user_id", // This will be validated on the server
          text,
          session_id: "default_session",
        }),
      });
    } catch (err) {
      console.error("Failed to save transcription:", err);
    }
  };

  // Configure session with OpenAI
  const configureSession = () => {
    if (!dataChannelRef.current || dataChannelRef.current.readyState !== "open") {
      console.error("Data channel not open");
      return;
    }
    
    const sessionMessage = {
      type: "session.update",
      session: {
        instructions: "Tu es Elysia, assistante vocale de l'événement : l'Odyssée de l'IA, organisé par le journal l'Opinion, chaleureuse qui s’exprime toujours dans un ton convivial et décontracté. Tu es précises et concises (3 ou 4 phrases maximum)",
        voice: "nova",
        temperature: 1.2,
        input_audio_transcription: { model: "whisper-1" }
      }
    };
    
    dataChannelRef.current.send(JSON.stringify(sessionMessage));
  };

  // Trigger a response
  const triggerResponse = () => {
    if (!dataChannelRef.current || dataChannelRef.current.readyState !== "open") {
      console.error("Data channel not open");
      return;
    }
    
    const responseMessage = {
      type: "response.create",
      response: {
        modalities: ["text", "audio"],
        max_output_tokens: 200
      }
    };
    
    dataChannelRef.current.send(JSON.stringify(responseMessage));
  };

  // Toggle connection
  const toggleConnection = async () => {
    if (isConnected) {
      cleanup();
    } else {
      await initializeWebRTC();
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      {error && (
        <div className="text-red-500 text-sm mb-2">{error}</div>
      )}
      
      <Button
        onClick={toggleConnection}
        variant={isConnected ? "destructive" : "default"}
        disabled={loading}
        className="rounded-full flex items-center justify-center bg-white"
      >
        {loading ? (
          <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
        ) : isConnected ? (
          <StopCircle className="h-6 w-6" />
        ) : (
          <Mic className="h-6 w-6" />
        )}
      </Button>
      
      {isConnected && (
        <div className="text-sm">
          {isListening ? "Listening..." : isResponding ? "Responding..." : "Ready"}
        </div>
      )}
    </div>
  );
};

// Create a static property to store the remote stream reference
RealtimeVoiceAgent.remoteStreamRef = null;

// Add a static method to get the remote stream
RealtimeVoiceAgent.getRemoteStream = function() {
  return RealtimeVoiceAgent.remoteStreamRef;
};

export default RealtimeVoiceAgent;