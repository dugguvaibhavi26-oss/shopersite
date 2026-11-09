import "server-only";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import type { DiscountData, OrderData, ProductData, StoreData } from "../../store-service";
import { applyPlanAccess, canAddProduct, canUseCoupons, canUseReviews } from "../../plans";
import { searchHelp } from "../../assistant/help";
import { PAGE_LABELS, type DashPage, type OrderStep } from "../../assistant/commands";
import { ApiError } from "../api-error";
import { adminDb } from "../firebase-admin";
import { open, seal } from "../secret-box";
import { readStoreTx, writeStoreTx } from "../store-data";
import { updateOrder } from "../order-update";
import type { ToolDef } from "./providers";

/**
 * What the assistant can do. It never touches the database directly: it can only call these
 * functions, each checked like the dashboard's own buttons.
 *
 * - Read tools run straight away and return small summaries. Buyers' phone numbers, emails and
 *   addresses are never included, so they never reach an AI provider.
 * - Write tools only *prepare* a change. The seller sees a Confirm card; the change runs when they
 *   tap Confirm (a sealed token carries exactly what was shown, so nothing can be swapped in).
 * - Payments, bank details, plans, domain, deleting things, cancelling orders and turning the shop
 *   on or off are not here at all: those stay manual.
 */

export type ClientAction = { type: "navigate"; page: DashPage; action?: "add-product" };

/** A button in a reply that takes the seller to a place in the dashboard (optionally one order). */
export interface DashLink {
  page: DashPage;
  label: string;
  orderId?: string;
}

export interface Proposal {
  id: string;
  action: WriteName;
  title: string;
  lines: string[];
  token: string;
  /** where to see the change once it's saved */
  link?: DashLink;
}

const planName = (id?: string) => (id === "starter" ? "Growth" : id === "pro" ? "Pro" : "Free");
const rupees = (paise: number) => `₹${(Math.round(paise) / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const toPaise = (r: number) => Math.round(r * 100);
const firstName = (n?: string) => (n || "").trim().split(/\s+/)[0] || "Buyer";
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const day = (iso?: string) => (iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" }) : "");
const clip = (s: string | undefined, n: number) => ((s || "").length > n ? `${(s || "").slice(0, n)}…` : s || "");

/* ------------------------------ definitions ------------------------------ */

const fn = (name: string, description: string, properties: Record<string, unknown> = {}, required: string[] = []): ToolDef => ({
  type: "function",
  function: { name, description, parameters: { type: "object", properties, required } },
});
const str = (description: string) => ({ type: "string", description });
const numP = (description: string) => ({ type: "number", description });

export const READ_TOOLS: ToolDef[] = [
  fn("store_overview", "Shop summary: plan, open/closed, counts, sales today/this week/this month, pending orders, low stock, missing setup steps."),
  fn("find_products", "Search the shop's products. Returns id, title, price (₹), MRP, stock, status, category.", {
    query: str("words in the product name or category; empty for all"),
    filter: { type: "string", enum: ["all", "low_stock", "out_of_stock", "draft", "hidden", "published"] },
  }),
  fn("find_orders", "Search orders. Returns order number, date, buyer first name, items, total (₹), payment and status. No contact details.", {
    status: { type: "string", enum: ["any", "placed", "confirmed", "packed", "shipped", "delivered", "cancelled", "awaiting_payment_check"] },
    days: numP("only orders from the last N days"),
    query: str("order number, buyer first name or product name"),
  }),
  fn("find_customers", "Search customers. Returns first name, number of orders, last order date. No contact details.", {
    query: str("name"),
    sort: { type: "string", enum: ["recent", "most_orders"] },
  }),
  fn("list_categories", "The shop's categories with product counts."),
  fn("list_discounts", "The shop's coupon codes."),
  fn("list_reviews", "The shop's reviews.", { filter: { type: "string", enum: ["all", "waiting", "live"] } }),
  fn("search_help", "Search Shopersite's help guides (how features work, where settings are, what plans include). Use for any how-to question.", { query: str("the question") }, ["query"]),
  fn("open_page", "Switch the dashboard to a page right now. Only when the seller asks to go/open somewhere.", {
    page: { type: "string", enum: Object.keys(PAGE_LABELS) },
  }, ["page"]),
  fn(
    "show_link",
    "Add a button under your reply that takes the seller to a dashboard page (or one order). Use it whenever you mention where something is, answer 'where is…', explain a setting, or when a next step lives on a page. Up to 3 per reply.",
    {
      page: { type: "string", enum: Object.keys(PAGE_LABELS) },
      label: str("short button text, e.g. 'Open Discounts' or 'View order #1043'"),
      order_number: str("optional: link straight to this order"),
    },
    ["page"]
  ),
];

export const WRITE_TOOLS: ToolDef[] = [
  fn("create_product", "Prepare a new product (seller confirms). Saved as a draft unless publish is true; photos are added by the seller.", {
    title: str("product name"),
    price: numP("selling price in rupees"),
    mrp: numP("optional original price in rupees, higher than price"),
    stock: numP("units in stock"),
    category: str("category name (existing, or a new one)"),
    description: str("short product description"),
    publish: { type: "boolean" },
  }, ["title", "price"]),
  fn("update_product", "Prepare changes to one product (seller confirms). Only send fields that change.", {
    product_id: str("id from find_products"),
    title: str("new name"),
    price: numP("new price in rupees"),
    mrp: numP("new MRP in rupees, 0 to remove"),
    stock: numP("new stock"),
    status: { type: "string", enum: ["published", "draft", "hidden"] },
    category: str("category name"),
    description: str("new description"),
  }, ["product_id"]),
  fn("create_category", "Prepare a new category (seller confirms).", { name: str("category name"), description: str("optional") }, ["name"]),
  fn("create_discount", "Prepare a coupon code (seller confirms).", {
    code: str("e.g. DIWALI10"),
    type: { type: "string", enum: ["percentage", "flat"] },
    value: numP("percent (1-90) or flat rupees off"),
    min_order: numP("optional minimum order in rupees"),
    max_discount: numP("optional maximum discount in rupees (percentage coupons)"),
    days_valid: numP("optional: ends after this many days"),
  }, ["code", "type", "value"]),
  fn("set_discount_active", "Prepare turning a coupon on or off (seller confirms).", { discount_id: str("id from list_discounts"), active: { type: "boolean" } }, ["discount_id", "active"]),
  fn("update_order_status", "Prepare moving an order to the next step (seller confirms). Cancelling is not allowed here.", {
    order_number: str("e.g. 1043 or #1043"),
    status: { type: "string", enum: ["confirmed", "packed", "shipped", "delivered"] },
    courier: str("optional courier name (shipped)"),
    tracking_number: str("optional tracking number (shipped)"),
  }, ["order_number", "status"]),
  fn("set_review_status", "Prepare approving or hiding a review (seller confirms).", { review_id: str("id from list_reviews"), status: { type: "string", enum: ["approved", "pending"] } }, ["review_id", "status"]),
  fn("update_shop_text", "Prepare changing the shop's tagline or announcement bar text (seller confirms).", {
    tagline: str("new tagline"),
    announcement: str("new announcement bar text; empty to remove"),
  }),
];

export const ALL_TOOLS = [...READ_TOOLS, ...WRITE_TOOLS];
const WRITE_NAMES = ["create_product", "update_product", "create_category", "create_discount", "set_discount_active", "update_order_status", "set_review_status", "update_shop_text"] as const;
export type WriteName = (typeof WRITE_NAMES)[number];
export const isWrite = (name: string): name is WriteName => (WRITE_NAMES as readonly string[]).includes(name);

/* ------------------------------ reads ------------------------------ */

const IST = 5.5 * 3600_000;
const startOfIstDay = (now = Date.now()) => Math.floor((now + IST) / 86400_000) * 86400_000 - IST;
const countable = (o: OrderData) => o.fulfilmentStatus !== "cancelled" && o.paymentStatus !== "rejected";

function orderLine(o: OrderData) {
  return {
    number: o.number,
    id: o.id,
    date: day(o.createdAt),
    buyer: firstName(o.customer?.name),
    items: o.items.map((i) => `${i.quantity}× ${clip(i.title, 40)}${i.variantName ? ` (${i.variantName})` : ""}`).join(", "),
    total: rupees(o.total),
    payment: `${o.paymentMethod}/${o.paymentStatus}`,
    status: o.fulfilmentStatus,
    ...(o.trackingNumber ? { tracking: `${o.courierName || ""} ${o.trackingNumber}`.trim() } : {}),
  };
}

function productLine(p: ProductData) {
  return { id: p.id, title: p.title, price: rupees(p.price), ...(p.compareAtPrice ? { mrp: rupees(p.compareAtPrice) } : {}), stock: p.stock, status: p.status, category: p.category };
}

const matches = (hay: string, q: string) => {
  const words = norm(q).split(" ").filter(Boolean);
  const h = norm(hay);
  return words.every((w) => h.includes(w));
};

export function runRead(name: string, rawArgs: Record<string, unknown>, store: StoreData): { result: unknown; client?: ClientAction; link?: DashLink } {
  const a = rawArgs || {};
  const s = (k: string) => (typeof a[k] === "string" ? (a[k] as string).trim() : "");
  switch (name) {
    case "store_overview": {
      const orders = store.orders || [];
      const today = startOfIstDay();
      const sum = (since: number) => {
        const list = orders.filter((o) => countable(o) && Date.parse(o.createdAt) >= since);
        return { orders: list.length, sales: rupees(list.reduce((n, o) => n + o.total, 0)) };
      };
      const missing: string[] = [];
      if (!store.products?.length) missing.push("no products yet");
      if (!store.policies || !Object.values(store.policies).some((p) => p && (p as { content?: string }).content)) missing.push("no policy page (shop stays closed)");
      return {
        result: {
          shop: store.name,
          link: `${store.subdomain}.shopersite.in`,
          plan: store.planId === "starter" ? "Growth" : store.planId === "pro" ? "Pro" : "Free",
          open: !store.isClosed && !store.isPaused,
          products: store.products?.length || 0,
          customers: store.customers?.length || 0,
          today: sum(today),
          last7days: sum(today - 6 * 86400_000),
          last30days: sum(today - 29 * 86400_000),
          waitingToShip: orders.filter((o) => ["placed", "confirmed", "packed"].includes(o.fulfilmentStatus)).length,
          paymentsToCheck: orders.filter((o) => o.paymentStatus === "awaiting_verification").length,
          lowStock: (store.products || []).filter((p) => p.status === "published" && p.stock <= 3).map((p) => `${p.title} (${p.stock})`).slice(0, 10),
          reviewsWaiting: (store.reviews || []).filter((r) => r.status === "pending").length,
          missing,
        },
      };
    }
    case "find_products": {
      const q = s("query");
      const f = s("filter") || "all";
      const list = (store.products || [])
        .filter((p) => !q || matches(`${p.title} ${p.category}`, q))
        .filter((p) => (f === "low_stock" ? p.stock > 0 && p.stock <= 3 : f === "out_of_stock" ? p.stock <= 0 : f === "all" ? true : p.status === f));
      return { result: { count: list.length, products: list.slice(0, 25).map(productLine) } };
    }
    case "find_orders": {
      const status = s("status") || "any";
      const days = typeof a.days === "number" && a.days > 0 ? a.days : 0;
      const q = s("query").replace(/^#/, "");
      const since = days ? Date.now() - days * 86400_000 : 0;
      const list = (store.orders || [])
        .filter((o) => (status === "any" ? true : status === "awaiting_payment_check" ? o.paymentStatus === "awaiting_verification" : o.fulfilmentStatus === status))
        .filter((o) => !since || Date.parse(o.createdAt) >= since)
        .filter((o) => !q || o.number.replace("#", "") === q || matches(`${firstName(o.customer?.name)} ${o.items.map((i) => i.title).join(" ")}`, q))
        .sort((x, y) => y.createdAt.localeCompare(x.createdAt));
      return { result: { count: list.length, orders: list.slice(0, 20).map(orderLine) } };
    }
    case "find_customers": {
      const q = s("query");
      const list = (store.customers || [])
        .filter((c) => !q || matches(c.name, q))
        .sort((x, y) => (s("sort") === "most_orders" ? y.totalOrders - x.totalOrders : (y.lastOrderAt || "").localeCompare(x.lastOrderAt || "")));
      return { result: { count: list.length, customers: list.slice(0, 25).map((c) => ({ name: firstName(c.name), orders: c.totalOrders, lastOrder: day(c.lastOrderAt) })) } };
    }
    case "list_categories":
      return { result: (store.categories || []).filter((c) => !c.isParent).map((c) => ({ name: c.name, products: (store.products || []).filter((p) => p.category === c.name).length, active: c.isActive })) };
    case "list_discounts":
      return {
        result: canUseCoupons(store.planId)
          ? (store.discounts || []).map((d) => ({ id: d.id, code: d.code, off: d.type === "percentage" ? `${d.value}%` : rupees(d.value), active: d.isActive, used: d.timesUsed, ...(d.expiresAt ? { ends: day(d.expiresAt) } : {}) }))
          : { note: `This shop is on the ${planName(store.planId)} plan. Coupons are on the Growth and Pro plans.` },
      };
    case "list_reviews": {
      const f = s("filter") || "all";
      const list = (store.reviews || []).filter((r) => (f === "waiting" ? r.status === "pending" : f === "live" ? r.status === "approved" : true));
      const title = (id: string) => store.products?.find((p) => p.id === id)?.title || "";
      return { result: list.slice(0, 20).map((r) => ({ id: r.id, rating: r.rating, by: firstName(r.customerName), product: title(r.productId), text: clip(r.comment, 160), status: r.status === "approved" ? "live" : "waiting", date: day(r.createdAt) })) };
    }
    case "search_help": {
      const found = searchHelp(s("query"));
      return { result: found.length ? found.map((h) => ({ title: h.title, guide: h.body })) : { note: "No guide found. Suggest the Help button or Settings." } };
    }
    case "open_page": {
      const page = s("page") as DashPage;
      if (!(page in PAGE_LABELS)) return { result: { error: "Unknown page." } };
      return { result: { opened: PAGE_LABELS[page] }, client: { type: "navigate", page } };
    }
    case "show_link": {
      const page = s("page") as DashPage;
      if (!(page in PAGE_LABELS)) return { result: { error: "Unknown page." } };
      const o = s("order_number") ? findOrder(store, s("order_number")) : undefined;
      const label = clip(s("label") || (o ? `View order ${o.number}` : `Open ${PAGE_LABELS[page]}`), 40);
      return { result: { shown: label }, link: { page: o ? "orders" : page, label, ...(o ? { orderId: o.id } : {}) } };
    }
    default:
      return { result: { error: "Unknown tool." } };
  }
}

/** Where to see a change after it's saved. */
export function linkFor(name: WriteName, args: Record<string, unknown>): DashLink {
  switch (name) {
    case "create_product":
    case "update_product":
      return { page: "products", label: "View in Products" };
    case "create_category":
      return { page: "categories", label: "View in Categories" };
    case "create_discount":
    case "set_discount_active":
      return { page: "discounts", label: "View in Discounts" };
    case "update_order_status":
      return { page: "orders", label: "View order", ...(typeof args.order_id === "string" ? { orderId: args.order_id } : {}) };
    case "set_review_status":
      return { page: "reviews", label: "View in Reviews" };
    case "update_shop_text":
      return { page: "settings", label: "View in Settings" };
  }
}

/* ------------------------------ writes: prepare ------------------------------ */

const money = z.coerce.number().finite().positive().max(1_000_000);
const S = {
  create_product: z.object({
    title: z.string().trim().min(1).max(140),
    price: money,
    mrp: z.coerce.number().finite().min(0).max(1_000_000).optional(),
    stock: z.coerce.number().int().min(0).max(1_000_000).optional(),
    category: z.string().trim().max(60).optional(),
    description: z.string().trim().max(3000).optional(),
    publish: z.boolean().optional(),
  }),
  update_product: z.object({
    product_id: z.string().min(1).max(120),
    title: z.string().trim().min(1).max(140).optional(),
    price: money.optional(),
    mrp: z.coerce.number().finite().min(0).max(1_000_000).optional(),
    stock: z.coerce.number().int().min(0).max(1_000_000).optional(),
    status: z.enum(["published", "draft", "hidden"]).optional(),
    category: z.string().trim().min(1).max(60).optional(),
    description: z.string().trim().max(3000).optional(),
  }),
  create_category: z.object({ name: z.string().trim().min(1).max(60), description: z.string().trim().max(300).optional() }),
  create_discount: z.object({
    code: z.string().trim().min(3).max(20).regex(/^[A-Za-z0-9_-]+$/, "Codes use letters and numbers only."),
    type: z.enum(["percentage", "flat"]),
    value: z.coerce.number().finite().positive(),
    min_order: z.coerce.number().finite().min(0).max(1_000_000).optional(),
    max_discount: z.coerce.number().finite().min(0).max(1_000_000).optional(),
    days_valid: z.coerce.number().int().min(1).max(365).optional(),
  }),
  set_discount_active: z.object({ discount_id: z.string().min(1).max(80), active: z.boolean() }),
  update_order_status: z.object({
    order_number: z.coerce.string().min(1).max(20),
    status: z.enum(["confirmed", "packed", "shipped", "delivered"]),
    courier: z.string().trim().max(60).optional(),
    tracking_number: z.string().trim().max(60).optional(),
  }),
  set_review_status: z.object({ review_id: z.string().min(1).max(80), status: z.enum(["approved", "pending"]) }),
  update_shop_text: z.object({ tagline: z.string().trim().max(120).optional(), announcement: z.string().trim().max(160).optional() }),
} satisfies Record<WriteName, z.ZodTypeAny>;

type Args<N extends WriteName> = z.infer<(typeof S)[N]>;

/** Plan limits as the admin set them (the defaults if not set). */
export { loadPlanAccess } from "../plan-access";

const findProduct = (store: StoreData, id: string) => (store.products || []).find((p) => p.id === id);
const findOrder = (store: StoreData, n: string) => (store.orders || []).find((o) => o.number.replace("#", "") === n.replace(/^#/, "").trim());
const STEP_ORDER: Record<string, number> = { placed: 0, confirmed: 1, packed: 2, shipped: 3, delivered: 4 };

/** Checks a write against the store and describes it for the Confirm card. Throws a plain-language ApiError. */
export function describeWrite(name: WriteName, raw: unknown, store: StoreData): { args: Record<string, unknown>; title: string; lines: string[] } {
  const parsed = S[name].safeParse(raw);
  if (!parsed.success) throw new ApiError(400, parsed.error.issues[0]?.message || "Some details are missing.");
  switch (name) {
    case "create_product": {
      const a = parsed.data as Args<"create_product">;
      const quota = canAddProduct(store.products?.length || 0, store.planId);
      if (!quota.allowed) throw new ApiError(400, `The plan allows ${quota.limit} products and the shop has reached it. Upgrade in Plan & billing to add more.`);
      if (a.mrp && a.mrp <= a.price) throw new ApiError(400, "MRP must be higher than the selling price.");
      return {
        args: a,
        title: `Add product “${a.title}”`,
        lines: [
          `Price ${rupees(toPaise(a.price))}${a.mrp ? ` (MRP ${rupees(toPaise(a.mrp))})` : ""}`,
          `Stock ${a.stock ?? 1}${a.category ? ` · ${a.category}` : ""}`,
          a.publish ? "Visible on the shop" : "Saved as a draft: add a photo, then publish",
          ...(a.description ? [clip(a.description, 140)] : []),
        ],
      };
    }
    case "update_product": {
      const a = parsed.data as Args<"update_product">;
      const p = findProduct(store, a.product_id);
      if (!p) throw new ApiError(400, "That product wasn't found. Search products first.");
      const lines: string[] = [];
      const price = a.price !== undefined ? toPaise(a.price) : p.price;
      const mrp = a.mrp !== undefined ? toPaise(a.mrp) : p.compareAtPrice || 0;
      if (mrp && mrp <= price) throw new ApiError(400, "MRP must be higher than the selling price.");
      if (a.title !== undefined && a.title !== p.title) lines.push(`Name: ${p.title} → ${a.title}`);
      if (a.price !== undefined && price !== p.price) lines.push(`Price: ${rupees(p.price)} → ${rupees(price)}`);
      if (a.mrp !== undefined && mrp !== (p.compareAtPrice || 0)) lines.push(mrp ? `MRP: ${p.compareAtPrice ? rupees(p.compareAtPrice) : "none"} → ${rupees(mrp)}` : "Remove MRP");
      if (a.stock !== undefined && a.stock !== p.stock) lines.push(`Stock: ${p.stock} → ${a.stock}`);
      if (a.status && a.status !== p.status) lines.push(`Status: ${p.status} → ${a.status}`);
      if (a.category && a.category !== p.category) lines.push(`Category: ${p.category || "none"} → ${a.category}`);
      if (a.description !== undefined && a.description !== p.description) lines.push(`New description: ${clip(a.description, 140)}`);
      if (!lines.length) throw new ApiError(400, "Nothing would change.");
      return { args: a, title: `Edit “${p.title}”`, lines };
    }
    case "create_category": {
      const a = parsed.data as Args<"create_category">;
      if ((store.categories || []).some((c) => norm(c.name) === norm(a.name))) throw new ApiError(400, `A category called “${a.name}” already exists.`);
      return { args: a, title: `Add category “${a.name}”`, lines: a.description ? [a.description] : [] };
    }
    case "create_discount": {
      const a = parsed.data as Args<"create_discount">;
      if (!canUseCoupons(store.planId)) throw new ApiError(400, `This shop is on the ${planName(store.planId)} plan. Coupons are on the Growth and Pro plans.`);
      if (a.type === "percentage" && (a.value < 1 || a.value > 90)) throw new ApiError(400, "A percentage coupon can be 1% to 90% off (not 100%). Coupons apply to any order; they can't be limited to first orders.");
      if (a.type === "flat" && a.value > 100_000) throw new ApiError(400, "That flat discount is too large.");
      const code = a.code.toUpperCase();
      if ((store.discounts || []).some((d) => d.code === code)) throw new ApiError(400, `The code ${code} already exists.`);
      return {
        args: { ...a, code },
        title: `Create coupon ${code}`,
        lines: [
          a.type === "percentage" ? `${a.value}% off${a.max_discount ? `, up to ${rupees(toPaise(a.max_discount))}` : ""}` : `${rupees(toPaise(a.value))} off`,
          ...(a.min_order ? [`On orders above ${rupees(toPaise(a.min_order))}`] : []),
          a.days_valid ? `Ends in ${a.days_valid} day${a.days_valid === 1 ? "" : "s"}` : "No end date",
        ],
      };
    }
    case "set_discount_active": {
      const a = parsed.data as Args<"set_discount_active">;
      const d = (store.discounts || []).find((x) => x.id === a.discount_id);
      if (!d) throw new ApiError(400, "That coupon wasn't found.");
      if (d.isActive === a.active) throw new ApiError(400, `${d.code} is already ${a.active ? "on" : "off"}.`);
      return { args: a, title: `${a.active ? "Turn on" : "Turn off"} coupon ${d.code}`, lines: [] };
    }
    case "update_order_status": {
      const a = parsed.data as Args<"update_order_status">;
      const o = findOrder(store, a.order_number);
      if (!o) throw new ApiError(400, `Order ${a.order_number} wasn't found.`);
      if (o.fulfilmentStatus === "cancelled") throw new ApiError(400, `Order ${o.number} is cancelled.`);
      if (STEP_ORDER[a.status] <= (STEP_ORDER[o.fulfilmentStatus] ?? 0)) throw new ApiError(400, `Order ${o.number} is already ${o.fulfilmentStatus}.`);
      if (o.paymentStatus === "awaiting_verification" || o.paymentStatus === "rejected") throw new ApiError(400, `Check order ${o.number}'s payment on the order page first.`);
      return {
        args: { ...a, order_id: o.id },
        title: `Mark order ${o.number} as ${a.status}`,
        lines: [
          `${firstName(o.customer?.name)} · ${o.items.map((i) => `${i.quantity}× ${clip(i.title, 30)}`).join(", ")} · ${rupees(o.total)}`,
          `${o.fulfilmentStatus} → ${a.status}`,
          ...(a.courier || a.tracking_number ? [`${a.courier || "Courier"} ${a.tracking_number || ""}`.trim()] : []),
        ],
      };
    }
    case "set_review_status": {
      const a = parsed.data as Args<"set_review_status">;
      if (!canUseReviews(store.planId)) throw new ApiError(400, `This shop is on the ${planName(store.planId)} plan. Reviews are on the Growth and Pro plans.`);
      const r = (store.reviews || []).find((x) => x.id === a.review_id);
      if (!r) throw new ApiError(400, "That review wasn't found.");
      return { args: a, title: `${a.status === "approved" ? "Show" : "Hide"} ${firstName(r.customerName)}'s review`, lines: [`${"★".repeat(Math.round(r.rating))} ${clip(r.comment, 120)}`] };
    }
    case "update_shop_text": {
      const a = parsed.data as Args<"update_shop_text">;
      const lines: string[] = [];
      if (a.tagline !== undefined && a.tagline !== store.tagline) lines.push(`Tagline: ${a.tagline || "(none)"}`);
      if (a.announcement !== undefined && a.announcement !== (store.announcementText || "")) lines.push(a.announcement ? `Announcement: ${a.announcement}` : "Remove the announcement bar");
      if (!lines.length) throw new ApiError(400, "Nothing would change.");
      return { args: a, title: "Update shop text", lines };
    }
  }
}

/* ------------------------------ proposals ------------------------------ */

interface Sealed {
  v: 1;
  sub: string;
  uid: string;
  action: WriteName;
  args: Record<string, unknown>;
  exp: number;
}

export function makeProposal(sub: string, uid: string, name: WriteName, raw: unknown, store: StoreData): Proposal {
  const d = describeWrite(name, raw, store);
  const body: Sealed = { v: 1, sub, uid, action: name, args: d.args, exp: Date.now() + 30 * 60_000 };
  return { id: randomBytes(6).toString("hex"), action: name, title: d.title, lines: d.lines, token: seal(JSON.stringify(body)), link: linkFor(name, d.args) };
}

export function readProposal(token: string, sub: string, uid: string): Sealed {
  let body: Sealed;
  try {
    body = JSON.parse(open(token));
  } catch {
    throw new ApiError(400, "This change can't be confirmed. Ask again.");
  }
  if (body.v !== 1 || body.sub !== sub || body.uid !== uid || !isWrite(body.action)) throw new ApiError(403, "This change belongs to another shop.");
  if (Date.now() > body.exp) throw new ApiError(400, "This change has expired. Ask again.");
  return body;
}

/* ------------------------------ writes: apply ------------------------------ */

function slugFor(title: string, taken: string[]) {
  const base = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "product";
  let slug = base;
  for (let i = 2; taken.includes(slug); i++) slug = `${base}-${i}`;
  return slug;
}
const PLACEHOLDER_IMAGE = "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80";

/** Runs a confirmed change. The store is read again, and the change re-checked, inside the transaction. */
export async function applyWrite(sub: string, name: WriteName, args: Record<string, unknown>): Promise<string> {
  if (name === "update_order_status") {
    const a = args as Args<"update_order_status"> & { order_id: string };
    const status = a.status as OrderStep;
    const o = await updateOrder(sub, a.order_id, (o) => {
      if (o.fulfilmentStatus === "cancelled" || STEP_ORDER[status] <= (STEP_ORDER[o.fulfilmentStatus] ?? 0)) throw new ApiError(409, `Order ${o.number} has already moved on.`);
      const now = new Date().toISOString();
      return {
        ...o,
        fulfilmentStatus: status,
        ...(a.courier ? { courierName: a.courier } : {}),
        ...(a.tracking_number ? { trackingNumber: a.tracking_number } : {}),
        ...(status === "delivered" ? { deliveredAt: now, ...(o.paymentMethod === "cod" && o.paymentStatus === "cod_pending" ? { paymentStatus: "paid" as const } : {}) } : {}),
      };
    });
    return `Order ${o.number} is now ${status}.`;
  }

  return adminDb().runTransaction(async (tx) => {
    const store = await readStoreTx(tx, sub);
    if (!store) throw new ApiError(404, "Store not found.");
    describeWrite(name, args, store); // still valid against the latest data?
    const now = new Date().toISOString();
    switch (name) {
      case "create_product": {
        const a = args as Args<"create_product">;
        const categories = [...(store.categories || [])];
        let category = a.category ? categories.find((c) => norm(c.name) === norm(a.category!))?.name : undefined;
        if (a.category && !category) {
          category = a.category;
          categories.push({ id: `cat-${sub}-${Date.now().toString(36)}`, name: category, slug: slugFor(category, categories.map((c) => c.slug)), description: "", isActive: true, position: categories.length, createdAt: now });
        }
        const product: ProductData = {
          id: `prod-${sub}-${Date.now().toString(36)}${randomBytes(2).toString("hex")}`,
          storeId: store.id,
          title: a.title,
          slug: slugFor(a.title, (store.products || []).map((p) => p.slug)),
          description: a.description || "",
          price: toPaise(a.price),
          ...(a.mrp ? { compareAtPrice: toPaise(a.mrp) } : {}),
          stock: a.stock ?? 1,
          category: category || "",
          images: [PLACEHOLDER_IMAGE],
          status: a.publish ? "published" : "draft",
          createdAt: now,
        };
        writeStoreTx(tx, sub, { products: [product, ...(store.products || [])], ...(categories.length !== (store.categories || []).length ? { categories } : {}) });
        return `Added “${a.title}”${a.publish ? "" : " as a draft. Add a photo in Products, then publish it"}.`;
      }
      case "update_product": {
        const a = args as Args<"update_product">;
        const products = (store.products || []).map((p) => {
          if (p.id !== a.product_id) return p;
          const next: ProductData = { ...p };
          if (a.title !== undefined) next.title = a.title;
          if (a.price !== undefined) next.price = toPaise(a.price);
          if (a.mrp !== undefined) {
            if (a.mrp > 0) next.compareAtPrice = toPaise(a.mrp);
            else delete next.compareAtPrice;
          }
          if (a.stock !== undefined) next.stock = a.stock;
          if (a.status) next.status = a.status;
          if (a.category) next.category = (store.categories || []).find((c) => norm(c.name) === norm(a.category!))?.name || a.category;
          if (a.description !== undefined) next.description = a.description;
          return next;
        });
        writeStoreTx(tx, sub, { products });
        return "Product updated.";
      }
      case "create_category": {
        const a = args as Args<"create_category">;
        const categories = [...(store.categories || [])];
        categories.push({ id: `cat-${sub}-${Date.now().toString(36)}`, name: a.name, slug: slugFor(a.name, categories.map((c) => c.slug)), description: a.description || "", isActive: true, position: categories.length, createdAt: now });
        writeStoreTx(tx, sub, { categories });
        return `Category “${a.name}” added.`;
      }
      case "create_discount": {
        const a = args as Args<"create_discount">;
        const d: DiscountData = {
          id: `disc-${Date.now().toString(36)}`,
          code: a.code.toUpperCase(),
          type: a.type,
          value: a.type === "percentage" ? Math.round(a.value) : toPaise(a.value),
          ...(a.min_order ? { minOrderValue: toPaise(a.min_order) } : {}),
          ...(a.max_discount && a.type === "percentage" ? { maxDiscount: toPaise(a.max_discount) } : {}),
          ...(a.days_valid ? { expiresAt: new Date(Date.now() + a.days_valid * 86400_000).toISOString() } : {}),
          timesUsed: 0,
          isActive: true,
          createdAt: now,
        };
        writeStoreTx(tx, sub, { discounts: [d, ...(store.discounts || [])] });
        return `Coupon ${d.code} is live.`;
      }
      case "set_discount_active": {
        const a = args as Args<"set_discount_active">;
        writeStoreTx(tx, sub, { discounts: (store.discounts || []).map((d) => (d.id === a.discount_id ? { ...d, isActive: a.active } : d)) });
        return `Coupon turned ${a.active ? "on" : "off"}.`;
      }
      case "set_review_status": {
        const a = args as Args<"set_review_status">;
        writeStoreTx(tx, sub, { reviews: (store.reviews || []).map((r) => (r.id === a.review_id ? { ...r, status: a.status } : r)) });
        return a.status === "approved" ? "Review is now live." : "Review hidden.";
      }
      case "update_shop_text": {
        const a = args as Args<"update_shop_text">;
        writeStoreTx(tx, sub, { ...(a.tagline !== undefined ? { tagline: a.tagline } : {}), ...(a.announcement !== undefined ? { announcementText: a.announcement } : {}) });
        return "Shop text updated.";
      }
      default:
        throw new ApiError(400, "Unknown change.");
    }
  });
}
