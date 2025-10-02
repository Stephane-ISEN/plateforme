"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Send } from "lucide-react";

interface RecorderSenderProps {
  /** Called with the recorded File when recording stops and sends */
  onComplete: (file: File) => void;
  /** MIME type à utiliser pour l'enregistrement (webm, wav…) */
  mimeType?: string;
  /** Whether the component is in loading state */
  loading?: boolean;
  /** Reference to audio element to pause when recording starts */
  audioRef?: React.RefObject<HTMLAudioElement>;
  /** Callback for when user interacts with the component */
  onUserInteraction?: () => void;
}

/**
 * Composant combiné d'enregistrement et d'envoi audio.
 *
 * Usage:
 *  <RecorderSender onComplete={file => handleSend(file)} mimeType="audio/webm" loading={loading} />
 */
const RecorderSender: React.FC<RecorderSenderProps> = ({
  onComplete,
  mimeType = "audio/webm",
  loading = false,
  audioRef,
  onUserInteraction
}) => {
  const [recording, setRecording] = useState(false);
  const recorderRef = useRef<MediaRecorder>();
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream>();

  // <<< VAD state
  const audioCtxRef = useRef<AudioContext>();
  const analyserRef = useRef<AnalyserNode>();
  const vadRafRef = useRef<number>();
  const silenceStartRef = useRef<number>(0);
  const SILENCE_MS = 800;       // durée de silence pour stop
  const SILENCE_THRESH = 0.01;  // seuil RMS (0–1)

  useEffect(() => {
    return () => {
      // cleanup
      if (recording) stopRecording();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recording]);

  const stopRecording = () => {
    recorderRef.current?.stop();
    setRecording(false);
    // stop mic
    streamRef.current?.getTracks().forEach(t => t.stop());
    // stop VAD loop
    if (vadRafRef.current) cancelAnimationFrame(vadRafRef.current);
    // close ctx optional
    // audioCtxRef.current?.close();
  };

  // <<< tiny RMS helper
  const computeRMS = (data: Uint8Array) => {
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      const v = (data[i] - 128) / 128; // -1..1
      sum += v * v;
    }
    return Math.sqrt(sum / data.length);
  };

  // <<< loop silence detection
  const vadLoop = () => {
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
  };

  const toggleRecording = async () => {
    if (onUserInteraction) onUserInteraction();

    if (!recording) {
      // START
      try {
        audioRef?.current?.pause();

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;

        // MediaRecorder
        const recorder = new MediaRecorder(stream, { mimeType });
        recorderRef.current = recorder;
        chunksRef.current = [];

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };

        recorder.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: mimeType });
          const ext = mimeType.split("/")[1] || "webm";
          const file = new File([blob], `recording.${ext}`, { type: mimeType });
          onComplete(file);
        };

        recorder.start();
        setRecording(true);

        // <<< start VAD
        audioCtxRef.current = new AudioContext();
        analyserRef.current = audioCtxRef.current.createAnalyser();
        analyserRef.current.fftSize = 512;
        const source = audioCtxRef.current.createMediaStreamSource(stream);
        source.connect(analyserRef.current);
        silenceStartRef.current = 0;
        vadLoop();
      } catch (err) {
        console.error("mic error:", err);
      }
    } else {
      // manual stop fallback
      stopRecording();
    }
  };

  return (
    <Button
      onClick={toggleRecording}
      variant={recording ? "destructive" : "default"}
      disabled={loading}
      className="rounded-full flex items-center justify-center bg-white"
    >
      {loading ? (
        <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
      ) : recording ? <Send className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
    </Button>
  );
};

export default RecorderSender;
//       sourceRef.current = audioCtx.createMediaElementSource(audioEl);
//       sourceRef.current.connect(analyser);
//       analyser.connect(audioCtx.destination);
//
