// File: src/components/visualizers/CircularRenderer.ts

export class CircularRenderer {
  private rotationOffset = 0;
  private pulsePhase = 0;
  private peakHistory: number[] = [];
  private kaleidoscopeRotation = 0;

  constructor(barCount = 64) {
    this.peakHistory = new Array<number>(barCount).fill(0);
  }

  public render(
    ctx: CanvasRenderingContext2D,
    data: Uint8Array,
    canvas: HTMLCanvasElement,
    barCount = 64,
  ): void {
    const avgAmplitude =
      data.reduce((sum, val) => sum + val, 0) / data.length / 255;
    const hueShift = avgAmplitude * 50;

    // Much darker background for contrast - 30% more transparent
    const bgGradient = ctx.createRadialGradient(
      canvas.width / 2,
      canvas.height / 2,
      0,
      canvas.width / 2,
      canvas.height / 2,
      Math.max(canvas.width, canvas.height) / 2,
    );
    bgGradient.addColorStop(0, `hsla(${260 + hueShift}, 80%, 8%, 0.7)`);
    bgGradient.addColorStop(0.5, `hsla(${280 + hueShift}, 60%, 5%, 0.7)`);
    bgGradient.addColorStop(1, `hsla(${240 + hueShift}, 40%, 3%, 0.7)`);
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const baseRadius = Math.min(canvas.width, canvas.height) / 3;

    const pulseMultiplier = 1 + Math.sin(this.pulsePhase) * avgAmplitude * 0.4;
    const radius = baseRadius * pulseMultiplier;

    this.pulsePhase += 0.05;
    this.rotationOffset += 0.005; // Faster rotation
    this.kaleidoscopeRotation += 0.015; // Rotate the entire kaleidoscope

    const barAngle = (Math.PI * 2) / barCount;
    const dataStep = Math.floor(data.length / barCount);

    const offCanvas = document.createElement("canvas");
    offCanvas.width = canvas.width;
    offCanvas.height = canvas.height;
    const offCtx = offCanvas.getContext("2d")!;
    offCtx.fillStyle = "rgba(0, 0, 0, 0)";
    offCtx.fillRect(0, 0, offCanvas.width, offCanvas.height);

    const segments = 32; // More segments for intricate kaleidoscopic effect

    for (let seg = 0; seg < segments; seg++) {
      offCtx.save();
      offCtx.translate(centerX, centerY);
      offCtx.rotate((seg * Math.PI * 2) / segments + this.kaleidoscopeRotation);

      // Alternating mirror pattern for true kaleidoscope effect
      if (seg % 2 === 0) {
        offCtx.scale(1, 1);
      } else {
        offCtx.scale(-1, 1);
      }

      offCtx.translate(-centerX, -centerY);

      // Clip to wedge segment for sharp geometric divisions
      offCtx.beginPath();
      offCtx.moveTo(centerX, centerY);
      const clipAngle1 = -(Math.PI / segments);
      const clipAngle2 = Math.PI / segments;
      const clipRadius = Math.max(canvas.width, canvas.height) * 1.5;
      offCtx.arc(centerX, centerY, clipRadius, clipAngle1, clipAngle2);
      offCtx.closePath();
      offCtx.clip();

      for (let i = 0; i < 3; i++) {
        const glowRadius = radius * (0.9 - i * 0.15);
        offCtx.strokeStyle = `rgba(138, 43, 226, ${0.7 - i * 0.2})`;
        offCtx.lineWidth = 5;
        offCtx.shadowBlur = 60;
        offCtx.shadowColor = "rgba(138, 43, 226, 1)";
        offCtx.beginPath();
        offCtx.arc(centerX, centerY, glowRadius, 0, Math.PI * 2);
        offCtx.stroke();
      }

      offCtx.shadowBlur = 0;

      // Draw outer ring segments
      for (let i = 0; i < barCount; i++) {
        const dataIndex = i * dataStep;
        const value = data[dataIndex] ?? 0;
        const normalizedValue = value / 255;
        const barLength = normalizedValue * radius * 1.2;

        // Update peak tracking
        const currentPeak = this.peakHistory[i] ?? 0;
        if (barLength > currentPeak) {
          this.peakHistory[i] = barLength;
        } else {
          this.peakHistory[i] = Math.max(0, currentPeak - 2);
        }

        const angle = i * barAngle - Math.PI / 2 + this.rotationOffset;
        const x1 = centerX + Math.cos(angle) * radius;
        const y1 = centerY + Math.sin(angle) * radius;
        const x2 = centerX + Math.cos(angle) * (radius + barLength);
        const y2 = centerY + Math.sin(angle) * (radius + barLength);

        const hue = (i / barCount) * 360 + seg * 11.25; // Full rainbow per segment
        const saturation = 100;
        const lightness = 75 + normalizedValue * 25; // 30% stronger rays

        const gradient = offCtx.createLinearGradient(x1, y1, x2, y2);
        gradient.addColorStop(
          0,
          `hsla(${hue}, ${saturation}%, ${lightness - 15}%, 1)`,
        );
        gradient.addColorStop(
          0.3,
          `hsla(${hue + 30}, ${saturation}%, ${lightness + 15}%, 1)`,
        );
        gradient.addColorStop(
          0.7,
          `hsla(${hue + 60}, ${saturation}%, 100%, 1)`,
        );
        gradient.addColorStop(1, `hsla(${hue + 90}, ${saturation}%, 100%, 1)`);

        offCtx.strokeStyle = gradient;
        offCtx.lineWidth = Math.max(8, 20 - barCount / 20); // 30% thicker rays
        offCtx.shadowBlur = 104 + normalizedValue * 78; // 30% more glow
        offCtx.shadowColor = `hsla(${hue}, 100%, 90%, 1)`;
        offCtx.lineCap = "round";

        offCtx.beginPath();
        offCtx.moveTo(x1, y1);
        offCtx.lineTo(x2, y2);
        offCtx.stroke();

        if (currentPeak > 0) {
          const peakX = centerX + Math.cos(angle) * (radius + currentPeak);
          const peakY = centerY + Math.sin(angle) * (radius + currentPeak);

          offCtx.shadowBlur = 100;
          offCtx.shadowColor = `hsla(${hue + 30}, 100%, 95%, 1)`;
          offCtx.fillStyle = `hsla(${hue + 120}, 100%, 100%, 1)`;
          offCtx.beginPath();
          offCtx.arc(peakX, peakY, 8, 0, Math.PI * 2);
          offCtx.fill();
        }
      }

      offCtx.restore();
    }

    offCtx.shadowBlur = 0;

    // Darker inner circle for better contrast
    const innerGradient = offCtx.createRadialGradient(
      centerX,
      centerY,
      0,
      centerX,
      centerY,
      radius * 0.8,
    );
    innerGradient.addColorStop(
      0,
      `rgba(80, 20, 140, ${0.5 + avgAmplitude * 0.3})`,
    );
    innerGradient.addColorStop(
      0.5,
      `rgba(40, 0, 80, ${0.7 + avgAmplitude * 0.2})`,
    );
    innerGradient.addColorStop(1, "rgba(20, 0, 40, 0.9)");

    offCtx.fillStyle = innerGradient;
    offCtx.beginPath();
    offCtx.arc(centerX, centerY, radius * 0.8, 0, Math.PI * 2);
    offCtx.fill();

    // Draw center glow particle - extremely intense
    offCtx.shadowBlur = 80 + avgAmplitude * 100;
    offCtx.shadowColor = "rgba(200, 150, 255, 1)";
    offCtx.fillStyle = "rgba(255, 255, 255, 1)";
    offCtx.beginPath();
    offCtx.arc(centerX, centerY, 8 + avgAmplitude * 12, 0, Math.PI * 2);
    offCtx.fill();
    offCtx.shadowBlur = 0;

    offCtx.strokeStyle = "rgba(147, 112, 219, 0.9)";
    offCtx.lineWidth = 3;
    for (let i = 0; i < barCount; i++) {
      const dataIndex = i * dataStep;
      const value = data[dataIndex] ?? 0;
      if (value > 150) {
        const angle1 = i * barAngle - Math.PI / 2 + this.rotationOffset;
        const angle2 =
          ((i + 1) % barCount) * barAngle - Math.PI / 2 + this.rotationOffset;

        const arcRadius = radius + (value / 255) * radius * 0.8;

        offCtx.beginPath();
        offCtx.arc(centerX, centerY, arcRadius, angle1, angle2);
        offCtx.stroke();
      }
    }

    // Draw kaleidoscope segments with INTENSE vivid rays - 30% stronger
    for (let seg = 0; seg < segments; seg++) {
      // Base layer - full brightness (30% boost)
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate((seg * Math.PI * 2) / segments + this.kaleidoscopeRotation);
      if (seg % 2 === 0) {
        ctx.scale(1, 1);
      } else {
        ctx.scale(-1, 1);
      }
      ctx.translate(-centerX, -centerY);
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = 1.0;
      ctx.filter = "saturate(3.0) contrast(2.1) brightness(1.5)";
      ctx.drawImage(offCanvas, 0, 0);
      ctx.restore();

      // Red chromatic layer (30% boost)
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate((seg * Math.PI * 2) / segments + this.kaleidoscopeRotation);
      if (seg % 2 === 0) {
        ctx.scale(1, 1);
      } else {
        ctx.scale(-1, 1);
      }
      ctx.translate(-centerX - 2, -centerY - 2);
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = 0.65;
      ctx.filter =
        "saturate(2.6) contrast(1.9) hue-rotate(-10deg) brightness(1.4)";
      ctx.drawImage(offCanvas, 0, 0);
      ctx.restore();

      // Blue chromatic layer (30% boost)
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate((seg * Math.PI * 2) / segments + this.kaleidoscopeRotation);
      if (seg % 2 === 0) {
        ctx.scale(1, 1);
      } else {
        ctx.scale(-1, 1);
      }
      ctx.translate(-centerX + 2, -centerY + 2);
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = 0.65;
      ctx.filter =
        "saturate(2.6) contrast(1.9) hue-rotate(10deg) brightness(1.4)";
      ctx.drawImage(offCanvas, 0, 0);
      ctx.restore();
    }

    // Reset filters and composite modes
    ctx.filter = "none";
    ctx.globalAlpha = 1.0;
    ctx.globalCompositeOperation = "source-over";
  }

  public updateBarCount(barCount: number): void {
    this.peakHistory = new Array<number>(barCount).fill(0);
  }
}
