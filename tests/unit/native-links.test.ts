import { describe, it, expect } from "vitest";
import { classifyLink, isRootPath } from "@/lib/native/links";
import { isNativeApp, getNativePlatform } from "@/lib/native/platform";

const here = "https://shopersite-app.vercel.app/dashboard?store=roxtenn";

describe("classifyLink (mobile app link routing)", () => {
  it("hands phone, mail and UPI links to the phone", () => {
    expect(classifyLink("tel:+919876543210", here)).toEqual({ kind: "system", url: "tel:+919876543210" });
    expect(classifyLink("mailto:a@b.in", here)?.kind).toBe("system");
    expect(classifyLink("upi://pay?pa=seller@ybl&am=299", here)?.kind).toBe("system");
  });

  it("opens WhatsApp links in the WhatsApp app", () => {
    expect(classifyLink("https://wa.me/919876543210", here, "_blank")?.kind).toBe("system");
    expect(classifyLink("https://api.whatsapp.com/send?text=hi", here)?.kind).toBe("system");
  });

  it("opens other websites in the phone's browser", () => {
    expect(classifyLink("https://instagram.com/shop", here, "_blank")).toEqual({
      kind: "browser",
      url: "https://instagram.com/shop",
    });
  });

  it("opens the seller's own storefront in the phone's browser", () => {
    expect(classifyLink("/s/roxtenn", here, "_blank")).toEqual({
      kind: "browser",
      url: "https://shopersite-app.vercel.app/s/roxtenn",
    });
    expect(classifyLink("/orders/tok_1", here, "_blank")?.kind).toBe("browser");
  });

  it("loads other same-site new-tab links in place and leaves normal links alone", () => {
    expect(classifyLink("/gallery", here, "_blank")).toEqual({
      kind: "navigate",
      url: "https://shopersite-app.vercel.app/gallery",
    });
    expect(classifyLink("/s/roxtenn", here)).toBeNull();
    expect(classifyLink("/s/roxtenn", here, "_self")).toBeNull();
  });

  it("opens home-page sections (Pricing, FAQs...) in the phone's browser, not back into the app", () => {
    expect(classifyLink("/#pricing", here)).toEqual({ kind: "browser", url: "https://shopersite-app.vercel.app/#pricing" });
    expect(classifyLink("/", here, "_blank")?.kind).toBe("browser");
    expect(classifyLink("/", here)).toBeNull(); // logo links stay in the app
  });

  it("ignores anchors, javascript: and empty links", () => {
    expect(classifyLink("#top", here)).toBeNull();
    expect(classifyLink("javascript:void(0)", here)).toBeNull();
    expect(classifyLink("", here)).toBeNull();
    expect(classifyLink(null, here)).toBeNull();
  });
});

describe("isRootPath", () => {
  it("treats home screens as roots", () => {
    expect(isRootPath("/")).toBe(true);
    expect(isRootPath("/dashboard")).toBe(true);
    expect(isRootPath("/dashboard/")).toBe(true);
    expect(isRootPath("/admin")).toBe(true);
    expect(isRootPath("/login")).toBe(false);
    expect(isRootPath("/dashboard/products/new")).toBe(false);
  });
});

describe("native platform detection", () => {
  it("is off in a normal browser", () => {
    expect(isNativeApp()).toBe(false);
    expect(getNativePlatform()).toBe("web");
  });

  it("detects the app shell", () => {
    (window as any).Capacitor = { isNativePlatform: () => true, getPlatform: () => "android" };
    try {
      expect(isNativeApp()).toBe(true);
      expect(getNativePlatform()).toBe("android");
    } finally {
      delete (window as any).Capacitor;
    }
  });
});
