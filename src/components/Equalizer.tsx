// File: src/components/Equalizer.tsx

"use client";

import { Power, RotateCcw, X, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import type { useEqualizer } from "@/hooks/useEqualizer";
import { hapticLight, hapticMedium } from "@/utils/haptics";

interface EqualizerProps {
  equalizer: ReturnType<typeof useEqualizer>;
  onClose: () => void;
}

export function Equalizer({ equalizer, onClose }: EqualizerProps) {
  const [hoveredBand, setHoveredBand] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (!equalizer.isInitialized) {
      const handleInteraction = () => {
        equalizer.initialize();
      };

      document.addEventListener("click", handleInteraction, { once: true });

      return () => {
        document.removeEventListener("click", handleInteraction);
      };
    }
  }, [equalizer]);

  const formatFrequency = (freq: number): string => {
    if (freq >= 1000) {
      return `${freq / 1000}k`;
    }
    return freq.toString();
  };

  const handlePresetChange = (preset: string) => {
    hapticMedium();
    setIsAnimating(true);
    equalizer.applyPreset(preset);
    setTimeout(() => setIsAnimating(false), 600);
  };

  const handleToggle = () => {
    hapticMedium();
    equalizer.toggle();
  };

  const handleReset = () => {
    hapticLight();
    setIsAnimating(true);
    equalizer.reset();
    setTimeout(() => setIsAnimating(false), 600);
  };

  const handleClose = () => {
    hapticLight();
    onClose();
  };

  return (
    <>
      {/* Backdrop with blur */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={handleClose}
      />

      {/* Compact Floating Panel */}
      <div className="animate-in slide-in-from-right fixed top-4 right-4 z-50 max-h-[calc(100vh-180px)] w-full max-w-sm duration-300 sm:top-20 sm:right-6">
        <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-[rgba(244,178,102,0.16)] bg-[rgba(10,16,24,0.95)] shadow-[0_28px_60px_rgba(5,10,18,0.65)] backdrop-blur-xl">
          {/* Magical glow effect when enabled */}
          {equalizer.isEnabled && (
            <div className="pointer-events-none absolute inset-0 opacity-20">
              <div className="absolute top-0 left-1/2 h-full w-1/2 -translate-x-1/2 bg-[radial-gradient(circle_at_top,rgba(244,178,102,0.4),rgba(88,198,177,0.25),transparent_75%)] blur-3xl" />
            </div>
          )}

          <div className="flex h-full flex-col overflow-hidden">
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[rgba(244,178,102,0.12)] bg-black/30 px-4 py-3 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[linear-gradient(135deg,var(--color-accent),var(--color-accent-strong))] shadow-lg shadow-[rgba(244,178,102,0.3)]">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <h2 className="text-lg font-bold text-[var(--color-text)]">
                  Equalizer
                </h2>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleReset}
                  className="group rounded-lg p-2 text-[var(--color-subtext)] transition-all hover:bg-[rgba(244,178,102,0.12)] hover:text-[var(--color-text)] active:scale-95"
                  title="Reset to flat"
                >
                  <RotateCcw className="h-4 w-4 transition-transform group-hover:rotate-180" />
                </button>
                <button
                  onClick={handleToggle}
                  className={`group relative rounded-lg p-2 transition-all active:scale-95 ${
                    equalizer.isEnabled
                      ? "bg-[linear-gradient(135deg,var(--color-accent),var(--color-accent-strong))] text-[var(--color-text)] shadow-lg shadow-[rgba(244,178,102,0.3)]"
                      : "text-[var(--color-subtext)] hover:bg-[rgba(244,178,102,0.12)] hover:text-[var(--color-text)]"
                  }`}
                  title={equalizer.isEnabled ? "Disable EQ" : "Enable EQ"}
                >
                  <Power className="h-4 w-4" />
                  {equalizer.isEnabled && (
                    <span className="absolute inset-0 animate-ping rounded-lg bg-[rgba(244,178,102,0.4)] opacity-30" />
                  )}
                </button>
                <button
                  onClick={handleClose}
                  className="rounded-lg p-2 text-[var(--color-subtext)] transition-all hover:bg-[rgba(244,178,102,0.12)] hover:text-[var(--color-text)] active:scale-95"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {!equalizer.isInitialized ? (
                <div className="flex items-center justify-center p-12 text-center">
                  <div className="space-y-3">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--color-accent),var(--color-accent-strong))] shadow-xl shadow-[rgba(244,178,102,0.35)]">
                      <Sparkles className="h-8 w-8 animate-pulse text-white" />
                    </div>
                    <p className="text-sm text-[var(--color-text)]">
                      Click anywhere to enable equalizer
                    </p>
                    <p className="text-xs text-[var(--color-subtext)]">
                      Web Audio API requires user interaction
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Presets Dropdown */}
                  <div className="relative border-b border-[rgba(244,178,102,0.12)] bg-black/15 p-4">
                    <label className="mb-2 block text-xs font-medium tracking-wider text-[var(--color-subtext)] uppercase">
                      Preset
                    </label>
                    <select
                      value={equalizer.currentPreset}
                      onChange={(e) => handlePresetChange(e.target.value)}
                      className="w-full cursor-pointer rounded-lg border border-[rgba(244,178,102,0.18)] bg-[rgba(18,26,38,0.92)] px-4 py-2.5 text-sm text-[var(--color-text)] backdrop-blur-sm transition-all hover:border-[rgba(244,178,102,0.35)] focus:border-[rgba(244,178,102,0.4)] focus:ring-2 focus:ring-[rgba(244,178,102,0.25)] focus:outline-none"
                    >
                      {equalizer.presets.map((preset) => (
                        <option
                          key={preset.name}
                          value={preset.name}
                          className="bg-[var(--color-bg)] text-[var(--color-text)]"
                        >
                          {preset.name}
                        </option>
                      ))}
                      {equalizer.currentPreset === "Custom" && (
                        <option
                          value="Custom"
                          className="bg-[var(--color-bg)] text-[var(--color-text)]"
                        >
                          Custom
                        </option>
                      )}
                    </select>
                  </div>

                  {/* Compact Frequency Bands */}
                  <div className="relative p-6">
                    <div className="flex items-end justify-between gap-3">
                      {equalizer.bands.map((band, index) => {
                        const percentage = ((band.gain + 12) / 24) * 100;
                        const isHovered = hoveredBand === index;
                        const intensity = Math.abs(band.gain) / 12;

                        return (
                          <div
                            key={band.frequency}
                            className="group relative flex flex-1 flex-col items-center gap-2"
                            onMouseEnter={() => setHoveredBand(index)}
                            onMouseLeave={() => setHoveredBand(null)}
                          >
                            {/* Gain value with glow */}
                            <div className="relative">
                              <span
                                className={`text-xs font-bold transition-all duration-200 ${
                                  equalizer.isEnabled && band.gain !== 0
                                    ? "text-[var(--color-text)]"
                                    : "text-[var(--color-muted)]"
                                } ${isHovered ? "scale-110" : ""}`}
                              >
                                {band.gain > 0 ? "+" : ""}
                                {band.gain.toFixed(1)}
                              </span>
                              {equalizer.isEnabled && band.gain !== 0 && (
                                <span className="absolute inset-0 animate-pulse text-xs font-bold text-[var(--color-accent)] opacity-50 blur-sm">
                                  {band.gain > 0 ? "+" : ""}
                                  {band.gain.toFixed(1)}
                                </span>
                              )}
                            </div>

                            {/* Compact Slider - reduced height */}
                            <div className="relative h-32 w-8">
                              <input
                                type="range"
                                min={-12}
                                max={12}
                                step={0.5}
                                value={band.gain}
                                onChange={(e) => {
                                  hapticLight();
                                  equalizer.updateBand(
                                    index,
                                    parseFloat(e.target.value),
                                  );
                                }}
                                disabled={!equalizer.isEnabled}
                                className="vertical-slider absolute inset-0 h-full w-full cursor-pointer appearance-none bg-transparent transition-opacity"
                                style={{
                                  writingMode: "vertical-lr" as const,
                                  WebkitAppearance:
                                    "slider-vertical" as React.CSSProperties["WebkitAppearance"],
                                  transform: "rotate(180deg)",
                                }}
                              />

                              {/* Visual slider track with magical effects */}
                              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                <div
                                  className={`relative h-full w-1.5 overflow-hidden rounded-full ${
                                    equalizer.isEnabled
                                      ? "bg-[rgba(244,178,102,0.08)]"
                                      : "bg-[rgba(255,255,255,0.05)]"
                                  } ${isAnimating ? "animate-pulse" : ""}`}
                                >
                                  {/* Glow effect behind slider */}
                                  {equalizer.isEnabled && band.gain !== 0 && (
                                    <div
                                      className="absolute inset-x-0 blur-md"
                                      style={{
                                        height: `${Math.abs(percentage - 50)}%`,
                                        top: percentage < 50 ? "50%" : "auto",
                                        bottom:
                                          percentage >= 50 ? "50%" : "auto",
                                        background: `linear-gradient(${
                                          percentage >= 50
                                            ? "to bottom"
                                            : "to top"
                                        }, rgba(244, 178, 102, ${intensity * 0.7}), rgba(88, 198, 177, ${intensity * 0.7}))`,
                                      }}
                                    />
                                  )}

                                  {/* Filled portion with gradient */}
                                  <div
                                    className={`absolute inset-x-0 transition-all duration-300 ${
                                      !equalizer.isEnabled
                                        ? "bg-[rgba(255,255,255,0.15)]"
                                        : "bg-[linear-gradient(180deg,var(--color-accent-strong),var(--color-accent))] shadow-lg"
                                    } ${isHovered ? "shadow-[0_0_18px_rgba(244,178,102,0.35)]" : ""}`}
                                    style={{
                                      height: `${Math.abs(percentage - 50)}%`,
                                      top: percentage < 50 ? "50%" : "auto",
                                      bottom: percentage >= 50 ? "50%" : "auto",
                                    }}
                                  />

                                  {/* Center indicator line */}
                                  <div className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 bg-white/30" />

                                  {/* Hover indicator */}
                                  {isHovered && (
                                    <div
                                      className="absolute inset-x-0 h-1 bg-white/50 transition-all duration-200"
                                      style={{
                                        top:
                                          percentage < 50
                                            ? `${percentage}%`
                                            : "auto",
                                        bottom:
                                          percentage >= 50
                                            ? `${100 - percentage}%`
                                            : "auto",
                                      }}
                                    />
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Frequency label */}
                            <span
                              className={`text-xs font-medium transition-all duration-200 ${
                                isHovered
                                  ? "scale-110 text-[var(--color-text)]"
                                  : "text-[var(--color-subtext)]"
                              }`}
                            >
                              {formatFrequency(band.frequency)}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Subtle instructions */}
                    <div className="mt-6 text-center">
                      <p className="text-xs text-[var(--color-muted)]">
                        Drag sliders to adjust • Range: -12dB to +12dB
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
