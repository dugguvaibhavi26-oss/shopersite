import "server-only";
import nodemailer from "nodemailer";
import { canUseEmail } from "../plans";
import { emailLimitsFor } from "../email-limits";
import type { StoreData } from "../store-service";
import { ApiError } from "./api-error";
import { adminDb } from "./firebase-admin";
import { readStore, storeRefs } from "./store-data";
import { open, seal, sign, verifySignature } from "./secret-box";

/**
 * Subscriber emails sent through the seller's own Gmail (SMTP with a Google App Password).
 *
 * - The App Password is encrypted (secret-box) and kept in email_accounts/{store}, which only the
 *   server can read (firestore.rules deny it to everyone). It is never sent back to the browser.
 * - Usage per store is counted in email_usage/{store}: per month (plan limit) and per day (Gmail limit).
 * - Every email carries a signed one-click unsubscribe link.
 */

const ACCOUNTS = "email_accounts";
const USAGE = "email_usage";
const GMAIL = /^[^\s@]+@(gmail\.com|googlemail\.com|[a-z0-9-]+(\.[a-z0-9-]+)+)$/i;

type Account = { email: string; secret: string; connectedAt: string };
type Usage = { month: string; monthCount: number; day: string; dayCount: number };

const today = () => new Date().toISOString().slice(0, 10);
const thisMonth = () => today().slice(0, 7);

function transport(email: string, appPassword: string) {
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user: email, pass: appPassword },
    pool: true,
    maxConnections: 3,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
  });
}

function gmailError(err: unknown): ApiError {
  const msg = String((err as { message?: string })?.message || "");
  const code = (err as { responseCode?: number })?.responseCode;
  if (code === 535 || /Username and Password not accepted|BadCredentials|Invalid login/i.test(msg)) {
    return new ApiError(400, "Gmail didn't accept that App Password. Check the Gmail address and create a new App Password.");
  }
  if (code === 550 || code === 421 || /limit|quota|rate/i.test(msg)) {
    return new ApiError(429, "Gmail has paused sending for this account for now (daily limit). Try again tomorrow.");
  }
  console.error("[email] gmail error", code, msg.slice(0, 200));
  return new ApiError(502, "Couldn't reach Gmail. Please try again in a minute.");
}

function requireEmailPlan(store: StoreData) {
  if (!canUseEmail(store.planId)) throw new ApiError(403, "Email to subscribers is part of the Growth and Pro plans.");
}

async function account(sub: string): Promise<Account | null> {
  const snap = await adminDb().collection(ACCOUNTS).doc(sub).get();
  return snap.exists ? (snap.data() as Account) : null;
}

async function usage(sub: string): Promise<Usage> {
  const snap = await adminDb().collection(USAGE).doc(sub).get();
  const u = (snap.exists ? snap.data() : {}) as Partial<Usage>;
  return {
    month: thisMonth(),
    monthCount: u.month === thisMonth() ? u.monthCount || 0 : 0,
    day: today(),
    dayCount: u.day === today() ? u.dayCount || 0 : 0,
  };
}

/** What's left to send right now for this store's plan. */
function remaining(store: StoreData, u: Usage): number {
  const lim = emailLimitsFor(store.planId);
  const byDay = lim.perDay - u.dayCount;
  const byMonth = lim.perMonth === null ? Infinity : lim.perMonth - u.monthCount;
  return Math.max(0, Math.min(byDay, byMonth));
}

/** Adds `n` sent emails to today's and this month's counts (in a transaction, so parallel sends add up). */
async function count(sub: string, n: number) {
  const db = adminDb();
  const ref = db.collection(USAGE).doc(sub);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const u = (snap.exists ? snap.data() : {}) as Partial<Usage>;
    tx.set(ref, {
      month: thisMonth(),
      monthCount: (u.month === thisMonth() ? u.monthCount || 0 : 0) + n,
      day: today(),
      dayCount: (u.day === today() ? u.dayCount || 0 : 0) + n,
      updatedAt: new Date().toISOString(),
    });
  });
}

export async function emailStatus(store: StoreData) {
  const [acc, u, priv] = await Promise.all([account(store.subdomain), usage(store.subdomain), storeRefs(store.subdomain).priv.get()]);
  const lim = emailLimitsFor(store.planId);
  const campaigns = ((priv.exists ? priv.data()?.emailCampaigns : null) || []) as { subject: string; sent: number; failed: number; at: string }[];
  return {
    campaigns: campaigns.slice(-5).reverse(),
    connected: !!acc,
    email: acc?.email || null,
    connectedAt: acc?.connectedAt || null,
    usage: { month: u.monthCount, day: u.dayCount, perMonth: lim.perMonth, perDay: lim.perDay, left: remaining(store, u) },
  };
}

/** Checks the Gmail login works, then saves it (encrypted). */
export async function connectGmail(store: StoreData, emailRaw: string, appPasswordRaw: string) {
  requireEmailPlan(store);
  const email = String(emailRaw || "").trim().toLowerCase();
  const appPassword = String(appPasswordRaw || "").replace(/\s+/g, "");
  if (!GMAIL.test(email)) throw new ApiError(400, "Enter the Gmail address you'll send from.");
  if (!/^[a-z]{16}$/i.test(appPassword)) throw new ApiError(400, "An App Password is 16 letters (Google shows it in 4 groups of 4).");
  const t = transport(email, appPassword);
  try {
    await t.verify();
  } catch (err) {
    throw gmailError(err);
  } finally {
    t.close();
  }
  const data: Account = { email, secret: seal(appPassword), connectedAt: new Date().toISOString() };
  await adminDb().collection(ACCOUNTS).doc(store.subdomain).set(data);
  return { email };
}

export async function disconnectGmail(store: StoreData) {
  await adminDb().collection(ACCOUNTS).doc(store.subdomain).delete();
}

function appUrl(): string {
  const u = (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "");
  return /^https:\/\//.test(u) ? u : "https://shopersite.in";
}

export function unsubscribeLink(sub: string, email: string): string {
  const e = email.toLowerCase();
  return `${appUrl()}/api/store/unsubscribe?store=${encodeURIComponent(sub)}&e=${encodeURIComponent(e)}&t=${sign(`${sub}|${e}`)}`;
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function render(store: StoreData, opts: { subject: string; message: string; ctaText: string; ctaUrl: string; image?: string; unsubscribe: string }) {
  const paras = opts.message
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 14px;line-height:1.6">${esc(p).replace(/\n/g, "<br>")}</p>`)
    .join("");
  const html = `<!doctype html><html><body style="margin:0;background:#f5f5f5;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#171717">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e5e5">
<tr><td style="padding:20px 24px;border-bottom:1px solid #eee;font-weight:600;font-size:16px">${esc(store.name)}</td></tr>
${opts.image ? `<tr><td><img src="${esc(opts.image)}" alt="" width="520" style="display:block;width:100%;height:auto"></td></tr>` : ""}
<tr><td style="padding:24px">
<h1 style="margin:0 0 14px;font-size:20px;line-height:1.3">${esc(opts.subject)}</h1>
${paras}
<a href="${esc(opts.ctaUrl)}" style="display:inline-block;margin-top:6px;background:#171717;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600;font-size:14px">${esc(opts.ctaText)}</a>
</td></tr></table>
<p style="max-width:520px;margin:14px auto 0;font-size:12px;color:#737373;line-height:1.5">You're getting this because you subscribed to ${esc(store.name)}.
<a href="${esc(opts.unsubscribe)}" style="color:#737373">Unsubscribe</a></p>
</td></tr></table></body></html>`;
  const text = `${opts.subject}\n\n${opts.message}\n\n${opts.ctaText}: ${opts.ctaUrl}\n\n--\nUnsubscribe: ${opts.unsubscribe}`;
  return { html, text };
}

function shopUrl(store: StoreData, path = "") {
  return `${appUrl()}/s/${store.subdomain}${path}`;
}

/** Sends a test email to the seller's own Gmail. */
export async function sendTest(store: StoreData) {
  requireEmailPlan(store);
  const acc = await account(store.subdomain);
  if (!acc) throw new ApiError(400, "Connect your Gmail first.");
  const u = await usage(store.subdomain);
  if (remaining(store, u) < 1) throw new ApiError(429, "You've used all your emails for now.");
  const t = transport(acc.email, open(acc.secret));
  try {
    const body = render(store, {
      subject: "Your store emails are working",
      message: `This is a test from ${store.name}. Your subscribers will get emails that look like this.`,
      ctaText: "Visit the store",
      ctaUrl: shopUrl(store),
      unsubscribe: shopUrl(store),
    });
    await t.sendMail({ from: { name: store.name, address: acc.email }, to: acc.email, subject: `Test email from ${store.name}`, ...body });
  } catch (err) {
    throw gmailError(err);
  } finally {
    t.close();
  }
  await count(store.subdomain, 1);
  return { to: acc.email };
}

/** Sends an email to every subscriber, within the plan's limits. */
export async function sendToSubscribers(
  store: StoreData,
  input: { subject: string; message: string; ctaText?: string; productId?: string }
) {
  requireEmailPlan(store);
  const acc = await account(store.subdomain);
  if (!acc) throw new ApiError(400, "Connect your Gmail first.");
  const subject = String(input.subject || "").trim().slice(0, 150);
  const message = String(input.message || "").trim().slice(0, 5000);
  if (!subject || !message) throw new ApiError(400, "Add a subject and a message.");

  const full = await readStore(store.subdomain);
  const list = Array.from(new Set((full?.subscribers || []).map((s) => s.email.toLowerCase()).filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))));
  if (list.length === 0) throw new ApiError(400, "You don't have any subscribers yet.");

  const u = await usage(store.subdomain);
  const left = remaining(store, u);
  const lim = emailLimitsFor(store.planId);
  if (left < list.length) {
    const why =
      lim.perMonth !== null && lim.perMonth - u.monthCount <= lim.perDay - u.dayCount
        ? `Your plan has ${left} of ${lim.perMonth.toLocaleString("en-IN")} emails left this month`
        : `You can send ${left} more today (Gmail allows about 500 a day)`;
    throw new ApiError(429, `${why}, and this would go to ${list.length} subscribers.${lim.perMonth !== null ? " Pro has no monthly limit." : ""}`);
  }

  const product = input.productId ? store.products.find((p) => p.id === input.productId) : undefined;
  const ctaUrl = product ? shopUrl(store, `/products/${product.slug || product.id}`) : shopUrl(store);
  const ctaText = String(input.ctaText || "").trim().slice(0, 40) || (product ? "View product" : "Shop now");
  const t = transport(acc.email, open(acc.secret));
  let sent = 0;
  const failed: string[] = [];
  try {
    // a few at a time over one pooled Gmail connection
    for (let i = 0; i < list.length; i += 5) {
      const batch = list.slice(i, i + 5);
      const results = await Promise.allSettled(
        batch.map((to) => {
          const unsub = unsubscribeLink(store.subdomain, to);
          const body = render(store, { subject, message, ctaText, ctaUrl, image: product?.images?.[0], unsubscribe: unsub });
          return t.sendMail({
            from: { name: store.name, address: acc.email },
            to,
            subject,
            ...body,
            headers: { "List-Unsubscribe": `<${unsub}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
          });
        })
      );
      results.forEach((r, j) => (r.status === "fulfilled" ? sent++ : failed.push(batch[j])));
      const firstErr = results.find((r) => r.status === "rejected") as PromiseRejectedResult | undefined;
      if (firstErr && sent === 0 && i === 0) throw gmailError(firstErr.reason);
    }
  } finally {
    t.close();
    if (sent) await count(store.subdomain, sent);
  }

  const { priv } = storeRefs(store.subdomain);
  const prev = await priv.get();
  const log = ((prev.exists ? prev.data()?.emailCampaigns : null) || []) as unknown[];
  await priv.set({ emailCampaigns: [...log, { subject, sent, failed: failed.length, at: new Date().toISOString() }].slice(-20) }, { merge: true });
  return { sent, failed: failed.length, total: list.length };
}

/** One-click unsubscribe from a signed link. */
export async function unsubscribe(subRaw: string, emailRaw: string, sig: string): Promise<string | null> {
  const sub = String(subRaw || "").toLowerCase();
  const email = String(emailRaw || "").toLowerCase();
  if (!/^[a-z0-9-]{1,63}$/.test(sub) || !email || !verifySignature(`${sub}|${email}`, sig)) return null;
  const db = adminDb();
  const { pub, priv } = storeRefs(sub);
  let name: string | null = null;
  await db.runTransaction(async (tx) => {
    const [p, q] = await Promise.all([tx.get(pub), tx.get(priv)]);
    if (!p.exists) return;
    name = (p.data()?.name as string) || sub;
    const list = ((q.exists ? q.data()?.subscribers : null) || []) as { email: string }[];
    tx.set(priv, { subscribers: list.filter((s) => s.email.toLowerCase() !== email) }, { merge: true });
    tx.delete(db.collection("subscribers").doc(`${sub}_${email.replace(/[^a-z0-9]/g, "_")}`));
  });
  return name;
}
