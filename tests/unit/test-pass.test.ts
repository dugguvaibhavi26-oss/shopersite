import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const ownerCheck = vi.fn(async () => false);
vi.mock("@/lib/server/firebase-admin", () => ({ isStoreOwnerRequest: (...a: unknown[]) => ownerCheck(...(a as [])) }));

let mod: typeof import("@/lib/server/test-pass");
beforeAll(async () => {
  process.env.EMAIL_SECRET_KEY = Buffer.alloc(32, 7).toString("base64");
  mod = await import("@/lib/server/test-pass");
});

const req = (pass?: string) => new Request("https://x.test/", { headers: pass ? { "x-shop-test-pass": pass } : {} });
const store = (subdomain: string) => ({ subdomain }) as never;

describe("shop test pass", () => {
  it("accepts a fresh pass for its own shop", async () => {
    const pass = mod.makeTestPass("twillloox");
    expect(mod.readTestPass(pass, "twillloox")).toBe(true);
    expect(await mod.canUseTestPayments(req(pass), store("twillloox"))).toBe(true);
  });

  it("rejects a pass for another shop", async () => {
    const pass = mod.makeTestPass("roxten");
    expect(await mod.canUseTestPayments(req(pass), store("twillloox"))).toBe(false);
  });

  it("rejects a tampered pass", () => {
    const [payload, sig] = mod.makeTestPass("twillloox").split(".");
    const other = Buffer.from(JSON.stringify({ k: "rztest", s: "twillloox", e: Date.now() + 9e9 })).toString("base64url");
    expect(mod.readTestPass(`${other}.${sig}`, "twillloox")).toBe(false);
    expect(mod.readTestPass(`${payload}.${sig.slice(0, -2)}xx`, "twillloox")).toBe(false);
    expect(mod.readTestPass("garbage", "twillloox")).toBe(false);
  });

  it("rejects an expired pass", () => {
    vi.useFakeTimers();
    const pass = mod.makeTestPass("twillloox");
    vi.advanceTimersByTime(2 * 60 * 60 * 1000 + 1);
    expect(mod.readTestPass(pass, "twillloox")).toBe(false);
    vi.useRealTimers();
  });

  it("still lets the signed-in owner in without a pass", async () => {
    ownerCheck.mockResolvedValueOnce(true);
    expect(await mod.canUseTestPayments(req(), store("twillloox"))).toBe(true);
    expect(await mod.canUseTestPayments(req(), store("twillloox"))).toBe(false);
  });
});
