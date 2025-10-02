"use client";

import React, { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import withAuth from "@/src/hocs/withauth";
import Navbar from "@/components/navbar/navbar";
import { Card } from "@/components/ui/Card";
import { Maximize, Minimize } from "lucide-react";

import RealtimeVoiceAgent from "@/components/voice/RealtimeVoiceAgent";
import Visualizer from "@/components/voice/Visualizer";


interface MessageAgent {
  role: "user" | "assistant";
  content: string;
}

const VoiceAgentPage: React.FC = () => {
  const [messages, setMessages] = useState<MessageAgent[]>([]);
  const [loading, setLoading] = useState(false);
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "";
  const audioRef = useRef<HTMLAudioElement>(null);
  const webrtcStreamRef = useRef<MediaStream | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentTranscription, setCurrentTranscription] = useState<string>("");
  const [currentResponse, setCurrentResponse] = useState<string>("");
  
  // Fonction pour recevoir le flux WebRTC
  const handleStreamReady = (stream: MediaStream) => {
    webrtcStreamRef.current = stream;
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    // Check if we're in a browser environment
    if (typeof window === 'undefined' || !containerRef.current) return;
    
    if (!isFullscreen) {
      containerRef.current.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

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
    <div className="flex flex-col h-screen bg-white dark:bg-black dark:text-white">
      {!isFullscreen && <Navbar />}
      <div
        ref={containerRef}
        className={`flex flex-col items-center justify-center ${
          isFullscreen ? "h-screen" : "flex-grow"
        } relative bg-gray-100 dark:bg-gray-900`}
      >
        <button
          onClick={toggleFullscreen}
          className="absolute top-4 right-4 z-10 p-2 bg-white dark:bg-black bg-opacity-50 rounded-full"
        >
          {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
        </button>

        <div className="flex flex-col items-center justify-center h-full w-full">
          <Card className="bg-transparent border-0 w-full h-full flex items-center justify-center">
            <div className="relative w-full h-full">
              <audio ref={audioRef} autoPlay className="hidden" />
              <Visualizer audioRef={audioRef} webrtcStreamRef={webrtcStreamRef} />
              
            </div>
          </Card>
        </div>

        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <RealtimeVoiceAgent
            audioRef={audioRef}
            onTranscription={handleTranscription}
            onResponse={handleResponse}
            onStreamReady={handleStreamReady}
            loading={loading}
            apiBase={apiBase}
          />
        </div>
      </div>
    </div>
  );
};

export default withAuth(VoiceAgentPage);
