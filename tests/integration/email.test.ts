/**
 * Email to subscribers through the seller's Gmail: App Password stored encrypted, plan limits,
 * unsubscribe links. Gmail itself is mocked.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
process.env.EMAIL_SECRET_KEY = Buffer.alloc(32, 7).toString("base64");
process.env.NEXT_PUBLIC_APP_URL = "https://shopersite.in";

import { createFakeFirestore } from "../helpers/fake-firestore";
const fake = createFakeFirestore();
const docs = fake.docs;
vi.mock("@/lib/server/firebase-admin", () => ({ adminDb: () => fake.db }));

const sent: { to: string; subject: string; html: string; headers?: Record<string, string> }[] = [];
let loginOk = true;
vi.mock("nodemailer", () => ({
  default: {
    createTransport: (opts: { auth: { user: string; pass: string } }) => ({
      verify: async () => {
        if (!loginOk || opts.auth.pass.length !== 16) throw Object.assign(new Error("Invalid login: 535 Username and Password not accepted"), { responseCode: 535 });
        return true;
      },
      sendMail: async (m: { to: string; subject: string; html: string; headers?: Record<string, string> }) => {
        sent.push(m);
        return { messageId: "x" };
      },
      close: () => {},
    }),
  },
}));

import * as email from "@/lib/server/email-service";
import { readStore } from "@/lib/server/store-data";

const SUB = "lume";
function seed(planId: string, subscribers = 3) {
  docs.clear();
  sent.length = 0;
  loginOk = true;
  docs.set(`stores/${SUB}`, { id: "s1", subdomain: SUB, name: "Lume", ownerId: "o1", planId, products: [{ id: "p1", slug: "tee", title: "Tee", price: 69900, images: ["https://x/i.jpg"] }] });
  docs.set(`stores/${SUB}/private/data`, {
    subscribers: Array.from({ length: subscribers }, (_, i) => ({ id: `s${i}`, email: `buyer${i}@example.com`, subscribedAt: "x" })),
  });
}
const store = async () => (await readStore(SUB))!;

beforeEach(() => seed("pro"));

describe("email to subscribers", () => {
  it("connects only with a working App Password, and stores it encrypted", async () => {
    await expect(email.connectGmail(await store(), "lume@gmail.com", "short")).rejects.toThrow(/16 letters/);
    loginOk = false;
    await expect(email.connectGmail(await store(), "lume@gmail.com", "abcd efgh ijkl mnop")).rejects.toThrow(/didn't accept/);
    loginOk = true;
    await email.connectGmail(await store(), "Lume@Gmail.com", "abcd efgh ijkl mnop");
    const saved = docs.get(`email_accounts/${SUB}`) as { email: string; secret: string };
    expect(saved.email).toBe("lume@gmail.com");
    expect(saved.secret).toMatch(/^v1\./);
    expect(JSON.stringify(saved)).not.toContain("abcdefghijklmnop");
    const status = await email.emailStatus(await store());
    expect(status).toMatchObject({ connected: true, email: "lume@gmail.com" });
    expect(JSON.stringify(status)).not.toContain("secret");
  });

  it("Free can't use it", async () => {
    seed("free");
    await expect(email.connectGmail(await store(), "lume@gmail.com", "abcdefghijklmnop")).rejects.toThrow(/Pro/);
  });

  it("sends one email per subscriber, each with its own unsubscribe link, and counts them", async () => {
    await email.connectGmail(await store(), "lume@gmail.com", "abcdefghijklmnop");
    const r = await email.sendToSubscribers(await store(), { subject: "New in", message: "Hello <b>there</b>", productId: "p1" });
    expect(r).toEqual({ sent: 3, failed: 0, total: 3 });
    expect(sent.map((m) => m.to).sort()).toEqual(["buyer0@example.com", "buyer1@example.com", "buyer2@example.com"]);
    expect(sent[0].html).toContain("&lt;b&gt;there&lt;/b&gt;"); // message text is escaped
    expect(sent[0].html).toContain("/s/lume/products/tee");
    expect(sent[0].headers?.["List-Unsubscribe"]).toMatch(/unsubscribe\?store=lume/);
    expect((await email.emailStatus(await store())).usage).toMatchObject({ month: 3, day: 3, perMonth: null });
  });

  it("email is Pro only; Pro has no monthly limit but keeps under Gmail's daily limit", async () => {
    const month = new Date().toISOString().slice(0, 7);
    seed("starter");
    await expect(email.connectGmail(await store(), "lume@gmail.com", "abcdefghijklmnop")).rejects.toThrow(/Pro/);
    expect(sent).toHaveLength(0);

    seed("pro");
    await email.connectGmail(await store(), "lume@gmail.com", "abcdefghijklmnop");
    docs.set(`email_usage/${SUB}`, { month, monthCount: 50000, day: "old", dayCount: 0 });
    await expect(email.sendToSubscribers(await store(), { subject: "a", message: "b" })).resolves.toMatchObject({ sent: 3 });
    docs.set(`email_usage/${SUB}`, { month, monthCount: 0, day: new Date().toISOString().slice(0, 10), dayCount: 449 });
    await expect(email.sendToSubscribers(await store(), { subject: "a", message: "b" })).rejects.toThrow(/1 more today/);
  });

  it("unsubscribe links only work with a valid signature", async () => {
    const link = new URL(email.unsubscribeLink(SUB, "buyer1@example.com"));
    expect(await email.unsubscribe(SUB, "buyer1@example.com", "forged")).toBeNull();
    expect(await email.unsubscribe(SUB, "buyer2@example.com", link.searchParams.get("t")!)).toBeNull(); // someone else's link
    expect(await email.unsubscribe(SUB, "buyer1@example.com", link.searchParams.get("t")!)).toBe("Lume");
    expect((await store()).subscribers?.map((s) => s.email)).toEqual(["buyer0@example.com", "buyer2@example.com"]);
  });
});
