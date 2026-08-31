/**
 * Genuine Image Color Palette Extractor & Fallback Swatch Generator
 */

/**
 * Deterministic 32-bit integer string hashing function
 */
function hashString(str: string): number {
  let hash = 0;
  if (!str || str.length === 0) return 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Convert HSL to Hex color string
 */
function hslToHex(h: number, s: number, l: number): string {
  const sPct = s / 100;
  const lPct = l / 100;
  const a = sPct * Math.min(lPct, 1 - lPct);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = lPct - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

/**
 * Generates 5 distinct HSL color swatches derived deterministically from a hash of the image URL
 * when CORS or canvas load fails.
 */
export function generateFallbackPalette(url: string): string[] {
  const hash = hashString(url || 'default-image');
  const colors: string[] = [];
  for (let i = 0; i < 5; i++) {
    const hue = (hash + i * 72) % 360;
    const sat = 65 + ((hash + i * 13) % 25); // 65% - 90%
    const light = 40 + ((hash + i * 17) % 25); // 40% - 65%
    colors.push(hslToHex(hue, sat, light));
  }
  return colors;
}

/**
 * Converts RGB numbers to 6-character hex format #rrggbb
 */
function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((x) => Math.min(255, Math.max(0, x)).toString(16).padStart(2, '0')).join('');
}

/**
 * Quantizes RGB pixel array into 5 dominant, distinct hex colors
 */
function extractDominantColorsFromPixels(data: Uint8ClampedArray): string[] {
  const binMap = new Map<number, { rSum: number; gSum: number; bSum: number; count: number }>();

  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    if (a < 128) continue; // Skip semi-transparent / transparent pixels

    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Quantize 8-bit to 4-bit per channel (16^3 = 4096 bins)
    const qr = r >> 4;
    const qg = g >> 4;
    const qb = b >> 4;
    const binKey = (qr << 8) | (qg << 4) | qb;

    const existing = binMap.get(binKey);
    if (existing) {
      existing.rSum += r;
      existing.gSum += g;
      existing.bSum += b;
      existing.count += 1;
    } else {
      binMap.set(binKey, { rSum: r, gSum: g, bSum: b, count: 1 });
    }
  }

  const bins = Array.from(binMap.values()).map((b) => ({
    r: Math.round(b.rSum / b.count),
    g: Math.round(b.gSum / b.count),
    b: Math.round(b.bSum / b.count),
    count: b.count,
  }));

  bins.sort((a, b) => b.count - a.count);

  if (bins.length === 0) return [];

  const selected: { r: number; g: number; b: number }[] = [];
  const minDistanceSq = 35 * 35; // Minimum RGB Euclidean distance threshold

  for (const bin of bins) {
    if (selected.length >= 5) break;

    const isDistinct = selected.every((s) => {
      const dr = s.r - bin.r;
      const dg = s.g - bin.g;
      const db = s.b - bin.b;
      return dr * dr + dg * dg + db * db >= minDistanceSq;
    });

    if (isDistinct || selected.length === 0) {
      selected.push({ r: bin.r, g: bin.g, b: bin.b });
    }
  }

  // If fewer than 5 distinct colors, fill from remaining bins without minDistance restriction
  if (selected.length < 5) {
    for (const bin of bins) {
      if (selected.length >= 5) break;
      const exists = selected.some((s) => s.r === bin.r && s.g === bin.g && s.b === bin.b);
      if (!exists) {
        selected.push({ r: bin.r, g: bin.g, b: bin.b });
      }
    }
  }

  // If still under 5 (e.g. monochrome / solid image), generate lightness variations
  while (selected.length < 5 && selected.length > 0) {
    const base = selected[0];
    const step = selected.length;
    const factor = 1 + (step % 2 === 0 ? 0.25 : -0.25) * step;
    selected.push({
      r: Math.min(255, Math.max(0, Math.round(base.r * factor))),
      g: Math.min(255, Math.max(0, Math.round(base.g * factor))),
      b: Math.min(255, Math.max(0, Math.round(base.b * factor))),
    });
  }

  return selected.slice(0, 5).map((c) => rgbToHex(c.r, c.g, c.b));
}

/**
 * Loads an image from URL into an offscreen HTMLCanvasElement, reads pixel data,
 * and quantizes RGB values into 5 dominant hex colors. If blocked by CORS or load failure,
 * falls back gracefully to URL hash-derived HSL swatches.
 */
export function extractColorsFromImage(url: string): Promise<string[]> {
  return new Promise((resolve) => {
    if (!url || typeof window === 'undefined') {
      resolve(generateFallbackPalette(url || 'fallback'));
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    let isHandled = false;
    const timer = setTimeout(() => {
      if (!isHandled) {
        isHandled = true;
        resolve(generateFallbackPalette(url));
      }
    }, 3000);

    img.onload = () => {
      if (isHandled) return;
      isHandled = true;
      clearTimeout(timer);

      try {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(generateFallbackPalette(url));
          return;
        }

        ctx.drawImage(img, 0, 0, 64, 64);
        const imageData = ctx.getImageData(0, 0, 64, 64);
        const palette = extractDominantColorsFromPixels(imageData.data);

        if (palette && palette.length === 5) {
          resolve(palette);
        } else {
          resolve(generateFallbackPalette(url));
        }
      } catch {
        // Canvas security taint / CORS error during getImageData
        resolve(generateFallbackPalette(url));
      }
    };

    img.onerror = () => {
      if (isHandled) return;
      isHandled = true;
      clearTimeout(timer);
      resolve(generateFallbackPalette(url));
    };

    img.src = url;
  });
}
