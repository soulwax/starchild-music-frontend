// File: src/components/visualizers/SpectrumRenderer.ts

import { PerlinNoise } from './utils/PerlinNoise';
import { MathUtils } from './utils/MathUtils';

export class SpectrumRenderer {
  private barCount: number;
  private barGap: number;
  private peakHistory: number[] = [];
  private peakDecay: number[] = [];
  private noise: PerlinNoise;
  private time = 0;
  private metaballs: Array<{ x: number; y: number; radius: number; vx: number; vy: number }> = [];

  constructor(barCount = 64, barGap = 2) {
    this.barCount = barCount;
    this.barGap = barGap;
    this.peakHistory = new Array<number>(barCount).fill(0);
    this.peakDecay = new Array<number>(barCount).fill(0);
    this.noise = new PerlinNoise(Math.random() * 1000);

    // Initialize metaballs
    for (let i = 0; i < 8; i++) {
      this.metaballs.push({
        x: Math.random() * 800,
        y: Math.random() * 400,
        radius: 30 + Math.random() * 40,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2
      });
    }
  }

  public render(ctx: CanvasRenderingContext2D, data: Uint8Array, canvas: HTMLCanvasElement): void {
    this.time += 0.03;

    // Update metaballs
    this.metaballs.forEach(ball => {
      ball.x += ball.vx;
      ball.y += ball.vy;
      if (ball.x < 0 || ball.x > canvas.width) ball.vx *= -1;
      if (ball.y < 0 || ball.y > canvas.height) ball.vy *= -1;
    });

    // Metaball background
    const imageData = ctx.createImageData(canvas.width, canvas.height);
    const pixels = imageData.data;

    for (let y = 0; y < canvas.height; y += 3) {
      for (let x = 0; x < canvas.width; x += 3) {
        const field = MathUtils.metaball(x, y, this.metaballs);
        const threshold = 1.0;

        if (field > threshold) {
          const intensity = Math.min((field - threshold) * 0.3, 1);
          const hue = 220 + intensity * 40;
          const rgb = MathUtils.hslToRgb(hue, 85, 25 + intensity * 20);

          for (let dy = 0; dy < 3 && y + dy < canvas.height; dy++) {
            for (let dx = 0; dx < 3 && x + dx < canvas.width; dx++) {
              const idx = ((y + dy) * canvas.width + (x + dx)) * 4;
              pixels[idx] = rgb.r;
              pixels[idx + 1] = rgb.g;
              pixels[idx + 2] = rgb.b;
              pixels[idx + 3] = 255;
            }
          }
        } else {
          // Vibrant dark background with color
          const darkHue = 240;
          const darkRgb = MathUtils.hslToRgb(darkHue, 60, 12);
          for (let dy = 0; dy < 3 && y + dy < canvas.height; dy++) {
            for (let dx = 0; dx < 3 && x + dx < canvas.width; dx++) {
              const idx = ((y + dy) * canvas.width + (x + dx)) * 4;
              pixels[idx] = darkRgb.r;
              pixels[idx + 1] = darkRgb.g;
              pixels[idx + 2] = darkRgb.b;
              pixels[idx + 3] = 255;
            }
          }
        }
      }
    }
    ctx.putImageData(imageData, 0, 0);

    // Kaleidoscope effect - save context for symmetry
    ctx.save();
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const segments = 6;

    for (let seg = 0; seg < segments; seg++) {
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate((seg * Math.PI * 2) / segments);
      ctx.scale(seg % 2 === 0 ? 1 : -1, 1); // Mirror alternate segments
      ctx.translate(-centerX, -centerY);

      const barWidth = (canvas.width - this.barGap * (this.barCount - 1)) / this.barCount;
      const dataStep = Math.floor(data.length / this.barCount);

      for (let i = 0; i < this.barCount; i++) {
        const dataIndex = i * dataStep;
        const value = data[dataIndex] ?? 0;
        const normalizedValue = value / 255;

        // Add perlin noise modulation
        const noiseVal = this.noise.octaveNoise(i * 0.15, this.time, seg, 3, 0.6);
        const barHeight = normalizedValue * canvas.height * 0.85 * (1 + noiseVal * 0.2);

        const x = i * (barWidth + this.barGap);
        const y = canvas.height - barHeight;

        // Update peak tracking (only for first segment)
        if (seg === 0) {
          const currentPeak = this.peakHistory[i] ?? 0;
          if (barHeight > currentPeak) {
            this.peakHistory[i] = barHeight;
            this.peakDecay[i] = 0;
          } else {
            const decay = this.peakDecay[i] ?? 0;
            this.peakDecay[i] = decay + 1;
            this.peakHistory[i] = Math.max(0, currentPeak - (decay + 1) * 0.5);
          }
        }

        // Calculate colors with bitwise color cycling
        const colorShift = ((Math.floor(this.time * 30) ^ i) & 0xFF) / 255;
        const hue = (i / this.barCount) * 240 + 200 + colorShift * 60 + seg * 10;
        const saturation = 70 + normalizedValue * 30;
        const lightness = 45 + normalizedValue * 25;

        // Draw bar with gradient
        const barGradient = ctx.createLinearGradient(x, y, x, canvas.height);
        barGradient.addColorStop(0, `hsla(${hue}, ${saturation}%, ${lightness + 20}%, 0.9)`);
        barGradient.addColorStop(0.5, `hsla(${hue}, ${saturation}%, ${lightness}%, 0.8)`);
        barGradient.addColorStop(1, `hsla(${hue}, ${saturation}%, ${lightness - 10}%, 0.6)`);

        // Glow effect
        ctx.shadowBlur = 20 * normalizedValue;
        ctx.shadowColor = `hsla(${hue}, 100%, 60%, ${normalizedValue})`;

        ctx.fillStyle = barGradient;
        ctx.fillRect(x, y, barWidth, barHeight);

        // Add voronoi-inspired cell patterns on tall bars
        if (barHeight > canvas.height * 0.5) {
          const points = [
            { x: x + barWidth * 0.2, y: y + barHeight * 0.3 },
            { x: x + barWidth * 0.8, y: y + barHeight * 0.7 }
          ];

          for (let py = Math.floor(y); py < y + barHeight; py += 4) {
            for (let px = Math.floor(x); px < x + barWidth; px += 4) {
              const voronoi = MathUtils.voronoi(px, py, points);
              const cellHue = hue + voronoi.index * 30;
              ctx.fillStyle = `hsla(${cellHue}, 80%, 60%, ${0.1 * normalizedValue})`;
              ctx.fillRect(px, py, 4, 4);
            }
          }
        }

        // Draw reflection with wave distortion
        ctx.globalAlpha = 0.3;
        const reflectionHeight = barHeight * 0.4;
        const reflectionGradient = ctx.createLinearGradient(x, canvas.height, x, canvas.height - reflectionHeight);
        reflectionGradient.addColorStop(0, `hsla(${hue}, ${saturation}%, ${lightness}%, 0.4)`);
        reflectionGradient.addColorStop(1, `hsla(${hue}, ${saturation}%, ${lightness}%, 0)`);

        // Apply sine wave distortion
        for (let ry = 0; ry < reflectionHeight; ry += 1) {
          const waveX = Math.sin(this.time + ry * 0.05) * 2;
          ctx.fillStyle = reflectionGradient;
          ctx.fillRect(x + waveX, canvas.height - ry, barWidth, 1);
        }
        ctx.globalAlpha = 1;

        // Draw peak indicator with trail
        const peakY = canvas.height - (this.peakHistory[i] ?? 0);
        ctx.shadowBlur = 15;
        ctx.shadowColor = `hsla(${hue}, 100%, 70%, 0.9)`;

        // Peak with golden ratio proportions
        const peakWidth = barWidth * MathUtils.PHI / 2;
        const peakX = x + (barWidth - peakWidth) / 2;

        ctx.fillStyle = `hsla(${hue + 20}, 90%, 75%, 0.9)`;
        ctx.fillRect(peakX, peakY - 3, peakWidth, 3);

        // Fibonacci spiral trail from peak
        if (seg === 0 && normalizedValue > 0.5) {
          for (let t = 0; t < 8; t++) {
            const spiral = MathUtils.fibonacciSpiralPoint(t, 8, 5);
            ctx.fillStyle = `hsla(${hue}, 100%, 80%, ${0.6 - t * 0.07})`;
            ctx.beginPath();
            ctx.arc(x + barWidth / 2 + spiral.x, peakY + spiral.y, 1.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      ctx.restore();
    }

    ctx.restore();
    ctx.shadowBlur = 0;
  }

  public updateConfig(barCount: number, barGap: number): void {
    if (this.barCount !== barCount) {
      this.barCount = barCount;
      this.peakHistory = new Array<number>(barCount).fill(0);
      this.peakDecay = new Array<number>(barCount).fill(0);
    }
    this.barGap = barGap;
  }
}
