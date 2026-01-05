// File: src/hooks/useAudioVisualizer.ts

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  getOrCreateAudioConnection,
  releaseAudioConnection,
  ensureConnectionChain,
} from "@/utils/audioContextManager";

export interface AudioVisualizerOptions {
  fftSize?: number;
  smoothingTimeConstant?: number;
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

  const initialize = useCallback(() => {
    if (!audioElement || isInitialized || audioContextRef.current) return;

    try {

      const connection = getOrCreateAudioConnection(audioElement);
      if (!connection) {

        return;
      }

      let analyser = connection.analyser;
      if (!analyser) {
        analyser = connection.audioContext.createAnalyser();
        analyser.fftSize = 2048;
        analyser.smoothingTimeConstant = 0.75;
        connection.analyser = analyser;
      }

      const customAnalyser = connection.audioContext.createAnalyser();
      customAnalyser.fftSize = fftSize;
      customAnalyser.smoothingTimeConstant = smoothingTimeConstant;
      customAnalyser.minDecibels = minDecibels;
      customAnalyser.maxDecibels = maxDecibels;
      analyserRef.current = customAnalyser;

      try {
        if (connection.filters && connection.filters.length > 0) {
          const lastFilter = connection.filters[connection.filters.length - 1]!;

          lastFilter.connect(customAnalyser);
        } else {

          connection.sourceNode.connect(customAnalyser);
        }

      } catch (error) {
        console.error("[useAudioVisualizer] Error connecting custom analyser:", error);
      }

      audioContextRef.current = connection.audioContext;
      sourceRef.current = connection.sourceNode;

      ensureConnectionChain(connection);

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

  const getFrequencyData = useCallback((): Uint8Array => {
    if (!analyserRef.current) return new Uint8Array(0);

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteFrequencyData(dataArray);

    return dataArray;
  }, []);

  const getTimeDomainData = useCallback((): Uint8Array => {
    if (!analyserRef.current) return new Uint8Array(0);

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteTimeDomainData(dataArray);

    return dataArray;
  }, []);

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

  const stopVisualization = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  const resumeContext = useCallback(async () => {
    if (audioContextRef.current?.state === "suspended") {
      try {
        await audioContextRef.current.resume();
      } catch (error) {
        console.error("Failed to resume audio context:", error);
      }
    }
  }, []);

  useEffect(() => {
    if (audioElement && !isInitialized) {

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

  useEffect(() => {
    return () => {
      stopVisualization();

      if (audioElement) {
        releaseAudioConnection(audioElement);
      }

      audioContextRef.current = null;
      analyserRef.current = null;
      sourceRef.current = null;
      setIsInitialized(false);
    };
  }, [stopVisualization, audioElement]);

  const getSampleRate = useCallback((): number => {
    return audioContextRef.current?.sampleRate ?? 44100;
  }, []);

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
