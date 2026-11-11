import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { oauthModeFrom, otherModeFor } from "@/lib/server/razorpay";

describe("Razorpay one-click connect mode", () => {
  it("reads the Vercel setting the way people write it", () => {
    expect(oauthModeFrom("live")).toBe("live");
    expect(oauthModeFrom("Production")).toBe("live");
    expect(oauthModeFrom(" prod ")).toBe("live");
    expect(oauthModeFrom("test")).toBe("test");
    expect(oauthModeFrom("development")).toBe("test");
    expect(oauthModeFrom(undefined)).toBe("test");
  });

  it("switches to the mode Razorpay asks for, and only for a mode error", () => {
    expect(otherModeFor("Mode can be only set to live for production clients", "test")).toBe("live");
    expect(otherModeFor("Mode can be only set to test for development clients", "live")).toBe("test");
    expect(otherModeFor("Invalid client credentials", "test")).toBeNull();
    expect(otherModeFor("", "live")).toBeNull();
  });
});
