import { describe, expect, it } from "vitest";
import { hasAnyPolicy, isShopClosed, MIN_POLICY_LENGTH } from "@/lib/policies";

const body = (n = MIN_POLICY_LENGTH) => ({ body: "x".repeat(n), updatedAt: "2026-11-08" });

describe("a shop needs at least one policy page to open", () => {
  it("is closed with no policies at all", () => {
    expect(hasAnyPolicy({})).toBe(false);
    expect(isShopClosed({ isClosed: false })).toBe(true);
  });

  it("is closed when the only policy is too short to be real", () => {
    expect(isShopClosed({ policies: { terms: body(MIN_POLICY_LENGTH - 1) } })).toBe(true);
  });

  it("opens with one real policy", () => {
    expect(hasAnyPolicy({ policies: { privacy: body() } })).toBe(true);
    expect(isShopClosed({ policies: { privacy: body() } })).toBe(false);
  });

  it("stays closed when the seller switched it off, policies or not", () => {
    expect(isShopClosed({ isClosed: true, policies: { terms: body(), returns: body(), shipping: body(), privacy: body() } })).toBe(true);
  });
});
