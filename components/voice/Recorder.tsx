// components/voice/Recorder.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface RecorderProps {
  /** Called with the recorded File when recording stops */
  onComplete: (file: File) => void;
  /** MIME type à utiliser pour l’enregistrement (webm, wav…) */
  mimeType?: string;
}

/**
 * Composant d’enregistrement audio.
 *
 * Usage:
 *  <Recorder onComplete={file => setFile(file)} mimeType="audio/webm" />
 */
const Recorder: React.FC<RecorderProps> = ({ onComplete, mimeType = "audio/webm" }) => {
  const [recording, setRecording] = useState(false);
  const recorderRef = useRef<MediaRecorder>();
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    // Cleanup si on démonte en cours d’enregistrement
    return () => {
      if (recording) {
        recorderRef.current?.stop();
        setRecording(false);
      }
    };
  }, [recording]);

  const toggleRecording = async () => {
    if (!recording) {
      // démarrage
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType });
      recorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const ext = mimeType.split("/")[1].replace("audio/", "");
        const file = new File([blob], `recording.${ext}`, { type: mimeType });
        onComplete(file);
        // stoppe toutes les pistes
        stream.getTracks().forEach((t) => t.stop());
      };

      recorder.start();
      setRecording(true);
    } else {
      // arrêt
      recorderRef.current?.stop();
      setRecording(false);
    }
  };

  return (
    <Button onClick={toggleRecording} variant={recording ? "destructive" : "default"}>
      {recording ? "Arrêter l’enregistrement" : "Démarrer l’enregistrement"}
    </Button>
  );
};

export default Recorder;
