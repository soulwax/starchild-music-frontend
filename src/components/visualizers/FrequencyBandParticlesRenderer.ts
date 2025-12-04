// File: src/components/visualizers/FrequencyBandParticlesRenderer.ts

import type { AudioAnalysis } from "@/utils/audioAnalysis";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  bandIndex: number;
  hue: number;
}

export class FrequencyBandParticlesRenderer {
  private particles: Particle[] = [];
  private time = 0;
  private connectionDistance = 120;

  // Color mapping for each frequency band
  private readonly bandColors = [
    { name: "bass", hue: 0, saturation: 80, lightness: 50 }, // Red/Orange
    { name: "lowMid", hue: 45, saturation: 90, lightness: 55 }, // Yellow
    { name: "mid", hue: 120, saturation: 70, lightness: 50 }, // Green
    { name: "highMid", hue: 180, saturation: 80, lightness: 55 }, // Cyan
    { name: "treble", hue: 240, saturation: 85, lightness: 50 }, // Blue/Purple
  ];

  constructor() {
    // Particles will be initialized on first render with canvas dimensions
  }

  private createParticle(
    bandIndex: number,
    x: number,
    y: number,
    canvasWidth: number,
    canvasHeight: number,
  ): Particle {
    const index = Math.floor(bandIndex);
    const color = this.bandColors[index]!;
    return {
      x: x || Math.random() * canvasWidth,
      y: y || Math.random() * canvasHeight,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      size: 2 + Math.random() * 4,
      life: 1,
      maxLife: 1,
      bandIndex: index,
      hue: color.hue,
    };
  }

  public render(
    ctx: CanvasRenderingContext2D,
    data: Uint8Array,
    canvas: HTMLCanvasElement,
    audioAnalysis?: AudioAnalysis | null,
  ): void {
    if (audioAnalysis) {
      this.time += 0.02;

      // Vibrant gradient background
      // Frequency bands are already normalized to 0-1 range
      const avgIntensity =
        (audioAnalysis.frequencyBands.bass +
          audioAnalysis.frequencyBands.mid +
          audioAnalysis.frequencyBands.treble) /
        3;
      const hueShift = Math.min(60, avgIntensity * 50); // Clamp to max 60 degrees
      const bgGradient = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        0,
        canvas.width / 2,
        canvas.height / 2,
        Math.max(canvas.width, canvas.height) / 2,
      );
      bgGradient.addColorStop(0, `hsla(${280 + hueShift}, 75%, 20%, 0.92)`);
      bgGradient.addColorStop(0.5, `hsla(${270 + hueShift}, 70%, 16%, 0.95)`);
      bgGradient.addColorStop(1, `hsla(${260 + hueShift}, 65%, 10%, 1)`);
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const bands = [
        audioAnalysis.frequencyBands.bass,
        audioAnalysis.frequencyBands.lowMid,
        audioAnalysis.frequencyBands.mid,
        audioAnalysis.frequencyBands.highMid,
        audioAnalysis.frequencyBands.treble,
      ];

      // Initialize particles on first render if needed
      if (this.particles.length === 0) {
        for (let i = 0; i < 50; i++) {
          this.particles.push(
            this.createParticle(
              Math.random() * 5,
              0,
              0,
              canvas.width,
              canvas.height,
            ),
          );
        }
      }

      // Spawn new particles based on band intensity
      bands.forEach((bandValue, bandIndex) => {
        const spawnRate = bandValue * 0.3;
        if (Math.random() < spawnRate) {
          const spawnX =
            (bandIndex / 5) * canvas.width + Math.random() * (canvas.width / 5);
          const spawnY =
            canvas.height / 2 + (Math.random() - 0.5) * canvas.height * 0.3;
          this.particles.push(
            this.createParticle(
              bandIndex,
              spawnX,
              spawnY,
              canvas.width,
              canvas.height,
            ),
          );
        }
      });

      // Update and draw particles
      this.particles = this.particles.filter((particle) => {
        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Apply band-based forces
        const bandValue = bands[particle.bandIndex] ?? 0;
        const centerX =
          (particle.bandIndex / 5) * canvas.width + canvas.width / 10;
        const centerY = canvas.height / 2;

        // Attraction to band center
        const dx = centerX - particle.x;
        const dy = centerY - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const force = bandValue * 0.1;
        particle.vx += (dx / (distance + 1)) * force;
        particle.vy += (dy / (distance + 1)) * force;

        // Damping
        particle.vx *= 0.98;
        particle.vy *= 0.98;

        // Boundary bounce
        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -0.8;
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -0.8;

        // Keep in bounds
        particle.x = Math.max(0, Math.min(canvas.width, particle.x));
        particle.y = Math.max(0, Math.min(canvas.height, particle.y));

        // Update life
        particle.life -= 0.01;
        if (particle.life <= 0) {
          return false; // Remove dead particles
        }

        // Update size based on band intensity
        particle.size = 2 + bandValue * 6;

        return true;
      });

      // Draw connecting lines between particles of same band
      ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
      ctx.lineWidth = 1;
      for (let i = 0; i < this.particles.length; i++) {
        for (let j = i + 1; j < this.particles.length; j++) {
          const p1 = this.particles[i]!;
          const p2 = this.particles[j]!;

          if (p1.bandIndex === p2.bandIndex) {
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < this.connectionDistance) {
              const opacity = (1 - distance / this.connectionDistance) * 0.3;
              ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
              ctx.beginPath();
              ctx.moveTo(p1.x, p1.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.stroke();
            }
          }
        }
      }

      // Draw particles
      this.particles.forEach((particle) => {
        const bandValue = bands[particle.bandIndex] ?? 0;
        const color = this.bandColors[particle.bandIndex]!;
        const hueShift = Math.sin(this.time * 0.5 + particle.bandIndex) * 10;
        const saturation = color.saturation + bandValue * 20;
        const lightness = color.lightness + bandValue * 25;

        // Particle gradient - ensure size is positive
        const particleSize = Math.max(0.1, particle.size);
        const particleGradient = ctx.createRadialGradient(
          particle.x,
          particle.y,
          0,
          particle.x,
          particle.y,
          particleSize,
        );
        particleGradient.addColorStop(
          0,
          `hsla(${color.hue + hueShift}, ${saturation}%, ${lightness + 20}%, ${particle.life * 0.9})`,
        );
        particleGradient.addColorStop(
          1,
          `hsla(${color.hue + hueShift}, ${saturation}%, ${lightness}%, ${particle.life * 0.5})`,
        );

        ctx.fillStyle = particleGradient;
        ctx.shadowBlur = 15 + bandValue * 20;
        ctx.shadowColor = `hsla(${color.hue + hueShift}, 100%, 60%, ${bandValue * particle.life * 0.8})`;

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.shadowBlur = 0;
    } else {
      // Fallback: clear canvas if no analysis
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }
}
