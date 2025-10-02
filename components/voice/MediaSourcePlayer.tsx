"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";

interface MediaSourcePlayerProps {
  /** MIME type of the audio chunks */
  mimeType?: string;
  /** Whether to auto-play when audio chunks are received */
  autoPlay?: boolean;
  /** Callback for when the player is ready to receive chunks */
  onReady?: () => void;
  /** Callback for when playback starts */
  onPlay?: () => void;
  /** Callback for when playback ends */
  onEnded?: () => void;
  /** Callback for errors */
  onError?: (error: any) => void;
  /** Additional CSS class names */
  className?: string;
}

/**
 * A component that uses MediaSource API to play streaming audio chunks.
 * 
 * Usage:
 * ```tsx
 * const handleAudioChunk = (chunk: Blob) => {
 *   if (mediaSourcePlayerRef.current) {
 *     mediaSourcePlayerRef.current.appendChunk(chunk);
 *   }
 * };
 * 
 * <MediaSourcePlayer
 *   ref={mediaSourcePlayerRef}
 *   mimeType="audio/mpeg"
 *   autoPlay={true}
 *   onReady={() => console.log("Player ready")}
 * />
 * ```
 */
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
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
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
      }).catch(e => {
        console.error("Error converting blob to array buffer:", e);
        setError(`Error converting blob to array buffer: ${e instanceof Error ? e.message : String(e)}`);
        if (onError) onError(e);
        processingRef.current = false;
      });
    } else {
      processingRef.current = false;
    }
  }, [autoPlay, onError]);

  // Initialize MediaSource
  useEffect(() => {
    if (!window.MediaSource) {
      const errorMsg = "MediaSource API is not supported in this browser";
      console.error(errorMsg);
      setError(errorMsg);
      if (onError) onError(new Error(errorMsg));
      return;
    }

    // Capture audioRef.current in a variable that will be in scope for the cleanup function
    const audioElement = audioRef.current;
    if (!audioElement) return;

    try {
      // Create MediaSource
      const mediaSource = new MediaSource();
      mediaSourceRef.current = mediaSource;

      // Create object URL for the MediaSource
      const url = URL.createObjectURL(mediaSource);
      audioElement.src = url;

      // Handle MediaSource open event
      mediaSource.addEventListener("sourceopen", () => {
        try {
          // Create SourceBuffer with appropriate MIME type
          const sourceBuffer = mediaSource.addSourceBuffer(mimeType);
          sourceBufferRef.current = sourceBuffer;

          // Handle SourceBuffer update end event
          sourceBuffer.addEventListener("updateend", () => {
            processingRef.current = false;
            processQueue();
          });

          // Handle SourceBuffer error event
          sourceBuffer.addEventListener("error", (e) => {
            console.error("SourceBuffer error:", e);
            setError("Error in SourceBuffer");
            if (onError) onError(e);
          });

          // Set ready state
          setIsReady(true);
          if (onReady) onReady();
        } catch (e) {
          console.error("Error creating SourceBuffer:", e);
          setError(`Error creating SourceBuffer: ${e instanceof Error ? e.message : String(e)}`);
          if (onError) onError(e);
        }
      });

      // Handle MediaSource error event
      mediaSource.addEventListener("error", (e) => {
        console.error("MediaSource error:", e);
        setError("Error in MediaSource");
        if (onError) onError(e);
      });
    } catch (e) {
      console.error("Error creating MediaSource:", e);
      setError(`Error creating MediaSource: ${e instanceof Error ? e.message : String(e)}`);
      if (onError) onError(e);
    }

    // Cleanup function
    return () => {
      if (mediaSourceRef.current && mediaSourceRef.current.readyState === "open") {
        try {
          mediaSourceRef.current.endOfStream();
        } catch (e) {
          console.error("Error ending MediaSource stream:", e);
        }
      }

      // Use the captured audioElement reference
      if (audioElement) {
        audioElement.src = "";
      }
    };
  }, [mimeType, onError, onReady, processQueue]);

  // Set up audio element event listeners
  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement) return;

    const handlePlay = () => {
      console.log("MediaSourcePlayer: Audio playback started");
      if (onPlay) onPlay();
    };

    const handleEnded = () => {
      console.log("MediaSourcePlayer: Audio playback ended");
      if (onEnded) onEnded();
    };

    const handleError = () => {
      const errorMsg = `Audio error: ${audioElement.error?.message || "unknown error"}`;
      console.error(errorMsg);
      setError(errorMsg);
      if (onError) onError(audioElement.error);
    };

    // Add event listeners
    audioElement.addEventListener("play", handlePlay);
    audioElement.addEventListener("ended", handleEnded);
    audioElement.addEventListener("error", handleError);

    // Cleanup function
    return () => {
      audioElement.removeEventListener("play", handlePlay);
      audioElement.removeEventListener("ended", handleEnded);
      audioElement.removeEventListener("error", handleError);
    };
  }, [onPlay, onEnded, onError]);

  // Append a chunk to the queue
  const appendChunk = useCallback((chunk: Blob) => {
    if (!isReady) {
      console.warn("MediaSourcePlayer: Not ready to receive chunks yet");
      return;
    }

    queueRef.current.push(chunk);
    processQueue();
  }, [isReady, processQueue]);

  // Reset the player
  const reset = useCallback(() => {
    // Clear the queue
    queueRef.current = [];
    processingRef.current = false;

    // Reset the SourceBuffer if possible
    if (sourceBufferRef.current && !sourceBufferRef.current.updating) {
      try {
        sourceBufferRef.current.remove(0, Infinity);
      } catch (e) {
        console.error("Error resetting SourceBuffer:", e);
        if (onError) onError(e);
      }
    }

    // Reset the audio element
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.pause();
    }

    setError(null);
  }, [onError]);

  // Expose methods via ref
  React.useImperativeHandle(ref, () => ({
    appendChunk,
    reset
  }));

  return (
    <div className={`media-source-player ${className}`}>
      <audio 
        ref={audioRef} 
        controls={false} 
        className="hidden"
      />
      {error && (
        <div className="text-red-500 text-xs mt-1">
          {error}
        </div>
      )}
    </div>
  );
});

MediaSourcePlayer.displayName = "MediaSourcePlayer";

export default MediaSourcePlayer;