// @vitest-environment node
import { describe, it, expect, afterEach } from "vitest";
import { isValidUpiId, storeService } from "@/lib/store-service";
import { siteConfig } from "@/lib/config/site";

// Runs the settings clean-up without saving anywhere (no Firestore writes in tests)
const apply = (saved: unknown) => (storeService as unknown as { applyPlatformPayment: (s: unknown) => void }).applyPlatformPayment(saved);

describe("platform payment UPI IDs", () => {
  afterEach(() => apply(null));

  it("defaults to the configured UPI ID", () => {
    expect(siteConfig.platformUpiId).toBe(process.env.NEXT_PUBLIC_PLATFORM_UPI_ID || "anumula.sridhar@ybl");
    expect(storeService.getPlatformPayment().upiId).toBe(siteConfig.platformUpiId);
    expect(storeService.getPlatformPaymentSettings().accounts).toHaveLength(1);
  });

  it("accepts real UPI IDs and rejects anything else", () => {
    for (const ok of ["anumula.sridhar@ybl", "shop-name_1@okaxis", "9876543210@paytm"]) expect(isValidUpiId(ok)).toBe(true);
    for (const bad of ["", "no-at-sign", "name@", "@ybl", "name@ybl extra", "name@1bank"]) expect(isValidUpiId(bad)).toBe(false);
  });

  it("keeps several UPI IDs and pays to the one in use", () => {
    apply({
      accounts: [
        { upiId: "first@ybl", payeeName: "shopersite" },
        { upiId: "second@okaxis", payeeName: "shopersite payments" },
        { upiId: "FIRST@ybl", payeeName: "duplicate" },
        { upiId: "not a upi", payeeName: "bad" },
      ],
      activeUpiId: "second@okaxis",
    });
    const settings = storeService.getPlatformPaymentSettings();
    expect(settings.accounts.map((a) => a.upiId)).toEqual(["first@ybl", "second@okaxis"]);
    expect(storeService.getPlatformPayment()).toEqual({ upiId: "second@okaxis", payeeName: "shopersite payments" });
  });

  it("falls back to the first UPI ID when the one in use is gone, and reads the older single-ID shape", () => {
    apply({ accounts: [{ upiId: "only@ybl", payeeName: "x" }], activeUpiId: "removed@ybl" });
    expect(storeService.getPlatformPayment().upiId).toBe("only@ybl");
    apply({ upiId: "older@paytm", payeeName: "older" });
    expect(storeService.getPlatformPayment()).toEqual({ upiId: "older@paytm", payeeName: "older" });
  });
});
