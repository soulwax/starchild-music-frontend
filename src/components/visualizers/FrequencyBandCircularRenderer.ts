// File: src/components/visualizers/FrequencyBandCircularRenderer.ts

import type { AudioAnalysis } from "@/utils/audioAnalysis";

export class FrequencyBandCircularRenderer {
  private rotationOffset = 0;
  private pulsePhases: number[] = [];
  private segmentHistory: number[] = [];
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
    this.pulsePhases = new Array<number>(5).fill(0);
    this.segmentHistory = new Array<number>(5).fill(0);
  }

  public render(
    ctx: CanvasRenderingContext2D,
    data: Uint8Array,
    canvas: HTMLCanvasElement,
    audioAnalysis?: AudioAnalysis | null,
  ): void {
    if (audioAnalysis) {
      this.time += 0.02;
      this.rotationOffset += 0.01;

      // Vibrant radial gradient background
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const maxRadius = Math.min(canvas.width, canvas.height) / 2;
      // Frequency bands are already normalized to 0-1 range
      const avgIntensity =
        (audioAnalysis.frequencyBands.bass +
          audioAnalysis.frequencyBands.mid +
          audioAnalysis.frequencyBands.treble) /
        3;
      const hueShift = Math.min(60, avgIntensity * 45); // Clamp to max 60 degrees

      const bgGradient = ctx.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        maxRadius,
      );
      bgGradient.addColorStop(0, `hsla(${270 + hueShift}, 78%, 24%, 0.95)`);
      bgGradient.addColorStop(0.5, `hsla(${260 + hueShift}, 72%, 19%, 0.97)`);
      bgGradient.addColorStop(1, `hsla(${250 + hueShift}, 68%, 12%, 1)`);
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const bands = [
        audioAnalysis.frequencyBands.bass,
        audioAnalysis.frequencyBands.lowMid,
        audioAnalysis.frequencyBands.mid,
        audioAnalysis.frequencyBands.highMid,
        audioAnalysis.frequencyBands.treble,
      ];

      const segmentAngle = (Math.PI * 2) / 5;
      const baseRadius = maxRadius * 0.7;

      bands.forEach((bandValue, index) => {
        // Smooth segment size animation
        const targetSize = bandValue;
        const currentSize = this.segmentHistory[index] ?? 0;
        const newSize = currentSize + (targetSize - currentSize) * 0.2;
        this.segmentHistory[index] = newSize;

        // Pulse effect
        this.pulsePhases[index] =
          (this.pulsePhases[index] ?? 0) + 0.05 * (1 + bandValue);
        const pulse =
          1 + Math.sin(this.pulsePhases[index] ?? 0) * bandValue * 0.3;
        const radius = Math.max(1, baseRadius * pulse * (0.5 + newSize * 0.5));

        const startAngle = index * segmentAngle + this.rotationOffset;
        const endAngle = (index + 1) * segmentAngle + this.rotationOffset;

        const color = this.bandColors[index]!;
        const hueShift = Math.sin(this.time * 0.3 + index) * 15;
        const saturation = color.saturation + newSize * 25;
        const lightness = color.lightness + newSize * 25;

        // Create radial gradient for segment - ensure inner radius is always positive
        const innerRadius = Math.max(0.1, maxRadius * 0.3);
        const outerRadius = Math.max(innerRadius + 0.1, radius);
        const segmentGradient = ctx.createRadialGradient(
          centerX,
          centerY,
          innerRadius,
          centerX,
          centerY,
          outerRadius,
        );
        segmentGradient.addColorStop(
          0,
          `hsla(${color.hue + hueShift}, ${saturation}%, ${lightness + 20}%, 0.9)`,
        );
        segmentGradient.addColorStop(
          0.5,
          `hsla(${color.hue + hueShift}, ${saturation}%, ${lightness}%, 0.85)`,
        );
        segmentGradient.addColorStop(
          1,
          `hsla(${color.hue + hueShift}, ${saturation}%, ${lightness - 10}%, 0.7)`,
        );

        // Draw segment
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.closePath();

        // Glow effect
        ctx.shadowBlur = 25 + newSize * 40;
        ctx.shadowColor = `hsla(${color.hue + hueShift}, 100%, 60%, ${newSize * 0.7})`;

        ctx.fillStyle = segmentGradient;
        ctx.fill();

        // Draw segment border
        ctx.shadowBlur = 0;
        ctx.strokeStyle = `hsla(${color.hue + hueShift}, ${saturation}%, ${lightness + 15}%, 0.9)`;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw label on segment
        const labelAngle = (startAngle + endAngle) / 2;
        const labelRadius = radius * 0.6;
        const labelX = centerX + Math.cos(labelAngle) * labelRadius;
        const labelY = centerY + Math.sin(labelAngle) * labelRadius;

        ctx.fillStyle = `hsla(${color.hue + hueShift}, ${saturation}%, 75%, 0.9)`;
        ctx.font = "bold 11px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(color.name.toUpperCase(), labelX, labelY);
      });

      // Draw center circle
      ctx.beginPath();
      ctx.arc(centerX, centerY, maxRadius * 0.15, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
      ctx.lineWidth = 1;
      ctx.stroke();
    } else {
      // Fallback: clear canvas if no analysis
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }
}
