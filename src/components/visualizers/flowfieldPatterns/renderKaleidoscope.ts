// File: src/components/visualizers/flowfieldPatterns/renderKaleidoscope.ts

import type { FlowFieldPatternContext } from "./types";

let offscreenCanvas: HTMLCanvasElement | null = null;
let offscreenCtx: CanvasRenderingContext2D | null = null;
let cachedMaxDim = 0;
let cachedVignetteGradient: CanvasGradient | null = null;

export function renderKaleidoscope(
  p: FlowFieldPatternContext,
  audioIntensity: number,
  bassIntensity: number,
  trebleIntensity: number,
): void {
  const ctx = p.ctx;
  const segments = p.kaleidoscopeSegments ?? 24;
  const rotationSpeed = p.kaleidoscopeRotationSpeed ?? 1.0;
  const particleDensity = p.kaleidoscopeParticleDensity ?? 1.0;
  const colorShift = p.kaleidoscopeColorShift ?? 1.0;

  const rotationAngle = p.time * 0.0005 * rotationSpeed;

  const segmentAngle = p.TWO_PI / segments;
  const halfSegmentAngle = segmentAngle / 2;

  ctx.save();

  const maxDim = Math.max(p.width, p.height);
  if (!cachedVignetteGradient || cachedMaxDim !== maxDim) {
    cachedMaxDim = maxDim;
    cachedVignetteGradient = ctx.createRadialGradient(
      p.centerX,
      p.centerY,
      maxDim * 0.15,
      p.centerX,
      p.centerY,
      maxDim * 0.75,
    );
    cachedVignetteGradient.addColorStop(0, "rgba(0, 0, 0, 0)");
    cachedVignetteGradient.addColorStop(0.7, "rgba(0, 0, 0, 0.3)");
    cachedVignetteGradient.addColorStop(1, "rgba(0, 0, 0, 0.5)");
  }
  ctx.fillStyle = cachedVignetteGradient;
  ctx.fillRect(0, 0, p.width, p.height);

  if (offscreenCanvas?.width !== maxDim || offscreenCanvas?.height !== maxDim) {
    offscreenCanvas = document.createElement("canvas");
    offscreenCanvas.width = maxDim;
    offscreenCanvas.height = maxDim;
    offscreenCtx = offscreenCanvas.getContext("2d", { alpha: true }) ?? null;
  }

  if (!offscreenCtx) return;

  offscreenCtx.clearRect(0, 0, maxDim, maxDim);

  offscreenCtx.save();
  offscreenCtx.translate(maxDim / 2, maxDim / 2);

  offscreenCtx.beginPath();
  offscreenCtx.moveTo(0, 0);
  offscreenCtx.arc(0, 0, maxDim, -halfSegmentAngle, halfSegmentAngle);
  offscreenCtx.closePath();
  offscreenCtx.clip();

  drawSegmentPattern(
    offscreenCtx,
    p,
    audioIntensity,
    bassIntensity,
    trebleIntensity,
    maxDim,
    particleDensity,
    colorShift,
    0,
  );

  offscreenCtx.restore();

  ctx.save();
  ctx.translate(p.centerX, p.centerY);
  ctx.rotate(rotationAngle);

  for (let seg = 0; seg < segments; seg++) {
    ctx.save();
    ctx.rotate(seg * segmentAngle);

    ctx.drawImage(offscreenCanvas, -maxDim / 2, -maxDim / 2, maxDim, maxDim);

    ctx.save();
    ctx.scale(1, -1);
    ctx.drawImage(offscreenCanvas, -maxDim / 2, -maxDim / 2, maxDim, maxDim);
    ctx.restore();

    ctx.restore();
  }

  ctx.restore();
  ctx.restore();

  ctx.save();
  ctx.globalCompositeOperation = "lighter";

  const glowRadius = 50 + bassIntensity * 100 + audioIntensity * 60;
  const centralHue = p.fastMod360(p.hueBase + p.time * 0.08);
  const pulsePhase = p.fastSin(p.time * 0.005);

  const outerGlow = ctx.createRadialGradient(
    p.centerX,
    p.centerY,
    0,
    p.centerX,
    p.centerY,
    glowRadius * 1.5,
  );
  const hue1 = centralHue;
  const hue2 = p.fastMod360(centralHue + 60);
  outerGlow.addColorStop(0, p.hsla(hue1, 100, 80, 0.6 + audioIntensity * 0.3));
  outerGlow.addColorStop(0.3, p.hsla(hue2, 100, 75, 0.4 + pulsePhase * 0.2));
  outerGlow.addColorStop(0.6, p.hsla(hue1, 95, 65, 0.2));
  outerGlow.addColorStop(1, p.hsla(hue2, 90, 55, 0));
  ctx.fillStyle = outerGlow;
  ctx.beginPath();
  ctx.arc(p.centerX, p.centerY, glowRadius * 1.5, 0, p.TWO_PI);
  ctx.fill();

  const midGlow = ctx.createRadialGradient(
    p.centerX,
    p.centerY,
    0,
    p.centerX,
    p.centerY,
    glowRadius,
  );
  const hue3 = p.fastMod360(centralHue + 120);
  midGlow.addColorStop(0, p.hsla(centralHue, 100, 85, 0.9 + audioIntensity * 0.1));
  midGlow.addColorStop(0.25, p.hsla(hue3, 100, 80, 0.7));
  midGlow.addColorStop(0.5, p.hsla(centralHue, 95, 70, 0.5));
  midGlow.addColorStop(1, p.hsla(hue3, 90, 60, 0));
  ctx.fillStyle = midGlow;
  ctx.beginPath();
  ctx.arc(p.centerX, p.centerY, glowRadius, 0, p.TWO_PI);
  ctx.fill();

  const coreGlow = ctx.createRadialGradient(
    p.centerX,
    p.centerY,
    0,
    p.centerX,
    p.centerY,
    glowRadius * 0.4,
  );
  coreGlow.addColorStop(0, `rgba(255, 255, 255, ${0.8 + bassIntensity * 0.2})`);
  coreGlow.addColorStop(0.2, p.hsla(centralHue, 100, 95, 0.9));
  coreGlow.addColorStop(0.5, p.hsla(centralHue, 100, 85, 0.7));
  coreGlow.addColorStop(1, p.hsla(centralHue, 100, 75, 0));
  ctx.fillStyle = coreGlow;
  ctx.beginPath();
  ctx.arc(p.centerX, p.centerY, glowRadius * 0.4, 0, p.TWO_PI);
  ctx.fill();

  const rayCount = Math.floor((p.kaleidoscopeSegments ?? 24) * 2);
  const rayAngleStep = p.TWO_PI / rayCount;
  for (let i = 0; i < rayCount; i++) {
    const rayAngle = i * rayAngleStep + p.time * 0.002;
    const rayLength = glowRadius * 1.8 * (0.7 + audioIntensity * 0.4 + p.fastSin(p.time * 0.003 + i) * 0.2);
    const rayWidth = 8 + bassIntensity * 12;

    const endX = p.centerX + p.fastCos(rayAngle) * rayLength;
    const endY = p.centerY + p.fastSin(rayAngle) * rayLength;

    const rayHue = p.fastMod360(centralHue + i * (360 / rayCount) * 2);
    const rayGrad = ctx.createLinearGradient(p.centerX, p.centerY, endX, endY);
    rayGrad.addColorStop(0, p.hsla(rayHue, 100, 90, 0.8));
    rayGrad.addColorStop(0.3, p.hsla(rayHue, 100, 80, 0.5 + audioIntensity * 0.3));
    rayGrad.addColorStop(0.7, p.hsla(rayHue, 95, 70, 0.2));
    rayGrad.addColorStop(1, p.hsla(rayHue, 90, 60, 0));

    ctx.strokeStyle = rayGrad;
    ctx.lineWidth = rayWidth;
    ctx.beginPath();
    ctx.moveTo(p.centerX, p.centerY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
  }

  ctx.restore();
}

function drawSegmentPattern(
  ctx: CanvasRenderingContext2D,
  p: FlowFieldPatternContext,
  audioIntensity: number,
  bassIntensity: number,
  trebleIntensity: number,
  maxRadius: number,
  particleDensity: number,
  colorShift: number,
  seed: number,
): void {
  const particleCount = Math.floor(
    16 * particleDensity * (0.7 + audioIntensity * 0.3),
  );

  ctx.globalCompositeOperation = "lighter";

  const waveCount = Math.floor(5 + bassIntensity * 3);
  for (let i = 0; i < waveCount; i++) {
    const waveRadius = (maxRadius * 0.6 * (i + 1)) / waveCount;
    const wavePhase = p.time * 0.003 - waveRadius * 0.008;
    const waveHue = p.fastMod360(p.hueBase + p.fastSin(wavePhase) * 60 * colorShift + i * 40);
    const waveIntensity = Math.abs(p.fastSin(wavePhase * 2)) * (0.25 + audioIntensity * 0.35);

    for (let chromaShift = -1; chromaShift <= 1; chromaShift++) {
      const chromaHue = p.fastMod360(waveHue + chromaShift * 15 * colorShift);
      const chromaAlpha = waveIntensity * (1 - Math.abs(chromaShift) * 0.3);

      ctx.strokeStyle = p.hsla(chromaHue, 100, 70, chromaAlpha);
      ctx.lineWidth = (1.5 + audioIntensity * 2.5) * (1 + Math.abs(chromaShift) * 0.5);
      ctx.beginPath();
      ctx.arc(0, 0, waveRadius + chromaShift * 2, -Math.PI * 0.08, Math.PI * 0.08);
      ctx.stroke();
    }
  }

  const spiralCount = Math.floor(3 * (0.8 + trebleIntensity * 0.2));
  for (let s = 0; s < spiralCount; s++) {
    const spiralHue = p.fastMod360(p.hueBase + s * 120 + p.time * 0.1);
    const spiralPhase = p.time * 0.001 + s * p.TWO_PI / spiralCount;

    ctx.beginPath();
    for (let t = 0; t < 50; t++) {
      const progress = t / 50;
      const angle = progress * Math.PI * 0.08 + spiralPhase * 0.5;
      const radius = maxRadius * 0.1 + progress * maxRadius * 0.4 * (0.9 + bassIntensity * 0.1);
      const x = p.fastCos(angle) * radius;
      const y = p.fastSin(angle) * radius;

      if (t === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    const spiralGrad = ctx.createLinearGradient(0, 0, maxRadius * 0.5, 0);
    spiralGrad.addColorStop(0, p.hsla(spiralHue, 100, 75, 0.6 + audioIntensity * 0.4));
    spiralGrad.addColorStop(0.5, p.hsla(spiralHue, 95, 65, 0.4));
    spiralGrad.addColorStop(1, p.hsla(spiralHue, 90, 55, 0));

    ctx.strokeStyle = spiralGrad;
    ctx.lineWidth = 1 + trebleIntensity * 2;
    ctx.stroke();
  }

  for (let i = 0; i < particleCount; i++) {
    const angle = ((seed * 7919 + i * 2654435761) % 10000) / 10000;
    const radiusNorm = ((seed * 9973 + i * 1664525) % 10000) / 10000;

    const particleAngle = angle * Math.PI * 0.08;
    const baseRadius = radiusNorm * maxRadius * 0.5;

    const radiusMod =
      1 +
      p.fastSin(p.time * 0.002 + i * 0.5 + seed * 0.1) * 0.3 * audioIntensity +
      p.fastSin(p.time * 0.003 + i * 0.3) * 0.2 * bassIntensity +
      p.fastSin(p.time * 0.004 + baseRadius * 0.01) * 0.15 * trebleIntensity;
    const radius = baseRadius * radiusMod;

    const x = p.fastCos(particleAngle) * radius;
    const y = p.fastSin(particleAngle) * radius;

    const radiusHueShift = (radius / maxRadius) * 90 * colorShift;
    const timeHueShift = p.fastSin(p.time * 0.002 - radius * 0.01) * 30 * colorShift;
    const radialWave = p.fastSin(radius * 0.05 - p.time * 0.005) * 40 * colorShift;
    const hue = p.fastMod360(p.hueBase + radiusHueShift + timeHueShift + radialWave + i * 8);

    const distanceFactor = 1 - radius / (maxRadius * 0.5);
    const baseSize = 1.5 + distanceFactor * 4;
    const size = baseSize * (0.9 + audioIntensity * 0.5 + trebleIntensity * 0.7);

    const opacity = (0.4 + distanceFactor * 0.6) * (0.7 + audioIntensity * 0.4);

    const chromaticOffsets = [
      { hueShift: -20, xOff: -size * 0.15, yOff: 0, alpha: 0.7 },
      { hueShift: 0, xOff: 0, yOff: 0, alpha: 1.0 },
      { hueShift: 20, xOff: size * 0.15, yOff: 0, alpha: 0.7 },
    ];

    for (const offset of chromaticOffsets) {
      const chromaHue = p.fastMod360(hue + offset.hueShift * colorShift);
      const chromaX = x + offset.xOff;
      const chromaY = y + offset.yOff;
      const chromaAlpha = opacity * offset.alpha;

      const gradient = ctx.createRadialGradient(chromaX, chromaY, 0, chromaX, chromaY, size * 2.5);
      gradient.addColorStop(0, p.hsla(chromaHue, 100, 85, chromaAlpha));
      gradient.addColorStop(0.15, p.hsla(chromaHue, 100, 75, chromaAlpha * 0.9));
      gradient.addColorStop(0.4, p.hsla(chromaHue, 95, 65, chromaAlpha * 0.6));
      gradient.addColorStop(0.7, p.hsla(chromaHue, 90, 55, chromaAlpha * 0.3));
      gradient.addColorStop(1, p.hsla(chromaHue, 85, 45, 0));

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(chromaX, chromaY, size * 2.5, 0, p.TWO_PI);
      ctx.fill();
    }
  }

  const lineCount = Math.floor(6 * (0.8 + audioIntensity * 0.3));
  for (let i = 0; i < lineCount; i++) {
    const lineAngle = (i / lineCount) * Math.PI * 0.08;
    const startRadius = maxRadius * 0.08;
    const endRadius = maxRadius * 0.52 * (0.85 + bassIntensity * 0.25);

    const startX = p.fastCos(lineAngle) * startRadius;
    const startY = p.fastSin(lineAngle) * startRadius;
    const endX = p.fastCos(lineAngle) * endRadius;
    const endY = p.fastSin(lineAngle) * endRadius;

    const hue1 = p.fastMod360(p.hueBase + i * 20 + p.time * 0.08);
    const hue2 = p.fastMod360(hue1 + 60 * colorShift);
    const hue3 = p.fastMod360(hue1 + 120 * colorShift);

    const gradient = ctx.createLinearGradient(startX, startY, endX, endY);
    gradient.addColorStop(0, p.hsla(hue1, 100, 75, 0.5 + audioIntensity * 0.4));
    gradient.addColorStop(0.5, p.hsla(hue2, 95, 70, 0.4 + audioIntensity * 0.3));
    gradient.addColorStop(1, p.hsla(hue3, 90, 60, 0));

    ctx.strokeStyle = gradient;
    ctx.lineWidth = 0.8 + trebleIntensity * 2.5 + audioIntensity * 1.5;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
  }

  const ringCount = Math.floor(5 * (0.8 + bassIntensity * 0.3));
  for (let i = 0; i < ringCount; i++) {
    const ringProgress = (i + 1) / ringCount;
    const ringRadius = maxRadius * 0.2 * ringProgress;
    const ringPhase = p.time * 0.003 - ringRadius * 0.01;
    const hue = p.fastMod360(p.hueBase + i * 40 - p.time * 0.05 + p.fastSin(ringPhase) * 30);
    const opacity = (0.25 + audioIntensity * 0.25 + Math.abs(p.fastSin(ringPhase)) * 0.3) * (1 - ringProgress * 0.5);

    ctx.strokeStyle = p.hsla(hue, 100, 70, opacity);
    ctx.lineWidth = 1 + audioIntensity * 2 + p.fastSin(ringPhase * 3) * 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, ringRadius, -Math.PI * 0.08, Math.PI * 0.08);
    ctx.stroke();
  }
}
