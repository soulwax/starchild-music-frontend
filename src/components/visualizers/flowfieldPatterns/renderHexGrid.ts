// File: src/components/visualizers/flowfieldPatterns/renderHexGrid.ts

import type { FlowFieldPatternContext } from "./types";

export function renderHexGrid(
  p: FlowFieldPatternContext,
  audioIntensity: number,
  bassIntensity: number,
  midIntensity: number,
): void {
  const ctx = p.ctx;

  const minDim = Math.min(p.width, p.height);
  const areaScale = (p.width * p.height) / (1280 * 720);
  const scaleClamp = areaScale < 1 ? 1 : Math.min(areaScale, 2.2);
  const hexSize = (28 + bassIntensity * 16) * Math.sqrt(scaleClamp);

  ctx.save();
  ctx.globalCompositeOperation = "lighter";

  const SQRT3 = 1.7320508075688772;
  const hexHeight = hexSize * SQRT3;
  const hexSize1_5 = hexSize * 1.5;
  const hexSize0_75 = hexSize * 0.75;
  const invHexHeight = 1 / hexHeight;
  const invHexSize1_5 = 1 / hexSize1_5;

  const timeWave = p.time * 0.05;
  const timeRotation = p.time * 0.001 * midIntensity;
  const distFreq = 0.02;
  const pi3 = Math.PI / 3;

  const maxRows = ((p.height * 0.9) * invHexHeight + 2) | 0;
  const maxCols = ((p.width * 0.9) * invHexSize1_5 + 2) | 0;

  const bassPi = bassIntensity * Math.PI;
  const maxRadius = minDim * 0.7;
  const maxRadiusSq = maxRadius * maxRadius;

  const baseLightness = 38;
  const lightnessRange = 42 + audioIntensity * 18;

  for (let row = -1; row < maxRows; row++) {
    const offsetX = (row & 1) * hexSize0_75;
    const y = row * hexHeight;

    for (let col = -1; col < maxCols; col++) {
      const x = col * hexSize1_5 + offsetX;

      const dx = x - p.centerX;
      const dy = y - p.centerY;
      const distSq = dx * dx + dy * dy;

      if (distSq > maxRadiusSq) continue;

      const dist = p.fastSqrt(distSq);

      const wave = p.fastSin(dist * distFreq - timeWave + bassPi) * 0.5 + 0.5;
      const hue = p.fastMod360(p.hueBase + dist * 0.28 + wave * 160);
      const lightness = baseLightness + wave * lightnessRange;

      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = pi3 * i + timeRotation;

        const hx = x + p.fastCos(angle) * hexSize;
        const hy = y + p.fastSin(angle) * hexSize;

        if (i === 0) {
          ctx.moveTo(hx, hy);
        } else {
          ctx.lineTo(hx, hy);
        }
      }
      ctx.closePath();

      ctx.strokeStyle = p.hsla(hue, 78, lightness, 0.45 + audioIntensity * 0.35);
      ctx.lineWidth = 1.5 + audioIntensity * 1.8;
      ctx.stroke();

      if (wave > 0.78) {
        ctx.fillStyle = p.hsla(hue, 88, lightness + 8, (wave - 0.5) * 0.5);
        ctx.fill();
      }
    }
  }

  ctx.restore();
}
