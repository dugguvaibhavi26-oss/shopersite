import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { siteConfig, getStoreDomain, getStoreSubdomainFromHost, resolveStoreUrl } from "@/lib/config/site";

describe("Configuration & Security Settings", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("loads placeholder defaults for brand name and domain", () => {
    expect(siteConfig.name).toBe("shopersite");
    expect(siteConfig.domain).toBe("shopersite.in");
    expect(siteConfig.currency).toBe("INR");
    expect(siteConfig.maxStorefrontJsKb).toBe(150);
  });

  it("gives every store its own subdomain of the company domain", () => {
    expect(getStoreDomain("roxten")).toBe("roxten.shopersite.in");
  });

  it("opens stores on their subdomain, or by path where *.shopersite.in isn't connected", () => {
    expect(resolveStoreUrl("roxten", "", "https://shopersite.in/dashboard")).toBe("https://roxten.shopersite.in");
    expect(resolveStoreUrl("roxten", "/products/tee", "https://www.shopersite.in/")).toBe("https://roxten.shopersite.in/products/tee");
    expect(resolveStoreUrl("roxten", "", "http://localhost:3000/dashboard")).toBe("http://roxten.localhost:3000");
    expect(resolveStoreUrl("roxten", "?view=cart", "http://localhost:3000")).toBe("http://roxten.localhost:3000?view=cart");
    expect(resolveStoreUrl("roxten", "", "https://rox-shop-g4jaczx9k.vercel.app/dashboard")).toBe("/s/roxten");
  });

  it("only treats subdomains of the company domain (or localhost) as stores", () => {
    expect(getStoreSubdomainFromHost("roxten.shopersite.in")).toBe("roxten");
    expect(getStoreSubdomainFromHost("roxten.localhost:3000")).toBe("roxten");
    expect(getStoreSubdomainFromHost("shopersite.in")).toBeNull();
    expect(getStoreSubdomainFromHost("www.shopersite.in")).toBeNull();
    expect(getStoreSubdomainFromHost("localhost:3000")).toBeNull();
    expect(getStoreSubdomainFromHost("rox-shop-g4jaczx9k-vaibhavis-projects-2f394d05.vercel.app")).toBeNull();
  });

  it("crashes startup if ALLOW_DEV_MOCK_OTP is enabled in production", async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    process.env.ALLOW_DEV_MOCK_OTP = "true";

    await expect(async () => {
      // Re-importing site config dynamically to simulate app boot
      await import("@/lib/config/site");
    }).rejects.toThrow(/FATAL CONFIGURATION ERROR/);
  });
});
