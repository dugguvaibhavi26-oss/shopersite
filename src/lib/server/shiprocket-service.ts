import "server-only";
import { planHas } from "../plans";
import { randomBytes } from "node:crypto";
import type { OrderData, StoreData } from "../store-service";
import { effectivePlan } from "../subscription";
import { ApiError } from "./api-error";
import { adminDb } from "./firebase-admin";
import { open, seal } from "./secret-box";
import { readStore } from "./store-data";
import { updateOrder } from "./order-update";

/**
 * Plugins → Shiprocket. Each seller connects their own Shiprocket account (an "API user" made in
 * Shiprocket → Settings → API). From an order we create the Shiprocket order, show courier prices,
 * assign the chosen courier (AWB), book the pickup and get the label; tracking comes back by webhook
 * or "Refresh tracking". The seller pays Shiprocket for shipping; ShoperSite takes nothing.
 */

const BASE = "https://apiv2.shiprocket.in/v1/external";
const ACCOUNTS = "shiprocket_accounts";
const TOKEN_TTL = 8 * 24 * 60 * 60 * 1000; // Shiprocket tokens last 10 days

export interface ShipDefaults {
  /** kg */
  weight: number;
  /** cm */
  length: number;
  breadth: number;
  height: number;
}

interface Account {
  email: string;
  passwordSealed: string;
  tokenSealed?: string;
  tokenAt?: number;
  pickupLocation?: string;
  defaults: ShipDefaults;
  webhookKey: string;
  connectedAt: string;
}

const DEFAULTS: ShipDefaults = { weight: 0.5, length: 20, breadth: 15, height: 5 };

export function canUseShiprocket(store: Pick<StoreData, "planId" | "planPaidUntil">) {
  return planHas(effectivePlan(store as StoreData).planId, "shipping");
}

function requirePlan(store: StoreData) {
  if (!canUseShiprocket(store)) throw new ApiError(403, "The Shiprocket plugin is part of the Growth and Pro plans.");
}

const ref = (sub: string) => adminDb().collection(ACCOUNTS).doc(sub);

async function sr<T>(token: string | null, method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as T & { message?: string; errors?: Record<string, string[]> };
  if (!res.ok) {
    const detail = data.errors ? Object.values(data.errors).flat()[0] : data.message;
    if (res.status === 401) throw new ApiError(401, "Shiprocket didn't accept the login. Check the API user's email and password.");
    if (path.startsWith("/courier/assign/awb")) throw new ApiError(502, assignError(detail));
    throw new ApiError(502, `Shiprocket: ${detail || `error ${res.status}`}`);
  }
  return data;
}

/** Shiprocket's reason a courier couldn't be booked, in plain words. */
export function assignError(raw?: string): string {
  const msg = String(raw || "").trim();
  if (/wallet|balance|recharge|insufficient/i.test(msg)) return "Your Shiprocket wallet doesn't have enough balance. Recharge it in Shiprocket (top bar → wallet), then choose the courier again.";
  if (/kyc/i.test(msg)) return "Shiprocket needs your KYC to be completed before booking couriers. Finish it in Shiprocket, then try again.";
  if (/pickup/i.test(msg)) return `Shiprocket couldn't use your pickup address: ${msg}`;
  return msg ? `Shiprocket: ${msg}` : "That courier couldn't take this shipment. Try another one.";
}

async function login(email: string, password: string): Promise<string> {
  const r = await sr<{ token?: string }>(null, "POST", "/auth/login", { email, password });
  if (!r.token) throw new ApiError(401, "Shiprocket didn't accept the login. Check the API user's email and password.");
  return r.token;
}

async function account(sub: string): Promise<Account | null> {
  const snap = await ref(sub).get();
  return snap.exists ? (snap.data() as Account) : null;
}

async function tokenFor(sub: string): Promise<{ token: string; acc: Account }> {
  const acc = await account(sub);
  if (!acc) throw new ApiError(409, "Connect your Shiprocket account first (Plugins → Shiprocket).");
  if (acc.tokenSealed && acc.tokenAt && Date.now() - acc.tokenAt < TOKEN_TTL) return { token: open(acc.tokenSealed), acc };
  const token = await login(acc.email, open(acc.passwordSealed));
  await ref(sub).update({ tokenSealed: seal(token), tokenAt: Date.now() });
  return { token, acc };
}

interface PickupAddress {
  pickup_location: string;
  address?: string;
  city?: string;
  state?: string;
  pin_code?: string | number;
}

async function pickupLocations(token: string): Promise<PickupAddress[]> {
  const r = await sr<{ data?: { shipping_address?: PickupAddress[] } }>(token, "GET", "/settings/company/pickup");
  return r.data?.shipping_address || [];
}

export function webhookUrl(sub: string) {
  const app = (process.env.NEXT_PUBLIC_APP_URL || "https://www.shopersite.in").replace(/\/$/, "");
  // Shiprocket refuses webhook URLs containing "shiprocket", "kartrocket", "sr" or "kr"
  return `${app}/api/courier-updates?store=${encodeURIComponent(sub)}`;
}

export async function shiprocketStatus(store: StoreData) {
  const acc = await account(store.subdomain);
  if (!acc) return { connected: false as const, allowed: canUseShiprocket(store) };
  let pickups: PickupAddress[] = [];
  try {
    pickups = await pickupLocations((await tokenFor(store.subdomain)).token);
  } catch {
    // shown as connected; the seller sees an error when they ship
  }
  return {
    connected: true as const,
    allowed: canUseShiprocket(store),
    email: acc.email,
    pickupLocation: acc.pickupLocation || pickups[0]?.pickup_location || "",
    pickups: pickups.map((p) => ({ name: p.pickup_location, address: [p.address, p.city, p.state, p.pin_code].filter(Boolean).join(", ") })),
    defaults: acc.defaults,
    webhook: { url: webhookUrl(store.subdomain), token: acc.webhookKey },
  };
}

export async function connectShiprocket(store: StoreData, emailRaw: string, password: string) {
  requirePlan(store);
  const email = emailRaw.trim().toLowerCase();
  const token = await login(email, password);
  const pickups = await pickupLocations(token).catch(() => []);
  const prev = await account(store.subdomain);
  const acc: Account = {
    email,
    passwordSealed: seal(password),
    tokenSealed: seal(token),
    tokenAt: Date.now(),
    pickupLocation: prev?.pickupLocation || pickups[0]?.pickup_location || "",
    defaults: prev?.defaults || DEFAULTS,
    webhookKey: prev?.webhookKey || randomBytes(18).toString("base64url"),
    connectedAt: new Date().toISOString(),
  };
  await ref(store.subdomain).set(acc);
  return shiprocketStatus(store);
}

export async function disconnectShiprocket(store: StoreData) {
  await ref(store.subdomain).delete();
}

export async function saveShiprocketPrefs(store: StoreData, prefs: { pickupLocation: string; defaults: ShipDefaults }) {
  const acc = await account(store.subdomain);
  if (!acc) throw new ApiError(409, "Connect Shiprocket first.");
  const d = prefs.defaults;
  const ok = (n: number, max: number) => Number.isFinite(n) && n > 0 && n <= max;
  if (!ok(d.weight, 50) || !ok(d.length, 200) || !ok(d.breadth, 200) || !ok(d.height, 200)) throw new ApiError(400, "Check the package size and weight.");
  await ref(store.subdomain).update({ pickupLocation: prefs.pickupLocation.slice(0, 80), defaults: d });
  return shiprocketStatus(store);
}

/* ------------------------------ shipping an order ------------------------------ */

function findOrder(store: StoreData, orderId: string): OrderData {
  const o = (store.orders || []).find((x) => x.id === orderId);
  if (!o) throw new ApiError(404, "Order not found.");
  if (o.fulfilmentStatus === "cancelled") throw new ApiError(409, "This order is cancelled.");
  return o;
}

const twoDecimals = (paise: number) => Math.round(paise) / 100;

/** Creates the order in the seller's Shiprocket account (safe to repeat: returns the existing one). */
export async function createShipment(subdomain: string, orderId: string, pkg?: Partial<ShipDefaults>) {
  const store = await readStore(subdomain);
  if (!store) throw new ApiError(404, "Store not found.");
  requirePlan(store);
  const order = findOrder(store, orderId);
  if (order.shiprocket?.shipmentId) return order;
  const { token, acc } = await tokenFor(subdomain);
  if (!acc.pickupLocation) throw new ApiError(409, "Add a pickup address in Shiprocket, then choose it in Plugins → Shiprocket.");
  const size = { ...acc.defaults, ...pkg };
  const [first, ...rest] = order.customer.name.trim().split(/\s+/);
  const created = new Date(order.createdAt);
  const pad = (n: number) => String(n).padStart(2, "0");
  const payload = {
    order_id: order.number.replace("#", "") + "-" + order.id.slice(-6),
    order_date: `${created.getFullYear()}-${pad(created.getMonth() + 1)}-${pad(created.getDate())} ${pad(created.getHours())}:${pad(created.getMinutes())}`,
    pickup_location: acc.pickupLocation,
    billing_customer_name: first || order.customer.name,
    billing_last_name: rest.join(" ") || ".",
    billing_address: order.address.street,
    billing_city: order.address.city,
    billing_pincode: order.address.pincode,
    billing_state: order.address.state,
    billing_country: "India",
    billing_email: order.customer.email || store.contactEmail || "noreply@shopersite.in",
    billing_phone: order.customer.phone.replace(/\D/g, "").slice(-10),
    shipping_is_billing: true,
    order_items: order.items.map((i, n) => ({
      name: (i.title + (i.variantName ? ` (${i.variantName})` : "")).slice(0, 100),
      sku: `${i.productId}`.slice(0, 40) + (i.variantName ? `-${n}` : ""),
      units: i.quantity,
      selling_price: twoDecimals(i.price),
    })),
    payment_method: order.paymentMethod === "cod" ? "COD" : "Prepaid",
    shipping_charges: twoDecimals(order.delivery),
    total_discount: twoDecimals(order.discount),
    sub_total: twoDecimals(order.total),
    length: size.length,
    breadth: size.breadth,
    height: size.height,
    weight: size.weight,
  };
  const r = await sr<{ order_id?: number; shipment_id?: number }>(token, "POST", "/orders/create/adhoc", payload);
  if (!r.order_id || !r.shipment_id) throw new ApiError(502, "Shiprocket didn't create the order. Check the pickup address and try again.");
  return updateOrder(subdomain, orderId, (o) => ({
    ...o,
    shiprocket: { orderId: r.order_id!, shipmentId: r.shipment_id!, updatedAt: new Date().toISOString() },
  }));
}

export interface CourierOption {
  id: number;
  name: string;
  rate: number;
  etd: string;
  rating?: number;
}

/** Couriers that deliver this order, cheapest first. */
export async function courierOptions(subdomain: string, orderId: string): Promise<CourierOption[]> {
  const store = await readStore(subdomain);
  if (!store) throw new ApiError(404, "Store not found.");
  const order = findOrder(store, orderId);
  if (!order.shiprocket) throw new ApiError(409, "Send the order to Shiprocket first.");
  const { token } = await tokenFor(subdomain);
  const r = await sr<{ data?: { available_courier_companies?: { courier_company_id: number; courier_name: string; rate: number; etd?: string; rating?: number }[] } }>(
    token,
    "GET",
    `/courier/serviceability/?order_id=${order.shiprocket.orderId}`
  );
  return (r.data?.available_courier_companies || [])
    .map((c) => ({ id: c.courier_company_id, name: c.courier_name, rate: Math.round(Number(c.rate) || 0), etd: c.etd || "", rating: c.rating }))
    .sort((a, b) => a.rate - b.rate)
    .slice(0, 12);
}

/** Assigns the courier (gets the AWB), books the pickup and fetches the label. */
export async function shipWithCourier(subdomain: string, orderId: string, courierId: number) {
  const store = await readStore(subdomain);
  if (!store) throw new ApiError(404, "Store not found.");
  requirePlan(store);
  const order = findOrder(store, orderId);
  const sh = order.shiprocket;
  if (!sh) throw new ApiError(409, "Send the order to Shiprocket first.");
  const { token } = await tokenFor(subdomain);

  let awb = sh.awb;
  let courierName = order.courierName || "";
  if (!awb) {
    const a = await sr<{
      awb_assign_status?: number;
      message?: string;
      response?: { data?: { awb_code?: string; courier_name?: string; courier_company_id?: number; awb_assign_error?: string } };
    }>(token, "POST", "/courier/assign/awb", {
      shipment_id: sh.shipmentId,
      courier_id: courierId,
    });
    awb = a.response?.data?.awb_code || "";
    courierName = a.response?.data?.courier_name || courierName;
    if (!awb) throw new ApiError(502, assignError(a.response?.data?.awb_assign_error || a.message));
  }
  let pickupBooked = sh.pickupBooked || false;
  if (!pickupBooked) {
    pickupBooked = await sr(token, "POST", "/courier/generate/pickup", { shipment_id: [sh.shipmentId] })
      .then(() => true)
      .catch(() => false);
  }
  const label = await sr<{ label_url?: string }>(token, "POST", "/courier/generate/label", { shipment_id: [sh.shipmentId] }).catch(() => ({ label_url: "" }));

  return updateOrder(subdomain, orderId, (o) => ({
    ...o,
    courierName: courierName || o.courierName,
    trackingNumber: awb,
    trackingUrl: `https://shiprocket.co/tracking/${awb}`,
    fulfilmentStatus: o.fulfilmentStatus === "placed" || o.fulfilmentStatus === "confirmed" ? "packed" : o.fulfilmentStatus,
    shiprocket: { ...sh, awb, courierId, labelUrl: label.label_url || sh.labelUrl, pickupBooked, updatedAt: new Date().toISOString() },
  }));
}

/* ------------------------------ tracking ------------------------------ */

/** Shiprocket's status text → our order step. */
export function stepFor(status: string): OrderData["fulfilmentStatus"] | null {
  const s = status.toUpperCase();
  if (/RTO|RETURN|CANCEL|LOST|DAMAGE/.test(s)) return null; // shown as text; the seller decides
  if (s.includes("DELIVERED")) return "delivered";
  if (/PICKED|SHIPPED|TRANSIT|OUT FOR DELIVERY|REACHED|DISPATCH/.test(s)) return "shipped";
  return null;
}

export async function applyTracking(subdomain: string, orderId: string, status: string) {
  const step = stepFor(status);
  return updateOrder(subdomain, orderId, (o) => {
    const next: OrderData = { ...o, shiprocket: o.shiprocket ? { ...o.shiprocket, status, updatedAt: new Date().toISOString() } : o.shiprocket };
    if (step && o.fulfilmentStatus !== "cancelled" && o.fulfilmentStatus !== "delivered") {
      next.fulfilmentStatus = step;
      if (step === "delivered") next.deliveredAt = new Date().toISOString();
    }
    return next;
  });
}

export async function refreshTracking(subdomain: string, orderId: string) {
  const store = await readStore(subdomain);
  if (!store) throw new ApiError(404, "Store not found.");
  const order = findOrder(store, orderId);
  const awb = order.shiprocket?.awb;
  if (!awb) throw new ApiError(409, "This order doesn't have a courier yet.");
  const { token } = await tokenFor(subdomain);
  const r = await sr<{ tracking_data?: { shipment_track?: { current_status?: string }[]; shipment_status?: number } }>(token, "GET", `/courier/track/awb/${encodeURIComponent(awb)}`);
  const status = r.tracking_data?.shipment_track?.[0]?.current_status || "";
  if (!status) return order;
  return applyTracking(subdomain, orderId, status);
}

/** Shiprocket's webhook: checked against the seller's secret token, then the order is found by AWB. */
export async function handleWebhook(subdomain: string, key: string, body: { awb?: string | number; current_status?: string; shipment_status?: string }) {
  const acc = await account(subdomain);
  if (!acc || !key || key !== acc.webhookKey) throw new ApiError(401, "Bad token.");
  const awb = String(body.awb || "");
  const status = String(body.current_status || body.shipment_status || "");
  if (!awb || !status) return;
  const store = await readStore(subdomain);
  const order = (store?.orders || []).find((o) => o.shiprocket?.awb === awb || o.trackingNumber === awb);
  if (order) await applyTracking(subdomain, order.id, status);
}
