/**
 * Staff accounts: what each role may see and do, the 5-digit store ID, password hashing and the
 * signed staff session.
 */
import { describe, it, expect } from "vitest";
import { STAFF_ROLE_IDS, STAFF_ROLES, isStaffRole, isStoreCode, passwordProblem, roleCan, roleLabel, roleSees } from "@/lib/staff/roles";
import { financeSummary, orderActions, orderForRole, slugify } from "@/lib/staff/views";
import { hashPassword, passwordMatches, readSession, signSession } from "@/lib/staff/secure";
import type { OrderData } from "@/lib/store-service";

const order = (over: Partial<OrderData> = {}): OrderData =>
  ({
    id: "o1",
    number: "1001",
    storeId: "s1",
    customer: { name: "Asha", phone: "9876543210", email: "asha@example.com" },
    address: { street: "12 MG Road", city: "Pune", state: "MH", pincode: "411001" },
    items: [{ productId: "p1", title: "Kurta", image: "", quantity: 2, price: 50000 }],
    subtotal: 100000,
    discount: 0,
    delivery: 5000,
    codFee: 0,
    total: 105000,
    paymentMethod: "cod",
    paymentStatus: "cod_pending",
    fulfilmentStatus: "placed",
    notes: "Ring the bell",
    createdAt: "2026-11-01T10:00:00.000Z",
    updatedAt: "2026-11-01T10:00:00.000Z",
    ...over,
  }) as OrderData;

describe("staff roles", () => {
  it("gives every role its own page plus WorkPlace", () => {
    for (const r of STAFF_ROLE_IDS) {
      expect(STAFF_ROLES[r].tabs).toContain("workplace");
      expect(STAFF_ROLES[r].tabs).toHaveLength(2);
    }
    expect(roleSees("order_manager", "orders")).toBe(true);
    expect(roleSees("order_manager", "products")).toBe(false);
    expect(roleSees("finance", "support")).toBe(false);
  });

  it("only lets the right roles change things", () => {
    expect(roleCan("order_manager", "orders.decide")).toBe(true);
    expect(roleCan("order_manager", "orders.fulfil")).toBe(false);
    expect(roleCan("fulfilment", "orders.fulfil")).toBe(true);
    expect(roleCan("fulfilment", "orders.decide")).toBe(false);
    expect(roleCan("product_manager", "products.edit")).toBe(true);
    expect(roleCan("support", "products.edit")).toBe(false);
    expect(STAFF_ROLES.support.can).toEqual([]);
    expect(STAFF_ROLES.finance.can).toEqual([]);
  });

  it("recognises roles, store IDs and weak passwords", () => {
    expect(isStaffRole("support")).toBe(true);
    expect(isStaffRole("owner")).toBe(false);
    expect(roleLabel("owner")).toBe("Owner");
    expect(isStoreCode("48213")).toBe(true);
    for (const bad of ["01234", "1234", "123456", "12a45", "", 12345]) expect(isStoreCode(bad)).toBe(false);
    expect(passwordProblem("short")).not.toBe("");
    expect(passwordProblem("x".repeat(73))).not.toBe("");
    expect(passwordProblem("goodenough")).toBe("");
  });
});

describe("what each role sees of an order", () => {
  it("order manager: stock, phone, address and money, and can accept or reject a new order", () => {
    const v = orderForRole(order(), "order_manager", [{ id: "p1", stock: 1 }])!;
    expect(v.items[0].stock).toBe(1);
    expect(v.items[0].price).toBe(50000);
    expect(v.customer.phone).toBe("9876543210");
    expect(v.customer.email).toBeUndefined();
    expect(v.total).toBe(105000);
    expect(v.actions).toEqual(["accept", "reject"]);
    expect(orderForRole(order(), "order_manager", [])!.items[0].stock).toBeNull();
  });

  it("fulfilment: no new or cancelled orders, no prices, only the cash to collect", () => {
    expect(orderForRole(order(), "fulfilment")).toBeNull();
    expect(orderForRole(order({ fulfilmentStatus: "cancelled" }), "fulfilment")).toBeNull();
    const v = orderForRole(order({ fulfilmentStatus: "confirmed" }), "fulfilment")!;
    expect(v.total).toBeUndefined();
    expect(v.subtotal).toBeUndefined();
    expect(v.items[0].price).toBeUndefined();
    expect(v.collect).toBe(105000);
    expect(v.address?.pincode).toBe("411001");
    expect(v.actions).toEqual(["packed", "shipped"]);
    const paid = orderForRole(order({ fulfilmentStatus: "packed", paymentMethod: "razorpay", paymentStatus: "paid" }), "fulfilment")!;
    expect(paid.collect).toBeUndefined();
    expect(paid.actions).toEqual(["shipped"]);
  });

  it("support: everything to answer a buyer, nothing to change", () => {
    const v = orderForRole(order(), "support")!;
    expect(v.customer.email).toBe("asha@example.com");
    expect(v.address).toBeDefined();
    expect(v.actions).toEqual([]);
  });

  it("finance: money, but no phone, email, address or notes", () => {
    const v = orderForRole(order(), "finance")!;
    expect(v.total).toBe(105000);
    expect(v.customer).toEqual({ name: "Asha" });
    expect(v.address).toBeUndefined();
    expect(v.notes).toBeUndefined();
    expect(v.actions).toEqual([]);
  });

  it("product manager sees no orders", () => {
    expect(orderForRole(order(), "product_manager")).toBeNull();
  });

  it("finished orders offer no further steps", () => {
    for (const s of ["delivered", "cancelled"] as const) {
      expect(orderActions({ fulfilmentStatus: s }, "order_manager")).toEqual([]);
      expect(orderActions({ fulfilmentStatus: s }, "fulfilment")).toEqual([]);
    }
    expect(orderActions({ fulfilmentStatus: "shipped" }, "fulfilment")).toEqual(["delivered"]);
    expect(orderActions({ fulfilmentStatus: "shipped" }, "order_manager")).toEqual([]);
  });
});

describe("finance summary", () => {
  it("adds up received, cash to collect, checks and refunds, leaving cancelled orders out", () => {
    const s = financeSummary([
      { fulfilmentStatus: "delivered", paymentStatus: "paid", total: 1000 },
      { fulfilmentStatus: "shipped", paymentStatus: "verified", total: 500 },
      { fulfilmentStatus: "confirmed", paymentStatus: "cod_pending", total: 700 },
      { fulfilmentStatus: "placed", paymentStatus: "awaiting_verification", total: 300 },
      { fulfilmentStatus: "cancelled", paymentStatus: "paid", total: 900, refund: { status: "due", amount: 900 } },
      { fulfilmentStatus: "cancelled", paymentStatus: "paid", total: 200, refund: { status: "refunded", amount: 200 } },
    ]);
    expect(s).toEqual({ received: 1500, codPending: 700, awaiting: 300, refundsDue: 900, refundsPaid: 200, orders: 6, cancelled: 2 });
  });
});

describe("staff sign-in", () => {
  it("hashes passwords with a salt and checks them", async () => {
    const a = await hashPassword("correct horse");
    const b = await hashPassword("correct horse");
    expect(a.hash).not.toBe(b.hash);
    expect(a.hash).not.toContain("correct");
    expect(await passwordMatches("correct horse", a.salt, a.hash)).toBe(true);
    expect(await passwordMatches("wrong horse", a.salt, a.hash)).toBe(false);
    expect(await passwordMatches("correct horse", b.salt, a.hash)).toBe(false);
  });

  it("reads back only sessions it signed, and only until they expire", () => {
    const key = Buffer.from("k".repeat(32));
    const session = { sid: "abc", sub: "demo", v: 1, exp: 2000 };
    const token = signSession(session, key);
    expect(readSession(token, key, 1000)).toEqual(session);
    expect(readSession(token, key, 2001)).toBeNull();
    expect(readSession(token, Buffer.from("x".repeat(32)), 1000)).toBeNull();
    const forged = Buffer.from(JSON.stringify({ ...session, sub: "other" })).toString("base64url") + "." + token.split(".")[1];
    expect(readSession(forged, key, 1000)).toBeNull();
    for (const bad of [undefined, null, "", "abc", "a.b.c"]) expect(readSession(bad, key, 1000)).toBeNull();
  });
});

describe("slugify", () => {
  it("makes a web-safe name", () => {
    expect(slugify("Blue Kurta (M)")).toBe("blue-kurta-m");
  });
});
