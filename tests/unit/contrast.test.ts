import { describe, it, expect } from "vitest";
import {
  hexToRgb,
  getRelativeLuminance,
  getContrastRatio,
  evaluateContrast,
} from "@/lib/tokens/contrast";
import { colorTokens } from "@/lib/tokens/colors";

describe("WCAG 2.2 AA Contrast Evaluator", () => {
  it("converts hex to RGB correctly", () => {
    expect(hexToRgb("#FFFFFF")).toEqual([255, 255, 255]);
    expect(hexToRgb("#000000")).toEqual([0, 0, 0]);
    expect(hexToRgb("#1E3A8A")).toEqual([30, 58, 138]);
    expect(hexToRgb("#FFF")).toEqual([255, 255, 255]);
  });

  it("calculates relative luminance accurately", () => {
    expect(getRelativeLuminance([255, 255, 255])).toBeCloseTo(1.0, 2);
    expect(getRelativeLuminance([0, 0, 0])).toBeCloseTo(0.0, 2);
  });

  it("calculates contrast ratios accurately", () => {
    // Black and white is 21:1
    const bwRatio = getContrastRatio("#000000", "#FFFFFF");
    expect(bwRatio).toBe(21);

    // Deep Indigo (#1E3A8A) on White (#FFFFFF) exceeds 11:1
    const primaryRatio = getContrastRatio("#1E3A8A", "#FFFFFF");
    expect(primaryRatio).toBeGreaterThan(10);
  });

  it("passes WCAG AA for platform primary brand color on white", () => {
    const result = evaluateContrast(colorTokens.primary.DEFAULT, "#FFFFFF");
    expect(result.isNormalTextPass).toBe(true);
    expect(result.isLargeTextPass).toBe(true);
    expect(result.ratio).toBeGreaterThanOrEqual(4.5);
  });

  it("passes WCAG AA for semantic colors (success, error, warning) on light backgrounds", () => {
    const successResult = evaluateContrast(colorTokens.semantic.success.DEFAULT, "#FFFFFF");
    expect(successResult.isNormalTextPass).toBe(true);
    expect(successResult.ratio).toBeGreaterThanOrEqual(4.5);

    const errorResult = evaluateContrast(colorTokens.semantic.error.DEFAULT, "#FFFFFF");
    expect(errorResult.isNormalTextPass).toBe(true);
    expect(errorResult.ratio).toBeGreaterThanOrEqual(4.5);

    const warningResult = evaluateContrast(colorTokens.semantic.warning.DEFAULT, "#FFFFFF");
    expect(warningResult.isNormalTextPass).toBe(true);
    expect(warningResult.ratio).toBeGreaterThanOrEqual(4.5);
  });

  it("detects low contrast pairs and fails WCAG AA correctly", () => {
    // Light slate (#94A3B8) on white is ~2.4:1 (fails WCAG AA body text)
    const failResult = evaluateContrast("#94A3B8", "#FFFFFF");
    expect(failResult.isNormalTextPass).toBe(false);
    expect(failResult.level).toBe("Fail");
  });
});
