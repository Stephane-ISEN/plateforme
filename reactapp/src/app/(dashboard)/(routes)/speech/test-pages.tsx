"use client";

import React, { useEffect, useState, useRef } from "react";
import withAuth from "@/src/hocs/withauth";
import Navbar from "@/components/navbar/navbar";
import { Card } from "@/components/ui/Card";
import StreamingRecorderSender from "@/components/voice/StreamingRecorderSender";
import OptimizedMediaSourcePlayer from "@/components/voice/OptimizedMediaSourcePlayer";
import { Maximize, Minimize, Activity } from "lucide-react";
import Visualizer from "@/components/voice/Visualizer";

interface MessageAgent {
  role: "user" | "assistant";
  content: string;
}

const VoiceAgentPage: React.FC = () => {
  const [messages, setMessages] = useState<MessageAgent[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentTranscription, setCurrentTranscription] = useState<string | null>(null);
  const [currentReply, setCurrentReply] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const mediaSourcePlayerRef = useRef<{ appendChunk: (chunk: Blob) => void; reset: () => void } | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [bufferStatus, setBufferStatus] = useState<{ 
    bufferedMs: number, 
    playbackRate: number, 
    bufferHealth: 'low' | 'optimal' | 'high' 
  } | null>(null);
  const [showBufferStatus, setShowBufferStatus] = useState(false);
  const [token, setToken] = useState<string>("");
  
  // Performance metrics
  const firstChunkTimeRef = useRef<number | null>(null);
  const lastChunkTimeRef = useRef<number | null>(null);
  const playbackStartTimeRef = useRef<number | null>(null);
  const chunkCountRef = useRef<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);


  // Handle user interaction
  const handleUserInteraction = () => setHasUserInteracted(true);

  // Handle WebSocket events
  const handleTranscription = (text: string) => {
    console.log("Transcription received:", text);
    setCurrentTranscription(text);
    
    // Add user message to history
    setMessages(prev => [...prev, { role: "user", content: text }]);
  };

  const handleReply = (text: string) => {
    console.log("Reply received:", text);
    setCurrentReply(text);
    
    // Update assistant message in history or add a new one
    setMessages(prev => {
      const lastMessage = prev[prev.length - 1];
      
      // If the last message is from the assistant, update it
      if (lastMessage && lastMessage.role === "assistant") {
        return [
          ...prev.slice(0, prev.length - 1),
          { ...lastMessage, content: text }
        ];
      } 
      // Otherwise add a new assistant message
      else {
        return [...prev, { role: "assistant", content: text }];
      }
    });
  };

  const handleAudioChunk = (chunk: Blob) => {
    const now = performance.now();
    
    // Record first chunk time
    if (firstChunkTimeRef.current === null) {
      firstChunkTimeRef.current = now;
      console.log("First audio chunk received at:", now);
    }
    
    // Calculate time since last chunk
    if (lastChunkTimeRef.current !== null) {
      const timeSinceLastChunk = now - lastChunkTimeRef.current;
      console.log(`Chunk #${chunkCountRef.current + 1} received after ${timeSinceLastChunk.toFixed(1)}ms:`, chunk.size, "bytes");
    } else {
      console.log(`First chunk received:`, chunk.size, "bytes");
    }
    
    // Update last chunk time and increment counter
    lastChunkTimeRef.current = now;
    chunkCountRef.current++;
    
    // Append chunk to MediaSourcePlayer
    if (mediaSourcePlayerRef.current) {
      mediaSourcePlayerRef.current.appendChunk(chunk);
    }
  };

  // Reset performance metrics
  const resetPerformanceMetrics = () => {
    console.log("Resetting performance metrics");
    firstChunkTimeRef.current = null;
    lastChunkTimeRef.current = null;
    playbackStartTimeRef.current = null;
    chunkCountRef.current = 0;
    
    // Also reset the media source player if needed
    if (mediaSourcePlayerRef.current) {
      mediaSourcePlayerRef.current.reset();
    }
  };

  const handleStatus = (status: string, details?: any) => {
    console.log("Status update:", status, details);
    
    // Update loading state based on status
    if (status === "transcribing") {
      setLoading(true);
      // Reset metrics when a new transcription starts
      resetPerformanceMetrics();
    } else if (status === "processing_llm" || status === "processing_parallel" || status === "generating_speech") {
      setLoading(true);
    } else if (status === "complete" || status === "error") {
      setLoading(false);
    } else if (status === "reset") {
      // Reset metrics when the WebSocket connection is reset
      resetPerformanceMetrics();
    }
  };

  const handleError = (error: any) => {
    console.error("Error:", error);
    setLoading(false);
  };

  // Handle fullscreen toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!isFullscreen) {
      containerRef.current.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
  // Précharger le contexte audio pour réduire la latence initiale
  if (hasUserInteracted && !audioContextRef.current) {
    audioContextRef.current = new AudioContext();
    // Créer un buffer court et le jouer pour initialiser le système audio
    const buffer = audioContextRef.current.createBuffer(1, 44100, 44100);
    const source = audioContextRef.current.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContextRef.current.destination);
    source.start();
    source.stop(0.001);
    console.log("Audio context préchargé");
  }
}, [hasUserInteracted]);

  // Retrieve token from localStorage on client side
  useEffect(() => {
    // Only access localStorage on the client side
    setToken(localStorage.getItem("token") || "");
  }, []);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-black dark:text-white">
      {!isFullscreen && <Navbar />}

      <div
        ref={containerRef}
        className={`flex flex-col items-center justify-center ${
          isFullscreen ? "h-screen" : "flex-grow"
        } relative bg-gray-100 dark:bg-gray-900`}
      >
        {/* Fullscreen toggle */}
        <button
          onClick={toggleFullscreen}
          className="absolute top-4 right-4 z-10 p-2 bg-white dark:bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-70 transition-all"
        >
          {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
        </button>
        
        {/* Buffer status toggle */}
        <button
          onClick={() => setShowBufferStatus(!showBufferStatus)}
          className="absolute top-4 right-16 z-10 p-2 bg-white dark:bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-70 transition-all"
          title="Toggle buffer status display"
        >
          <Activity size={24} className={showBufferStatus ? "text-green-500" : ""} />
        </button>
        
        {/* Buffer status display */}
        {showBufferStatus && bufferStatus && (
          <div className="absolute top-16 right-4 z-10 p-3 bg-black bg-opacity-70 rounded-lg text-white text-xs font-mono">
            <div className="mb-1">
              <span className="font-bold">Buffer:</span> {bufferStatus.bufferedMs.toFixed(0)}ms
              <span className={`ml-2 px-1 rounded ${
                bufferStatus.bufferHealth === 'low' ? 'bg-red-500' : 
                bufferStatus.bufferHealth === 'high' ? 'bg-yellow-500' : 'bg-green-500'
              }`}>
                {bufferStatus.bufferHealth}
              </span>
            </div>
            <div>
              <span className="font-bold">Playback rate:</span> {bufferStatus.playbackRate.toFixed(2)}x
            </div>
            
            {/* Performance metrics */}
            <div className="mt-2 border-t border-gray-600 pt-1">
              <div>
                <span className="font-bold">Chunks received:</span> {chunkCountRef.current}
              </div>
              {firstChunkTimeRef.current !== null && playbackStartTimeRef.current !== null && (
                <div>
                  <span className="font-bold">Initial latency:</span> {(playbackStartTimeRef.current - firstChunkTimeRef.current).toFixed(0)}ms
                </div>
              )}
              {lastChunkTimeRef.current !== null && firstChunkTimeRef.current !== null && chunkCountRef.current > 1 && (
                <div>
                  <span className="font-bold">Avg chunk interval:</span> {((lastChunkTimeRef.current - firstChunkTimeRef.current) / (chunkCountRef.current - 1)).toFixed(0)}ms
                </div>
              )}
            </div>
            
            <div className="mt-2 text-[10px] text-gray-300">
              Lower buffer = less latency but may stutter<br />
              Higher buffer = smoother but more latency
            </div>
          </div>
        )}

        {/* Overlay interaction prompt */}
        {!hasUserInteracted && (
          <div
            className="absolute inset-0 z-20 flex items-center justify-center bg-black bg-opacity-80 cursor-pointer"
            onClick={handleUserInteraction}
          >
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg text-center max-w-md">
              <h3 className="text-xl font-bold mb-3 text-black dark:text-white">
                Interaction requise
              </h3>
              <p className="mb-4 text-gray-700 dark:text-gray-300">
                Cliquez pour activer l&apos;audio et la visualisation.
              </p>
              <div className="inline-block animate-pulse bg-blue-500 text-white py-2 px-4 rounded-lg">
                Cliquez pour continuer
              </div>
            </div>
          </div>
        )}

        {/* Visualizer */}
        <div className="flex flex-col items-center justify-center h-full w-full">
          <Card className="bg-transparent border-0 w-full h-full flex items-center justify-center">
            <div className="flex flex-col items-center justify-center w-full h-full relative">
              <audio ref={audioRef} className="hidden" />
              <Visualizer
                audioRef={audioRef}
                width={isFullscreen ? window.innerWidth : 1280}
                height={isFullscreen ? window.innerHeight : 720}
              />
              
              {/* Optimized Media Source Player */}
              <OptimizedMediaSourcePlayer
                ref={mediaSourcePlayerRef}
                mimeType="audio/mpeg"
                autoPlay={true}
                initialBufferMs={50}
                maxBufferMs={1000}
                onError={handleError}
                onBufferStatus={setBufferStatus}
                onPlay={() => {
                  playbackStartTimeRef.current = performance.now();
                  console.log("Playback started at:", playbackStartTimeRef.current);
                  if (firstChunkTimeRef.current !== null) {
                    const latency = playbackStartTimeRef.current - firstChunkTimeRef.current;
                    console.log(`Initial latency: ${latency.toFixed(1)}ms`);
                  }
                }}
              />
            </div>
          </Card>
        </div>

        {/* Recorder */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <StreamingRecorderSender
            token={token}
            history={messages}
            loading={loading}
            audioRef={audioRef}
            onUserInteraction={handleUserInteraction}
            onTranscription={handleTranscription}
            onReply={handleReply}
            onAudioChunk={handleAudioChunk}
            onStatus={handleStatus}
            onError={handleError}
          />
        </div>

        {/* Transcription and Reply Display (optional) */}
        {(currentTranscription || currentReply) && (
          <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 w-full max-w-2xl px-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg">
              {currentTranscription && (
                <div className="mb-2">
                  <span className="font-bold text-gray-700 dark:text-gray-300">Vous :</span>
                  <p className="text-gray-800 dark:text-gray-200">{currentTranscription}</p>
                </div>
              )}
              {currentReply && (
                <div>
                  <span className="font-bold text-blue-600 dark:text-blue-400">Assistant :</span>
                  <p className="text-gray-800 dark:text-gray-200">{currentReply}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default withAuth(VoiceAgentPage);