// File: src/components/FlowFieldBackground.tsx

"use client";

import {
  ensureConnectionChain,
  getOrCreateAudioConnection,
  releaseAudioConnection,
} from "@/utils/audioContextManager";
import { useEffect, useRef, useState } from "react";
import { FlowFieldRenderer } from "./visualizers/FlowFieldRenderer";

interface FlowFieldBackgroundProps {
  audioElement: HTMLAudioElement | null;
  onRendererReady?: (renderer: FlowFieldRenderer | null) => void;
}

export function FlowFieldBackground({
  audioElement,
  onRendererReady,
}: FlowFieldBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<FlowFieldRenderer | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const connectedAudioElementRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!audioElement) {
      setIsPlaying(false);
      return;
    }

    const handlePlay = () => {
      console.log("[FlowFieldBackground] Audio play event");
      setIsPlaying(true);
    };
    const handlePause = () => {
      console.log("[FlowFieldBackground] Audio pause event");
      setIsPlaying(false);
    };

    setIsPlaying(!audioElement.paused);

    audioElement.addEventListener("play", handlePlay);
    audioElement.addEventListener("pause", handlePause);

    return () => {
      audioElement.removeEventListener("play", handlePlay);
      audioElement.removeEventListener("pause", handlePause);
    };
  }, [audioElement]);

  useEffect(() => {
    if (!audioElement) {

      if (connectedAudioElementRef.current) {
        releaseAudioConnection(connectedAudioElementRef.current);
      }
      sourceNodeRef.current = null;
      analyserRef.current = null;
      audioContextRef.current = null;
      connectedAudioElementRef.current = null;
      return;
    }

    const connection = getOrCreateAudioConnection(audioElement);
    if (!connection) {
      sourceNodeRef.current = null;
      analyserRef.current = null;
      audioContextRef.current = null;
      connectedAudioElementRef.current = null;
      return;
    }

    let analyser = connection.analyser;
    if (!analyser) {
      analyser = connection.audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.75;
      connection.analyser = analyser;
    }

    audioContextRef.current = connection.audioContext;
    analyserRef.current = analyser;
    sourceNodeRef.current = connection.sourceNode;
    connectedAudioElementRef.current = audioElement;

    ensureConnectionChain(connection);

    console.log("[FlowFieldBackground] Audio connection setup complete", {
      hasAnalyser: !!connection.analyser,
      hasFilters: !!(connection.filters && connection.filters.length > 0),
      contextState: connection.audioContext.state,
    });

    return () => {

      if (connectedAudioElementRef.current) {
        releaseAudioConnection(connectedAudioElementRef.current);
      }
      sourceNodeRef.current = null;
      analyserRef.current = null;
      audioContextRef.current = null;
      connectedAudioElementRef.current = null;
    };
  }, [audioElement]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const updateSize = () => {

      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      if (rendererRef.current) {
        rendererRef.current.resize(window.innerWidth, window.innerHeight);
      } else {
        rendererRef.current = new FlowFieldRenderer(canvas);
      }
      onRendererReady?.(rendererRef.current);
    };

    updateSize();
    window.addEventListener("resize", updateSize);

    return () => {
      window.removeEventListener("resize", updateSize);
      onRendererReady?.(null);
      rendererRef.current = null;
    };
  }, [onRendererReady]);

  useEffect(() => {
    console.log("[FlowFieldBackground] Animation loop check", {
      isPlaying,
      hasAnalyser: !!analyserRef.current,
      hasRenderer: !!rendererRef.current,
    });

    if (!isPlaying || !analyserRef.current || !rendererRef.current) {
      if (animationFrameRef.current) {
        console.log("[FlowFieldBackground] Stopping animation loop");
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    console.log("[FlowFieldBackground] Starting animation loop");

    const analyser = analyserRef.current;
    const renderer = rendererRef.current;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const animate = () => {
      analyser.getByteFrequencyData(dataArray);
      renderer.render(dataArray, dataArray.length);
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    if (audioContextRef.current?.state === "suspended") {
      void audioContextRef.current.resume();
    }

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isPlaying]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: -1,
        pointerEvents: "none",
        opacity: 0.6,
        filter: "blur(8px) contrast(1.4) saturate(1.6)",
        mixBlendMode: "screen",
      }}
    />
  );
}
