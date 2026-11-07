/**
 * Platform Design Tokens: Typography
 * Sans-serif UI scale, minimum 14px mobile body text, and Indic script fallbacks.
 */

export const typographyTokens = {
  fontFamily: {
    sans: [
      "Inter",
      "Plus Jakarta Sans",
      "-apple-system",
      "BlinkMacSystemFont",
      "'Segoe UI'",
      "Roboto",
      "'Noto Sans Devanagari'",
      "'Noto Sans Telugu'",
      "sans-serif",
    ],
    mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
  },

  // Defined scale: 12, 14, 16, 18, 20, 24, 30, 36, 48 px
  fontSize: {
    xs: ["0.75rem", { lineHeight: "1rem" }],      // 12px (captions/tags only)
    sm: ["0.875rem", { lineHeight: "1.25rem" }],  // 14px (minimum mobile body text)
    base: ["1rem", { lineHeight: "1.5rem" }],     // 16px (standard reading text)
    lg: ["1.125rem", { lineHeight: "1.75rem" }],  // 18px
    xl: ["1.25rem", { lineHeight: "1.75rem" }],   // 20px
    "2xl": ["1.5rem", { lineHeight: "2rem" }],     // 24px
    "3xl": ["1.875rem", { lineHeight: "2.25rem" }],// 30px
    "4xl": ["2.25rem", { lineHeight: "2.5rem" }],  // 36px
    "5xl": ["3rem", { lineHeight: "1" }],          // 48px
  },

  fontWeight: {
    normal: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
  },
};
