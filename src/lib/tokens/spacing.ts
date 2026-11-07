/**
 * Platform Design Tokens: Spacing, Radii, Shadows & Touch Targets
 * Built on a strict 4px grid with >= 44x44px touch targets.
 */

export const spacingTokens = {
  // 4px grid scale
  grid: 4,
  touchTargetMin: "44px", // Minimum 44x44px mobile touch target

  // Corner radius tokens (8, 12, 16, and full)
  radius: {
    sm: "8px",
    md: "12px",
    lg: "16px",
    full: "9999px",
  },

  // Soft layered shadows
  shadows: {
    sm: "0 1px 2px 0 rgba(15, 23, 42, 0.05)",
    md: "0 4px 6px -1px rgba(15, 23, 42, 0.08), 0 2px 4px -2px rgba(15, 23, 42, 0.05)",
    lg: "0 10px 15px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -4px rgba(15, 23, 42, 0.04)",
    card: "0 1px 3px 0 rgba(15, 23, 42, 0.06), 0 1px 2px -1px rgba(15, 23, 42, 0.06)",
  },

  // Transitions: 150-250ms purposeful transitions
  transitions: {
    fast: "150ms cubic-bezier(0.4, 0, 0.2, 1)",
    standard: "200ms cubic-bezier(0.4, 0, 0.2, 1)",
    sheet: "250ms cubic-bezier(0.16, 1, 0.3, 1)",
  },
};
