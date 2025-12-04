// File: src/components/visualizers/utils/MathUtils.ts

export class MathUtils {
  // Fast inverse square root (Quake III algorithm)
  static fastInvSqrt(x: number): number {
    const threehalfs = 1.5;
    const x2 = x * 0.5;
    const i = new Float32Array([x]);
    const view = new Int32Array(i.buffer);
    view[0] = 0x5f3759df - (view[0]! >> 1);
    let y = new Float32Array(view.buffer)[0]!;
    y = y * (threehalfs - x2 * y * y);
    return y;
  }

  // Golden ratio
  static readonly PHI = (1 + Math.sqrt(5)) / 2;

  // Map value from one range to another
  static map(
    value: number,
    start1: number,
    stop1: number,
    start2: number,
    stop2: number,
  ): number {
    return start2 + (stop2 - start2) * ((value - start1) / (stop1 - start1));
  }

  // Constrain value between min and max
  static constrain(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }

  // Smooth step interpolation
  static smoothstep(edge0: number, edge1: number, x: number): number {
    const t = MathUtils.constrain((x - edge0) / (edge1 - edge0), 0, 1);
    return t * t * (3 - 2 * t);
  }

  // Generate fibonacci spiral point
  static fibonacciSpiralPoint(
    index: number,
    total: number,
    radius: number,
  ): { x: number; y: number } {
    const angle = index * MathUtils.PHI * Math.PI * 2;
    const r = radius * Math.sqrt(index / total);
    return {
      x: r * Math.cos(angle),
      y: r * Math.sin(angle),
    };
  }

  // XOR pattern for glitch effects
  static xorPattern(x: number, y: number, time: number): number {
    const ix = Math.floor(x) & 0xff;
    const iy = Math.floor(y) & 0xff;
    const it = Math.floor(time) & 0xff;
    return (ix ^ iy ^ it) / 255;
  }

  // Mandelbrot iteration
  static mandelbrot(cx: number, cy: number, maxIterations: number): number {
    let x = 0,
      y = 0;
    let iteration = 0;

    while (x * x + y * y <= 4 && iteration < maxIterations) {
      const xtemp = x * x - y * y + cx;
      y = 2 * x * y + cy;
      x = xtemp;
      iteration++;
    }

    return iteration / maxIterations;
  }

  // Plasma effect
  static plasma(x: number, y: number, time: number): number {
    const value =
      Math.sin(x * 0.05 + time) +
      Math.sin(y * 0.05 + time) +
      Math.sin((x + y) * 0.05 + time) +
      Math.sin(Math.sqrt(x * x + y * y) * 0.05 + time);
    return (value + 4) / 8;
  }

  // Voronoi cell distance
  static voronoi(
    x: number,
    y: number,
    points: Array<{ x: number; y: number }>,
  ): { distance: number; index: number } {
    let minDist = Infinity;
    let minIndex = 0;

    for (let i = 0; i < points.length; i++) {
      const p = points[i]!;
      const dist = Math.sqrt((x - p.x) ** 2 + (y - p.y) ** 2);
      if (dist < minDist) {
        minDist = dist;
        minIndex = i;
      }
    }

    return { distance: minDist, index: minIndex };
  }

  // Chromatic aberration offset
  static chromaticAberration(
    angle: number,
    strength: number,
  ): {
    r: { x: number; y: number };
    g: { x: number; y: number };
    b: { x: number; y: number };
  } {
    return {
      r: { x: Math.cos(angle) * strength, y: Math.sin(angle) * strength },
      g: { x: 0, y: 0 },
      b: { x: -Math.cos(angle) * strength, y: -Math.sin(angle) * strength },
    };
  }

  // Simplex-style noise using bitwise ops
  static simpleNoise(x: number, y: number): number {
    const n = Math.floor(x) + Math.floor(y) * 57;
    const nn = (n << 13) ^ n;
    return (
      1.0 -
      ((nn * (nn * nn * 15731 + 789221) + 1376312589) & 0x7fffffff) /
        1073741824.0
    );
  }

  // Lissajous curve
  static lissajous(
    t: number,
    a: number,
    b: number,
    delta: number,
  ): { x: number; y: number } {
    return {
      x: Math.sin(a * t + delta),
      y: Math.sin(b * t),
    };
  }

  // Metaball field strength
  static metaball(
    x: number,
    y: number,
    balls: Array<{ x: number; y: number; radius: number }>,
  ): number {
    let sum = 0;
    for (const ball of balls) {
      const dx = x - ball.x;
      const dy = y - ball.y;
      const distSq = dx * dx + dy * dy;
      if (distSq > 0) {
        sum += (ball.radius * ball.radius) / distSq;
      }
    }
    return sum;
  }

  // HSL to RGB with bitmagic
  static hslToRgb(
    h: number,
    s: number,
    l: number,
  ): { r: number; g: number; b: number } {
    h = h % 360;
    s = MathUtils.constrain(s, 0, 100) / 100;
    l = MathUtils.constrain(l, 0, 100) / 100;

    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;

    let r = 0,
      g = 0,
      b = 0;

    if (h < 60) {
      r = c;
      g = x;
      b = 0;
    } else if (h < 120) {
      r = x;
      g = c;
      b = 0;
    } else if (h < 180) {
      r = 0;
      g = c;
      b = x;
    } else if (h < 240) {
      r = 0;
      g = x;
      b = c;
    } else if (h < 300) {
      r = x;
      g = 0;
      b = c;
    } else {
      r = c;
      g = 0;
      b = x;
    }

    return {
      r: Math.floor((r + m) * 255),
      g: Math.floor((g + m) * 255),
      b: Math.floor((b + m) * 255),
    };
  }
}
