import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/server/firebase-admin", () => ({ adminDb: () => ({}) }));

const { normalizeDomain, dnsRecordFor } = await import("@/lib/server/domain-service");

describe("custom domains", () => {
  it("cleans what sellers type", () => {
    expect(normalizeDomain("https://WWW.MyBrand.com/shop?x=1")).toBe("www.mybrand.com");
    expect(normalizeDomain("mybrand.in.")).toBe("mybrand.in");
  });

  it("refuses our own and junk domains", () => {
    expect(normalizeDomain("shop.shopersite.in")).toBeNull();
    expect(normalizeDomain("shopersite.in")).toBeNull();
    expect(normalizeDomain("x.vercel.app")).toBeNull();
    expect(normalizeDomain("not a domain")).toBeNull();
    expect(normalizeDomain("localhost")).toBeNull();
  });

  it("gives the right DNS record", () => {
    expect(dnsRecordFor("www.mybrand.com")).toEqual({ type: "CNAME", name: "www", value: "cname.vercel-dns.com" });
    expect(dnsRecordFor("mybrand.com")).toEqual({ type: "A", name: "@", value: "76.76.21.21" });
    expect(dnsRecordFor("mybrand.co.in").type).toBe("A");
  });
});
