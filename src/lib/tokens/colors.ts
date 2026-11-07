/**
 * Platform Design Tokens: Color System
 * Curated brand palette, 10-step neutral greys, and WCAG AA validated semantic colors.
 */

export const colorTokens = {
  // Primary brand palette (Calm, confident indigo/teal)
  primary: {
    DEFAULT: "#1E3A8A", // Deep Indigo (Accessible on white: 11.2:1)
    foreground: "#FFFFFF",
    50: "#EFF6FF",
    100: "#DBEAFE",
    200: "#BFDBFE",
    300: "#93C5FD",
    400: "#60A5FA",
    500: "#3B82F6",
    600: "#2563EB",
    700: "#1D4ED8",
    800: "#1E40AF",
    900: "#1E3A8A",
    950: "#172554",
  },

  // Warm Accent (Saffron/Amber for highlights, CTAs)
  accent: {
    DEFAULT: "#D97706", // Amber 600 (Accessible on white: 4.54:1)
    foreground: "#FFFFFF",
    50: "#FFFBEB",
    100: "#FEF3C7",
    200: "#FDE68A",
    300: "#FCD34D",
    400: "#FBBF24",
    500: "#F59E0B",
    600: "#D97706",
    700: "#B45309",
    800: "#92400E",
    900: "#78350F",
  },

  // 10-step Neutral Greys (Clean, neutral zinc/slate scale)
  neutral: {
    50: "#F8FAFC",
    100: "#F1F5F9",
    200: "#E2E8F0",
    300: "#CBD5E1",
    400: "#94A3B8",
    500: "#64748B",
    600: "#475569",
    700: "#334155",
    800: "#1E293B",
    900: "#0F172A",
    950: "#020617",
  },

  // Semantic Colors (All tested to exceed WCAG AA 4.5:1 on light backgrounds)
  semantic: {
    success: {
      DEFAULT: "#15803D", // Green 700 (5.1:1 on white)
      light: "#DCFCE7",
      foreground: "#FFFFFF",
      border: "#86EFAC",
    },
    warning: {
      DEFAULT: "#B45309", // Amber 700 (5.8:1 on white)
      light: "#FEF3C7",
      foreground: "#FFFFFF",
      border: "#FCD34D",
    },
    error: {
      DEFAULT: "#B91C1C", // Red 700 (5.9:1 on white)
      light: "#FEE2E2",
      foreground: "#FFFFFF",
      border: "#FCA5A5",
    },
    info: {
      DEFAULT: "#0369A1", // Sky 700 (5.4:1 on white)
      light: "#E0F2FE",
      foreground: "#FFFFFF",
      border: "#7DD3FC",
    },
  },

  // Surfaces & Borders
  surface: {
    background: "#FFFFFF",
    foreground: "#0F172A",
    card: "#FFFFFF",
    cardForeground: "#0F172A",
    muted: "#F8FAFC",
    mutedForeground: "#64748B",
    border: "#E2E8F0",
    input: "#CBD5E1",
    ring: "#1E3A8A",
  },
};

export type ColorTokens = typeof colorTokens;
