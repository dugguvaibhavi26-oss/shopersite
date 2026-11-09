/**
 * Buyer cancellations and return requests (only when the shop switched them on), signed-in buyers'
 * orders, and products with broken prices never being sold.
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
    codFee: 0,
    freeDeliveryThreshold: 100000,
    standardDeliveryFee: 5000,
    products: [
      { id: "p1", title: "Tee", price: 69900, stock: 5, status: "published", images: ["i.jpg"] },
      { id: "p0", title: "Broken", price: -100, stock: 5, status: "published", images: [] },
    ],
    reviews: [],
    ...over,
  });
  docs.set(`stores/${SUB}/private/data`, { orders: [], customers: [], subscribers: [], subscriptionHistory: [], themePurchases: [], pendingSubscription: null });
}

const buyer = {
  subdomain: SUB,
  method: "cod" as const,
  items: [{ productId: "p1", quantity: 2 }],
  customer: { name: "Asha", phone: "9876543210", email: "asha@example.com" },
  address: { street: "12 MG Road, Camp", city: "Pune", state: "Maharashtra", pincode: "411001" },
};
const stock = () => (docs.get(`stores/${SUB}`) as { products: { id: string; stock: number }[] }).products.find((p) => p.id === "p1")!.stock;
const savedOrder = () => (docs.get(`stores/${SUB}/private/data`) as { orders: Record<string, unknown>[] }).orders[0];

beforeEach(() => seed());

describe("buyer cancels", () => {
  it("is refused when the shop hasn't switched cancellations on", async () => {
    const o = await orders.placeOrder(buyer);
    await expect(orders.requestOrderChange({ subdomain: SUB, token: o.token, kind: "cancel", reason: "Wrong size" })).rejects.toThrow(/doesn't take cancellations/);
  });

  it("cancels before shipping, puts the stock back, and records the reason", async () => {
    seed({ orderPolicy: { cancelEnabled: true, returnEnabled: false, returnDays: 7 } });
    const o = await orders.placeOrder(buyer);
    expect(stock()).toBe(3);
    const done = await orders.requestOrderChange({ subdomain: SUB, token: o.token, kind: "cancel", reason: "Wrong size" });
    expect(done).toMatchObject({ fulfilmentStatus: "cancelled", cancelledBy: "buyer", cancelReason: "Wrong size" });
    expect(done.refund).toBeUndefined(); // COD: nothing was paid
    expect(stock()).toBe(5);
    expect(savedOrder()).toMatchObject({ fulfilmentStatus: "cancelled" });
    await expect(orders.requestOrderChange({ subdomain: SUB, token: o.token, kind: "cancel", reason: "Again" })).rejects.toThrow(/already cancelled/);
  });

  it("can't cancel once shipped, and a wrong token finds nothing", async () => {
    seed({ orderPolicy: { cancelEnabled: true, returnEnabled: false, returnDays: 7 } });
    const o = await orders.placeOrder(buyer);
    const priv = docs.get(`stores/${SUB}/private/data`) as { orders: { fulfilmentStatus: string }[] };
    priv.orders[0].fulfilmentStatus = "shipped";
    await expect(orders.requestOrderChange({ subdomain: SUB, token: o.token, kind: "cancel", reason: "Late" })).rejects.toThrow(/shipped/);
    await expect(orders.requestOrderChange({ subdomain: SUB, token: "tok_sh_000000000000000000000000", kind: "cancel", reason: "x x x" })).rejects.toThrow(/not found/);
  });
});

describe("buyer asks for a return", () => {
  it("only after delivery and within the shop's window", async () => {
    seed({ orderPolicy: { cancelEnabled: false, returnEnabled: true, returnDays: 7 } });
    const o = await orders.placeOrder(buyer);
    await expect(orders.requestOrderChange({ subdomain: SUB, token: o.token, kind: "return", reason: "Too small" })).rejects.toThrow(/once the order is delivered/);
    const priv = docs.get(`stores/${SUB}/private/data`) as { orders: Record<string, unknown>[] };
    priv.orders[0].fulfilmentStatus = "delivered";
    priv.orders[0].deliveredAt = new Date(Date.now() - 10 * 86400000).toISOString();
    await expect(orders.requestOrderChange({ subdomain: SUB, token: o.token, kind: "return", reason: "Too small" })).rejects.toThrow(/7 days/);
    priv.orders[0].deliveredAt = new Date(Date.now() - 2 * 86400000).toISOString();
    const r = await orders.requestOrderChange({ subdomain: SUB, token: o.token, kind: "return", reason: "Too small" });
    expect(r.returnRequest).toMatchObject({ status: "requested", reason: "Too small" });
    await expect(orders.requestOrderChange({ subdomain: SUB, token: o.token, kind: "return", reason: "Again" })).rejects.toThrow(/already asked/);
  });
});

describe("signed-in buyers", () => {
  it("see orders placed while signed in, or with their verified email only", async () => {
    await orders.placeOrder({ ...buyer, customerUid: "buyer-1" });
    await orders.placeOrder({ ...buyer, customer: { ...buyer.customer, phone: "9876543211" } });
    expect(await orders.ordersForBuyer(SUB, { uid: "buyer-1", emailVerified: false, email: "asha@example.com" })).toHaveLength(1);
    expect(await orders.ordersForBuyer(SUB, { uid: "buyer-1", emailVerified: true, email: "ASHA@example.com" })).toHaveLength(2);
    expect(await orders.ordersForBuyer(SUB, { uid: "someone", emailVerified: false, email: "asha@example.com" })).toHaveLength(0);
  });
});

describe("prices", () => {
  it("a product saved with a broken price can't be ordered", async () => {
    await expect(orders.placeOrder({ ...buyer, items: [{ productId: "p0", quantity: 1 }] })).rejects.toThrow(/no longer available/);
  });
});
