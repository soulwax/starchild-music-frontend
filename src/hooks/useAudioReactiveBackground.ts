// File: src/hooks/useAudioReactiveBackground.ts

"use client";

import { useAudioVisualizer } from "@/hooks/useAudioVisualizer";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { analyzeAudio } from "@/utils/audioAnalysis";
import { useEffect, useRef } from "react";

export function useAudioReactiveBackground(
  audioElement: HTMLAudioElement | null,
  isPlaying: boolean,
  enabled = true,
) {
  const isMobile = useIsMobile();

  const effectivelyEnabled = enabled && !isMobile;

  const visualizer = useAudioVisualizer(audioElement, {
    fftSize: 128,
    smoothingTimeConstant: 0.9,
  });

  const isInitialized = visualizer.isInitialized;
  const getFrequencyData = visualizer.getFrequencyData;
  const audioContext = visualizer.audioContext;
  const getFFTSize = visualizer.getFFTSize;
  const initialize = visualizer.initialize;
  const resumeContext = visualizer.resumeContext;

  const animationFrameRef = useRef<number | null>(null);
  const previousAnalysisRef = useRef<{
    overallVolume: number;
    bass: number;
  } | null>(null);

  useEffect(() => {

    if (!effectivelyEnabled) {
      document.documentElement.classList.add("visualizer-disabled");
      document.body.classList.add("visualizer-disabled");
    } else {
      document.documentElement.classList.remove("visualizer-disabled");
      document.body.classList.remove("visualizer-disabled");
    }

    if (!effectivelyEnabled || !isPlaying || !isInitialized || !audioElement) {

      document.documentElement.style.setProperty("--audio-intensity", "0");
      document.documentElement.style.setProperty("--audio-bass", "0");
      document.documentElement.style.setProperty("--audio-energy", "0");
      document.documentElement.style.setProperty("--audio-treble", "0");
      document.documentElement.style.setProperty("--audio-hue", "0");
      document.documentElement.style.setProperty("--audio-strobe", "0");

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    const updateBackground = () => {
      const frequencyData = getFrequencyData();
      if (frequencyData.length === 0) {
        animationFrameRef.current = requestAnimationFrame(updateBackground);
        return;
      }

      if (!audioContext) {
        animationFrameRef.current = requestAnimationFrame(updateBackground);
        return;
      }

      const sampleRate = audioContext.sampleRate;
      const fftSize = getFFTSize();
      const analysis = analyzeAudio(frequencyData, sampleRate, fftSize);

      const previous = previousAnalysisRef.current;
      const smoothing = 0.7;

      const overallVolume = previous
        ? previous.overallVolume * smoothing +
          analysis.overallVolume * (1 - smoothing)
        : analysis.overallVolume;

      const bass = previous
        ? previous.bass * smoothing +
          analysis.frequencyBands.bass * (1 - smoothing)
        : analysis.frequencyBands.bass;

      previousAnalysisRef.current = { overallVolume, bass };

      const intensity = Math.min(1, overallVolume * 0.6);
      const bassBoost = Math.min(1, bass * 0.7);
      const energy = Math.min(1, (overallVolume + bass) * 0.5);
      const trebleBoost = Math.min(1, analysis.frequencyBands.treble * 0.6);

      const bassWeight = analysis.frequencyBands.bass;
      const midWeight = analysis.frequencyBands.mid;
      const trebleWeight = analysis.frequencyBands.treble;

      const total = bassWeight + midWeight + trebleWeight;
      const normalizedBass = total > 0 ? bassWeight / total : 0;
      const normalizedMid = total > 0 ? midWeight / total : 0;
      const normalizedTreble = total > 0 ? trebleWeight / total : 0;

      const hue =
        normalizedBass * 60 + normalizedMid * 120 + normalizedTreble * 180;

      const timeHue =
        typeof window !== "undefined" && !document.hidden
          ? (performance.now() / 40) % 360
          : 0;
      const discoHue = (hue + timeHue * 0.5) % 360;

      const strobe = 0;

      document.documentElement.style.setProperty(
        "--audio-intensity",
        intensity.toString(),
      );
      document.documentElement.style.setProperty(
        "--audio-bass",
        bassBoost.toString(),
      );
      document.documentElement.style.setProperty(
        "--audio-energy",
        energy.toString(),
      );
      document.documentElement.style.setProperty(
        "--audio-treble",
        trebleBoost.toString(),
      );
      document.documentElement.style.setProperty(
        "--audio-hue",
        discoHue.toString(),
      );
      document.documentElement.style.setProperty(
        "--audio-strobe",
        strobe.toString(),
      );

      animationFrameRef.current = requestAnimationFrame(updateBackground);
    };

    if (!isInitialized && audioElement) {
      initialize();

      void resumeContext();
    }

    if (isInitialized) {
      animationFrameRef.current = requestAnimationFrame(updateBackground);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [
    enabled,
    isPlaying,
    isInitialized,
    audioElement,
    getFrequencyData,
    audioContext,
    getFFTSize,
    initialize,
    resumeContext,
  ]);
}
