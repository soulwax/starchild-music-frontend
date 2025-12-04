// File: src/components/visualizers/FrequencyBandBarsRenderer.ts

import type { AudioAnalysis } from "@/utils/audioAnalysis";

export class FrequencyBandBarsRenderer {
  private peakHistory: number[] = [];
  private barVelocities: number[] = [];
  private time = 0;

  // Color mapping for each frequency band
  private readonly bandColors = [
    { name: "bass", hue: 0, saturation: 80, lightness: 50 }, // Red/Orange
    { name: "lowMid", hue: 45, saturation: 90, lightness: 55 }, // Yellow
    { name: "mid", hue: 120, saturation: 70, lightness: 50 }, // Green
    { name: "highMid", hue: 180, saturation: 80, lightness: 55 }, // Cyan
    { name: "treble", hue: 240, saturation: 85, lightness: 50 }, // Blue/Purple
  ];

  constructor() {
    this.peakHistory = new Array<number>(5).fill(0);
    this.barVelocities = new Array<number>(5).fill(0);
  }

  public render(
    ctx: CanvasRenderingContext2D,
    data: Uint8Array,
    canvas: HTMLCanvasElement,
    audioAnalysis?: AudioAnalysis | null,
  ): void {
    if (audioAnalysis) {
      this.time += 0.02;

      // Vibrant gradient background
      // Frequency bands are already normalized to 0-1 range
      const avgIntensity =
        (audioAnalysis.frequencyBands.bass +
          audioAnalysis.frequencyBands.mid +
          audioAnalysis.frequencyBands.treble) /
        3;
      const hueShift = Math.min(60, avgIntensity * 40); // Clamp to max 60 degrees
      const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      bgGradient.addColorStop(0, `hsla(${260 + hueShift}, 75%, 22%, 0.92)`);
      bgGradient.addColorStop(1, `hsla(${240 + hueShift}, 70%, 15%, 1)`);
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const bands = [
        audioAnalysis.frequencyBands.bass,
        audioAnalysis.frequencyBands.lowMid,
        audioAnalysis.frequencyBands.mid,
        audioAnalysis.frequencyBands.highMid,
        audioAnalysis.frequencyBands.treble,
      ];

      const barWidth = canvas.width / 5;
      const maxBarHeight = canvas.height * 0.85;
      const padding = 10;

      bands.forEach((bandValue, index) => {
        const targetHeight = bandValue * maxBarHeight;
        const currentVelocity = this.barVelocities[index] ?? 0;
        const currentHeight = this.peakHistory[index] ?? 0;

        // Smooth animation with velocity
        const acceleration = (targetHeight - currentHeight) * 0.25;
        const newVelocity = (currentVelocity + acceleration) * 0.88;
        const barHeight = Math.max(0, currentHeight + newVelocity);

        this.barVelocities[index] = newVelocity;
        this.peakHistory[index] = barHeight;

        const x = index * barWidth + padding;
        const y = canvas.height - barHeight - padding;
        const width = barWidth - padding * 2;

        const color = this.bandColors[index]!;
        const hueShift = Math.sin(this.time * 0.5 + index) * 10;
        const saturation = color.saturation + bandValue * 20;
        const lightness = color.lightness + bandValue * 30;

        // Create gradient for bar
        const barGradient = ctx.createLinearGradient(
          x,
          y,
          x,
          canvas.height - padding,
        );
        barGradient.addColorStop(
          0,
          `hsla(${color.hue + hueShift}, ${saturation}%, ${lightness + 20}%, 1)`,
        );
        barGradient.addColorStop(
          0.5,
          `hsla(${color.hue + hueShift}, ${saturation}%, ${lightness}%, 0.9)`,
        );
        barGradient.addColorStop(
          1,
          `hsla(${color.hue + hueShift}, ${saturation}%, ${lightness - 15}%, 0.7)`,
        );

        // Glow effect
        ctx.shadowBlur = 20 + bandValue * 30;
        ctx.shadowColor = `hsla(${color.hue + hueShift}, 100%, 60%, ${bandValue * 0.8})`;

        // Draw bar
        ctx.fillStyle = barGradient;
        ctx.fillRect(x, y, width, barHeight);

        // Draw peak hold indicator
        if (barHeight > 0) {
          ctx.strokeStyle = `hsla(${color.hue + hueShift}, 100%, 70%, 0.9)`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + width, y);
          ctx.stroke();
        }

        // Draw band label
        ctx.shadowBlur = 0;
        ctx.fillStyle = `hsla(${color.hue + hueShift}, ${saturation}%, 70%, 0.8)`;
        ctx.font = "bold 10px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(
          color.name.toUpperCase(),
          x + width / 2,
          canvas.height - 5,
        );
      });

      ctx.shadowBlur = 0;
    } else {
      // Fallback: clear canvas if no analysis
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }
}
