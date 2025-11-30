// File: src/components/visualizers/FrequencyBandWaterfallRenderer.ts

import type { AudioAnalysis } from "@/utils/audioAnalysis";

interface WaterfallLine {
  bands: number[];
  opacity: number;
}

export class FrequencyBandWaterfallRenderer {
  private waterfallHistory: WaterfallLine[] = [];
  private maxHistoryLines = 100;
  private time = 0;

  // Color mapping for each frequency band
  private readonly bandColors = [
    { name: "bass", hue: 0, saturation: 80, lightness: 50 },      // Red/Orange
    { name: "lowMid", hue: 45, saturation: 90, lightness: 55 },  // Yellow
    { name: "mid", hue: 120, saturation: 70, lightness: 50 },     // Green
    { name: "highMid", hue: 180, saturation: 80, lightness: 55 },  // Cyan
    { name: "treble", hue: 240, saturation: 85, lightness: 50 }, // Blue/Purple
  ];

  constructor() {
    // Initialize with empty history
    for (let i = 0; i < this.maxHistoryLines; i++) {
      this.waterfallHistory.push({
        bands: [0, 0, 0, 0, 0],
        opacity: 0,
      });
    }
  }

  public render(
    ctx: CanvasRenderingContext2D,
    data: Uint8Array,
    canvas: HTMLCanvasElement,
    audioAnalysis?: AudioAnalysis | null
  ): void {
    if (audioAnalysis) {
      this.time += 0.02;

      // Vibrant background
      const avgIntensity = audioAnalysis.frequencyBands.bass + audioAnalysis.frequencyBands.mid + audioAnalysis.frequencyBands.treble;
      const hueShift = (avgIntensity / 3) * 40;
      const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      bgGradient.addColorStop(0, `hsla(${250 + hueShift}, 70%, 18%, 1)`);
      bgGradient.addColorStop(1, `hsla(${240 + hueShift}, 65%, 12%, 1)`);
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const bands = [
        audioAnalysis.frequencyBands.bass,
        audioAnalysis.frequencyBands.lowMid,
        audioAnalysis.frequencyBands.mid,
        audioAnalysis.frequencyBands.highMid,
        audioAnalysis.frequencyBands.treble,
      ];

      // Add new line to history
      this.waterfallHistory.unshift({
        bands: [...bands],
        opacity: 1,
      });

      // Remove old lines
      if (this.waterfallHistory.length > this.maxHistoryLines) {
        this.waterfallHistory.pop();
      }

      // Update opacity for fade effect
      this.waterfallHistory.forEach((line, index) => {
        line.opacity = 1 - (index / this.maxHistoryLines) * 0.8;
      });

      const bandWidth = canvas.width / 5;
      const lineHeight = canvas.height / this.maxHistoryLines;

      // Draw waterfall from top to bottom
      this.waterfallHistory.forEach((line, lineIndex) => {
        const y = lineIndex * lineHeight;

        bands.forEach((_, bandIndex) => {
          const bandValue = line.bands[bandIndex] ?? 0;
          const x = bandIndex * bandWidth;
          const width = bandWidth;
          const height = lineHeight;

          const color = this.bandColors[bandIndex]!;
          const hueShift = Math.sin(this.time * 0.3 + bandIndex) * 10;
          const saturation = color.saturation + bandValue * 20;
          const lightness = color.lightness + bandValue * 30;

          // Create gradient for band segment
          const segmentGradient = ctx.createLinearGradient(x, y, x + width, y + height);
          segmentGradient.addColorStop(0, `hsla(${color.hue + hueShift}, ${saturation}%, ${lightness}%, ${bandValue * line.opacity * 0.9})`);
          segmentGradient.addColorStop(1, `hsla(${color.hue + hueShift}, ${saturation}%, ${lightness - 10}%, ${bandValue * line.opacity * 0.7})`);

          ctx.fillStyle = segmentGradient;
          ctx.fillRect(x, y, width, height);

          // Add subtle border between bands
          if (bandIndex > 0) {
            ctx.strokeStyle = `rgba(255, 255, 255, ${line.opacity * 0.1})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x, y + height);
            ctx.stroke();
          }
        });
      });

      // Draw current values as bright overlay on top
      const overlayY = 0;
      bands.forEach((bandValue, bandIndex) => {
        const x = bandIndex * bandWidth;
        const width = bandWidth;
        const height = lineHeight * 2;

        const color = this.bandColors[bandIndex]!;
        const hueShift = Math.sin(this.time * 0.5 + bandIndex) * 10;
        const saturation = color.saturation + bandValue * 25;
        const lightness = color.lightness + bandValue * 35;

        // Bright overlay gradient
        const overlayGradient = ctx.createLinearGradient(x, overlayY, x, overlayY + height);
        overlayGradient.addColorStop(0, `hsla(${color.hue + hueShift}, ${saturation}%, ${lightness + 20}%, ${bandValue * 0.9})`);
        overlayGradient.addColorStop(1, `hsla(${color.hue + hueShift}, ${saturation}%, ${lightness}%, 0)`);

        ctx.fillStyle = overlayGradient;
        ctx.fillRect(x, overlayY, width, height);

        // Glow effect
        ctx.shadowBlur = 20 + bandValue * 30;
        ctx.shadowColor = `hsla(${color.hue + hueShift}, 100%, 60%, ${bandValue * 0.8})`;
        ctx.fillRect(x, overlayY, width, height * 0.5);
        ctx.shadowBlur = 0;
      });
    } else {
      // Fallback: clear canvas if no analysis
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }
}
