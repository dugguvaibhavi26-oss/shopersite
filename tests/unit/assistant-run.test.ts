import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/server/firebase-admin", () => ({ adminDb: () => ({}) }));
vi.mock("@/lib/server/assistant/usage", () => ({ recordUsage: async () => {} }));
process.env.EMAIL_SECRET_KEY = Buffer.alloc(32, 7).toString("base64");

// what the "AI" says, one reply per request, and what it was sent each time
const script: string[] = [];
const sent: { role: string; content: string | null }[][] = [];
vi.mock("@/lib/server/assistant/providers", () => ({
  chat: async (messages: { role: string; content: string | null }[]) => {
    sent.push(messages.map((m) => ({ role: m.role, content: m.content })));
    return { message: { role: "assistant", content: script.shift() ?? "" }, tokens: 10, provider: "test", model: "test" };
  },
}));

const { runAssistant } = await import("@/lib/server/assistant/run");

const store = {
  name: "Teja Shop",
  subdomain: "teja",
  planId: "free",
  products: [{ id: "p1", title: "Red Saree", price: 99900, stock: 2, status: "published", category: "Sarees" }],
  orders: [],
  customers: [],
  reviews: [],
  categories: [],
} as never;

const codey = /[{}`]|default_api|find_products|tool_code/;

describe("assistant never answers in code", () => {
  beforeEach(() => {
    script.length = 0;
    sent.length = 0;
  });

  it("runs a tool call the model typed out, then answers in words", async () => {
    script.push('```tool_code\nprint(default_api.find_products(query="saree"))\n```', "You have **1 saree**: Red Saree, with 2 left in stock.");
    const out = await runAssistant(store, "u1", [{ role: "user", content: "what sarees do I have?" }]);
    expect(out.reply).toBe("You have **1 saree**: Red Saree, with 2 left in stock.");
    // the lookup really ran and its result went back to the model
    expect(sent[1][sent[1].length - 1].content).toContain("Red Saree");
  });

  it("asks again when the reply is only code, and falls back to a plain sentence", async () => {
    script.push('{"result": [1, 2, 3]}', '```json\n{"still": "code"}\n```');
    const out = await runAssistant(store, "u1", [{ role: "user", content: "hello" }]);
    expect(out.reply).not.toMatch(codey);
    expect(out.reply).toMatch(/please ask again/i);
  });

  it("keeps on answering in words even if the model keeps typing tool calls", async () => {
    for (let i = 0; i < 12; i++) script.push('find_products({"query":"saree"})');
    const out = await runAssistant(store, "u1", [{ role: "user", content: "sarees?" }]);
    expect(out.reply).not.toMatch(codey);
    expect(sent.length).toBeLessThanOrEqual(8);
  });

  it("does not replay an old code reply back to the model", async () => {
    script.push("Hi! How can I help?");
    await runAssistant(store, "u1", [
      { role: "user", content: "hi" },
      { role: "assistant", content: '{"name":"store_overview","arguments":{}}' },
      { role: "user", content: "hello?" },
    ]);
    expect(sent[0].filter((m) => m.role === "assistant")).toEqual([]);
  });
});
