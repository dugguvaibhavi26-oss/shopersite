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

  it("never shows code: typed tool calls are handed back to be run", () => {
    const a = cleanReply('```tool_code\nprint(default_api.find_orders(status="placed", days=7))\n```', store);
    expect(a.text).toBe("");
    expect(a.calls).toEqual([{ name: "find_orders", args: { status: "placed", days: 7 } }]);

    const b = cleanReply('Let me check.\n{"name": "search_help", "arguments": {"query": "how to add shiprocket"}}', store);
    expect(b.text).toBe("Let me check.");
    expect(b.calls).toEqual([{ name: "search_help", args: { query: "how to add shiprocket" } }]);

    const c = cleanReply("<function=store_overview>{}</function>", store);
    expect(c.text).toBe("");
    expect(c.calls).toEqual([{ name: "store_overview", args: {} }]);

    const d = cleanReply('<|channel|>commentary to=functions.find_products <|constrain|>json<|message|>{"filter":"low_stock"}', store);
    expect(d.text).toBe("");
    expect(d.calls).toEqual([{ name: "find_products", args: { filter: "low_stock" } }]);

    const e = cleanReply('<tool_call>{"name":"create_discount","arguments":"{\\"code\\":\\"DIWALI10\\",\\"type\\":\\"percentage\\",\\"value\\":10}"}</tool_call>', store);
    expect(e.text).toBe("");
    expect(e.calls).toEqual([{ name: "create_discount", args: { code: "DIWALI10", type: "percentage", value: 10 } }]);
  });

  it("strips stray JSON, code blocks, backticks and thinking, keeping the sentences", () => {
    const r = cleanReply(
      '<think>call the tool</think>You have **3 orders** to pack.\n```json\n{"orders": [1, 2, 3]}\n```\nOpen `Orders` to see them.\n{"status": "ok"}\n"total": 3,',
      store
    );
    expect(r.text).toBe("You have **3 orders** to pack.\n\nOpen Orders to see them.");
    expect(r.calls).toEqual([]);
  });

  it("leaves normal text alone", () => {
    expect(cleanReply("- **2 orders** to ship\n- Add a policy page", store).text).toBe("- **2 orders** to ship\n- Add a policy page");
  });
});
