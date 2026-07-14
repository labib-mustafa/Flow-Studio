/**
 * ACCESSIBILITY APPROACH:
 * 1. WCAG 2.1 Compliance: We target a minimum contrast ratio of 4.5:1 for normal text (Level AA).
 * 2. Smart Text Selection: The engine automatically calculates the relative luminance of the background
 *    and selects either black (#000000) or white (#FFFFFF) to maximize contrast.
 * 3. Perceptual Uniformity: We use HSL color space to generate shades, ensuring consistent hue
 *    while varying lightness to create a balanced palette.
 * 4. Fallback Logic: If neither black nor white meets the 4.5:1 threshold, we pick the one with 
 *    the highest contrast ratio to ensure the best possible readability.
 */

/**
 * Utility functions for color manipulation and WCAG accessibility checks.
 */

/**
 * Converts a hex color to RGB.
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/**
 * Converts RGB to hex.
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

/**
 * Calculates the relative luminance of a color.
 * Formula: 0.2126 * R + 0.7152 * G + 0.0722 * B
 */
export function getLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;

  const a = [rgb.r, rgb.g, rgb.b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

/**
 * Calculates the contrast ratio between two colors.
 * Formula: (L1 + 0.05) / (L2 + 0.05)
 */
export function getContrastRatio(color1: string, color2: string): number {
  const l1 = getLuminance(color1);
  const l2 = getLuminance(color2);
  const brightest = Math.max(l1, l2);
  const darkest = Math.min(l1, l2);
  return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * Returns the best readable text color (black or white) for a given background color,
 * with adaptive lightness and text shadow if contrast is insufficient.
 * Ensures WCAG 2.1 compliance (ratio >= 4.5:1).
 */
export function getReadableTextColor(bgHex: string): { color: string; contrast: number; textShadow: string } {
  // Convert HEX to RGB
  const hex = bgHex.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  // Convert to linear RGB
  const toLinear = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

  const R = toLinear(r);
  const G = toLinear(g);
  const B = toLinear(b);

  // Calculate luminance
  const luminance = 0.2126 * R + 0.7152 * G + 0.0722 * B;

  // Contrast ratio function
  const contrast = (l1: number, l2: number) => {
    const [bright, dark] = l1 > l2 ? [l1, l2] : [l2, l1];
    return (bright + 0.05) / (dark + 0.05);
  };

  const whiteContrast = contrast(1, luminance);
  const blackContrast = contrast(0, luminance);

  // Pick best of black or white first
  let textColor = whiteContrast > blackContrast ? '#FFFFFF' : '#000000';
  let bestContrast = Math.max(whiteContrast, blackContrast);

  // If contrast is insufficient, generate adaptive color
  if (bestContrast < 4.5) {
    // Adjust lightness dynamically
    const adjust = (val: number, amount: number) =>
      Math.min(1, Math.max(0, val + amount));

    let step = luminance > 0.5 ? -0.1 : 0.1;
    let newL = luminance;

    while (bestContrast < 4.5 && Math.abs(newL) <= 1) {
      newL = adjust(newL, step);

      const newContrast = contrast(newL, luminance);
      if (newContrast > bestContrast) {
        bestContrast = newContrast;
        const gray = Math.round(newL * 255);
        textColor = `rgb(${gray}, ${gray}, ${gray})`;
      } else {
        break;
      }
    }
  }

  return {
    color: textColor,
    contrast: bestContrast,
    textShadow:
      bestContrast < 4.5
        ? textColor === '#FFFFFF'
          ? '0 1px 2px rgba(0,0,0,0.3)'
          : '0 1px 2px rgba(255,255,255,0.3)'
        : 'none',
  };
}

/**
 * Ensures a text color has enough contrast against a background.
 * If not, it returns a more readable version of the text color or black/white.
 */
export function ensureContrast(textColor: string, bgColor: string, minRatio: number = 4.5): string {
  const ratio = getContrastRatio(textColor, bgColor);
  if (ratio >= minRatio) return textColor;

  // If it doesn't pass, try black or white as they are the extremes
  const whiteContrast = getContrastRatio(bgColor, "#FFFFFF");
  const blackContrast = getContrastRatio(bgColor, "#000000");

  if (whiteContrast >= minRatio && whiteContrast >= blackContrast) return "#FFFFFF";
  if (blackContrast >= minRatio) return "#000000";

  return whiteContrast > blackContrast ? "#FFFFFF" : "#000000";
}

/**
 * Creates a highlight color pair with accessibility info.
 */
export function createHighlightColor(bgColor: string): {
  bg: string;
  text: string;
  contrast: number;
} {
  const readableText = getReadableTextColor(bgColor);
  const contrast = getContrastRatio(bgColor, readableText.color);

  // If contrast is still too low, we might need to adjust the background slightly
  // but for now we follow the requirement of choosing the best text color.
  return {
    bg: bgColor,
    text: readableText.color,
    contrast: parseFloat(contrast.toFixed(2))
  };
}

/**
 * Generates a color scale of 9 accessible shades from a base color.
 * We use HSL for easier manipulation.
 */
export function generateColorScale(baseColor: string): Array<{ bg: string; text: string; contrast: number }> {
  const rgb = hexToRgb(baseColor);
  if (!rgb) return [];

  // Convert to HSL
  let r = rgb.r / 255, g = rgb.g / 255, b = rgb.b / 255;
  let max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    let d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  const shades: Array<{ bg: string; text: string; contrast: number }> = [];
  
  // Generate 9 shades by varying lightness
  // From very light (95%) to strong (30%)
  const lightnesses = [0.96, 0.92, 0.85, 0.75, 0.65, 0.55, 0.45, 0.35, 0.25];

  lightnesses.forEach(targetL => {
    const rgb = hslToRgb(h, s, targetL);
    const bg = rgbToHex(rgb.r, rgb.g, rgb.b);
    shades.push(createHighlightColor(bg));
  });

  return shades;
}

export function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h, s, l };
}

export function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  };
}

/**
 * Converts an RGB or RGBA string to hex.
 */
export function rgbToHexStr(rgb: string): string | null {
  const match = rgb.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/);
  if (!match) return null;
  const r = parseInt(match[1], 10);
  const g = parseInt(match[2], 10);
  const b = parseInt(match[3], 10);
  return rgbToHex(r, g, b);
}

function hue2rgb(p: number, q: number, t: number): number {
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1 / 6) return p + (q - p) * 6 * t;
  if (t < 1 / 2) return q;
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
  return p;
}
