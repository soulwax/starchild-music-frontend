// File: src/utils/colorExtractor.ts

/**
 * Extract dominant colors from an image for visualizer theming
 */

export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  hue: number;
  saturation: number;
  lightness: number;
}

/**
 * Extracts dominant colors from an image URL
 * Uses canvas to sample pixels and calculate average color
 */
export async function extractColorsFromImage(
  imageUrl: string,
): Promise<ColorPalette> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";

    img.onload = () => {
      try {
        // Create canvas to sample image
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }

        // Resize to small size for faster processing
        const size = 50;
        canvas.width = size;
        canvas.height = size;

        // Draw image
        ctx.drawImage(img, 0, 0, size, size);

        // Get image data
        const imageData = ctx.getImageData(0, 0, size, size);
        const data = imageData.data;

        // Calculate average color (skip transparent pixels)
        let r = 0,
          g = 0,
          b = 0;
        let count = 0;
        const colorMap = new Map<string, number>();

        for (let i = 0; i < data.length; i += 4) {
          const alpha = data[i + 3] ?? 0;
          if (alpha > 128) {
            // Only count opaque pixels
            const red = data[i] ?? 0;
            const green = data[i + 1] ?? 0;
            const blue = data[i + 2] ?? 0;

            r += red;
            g += green;
            b += blue;
            count++;

            // Track color frequency for dominant color
            const colorKey = `${Math.floor(red / 32)},${Math.floor(green / 32)},${Math.floor(blue / 32)}`;
            colorMap.set(colorKey, (colorMap.get(colorKey) ?? 0) + 1);
          }
        }

        if (count === 0) {
          // Default to purple/blue if no colors found
          resolve({
            primary: "rgba(138, 43, 226, 0.8)",
            secondary: "rgba(99, 102, 241, 0.8)",
            accent: "rgba(59, 130, 246, 0.8)",
            hue: 260,
            saturation: 70,
            lightness: 50,
          });
          return;
        }

        // Average color
        r = Math.floor(r / count);
        g = Math.floor(g / count);
        b = Math.floor(b / count);

        // Convert to HSL
        const hsl = rgbToHsl(r, g, b);

        // Create color palette based on dominant color
        const primary = `rgba(${r}, ${g}, ${b}, 0.8)`;
        const secondary = `hsla(${(hsl.h + 30) % 360}, ${hsl.s}%, ${Math.min(hsl.l + 10, 70)}%, 0.8)`;
        const accent = `hsla(${(hsl.h + 60) % 360}, ${hsl.s}%, ${Math.min(hsl.l + 20, 80)}%, 0.8)`;

        resolve({
          primary,
          secondary,
          accent,
          hue: hsl.h,
          saturation: hsl.s,
          lightness: hsl.l,
        });
      } catch (error) {
        console.error("Error extracting colors:", error);
        // Fallback to default colors
        resolve({
          primary: "rgba(138, 43, 226, 0.8)",
          secondary: "rgba(99, 102, 241, 0.8)",
          accent: "rgba(59, 130, 246, 0.8)",
          hue: 260,
          saturation: 70,
          lightness: 50,
        });
      }
    };

    img.onerror = () => {
      console.error("Failed to load image for color extraction");
      // Fallback to default colors
      resolve({
        primary: "rgba(138, 43, 226, 0.8)",
        secondary: "rgba(99, 102, 241, 0.8)",
        accent: "rgba(59, 130, 246, 0.8)",
        hue: 260,
        saturation: 70,
        lightness: 50,
      });
    };

    img.src = imageUrl;
  });
}

/**
 * Convert RGB to HSL
 */
function rgbToHsl(
  r: number,
  g: number,
  b: number,
): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * Create a gradient from color palette
 */
export function createGradientFromPalette(
  ctx: CanvasRenderingContext2D,
  palette: ColorPalette,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): CanvasGradient {
  const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
  gradient.addColorStop(0, palette.primary);
  gradient.addColorStop(0.5, palette.secondary);
  gradient.addColorStop(1, palette.accent);
  return gradient;
}
