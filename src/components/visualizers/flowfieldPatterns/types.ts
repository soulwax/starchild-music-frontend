// File: src/components/visualizers/flowfieldPatterns/types.ts

export interface FlowFieldPatternContext {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
  time: number;
  hueBase: number;

  // Constants
  TWO_PI: number;

  // Hot helpers (typically backed by lookup tables + caches in FlowFieldRenderer)
  fastSin: (angle: number) => number;
  fastCos: (angle: number) => number;
  fastSqrt: (x: number) => number;
  fastMod360: (x: number) => number;
  hsla: (h: number, s: number, l: number, a: number) => string;

  // Optional per-pattern params (extend as patterns get extracted)
  rayCount?: number;
  kaleidoscopeSegments?: number;
  kaleidoscopeRotationSpeed?: number;
  kaleidoscopeParticleDensity?: number;
  kaleidoscopeColorShift?: number;
}

