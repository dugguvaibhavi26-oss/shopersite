import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/server/firebase-admin", () => ({ adminDb: () => ({}) }));
vi.mock("@/lib/server/assistant/usage", () => ({ recordUsage: async () => {} }));
process.env.EMAIL_SECRET_KEY = Buffer.alloc(32, 7).toString("base64");

const { cleanReply } = await import("@/lib/server/assistant/run");

const store = {
  name: "Teja Shop",
  subdomain: "teja",
  planId: "free",
  products: [],
  orders: [{ id: "o1043", number: "#1043", items: [], total: 1, fulfilmentStatus: "placed", paymentStatus: "verified", createdAt: "" }],
  customers: [],
  reviews: [],
  categories: [],
} as never;

describe("assistant reply cleanup", () => {
  it("turns tool calls written as text into link buttons", () => {
    const r = cleanReply(
      'You have one order to ship.\n\n{{show_link({"label":"Open Orders","page":"orders"})}}\n{{show_link({"label":"Open Billing","page":"billing"})}}',
      store
    );
    expect(r.text).toBe("You have one order to ship.");
    expect(r.links).toEqual([
      { page: "orders", label: "Open Orders" },
      { page: "billing", label: "Open Billing" },
    ]);
  });

  it("handles the bare form and order links", () => {
    const r = cleanReply('Ship it now. show_link({"page":"orders","order_number":"1043"})', store);
    expect(r.text).toBe("Ship it now.");
    expect(r.links[0]).toEqual({ page: "orders", label: "View order #1043", orderId: "o1043" });
  });

  it("drops headings, control tokens and a dangling 'here are the links' line", () => {
    const r = cleanReply("## Summary\nSales are up.<|end|>\n\nI've prepared links so you can act quickly:", store);
    expect(r.text).toBe("Summary\nSales are up.");
  });

  it("leaves normal text alone", () => {
    expect(cleanReply("- **2 orders** to ship\n- Add a policy page", store).text).toBe("- **2 orders** to ship\n- Add a policy page");
  });
});
