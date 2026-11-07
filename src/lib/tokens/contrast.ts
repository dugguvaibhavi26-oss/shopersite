/**
 * WCAG 2.2 AA Contrast Calculation Utility
 * Evaluates contrast ratio between text and background colors according to W3C specifications.
 */

// Convert hex to RGB [r, g, b] (0-255)
export function hexToRgb(hex: string): [number, number, number] {
  let cleanHex = hex.replace("#", "").trim();
  if (cleanHex.length === 3) {
    cleanHex = cleanHex
      .split("")
      .map((char) => char + char)
      .join("");
  }
  if (cleanHex.length !== 6) {
    return [0, 0, 0];
  }
  const num = parseInt(cleanHex, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

// Calculate sRGB relative luminance according to WCAG 2.2
export function getRelativeLuminance(rgb: [number, number, number]): number {
  const [r, g, b] = rgb.map((val) => {
    const s = val / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// Calculate contrast ratio between two hex colors (returns 1.0 to 21.0)
export function getContrastRatio(foregroundHex: string, backgroundHex: string): number {
  const rgb1 = hexToRgb(foregroundHex);
  const rgb2 = hexToRgb(backgroundHex);
  const l1 = getRelativeLuminance(rgb1);
  const l2 = getRelativeLuminance(rgb2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return Number(((lighter + 0.05) / (darker + 0.05)).toFixed(2));
}

export interface ContrastResult {
  ratio: number;
  isNormalTextPass: boolean; // >= 4.5:1 (WCAG AA for body text)
  isLargeTextPass: boolean;  // >= 3.0:1 (WCAG AA for large text >= 18pt or bold >= 14pt)
  isUiComponentPass: boolean;// >= 3.0:1 (WCAG AA for graphical objects and UI components)
  level: "AAA" | "AA" | "Fail";
}

export function evaluateContrast(foregroundHex: string, backgroundHex: string): ContrastResult {
  const ratio = getContrastRatio(foregroundHex, backgroundHex);
  const isNormalTextPass = ratio >= 4.5;
  const isLargeTextPass = ratio >= 3.0;
  const isUiComponentPass = ratio >= 3.0;

  let level: "AAA" | "AA" | "Fail" = "Fail";
  if (ratio >= 7.0) {
    level = "AAA";
  } else if (ratio >= 4.5) {
    level = "AA";
  }

  return {
    ratio,
    isNormalTextPass,
    isLargeTextPass,
    isUiComponentPass,
    level,
  };
}
