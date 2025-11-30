// File: src/components/visualizers/BarsRenderer.ts

import { MathUtils } from './utils/MathUtils';
import { PerlinNoise } from './utils/PerlinNoise';

export class BarsRenderer {
  private peakHistory: number[] = [];
  private peakDecay: number[] = [];
  private barVelocities: number[] = [];
  private noise: PerlinNoise;
  private time = 0;
  private chromaticShift = 0;
  private plasmaTime = 0;

  constructor(barCount = 64) {
    this.peakHistory = new Array<number>(barCount).fill(0);
    this.peakDecay = new Array<number>(barCount).fill(0);
    this.barVelocities = new Array<number>(barCount).fill(0);
    this.noise = new PerlinNoise(Math.random() * 1000);
  }

  public render(ctx: CanvasRenderingContext2D, data: Uint8Array, canvas: HTMLCanvasElement, barCount = 64, barGap = 2): void {
    this.time += 0.02;
    this.plasmaTime += 0.05;
    this.chromaticShift = Math.sin(this.time * 0.5) * 3;

    // Plasma background with perlin noise
    const imageData = ctx.createImageData(canvas.width, canvas.height);
    const pixels = imageData.data;

    for (let y = 0; y < canvas.height; y += 4) {
      for (let x = 0; x < canvas.width; x += 4) {
        const plasma = MathUtils.plasma(x, y, this.plasmaTime);
        const noiseVal = this.noise.octaveNoise(x * 0.005, y * 0.005, this.time * 0.1, 4, 0.5);
        const combined = (plasma + noiseVal) * 0.5;

        const hue = 220 + combined * 60;
        const rgb = MathUtils.hslToRgb(hue, 85, 25 + combined * 15);

        for (let dy = 0; dy < 4 && y + dy < canvas.height; dy++) {
          for (let dx = 0; dx < 4 && x + dx < canvas.width; dx++) {
            const idx = ((y + dy) * canvas.width + (x + dx)) * 4;
            pixels[idx] = rgb.r;
            pixels[idx + 1] = rgb.g;
            pixels[idx + 2] = rgb.b;
            pixels[idx + 3] = 255;
          }
        }
      }
    }
    ctx.putImageData(imageData, 0, 0);

    const barWidth = (canvas.width - barGap * (barCount - 1)) / barCount;
    const dataStep = Math.floor(data.length / barCount);

    // Calculate global average for reactive effects
    const avgAmplitude = data.reduce((sum, val) => sum + val, 0) / data.length / 255;

    // Create off-screen canvas for chromatic aberration
    const offCanvas = document.createElement('canvas');
    offCanvas.width = canvas.width;
    offCanvas.height = canvas.height;
    const offCtx = offCanvas.getContext('2d')!;

    for (let i = 0; i < barCount; i++) {
      const dataIndex = i * dataStep;
      const value = data[dataIndex] ?? 0;
      const normalizedValue = value / 255;

      // Add perlin noise to bar height for organic movement
      const noiseInfluence = this.noise.octaveNoise(i * 0.1, this.time, 0, 3, 0.5) * 0.15;
      const targetHeight = normalizedValue * canvas.height * 0.9 * (1 + noiseInfluence);

      // Smooth bar animation with velocity
      const currentVelocity = this.barVelocities[i] ?? 0;
      const currentHeight = this.peakHistory[i] ?? 0;
      const acceleration = (targetHeight - currentHeight) * 0.3;
      const newVelocity = (currentVelocity + acceleration) * 0.85;
      const barHeight = Math.max(0, currentHeight + newVelocity);

      this.barVelocities[i] = newVelocity;
      this.peakHistory[i] = barHeight;

      const x = i * (barWidth + barGap);
      const y = canvas.height - barHeight;

      // HSL color based on frequency, amplitude, and XOR pattern
      const xorValue = MathUtils.xorPattern(i, barHeight, this.time * 10);
      const hue = (i / barCount) * 240 + 200 + xorValue * 40; // Blue to purple spectrum with glitch
      const saturation = 65 + normalizedValue * 35;
      const lightness = 40 + normalizedValue * 30;

      // Multi-stop gradient for each bar
      const barGradient = ctx.createLinearGradient(x, y, x, canvas.height);
      barGradient.addColorStop(0, `hsla(${hue}, ${saturation + 20}%, ${lightness + 25}%, 1)`);
      barGradient.addColorStop(0.3, `hsla(${hue}, ${saturation + 10}%, ${lightness + 10}%, 0.95)`);
      barGradient.addColorStop(0.7, `hsla(${hue}, ${saturation}%, ${lightness}%, 0.85)`);
      barGradient.addColorStop(1, `hsla(${hue}, ${saturation - 10}%, ${lightness - 15}%, 0.6)`);

      // Glow effect with bloom
      offCtx.shadowBlur = 15 + normalizedValue * 20;
      offCtx.shadowColor = `hsla(${hue}, 100%, 60%, ${normalizedValue * 0.8})`;

      offCtx.fillStyle = barGradient;
      offCtx.fillRect(x, y, barWidth, barHeight);

      // Add mandelbrot-inspired edge detail
      if (barHeight > 20) {
        for (let edge = 0; edge < barWidth; edge += 2) {
          const mandel = MathUtils.mandelbrot(
            MathUtils.map(edge, 0, barWidth, -2, 2),
            MathUtils.map(y, 0, canvas.height, -2, 2) + this.time * 0.1,
            10
          );
          offCtx.fillStyle = `hsla(${hue + mandel * 60}, 100%, 70%, ${mandel * normalizedValue * 0.3})`;
          offCtx.fillRect(x + edge, y, 2, 3);
        }
      }

      // Draw highlight on top with lissajous pattern
      if (barHeight > 5) {
        offCtx.shadowBlur = 0;
        const lissajous = MathUtils.lissajous(this.time + i * 0.1, 3, 2, Math.PI / 2);
        const highlightY = y + (lissajous.y + 1) * 5;

        const highlightGradient = offCtx.createLinearGradient(x, highlightY, x, y + 20);
        highlightGradient.addColorStop(0, `hsla(${hue}, 100%, 85%, ${normalizedValue * 0.6})`);
        highlightGradient.addColorStop(1, `hsla(${hue}, 100%, 70%, 0)`);
        offCtx.fillStyle = highlightGradient;
        offCtx.fillRect(x, highlightY, barWidth, Math.min(20, barHeight));
      }

      // Draw reflection below with distortion
      if (barHeight > 10) {
        offCtx.shadowBlur = 0;
        const reflectionHeight = Math.min(barHeight * 0.5, 80);
        const reflectionGradient = offCtx.createLinearGradient(x, canvas.height, x, canvas.height - reflectionHeight);
        reflectionGradient.addColorStop(0, `hsla(${hue}, ${saturation}%, ${lightness}%, 0.3)`);
        reflectionGradient.addColorStop(0.5, `hsla(${hue}, ${saturation}%, ${lightness + 10}%, 0.15)`);
        reflectionGradient.addColorStop(1, `hsla(${hue}, ${saturation}%, ${lightness}%, 0)`);

        // Add wave distortion to reflection
        offCtx.save();
        offCtx.beginPath();
        for (let ry = 0; ry < reflectionHeight; ry += 2) {
          const wave = Math.sin(this.time * 2 + ry * 0.1) * 2;
          offCtx.rect(x + wave, canvas.height - ry, barWidth, 2);
        }
        offCtx.fillStyle = reflectionGradient;
        offCtx.fill();
        offCtx.restore();
      }

      // Peak indicator with particle trail
      if (normalizedValue > 0.1) {
        // Update peak decay
        if (normalizedValue > (this.peakDecay[i] ?? 0)) {
          this.peakDecay[i] = normalizedValue;
        } else {
          this.peakDecay[i] = Math.max(0, (this.peakDecay[i] ?? 0) - 0.01);
        }

        const peakY = canvas.height - (this.peakDecay[i] ?? 0) * canvas.height * 0.9;

        // Peak shadow/glow
        offCtx.shadowBlur = 20;
        offCtx.shadowColor = `hsla(${hue}, 100%, 75%, 0.9)`;

        // Peak gradient bar with geometric pattern
        const peakGradient = offCtx.createLinearGradient(x, peakY - 4, x, peakY);
        peakGradient.addColorStop(0, `hsla(${hue + 20}, 100%, 85%, 0.95)`);
        peakGradient.addColorStop(1, `hsla(${hue + 20}, 100%, 70%, 0.9)`);

        offCtx.fillStyle = peakGradient;
        offCtx.fillRect(x, peakY - 4, barWidth, 4);

        // Fibonacci spiral peak particles
        const fib = MathUtils.fibonacciSpiralPoint(i % 21, 21, 8);
        offCtx.shadowBlur = 15;
        offCtx.fillStyle = `hsla(${hue + 30}, 100%, 90%, 0.95)`;
        offCtx.beginPath();
        offCtx.arc(x + barWidth / 2 + fib.x * Math.sin(this.time), peakY - 7 + fib.y * Math.cos(this.time), 2.5, 0, Math.PI * 2);
        offCtx.fill();
      }
    }

    offCtx.shadowBlur = 0;

    // Apply chromatic aberration
    ctx.globalCompositeOperation = 'lighter';

    // Red channel
    ctx.globalAlpha = 0.9;
    ctx.drawImage(offCanvas, this.chromaticShift, 0);

    // Green channel
    ctx.globalAlpha = 1.0;
    ctx.drawImage(offCanvas, 0, 0);

    // Blue channel
    ctx.globalAlpha = 0.9;
    ctx.drawImage(offCanvas, -this.chromaticShift, 0);

    ctx.globalAlpha = 1.0;
    ctx.globalCompositeOperation = 'source-over';

    // Draw frequency spectrum overlay line
    ctx.strokeStyle = `rgba(138, 43, 226, ${0.15 + avgAmplitude * 0.2})`;
    ctx.lineWidth = 2;
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'rgba(138, 43, 226, 0.5)';
    ctx.beginPath();

    for (let i = 0; i < barCount; i++) {
      const x = i * (barWidth + barGap) + barWidth / 2;
      const barHeight = this.peakHistory[i] ?? 0;
      const y = canvas.height - barHeight;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.stroke();
    ctx.shadowBlur = 0;

    // Draw floor line with glow
    ctx.strokeStyle = `rgba(100, 80, 150, ${0.3 + avgAmplitude * 0.3})`;
    ctx.lineWidth = 2;
    ctx.shadowBlur = 15;
    ctx.shadowColor = 'rgba(138, 43, 226, 0.4)';
    ctx.beginPath();
    ctx.moveTo(0, canvas.height - 1);
    ctx.lineTo(canvas.width, canvas.height - 1);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  public updateConfig(barCount: number): void {
    if (this.peakHistory.length !== barCount) {
      this.peakHistory = new Array<number>(barCount).fill(0);
      this.peakDecay = new Array<number>(barCount).fill(0);
      this.barVelocities = new Array<number>(barCount).fill(0);
    }
  }
}
