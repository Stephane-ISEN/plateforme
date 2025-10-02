"use client";
import React, { useEffect, useRef, useState } from "react";

interface VisualizerProps {
  audioRef: React.RefObject<HTMLAudioElement>;
  webrtcStreamRef?: React.RefObject<MediaStream | null>; // Nouvelle prop pour accéder au flux WebRTC
  width?: number;
  height?: number;
  theme?: "light" | "dark";
}

// Properly implement the downsample function
function downsample(data: Uint8Array, targetLength: number): Uint8Array {
  if (!data || data.length === 0 || targetLength <= 0) {
    return new Uint8Array(targetLength).fill(0);
  }

  const result = new Uint8Array(targetLength);
  const ratio = data.length / targetLength;

  for (let i = 0; i < targetLength; i++) {
    const start = Math.floor(i * ratio);
    const end = Math.floor((i + 1) * ratio);
    let sum = 0;

    for (let j = start; j < end; j++) {
      sum += data[j < data.length ? j : data.length - 1];
    }

    result[i] = sum / (end - start);
  }

  return result;
}

// Function to force reconnection of audio source
export function reconnectAudioSource(audioRef: React.RefObject<HTMLAudioElement>) {
  if (audioRef.current && audioRef.current.srcObject) {
    console.log("Forcing audio source reconnection");
    // Dispatch the custom event to trigger reconnection
    audioRef.current.dispatchEvent(new Event('srcObjectChanged'));
  } else {
    console.error("Cannot reconnect audio source: audioRef or srcObject is null");
  }
}

export default function Visualizer({ 
  audioRef, 
  webrtcStreamRef, 
  width = 1280, 
  height = 720, 
  theme 
}: VisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<AudioNode | null>(null);
  const audioSetupRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  // taille initialisée avec les props pour éviter size.w = 0
  const [size, setSize] = useState({ w: width, h: height });

  // Safe check for window to avoid SSR issues
  const [isDarkMode, setIsDarkMode] = useState<boolean>(
    theme === "dark" || (theme !== "light" && typeof window !== 'undefined' && window.matchMedia("(prefers-color-scheme: dark)").matches)
  );

  const mock = new Uint8Array(128).fill(50); // pour le mock

  // Listen to theme changes if no theme prop provided
  useEffect(() => {
    if (theme || typeof window === 'undefined') return;

    const matcher = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => setIsDarkMode(matcher.matches);
    matcher.addEventListener("change", handleChange);
    return () => matcher.removeEventListener("change", handleChange);
  }, [theme]);

  useEffect(() => {
    // ResizeObserver pour mettre à jour la taille si le conteneur change
    const parent = canvasRef.current?.parentElement;
    if (!parent) return;
    const ro = new ResizeObserver((entries) => {
      const r = entries[0].contentRect;
      // on n'utilise r.width et r.height que si width/height ne sont pas fournis
      setSize({
        w: width ?? r.width,
        h: height ?? r.height,
      });
    });
    ro.observe(parent);
    return () => ro.disconnect();
  }, [width, height]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const audioEl = audioRef.current;
    if (!canvas || !audioEl) return;

    const ctx2d = canvas.getContext("2d")!;
    let t = 0;
    let data = new Uint8Array(128);

    const setupAudio = () => {
      if (!audioEl) return;

      console.log("Visualizer: Setting up audio context");

      // Create audio context if it doesn't exist
      if (!audioCtxRef.current) {
        console.log("Creating new AudioContext");
        audioCtxRef.current = new AudioContext();
      }
      const ac = audioCtxRef.current;

      // Resume audio context if it's suspended
      if (ac.state === "suspended") {
        console.log("Resuming suspended audio context");
        ac.resume().then(r => r);
      }

      // Create analyzer if it doesn't exist
      if (!analyserRef.current) {
        console.log("Creating new AnalyserNode");
        const analyser = ac.createAnalyser();
        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = 0.7;
        analyserRef.current = analyser;
      }
      const analyser = analyserRef.current;

      // Disconnect any existing source
      if (sourceRef.current) {
        console.log("Disconnecting existing source");
        sourceRef.current.disconnect();
        sourceRef.current = null;
      }

      // Try to use WebRTC stream directly if available
      if (webrtcStreamRef?.current) {
        try {
          console.log("Using WebRTC stream directly");
          const mediaStreamSource = ac.createMediaStreamSource(webrtcStreamRef.current);
          mediaStreamSource.connect(analyser);
          // Note: We don't connect to destination here to avoid feedback
          sourceRef.current = mediaStreamSource;
          audioSetupRef.current = true;
          console.log("WebRTC audio processing chain connected successfully");
          return; // Exit early as we've set up the WebRTC source
        } catch (err) {
          console.error("Error connecting WebRTC stream to analyzer:", err);
          // Fall back to audio element if WebRTC direct connection fails
        }
      }

      // Fall back to audio element if no WebRTC stream or connection failed
      if (audioEl.srcObject) {
        try {
          console.log("Creating new MediaElementSource from audio element");
          sourceRef.current = ac.createMediaElementSource(audioEl);
          sourceRef.current.connect(analyser);
          analyser.connect(ac.destination);
          audioSetupRef.current = true;
          console.log("Audio element processing chain connected successfully");
        } catch (err) {
          console.error("Error connecting audio element to analyzer:", err);
        }
      }

      // dimensionner le buffer
      data = new Uint8Array(analyser.frequencyBinCount);
    };

    setupAudio();

    // Listen for the custom srcObjectChanged event
    audioEl.addEventListener('srcObjectChanged', () => {
      console.log("srcObject changed event detected");
      audioSetupRef.current = false;
      setupAudio();
    });

    // Add a direct event listener for srcObject changes as a fallback
    const checkSrcObjectInterval = setInterval(() => {
      if (audioEl.srcObject && !audioSetupRef.current) {
        console.log("Detected srcObject change via interval check");
        setupAudio();
      }
    }, 1000);

    const drawRadial = (arr: Uint8Array) => {
      const { w, h } = size;
      const cx = w / 2;
      const cy = h / 2;
      const baseR = Math.min(w, h) * 0.28;

      // GRADIENT D'ARRIÈRE-PLAN ADAPTÉ AU THÈME
      let bgGrad;
      const maxSide = Math.max(size.w, size.h);
      const grad = ctx2d.createRadialGradient(cx, cy, 0, cx, cy, maxSide);
      if (isDarkMode) {
        grad.addColorStop(0, "rgba(0,19,46,0.9)");
        grad.addColorStop(0.4, "rgba(0,31,63,0.7)");
        grad.addColorStop(0.8, "rgba(0,12,24,0.5)");
        grad.addColorStop(1, "rgba(0,8,16,0.3)");
      } else {
        grad.addColorStop(0, "rgba(255,255,255,0.95)");
        grad.addColorStop(0.4, "rgba(240,240,240,0.7)");
        grad.addColorStop(0.8, "rgba(230,230,230,0.5)");
        grad.addColorStop(1, "rgba(220,220,220,0.3)");
      }
      bgGrad = grad;

      ctx2d.save();
      ctx2d.globalAlpha = 1;
      ctx2d.fillStyle = bgGrad;
      ctx2d.fillRect(0, 0, size.w, size.h);

      ctx2d.globalCompositeOperation = "overlay";
      ctx2d.globalAlpha = 0.12;
      ctx2d.strokeStyle = isDarkMode ? "#ffffff" : "#000000";
      ctx2d.lineWidth = 2;

      for (let i = 1; i <= 6; i++) {
        const rRing = baseR * i * 0.45;
        ctx2d.beginPath();
        ctx2d.arc(cx, cy, rRing, 0, Math.PI * 2);
        ctx2d.stroke();

        const speed = 0.15 + i * 0.05;
        const angleDot = (t * speed) % (Math.PI * 2);
        const xDot = cx + Math.cos(angleDot) * rRing;
        const yDot = cy + Math.sin(angleDot) * rRing;
        ctx2d.save();
        ctx2d.globalCompositeOperation = "lighter";
        ctx2d.fillStyle = isDarkMode ? "#ffffff" : "#000000";
        ctx2d.shadowBlur = 6;
        ctx2d.shadowColor = isDarkMode ? "#ffffff" : "#000000";
        ctx2d.beginPath();
        ctx2d.arc(xDot, yDot, 3, 0, Math.PI * 2);
        ctx2d.fill();
        ctx2d.restore();
      }
      ctx2d.restore();

      // PATH PRINCIPAL
      ctx2d.lineWidth = 2;
      ctx2d.strokeStyle = isDarkMode ? "#00e5ff" : "#0070cc";
      ctx2d.beginPath();

      const ANGLES = Math.max(240, arr.length * 2);
      const circ = new Uint8Array(ANGLES);
      for (let i = 0; i < ANGLES; i++) {
        const idx = Math.floor((i / ANGLES) * arr.length) % arr.length;
        const opp = (idx + Math.floor(arr.length / 2)) % arr.length;
        circ[i] = Math.max(arr[idx], arr[opp]);
      }

      const smooth = new Float32Array(ANGLES);
      const kernel = 2;
      for (let i = 0; i < ANGLES; i++) {
        let sum = 0;
        for (let k = -kernel; k <= kernel; k++) {
          const j = (i + k + ANGLES) % ANGLES;
          sum += circ[j];
        }
        smooth[i] = sum / (kernel * 2 + 1);
      }

      const offset = -Math.PI / 2;
      for (let i = 0; i < ANGLES; i++) {
        const angle = offset + (i / ANGLES) * Math.PI * 2;
        const v = smooth[i] / 255;
        const r = baseR + v * baseR * 0.28;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        if (i === 0) ctx2d.moveTo(x, y);
        else ctx2d.lineTo(x, y);
      }
      ctx2d.closePath();
      ctx2d.stroke();

      ctx2d.save();
      ctx2d.lineWidth = 0.8;
      ctx2d.strokeStyle = isDarkMode ? "#6af7ff" : "#33aadd";
      ctx2d.globalCompositeOperation = "lighter";
      ctx2d.beginPath();

      const offset2 = offset + Math.PI / 2;
      for (let i = 0; i < ANGLES; i++) {
        const angle = offset2 + (i / ANGLES) * Math.PI * 2;
        const v = smooth[i] / 255;
        const r = baseR + v * baseR * 0.28;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        if (i === 0) ctx2d.moveTo(x, y);
        else ctx2d.lineTo(x, y);
      }
      ctx2d.closePath();
      ctx2d.stroke();
      ctx2d.restore();
    };

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw);
      if (!size.w) return;

      if (analyserRef.current) {
        console.log("Getting frequency data");
        analyserRef.current.getByteFrequencyData(data);
        
        // Check if the data contains non-zero values
        const hasAudioData = data.some(value => value > 0);
        if (hasAudioData) {
          console.log("Audio data detected:", data.slice(0, 5));
        }
      } else {
        console.log("No analyser available, using mock data");
        for (let i = 0; i < mock.length; i++) mock[i] = 50 + Math.sin(t + i * 0.1) * 30;
        data = mock;
      }

      canvas.width = size.w;
      canvas.height = size.h;
      ctx2d.clearRect(0, 0, size.w, size.h);

      let avg = 0;
      for (let i = 0; i < data.length; i++) avg += data[i];
      avg /= data.length;

      if (avg > 180) {
        const a = ((avg - 180) / 75) * 0.7;
        ctx2d.fillStyle = `rgba(255,255,255,${Math.min(a, 0.7)})`;
        ctx2d.fillRect(0, 0, size.w, size.h);
      }

      // Use the properly implemented downsample function
      const binsArr = downsample(data, 128);
      drawRadial(binsArr);

      t += 0.03 + (avg / 255) * 0.02;
    };

    draw();

    return () => {
        console.log("Cleaning up Visualizer");
      clearInterval(checkSrcObjectInterval);
      cancelAnimationFrame(rafRef.current!);
    };
  }, [audioRef, webrtcStreamRef, size, isDarkMode, mock]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        background: "transparent",
        pointerEvents: "none",
      }}
    />
  );
}