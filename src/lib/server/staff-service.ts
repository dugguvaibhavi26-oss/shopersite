import "server-only";
import { randomBytes, randomInt } from "node:crypto";
import type { CollectionReference } from "firebase-admin/firestore";
import { firebaseConfig } from "../firebase-config";
import { PLATFORM_PLANS } from "../plans";
import { SITE_URL } from "../resources";
import { MAX_STAFF, isStoreCode, passwordProblem, roleCan, roleLabel, type StaffRole, type TeamRole } from "../staff/roles";
import { hashPassword, passwordMatches, readSession, signSession } from "../staff/secure";
import { customerForSupport, financeSummary, orderActions, orderForRole, slugify, type OrderAction, type StaffOrder } from "../staff/views";
import { productProblem, type OrderData, type ProductData, type StoreData } from "../store-service";
import { ApiError } from "./api-error";
import { adminAccessToken, adminDb, getStoreDoc, serverSecret } from "./firebase-admin";
import { restock } from "./order-service";
import { sendPlatformMail } from "./platform-mail";
import { readStore, readStoreTx, storeRefs, writeStoreTx } from "./store-data";

/**
 * Staff accounts (Pro). Staff are not Firebase users: their records live in stores/{sub}/staff,
 * which no browser can read, and they sign in here with the store's 5-digit ID, an email and a
 * password. Everything a staff member sees or changes goes through this file, which checks their
 * role each time.
 *
 * Firestore (all server-only):
 * - store_codes/{code}            → { subdomain }   the 5-digit store ID
 * - stores/{sub}/staff/{id}       → one staff account
 * - stores/{sub}/workplace/{id}   → one WorkPlace message
 */

const clean = <T,>(v: T): T => JSON.parse(JSON.stringify(v));
const PAID = new Set(["paid", "verified"]);

export interface StaffPublic {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  active: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

interface StaffRecord extends StaffPublic {
  salt: string;
  hash: string;
  /** goes up when the password changes or the account is switched off: older sign-ins stop working */
  v: number;
  failed?: number;
  lockedUntil?: number;
}

const staffCol = (sub: string) => storeRefs(sub).pub.collection("staff") as CollectionReference<StaffRecord>;
const toPublic = (s: StaffRecord): StaffPublic => ({
  id: s.id, name: s.name, email: s.email, role: s.role, active: s.active, createdAt: s.createdAt,
  ...(s.lastLoginAt ? { lastLoginAt: s.lastLoginAt } : {}),
});

/* ---------------------------------------------------------------- store ID */

/** The store's 5-digit ID, creating it the first time. Safe to call again and again. */
export async function ensureStoreCode(subdomain: string): Promise<string> {
  const db = adminDb();
  const { pub } = storeRefs(subdomain);
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(pub);
    if (!snap.exists) throw new ApiError(404, "Store not found.");
    const codes = db.collection("store_codes");
    const current = (snap.data() as { storeCode?: string }).storeCode;
    if (isStoreCode(current)) {
      const owner = await tx.get(codes.doc(current));
      if (owner.exists && owner.data()?.subdomain === subdomain) return current;
    }
    for (let i = 0; i < 25; i++) {
      const code = String(randomInt(10000, 100000));
      const taken = await tx.get(codes.doc(code));
      if (taken.exists) continue;
      tx.set(codes.doc(code), { subdomain, createdAt: new Date().toISOString() });
      tx.set(pub, { storeCode: code }, { merge: true });
      return code;
    }
    throw new ApiError(503, "Couldn't create a store ID just now. Please try again.");
  });
}

async function subdomainForCode(code: string): Promise<string | null> {
  if (!isStoreCode(code)) return null;
  const snap = await adminDb().collection("store_codes").doc(code).get();
  const sub = snap.exists ? String(snap.data()?.subdomain || "") : "";
  return sub || null;
}

/* ---------------------------------------------------------------- owner: accounts */

function requirePro(store: StoreData) {
  if (store.planId !== "pro") throw new ApiError(403, "Staff accounts are part of the Pro plan.", "plan");
}

const cleanEmail = (v: string) => v.toLowerCase().trim();
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function listStaff(subdomain: string): Promise<StaffPublic[]> {
  const snap = await staffCol(subdomain).get();
  return snap.docs.map((d) => toPublic(d.data())).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function createStaff(store: StoreData, input: { name: string; email: string; password: string; role: StaffRole }): Promise<{ staff: StaffPublic; emailed: boolean; storeCode: string }> {
  requirePro(store);
  const name = input.name.trim().slice(0, 60);
  const email = cleanEmail(input.email);
  if (!name) throw new ApiError(400, "Enter the staff member's name.");
  if (!EMAIL.test(email) || email.length > 120) throw new ApiError(400, "Enter a valid email address.");
  const problem = passwordProblem(input.password);
  if (problem) throw new ApiError(400, problem);

  const col = staffCol(store.subdomain);
  const existing = await col.get();
  if (existing.size >= MAX_STAFF) throw new ApiError(409, `A store can have up to ${MAX_STAFF} staff accounts. Remove one to add another.`);
  if (existing.docs.some((d) => d.data().email === email)) throw new ApiError(409, "A staff account with this email already exists.");

  const storeCode = await ensureStoreCode(store.subdomain);
  const { salt, hash } = await hashPassword(input.password);
  const ref = col.doc();
  const record: StaffRecord = { id: ref.id, name, email, role: input.role, active: true, createdAt: new Date().toISOString(), salt, hash, v: 1 };
  await ref.set(record);

  let emailed = false;
  try {
    const replyTo = store.contactEmail || store.ownerEmail;
    emailed = await sendPlatformMail({
      to: email,
      subject: `Your staff login for ${store.name}`,
      text: [
        `Hi ${name},`,
        "",
        `${store.name} has added you to their team on Shopersite as ${roleLabel(input.role)}.`,
        "",
        `Sign in here: ${SITE_URL}/staff/login`,
        `Store ID: ${storeCode}`,
        `Email: ${email}`,
        `Password: ${input.password}`,
        "",
        "Please change your password after you sign in (Account, at the bottom of the menu).",
        "If you weren't expecting this email, you can ignore it.",
      ].join("\n"),
      ...(replyTo ? { replyTo } : {}),
    });
  } catch (err) {
    console.error("[staff] login email failed", err);
  }
  return { staff: toPublic(record), emailed, storeCode };
}

export async function updateStaff(store: StoreData, id: string, change: { name?: string; role?: StaffRole; active?: boolean; password?: string }): Promise<StaffPublic> {
  requirePro(store);
  const ref = staffCol(store.subdomain).doc(id);
  const snap = await ref.get();
  const cur = snap.data();
  if (!cur) throw new ApiError(404, "That staff account no longer exists.");
  const next: StaffRecord = { ...cur };
  if (change.name !== undefined) {
    const name = change.name.trim().slice(0, 60);
    if (!name) throw new ApiError(400, "Enter the staff member's name.");
    next.name = name;
  }
  if (change.role) next.role = change.role;
  if (change.active !== undefined && change.active !== cur.active) {
    next.active = change.active;
    next.v = cur.v + 1; // signs them out everywhere
  }
  if (change.password !== undefined) {
    const problem = passwordProblem(change.password);
    if (problem) throw new ApiError(400, problem);
    Object.assign(next, await hashPassword(change.password), { v: cur.v + 1, failed: 0, lockedUntil: 0 });
  }
  await ref.set(next);
  return toPublic(next);
}

export async function deleteStaff(store: StoreData, id: string): Promise<void> {
  await staffCol(store.subdomain).doc(id).delete();
}

/* ---------------------------------------------------------------- staff: sign-in */

const COOKIE = "ss_staff";
const SESSION_MS = 7 * 86400_000;
const sessionKey = () => serverSecret("staff-session");

function cookieHeader(value: string, maxAgeSeconds: number): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}${secure}`;
}

export const clearStaffCookie = () => cookieHeader("", 0);

function readCookie(req: Request): string | null {
  for (const part of (req.headers.get("cookie") || "").split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === COOKIE) return v.join("=");
  }
  return null;
}

/** Requests that change something must come from our own pages, not from another site. */
export function sameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) return;
  let host = "";
  try {
    host = new URL(origin).host;
  } catch {}
  const own = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
  if (host !== own) throw new ApiError(403, "That request isn't allowed.");
}

const WRONG = "The store ID, email or password is wrong.";
const NOT_ON_PLAN = "Staff accounts aren't available on this store's plan right now. Ask the store owner.";

export async function staffLogin(input: { storeCode: string; email: string; password: string }): Promise<{ cookie: string; staff: StaffPublic }> {
  const email = cleanEmail(input.email);
  const sub = await subdomainForCode(input.storeCode.trim());
  const snap = sub ? await staffCol(sub).where("email", "==", email).limit(1).get() : null;
  const doc = snap && !snap.empty ? snap.docs[0] : null;
  const staff = doc?.data();
  if (!sub || !doc || !staff) {
    await hashPassword(input.password); // take as long as a real check would
    throw new ApiError(401, WRONG);
  }
  if ((staff.lockedUntil || 0) > Date.now()) throw new ApiError(429, "Too many wrong passwords. Try again in 15 minutes, or ask the store owner to reset your password.");
  if (!(await passwordMatches(input.password, staff.salt, staff.hash))) {
    const failed = (staff.failed || 0) + 1;
    await doc.ref.set({ failed: failed >= 5 ? 0 : failed, ...(failed >= 5 ? { lockedUntil: Date.now() + 15 * 60_000 } : {}) }, { merge: true });
    throw new ApiError(401, WRONG);
  }
  if (!staff.active) throw new ApiError(403, "This staff account has been switched off. Ask the store owner.");
  const store = await getStoreDoc(sub);
  if (!store) throw new ApiError(401, WRONG);
  if (store.planId !== "pro") throw new ApiError(403, NOT_ON_PLAN);

  const now = new Date().toISOString();
  await doc.ref.set({ failed: 0, lockedUntil: 0, lastLoginAt: now }, { merge: true });
  const token = signSession({ sid: staff.id, sub, v: staff.v, exp: Date.now() + SESSION_MS }, sessionKey());
  return { cookie: cookieHeader(token, SESSION_MS / 1000), staff: toPublic({ ...staff, lastLoginAt: now }) };
}

export interface StaffContext {
  staff: StaffPublic;
  subdomain: string;
  /** the store's public details (no orders or customers) */
  store: StoreData;
}

/** The signed-in staff member behind a request. Re-checks the account and the store's plan every time. */
export async function requireStaff(req: Request): Promise<StaffContext> {
  const session = readSession(readCookie(req), sessionKey());
  if (!session) throw new ApiError(401, "Please sign in.");
  const snap = await staffCol(session.sub).doc(session.sid).get();
  const staff = snap.data();
  if (!staff || !staff.active || staff.v !== session.v) throw new ApiError(401, "Please sign in again.");
  const store = await getStoreDoc(session.sub);
  if (!store) throw new ApiError(401, "Please sign in again.");
  if (store.planId !== "pro") throw new ApiError(403, NOT_ON_PLAN);
  return { staff: toPublic(staff), subdomain: session.sub, store };
}

/** Changes the signed-in staff member's password and returns a fresh cookie for this browser. */
export async function changeOwnPassword(ctx: StaffContext, current: string, next: string): Promise<string> {
  const ref = staffCol(ctx.subdomain).doc(ctx.staff.id);
  const cur = (await ref.get()).data();
  if (!cur || !(await passwordMatches(current, cur.salt, cur.hash))) throw new ApiError(400, "Your current password is wrong.");
  const problem = passwordProblem(next);
  if (problem) throw new ApiError(400, problem);
  const v = cur.v + 1;
  await ref.set({ ...(await hashPassword(next)), v }, { merge: true });
  // this browser stays signed in; every other one is signed out
  return cookieHeader(signSession({ sid: cur.id, sub: ctx.subdomain, v, exp: Date.now() + SESSION_MS }, sessionKey()), SESSION_MS / 1000);
}

/* ---------------------------------------------------------------- staff: what they see */

export async function staffData(ctx: StaffContext) {
  const role = ctx.staff.role;
  const store = await readStore(ctx.subdomain);
  if (!store) throw new ApiError(404, "Store not found.");
  const base = {
    me: ctx.staff,
    store: { name: store.name, subdomain: store.subdomain, logoUrl: store.logoUrl || "", storeCode: store.storeCode || "" },
  };
  if (role === "product_manager") {
    return {
      ...base,
      products: store.products || [],
      categories: (store.categories || []).filter((c) => !c.isParent).map((c) => c.name),
    };
  }
  const orders = [...(store.orders || [])]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((o) => orderForRole(o, role, store.products))
    .filter((o): o is StaffOrder => !!o);
  if (role === "support") return { ...base, orders, customers: (store.customers || []).map(customerForSupport) };
  if (role === "finance") return { ...base, orders, summary: financeSummary(orders) };
  return { ...base, orders };
}

/* ---------------------------------------------------------------- staff: orders */

export interface OrderActionInput {
  id: string;
  action: OrderAction;
  reason?: string;
  courierName?: string;
  trackingNumber?: string;
  trackingUrl?: string;
}

const ACTION_NEEDS: Record<OrderAction, "orders.decide" | "orders.fulfil"> = {
  accept: "orders.decide", reject: "orders.decide", packed: "orders.fulfil", shipped: "orders.fulfil", delivered: "orders.fulfil",
};
const ACTION_SAID: Record<OrderAction, string> = { accept: "accepted", reject: "rejected", packed: "packed", shipped: "shipped", delivered: "marked delivered" };

export async function staffOrderAction(ctx: StaffContext, input: OrderActionInput): Promise<void> {
  const role = ctx.staff.role;
  if (!roleCan(role, ACTION_NEEDS[input.action])) throw new ApiError(403, "Your role can't do that.");
  const reason = (input.reason || "").trim().slice(0, 500);
  if (input.action === "reject" && !reason) throw new ApiError(400, "Say why the order is being rejected. The buyer sees this.");
  const trackingUrl = (input.trackingUrl || "").trim().slice(0, 300);
  if (trackingUrl && !/^https:\/\/[^\s]+$/i.test(trackingUrl)) throw new ApiError(400, "The tracking link must start with https://");

  const db = adminDb();
  const number = await db.runTransaction(async (tx) => {
    const store = await readStoreTx(tx, ctx.subdomain);
    if (!store) throw new ApiError(404, "Store not found.");
    const orders = [...(store.orders || [])];
    const i = orders.findIndex((o) => o.id === input.id);
    if (i < 0) throw new ApiError(404, "Order not found.");
    const order = orders[i];
    if (!orderActions(order, role).includes(input.action)) throw new ApiError(409, "This order has changed since you opened it. Refresh and look again.");
    const now = new Date().toISOString();
    let next: OrderData;
    let products: StoreData["products"] | undefined;

    if (input.action === "accept") next = { ...order, fulfilmentStatus: "confirmed", updatedAt: now };
    else if (input.action === "reject") {
      const owed = PAID.has(order.paymentStatus) || (order.paymentStatus === "awaiting_verification" && !!order.paymentUtr);
      next = {
        ...order,
        fulfilmentStatus: "cancelled",
        cancelledAt: now,
        cancelledBy: "seller",
        cancelReason: reason,
        ...(owed ? { refund: { status: "due" as const, amount: order.total } } : {}),
        updatedAt: now,
      };
      products = restock(store.products, order);
    } else if (input.action === "packed") next = { ...order, fulfilmentStatus: "packed", updatedAt: now };
    else if (input.action === "shipped") {
      const courierName = (input.courierName || "").trim().slice(0, 60);
      const trackingNumber = (input.trackingNumber || "").trim().slice(0, 60);
      next = {
        ...order,
        fulfilmentStatus: "shipped",
        ...(courierName ? { courierName } : {}),
        ...(trackingNumber ? { trackingNumber } : {}),
        ...(trackingUrl ? { trackingUrl } : {}),
        updatedAt: now,
      };
    } else next = { ...order, fulfilmentStatus: "delivered", deliveredAt: order.deliveredAt || now, updatedAt: now };

    orders[i] = next;
    writeStoreTx(tx, ctx.subdomain, products ? { orders, products } : { orders });
    tx.set(db.collection("orders").doc(order.id), clean({ ...next, storeSubdomain: ctx.subdomain }), { merge: true });
    return order.number;
  });

  // tell the team in WorkPlace; the action itself has already succeeded
  await postWorkplace(ctx.subdomain, { id: ctx.staff.id, name: ctx.staff.name, role }, {
    text: `Order ${number} ${ACTION_SAID[input.action]}${input.action === "reject" ? `: ${reason}` : ""}`,
    note: true,
  }).catch((err) => console.error("[staff] workplace note failed", err));
}

/* ---------------------------------------------------------------- staff: products */

export interface ProductInput {
  id?: string;
  title: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  category: string;
  images: string[];
  status: ProductData["status"];
}

const assetPrefix = (sub: string) => `https://firebasestorage.googleapis.com/v0/b/${firebaseConfig.storageBucket}/o/${encodeURIComponent(`store_assets/${sub}/`)}`;

export async function staffSaveProduct(ctx: StaffContext, input: ProductInput): Promise<ProductData> {
  if (!roleCan(ctx.staff.role, "products.edit")) throw new ApiError(403, "Your role can't do that.");
  const title = input.title.trim().slice(0, 140);
  const problem = productProblem({ title, price: input.price, compareAtPrice: input.compareAtPrice || undefined, stock: input.stock });
  if (problem) throw new ApiError(400, problem);

  return adminDb().runTransaction(async (tx) => {
    const store = await readStoreTx(tx, ctx.subdomain);
    if (!store) throw new ApiError(404, "Store not found.");
    const products = [...(store.products || [])];
    const i = input.id ? products.findIndex((p) => p.id === input.id) : -1;
    if (input.id && i < 0) throw new ApiError(404, "That product no longer exists.");
    const old = i >= 0 ? products[i] : null;

    const categories = (store.categories || []).filter((c) => !c.isParent).map((c) => c.name);
    if (input.category !== old?.category && !categories.includes(input.category)) throw new ApiError(400, "Choose one of the store's categories.");
    // photos must be ones uploaded to this store, or ones the product already had
    const prefix = assetPrefix(ctx.subdomain);
    const images = input.images.slice(0, 8);
    if (images.some((u) => !u.startsWith(prefix) && !old?.images?.includes(u))) throw new ApiError(400, "Upload photos with the Add photo button.");

    const fields = {
      title,
      description: input.description.trim().slice(0, 5000),
      price: input.price,
      stock: input.stock,
      category: input.category,
      images,
      status: input.status,
    };
    let next: ProductData;
    if (old) {
      next = { ...old, ...fields };
      if (input.compareAtPrice) next.compareAtPrice = input.compareAtPrice;
      else delete next.compareAtPrice;
      products[i] = next;
    } else {
      const max = PLATFORM_PLANS[store.planId]?.maxProducts ?? 0;
      if (products.length >= max) throw new ApiError(409, "The store has reached its product limit.");
      const slug = slugify(title) || "product";
      next = {
        id: `prod-${ctx.subdomain}-${Date.now().toString(36)}${randomBytes(2).toString("hex")}`,
        storeId: store.id,
        slug: products.some((p) => p.slug === slug) ? `${slug}-${Date.now().toString(36)}` : slug,
        ...fields,
        ...(input.compareAtPrice ? { compareAtPrice: input.compareAtPrice } : {}),
        createdAt: new Date().toISOString(),
      };
      products.unshift(next);
    }
    writeStoreTx(tx, ctx.subdomain, { products });
    return next;
  });
}

const IMAGE_TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

/** Stores one product photo in the store's folder and returns its public link. */
export async function staffUploadImage(ctx: StaffContext, file: File): Promise<string> {
  if (!roleCan(ctx.staff.role, "products.edit")) throw new ApiError(403, "Your role can't do that.");
  const ext = IMAGE_TYPES[file.type];
  if (!ext) throw new ApiError(400, "Photos must be JPG, PNG or WebP.");
  if (file.size > 4 * 1024 * 1024) throw new ApiError(400, "That photo is larger than 4 MB. Choose a smaller one.");
  if (file.size < 1) throw new ApiError(400, "That file is empty.");
  const bucket = firebaseConfig.storageBucket;
  const path = `store_assets/${ctx.subdomain}/staff_${ctx.staff.id}/${Date.now().toString(36)}-${randomBytes(6).toString("hex")}.${ext}`;
  const res = await fetch(`https://storage.googleapis.com/upload/storage/v1/b/${bucket}/o?uploadType=media&ifGenerationMatch=0&name=${encodeURIComponent(path)}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${await adminAccessToken()}`, "Content-Type": file.type },
    body: Buffer.from(await file.arrayBuffer()),
  });
  if (!res.ok) {
    console.error("[staff] photo upload failed", res.status, (await res.text()).slice(0, 300));
    throw new ApiError(502, "The photo couldn't be uploaded. Please try again.");
  }
  return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(path)}?alt=media`;
}

/* ---------------------------------------------------------------- WorkPlace */

export interface WorkplaceMessage {
  id: string;
  text: string;
  at: string;
  by: { id: string; name: string; role: TeamRole };
  urgent?: boolean;
  /** written by the system when a staff member does something (e.g. accepts an order) */
  note?: boolean;
}

const workplaceCol = (sub: string) => storeRefs(sub).pub.collection("workplace") as CollectionReference<WorkplaceMessage>;

export async function postWorkplace(sub: string, by: WorkplaceMessage["by"], input: { text: string; urgent?: boolean; note?: boolean }): Promise<WorkplaceMessage> {
  const text = input.text.trim().slice(0, 1000);
  if (!text) throw new ApiError(400, "Write a message first.");
  const ref = workplaceCol(sub).doc();
  const msg: WorkplaceMessage = {
    id: ref.id, text, at: new Date().toISOString(), by,
    ...(input.urgent ? { urgent: true } : {}),
    ...(input.note ? { note: true } : {}),
  };
  await ref.set(msg);
  return msg;
}

/** The latest messages, oldest first; with `after`, only the ones written since then. */
export async function listWorkplace(sub: string, after?: string): Promise<WorkplaceMessage[]> {
  const col = workplaceCol(sub);
  const q = after && !Number.isNaN(Date.parse(after)) ? col.where("at", ">", after) : col;
  const snap = await q.orderBy("at", "desc").limit(150).get();
  return snap.docs.map((d) => d.data()).reverse();
}
