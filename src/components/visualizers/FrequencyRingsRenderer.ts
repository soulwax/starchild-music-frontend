// File: src/components/visualizers/FrequencyRingsRenderer.ts

interface RingParticle {
  angle: number;
  ringIndex: number;
  life: number;
  size: number;
  hue: number;
}

export class FrequencyRingsRenderer {
  private rotationOffset = 0;
  private pulsePhases: number[] = [];
  private particles: RingParticle[] = [];
  private intensityHistory: number[] = [];

  constructor(numRings = 8) {
    this.pulsePhases = new Array<number>(numRings).fill(0);
    this.intensityHistory = new Array<number>(numRings).fill(0);
  }

  public render(ctx: CanvasRenderingContext2D, data: Uint8Array, canvas: HTMLCanvasElement): void {
    // Calculate global intensity
    const avgAmplitude = data.reduce((sum, val) => sum + val, 0) / data.length / 255;
    const hueShift = avgAmplitude * 45;
    
    // Vibrant gradient background with depth
    const bgGradient = ctx.createRadialGradient(
      canvas.width / 2,
      canvas.height / 2,
      0,
      canvas.width / 2,
      canvas.height / 2,
      Math.max(canvas.width, canvas.height) / 2
    );
    bgGradient.addColorStop(0, `hsla(${265 + hueShift}, 78%, 23%, 0.94)`);
    bgGradient.addColorStop(0.5, `hsla(${255 + hueShift}, 72%, 19%, 0.96)`);
    bgGradient.addColorStop(1, `hsla(${245 + hueShift}, 68%, 12%, 1)`);
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const maxRadius = Math.min(canvas.width, canvas.height) / 2 - 10;

    this.rotationOffset += 0.008;

    const numRings = 10;
    const dataStep = Math.floor(data.length / numRings);

    // Draw rings from outside to inside for proper layering
    for (let i = numRings - 1; i >= 0; i--) {
      const dataIndex = i * dataStep;
      const value = data[dataIndex] ?? 0;
      const normalizedValue = value / 255;

      // Update intensity history for smoother transitions
      this.intensityHistory[i] = (this.intensityHistory[i] ?? 0) * 0.85 + normalizedValue * 0.15;
      const smoothValue = this.intensityHistory[i] ?? 0;

      // Update pulse phase for each ring
      const currentPhase = (this.pulsePhases[i] ?? 0) + 0.03 + smoothValue * 0.05;
      this.pulsePhases[i] = currentPhase;

      // Calculate ring properties
      const baseRadius = ((i + 1) / numRings) * maxRadius;
      const pulseAmount = Math.sin(currentPhase) * smoothValue * 15;
      const radius = Math.max(0, baseRadius + pulseAmount);

      // Dynamic line width based on amplitude
      const lineWidth = (smoothValue * 15) + 2;

      // Rainbow spectrum with depth
      const hue = (i / numRings) * 360 + this.rotationOffset * 50;
      const saturation = 70 + smoothValue * 30;
      const lightness = 40 + smoothValue * 30;
      const alpha = 0.6 + smoothValue * 0.4;

      // Draw main ring with gradient
      ctx.strokeStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`;
      ctx.lineWidth = lineWidth;
      ctx.shadowBlur = 20 + smoothValue * 25;
      ctx.shadowColor = `hsla(${hue}, 100%, 60%, ${smoothValue * 0.8})`;
      ctx.lineCap = 'round';

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();

      // Draw inner glow ring
      ctx.strokeStyle = `hsla(${hue}, 100%, ${lightness + 20}%, ${alpha * 0.5})`;
      ctx.lineWidth = lineWidth * 0.4;
      ctx.shadowBlur = 30;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();

      // Draw segmented overlay for visual interest
      if (smoothValue > 0.3) {
        const numSegments = 32;
        const segmentAngle = (Math.PI * 2) / numSegments;

        ctx.strokeStyle = `hsla(${hue + 20}, 100%, ${lightness + 25}%, ${smoothValue * 0.6})`;
        ctx.lineWidth = lineWidth * 0.6;
        ctx.shadowBlur = 15;

        for (let seg = 0; seg < numSegments; seg++) {
          const startAngle = seg * segmentAngle + this.rotationOffset * (1 + i * 0.1);
          const endAngle = startAngle + segmentAngle * 0.4;

          ctx.beginPath();
          ctx.arc(centerX, centerY, radius, startAngle, endAngle);
          ctx.stroke();
        }
      }

      // Spawn particles at high intensity
      if (smoothValue > 0.7 && Math.random() > 0.85 && this.particles.length < 200) {
        const angle = Math.random() * Math.PI * 2;
        this.particles.push({
          angle,
          ringIndex: i,
          life: 0,
          size: 2 + smoothValue * 3,
          hue
        });
      }

      // Draw frequency ripples at peak moments
      if (smoothValue > 0.8) {
        const numRipples = 3;
        for (let r = 0; r < numRipples; r++) {
          const ripplePhase = (currentPhase + r * Math.PI * 0.66) % (Math.PI * 2);
          const rippleRadius = Math.max(0, radius + Math.sin(ripplePhase) * 8);
          const rippleAlpha = (1 - Math.abs(Math.sin(ripplePhase))) * smoothValue * 0.3;

          ctx.strokeStyle = `hsla(${hue}, 100%, 70%, ${rippleAlpha})`;
          ctx.lineWidth = 1;
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(centerX, centerY, rippleRadius, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    }

    ctx.shadowBlur = 0;

    // Update and draw particles
    const newParticles: RingParticle[] = [];
    this.particles.forEach(particle => {
      particle.life++;
      particle.angle += 0.02;

      const lifeRatio = Math.max(0, 1 - particle.life / 80);

      if (lifeRatio > 0) {
        const ringRadius = ((particle.ringIndex + 1) / numRings) * maxRadius;
        const px = centerX + Math.cos(particle.angle) * ringRadius;
        const py = centerY + Math.sin(particle.angle) * ringRadius;

        const alpha = lifeRatio * 0.8;
        const size = particle.size * (0.5 + lifeRatio * 0.5);

        // Particle glow
        ctx.shadowBlur = 20;
        ctx.shadowColor = `hsla(${particle.hue}, 100%, 70%, ${alpha})`;

        const particleGradient = ctx.createRadialGradient(
          px, py, 0,
          px, py, Math.max(0.1, size * 2)
        );
        particleGradient.addColorStop(0, `hsla(${particle.hue}, 100%, 85%, ${alpha})`);
        particleGradient.addColorStop(0.5, `hsla(${particle.hue}, 100%, 65%, ${alpha * 0.8})`);
        particleGradient.addColorStop(1, `hsla(${particle.hue}, 100%, 45%, ${alpha * 0.3})`);

        ctx.fillStyle = particleGradient;
        ctx.beginPath();
        ctx.arc(px, py, Math.max(0, size * 1.5), 0, Math.PI * 2);
        ctx.fill();

        newParticles.push(particle);
      }
    });
    this.particles = newParticles;

    ctx.shadowBlur = 0;

    // Draw center orb with pulsing effect
    const orbSize = 8 + avgAmplitude * 15;
    const orbPulse = Math.sin(this.rotationOffset * 5) * 0.3 + 1;
    const finalOrbSize = Math.max(0.1, orbSize * orbPulse);

    ctx.shadowBlur = 40 + avgAmplitude * 40;
    ctx.shadowColor = `rgba(200, 150, 255, ${0.7 + avgAmplitude * 0.3})`;

    const orbGradient = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, finalOrbSize
    );
    orbGradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    orbGradient.addColorStop(0.3, 'rgba(230, 200, 255, 0.95)');
    orbGradient.addColorStop(0.7, 'rgba(180, 120, 255, 0.8)');
    orbGradient.addColorStop(1, 'rgba(138, 43, 226, 0.4)');

    ctx.fillStyle = orbGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, finalOrbSize, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;

    // Draw radial grid lines for depth
    ctx.strokeStyle = 'rgba(138, 43, 226, 0.08)';
    ctx.lineWidth = 1;
    const numLines = 24;
    for (let i = 0; i < numLines; i++) {
      const angle = (i / numLines) * Math.PI * 2 + this.rotationOffset * 0.5;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(
        centerX + Math.cos(angle) * maxRadius,
        centerY + Math.sin(angle) * maxRadius
      );
      ctx.stroke();
    }
  }

  public updateRingCount(numRings: number): void {
    this.pulsePhases = new Array<number>(numRings).fill(0);
    this.intensityHistory = new Array<number>(numRings).fill(0);
  }
}
