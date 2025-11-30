// File: src/components/visualizers/FrequencyBandRadialRenderer.ts

import type { AudioAnalysis } from "@/utils/audioAnalysis";

interface RingParticle {
  angle: number;
  ringIndex: number;
  life: number;
  size: number;
  hue: number;
}

export class FrequencyBandRadialRenderer {
  private rotationOffsets: number[] = [];
  private ringHistory: number[] = [];
  private particles: RingParticle[] = [];
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
    this.rotationOffsets = new Array<number>(5).fill(0);
    this.ringHistory = new Array<number>(5).fill(0);
  }

  public render(
    ctx: CanvasRenderingContext2D,
    data: Uint8Array,
    canvas: HTMLCanvasElement,
    audioAnalysis?: AudioAnalysis | null
  ): void {
    if (audioAnalysis) {
      this.time += 0.02;

      // Vibrant radial gradient background
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const maxRadius = Math.min(canvas.width, canvas.height) / 2;
      const avgIntensity = audioAnalysis.frequencyBands.bass + audioAnalysis.frequencyBands.mid + audioAnalysis.frequencyBands.treble;
      const hueShift = (avgIntensity / 3) * 45;

      const bgGradient = ctx.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        maxRadius
      );
      bgGradient.addColorStop(0, `hsla(${275 + hueShift}, 80%, 25%, 0.95)`);
      bgGradient.addColorStop(0.5, `hsla(${265 + hueShift}, 75%, 20%, 0.97)`);
      bgGradient.addColorStop(1, `hsla(${255 + hueShift}, 70%, 12%, 1)`);
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const bands = [
        audioAnalysis.frequencyBands.bass,
        audioAnalysis.frequencyBands.lowMid,
        audioAnalysis.frequencyBands.mid,
        audioAnalysis.frequencyBands.highMid,
        audioAnalysis.frequencyBands.treble,
      ];

      const baseRadius = maxRadius * 0.15;
      const ringSpacing = (maxRadius - baseRadius) / 5;

      // Draw rings from inside to outside
      bands.forEach((bandValue, index) => {
        // Smooth ring radius animation
        const targetRadius = baseRadius + ringSpacing * (index + 1) + bandValue * ringSpacing * 0.8;
        const currentRadius = this.ringHistory[index] ?? baseRadius + ringSpacing * (index + 1);
        const newRadius = Math.max(1, currentRadius + (targetRadius - currentRadius) * 0.2);
        this.ringHistory[index] = newRadius;

        // Rotate each ring at different speeds
        const currentOffset = this.rotationOffsets[index] ?? 0;
        this.rotationOffsets[index] = currentOffset + 0.005 * (1 + index * 0.2);

        const color = this.bandColors[index]!;
        const hueShift = Math.sin(this.time * 0.4 + index) * 15;
        const saturation = color.saturation + bandValue * 25;
        const lightness = color.lightness + bandValue * 25;

        // Draw ring with gradient - ensure inner radius is always positive
        const innerRadius = Math.max(0.1, newRadius - 8);
        const outerRadius = Math.max(innerRadius + 0.1, newRadius + 8);
        const ringGradient = ctx.createRadialGradient(
          centerX,
          centerY,
          innerRadius,
          centerX,
          centerY,
          outerRadius
        );
        ringGradient.addColorStop(0, `hsla(${color.hue + hueShift}, ${saturation}%, ${lightness + 15}%, 0.8)`);
        ringGradient.addColorStop(0.5, `hsla(${color.hue + hueShift}, ${saturation}%, ${lightness}%, 0.9)`);
        ringGradient.addColorStop(1, `hsla(${color.hue + hueShift}, ${saturation}%, ${lightness - 10}%, 0.7)`);

        // Draw ring
        ctx.beginPath();
        ctx.arc(centerX, centerY, newRadius, 0, Math.PI * 2);
        ctx.strokeStyle = ringGradient;
        ctx.lineWidth = 4 + bandValue * 6;
        ctx.shadowBlur = 20 + bandValue * 35;
        ctx.shadowColor = `hsla(${color.hue + hueShift}, 100%, 60%, ${bandValue * 0.7})`;
        ctx.stroke();

        // Draw rotating particles along ring
        const particleCount = 12 + Math.floor(bandValue * 8);
        const rotationOffset = this.rotationOffsets[index] ?? 0;
        for (let i = 0; i < particleCount; i++) {
          const angle = (i / particleCount) * Math.PI * 2 + rotationOffset;
          const particleX = centerX + Math.cos(angle) * newRadius;
          const particleY = centerY + Math.sin(angle) * newRadius;
          const particleSize = 2 + bandValue * 4;

          ctx.beginPath();
          ctx.arc(particleX, particleY, particleSize, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${color.hue + hueShift}, ${saturation}%, ${lightness + 20}%, ${0.8 + bandValue * 0.2})`;
          ctx.shadowBlur = 10;
          ctx.shadowColor = `hsla(${color.hue + hueShift}, 100%, 60%, ${bandValue * 0.9})`;
          ctx.fill();
        }

        // Draw connecting lines between rings
        if (index > 0) {
          const prevIndex = index - 1;
          const prevRadius = this.ringHistory[prevIndex] ?? baseRadius + ringSpacing * index;
          const connectionCount = 8;
          for (let i = 0; i < connectionCount; i++) {
            const angle = (i / connectionCount) * Math.PI * 2 + (this.rotationOffsets[index] ?? 0);
            const startX = centerX + Math.cos(angle) * prevRadius;
            const startY = centerY + Math.sin(angle) * prevRadius;
            const endX = centerX + Math.cos(angle) * newRadius;
            const endY = centerY + Math.sin(angle) * newRadius;

            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.strokeStyle = `hsla(${color.hue + hueShift}, ${saturation}%, ${lightness}%, ${0.3 + bandValue * 0.4})`;
            ctx.lineWidth = 1;
            ctx.shadowBlur = 0;
            ctx.stroke();
          }
        }
      });

      ctx.shadowBlur = 0;

      // Draw center circle
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius * 0.8, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0, 0, 0, 0.9)";
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
      ctx.lineWidth = 2;
      ctx.stroke();
    } else {
      // Fallback: clear canvas if no analysis
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }
}
