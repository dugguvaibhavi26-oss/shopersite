import { describe, it, expect } from "vitest";
import { createHmac } from "node:crypto";
import {
  applyPaidOrder,
  merchantIdFor,
  merchantStateFrom,
  quoteOnlineOrder,
  QuoteError,
  toPaise,
  toRupees,
  verifyCashfreeSignature,
  type PendingOrder,
} from "@/lib/payments/cashfree-core";
import type { DiscountData, ProductData, StoreData } from "@/lib/store-service";

const product = (over: Partial<ProductData> = {}): ProductData => ({
  id: "p1",
  storeId: "s1",
  title: "Classic Tee",
  slug: "classic-tee",
  description: "",
  price: 69900,
  stock: 5,
  category: "Tops",
  images: ["https://img/tee.jpg"],
  status: "published",
  createdAt: "2026-01-01T00:00:00.000Z",
  ...over,
});

const coupon = (over: Partial<DiscountData> = {}): DiscountData => ({
  id: "d1",
  code: "SAVE10",
  type: "percentage",
  value: 10,
  timesUsed: 0,
  isActive: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  ...over,
});

const store = (over: Partial<StoreData> = {}) =>
  ({
    products: [product(), product({ id: "p2", title: "Cap", price: 30000, stock: 1 })],
    discounts: [coupon()],
    planId: "pro",
    freeDeliveryThreshold: 100000,
    standardDeliveryFee: 5000,
    orders: [],
    customers: [],
    ...over,
  }) as unknown as StoreData;

describe("Cashfree merchant (seller account) status", () => {
  it("is active only when Cashfree approved the payment gateway KYC", () => {
    const base = { merchant_id: "shs_lume", onboarding_status: "Email Verified" };
    expect(merchantStateFrom({ ...base, product_status: [{ product_name: "PG", product_min_kyc_status: "MIN_KYC_APPROVED" }] })).toBe("active");
    expect(merchantStateFrom({ ...base, product_status: [{ product_name: "Payment Gateway", product_min_kyc_status: "MIN_KYC_SUBMITTED" }] })).toBe("in_review");
    expect(merchantStateFrom({ ...base, product_status: [{ product_name: "PG", product_min_kyc_status: "MIN_KYC_REJECTED" }] })).toBe("rejected");
    expect(merchantStateFrom({ ...base, product_status: [{ product_name: "PG", product_min_kyc_status: "MIN_KYC_PENDING" }] })).toBe("kyc_pending");
    expect(merchantStateFrom({ ...base, product_status: [] })).toBe("kyc_pending");
  });

  it("ignores approval of some other Cashfree product", () => {
    const res = {
      merchant_id: "shs_lume",
      product_status: [
        { product_name: "Payouts", product_min_kyc_status: "MIN_KYC_APPROVED" },
        { product_name: "PG", product_min_kyc_status: "MIN_KYC_SUBMITTED" },
      ],
    };
    expect(merchantStateFrom(res)).toBe("in_review");
  });

  it("treats a suspended account as not able to take payments, and no account as not started", () => {
    expect(merchantStateFrom({ merchant_id: "x", onboarding_status: "SUSPENDED", product_status: [{ product_name: "PG", product_min_kyc_status: "MIN_KYC_APPROVED" }] })).toBe("suspended");
    expect(merchantStateFrom(null)).toBe("not_started");
  });

  it("makes a valid, stable Cashfree merchant_id (≤ 40 chars, letters/digits/-/_)", () => {
    expect(merchantIdFor("lume")).toBe("shs_lume");
    const long = merchantIdFor("a-very-long-store-name-that-goes-on-and-on-and-on");
    expect(long.length).toBeLessThanOrEqual(40);
    expect(long).toMatch(/^[A-Za-z0-9_-]+$/);
  });
});

describe("online order pricing (server side)", () => {
  it("prices from the store's saved products, not from the browser", () => {
    const q = quoteOnlineOrder(store(), [{ productId: "p1", quantity: 2 }]);
    expect(q.items[0]).toMatchObject({ productId: "p1", price: 69900, quantity: 2, title: "Classic Tee", image: "https://img/tee.jpg" });
    expect(q.subtotal).toBe(139800);
    expect(q.delivery).toBe(0); // over the ₹1,000 free delivery threshold
    expect(q.total).toBe(139800);
  });

  it("adds delivery under the threshold and never a COD fee", () => {
    const q = quoteOnlineOrder(store({ codFee: 4000 } as Partial<StoreData>), [{ productId: "p1", quantity: 1 }]);
    expect(q.delivery).toBe(5000);
    expect(q.total).toBe(69900 + 5000);
  });

  it("applies a valid coupon the same way checkout does", () => {
    const q = quoteOnlineOrder(store(), [{ productId: "p1", quantity: 2 }], "save10");
    expect(q.discount).toBe(13980);
    expect(q.total).toBe(139800 - 13980);
    expect(q.couponId).toBe("d1");
  });

  it("ignores a coupon that isn't valid", () => {
    const q = quoteOnlineOrder(store(), [{ productId: "p1", quantity: 2 }], "NOPE");
    expect(q.discount).toBe(0);
    expect(q.couponId).toBeUndefined();
  });

  it("refuses hidden products, missing products, bad quantities and too little stock", () => {
    expect(() => quoteOnlineOrder(store({ products: [product({ status: "hidden" })] }), [{ productId: "p1", quantity: 1 }])).toThrow(QuoteError);
    expect(() => quoteOnlineOrder(store(), [{ productId: "nope", quantity: 1 }])).toThrow(QuoteError);
    expect(() => quoteOnlineOrder(store(), [{ productId: "p1", quantity: 0 }])).toThrow(QuoteError);
    expect(() => quoteOnlineOrder(store(), [{ productId: "p1", quantity: 1.5 }])).toThrow(QuoteError);
    expect(() => quoteOnlineOrder(store(), [{ productId: "p2", quantity: 2 }])).toThrow(QuoteError);
    expect(() => quoteOnlineOrder(store(), [])).toThrow(QuoteError);
  });

  it("checks stock across the same product in two sizes", () => {
    expect(() =>
      quoteOnlineOrder(store(), [
        { productId: "p1", quantity: 3, variantName: "S" },
        { productId: "p1", quantity: 3, variantName: "M" },
      ])
    ).toThrow(QuoteError);
  });

  it("converts amounts between paise and Cashfree's rupees without float drift", () => {
    expect(toRupees(129999)).toBe(1299.99);
    expect(toPaise(1299.99)).toBe(129999);
    expect(toPaise("170.00")).toBe(17000);
    expect(toPaise(0.1 + 0.2)).toBe(30);
  });
});

describe("recording a paid online order", () => {
  const pending: PendingOrder = {
    id: "ord_abc",
    storeId: "s1",
    token: "tok_sh_abc",
    customer: { name: "Asha", phone: "9876543210" },
    address: { street: "12 MG Road", city: "Pune", state: "Maharashtra", pincode: "411001" },
    items: [{ productId: "p1", title: "Classic Tee", image: "", quantity: 2, price: 69900 }],
    subtotal: 139800,
    discount: 13980,
    delivery: 0,
    codFee: 0,
    total: 125820,
    paymentMethod: "cashfree",
    fulfilmentStatus: "placed",
    createdAt: "2026-11-07T10:00:00.000Z",
    updatedAt: "2026-11-07T10:00:00.000Z",
  };

  it("adds the order as paid, numbers it, takes stock, counts the coupon and the customer", () => {
    const s = store({ orders: [{ id: "old" } as never] });
    const r = applyPaidOrder(s, pending, { cfPaymentId: "885", paidAt: "2026-11-07T10:01:00.000Z", couponId: "d1" })!;
    expect(r.order).toMatchObject({ number: "#1002", paymentMethod: "cashfree", paymentStatus: "paid", cfPaymentId: "885", paymentUtr: "885" });
    expect(r.changes.orders[0].id).toBe("ord_abc");
    expect(r.changes.orders).toHaveLength(2);
    expect(r.changes.products.find((p) => p.id === "p1")!.stock).toBe(3);
    expect(r.changes.discounts![0].timesUsed).toBe(1);
    expect(r.changes.customers[0]).toMatchObject({ phone: "9876543210", totalOrders: 1, totalSpent: 125820 });
  });

  it("is safe to run twice (a webhook and the buyer's return can both arrive)", () => {
    const first = applyPaidOrder(store(), pending, { paidAt: "t" })!;
    const again = applyPaidOrder({ ...store(), ...first.changes }, pending, { paidAt: "t" });
    expect(again).toBeNull();
  });

  it("still records the order if stock ran out meanwhile, with a note for the seller", () => {
    const r = applyPaidOrder(store({ products: [product({ stock: 1 })] }), pending, { paidAt: "t" })!;
    expect(r.changes.products[0].stock).toBe(0);
    expect(r.order.notes).toMatch(/stock ran out/i);
  });
});

describe("Cashfree webhook signatures", () => {
  const key = "partner_key_123";
  const body = '{"type":"PAYMENT_SUCCESS_WEBHOOK","data":{"order":{"order_amount":170.00}}}';
  const ts = "1730966400";
  const sign = (msg: string) => createHmac("sha256", key).update(msg).digest("base64");

  it("accepts Base64(HMAC-SHA256(timestamp + rawBody)) with or without a dot", () => {
    expect(verifyCashfreeSignature(body, ts, sign(ts + body), [key])).toBe(true);
    expect(verifyCashfreeSignature(body, ts, sign(`${ts}.${body}`), [key])).toBe(true);
  });

  it("rejects a wrong key, a changed body, or missing headers", () => {
    expect(verifyCashfreeSignature(body, ts, sign(ts + body), ["other"])).toBe(false);
    expect(verifyCashfreeSignature(body.replace("170.00", "1.00"), ts, sign(ts + body), [key])).toBe(false);
    expect(verifyCashfreeSignature(body, null, sign(ts + body), [key])).toBe(false);
    expect(verifyCashfreeSignature(body, ts, null, [key])).toBe(false);
    expect(verifyCashfreeSignature(body, ts, sign(ts + body), [""])).toBe(false);
  });
});
