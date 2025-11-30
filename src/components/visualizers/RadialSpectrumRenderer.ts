// File: src/components/visualizers/RadialSpectrumRenderer.ts

export class RadialSpectrumRenderer {
  private rotationAngle = 0;
  private particleRings: Array<{ angle: number; radius: number; life: number; hue: number }> = [];
  private peakHistory: number[] = [];

  constructor(barCount = 64) {
    this.peakHistory = new Array<number>(barCount).fill(0);
  }

  public render(ctx: CanvasRenderingContext2D, data: Uint8Array, canvas: HTMLCanvasElement, barCount = 64): void {
    // Vibrant radial gradient background
    const avgAmplitude = data.reduce((sum, val) => sum + val, 0) / data.length / 255;
    const hueShift = avgAmplitude * 50;
    
    const bgGradient = ctx.createRadialGradient(
      canvas.width / 2,
      canvas.height / 2,
      0,
      canvas.width / 2,
      canvas.height / 2,
      Math.max(canvas.width, canvas.height) / 2
    );
    bgGradient.addColorStop(0, `hsla(${270 + hueShift}, 80%, 24%, 0.94)`);
    bgGradient.addColorStop(0.5, `hsla(${250 + hueShift}, 75%, 18%, 0.96)`);
    bgGradient.addColorStop(1, `hsla(${230 + hueShift}, 70%, 12%, 1)`);
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const maxRadius = Math.min(canvas.width, canvas.height) / 2 - 20;
    const minRadius = 40;

    this.rotationAngle += 0.005;

    const barAngle = (Math.PI * 2) / barCount;
    const dataStep = Math.floor(data.length / barCount);

    // Average amplitude already calculated above

    // Draw concentric guide circles with glow
    const numCircles = 5;
    for (let i = 0; i < numCircles; i++) {
      const r = minRadius + ((maxRadius - minRadius) / numCircles) * (i + 1);
      const alpha = 0.08 + (i / numCircles) * 0.07;

      ctx.strokeStyle = `rgba(138, 43, 226, ${alpha})`;
      ctx.lineWidth = 1;
      ctx.shadowBlur = 8;
      ctx.shadowColor = `rgba(138, 43, 226, ${alpha * 2})`;
      ctx.beginPath();
      ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.shadowBlur = 0;

    // Draw spectrum bars with enhanced visuals
    for (let i = 0; i < barCount; i++) {
      const dataIndex = i * dataStep;
      const value = data[dataIndex] ?? 0;
      const normalizedValue = value / 255;
      const barLength = normalizedValue * (maxRadius - minRadius);

      // Update peak history
      const currentPeak = this.peakHistory[i] ?? 0;
      if (barLength > currentPeak) {
        this.peakHistory[i] = barLength;
      } else {
        this.peakHistory[i] = Math.max(0, currentPeak - 1.5);
      }

      const angle = i * barAngle - Math.PI / 2 + this.rotationAngle;
      const x1 = centerX + Math.cos(angle) * minRadius;
      const y1 = centerY + Math.sin(angle) * minRadius;
      const x2 = centerX + Math.cos(angle) * (minRadius + barLength);
      const y2 = centerY + Math.sin(angle) * (minRadius + barLength);

      // Rainbow spectrum HSL colors
      const hue = (i / barCount) * 360;
      const saturation = 75 + normalizedValue * 25;
      const lightness = 45 + normalizedValue * 25;

      // Create gradient from inner to outer
      const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
      gradient.addColorStop(0, `hsla(${hue}, ${saturation}%, ${lightness - 15}%, 0.4)`);
      gradient.addColorStop(0.4, `hsla(${hue}, ${saturation}%, ${lightness}%, 0.8)`);
      gradient.addColorStop(1, `hsla(${hue}, 100%, ${lightness + 15}%, 1)`);

      // Draw main bar
      ctx.strokeStyle = gradient;
      ctx.lineWidth = Math.max(3, 10 - barCount / 15);
      ctx.shadowBlur = 12 + normalizedValue * 15;
      ctx.shadowColor = `hsla(${hue}, 100%, 60%, ${normalizedValue * 0.8})`;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      // Draw peak indicator with glow
      if (currentPeak > 5) {
        const peakX = centerX + Math.cos(angle) * (minRadius + currentPeak);
        const peakY = centerY + Math.sin(angle) * (minRadius + currentPeak);

        ctx.shadowBlur = 25;
        ctx.shadowColor = `hsla(${hue}, 100%, 70%, 0.9)`;

        // Outer glow
        ctx.fillStyle = `hsla(${hue}, 100%, 60%, 0.4)`;
        ctx.beginPath();
        ctx.arc(peakX, peakY, 5, 0, Math.PI * 2);
        ctx.fill();

        // Inner bright dot
        ctx.fillStyle = `hsla(${hue}, 100%, 85%, 0.95)`;
        ctx.beginPath();
        ctx.arc(peakX, peakY, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Spawn particle rings at high amplitudes
      if (normalizedValue > 0.75 && Math.random() > 0.9) {
        this.particleRings.push({
          angle,
          radius: minRadius + barLength,
          life: 0,
          hue
        });
      }
    }

    ctx.shadowBlur = 0;

    // Update and draw particle rings
    const newParticles: typeof this.particleRings = [];
    this.particleRings.forEach(particle => {
      particle.life++;
      particle.radius += 2;

      const lifeRatio = Math.max(0, 1 - particle.life / 60);
      const alpha = lifeRatio * 0.6;

      if (lifeRatio > 0) {
        const px = centerX + Math.cos(particle.angle) * particle.radius;
        const py = centerY + Math.sin(particle.angle) * particle.radius;

        ctx.shadowBlur = 15;
        ctx.shadowColor = `hsla(${particle.hue}, 100%, 70%, ${alpha})`;
        ctx.fillStyle = `hsla(${particle.hue}, 100%, 75%, ${alpha})`;
        ctx.beginPath();
        ctx.arc(px, py, 3 * lifeRatio, 0, Math.PI * 2);
        ctx.fill();

        newParticles.push(particle);
      }
    });
    this.particleRings = newParticles;

    ctx.shadowBlur = 0;

    // Draw center glow
    const centerGradient = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, minRadius
    );
    centerGradient.addColorStop(0, `rgba(138, 43, 226, ${0.4 + avgAmplitude * 0.4})`);
    centerGradient.addColorStop(0.6, `rgba(75, 0, 130, ${0.2 + avgAmplitude * 0.3})`);
    centerGradient.addColorStop(1, 'rgba(75, 0, 130, 0)');

    ctx.fillStyle = centerGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, minRadius, 0, Math.PI * 2);
    ctx.fill();

    // Center pulsing orb
    const orbSize = 6 + avgAmplitude * 10;
    ctx.shadowBlur = 35 + avgAmplitude * 30;
    ctx.shadowColor = 'rgba(255, 200, 255, 0.9)';

    const orbGradient = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, orbSize
    );
    orbGradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    orbGradient.addColorStop(0.4, 'rgba(220, 180, 255, 0.9)');
    orbGradient.addColorStop(1, 'rgba(138, 43, 226, 0.5)');

    ctx.fillStyle = orbGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, orbSize, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
  }

  public updateBarCount(barCount: number): void {
    this.peakHistory = new Array<number>(barCount).fill(0);
  }
}
