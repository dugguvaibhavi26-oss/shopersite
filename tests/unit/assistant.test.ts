import { describe, expect, it, vi } from "vitest";
import { parseCommand } from "@/lib/assistant/commands";
import { DEFAULT_ASSISTANT_SETTINGS, effectiveBudget, istDay, mergeAssistantSettings, nextResetAt, usageView } from "@/lib/assistant/budget";
import { searchHelp } from "@/lib/assistant/help";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/server/firebase-admin", () => ({ adminDb: () => ({}) }));
process.env.EMAIL_SECRET_KEY = Buffer.alloc(32, 7).toString("base64");

const { describeWrite, makeProposal, readProposal, runRead, isWrite, linkFor } = await import("@/lib/server/assistant/tools");

describe("free commands", () => {
  it("opens pages", () => {
    expect(parseCommand("show orders")).toEqual({ kind: "navigate", page: "orders" });
    expect(parseCommand("orders")).toEqual({ kind: "navigate", page: "orders" });
    expect(parseCommand("open customers")).toEqual({ kind: "navigate", page: "customers" });
    expect(parseCommand("go to plan")).toEqual({ kind: "navigate", page: "billing" });
    expect(parseCommand("coupons dikhao")).toEqual({ kind: "navigate", page: "discounts" });
    expect(parseCommand("add product")).toEqual({ kind: "navigate", page: "products", action: "add-product" });
  });

  it("moves orders along", () => {
    expect(parseCommand("mark order 1043 shipped")).toEqual({ kind: "order_status", number: "1043", status: "shipped" });
    expect(parseCommand("#1043 delivered")).toEqual({ kind: "order_status", number: "1043", status: "delivered" });
    expect(parseCommand("1043 pack karo")).toEqual({ kind: "order_status", number: "1043", status: "packed" });
  });

  it("answers quick numbers", () => {
    expect(parseCommand("orders today")).toEqual({ kind: "stat", metric: "orders_today" });
    expect(parseCommand("aaj ki sales")).toEqual({ kind: "stat", metric: "sales_today" });
    expect(parseCommand("pending orders")).toEqual({ kind: "stat", metric: "pending_orders" });
    expect(parseCommand("what is out of stock")).toEqual({ kind: "stat", metric: "low_stock" });
  });

  it("leaves real questions to the AI", () => {
    expect(parseCommand("write a description for my red saree")).toBeNull();
    expect(parseCommand("why are my sales down compared to last month and what should I do")).toBeNull();
    expect(parseCommand("change the price of the blue kurti to 799")).toBeNull();
  });
});

describe("daily budget", () => {
  it("fills in bad or missing settings", () => {
    const s = mergeAssistantSettings({ budgets: { free: -5, pro: "x" }, enabled: "yes" });
    expect(s.budgets.free).toBe(5_000);
    expect(s.budgets.pro).toBe(DEFAULT_ASSISTANT_SETTINGS.budgets.pro);
    expect(s.enabled).toBe(true);
  });

  it("stretches on quiet days", () => {
    const s = DEFAULT_ASSISTANT_SETTINGS;
    expect(effectiveBudget(s, "free", 0)).toBe(s.budgets.free * 2);
    expect(effectiveBudget(s, "free", s.platformTokens * 0.5)).toBe(s.budgets.free * 1.5);
    expect(effectiveBudget(s, "pro", s.platformTokens * 0.9)).toBe(s.budgets.pro);
    expect(effectiveBudget({ ...s, stretch: false }, "starter", 0)).toBe(s.budgets.starter);
  });

  it("shows a percentage and stops at the caps", () => {
    const s = { ...DEFAULT_ASSISTANT_SETTINGS, stretch: false };
    expect(usageView(s, "free", s.budgets.free / 2, { tokens: 0, requests: 0 }).percent).toBe(50);
    expect(usageView(s, "free", s.budgets.free, { tokens: 0, requests: 0 }).available).toBe(false);
    const busy = usageView(s, "pro", 0, { tokens: 0, requests: s.platformRequests });
    expect(busy.busy).toBe(true);
    expect(busy.available).toBe(false);
  });

  it("resets at midnight in India", () => {
    // 20:00 UTC = 01:30 IST next day
    const t = Date.UTC(2026, 10, 8, 20, 0);
    expect(istDay(t)).toBe("2026-11-09");
    expect(nextResetAt(t)).toBe("2026-11-09T18:30:00.000Z");
  });
});

describe("help search", () => {
  it("finds the right guide", () => {
    expect(searchHelp("how do I connect razorpay")[0].id).toBe("payments");
    expect(searchHelp("shiprocket courier")[0].id).toBe("shiprocket");
    expect(searchHelp("why is my shop closed policy")[0].id).toBe("policies");
  });
});

/* ------------------------------ actions ------------------------------ */

const order = (n: string, status: string, pay = "verified") => ({
  id: `o${n}`,
  number: `#${n}`,
  customer: { name: "Teja Reddy", phone: "9949310330", email: "t@example.com" },
  address: { line1: "Secret street" },
  items: [{ productId: "p1", title: "Red saree", quantity: 1, price: 99900, image: "" }],
  total: 99900,
  paymentMethod: "upi",
  paymentStatus: pay,
  fulfilmentStatus: status,
  createdAt: new Date().toISOString(),
});
const store = {
  id: "s1",
  name: "Teja Shop",
  subdomain: "teja",
  planId: "free",
  products: [{ id: "p1", title: "Red saree", slug: "red-saree", price: 99900, stock: 2, status: "published", category: "Sarees", images: [] }],
  categories: [{ id: "c1", name: "Sarees", slug: "sarees", isActive: true, position: 0 }],
  orders: [order("1043", "confirmed"), order("1044", "placed", "awaiting_verification")],
  customers: [{ id: "c", name: "Teja Reddy", phone: "9949310330", email: "t@example.com", totalOrders: 2, totalSpent: 1, lastOrderAt: new Date().toISOString() }],
  reviews: [],
  discounts: [],
} as never;

describe("assistant actions", () => {
  it("never shows buyers' contact details to the AI", () => {
    const text = JSON.stringify([runRead("find_orders", {}, store).result, runRead("find_customers", {}, store).result]);
    expect(text).not.toContain("9949310330");
    expect(text).not.toContain("t@example.com");
    expect(text).not.toContain("Secret street");
    expect(text).not.toContain("Reddy");
    expect(text).toContain("Teja");
  });

  it("knows which tools change things", () => {
    expect(isWrite("update_product")).toBe(true);
    expect(isWrite("find_orders")).toBe(false);
    expect(isWrite("delete_store")).toBe(false);
  });

  it("checks changes like the dashboard does", () => {
    expect(describeWrite("update_product", { product_id: "p1", price: 799 }, store).lines[0]).toContain("₹999 → ₹799");
    expect(() => describeWrite("update_product", { product_id: "p1", price: 799, mrp: 500 }, store)).toThrow(/MRP/);
    expect(() => describeWrite("update_order_status", { order_number: "1043", status: "confirmed" }, store)).toThrow(/already/);
    expect(() => describeWrite("update_order_status", { order_number: "1044", status: "packed" }, store)).toThrow(/payment/);
    expect(() => describeWrite("create_discount", { code: "DIWALI10", type: "percentage", value: 10 }, store)).toThrow(/Growth/);
    expect(() => describeWrite("create_category", { name: "sarees" }, store)).toThrow(/already exists/);
  });

  it("seals a change so only this seller can confirm it", () => {
    const p = makeProposal("teja", "u1", "update_order_status", { order_number: "#1043", status: "shipped" }, store);
    expect(readProposal(p.token, "teja", "u1").action).toBe("update_order_status");
    expect(() => readProposal(p.token, "teja", "someone-else")).toThrow();
    expect(() => readProposal(p.token, "other-shop", "u1")).toThrow();
    const parts = p.token.split(".");
    const flipped = parts[3][0] === "A" ? "B" : "A";
    expect(() => readProposal([...parts.slice(0, 3), flipped + parts[3].slice(1)].join("."), "teja", "u1")).toThrow();
  });

  it("adds dashboard link buttons", () => {
    expect(runRead("show_link", { page: "discounts", label: "Open Discounts" }, store).link).toEqual({ page: "discounts", label: "Open Discounts" });
    expect(runRead("show_link", { page: "orders", order_number: "1043" }, store).link).toEqual({ page: "orders", label: "View order #1043", orderId: "o1043" });
    expect(runRead("show_link", { page: "nowhere" }, store).link).toBeUndefined();
    expect(linkFor("create_discount", {}).page).toBe("discounts");
    expect(makeProposal("teja", "u1", "update_order_status", { order_number: "1043", status: "shipped" }, store).link).toEqual({ page: "orders", label: "View order", orderId: "o1043" });
  });
});
