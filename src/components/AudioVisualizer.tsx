// File: src/components/AudioVisualizer.tsx

"use client";

import { useAudioVisualizer } from "@/hooks/useAudioVisualizer";
import { analyzeAudio, type AudioAnalysis } from "@/utils/audioAnalysis";
import { GripVertical, Maximize2, Minimize2, Move, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { BarsRenderer } from "./visualizers/BarsRenderer";
import { SpectrumRenderer } from "./visualizers/SpectrumRenderer";
import { WaveRenderer } from "./visualizers/WaveRenderer";
import { CircularRenderer } from "./visualizers/CircularRenderer";
import { SpectralWavesRenderer } from "./visualizers/SpectralWavesRenderer";
import { RadialSpectrumRenderer } from "./visualizers/RadialSpectrumRenderer";
import { ParticleRenderer } from "./visualizers/ParticleRenderer";
import { FrequencyRingsRenderer } from "./visualizers/FrequencyRingsRenderer";
import { FrequencyBandBarsRenderer } from "./visualizers/FrequencyBandBarsRenderer";
import { FrequencyBandCircularRenderer } from "./visualizers/FrequencyBandCircularRenderer";
import { FrequencyBandLayeredRenderer } from "./visualizers/FrequencyBandLayeredRenderer";
import { FrequencyBandWaterfallRenderer } from "./visualizers/FrequencyBandWaterfallRenderer";
import { FrequencyBandRadialRenderer } from "./visualizers/FrequencyBandRadialRenderer";
import { FrequencyBandParticlesRenderer } from "./visualizers/FrequencyBandParticlesRenderer";
import type { ColorPalette } from "@/utils/colorExtractor";

interface AudioVisualizerProps {
  audioElement: HTMLAudioElement | null;
  isPlaying: boolean;
  width?: number;
  height?: number;
  barCount?: number;
  barColor?: string;
  barGap?: number;
  type?: "bars" | "wave" | "circular" | "oscilloscope" | "spectrum" | "spectral-waves" | "radial-spectrum" | "particles" | "waveform-mirror" | "frequency-rings" | "frequency-bands" | "frequency-circular" | "frequency-layered" | "frequency-waterfall" | "frequency-radial" | "frequency-particles";
  onTypeChange?: (type: "bars" | "wave" | "circular" | "oscilloscope" | "spectrum" | "spectral-waves" | "radial-spectrum" | "particles" | "waveform-mirror" | "frequency-rings" | "frequency-bands" | "frequency-circular" | "frequency-layered" | "frequency-waterfall" | "frequency-radial" | "frequency-particles") => void;
  colorPalette?: ColorPalette | null;
  isDraggable?: boolean;
  blendWithBackground?: boolean;
  onClose?: () => void;
}

const VISUALIZER_TYPES = [
  "bars",
  "spectrum",
  "oscilloscope",
  "spectral-waves",
  "radial-spectrum",
  "wave",
  "circular",
  "waveform-mirror",
  "particles",
  "frequency-rings",
  "frequency-bands",
  "frequency-circular",
  "frequency-layered",
  "frequency-waterfall",
  "frequency-radial",
  "frequency-particles",
] as const;

export function AudioVisualizer({
  audioElement,
  isPlaying,
  width = 300,
  height = 80,
  barCount = 64,
  barColor = "rgba(99, 102, 241, 0.8)",
  barGap = 2,
  type = "bars",
  onTypeChange,
  colorPalette = null,
  isDraggable = false,
  blendWithBackground = false,
  onClose,
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [currentType, setCurrentType] = useState(type);
  const [showTypeLabel, setShowTypeLabel] = useState(false);
  const resizeStartRef = useRef({ x: 0, y: 0, width: 0, height: 0 });
  const dragStartRef = useRef({ x: 0, y: 0, initialX: 0, initialY: 0 });
  const typeLabelTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  
  // Initialize position and dimensions from localStorage or defaults
  const getInitialDimensions = () => {
    if (typeof window === 'undefined') return { width, height };
    const saved = localStorage.getItem('visualizer-dimensions');
    if (saved) {
      try {
        return JSON.parse(saved) as { width: number; height: number };
      } catch {
        return { width, height };
      }
    }
    return { width, height };
  };

  const getInitialPosition = () => {
    if (typeof window === 'undefined') return { x: 16, y: 16 };
    const saved = localStorage.getItem('visualizer-position');
    if (saved) {
      try {
        return JSON.parse(saved) as { x: number; y: number };
      } catch {
        // Position at bottom left, above player (player is ~100px tall)
        return { x: 16, y: window.innerHeight - height - 140 };
      }
    }
    // Default: bottom left, above player
    return { x: 16, y: window.innerHeight - height - 140 };
  };

  const [dimensions, setDimensions] = useState(getInitialDimensions);
  const [position, setPosition] = useState(getInitialPosition);
  const [isVisible, setIsVisible] = useState(true);
  const [showControls, setShowControls] = useState(false);

  // Keep visualizer in bounds on window resize
  useEffect(() => {
    const handleResize = () => {
      setPosition(prev => ({
        x: Math.max(0, Math.min(window.innerWidth - dimensions.width, prev.x)),
        y: Math.max(0, Math.min(window.innerHeight - dimensions.height, prev.y)),
      }));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [dimensions.width, dimensions.height]);

  // Fade in animation
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Renderer instances
  const barsRendererRef = useRef<BarsRenderer | null>(null);
  const spectrumRendererRef = useRef<SpectrumRenderer | null>(null);
  const waveRendererRef = useRef<WaveRenderer | null>(null);
  const circularRendererRef = useRef<CircularRenderer | null>(null);
  const spectralWavesRendererRef = useRef<SpectralWavesRenderer | null>(null);
  const radialSpectrumRendererRef = useRef<RadialSpectrumRenderer | null>(null);
  const particleRendererRef = useRef<ParticleRenderer | null>(null);
  const frequencyRingsRendererRef = useRef<FrequencyRingsRenderer | null>(null);
  const frequencyBandBarsRendererRef = useRef<FrequencyBandBarsRenderer | null>(null);
  const frequencyBandCircularRendererRef = useRef<FrequencyBandCircularRenderer | null>(null);
  const frequencyBandLayeredRendererRef = useRef<FrequencyBandLayeredRenderer | null>(null);
  const frequencyBandWaterfallRendererRef = useRef<FrequencyBandWaterfallRenderer | null>(null);
  const frequencyBandRadialRendererRef = useRef<FrequencyBandRadialRenderer | null>(null);
  const frequencyBandParticlesRendererRef = useRef<FrequencyBandParticlesRenderer | null>(null);

  const visualizer = useAudioVisualizer(audioElement, {
    fftSize: 2048,
    smoothingTimeConstant: 0.75,
  });

  // Enhanced audio analysis state (using ref for immediate access in render loop)
  const audioAnalysisRef = useRef<AudioAnalysis | null>(null);

  // Initialize renderers
  useEffect(() => {
    barsRendererRef.current = new BarsRenderer(barCount);
    spectrumRendererRef.current = new SpectrumRenderer(barCount, barGap);
    waveRendererRef.current = new WaveRenderer();
    circularRendererRef.current = new CircularRenderer(barCount);
    spectralWavesRendererRef.current = new SpectralWavesRenderer();
    radialSpectrumRendererRef.current = new RadialSpectrumRenderer(barCount);
    particleRendererRef.current = new ParticleRenderer(barCount, barGap, barColor);
    frequencyRingsRendererRef.current = new FrequencyRingsRenderer(8);
    frequencyBandBarsRendererRef.current = new FrequencyBandBarsRenderer();
    frequencyBandCircularRendererRef.current = new FrequencyBandCircularRenderer();
    frequencyBandLayeredRendererRef.current = new FrequencyBandLayeredRenderer();
    frequencyBandWaterfallRendererRef.current = new FrequencyBandWaterfallRenderer();
    frequencyBandRadialRendererRef.current = new FrequencyBandRadialRenderer();
    frequencyBandParticlesRendererRef.current = new FrequencyBandParticlesRenderer();
  }, [barCount, barGap, barColor]);

  // Sync external type changes
  useEffect(() => {
    setCurrentType(type);
  }, [type]);

  // Cleanup type label timeout
  useEffect(() => {
    return () => {
      if (typeLabelTimeoutRef.current) {
        clearTimeout(typeLabelTimeoutRef.current);
      }
    };
  }, []);

  // Initialize visualizer
  useEffect(() => {
    if (audioElement && !visualizer.isInitialized) {
      const handleUserInteraction = () => {
        visualizer.initialize();
      };

      document.addEventListener("click", handleUserInteraction, { once: true });

      return () => {
        document.removeEventListener("click", handleUserInteraction);
      };
    }
  }, [audioElement, visualizer]);

  // Handle cycling through visualizer types
  const cycleVisualizerType = () => {
    const currentIndex = VISUALIZER_TYPES.indexOf(currentType);
    const nextIndex = (currentIndex + 1) % VISUALIZER_TYPES.length;
    const nextType = VISUALIZER_TYPES[nextIndex]!;

    setCurrentType(nextType);

    // Notify parent component of type change
    onTypeChange?.(nextType);

    // Show label briefly
    setShowTypeLabel(true);
    if (typeLabelTimeoutRef.current) {
      clearTimeout(typeLabelTimeoutRef.current);
    }
    typeLabelTimeoutRef.current = setTimeout(() => {
      setShowTypeLabel(false);
    }, 1500);
  };

  // Handle resize start
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    resizeStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      width: dimensions.width,
      height: dimensions.height,
    };
  };

  // Handle resize
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - resizeStartRef.current.x;
      const deltaY = e.clientY - resizeStartRef.current.y;

      const newDimensions = {
        width: Math.max(200, resizeStartRef.current.width + deltaX),
        height: Math.max(80, resizeStartRef.current.height + deltaY),
      };
      setDimensions(newDimensions);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      // Persist dimensions to localStorage
      localStorage.setItem('visualizer-dimensions', JSON.stringify(dimensions));
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, dimensions]);

  // Toggle expanded mode
  const toggleExpanded = () => {
    const newDimensions = !isExpanded 
      ? { width: Math.min(800, window.innerWidth - 32), height: Math.min(400, window.innerHeight - 200) }
      : getInitialDimensions();
    setDimensions(newDimensions);
    setIsExpanded(!isExpanded);
    // Persist to localStorage
    localStorage.setItem('visualizer-dimensions', JSON.stringify(newDimensions));
  };

  // Handle drag start
  const handleDragStart = (e: React.MouseEvent) => {
    if (!isDraggable) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      initialX: position.x,
      initialY: position.y,
    };
  };

  // Handle dragging
  useEffect(() => {
    if (!isDragging || !isDraggable) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaY = e.clientY - dragStartRef.current.y;

      const newPosition = {
        x: Math.max(0, Math.min(window.innerWidth - dimensions.width, dragStartRef.current.initialX + deltaX)),
        y: Math.max(0, Math.min(window.innerHeight - dimensions.height, dragStartRef.current.initialY + deltaY)),
      };
      setPosition(newPosition);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      // Persist position to localStorage
      localStorage.setItem('visualizer-position', JSON.stringify(position));
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, isDraggable, dimensions.width, dimensions.height, position]);











  // Start/stop visualization based on playing state
  useEffect(() => {
    if (!visualizer.isInitialized || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (isPlaying) {
      void visualizer.resumeContext();

      const renderFrame = (data: Uint8Array) => {
        // Perform enhanced audio analysis
        let currentAnalysis: AudioAnalysis | null = null;
        if (visualizer.audioContext && visualizer.analyser) {
          const sampleRate = visualizer.getSampleRate();
          const fftSize = visualizer.getFFTSize();
          currentAnalysis = analyzeAudio(data, sampleRate, fftSize);
          audioAnalysisRef.current = currentAnalysis;
        } else {
          currentAnalysis = audioAnalysisRef.current;
        }

        switch (currentType) {
          case "bars":
            barsRendererRef.current?.render(ctx, data, canvas, barCount, barGap);
            break;
          case "spectrum":
            spectrumRendererRef.current?.render(ctx, data, canvas);
            break;
          case "oscilloscope":
            waveRendererRef.current?.renderOscilloscope(ctx, visualizer.getTimeDomainData(), canvas);
            break;
          case "wave":
            waveRendererRef.current?.renderWave(ctx, visualizer.getTimeDomainData(), canvas);
            break;
          case "waveform-mirror":
            waveRendererRef.current?.renderWaveformMirror(ctx, visualizer.getTimeDomainData(), canvas);
            break;
          case "circular":
            circularRendererRef.current?.render(ctx, data, canvas, barCount);
            break;
          case "spectral-waves":
            spectralWavesRendererRef.current?.render(ctx, data, canvas, barCount);
            break;
          case "radial-spectrum":
            radialSpectrumRendererRef.current?.render(ctx, data, canvas, barCount);
            break;
          case "particles":
            particleRendererRef.current?.render(ctx, data, canvas);
            break;
          case "frequency-rings":
            frequencyRingsRendererRef.current?.render(ctx, data, canvas);
            break;
          case "frequency-bands":
            frequencyBandBarsRendererRef.current?.render(ctx, data, canvas, currentAnalysis);
            break;
          case "frequency-circular":
            frequencyBandCircularRendererRef.current?.render(ctx, data, canvas, currentAnalysis);
            break;
          case "frequency-layered":
            frequencyBandLayeredRendererRef.current?.render(ctx, data, canvas, currentAnalysis);
            break;
          case "frequency-waterfall":
            frequencyBandWaterfallRendererRef.current?.render(ctx, data, canvas, currentAnalysis);
            break;
          case "frequency-radial":
            frequencyBandRadialRendererRef.current?.render(ctx, data, canvas, currentAnalysis);
            break;
          case "frequency-particles":
            frequencyBandParticlesRendererRef.current?.render(ctx, data, canvas, currentAnalysis);
            break;
          default:
            barsRendererRef.current?.render(ctx, data, canvas, barCount, barGap);
            break;
        }
      };

      visualizer.startVisualization(renderFrame);
    } else {
      visualizer.stopVisualization();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    return () => {
      visualizer.stopVisualization();
    };
  }, [isPlaying, visualizer, currentType, barCount, barGap]);

  if (!visualizer.isInitialized) {
    return (
      <div
        className="flex items-center justify-center bg-gray-800/50 rounded-lg border border-gray-700"
        style={{ width: dimensions.width, height: dimensions.height }}
      >
        <p className="text-xs text-gray-500">Click to enable visualizer</p>
      </div>
    );
  }


  // Container style
  const containerStyle: React.CSSProperties = isDraggable
    ? {
        position: "fixed",
        left: position.x,
        top: position.y,
        width: dimensions.width,
        height: dimensions.height,
        zIndex: 40,
        cursor: isDragging ? "grabbing" : "auto",
      }
    : {
        width: dimensions.width,
        height: dimensions.height,
      };

  // Background style with blend mode matching page aesthetic
  const backgroundStyle = blendWithBackground && colorPalette
    ? {
        background: `linear-gradient(135deg, 
          hsla(${colorPalette.hue}, ${colorPalette.saturation}%, ${colorPalette.lightness}%, 0.25), 
          hsla(${colorPalette.hue}, ${colorPalette.saturation}%, ${Math.max(colorPalette.lightness - 10, 5)}%, 0.2))`,
        backdropFilter: "blur(16px)",
        boxShadow: "0 8px 32px rgba(5, 10, 18, 0.5), 0 0 24px rgba(244, 178, 102, 0.08)",
      }
    : {
        background: "linear-gradient(135deg, rgba(18, 26, 38, 0.85), rgba(11, 17, 24, 0.85))",
        backdropFilter: "blur(16px)",
        boxShadow: "0 8px 32px rgba(5, 10, 18, 0.5), 0 0 24px rgba(244, 178, 102, 0.08)",
      };

  return (
    <div
      ref={containerRef}
      className="group relative rounded-xl border border-[rgba(244,178,102,0.2)] transition-all duration-300 ease-out"
      style={{ 
        ...containerStyle, 
        ...backgroundStyle,
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'scale(1)' : 'scale(0.95)',
      }}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Drag Handle (only visible when draggable and hovering) */}
      {isDraggable && (
        <div
          onMouseDown={handleDragStart}
          className={`absolute left-2 top-2 cursor-grab rounded-lg bg-[rgba(244,178,102,0.15)] p-2 text-[var(--color-accent)] transition-all hover:bg-[rgba(244,178,102,0.25)] hover:shadow-[0_0_12px_rgba(244,178,102,0.3)] active:cursor-grabbing ${
            showControls ? 'opacity-100' : 'opacity-0'
          }`}
          title="Drag to move"
        >
          <Move className="h-3.5 w-3.5" />
        </div>
      )}

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        onClick={cycleVisualizerType}
        className="cursor-pointer rounded-xl transition-opacity hover:opacity-95"
        style={{
          width: dimensions.width,
          height: dimensions.height,
          mixBlendMode: blendWithBackground ? "screen" : "normal",
        }}
        title="Click to cycle visualizer type"
      />

      {/* Type Label Overlay */}
      {showTypeLabel && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="rounded-xl border border-[rgba(244,178,102,0.3)] bg-[rgba(12,18,27,0.95)] px-5 py-2.5 shadow-[0_8px_32px_rgba(5,10,18,0.6)] backdrop-blur-md">
            <p className="text-sm font-semibold capitalize tracking-wide text-[var(--color-accent)]">
              {currentType.replace(/-/g, " ")}
            </p>
          </div>
        </div>
      )}

      {/* Controls Overlay (visible on hover) */}
      <div className={`absolute right-2 top-2 flex gap-1.5 transition-all ${
        showControls ? 'opacity-100' : 'opacity-0'
      }`}>
        <button
          onClick={toggleExpanded}
          className="rounded-lg bg-[rgba(12,18,27,0.85)] p-2 text-[var(--color-subtext)] transition-all hover:bg-[rgba(12,18,27,0.95)] hover:text-[var(--color-accent)] hover:shadow-[0_0_12px_rgba(244,178,102,0.2)]"
          title={isExpanded ? "Minimize" : "Maximize"}
        >
          {isExpanded ? (
            <Minimize2 className="h-3.5 w-3.5" />
          ) : (
            <Maximize2 className="h-3.5 w-3.5" />
          )}
        </button>
        {onClose && (
          <button
            onClick={onClose}
            className="rounded-lg bg-[rgba(12,18,27,0.85)] p-2 text-[var(--color-subtext)] transition-all hover:bg-[rgba(244,178,102,0.25)] hover:text-[var(--color-accent)] hover:shadow-[0_0_12px_rgba(244,178,102,0.2)]"
            title="Close visualizer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Resize Handle (visible on hover) */}
      <div
        onMouseDown={handleResizeStart}
        className={`absolute bottom-0 right-0 cursor-nwse-resize rounded-tl-lg bg-[rgba(244,178,102,0.15)] p-1.5 text-[var(--color-accent)] transition-all hover:bg-[rgba(244,178,102,0.25)] hover:shadow-[0_0_12px_rgba(244,178,102,0.3)] ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
        title="Drag to resize"
      >
        <GripVertical className="h-3.5 w-3.5 rotate-45" />
      </div>
    </div>
  );
}
