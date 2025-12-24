// File: src/components/visualizers/flowfieldPatterns/renderRays.ts

import type { FlowFieldPatternContext } from "./types";

export function renderRays(
  p: FlowFieldPatternContext,
  audioIntensity: number,
  bassIntensity: number,
  trebleIntensity: number,
): void {
  const ctx = p.ctx;

  // HYPER-OPTIMIZATION: Much cheaper rays (faster “buildup”, fewer allocations)
  // - Dynamic ray count (LOD) to avoid 7x gradient-layering per ray
  // - Replace offset+gradient loop with 2-pass glow/core stroke
  // - Central glow drawn as a circle (not a full-canvas fillRect)
  const twoPi = p.TWO_PI;
  const baseRayCount = p.rayCount ?? 60;
  const countScale = 0.65 + audioIntensity * 0.55 + bassIntensity * 0.55;
  let rayCount = (baseRayCount * countScale) | 0;
  if (rayCount < 24) rayCount = 24;
  if (rayCount > 120) rayCount = 120;
  const invRayCount = 1 / rayCount;
  const angleStep = twoPi * invRayCount;

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.translate(p.centerX, p.centerY);
  ctx.lineCap = "round";

  const timeWave1 = p.time * 0.001;
  const timeWave2 = p.time * 0.01;
  const timeWave3 = p.time * 0.005;
  const timeHue = p.time * 0.05;
  const minDimension = Math.min(p.width, p.height);

  const rayLengthBase = minDimension * (0.55 + audioIntensity * 0.55);
  const rayWidth = 1.6 + trebleIntensity * 4.5;
  const glowWidth = rayWidth * (2.1 + audioIntensity * 0.6);
  const glowBlur = 10 + trebleIntensity * 22 + audioIntensity * 10;
  const hueStep = 360 * invRayCount;

  // Faster perceived buildup: higher baseline alpha even at low audio
  const alphaBase = 0.22 + audioIntensity * 0.35;
  const coreAlpha = 0.35 + audioIntensity * 0.45;

  for (let i = 0; i < rayCount; i++) {
    const spiralAngle = timeWave1 + i * 0.1;
    const pulseAngle = timeWave2 + i * 0.2;
    const angle = angleStep * i + timeWave3 + p.fastSin(spiralAngle) * 0.18;
    const pulseEffect = 1 + p.fastSin(pulseAngle) * 0.12;
    const rayLength = rayLengthBase * pulseEffect;

    const endX = p.fastCos(angle) * rayLength;
    const endY = p.fastSin(angle) * rayLength;

    const hue = p.fastMod360(p.hueBase + i * hueStep + timeHue);

    // Glow pass
    ctx.shadowBlur = glowBlur;
    ctx.shadowColor = p.hsla(hue, 100, 55, alphaBase * 0.9);
    ctx.strokeStyle = p.hsla(hue, 100, 55, alphaBase * 0.35);
    ctx.lineWidth = glowWidth;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // Core pass
    ctx.shadowBlur = 0;
    ctx.strokeStyle = p.hsla(hue, 95, 72, coreAlpha);
    ctx.lineWidth = rayWidth;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(endX, endY);
    ctx.stroke();
  }

  // Central glow (circle, not full-canvas fill)
  const glowRadius = 90 + bassIntensity * 110;
  const glowGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, glowRadius);
  glowGradient.addColorStop(
    0,
    p.hsla(p.hueBase, 100, 80, 0.35 + audioIntensity * 0.25),
  );
  glowGradient.addColorStop(
    0.55,
    p.hsla(p.hueBase, 90, 60, 0.18 + audioIntensity * 0.15),
  );
  glowGradient.addColorStop(1, p.hsla(p.hueBase, 80, 40, 0));

  ctx.fillStyle = glowGradient;
  ctx.beginPath();
  ctx.arc(0, 0, glowRadius, 0, twoPi);
  ctx.fill();

  ctx.restore();
}

