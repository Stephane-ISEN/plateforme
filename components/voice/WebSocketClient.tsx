"use client";

import { useEffect, useRef, useState, useCallback } from "react";

// Define message types for type safety
export interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

export interface AudioChunkMessage {
  type: "audio_chunk";
  chunk: Blob;
}

export interface ControlMessage {
  type: "control";
  command: string;
  [key: string]: any;
}

export interface StatusMessage {
  type: "status";
  status: string;
  [key: string]: any;
}

export interface TranscriptionMessage {
  type: "transcription";
  text: string;
}

export interface ReplyMessage {
  type: "reply";
  text: string;
}

export interface ErrorMessage {
  type: "error";
  error: string;
}

export interface WebSocketClientProps {
  url: string;
  token: string;
  history?: any[];
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: any) => void;
  onMessage?: (message: any) => void;
  onTranscription?: (text: string) => void;
  onReply?: (text: string) => void;
  onAudioChunk?: (chunk: Blob) => void;
  onStatus?: (status: string, details?: any) => void;
}

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
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const MAX_RECONNECT_ATTEMPTS = 5;
  const RECONNECT_DELAY = 2000; // 2 seconds
  
  // Create a ref for attemptReconnect to break the circular dependency
  const attemptReconnectRef = useRef<(() => void) | null>(null);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      console.log("WebSocket already connected");
      return;
    }

    if (isConnecting) {
      console.log("WebSocket connection already in progress");
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Create WebSocket connection
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "";
      const wsUrl = url.startsWith("ws") ? url : `${apiBase.replace(/^http/, "ws")}${url}`;
      
      console.log(`Connecting to WebSocket at ${wsUrl}`);
      const ws = new WebSocket(wsUrl, ["permessage-deflate"]);
      socketRef.current = ws;

      // Connection opened
      ws.onopen = () => {
        console.log("WebSocket connection established");
        setIsConnected(true);
        setIsConnecting(false);
        reconnectAttemptsRef.current = 0;

        // Send authentication message
        const auth: any = { token };
        if (history.length) {
          auth.history = JSON.stringify(
            history.map(m => ({ role: m.role, content: m.content }))
          );
        }
        ws.send(JSON.stringify(auth));
        onOpen?.();
      };

      // Connection closed
      ws.onclose = (event) => {
        console.log(`WebSocket connection closed: ${event.code} ${event.reason}`);
        setIsConnected(false);
        setIsConnecting(false);

        // Attempt to reconnect if not closed cleanly
        if (event.code !== 1000 && event.code !== 1001 && attemptReconnectRef.current) {
          attemptReconnectRef.current();
        }

        if (onClose) onClose();
      };

      // Connection error
      ws.onerror = (event) => {
        console.error("WebSocket error:", event);
        setError("WebSocket connection error");
        setIsConnecting(false);

        if (onError) onError(event);
      };

      // Listen for messages
      ws.onmessage = (event) => {
        try {
          if (event.data instanceof Blob) {
            // Handle binary audio data
            if (onAudioChunk) onAudioChunk(event.data);
            return;
          }

          // Handle JSON messages
          const message = JSON.parse(event.data);
          console.log("WebSocket message received:", message);

          // Call the general message handler
          if (onMessage) onMessage(message);

          // Handle specific message types
          if (message.status === "transcription_complete" && message.transcription) {
            if (onTranscription) onTranscription(message.transcription);
          } else if (message.status === "llm_chunk" && message.chunk) {
            // Handle incremental LLM chunks
            console.log("LLM chunk received:", message.chunk);
            // We'll still call onStatus to allow the component to update UI
            if (onStatus) onStatus(message.status, message);
            
            // If text_so_far is provided, use it for the reply
            if (message.text_so_far && onReply) {
              onReply(message.text_so_far);
            }
          } else if (message.status === "complete" && message.reply) {
            // Handle final complete message
            if (onReply) onReply(message.reply);
            if (onStatus) onStatus(message.status, message);
          } else if (message.status) {
            if (onStatus) onStatus(message.status, message);
          } else if (message.error) {
            setError(message.error);
            if (onError) onError(message.error);
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
          if (onError) onError(error);
        }
      };
    } catch (error) {
      console.error("Error creating WebSocket connection:", error);
      setError("Failed to create WebSocket connection");
      setIsConnecting(false);
      if (onError) onError(error);
    }
  }, [isConnecting, url, token, history, onOpen, onClose, onError, onMessage, onAudioChunk, onTranscription, onStatus, onReply]);

  // Attempt to reconnect
  const attemptReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
      console.log("Maximum reconnect attempts reached");
      setError("Failed to reconnect after multiple attempts");
      return;
    }

    reconnectAttemptsRef.current += 1;
    console.log(`Attempting to reconnect (${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS})...`);

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    reconnectTimeoutRef.current = setTimeout(() => {
      connect();
    }, RECONNECT_DELAY * reconnectAttemptsRef.current);
  }, [connect]);
  
  // Assign attemptReconnect to the ref to break circular dependency
  useEffect(() => {
    attemptReconnectRef.current = attemptReconnect;
  }, [attemptReconnect]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.close(1000, "Closed by client");
      socketRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    setIsConnected(false);
    setIsConnecting(false);
  }, []);

  // Send a message
  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      console.error("WebSocket not connected");
      return false;
    }

    try {
      socketRef.current.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error("Error sending WebSocket message:", error);
      return false;
    }
  }, []);

  // Send binary data
  const sendBinary = useCallback((data: Blob | ArrayBuffer) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      console.error("WebSocket not connected");
      return false;
    }

    try {
      socketRef.current.send(data);
      return true;
    } catch (error) {
      console.error("Error sending WebSocket binary data:", error);
      return false;
    }
  }, []);

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

  // Send reset command
  const sendReset = useCallback((resetHistory: boolean = false) => {
    return sendMessage({
      type: "control",
      command: "reset",
      reset_history: resetHistory
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

export default useWebSocketClient;