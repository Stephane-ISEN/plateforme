"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";

interface OptimizedMediaSourcePlayerProps {
  /** MIME type of the audio chunks */
  mimeType?: string;
  /** Whether to auto-play when audio chunks are received */
  autoPlay?: boolean;
  /** Initial buffer size in milliseconds before starting playback */
  initialBufferMs?: number;
  /** Maximum buffer size in milliseconds */
  maxBufferMs?: number;
  /** Callback for when the player is ready to receive chunks */
  onReady?: () => void;
  /** Callback for when playback starts */
  onPlay?: () => void;
  /** Callback for when playback ends */
  onEnded?: () => void;
  /** Callback for buffer status updates */
  onBufferStatus?: (status: { 
    bufferedMs: number, 
    playbackRate: number, 
    bufferHealth: 'low' | 'optimal' | 'high' 
  }) => void;
  /** Callback for errors */
  onError?: (error: any) => void;
  /** Additional CSS class names */
  className?: string;
}

/**
 * An optimized component that uses MediaSource API to play streaming audio chunks
 * with reduced latency and adaptive buffer management.
 * 
 * Usage:
 * ```tsx
 * const handleAudioChunk = (chunk: Blob) => {
 *   if (mediaSourcePlayerRef.current) {
 *     mediaSourcePlayerRef.current.appendChunk(chunk);
 *   }
 * };
 * 
 * <OptimizedMediaSourcePlayer
 *   ref={mediaSourcePlayerRef}
 *   mimeType="audio/mpeg"
 *   autoPlay={true}
 *   initialBufferMs={100}
 *   maxBufferMs={2000}
 *   onReady={() => console.log("Player ready")}
 *   onBufferStatus={(status) => console.log("Buffer status:", status)}
 * />
 * ```
 */
const OptimizedMediaSourcePlayer = React.forwardRef<
  { appendChunk: (chunk: Blob) => void; reset: () => void },
  OptimizedMediaSourcePlayerProps
>(({
  mimeType = "audio/mpeg",
  autoPlay = true,
  initialBufferMs = 100, // Start playback after 100ms of audio
  maxBufferMs = 2000,    // Maximum 2 seconds of buffered audio
  onReady,
  onPlay,
  onEnded,
  onBufferStatus,
  onError,
  className = "",
}, ref) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const mediaSourceRef = useRef<MediaSource | null>(null);
  const sourceBufferRef = useRef<SourceBuffer | null>(null);
  const queueRef = useRef<Blob[]>([]);
  const processingRef = useRef<boolean>(false);
  const playbackStartedRef = useRef<boolean>(false);
  const bufferSizeRef = useRef<number>(0);
  const lastBufferCheckRef = useRef<number>(0);
  const bufferCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estimated audio duration in milliseconds per byte
  // This is an approximation for MP3 at 128kbps: ~16 bytes per ms
  const BYTES_PER_MS = 16;
  
  // Monitor buffer health and adjust playback rate
  const monitorBufferHealth = useCallback(() => {
    const audioElement = audioRef.current;
    if (!audioElement || !sourceBufferRef.current) return;

    // Skip if not playing
    if (audioElement.paused) return;

    // Calculate buffered time
    let bufferedMs = 0;
    if (sourceBufferRef.current.buffered.length > 0) {
      const bufferedEnd = sourceBufferRef.current.buffered.end(sourceBufferRef.current.buffered.length - 1);
      const currentTime = audioElement.currentTime;
      bufferedMs = (bufferedEnd - currentTime) * 1000;
    }

    // Determine buffer health
    let bufferHealth: 'low' | 'optimal' | 'high' = 'optimal';
    let targetPlaybackRate = 1.0;

    if (bufferedMs < initialBufferMs * 0.5) {
      // Buffer critically low
      bufferHealth = 'low';
      targetPlaybackRate = 0.9; // Slow down to allow buffer to build
    } else if (bufferedMs > maxBufferMs * 0.8) {
      // Buffer too high
      bufferHealth = 'high';
      targetPlaybackRate = 1.1; // Speed up to reduce buffer
    } else {
      // Buffer in optimal range
      bufferHealth = 'optimal';
      targetPlaybackRate = 1.0;
    }

    // Apply playback rate changes gradually
    if (Math.abs(audioElement.playbackRate - targetPlaybackRate) > 0.05) {
      audioElement.playbackRate = targetPlaybackRate;
    }

    // Report buffer status
    if (onBufferStatus) {
      onBufferStatus({
        bufferedMs,
        playbackRate: audioElement.playbackRate,
        bufferHealth
      });
    }

    // Update buffer size reference
    bufferSizeRef.current = bufferedMs;
    lastBufferCheckRef.current = Date.now();
  }, [initialBufferMs, maxBufferMs, onBufferStatus]);

  // Process the queue of audio chunks with optimized strategy
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
    
    // Get estimated buffer size in milliseconds
    const currentBufferMs = bufferSizeRef.current;
    
    // Determine how many chunks to process based on buffer health
    let chunksToProcess = 1;
    
    if (currentBufferMs < initialBufferMs * 0.5) {
      // Buffer is low, process more chunks
      chunksToProcess = 3;
    } else if (currentBufferMs > maxBufferMs * 0.8) {
      // Buffer is high, process just one chunk
      chunksToProcess = 1;
    }
    
    // Process chunks
    const processNextChunk = () => {
      if (chunksToProcess <= 0 || queueRef.current.length === 0) {
        processingRef.current = false;
        return;
      }
      
      const chunk = queueRef.current.shift();
      if (!chunk) {
        processingRef.current = false;
        return;
      }
      
      chunk.arrayBuffer().then(buffer => {
        try {
          if (sourceBufferRef.current && !sourceBufferRef.current.updating) {
            sourceBufferRef.current.appendBuffer(buffer);
            
            // Update buffer size estimate
            bufferSizeRef.current += (buffer.byteLength / BYTES_PER_MS);
            
            // Start playback if we have enough buffer and autoPlay is enabled
            if (autoPlay && 
                audioRef.current && 
                audioRef.current.paused && 
                !playbackStartedRef.current && 
                bufferSizeRef.current >= initialBufferMs) {
              console.log(`Starting playback with ${bufferSizeRef.current}ms buffer`);
              audioRef.current.play().catch(e => {
                console.error("Error starting playback:", e);
                if (onError) onError(e);
              });
            }
            
            // Process next chunk after this one is appended
            chunksToProcess--;
            if (chunksToProcess > 0 && queueRef.current.length > 0) {
              // Continue processing in the updateend event
              return;
            }
            
            processingRef.current = false;
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
    };
    
    processNextChunk();
  }, [autoPlay, initialBufferMs, maxBufferMs, onError]);

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

    // Start buffer monitoring
    bufferCheckIntervalRef.current = setInterval(monitorBufferHealth, 500);

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

      if (bufferCheckIntervalRef.current) {
        clearInterval(bufferCheckIntervalRef.current);
      }
    };
  }, [mimeType, onError, onReady, monitorBufferHealth, processQueue]);

  // Set up audio element event listeners
  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement) return;

    const handlePlay = () => {
      console.log("OptimizedMediaSourcePlayer: Audio playback started");
      playbackStartedRef.current = true;
      if (onPlay) onPlay();
    };

    const handleEnded = () => {
      console.log("OptimizedMediaSourcePlayer: Audio playback ended");
      playbackStartedRef.current = false;
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

  // Append a chunk to the queue with optimized handling
  const appendChunk = useCallback((chunk: Blob) => {
    if (!isReady) {
      console.warn("OptimizedMediaSourcePlayer: Not ready to receive chunks yet");
      return;
    }

    // Add to queue
    queueRef.current.push(chunk);
    
    // Estimate buffer size increase
    const estimatedMs = chunk.size / BYTES_PER_MS;
    
    // Check if we need to trim the buffer
    const audioElement = audioRef.current;
    if (audioElement && sourceBufferRef.current && 
        bufferSizeRef.current + estimatedMs > maxBufferMs &&
        sourceBufferRef.current.buffered.length > 0 &&
        !sourceBufferRef.current.updating) {
      
      try {
        // Remove the oldest 500ms from the buffer if it's getting too large
        const start = sourceBufferRef.current.buffered.start(0);
        const removeEnd = Math.min(
          start + 0.5, // Remove 500ms
          audioElement.currentTime - 0.1 // Don't remove what we're currently playing
        );
        
        if (removeEnd > start) {
          sourceBufferRef.current.remove(start, removeEnd);
          // Adjust buffer size estimate
          bufferSizeRef.current -= (removeEnd - start) * 1000;
        }
      } catch (e) {
        console.warn("Error trimming buffer:", e);
      }
    }
    
    // Process the queue
    processQueue();
  }, [isReady, maxBufferMs, processQueue]);

  // Reset the player
  const reset = useCallback(() => {
    // Clear the queue
    queueRef.current = [];
    processingRef.current = false;
    playbackStartedRef.current = false;
    bufferSizeRef.current = 0;

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
    <div className={`optimized-media-source-player ${className}`}>
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

OptimizedMediaSourcePlayer.displayName = "OptimizedMediaSourcePlayer";

export default OptimizedMediaSourcePlayer;