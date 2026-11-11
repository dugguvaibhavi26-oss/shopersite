import { describe, expect, it } from "vitest";
import { checkoutRulesOf, cleanPincodes, codBlockedReason, detailsProblem } from "@/lib/checkout-rules";
import { quoteOnlineOrder, QuoteError } from "@/lib/payments/cashfree-core";
import type { ProductData, StoreData } from "@/lib/store-service";

const product = (over: Partial<ProductData> = {}): ProductData => ({
  id: "p1",
  storeId: "s1",
  title: "Classic Tee",
  slug: "classic-tee",
  description: "",
  price: 69900,
  stock: 20,
  category: "Tops",
  images: [],
  status: "published",
  createdAt: "2026-01-01T00:00:00.000Z",
  ...over,
});
const store = (over: Partial<StoreData> = {}) => ({ id: "s1", subdomain: "demo", products: [product()], discounts: [], checkoutRules: {}, ...over }) as unknown as StoreData;

describe("checkout settings", () => {
  it("keeps today's checkout when nothing is set", () => {
    const r = checkoutRulesOf(store());
    expect(r.landmark).toBe("hidden");
    expect(r.altPhone).toBe("hidden");
    expect(r.marketingOptIn).toBe(false);
    expect(r.codPincodes).toEqual([]);
    expect(r.thankYou).toBe("");
  });

  it("cleans the PIN code list", () => {
    expect(cleanPincodes("110001, 400001 110001; 12345 abc 012345")).toEqual(["110001", "400001"]);
    expect(cleanPincodes(["560001", 560002])).toEqual(["560001", "560002"]);
    expect(cleanPincodes(undefined)).toEqual([]);
  });

  it("checks the landmark and second phone by the seller's rules", () => {
    const s = store({ checkoutRules: { landmark: "required", altPhone: "required" } });
    expect(detailsProblem(s, {})).toMatch(/landmark/i);
    expect(detailsProblem(s, { landmark: "Near the temple" })).toMatch(/another phone/i);
    expect(detailsProblem(s, { landmark: "Near the temple", altPhone: "12345" })).toMatch(/10-digit/);
    expect(detailsProblem(s, { landmark: "Near the temple", altPhone: "9876543210", phone: "9876543210" })).toMatch(/different/);
    expect(detailsProblem(s, { landmark: "Near the temple", altPhone: "+91 98765 43211", phone: "9876543210" })).toBe("");
    // optional fields may be left out
    expect(detailsProblem(store({ checkoutRules: { landmark: "optional", altPhone: "optional" } }), {})).toBe("");
  });

  it("blocks cash on delivery for chosen PIN codes and online-only products, only when online payment exists", () => {
    const s = store({ products: [product(), product({ id: "p2", title: "Gold ring", codBlocked: true })], checkoutRules: { codPincodes: ["110001"] } });
    expect(codBlockedReason(s, { productIds: ["p1"], pincode: "110001" })).toMatch(/110001/);
    expect(codBlockedReason(s, { productIds: ["p1", "p2"], pincode: "400001" })).toMatch(/Gold ring/);
    expect(codBlockedReason(s, { productIds: ["p1"], pincode: "400001" })).toBe("");
    // without online payment, cash on delivery is the only way to pay, so it stays open
    expect(codBlockedReason(s, { productIds: ["p2"], pincode: "110001" }, false)).toBe("");
  });

  it("refuses more than the most per order, across sizes of the same product", () => {
    const s = store({ products: [product({ maxPerOrder: 2 })] });
    expect(() => quoteOnlineOrder(s, [{ productId: "p1", quantity: 3 }])).toThrow(QuoteError);
    expect(() => quoteOnlineOrder(s, [{ productId: "p1", quantity: 1, variantName: "S" }, { productId: "p1", quantity: 2, variantName: "M" }])).toThrow(/up to 2/);
    expect(quoteOnlineOrder(s, [{ productId: "p1", quantity: 2 }]).items[0].quantity).toBe(2);
  });
});
