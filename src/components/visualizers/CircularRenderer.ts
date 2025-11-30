// File: src/components/visualizers/CircularRenderer.ts

export class CircularRenderer {
  private rotationOffset = 0;
  private pulsePhase = 0;
  private peakHistory: number[] = [];

  constructor(barCount = 64) {
    this.peakHistory = new Array<number>(barCount).fill(0);
  }

  public render(ctx: CanvasRenderingContext2D, data: Uint8Array, canvas: HTMLCanvasElement, barCount = 64): void {
    // Vibrant dynamic gradient background
    const avgAmplitude = data.reduce((sum, val) => sum + val, 0) / data.length / 255;
    const hueShift = avgAmplitude * 30;
    
    const bgGradient = ctx.createRadialGradient(
      canvas.width / 2,
      canvas.height / 2,
      0,
      canvas.width / 2,
      canvas.height / 2,
      Math.max(canvas.width, canvas.height) / 2
    );
    bgGradient.addColorStop(0, `hsla(${260 + hueShift}, 75%, 22%, 0.95)`);
    bgGradient.addColorStop(0.5, `hsla(${280 + hueShift}, 70%, 18%, 0.97)`);
    bgGradient.addColorStop(1, `hsla(${240 + hueShift}, 65%, 12%, 1)`);
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const baseRadius = Math.min(canvas.width, canvas.height) / 3;

    // Average amplitude already calculated above
    const pulseMultiplier = 1 + Math.sin(this.pulsePhase) * avgAmplitude * 0.3;
    const radius = baseRadius * pulseMultiplier;

    this.pulsePhase += 0.05;
    this.rotationOffset += 0.003;

    const barAngle = (Math.PI * 2) / barCount;
    const dataStep = Math.floor(data.length / barCount);

    // Draw concentric glow circles
    for (let i = 0; i < 3; i++) {
      const glowRadius = radius * (0.9 - i * 0.15);
      ctx.strokeStyle = `rgba(138, 43, 226, ${0.15 - i * 0.05})`;
      ctx.lineWidth = 2;
      ctx.shadowBlur = 30;
      ctx.shadowColor = 'rgba(138, 43, 226, 0.5)';
      ctx.beginPath();
      ctx.arc(centerX, centerY, glowRadius, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.shadowBlur = 0;

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

      // HSL color based on position and amplitude
      const hue = (i / barCount) * 280 + 200; // Purple to blue spectrum
      const saturation = 70 + normalizedValue * 30;
      const lightness = 50 + normalizedValue * 20;

      // Gradient from inner to outer
      const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
      gradient.addColorStop(0, `hsla(${hue}, ${saturation}%, ${lightness - 20}%, 0.5)`);
      gradient.addColorStop(0.5, `hsla(${hue}, ${saturation}%, ${lightness}%, 0.9)`);
      gradient.addColorStop(1, `hsla(${hue}, 100%, ${lightness + 10}%, 1)`);

      ctx.strokeStyle = gradient;
      ctx.lineWidth = Math.max(2, 8 - barCount / 20);
      ctx.shadowBlur = 15 * normalizedValue;
      ctx.shadowColor = `hsla(${hue}, 100%, 60%, ${normalizedValue})`;
      ctx.lineCap = 'round';

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      // Draw peak indicator
      if (currentPeak > 0) {
        const peakX = centerX + Math.cos(angle) * (radius + currentPeak);
        const peakY = centerY + Math.sin(angle) * (radius + currentPeak);

        ctx.shadowBlur = 20;
        ctx.shadowColor = `hsla(${hue}, 100%, 70%, 0.9)`;
        ctx.fillStyle = `hsla(${hue + 20}, 100%, 75%, 0.95)`;
        ctx.beginPath();
        ctx.arc(peakX, peakY, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.shadowBlur = 0;

    // Draw inner circle with pulsing glow
    const innerGradient = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, radius * 0.8
    );
    innerGradient.addColorStop(0, `rgba(138, 43, 226, ${0.3 + avgAmplitude * 0.4})`);
    innerGradient.addColorStop(0.7, `rgba(75, 0, 130, ${0.2 + avgAmplitude * 0.3})`);
    innerGradient.addColorStop(1, 'rgba(75, 0, 130, 0)');

    ctx.fillStyle = innerGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.8, 0, Math.PI * 2);
    ctx.fill();

    // Draw center glow particle
    ctx.shadowBlur = 30 + avgAmplitude * 40;
    ctx.shadowColor = 'rgba(200, 150, 255, 0.8)';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 4 + avgAmplitude * 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw connecting arcs between high-amplitude bars
    ctx.strokeStyle = 'rgba(147, 112, 219, 0.2)';
    ctx.lineWidth = 1;
    for (let i = 0; i < barCount; i++) {
      const dataIndex = i * dataStep;
      const value = data[dataIndex] ?? 0;
      if (value > 200) {
        const angle1 = i * barAngle - Math.PI / 2 + this.rotationOffset;
        const angle2 = ((i + 1) % barCount) * barAngle - Math.PI / 2 + this.rotationOffset;

        const arcRadius = radius + (value / 255) * radius * 0.8;

        ctx.beginPath();
        ctx.arc(centerX, centerY, arcRadius, angle1, angle2);
        ctx.stroke();
      }
    }
  }

  public updateBarCount(barCount: number): void {
    this.peakHistory = new Array<number>(barCount).fill(0);
  }
}
