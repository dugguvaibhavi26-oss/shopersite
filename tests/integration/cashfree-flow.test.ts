/**
 * The whole server flow with an in-memory Firestore and a fake Cashfree:
 * seller onboarding → buyer payment → Cashfree confirms → order recorded once on the seller's store.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

// ----- in-memory Firestore ---------------------------------------------------------------------
import { createFakeFirestore } from "../helpers/fake-firestore";
const fake = createFakeFirestore();
const store = fake.docs;
const clone = fake.clone;

vi.mock("@/lib/server/firebase-admin", () => ({
  adminDb: () => fake.db,
  getStoreDoc: async (sub: string) => clone(store.get(`stores/${sub}`)) ?? null,
}));

// ----- fake Cashfree ---------------------------------------------------------------------------
const cf = vi.hoisted(() => ({
  createMerchant: vi.fn(),
  getMerchant: vi.fn(),
  createOnboardingLink: vi.fn(),
  createPgOrder: vi.fn(),
  getPgOrder: vi.fn(),
  getPgOrderPayments: vi.fn(),
}));
vi.mock("@/lib/server/cashfree", () => {
  class CashfreeError extends Error {
    constructor(public status: number, public code: string, message: string) {
      super(message);
    }
  }
  return { ...cf, CashfreeError, cashfreeConfig: () => ({ mode: "sandbox", partnerKey: "k" }) };
});

import * as svc from "@/lib/server/payment-service";
import { CashfreeError } from "@/lib/server/cashfree";

const SUB = "lume";
function seedStore() {
  store.set(`stores/${SUB}`, {
    id: "store-lume",
    subdomain: SUB,
    name: "Lume",
    status: "published",
    planId: "pro",
    freeDeliveryThreshold: 100000,
    standardDeliveryFee: 5000,
    codFee: 4000,
    products: [{ id: "p1", title: "Tee", price: 69900, stock: 5, status: "published", images: ["i.jpg"] }],
    discounts: [],
    orders: [],
    customers: [],
  });
}
const activeMerchant = () => ({
  merchant_id: "shs_lume",
  onboarding_status: "ACTIVE",
  product_status: [{ product_name: "PG", product_min_kyc_status: "MIN_KYC_APPROVED" }],
});
const buyer = {
  subdomain: SUB,
  items: [{ productId: "p1", quantity: 1 }],
  customer: { name: "Asha", phone: "9876543210" },
  address: { street: "12 MG Road", city: "Pune", state: "Maharashtra", pincode: "411001" },
  returnBase: "http://localhost:3000/s/lume/order/",
};

beforeEach(() => {
  store.clear();
  Object.values(cf).forEach((f) => f.mockReset());
  seedStore();
});

async function onboardActive() {
  cf.createMerchant.mockResolvedValue({ merchant_id: "shs_lume" });
  cf.getMerchant.mockResolvedValue(activeMerchant());
  const storeDoc = store.get(`stores/${SUB}`) as any;
  return svc.startOnboarding(storeDoc, "uid1", { email: "a@b.in", phone: "9876543210", businessName: "Lume" }, "http://localhost:3000");
}

describe("seller onboarding", () => {
  it("creates the seller's own Cashfree account once and returns the hosted KYC link", async () => {
    cf.createMerchant.mockResolvedValue({ merchant_id: "shs_lume" });
    cf.getMerchant.mockResolvedValue({ merchant_id: "shs_lume", product_status: [{ product_name: "PG", product_min_kyc_status: "MIN_KYC_PENDING" }] });
    cf.createOnboardingLink.mockResolvedValue({ onboarding_link: "https://cf/kyc" });
    const storeDoc = store.get(`stores/${SUB}`) as any;

    const r = await svc.startOnboarding(storeDoc, "uid1", { email: "A@B.in", phone: "+91 98765 43210", businessName: "Lume" }, "http://localhost:3000");
    expect(r).toEqual({ state: "kyc_pending", link: "https://cf/kyc", expiresAt: undefined });
    expect(cf.createMerchant).toHaveBeenCalledWith(
      expect.objectContaining({ merchant_id: "shs_lume", merchant_email: "a@b.in", poc_phone: "9876543210", merchant_site_url: "https://shopersite.in/s/lume" })
    );
    expect(cf.createOnboardingLink).toHaveBeenCalledWith("shs_lume", "http://localhost:3000/cashfree/return?store=lume");

    await svc.startOnboarding(storeDoc, "uid1", { email: "a@b.in", phone: "9876543210", businessName: "Lume" }, "http://localhost:3000");
    expect(cf.createMerchant).toHaveBeenCalledTimes(1);
  });

  it("sends the shop's built-in policy pages, and still creates the account if Cashfree refuses them", async () => {
    cf.createMerchant.mockResolvedValueOnce({ merchant_id: "shs_lume" });
    cf.getMerchant.mockResolvedValue({ merchant_id: "shs_lume", product_status: [] });
    cf.createOnboardingLink.mockResolvedValue({ onboarding_link: "x" });
    const storeDoc = store.get(`stores/${SUB}`) as any;
    await svc.startOnboarding(storeDoc, "u", { email: "a@b.in", phone: "9876543210", businessName: "Lume" }, "http://localhost:3000");
    expect(cf.createMerchant.mock.calls[0][0].website_details).toEqual({
      website_contact_us: "https://shopersite.in/s/lume/pages/contact",
      website_tnc: "https://shopersite.in/s/lume/pages/terms",
      website_privacy_policy: "https://shopersite.in/s/lume/pages/privacy",
      website_refund_policy: "https://shopersite.in/s/lume/pages/returns",
      website_shop_delivery: "https://shopersite.in/s/lume/pages/shipping",
    });

    // a fresh shop, and Cashfree rejects the links this time
    store.clear();
    seedStore();
    cf.createMerchant.mockReset();
    cf.createMerchant.mockRejectedValueOnce(new CashfreeError(400, "request_failed", "Invalid website_tnc")).mockResolvedValueOnce({ merchant_id: "shs_lume" });
    const r = await svc.startOnboarding(store.get(`stores/${SUB}`) as any, "u", { email: "a@b.in", phone: "9876543210", businessName: "Lume" }, "http://localhost:3000");
    expect(cf.createMerchant).toHaveBeenCalledTimes(2);
    expect(cf.createMerchant.mock.calls[1][0].website_details).toBeUndefined();
    expect(r.link).toBe("x");
  });

  it("explains when the email already has a Cashfree account", async () => {
    cf.createMerchant.mockRejectedValue(new CashfreeError(409, "merchant_already_exists", "exists"));
    cf.getMerchant.mockResolvedValue(null);
    const storeDoc = store.get(`stores/${SUB}`) as any;
    await expect(svc.startOnboarding(storeDoc, "uid1", { email: "a@b.in", phone: "9876543210", businessName: "Lume" }, "http://x")).rejects.toThrow(/already has a Cashfree account/);
  });

  it("returns no KYC link once the account is approved", async () => {
    expect(await onboardActive()).toEqual({ state: "active" });
    expect(cf.createOnboardingLink).not.toHaveBeenCalled();
  });
});

describe("buyer payment", () => {
  it("won't take online payment before the seller's KYC is approved", async () => {
    await expect(svc.createPayment(buyer, "http://localhost:3000")).rejects.toThrow(/isn't available/);
    cf.createMerchant.mockResolvedValue({});
    cf.getMerchant.mockResolvedValue({ merchant_id: "shs_lume", product_status: [{ product_name: "PG", product_min_kyc_status: "MIN_KYC_SUBMITTED" }] });
    cf.createOnboardingLink.mockResolvedValue({ onboarding_link: "x" });
    await svc.startOnboarding(store.get(`stores/${SUB}`) as any, "u", { email: "a@b.in", phone: "9876543210", businessName: "Lume" }, "http://x");
    await expect(svc.createPayment(buyer, "http://localhost:3000")).rejects.toThrow(/isn't available/);
  });

  it("charges the server's price on the seller's merchant account and records the order once when paid", async () => {
    await onboardActive();
    cf.createPgOrder.mockImplementation(async (_m: string, body: any) => ({ order_id: body.order_id, order_amount: body.order_amount, order_currency: "INR", order_status: "ACTIVE", payment_session_id: "sess_1" }));

    const started = await svc.createPayment(buyer, "http://localhost:3000");
    const [merchantId, body] = cf.createPgOrder.mock.calls[0];
    expect(merchantId).toBe("shs_lume"); // the SELLER's account, so Cashfree settles to the seller
    expect(body.order_amount).toBe(749); // ₹699 + ₹50 delivery, no COD fee
    expect(body.order_meta.return_url).toBe(`http://localhost:3000/s/lume/order/${started.token}?placed=1`);
    expect(body.order_meta.notify_url).toBeUndefined(); // http origin: Cashfree needs https
    expect(started).toMatchObject({ paymentSessionId: "sess_1", mode: "sandbox", total: 74900 });
    expect((store.get(`payments/${started.orderId}`) as any).status).toBe("PENDING");
    expect((fake.storeView(SUB) as any).orders).toHaveLength(0); // not an order until paid

    // buyer back before paying
    cf.getPgOrder.mockResolvedValue({ order_id: started.orderId, order_amount: 749, order_currency: "INR", order_status: "ACTIVE" });
    cf.getPgOrderPayments.mockResolvedValue([{ payment_status: "FAILED" }]);
    expect(await svc.verifyPayment(started.orderId)).toEqual({ status: "pending", paymentSessionId: "sess_1", mode: "sandbox", lastAttemptFailed: true });

    // paid
    cf.getPgOrder.mockResolvedValue({ order_id: started.orderId, order_amount: 749, order_currency: "INR", order_status: "PAID" });
    cf.getPgOrderPayments.mockResolvedValue([{ payment_status: "SUCCESS", cf_payment_id: 5551 }]);
    const paid = await svc.verifyPayment(started.orderId);
    expect(paid.status).toBe("paid");
    const s = fake.storeView(SUB) as any;
    expect(s.orders).toHaveLength(1);
    expect(s.orders[0]).toMatchObject({ id: started.orderId, number: "#1001", total: 74900, paymentMethod: "cashfree", paymentStatus: "paid", cfPaymentId: "5551" });
    expect(s.products[0].stock).toBe(4);
    expect(s.customers).toHaveLength(1);
    expect((store.get(`orders/${started.orderId}`) as any).storeSubdomain).toBe(SUB);

    // a webhook arriving afterwards changes nothing
    const msg = await svc.handleWebhookEvent({ type: "PAYMENT_SUCCESS_WEBHOOK", data: { order: { order_id: started.orderId } } });
    expect(msg).toMatch(/paid/);
    expect((fake.storeView(SUB) as any).orders).toHaveLength(1);

    // the dashboard's re-apply list
    expect((await svc.paidOrdersFor(SUB)).map((o) => o.id)).toEqual([started.orderId]);
  });

  it("records the order from the webhook alone if the buyer never comes back", async () => {
    await onboardActive();
    cf.createPgOrder.mockImplementation(async (_m: string, body: any) => ({ order_id: body.order_id, order_amount: body.order_amount, order_status: "ACTIVE", payment_session_id: "s" }));
    const started = await svc.createPayment(buyer, "https://shopersite.in");
    expect(cf.createPgOrder.mock.calls[0][1].order_meta.notify_url).toBe("https://shopersite.in/api/cashfree/webhook");
    cf.getPgOrder.mockResolvedValue({ order_id: started.orderId, order_amount: 749, order_currency: "INR", order_status: "PAID" });
    cf.getPgOrderPayments.mockResolvedValue([]);
    await svc.handleWebhookEvent({ type: "PAYMENT_SUCCESS_WEBHOOK", data: { order: { order_id: started.orderId } } });
    expect((fake.storeView(SUB) as any).orders[0].paymentStatus).toBe("paid");
  });

  it("does not mark an order paid if Cashfree's amount differs", async () => {
    await onboardActive();
    cf.createPgOrder.mockImplementation(async (_m: string, body: any) => ({ order_id: body.order_id, order_amount: body.order_amount, order_status: "ACTIVE", payment_session_id: "s" }));
    const started = await svc.createPayment(buyer, "http://localhost:3000");
    cf.getPgOrder.mockResolvedValue({ order_id: started.orderId, order_amount: 1, order_currency: "INR", order_status: "PAID" });
    const r = await svc.verifyPayment(started.orderId);
    expect(r.status).toBe("failed");
    expect((store.get(`payments/${started.orderId}`) as any).status).toBe("AMOUNT_MISMATCH");
    expect((fake.storeView(SUB) as any).orders).toHaveLength(0);
  });

  it("only sends buyers back to the shop's own address", async () => {
    await onboardActive();
    await expect(svc.createPayment({ ...buyer, returnBase: "https://evil.example/order/" }, "http://localhost:3000")).rejects.toThrow(/return address/);
    await expect(svc.createPayment({ ...buyer, returnBase: "http://localhost:3000/s/lume/cart/" }, "http://localhost:3000")).rejects.toThrow(/return address/);
    expect(cf.createPgOrder).not.toHaveBeenCalled();
  });

  it("refuses closed shops", async () => {
    await onboardActive();
    store.set(`stores/${SUB}`, { ...(fake.storeView(SUB) as any), isClosed: true });
    await expect(svc.createPayment(buyer, "http://localhost:3000")).rejects.toThrow(/unavailable/);
  });

  it("ignores webhooks about payments it never started", async () => {
    expect(await svc.handleWebhookEvent({ type: "PAYMENT_SUCCESS_WEBHOOK", data: { order: { order_id: "ord_" + "a".repeat(24) } } })).toMatch(/ignored/);
    expect(await svc.handleWebhookEvent({ type: "MERCHANT_ONBOARDING_STATUS", data: { merchant_id: "someone_else" } })).toMatch(/ignored/);
    expect(cf.getPgOrder).not.toHaveBeenCalled();
  });
});
