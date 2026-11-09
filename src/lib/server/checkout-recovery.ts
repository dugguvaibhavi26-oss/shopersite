import "server-only";
import { storeHas } from "./plan-access";
import { randomBytes } from "node:crypto";
import type { StoreData } from "../store-service";
import { ApiError } from "./api-error";
import { adminDb } from "./firebase-admin";
import { readStore } from "./store-data";
import { emailCartReminder } from "./email-service";

/**
 * Abandoned checkouts. When a buyer fills in their details and goes on to payment, we note the
 * checkout; when an order with that phone number is placed it's marked done. What's left after a
 * while shows in Orders → Abandoned, with one-tap WhatsApp, and buyers who agreed get one email
 * reminder from the shop's Gmail (daily job). Kept in checkouts/{id}, which only the server reads.
 */

const COL = "checkouts";
export const ABANDONED_AFTER_MS = 30 * 60 * 1000;
const KEEP_MS = 14 * 24 * 60 * 60 * 1000;

export interface CheckoutRecord {
  id: string;
  store: string;
  name: string;
  phone: string;
  email?: string;
  items: { productId: string; title: string; quantity: number; price: number }[];
  total: number;
  consent: boolean;
  status: "open" | "ordered" | "contacted" | "reminded";
  createdAt: string;
  updatedAt: string;
  remindedAt?: string;
}

const col = () => adminDb().collection(COL);
const last10 = (p: string) => p.replace(/\D/g, "").slice(-10);

export async function recordCheckout(store: StoreData, input: { name: string; phone: string; email?: string; items: { productId: string; quantity: number; variantName?: string }[]; consent: boolean }) {
  const phone = last10(input.phone);
  if (!/^[6-9]\d{9}$/.test(phone)) throw new ApiError(400, "Bad phone.");
  // prices and titles come from the store, never from the browser
  const items = input.items
    .slice(0, 50)
    .map((i) => {
      const p = (store.products || []).find((x) => x.id === i.productId);
      return p ? { productId: p.id, title: p.title + (i.variantName ? ` (${i.variantName.slice(0, 60)})` : ""), quantity: Math.min(99, Math.max(1, Math.round(i.quantity))), price: p.price } : null;
    })
    .filter(Boolean) as CheckoutRecord["items"];
  if (!items.length) return;
  const now = new Date().toISOString();
  const total = items.reduce((n, i) => n + i.price * i.quantity, 0);
  // one open checkout per buyer per store: update it rather than piling up copies
  const existing = await col().where("store", "==", store.subdomain).where("phone", "==", phone).limit(5).get();
  const open = existing.docs.map((d) => d.data() as CheckoutRecord).find((c) => c.status === "open");
  const base = { name: input.name.trim().slice(0, 80), phone, ...(input.email ? { email: input.email.trim().toLowerCase().slice(0, 200) } : {}), items, total, consent: !!input.consent, updatedAt: now };
  if (open) await col().doc(open.id).update(base);
  else {
    const id = `co_${randomBytes(10).toString("hex")}`;
    await col().doc(id).set({ id, store: store.subdomain, status: "open", createdAt: now, ...base });
  }
}

/** An order was placed: that buyer's open checkout is done. Never throws. */
export async function closeCheckouts(subdomain: string, phoneRaw: string) {
  try {
    const phone = last10(phoneRaw);
    const snap = await col().where("store", "==", subdomain).where("phone", "==", phone).limit(10).get();
    const now = new Date().toISOString();
    await Promise.all(
      snap.docs.filter((d) => (d.data() as CheckoutRecord).status !== "ordered").map((d) => d.ref.update({ status: "ordered", updatedAt: now }))
    );
  } catch (err) {
    console.error("[checkouts] close failed", err);
  }
}

export async function listAbandoned(subdomain: string): Promise<CheckoutRecord[]> {
  const snap = await col().where("store", "==", subdomain).limit(300).get();
  const now = Date.now();
  return snap.docs
    .map((d) => d.data() as CheckoutRecord)
    .filter((c) => c.status !== "ordered" && now - Date.parse(c.updatedAt) > ABANDONED_AFTER_MS && now - Date.parse(c.createdAt) < KEEP_MS)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 100);
}

export async function markContacted(subdomain: string, id: string) {
  const ref = col().doc(id);
  const snap = await ref.get();
  if (!snap.exists || snap.get("store") !== subdomain) throw new ApiError(404, "Not found.");
  await ref.update({ status: "contacted", updatedAt: new Date().toISOString() });
}

/** Daily job: one email reminder to buyers who agreed, 1–48 hours after they stopped. */
export async function sendCartReminders(): Promise<{ sent: number; checked: number }> {
  const now = Date.now();
  const snap = await col().where("status", "==", "open").limit(500).get();
  const due = snap.docs
    .map((d) => d.data() as CheckoutRecord)
    .filter((c) => c.consent && c.email && now - Date.parse(c.updatedAt) > 60 * 60 * 1000 && now - Date.parse(c.updatedAt) < 48 * 60 * 60 * 1000);
  let sent = 0;
  const stores = new Map<string, StoreData | null>();
  for (const c of due) {
    if (!stores.has(c.store)) stores.set(c.store, await readStore(c.store));
    const store = stores.get(c.store);
    if (!store || !(await storeHas(store, "abandonedCart"))) continue;
    const list = c.items.map((i) => `• ${i.quantity} × ${i.title}`).join("\n");
    if (await emailCartReminder(store, c.email!, c.name, list)) {
      sent++;
      await col().doc(c.id).update({ status: "reminded", remindedAt: new Date().toISOString() });
    }
  }
  // tidy up old records
  const old = await col().where("createdAt", "<", new Date(now - KEEP_MS).toISOString()).limit(200).get();
  await Promise.all(old.docs.map((d) => d.ref.delete()));
  return { sent, checked: due.length };
}
