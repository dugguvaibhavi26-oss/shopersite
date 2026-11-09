import "server-only";
import { siteConfig } from "../config/site";
import type { StoreData } from "../store-service";
import { effectivePlan } from "../subscription";
import { ApiError } from "./api-error";
import { adminDb } from "./firebase-admin";

/**
 * Settings → Domain (Pro): a seller connects their own domain (www.brand.com). The domain is added to
 * the Vercel project, the seller points their DNS at Vercel, and middleware serves the store on it
 * using custom_domains/{domain} (server-written only).
 *
 * Needs VERCEL_API_TOKEN (a Vercel access token with access to the project). The project and team
 * default to this app's; override with VERCEL_PROJECT_ID / VERCEL_TEAM_ID.
 */

const MAP = "custom_domains";
export const VERCEL_A_RECORD = "76.76.21.21";
export const VERCEL_CNAME = "cname.vercel-dns.com";

function vercel() {
  const token = (process.env.VERCEL_API_TOKEN || "").trim();
  const project = process.env.VERCEL_PROJECT_ID || "prj_SB5ow5xHDVujx2jQvpNNddrfyfcJ";
  const team = process.env.VERCEL_TEAM_ID || "team_cn8xsAXUcOGjwnLAXQW7lmmh";
  return { token, project, team, ready: !!token };
}

async function vcall<T>(method: string, path: string, body?: unknown): Promise<{ ok: boolean; status: number; data: T & { error?: { code?: string; message?: string } } }> {
  const v = vercel();
  if (!v.ready) throw new ApiError(503, "Custom domains aren't switched on yet. Please contact support.");
  const sep = path.includes("?") ? "&" : "?";
  const res = await fetch(`https://api.vercel.com${path}${sep}teamId=${encodeURIComponent(v.team)}`, {
    method,
    headers: { Authorization: `Bearer ${v.token}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

/** "https://WWW.Brand.com/shop" → "www.brand.com"; null when it isn't a usable domain. */
export function normalizeDomain(input: string): string | null {
  let d = String(input || "").trim().toLowerCase();
  d = d.replace(/^[a-z]+:\/\//, "").replace(/[/?#].*$/, "").replace(/:\d+$/, "").replace(/\.$/, "");
  if (d.length < 4 || d.length > 253) return null;
  if (!/^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24}$/.test(d)) return null;
  const own = siteConfig.domain.toLowerCase();
  if (d === own || d.endsWith(`.${own}`) || d.endsWith(".vercel.app") || d.endsWith(".localhost")) return null;
  return d;
}

export const isApex = (d: string) => d.split(".").length === 2 || /\.(co|org|net|gov|ac|edu)\.[a-z]{2}$/.test(d) && d.split(".").length === 3;

/** The DNS record the seller must add for this domain. */
export function dnsRecordFor(domain: string) {
  return isApex(domain)
    ? { type: "A", name: "@", value: VERCEL_A_RECORD }
    : { type: "CNAME", name: domain.split(".")[0], value: VERCEL_CNAME };
}

export interface DomainStatus {
  domain: string | null;
  /** Vercel can serve it: DNS points at us and any ownership check passed */
  live: boolean;
  dns: { type: string; name: string; value: string } | null;
  /** extra TXT record Vercel asks for when the domain is already used elsewhere */
  verification: { type: string; domain: string; value: string }[];
  configured: boolean;
  available: boolean;
}

export async function domainStatus(store: StoreData): Promise<DomainStatus> {
  const domain = store.customDomain || null;
  const base = { domain, live: false, dns: domain ? dnsRecordFor(domain) : null, verification: [], configured: false, available: vercel().ready };
  if (!domain || !vercel().ready) return base;
  const v = vercel();
  const [info, config] = await Promise.all([
    vcall<{ verified?: boolean; verification?: { type: string; domain: string; value: string }[] }>("GET", `/v9/projects/${v.project}/domains/${domain}`),
    vcall<{ misconfigured?: boolean }>("GET", `/v6/domains/${domain}/config`),
  ]);
  const verified = info.ok && info.data.verified !== false;
  const configured = config.ok && config.data.misconfigured === false;
  return { ...base, live: verified && configured, configured, verification: info.data.verification || [] };
}

export async function connectDomain(store: StoreData, raw: string): Promise<DomainStatus> {
  if (effectivePlan(store).planId !== "pro") throw new ApiError(403, "Connecting your own domain is part of the Pro plan.");
  const domain = normalizeDomain(raw);
  if (!domain) throw new ApiError(400, "Enter a domain you own, like www.yourbrand.com.");
  if (store.customDomain === domain) return domainStatus(store);
  if (store.customDomain) throw new ApiError(409, "Remove your current domain first.");

  const db = adminDb();
  const mapRef = db.collection(MAP).doc(domain);
  const taken = await mapRef.get();
  if (taken.exists && taken.get("subdomain") !== store.subdomain) throw new ApiError(409, "That domain is already connected to another store.");

  const v = vercel();
  const added = await vcall<{ name?: string }>("POST", `/v10/projects/${v.project}/domains`, { name: domain });
  if (!added.ok && added.data.error?.code !== "domain_already_in_use_by_project" && added.status !== 409) {
    const msg = added.data.error?.message || "";
    throw new ApiError(400, msg.includes("in use") ? "That domain is being used by another website on Vercel. Remove it there first." : `Couldn't add the domain${msg ? `: ${msg}` : "."}`);
  }

  const now = new Date().toISOString();
  await mapRef.set({ subdomain: store.subdomain, addedAt: now });
  await db.collection("stores").doc(store.subdomain).update({ customDomain: domain, updatedAt: now });
  await allowSignInOn(domain).catch((err) => console.error("[domains] couldn't add auth domain", err));
  return domainStatus({ ...store, customDomain: domain });
}

export async function removeDomain(store: StoreData) {
  const domain = store.customDomain;
  if (!domain) return;
  const v = vercel();
  if (v.ready) await vcall("DELETE", `/v9/projects/${v.project}/domains/${domain}`).catch(() => null);
  const db = adminDb();
  await db.collection(MAP).doc(domain).delete();
  await db.collection("stores").doc(store.subdomain).update({ customDomain: null, updatedAt: new Date().toISOString() });
}

/** Which store a custom domain belongs to (for middleware). */
export async function storeForHost(host: string): Promise<string | null> {
  const domain = normalizeDomain(host);
  if (!domain) return null;
  const snap = await adminDb().collection(MAP).doc(domain).get();
  return snap.exists ? (snap.get("subdomain") as string) : null;
}

/** Lets buyers sign in on the custom domain (Firebase only allows sign-in pop-ups on listed domains). */
async function allowSignInOn(domain: string) {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT || "";
  if (!raw) return;
  const sa = JSON.parse(raw.trim().startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf8"));
  const { cert } = await import("firebase-admin/app");
  const token = (await cert({ projectId: sa.project_id, clientEmail: sa.client_email, privateKey: sa.private_key }).getAccessToken()).access_token;
  const url = `https://identitytoolkit.googleapis.com/admin/v2/projects/${sa.project_id}/config`;
  const current = await fetch(url, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json());
  const list: string[] = current.authorizedDomains || [];
  if (list.includes(domain)) return;
  await fetch(`${url}?updateMask=authorizedDomains`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ authorizedDomains: [...list, domain] }),
  });
}
