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
  private kaleidoscopeRotation = 0;

  // Color mapping for each frequency band
  private readonly bandColors = [
    { name: "bass", hue: 0, saturation: 80, lightness: 50 }, // Red/Orange
    { name: "lowMid", hue: 45, saturation: 90, lightness: 55 }, // Yellow
    { name: "mid", hue: 120, saturation: 70, lightness: 50 }, // Green
    { name: "highMid", hue: 180, saturation: 80, lightness: 55 }, // Cyan
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
    audioAnalysis?: AudioAnalysis | null,
  ): void {
    if (audioAnalysis) {
      this.time += 0.02;
      this.kaleidoscopeRotation += 0.01; // Rotate the entire kaleidoscope

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
      bgGradient.addColorStop(0, `hsla(${275 + hueShift}, 100%, 45%, 1)`);
      bgGradient.addColorStop(0.5, `hsla(${265 + hueShift}, 100%, 38%, 1)`);
      bgGradient.addColorStop(1, `hsla(${255 + hueShift}, 100%, 30%, 1)`);
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Create off-screen canvas for kaleidoscopic rendering
      const offCanvas = document.createElement("canvas");
      offCanvas.width = canvas.width;
      offCanvas.height = canvas.height;
      const offCtx = offCanvas.getContext("2d")!;
      offCtx.fillStyle = "rgba(0, 0, 0, 0)";
      offCtx.fillRect(0, 0, offCanvas.width, offCanvas.height);

      const segments = 16; // Many more segments for strong kaleidoscopic effect

      const bands = [
        audioAnalysis.frequencyBands.bass,
        audioAnalysis.frequencyBands.lowMid,
        audioAnalysis.frequencyBands.mid,
        audioAnalysis.frequencyBands.highMid,
        audioAnalysis.frequencyBands.treble,
      ];

      const baseRadius = maxRadius * 0.15;
      const ringSpacing = (maxRadius - baseRadius) / 5;

      // Draw rings in kaleidoscopic segments with rotation
      for (let seg = 0; seg < segments; seg++) {
        offCtx.save();
        offCtx.translate(centerX, centerY);
        offCtx.rotate(
          (seg * Math.PI * 2) / segments + this.kaleidoscopeRotation,
        ); // Add rotation
        // More complex mirroring pattern
        const mirrorX = seg % 4 < 2 ? 1 : -1;
        const mirrorY = seg % 2 === 0 ? 1 : -1;
        offCtx.scale(mirrorX, mirrorY);
        offCtx.translate(-centerX, -centerY);

        // Clip to segment for cleaner edges
        offCtx.beginPath();
        offCtx.moveTo(centerX, centerY);
        const angle1 = (seg * Math.PI * 2) / segments;
        const angle2 = ((seg + 1) * Math.PI * 2) / segments;
        const radius = Math.max(canvas.width, canvas.height);
        offCtx.lineTo(
          centerX + Math.cos(angle1) * radius,
          centerY + Math.sin(angle1) * radius,
        );
        offCtx.lineTo(
          centerX + Math.cos(angle2) * radius,
          centerY + Math.sin(angle2) * radius,
        );
        offCtx.closePath();
        offCtx.clip();

        // Draw rings from inside to outside
        bands.forEach((bandValue, index) => {
          // Smooth ring radius animation
          const targetRadius =
            baseRadius +
            ringSpacing * (index + 1) +
            bandValue * ringSpacing * 0.8;
          const currentRadius =
            this.ringHistory[index] ?? baseRadius + ringSpacing * (index + 1);
          const newRadius = Math.max(
            1,
            currentRadius + (targetRadius - currentRadius) * 0.2,
          );
          this.ringHistory[index] = newRadius;

          // Rotate each ring at different speeds
          const currentOffset = this.rotationOffsets[index] ?? 0;
          this.rotationOffsets[index] =
            currentOffset + 0.005 * (1 + index * 0.2);

          const color = this.bandColors[index]!;
          const hueShift = Math.sin(this.time * 0.4 + index) * 30 + seg * 15;
          const saturation = 100; // Maximum saturation always
          const lightness = Math.min(95, 75 + bandValue * 20); // Much brighter

          // Draw ring with gradient - ensure inner radius is always positive
          const innerRadius = Math.max(0.1, newRadius - 8);
          const outerRadius = Math.max(innerRadius + 0.1, newRadius + 8);
          const ringGradient = offCtx.createRadialGradient(
            centerX,
            centerY,
            innerRadius,
            centerX,
            centerY,
            outerRadius,
          );
          ringGradient.addColorStop(
            0,
            `hsla(${color.hue + hueShift}, 100%, ${lightness + 30}%, 1)`,
          );
          ringGradient.addColorStop(
            0.5,
            `hsla(${color.hue + hueShift}, 100%, ${lightness}%, 1)`,
          );
          ringGradient.addColorStop(
            1,
            `hsla(${color.hue + hueShift}, 100%, ${lightness - 5}%, 1)`,
          );

          // Draw ring - maximum visibility
          offCtx.beginPath();
          offCtx.arc(centerX, centerY, newRadius, 0, Math.PI * 2);
          offCtx.strokeStyle = ringGradient;
          offCtx.lineWidth = 8 + bandValue * 12;
          offCtx.shadowBlur = 50 + bandValue * 80;
          offCtx.shadowColor = `hsla(${color.hue + hueShift}, 100%, 90%, 1)`;
          offCtx.stroke();

          // Draw rotating particles along ring
          const particleCount = 12 + Math.floor(bandValue * 8);
          const rotationOffset = this.rotationOffsets[index] ?? 0;
          for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2 + rotationOffset;
            const particleX = centerX + Math.cos(angle) * newRadius;
            const particleY = centerY + Math.sin(angle) * newRadius;
            const particleSize = 2 + bandValue * 4;

            offCtx.beginPath();
            offCtx.arc(particleX, particleY, particleSize, 0, Math.PI * 2);
            offCtx.fillStyle = `hsla(${color.hue + hueShift}, 100%, ${lightness + 35}%, 1)`;
            offCtx.shadowBlur = 25;
            offCtx.shadowColor = `hsla(${color.hue + hueShift}, 100%, 90%, 1)`;
            offCtx.fill();
          }

          // Draw connecting lines between rings
          if (index > 0) {
            const prevIndex = index - 1;
            const prevRadius =
              this.ringHistory[prevIndex] ?? baseRadius + ringSpacing * index;
            const connectionCount = 8;
            for (let i = 0; i < connectionCount; i++) {
              const angle =
                (i / connectionCount) * Math.PI * 2 +
                (this.rotationOffsets[index] ?? 0);
              const startX = centerX + Math.cos(angle) * prevRadius;
              const startY = centerY + Math.sin(angle) * prevRadius;
              const endX = centerX + Math.cos(angle) * newRadius;
              const endY = centerY + Math.sin(angle) * newRadius;

              offCtx.beginPath();
              offCtx.moveTo(startX, startY);
              offCtx.lineTo(endX, endY);
              offCtx.strokeStyle = `hsla(${color.hue + hueShift}, 100%, ${lightness}%, ${0.9 + bandValue * 0.1})`;
              offCtx.lineWidth = 3;
              offCtx.shadowBlur = 15;
              offCtx.shadowColor = `hsla(${color.hue + hueShift}, 100%, 80%, ${0.9 + bandValue * 0.1})`;
              offCtx.stroke();
            }
          }
        });

        offCtx.restore(); // End kaleidoscopic segment
      }

      offCtx.shadowBlur = 0;

      // Draw center circle on off-screen canvas
      offCtx.beginPath();
      offCtx.arc(centerX, centerY, baseRadius * 0.8, 0, Math.PI * 2);
      offCtx.fillStyle = "rgba(0, 0, 0, 0.95)";
      offCtx.fill();
      offCtx.strokeStyle = "rgba(255, 255, 255, 0.4)";
      offCtx.lineWidth = 3;
      offCtx.stroke();

      // Apply kaleidoscopic mirroring to main canvas with rotation
      for (let seg = 0; seg < segments; seg++) {
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate((seg * Math.PI * 2) / segments + this.kaleidoscopeRotation); // Add rotation
        const mirrorX = seg % 4 < 2 ? 1 : -1;
        const mirrorY = seg % 2 === 0 ? 1 : -1;
        ctx.scale(mirrorX, mirrorY);
        ctx.translate(-centerX, -centerY);
        ctx.globalCompositeOperation = "screen"; // Use screen blend for maximum vibrant effect
        ctx.globalAlpha = 1.0;
        ctx.drawImage(offCanvas, 0, 0);
        ctx.restore();
      }

      ctx.globalAlpha = 1.0;
      ctx.globalCompositeOperation = "source-over";
    } else {
      // Fallback: clear canvas if no analysis
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }
}
