// File: src/components/visualizers/BarsRenderer.ts

import { MathUtils } from "./utils/MathUtils";
import { PerlinNoise } from "./utils/PerlinNoise";

export class BarsRenderer {
  private peakHistory: number[] = [];
  private peakDecay: number[] = [];
  private barVelocities: number[] = [];
  private noise: PerlinNoise;
  private time = 0;
  private chromaticShift = 0;
  private plasmaTime = 0;
  private kaleidoscopeRotation = 0;

  constructor(barCount = 64) {
    this.peakHistory = new Array<number>(barCount).fill(0);
    this.peakDecay = new Array<number>(barCount).fill(0);
    this.barVelocities = new Array<number>(barCount).fill(0);
    this.noise = new PerlinNoise(Math.random() * 1000);
  }

  public render(
    ctx: CanvasRenderingContext2D,
    data: Uint8Array,
    canvas: HTMLCanvasElement,
    barCount = 64,
    barGap = 2,
  ): void {
    this.time += 0.02;
    this.plasmaTime += 0.05;
    this.chromaticShift = Math.sin(this.time * 0.5) * 5;
    this.kaleidoscopeRotation += 0.01; // Rotate the entire kaleidoscope

    // Clear canvas with vibrant dark background
    ctx.fillStyle = "rgba(5, 5, 15, 1)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Kaleidoscopic mirroring - save context for symmetry
    ctx.save();
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const segments = 16; // Many more segments for strong kaleidoscopic effect

    // Create off-screen canvas for kaleidoscopic rendering
    const offCanvas = document.createElement("canvas");
    offCanvas.width = canvas.width;
    offCanvas.height = canvas.height;
    const offCtx = offCanvas.getContext("2d")!;

    // Plasma background with perlin noise on off-screen canvas
    const imageData = offCtx.createImageData(offCanvas.width, offCanvas.height);
    const pixels = imageData.data;

    for (let y = 0; y < offCanvas.height; y += 3) {
      for (let x = 0; x < offCanvas.width; x += 3) {
        const plasma = MathUtils.plasma(x, y, this.plasmaTime);
        const noiseVal = this.noise.octaveNoise(
          x * 0.005,
          y * 0.005,
          this.time * 0.1,
          4,
          0.5,
        );
        const combined = (plasma + noiseVal) * 0.5;

        const hue = 220 + combined * 120 + Math.sin(this.time) * 40; // Much more vibrant, wider shifting hue
        const rgb = MathUtils.hslToRgb(hue, 100, 50 + combined * 40); // Maximum saturation, much brighter

        for (let dy = 0; dy < 3 && y + dy < offCanvas.height; dy++) {
          for (let dx = 0; dx < 3 && x + dx < offCanvas.width; dx++) {
            const idx = ((y + dy) * offCanvas.width + (x + dx)) * 4;
            pixels[idx] = rgb.r;
            pixels[idx + 1] = rgb.g;
            pixels[idx + 2] = rgb.b;
            pixels[idx + 3] = 255;
          }
        }
      }
    }
    offCtx.putImageData(imageData, 0, 0);

    const barWidth = (canvas.width - barGap * (barCount - 1)) / barCount;
    const dataStep = Math.floor(data.length / barCount);

    // Calculate global average for reactive effects
    const avgAmplitude =
      data.reduce((sum, val) => sum + val, 0) / data.length / 255;

    // Render bars in kaleidoscopic segments with rotation
    for (let seg = 0; seg < segments; seg++) {
      offCtx.save();
      offCtx.translate(centerX, centerY);
      offCtx.rotate((seg * Math.PI * 2) / segments + this.kaleidoscopeRotation); // Add rotation
      // More complex mirroring pattern for stronger kaleidoscope effect
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

      for (let i = 0; i < barCount; i++) {
        const dataIndex = i * dataStep;
        const value = data[dataIndex] ?? 0;
        const normalizedValue = value / 255;

        // Add perlin noise to bar height for organic movement
        const noiseInfluence =
          this.noise.octaveNoise(i * 0.1, this.time, 0, 3, 0.5) * 0.15;
        const targetHeight =
          normalizedValue * canvas.height * 0.9 * (1 + noiseInfluence);

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

        // HSL color based on frequency, amplitude, and XOR pattern - extremely vibrant
        const xorValue = MathUtils.xorPattern(i, barHeight, this.time * 10);
        const hue = (i / barCount) * 360 + 180 + xorValue * 80 + seg * 25; // Full spectrum, wider shifts
        const saturation = 100; // Maximum saturation always
        const lightness = 70 + normalizedValue * 25; // Much brighter base

        // Multi-stop gradient for each bar - maximum vividness
        const barGradient = offCtx.createLinearGradient(x, y, x, canvas.height);
        barGradient.addColorStop(
          0,
          `hsla(${hue}, 100%, ${lightness + 40}%, 1)`,
        );
        barGradient.addColorStop(
          0.3,
          `hsla(${hue}, 100%, ${lightness + 25}%, 1)`,
        );
        barGradient.addColorStop(0.7, `hsla(${hue}, 100%, ${lightness}%, 1)`);
        barGradient.addColorStop(1, `hsla(${hue}, 100%, ${lightness - 5}%, 1)`);

        // Glow effect with bloom - extremely intense
        offCtx.shadowBlur = 40 + normalizedValue * 60;
        offCtx.shadowColor = `hsla(${hue}, 100%, 85%, 1)`;

        offCtx.fillStyle = barGradient;
        offCtx.fillRect(x, y, barWidth, barHeight);

        // Add mandelbrot-inspired edge detail
        if (barHeight > 20) {
          for (let edge = 0; edge < barWidth; edge += 2) {
            const mandel = MathUtils.mandelbrot(
              MathUtils.map(edge, 0, barWidth, -2, 2),
              MathUtils.map(y, 0, canvas.height, -2, 2) + this.time * 0.1,
              10,
            );
            offCtx.fillStyle = `hsla(${hue + mandel * 100}, 100%, 90%, ${mandel * normalizedValue * 0.8})`;
            offCtx.fillRect(x + edge, y, 2, 5);
          }
        }

        // Draw highlight on top with lissajous pattern
        if (barHeight > 5) {
          offCtx.shadowBlur = 0;
          const lissajous = MathUtils.lissajous(
            this.time + i * 0.1,
            3,
            2,
            Math.PI / 2,
          );
          const highlightY = y + (lissajous.y + 1) * 5;

          const highlightGradient = offCtx.createLinearGradient(
            x,
            highlightY,
            x,
            y + 30,
          );
          highlightGradient.addColorStop(0, `hsla(${hue}, 100%, 100%, 1)`);
          highlightGradient.addColorStop(1, `hsla(${hue}, 100%, 85%, 0.8)`);
          offCtx.fillStyle = highlightGradient;
          offCtx.fillRect(x, highlightY, barWidth, Math.min(30, barHeight));
        }

        // Draw reflection below with distortion
        if (barHeight > 10) {
          offCtx.shadowBlur = 0;
          const reflectionHeight = Math.min(barHeight * 0.5, 80);
          const reflectionGradient = offCtx.createLinearGradient(
            x,
            canvas.height,
            x,
            canvas.height - reflectionHeight,
          );
          reflectionGradient.addColorStop(
            0,
            `hsla(${hue}, ${saturation}%, ${lightness}%, 0.3)`,
          );
          reflectionGradient.addColorStop(
            0.5,
            `hsla(${hue}, ${saturation}%, ${lightness + 10}%, 0.15)`,
          );
          reflectionGradient.addColorStop(
            1,
            `hsla(${hue}, ${saturation}%, ${lightness}%, 0)`,
          );

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

          const peakY =
            canvas.height - (this.peakDecay[i] ?? 0) * canvas.height * 0.9;

          // Peak shadow/glow - extremely intense
          offCtx.shadowBlur = 50;
          offCtx.shadowColor = `hsla(${hue}, 100%, 95%, 1)`;

          // Peak gradient bar with geometric pattern - maximum brightness
          const peakGradient = offCtx.createLinearGradient(
            x,
            peakY - 6,
            x,
            peakY,
          );
          peakGradient.addColorStop(0, `hsla(${hue + 40}, 100%, 100%, 1)`);
          peakGradient.addColorStop(1, `hsla(${hue + 40}, 100%, 90%, 1)`);

          offCtx.fillStyle = peakGradient;
          offCtx.fillRect(x, peakY - 4, barWidth, 4);

          // Fibonacci spiral peak particles - extremely visible
          const fib = MathUtils.fibonacciSpiralPoint(i % 21, 21, 12);
          offCtx.shadowBlur = 35;
          offCtx.fillStyle = `hsla(${hue + 50}, 100%, 100%, 1)`;
          offCtx.beginPath();
          offCtx.arc(
            x + barWidth / 2 + fib.x * Math.sin(this.time),
            peakY - 10 + fib.y * Math.cos(this.time),
            4,
            0,
            Math.PI * 2,
          );
          offCtx.fill();
        }
      }

      offCtx.restore(); // End kaleidoscopic segment
    }

    offCtx.shadowBlur = 0;

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

    // Apply chromatic aberration overlay - full intensity
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = 1.0;
    ctx.drawImage(offCanvas, this.chromaticShift, 0);
    ctx.globalAlpha = 1.0;
    ctx.drawImage(offCanvas, 0, 0);
    ctx.globalAlpha = 1.0;
    ctx.drawImage(offCanvas, -this.chromaticShift, 0);

    ctx.globalAlpha = 1.0;
    ctx.globalCompositeOperation = "source-over";

    // Draw frequency spectrum overlay line - maximum visibility
    ctx.strokeStyle = `rgba(138, 43, 226, ${0.8 + avgAmplitude * 0.2})`;
    ctx.lineWidth = 4;
    ctx.shadowBlur = 40;
    ctx.shadowColor = "rgba(138, 43, 226, 1)";
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

    // Draw floor line with glow - maximum visibility
    ctx.strokeStyle = `rgba(100, 80, 150, ${0.9 + avgAmplitude * 0.1})`;
    ctx.lineWidth = 4;
    ctx.shadowBlur = 50;
    ctx.shadowColor = "rgba(138, 43, 226, 1)";
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
