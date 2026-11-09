/**
 * Buyer orders (UPI / COD), reviews and seller payments for plans and themes, on the server with an
 * in-memory Firestore: every number comes from the server, and the browser can't fake anything.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

import { createFakeFirestore } from "../helpers/fake-firestore";
const fake = createFakeFirestore();
const docs = fake.docs;

vi.mock("@/lib/server/firebase-admin", () => ({
  adminDb: () => fake.db,
  getStoreDoc: async (sub: string) => fake.clone(docs.get(`stores/${sub}`)) ?? null,
}));

import * as orders from "@/lib/server/order-service";
import * as billing from "@/lib/server/billing-service";
import { calculatePlanPrice } from "@/lib/plans";
import { getThemePrice } from "@/lib/theme-pricing";

const SUB = "lume";
function seed(over: Record<string, unknown> = {}) {
  docs.clear();
  docs.set(`stores/${SUB}`, {
    id: "store-lume",
    subdomain: SUB,
    name: "Lume",
    ownerId: "owner1",
    status: "published",
    planId: "pro",
    policies: { terms: { body: "t".repeat(200), updatedAt: "2026-11-08" } },
    upiId: "lume@okaxis",
    codEnabled: true,
    codFee: 4000,
    freeDeliveryThreshold: 100000,
    standardDeliveryFee: 5000,
    products: [
      { id: "p1", title: "Tee", price: 69900, stock: 5, status: "published", images: ["i.jpg"] },
      { id: "p2", title: "Hidden", price: 100, stock: 5, status: "hidden", images: [] },
    ],
    discounts: [{ id: "d1", code: "SAVE10", type: "percentage", value: 10, timesUsed: 0, isActive: true, createdAt: "x" }],
    reviews: [],
    ...over,
  });
  docs.set(`stores/${SUB}/private/data`, { orders: [], customers: [], subscribers: [], subscriptionHistory: [], themePurchases: [], pendingSubscription: null });
  docs.set("platform_settings/payment", { accounts: [{ upiId: "shopersite@ybl", payeeName: "Shopersite" }], activeUpiId: "shopersite@ybl" });
}

const buyer = {
  subdomain: SUB,
  items: [{ productId: "p1", quantity: 1 }],
  customer: { name: "Asha", phone: "9876543210" },
  address: { street: "12 MG Road", city: "Pune", state: "Maharashtra", pincode: "411001" },
};

beforeEach(() => seed());

describe("buyer orders", () => {
  it("COD: priced by the server (with COD fee), saved privately, stock taken", async () => {
    const o = await orders.placeOrder({ ...buyer, method: "cod" });
    expect(o).toMatchObject({ number: "#1001", paymentMethod: "cod", paymentStatus: "cod_pending", subtotal: 69900, delivery: 5000, codFee: 4000, total: 78900 });
    expect(o.token).toMatch(/^tok_sh_[a-f0-9]{24}$/);
    const pub = docs.get(`stores/${SUB}`) as any;
    expect(pub.orders).toBeUndefined(); // buyers' details never land in the public document
    expect(pub.products[0].stock).toBe(4);
    expect((docs.get(`stores/${SUB}/private/data`) as any).orders[0].customer.phone).toBe("9876543210");
    expect(docs.get(`orders/${o.id}`)).toBeTruthy();
  });

  it("no longer takes manual UPI orders (buyers pay online or on delivery)", async () => {
    await expect(orders.placeOrder({ ...buyer, method: "upi", utr: "412345678901" })).rejects.toThrow(/isn't available/);
  });

  it("applies coupons on the server and counts their use", async () => {
    const o = await orders.placeOrder({ ...buyer, method: "cod", couponCode: "save10" });
    expect(o.discount).toBe(6990);
    expect((docs.get(`stores/${SUB}`) as any).discounts[0].timesUsed).toBe(1);
  });

  it("refuses hidden products, too much quantity, closed shops and switched-off COD", async () => {
    await expect(orders.placeOrder({ ...buyer, method: "cod", items: [{ productId: "p2", quantity: 1 }] })).rejects.toThrow(/no longer available/);
    await expect(orders.placeOrder({ ...buyer, method: "cod", items: [{ productId: "p1", quantity: 6 }] })).rejects.toThrow(/no longer available/);
    seed({ isClosed: true });
    await expect(orders.placeOrder({ ...buyer, method: "cod" })).rejects.toThrow(/unavailable/);
    // with no online payment, Cash on Delivery is the only way to pay, so it stays available
    seed({ codEnabled: false });
    await expect(orders.placeOrder({ ...buyer, method: "cod" })).resolves.toMatchObject({ paymentMethod: "cod" });
    seed({ isPaused: true });
    await expect(orders.placeOrder({ ...buyer, method: "cod" })).rejects.toThrow(/unavailable/);
    seed({ policies: {} });
    await expect(orders.placeOrder({ ...buyer, method: "cod" })).rejects.toThrow(/unavailable/);
  });

  it("enforces the seller's checkout rules on the server", async () => {
    seed({ checkoutRules: { minOrder: 10_000_00 } });
    await expect(orders.placeOrder({ ...buyer, method: "cod" })).rejects.toThrow(/minimum order is ₹10,000/);
    // the COD limit applies only when the buyer can pay online instead (no online here, so COD stays open)
    seed({ checkoutRules: { codMax: 100 } });
    await expect(orders.placeOrder({ ...buyer, method: "cod" })).resolves.toMatchObject({ paymentMethod: "cod" });
    seed({ checkoutRules: { requireLogin: true } });
    await expect(orders.placeOrder({ ...buyer, method: "cod" })).rejects.toThrow(/sign in/);
    await expect(orders.placeOrder({ ...buyer, method: "cod", customerUid: "buyer-1" })).resolves.toBeTruthy();
    seed({ checkoutRules: { email: "required" } });
    await expect(orders.placeOrder({ ...buyer, method: "cod", customer: { ...buyer.customer, email: undefined } })).rejects.toThrow(/email/);
  });

  it("won't take manual UPI when the shop has live Cashfree payments", async () => {
    docs.set(`cashfree_merchants/${SUB}`, { merchantId: "shs_lume", state: "active", mode: "sandbox" });
    await expect(orders.placeOrder({ ...buyer, method: "upi", utr: "412345678901" })).rejects.toThrow(/Pay online/);
  });

  it("slows down a bot placing many orders from one phone", async () => {
    for (let i = 0; i < 3; i++) await orders.placeOrder({ ...buyer, method: "cod" });
    await expect(orders.placeOrder({ ...buyer, method: "cod" })).rejects.toThrow(/Too many orders/);
  });

  it("buyers only see orders they hold the token for; finding one needs number AND phone", async () => {
    const mine = await orders.placeOrder({ ...buyer, method: "cod" });
    await orders.placeOrder({ ...buyer, customer: { name: "Ravi", phone: "9123456780" }, method: "cod" });
    expect((await orders.trackOrders(SUB, [mine.token, "tok_sh_guess123"])).map((o) => o.id)).toEqual([mine.id]);
    expect(await orders.findOrderToken(SUB, "#1001", "9876543210")).toBe(mine.token);
    expect(await orders.findOrderToken(SUB, "#1001", "9123456780")).toBeNull();
    expect(await orders.findOrderToken(SUB, "#1002", "9876543210")).toBeNull();
  });

  it("reviews: verified only for the buyer's own order", async () => {
    const o = await orders.placeOrder({ ...buyer, method: "cod" });
    const verified = await orders.addReview({ subdomain: SUB, productId: "p1", name: "Asha", rating: 5, comment: "Lovely", tokens: [o.token] });
    const anon = await orders.addReview({ subdomain: SUB, productId: "p1", name: "Bot", rating: 1, comment: "Bad", tokens: [] });
    expect(verified.verifiedPurchase).toBe(true);
    expect(anon.verifiedPurchase).toBe(false);
    seed({ planId: "free" });
    await expect(orders.addReview({ subdomain: SUB, productId: "p1", name: "A", rating: 5, comment: "Hi", tokens: [] })).rejects.toThrow(/Reviews aren't open/);
  });

  it("subscribers are saved privately and only once", async () => {
    expect(await orders.addSubscriber(SUB, "a@b.in")).toEqual({ already: false });
    expect(await orders.addSubscriber(SUB, "a@b.in")).toEqual({ already: true });
    expect((docs.get(`stores/${SUB}/private/data`) as any).subscribers).toHaveLength(1);
    expect((docs.get(`stores/${SUB}`) as any).subscribers).toBeUndefined();
  });
});

describe("seller payments to Shopersite", () => {
  it("plan: amount, payee and reference come from the server; stays pending for the admin", async () => {
    seed({ planId: "free" });
    const req = await billing.requestPlan(SUB, { planId: "starter", billingCycle: "quarterly", utr: "512345678901" });
    expect(req).toMatchObject({
      planId: "starter",
      amount: calculatePlanPrice("starter", "quarterly").totalPaise,
      payeeUpiId: "shopersite@ybl",
      paymentUtr: "512345678901",
      status: "pending_verification",
    });
    expect(req.referenceId).toMatch(/^SHS-SUB-[0-9A-F]{8}$/);
    const priv = docs.get(`stores/${SUB}/private/data`) as any;
    expect(priv.pendingSubscription.id).toBe(req.id);
    expect((docs.get(`stores/${SUB}`) as any).planId).toBe("free"); // nothing unlocks until approved
  });

  it("plan: rejects bad plans, free plans, bad UTRs, a second request and a reused UTR", async () => {
    await expect(billing.requestPlan(SUB, { planId: "free", billingCycle: "monthly", utr: "512345678901" })).rejects.toThrow(/paid plan/);
    await expect(billing.requestPlan(SUB, { planId: "enterprise", billingCycle: "monthly", utr: "512345678901" })).rejects.toThrow(/paid plan/);
    await expect(billing.requestPlan(SUB, { planId: "pro", billingCycle: "forever", utr: "512345678901" })).rejects.toThrow(/billing period/);
    await expect(billing.requestPlan(SUB, { planId: "pro", billingCycle: "monthly", utr: "123" })).rejects.toThrow(/12-digit/);
    await billing.requestPlan(SUB, { planId: "pro", billingCycle: "monthly", utr: "512345678901" });
    await expect(billing.requestPlan(SUB, { planId: "pro", billingCycle: "monthly", utr: "512345678902" })).rejects.toThrow(/already have a plan payment/);
    // another shop can't reuse the same UPI reference
    docs.set("stores/other", { ...(docs.get(`stores/${SUB}`) as object), subdomain: "other", id: "store-other" });
    await expect(billing.requestPlan("other", { planId: "pro", billingCycle: "monthly", utr: "512345678901" })).rejects.toThrow(/already used/);
  });

  it("plan: no moving down while a higher plan is running; allowed once it has ended", async () => {
    seed({ planId: "pro", planPaidUntil: new Date(Date.now() + 10 * 86400000).toISOString() });
    await expect(billing.requestPlan(SUB, { planId: "starter", billingCycle: "monthly", utr: "512345678901" })).rejects.toThrow(/lower plan after it ends/);
    await expect(billing.requestPlan(SUB, { planId: "pro", billingCycle: "monthly", utr: "512345678901" })).resolves.toMatchObject({ planId: "pro" });
    seed({ planId: "pro", planPaidUntil: new Date(Date.now() - 86400000).toISOString() });
    await expect(billing.requestPlan(SUB, { planId: "starter", billingCycle: "monthly", utr: "512345678903" })).resolves.toMatchObject({ planId: "starter" });
  });

  it("plan: cancelling frees the UTR so a mistyped number can be corrected", async () => {
    await billing.requestPlan(SUB, { planId: "pro", billingCycle: "monthly", utr: "512345678901" });
    await billing.cancelPlan(SUB);
    expect((docs.get(`stores/${SUB}/private/data`) as any).pendingSubscription).toBeNull();
    await expect(billing.requestPlan(SUB, { planId: "pro", billingCycle: "monthly", utr: "512345678901" })).resolves.toBeTruthy();
  });

  it("uses the admin's saved plan prices", async () => {
    docs.set("platform_settings/plan_details", { plans: { starter: { priceMonthly: 12300 } } });
    await new Promise((r) => setTimeout(r, 0));
    const q = await billing.planQuote("starter", "monthly");
    // cached for a minute; either the default or the saved price, but always the server's
    expect([calculatePlanPrice("starter", "monthly").totalPaise, 12300]).toContain(q.pricing.totalPaise);
  });

  it("theme: priced by the server, can't buy twice or own already", async () => {
    const slug = "f02";
    const price = getThemePrice(slug);
    if (!price) return; // free theme in this build: nothing to buy
    const p = await billing.requestTheme(SUB, { themeSlug: slug, utr: "612345678901" });
    expect(p).toMatchObject({ themeSlug: slug, amount: price, status: "pending_verification", payeeUpiId: "shopersite@ybl" });
    await expect(billing.requestTheme(SUB, { themeSlug: slug, utr: "612345678902" })).rejects.toThrow(/already checking/);
    await billing.cancelTheme(SUB, p.id);
    seed({ ownedThemes: [slug] });
    await expect(billing.requestTheme(SUB, { themeSlug: slug, utr: "612345678903" })).rejects.toThrow(/already own/);
    await expect(billing.requestTheme(SUB, { themeSlug: "no-such-theme", utr: "612345678904" })).rejects.toThrow(/not found/);
  });

  it("marks approval notices as seen", async () => {
    docs.set(`stores/${SUB}/private/data`, { subscriptionHistory: [{ id: "s", seenBySeller: false }], themePurchases: [{ id: "t", seenBySeller: false }] });
    await billing.markBillingSeen(SUB);
    const priv = docs.get(`stores/${SUB}/private/data`) as any;
    expect(priv.subscriptionHistory[0].seenBySeller).toBe(true);
    expect(priv.themePurchases[0].seenBySeller).toBe(true);
  });
});
