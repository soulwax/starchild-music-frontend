// File: src/hooks/useAudioVisualizer.ts

"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface AudioVisualizerOptions {
  fftSize?: number; // Must be a power of 2 between 32 and 32768
  smoothingTimeConstant?: number; // 0-1, controls averaging
  minDecibels?: number;
  maxDecibels?: number;
}

export function useAudioVisualizer(
  audioElement: HTMLAudioElement | null,
  options: AudioVisualizerOptions = {},
) {
  const {
    fftSize = 128,
    smoothingTimeConstant = 0.8,
    minDecibels = -90,
    maxDecibels = -10,
  } = options;

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [frequencyData, setFrequencyData] = useState<Uint8Array>(
    new Uint8Array(0),
  );
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize Web Audio API
  const initialize = useCallback(() => {
    if (!audioElement || isInitialized || audioContextRef.current) return;

    try {
      // Create audio context
      const AudioContext =
        window.AudioContext ||
        (window as Window & { webkitAudioContext?: typeof window.AudioContext })
          .webkitAudioContext;
      if (!AudioContext) {
        console.error("Web Audio API is not supported in this browser");
        return;
      }

      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      // Create analyser node
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = fftSize;
      analyser.smoothingTimeConstant = smoothingTimeConstant;
      analyser.minDecibels = minDecibels;
      analyser.maxDecibels = maxDecibels;
      analyserRef.current = analyser;

      // Create source and connect nodes
      const source = audioContext.createMediaElementSource(audioElement);
      sourceRef.current = source;

      source.connect(analyser);
      analyser.connect(audioContext.destination);

      // Initialize frequency data array
      const bufferLength = analyser.frequencyBinCount;
      setFrequencyData(new Uint8Array(bufferLength));

      setIsInitialized(true);
    } catch (error) {
      console.error("Failed to initialize audio visualizer:", error);
    }
  }, [
    audioElement,
    isInitialized,
    fftSize,
    smoothingTimeConstant,
    minDecibels,
    maxDecibels,
  ]);

  // Get frequency data
  const getFrequencyData = useCallback((): Uint8Array => {
    if (!analyserRef.current) return new Uint8Array(0);

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteFrequencyData(dataArray);

    return dataArray;
  }, []);

  // Get time domain data (waveform)
  const getTimeDomainData = useCallback((): Uint8Array => {
    if (!analyserRef.current) return new Uint8Array(0);

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteTimeDomainData(dataArray);

    return dataArray;
  }, []);

  // Start visualization loop
  const startVisualization = useCallback(
    (callback: (data: Uint8Array) => void) => {
      if (!analyserRef.current) return;

      const updateData = () => {
        if (!analyserRef.current) return;

        const data = getFrequencyData();
        callback(data);

        animationFrameRef.current = requestAnimationFrame(updateData);
      };

      updateData();
    },
    [getFrequencyData],
  );

  // Stop visualization loop
  const stopVisualization = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  // Resume audio context if suspended (required by some browsers)
  const resumeContext = useCallback(async () => {
    if (audioContextRef.current?.state === "suspended") {
      try {
        await audioContextRef.current.resume();
      } catch (error) {
        console.error("Failed to resume audio context:", error);
      }
    }
  }, []);

  // Initialize when audio element changes
  useEffect(() => {
    if (audioElement && !isInitialized) {
      // Wait for user interaction before initializing (browser requirement)
      const handleInteraction = () => {
        initialize();
        document.removeEventListener("click", handleInteraction);
        document.removeEventListener("touchstart", handleInteraction);
      };

      document.addEventListener("click", handleInteraction);
      document.addEventListener("touchstart", handleInteraction);

      return () => {
        document.removeEventListener("click", handleInteraction);
        document.removeEventListener("touchstart", handleInteraction);
      };
    }
  }, [audioElement, isInitialized, initialize]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopVisualization();

      if (audioContextRef.current) {
        void audioContextRef.current.close();
        audioContextRef.current = null;
      }

      analyserRef.current = null;
      sourceRef.current = null;
      setIsInitialized(false);
    };
  }, [stopVisualization]);

  // Get audio context sample rate
  const getSampleRate = useCallback((): number => {
    return audioContextRef.current?.sampleRate ?? 44100;
  }, []);

  // Get FFT size
  const getFFTSize = useCallback((): number => {
    return analyserRef.current?.fftSize ?? fftSize;
  }, [fftSize]);

  return {
    isInitialized,
    frequencyData,
    analyser: analyserRef.current,
    audioContext: audioContextRef.current,
    getFrequencyData,
    getTimeDomainData,
    getSampleRate,
    getFFTSize,
    startVisualization,
    stopVisualization,
    resumeContext,
    initialize,
  };
}
