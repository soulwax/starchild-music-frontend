// File: src/components/visualizers/ParticleRenderer.ts

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  rotation: number;
  rotationSpeed: number;
  type: 'burst' | 'orbit' | 'fountain';
  hue: number;
  orbitRadius?: number;
}

export class ParticleRenderer {
  private particles: Particle[] = [];
  private barCount: number;
  private barGap: number;
  private barColor: string;

  constructor(barCount = 24, barGap = 2, barColor = 'rgba(79, 70, 229, 0.8)') {
    this.barCount = barCount;
    this.barGap = barGap;
    this.barColor = barColor;
  }

  public render(ctx: CanvasRenderingContext2D, data: Uint8Array, canvas: HTMLCanvasElement): void {
    // Create vibrant gradient background
    const avgAmplitude = data.reduce((sum, val) => sum + val, 0) / data.length;
    const intensity = avgAmplitude / 255;
    const hue = (intensity * 60 + 240) % 360;
    
    const gradient = ctx.createRadialGradient(
      canvas.width / 2,
      canvas.height / 2,
      0,
      canvas.width / 2,
      canvas.height / 2,
      Math.max(canvas.width, canvas.height) / 2
    );
    gradient.addColorStop(0, `hsla(${hue}, 70%, 20%, 0.9)`);
    gradient.addColorStop(0.5, `hsla(${hue + 30}, 65%, 15%, 0.95)`);
    gradient.addColorStop(1, `hsla(${hue + 60}, 60%, 10%, 1)`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Calculate audio properties (avgAmplitude and intensity already calculated above)
    const bassLevel = data.slice(0, 10).reduce((sum, val) => sum + val, 0) / 10;
    const trebleLevel = data.slice(-10).reduce((sum, val) => sum + val, 0) / 10;

    // Spawn new particles
    this.spawnParticles(canvas, avgAmplitude, bassLevel, trebleLevel, intensity);

    // Update and draw particles
    this.updateAndDrawParticles(ctx, canvas);

    // Draw connecting lines
    this.drawConnectionLines(ctx);

    // Draw background frequency bars
    this.drawFrequencyBars(ctx, data, canvas);
  }

  private spawnParticles(
    canvas: HTMLCanvasElement,
    avgAmplitude: number,
    bassLevel: number,
    trebleLevel: number,
    intensity: number
  ): void {
    if (this.particles.length >= 300) return;

    const spawnCount = Math.floor(intensity * 8) + 1;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    for (let i = 0; i < spawnCount; i++) {
      const particleType = Math.random();

      if (particleType < 0.3) {
        // Explosive burst particles from center
        this.spawnBurstParticle(centerX, centerY, bassLevel);
      } else if (particleType < 0.6) {
        // Orbiting particles
        this.spawnOrbitParticle(centerX, centerY, trebleLevel);
      } else {
        // Rising fountain particles
        this.spawnFountainParticle(centerX, canvas.width, canvas.height, avgAmplitude);
      }
    }
  }

  private spawnBurstParticle(centerX: number, centerY: number, bassLevel: number): void {
    const angle = Math.random() * Math.PI * 2;
    const speed = bassLevel / 25 + Math.random() * 3;

    this.particles.push({
      x: centerX,
      y: centerY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0,
      maxLife: Math.random() * 80 + 60,
      size: Math.random() * 4 + 2,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.1,
      type: 'burst',
      hue: (bassLevel / 255) * 180 + 200,
    });
  }

  private spawnOrbitParticle(centerX: number, centerY: number, trebleLevel: number): void {
    const orbitRadius = Math.random() * 100 + 50;
    const angle = Math.random() * Math.PI * 2;

    this.particles.push({
      x: centerX + Math.cos(angle) * orbitRadius,
      y: centerY + Math.sin(angle) * orbitRadius,
      vx: 0,
      vy: 0,
      life: 0,
      maxLife: Math.random() * 120 + 80,
      size: Math.random() * 3 + 1,
      rotation: angle,
      rotationSpeed: (trebleLevel / 255) * 0.05 + 0.02,
      type: 'orbit',
      orbitRadius,
      hue: (trebleLevel / 255) * 180 + 280,
    });
  }

  private spawnFountainParticle(centerX: number, canvasWidth: number, canvasHeight: number, avgAmplitude: number): void {
    const spreadX = (Math.random() - 0.5) * canvasWidth * 0.3;

    this.particles.push({
      x: centerX + spreadX,
      y: canvasHeight,
      vx: (Math.random() - 0.5) * 3,
      vy: -Math.random() * 6 - avgAmplitude / 30,
      life: 0,
      maxLife: Math.random() * 90 + 50,
      size: Math.random() * 3.5 + 1.5,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.15,
      type: 'fountain',
      hue: (avgAmplitude / 255) * 120 + 180,
    });
  }

  private updateAndDrawParticles(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void {
    const newParticles: Particle[] = [];
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    this.particles.forEach((particle, index) => {
      // Update position based on type
      this.updateParticlePosition(particle, centerX, centerY);

      particle.rotation += particle.rotationSpeed;
      particle.life++;

      const lifeRatio = Math.max(0, 1 - particle.life / particle.maxLife);
      const alpha = lifeRatio * 0.9;
      const radius = Math.max(0.2, particle.size * (0.5 + lifeRatio * 0.5));

      // Draw particle trail
      if (index % 3 === 0 && lifeRatio > 0.5) {
        this.drawParticleTrail(ctx, particle, alpha, radius);
      }

      // Draw main particle
      this.drawParticle(ctx, particle, alpha, radius);

      // Keep particle if still alive and in bounds
      const inBounds = particle.x > -50 && particle.x < canvas.width + 50 &&
                      particle.y > -50 && particle.y < canvas.height + 50;
      if (particle.life < particle.maxLife && inBounds) {
        newParticles.push(particle);
      }
    });

    this.particles = newParticles;
    ctx.shadowBlur = 0;
  }

  private updateParticlePosition(particle: Particle, centerX: number, centerY: number): void {
    if (particle.type === 'orbit') {
      particle.rotation += particle.rotationSpeed;
      particle.x = centerX + Math.cos(particle.rotation) * (particle.orbitRadius ?? 0);
      particle.y = centerY + Math.sin(particle.rotation) * (particle.orbitRadius ?? 0);
      // Add spiral effect
      if (particle.orbitRadius) {
        particle.orbitRadius *= 0.995;
      }
    } else if (particle.type === 'burst') {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vx *= 0.98; // Drag
      particle.vy *= 0.98;
    } else {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.15; // Gravity for fountain
      particle.vx *= 0.99;
    }
  }

  private drawParticleTrail(ctx: CanvasRenderingContext2D, particle: Particle, alpha: number, radius: number): void {
    ctx.strokeStyle = `hsla(${particle.hue}, 80%, 60%, ${alpha * 0.3})`;
    ctx.lineWidth = radius * 0.5;
    ctx.beginPath();
    ctx.moveTo(particle.x, particle.y);
    ctx.lineTo(particle.x - particle.vx * 2, particle.y - particle.vy * 2);
    ctx.stroke();
  }

  private drawParticle(ctx: CanvasRenderingContext2D, particle: Particle, alpha: number, radius: number): void {
    const color = `hsla(${particle.hue}, 85%, 65%, ${alpha})`;

    ctx.shadowBlur = radius * 8;
    ctx.shadowColor = color;

    if (particle.type === 'burst' && Math.random() > 0.5) {
      // Star shape for burst particles
      this.drawStar(ctx, particle, color, radius);
    } else {
      // Circle with gradient
      this.drawGlowingCircle(ctx, particle, alpha, radius);
    }
  }

  private drawStar(ctx: CanvasRenderingContext2D, particle: Particle, color: string, radius: number): void {
    ctx.save();
    ctx.translate(particle.x, particle.y);
    ctx.rotate(particle.rotation);
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (i * 4 * Math.PI) / 5;
      const r = i % 2 === 0 ? radius * 2 : radius * 0.8;
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  private drawGlowingCircle(ctx: CanvasRenderingContext2D, particle: Particle, alpha: number, radius: number): void {
    const particleGradient = ctx.createRadialGradient(
      particle.x, particle.y, 0,
      particle.x, particle.y, radius * 2
    );
    particleGradient.addColorStop(0, `hsla(${particle.hue}, 100%, 80%, ${alpha})`);
    particleGradient.addColorStop(0.5, `hsla(${particle.hue}, 85%, 65%, ${alpha})`);
    particleGradient.addColorStop(1, `hsla(${particle.hue}, 80%, 40%, ${alpha * 0.3})`);

    ctx.fillStyle = particleGradient;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, radius * 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawConnectionLines(ctx: CanvasRenderingContext2D): void {
    ctx.lineWidth = 0.5;
    for (let i = 0; i < this.particles.length; i += 3) {
      for (let j = i + 1; j < this.particles.length && j < i + 5; j += 2) {
        const p1 = this.particles[i];
        const p2 = this.particles[j];
        if (!p1 || !p2) continue;
        const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
        if (dist < 80) {
          const alpha = (1 - dist / 80) * 0.3;
          ctx.strokeStyle = `rgba(100, 150, 255, ${alpha})`;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
      }
    }
  }

  private drawFrequencyBars(ctx: CanvasRenderingContext2D, data: Uint8Array, canvas: HTMLCanvasElement): void {
    const barWidth = (canvas.width - this.barGap * (this.barCount - 1)) / this.barCount;
    const dataStep = Math.floor(data.length / this.barCount);

    for (let i = 0; i < this.barCount; i++) {
      const dataIndex = i * dataStep;
      const value = data[dataIndex] ?? 0;
      const barHeight = (value / 255) * (canvas.height / 4);
      const hue = (i / this.barCount) * 60 + 200;

      const x = i * (barWidth + this.barGap);
      const y = canvas.height - barHeight;

      ctx.fillStyle = `hsla(${hue}, 70%, 50%, 0.15)`;
      ctx.fillRect(x, y, barWidth, barHeight);
    }
  }

  public updateConfig(barCount: number, barGap: number, barColor: string): void {
    this.barCount = barCount;
    this.barGap = barGap;
    this.barColor = barColor;
  }

  public reset(): void {
    this.particles = [];
  }
}
