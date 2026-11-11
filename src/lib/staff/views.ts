/**
 * What each staff role is shown. The server builds these views from the full store, so anything
 * a role shouldn't see (phone numbers for the accountant, prices for the packer…) never leaves
 * the server at all.
 */
import type { CustomerData, OrderData, ProductData } from "../store-service";
import type { StaffRole } from "./roles";

export type OrderAction = "accept" | "reject" | "packed" | "shipped" | "delivered";

export interface StaffOrderItem {
  productId: string;
  title: string;
  image: string;
  quantity: number;
  variantName?: string;
  /** paise; left out for fulfilment staff */
  price?: number;
  /** units in stock right now (order manager only); null when the product no longer exists */
  stock?: number | null;
}

export interface StaffOrder {
  id: string;
  number: string;
  createdAt: string;
  updatedAt?: string;
  fulfilmentStatus: OrderData["fulfilmentStatus"];
  paymentMethod: OrderData["paymentMethod"];
  paymentStatus: OrderData["paymentStatus"];
  customer: { name: string; phone?: string; email?: string };
  address?: OrderData["address"];
  items: StaffOrderItem[];
  subtotal?: number;
  discount?: number;
  delivery?: number;
  codFee?: number;
  total?: number;
  /** cash the courier must collect (cash-on-delivery orders), paise */
  collect?: number;
  courierName?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  notes?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  cancelledBy?: OrderData["cancelledBy"];
  cancelReason?: string;
  returnRequest?: OrderData["returnRequest"];
  refund?: OrderData["refund"];
  /** what this role may do with the order right now */
  actions: OrderAction[];
}

const PAID = new Set(["paid", "verified"]);
const isCod = (o: OrderData) => o.paymentMethod === "cod";

/** Which steps an order can take next, for the roles that move orders along. */
export function orderActions(order: Pick<OrderData, "fulfilmentStatus">, role: StaffRole): OrderAction[] {
  const s = order.fulfilmentStatus;
  if (role === "order_manager") {
    if (s === "placed") return ["accept", "reject"];
    if (s === "confirmed" || s === "packed") return ["reject"];
    return [];
  }
  if (role === "fulfilment") {
    if (s === "confirmed") return ["packed", "shipped"];
    if (s === "packed") return ["shipped"];
    if (s === "shipped") return ["delivered"];
  }
  return [];
}

/** One order as a role may see it, or null when the role doesn't see this order at all. */
export function orderForRole(order: OrderData, role: StaffRole, products: Pick<ProductData, "id" | "stock">[] = []): StaffOrder | null {
  if (role === "product_manager") return null;
  // packers only see orders that were accepted
  if (role === "fulfilment" && (order.fulfilmentStatus === "placed" || order.fulfilmentStatus === "cancelled")) return null;

  const base: StaffOrder = {
    id: order.id,
    number: order.number,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    fulfilmentStatus: order.fulfilmentStatus,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    customer: { name: order.customer?.name || "" },
    items: (order.items || []).map((i) => ({
      productId: i.productId,
      title: i.title,
      image: i.image,
      quantity: i.quantity,
      ...(i.variantName ? { variantName: i.variantName } : {}),
    })),
    actions: orderActions(order, role),
  };
  const shipping = {
    courierName: order.courierName,
    trackingNumber: order.trackingNumber,
    trackingUrl: order.trackingUrl,
    deliveredAt: order.deliveredAt,
  };
  const money = {
    subtotal: order.subtotal,
    discount: order.discount,
    delivery: order.delivery,
    codFee: order.codFee,
    total: order.total,
  };
  const ending = {
    cancelledAt: order.cancelledAt,
    cancelledBy: order.cancelledBy,
    cancelReason: order.cancelReason,
    returnRequest: order.returnRequest,
    refund: order.refund,
  };
  const priced = (order.items || []).map((i, n) => ({ ...base.items[n], price: i.price }));

  if (role === "order_manager") {
    return {
      ...base,
      ...shipping,
      ...money,
      ...ending,
      customer: { name: base.customer.name, phone: order.customer?.phone },
      address: order.address,
      notes: order.notes,
      items: priced.map((i) => ({ ...i, stock: products.find((p) => p.id === i.productId)?.stock ?? null })),
    };
  }
  if (role === "fulfilment") {
    return {
      ...base,
      ...shipping,
      customer: { name: base.customer.name, phone: order.customer?.phone },
      address: order.address,
      notes: order.notes,
      ...(isCod(order) && !PAID.has(order.paymentStatus) ? { collect: order.total } : {}),
    };
  }
  if (role === "support") {
    return {
      ...base,
      ...shipping,
      ...money,
      ...ending,
      customer: { name: base.customer.name, phone: order.customer?.phone, email: order.customer?.email },
      address: order.address,
      notes: order.notes,
      items: priced,
    };
  }
  // finance: money and status, no way to reach the buyer
  return { ...base, ...money, ...ending, deliveredAt: order.deliveredAt, items: priced };
}

export interface StaffCustomer {
  name: string;
  phone: string;
  email?: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderAt: string;
}

export function customerForSupport(c: CustomerData): StaffCustomer {
  return { name: c.name, phone: c.phone, email: c.email, totalOrders: c.totalOrders, totalSpent: c.totalSpent, lastOrderAt: c.lastOrderAt };
}

export interface FinanceSummary {
  /** paid online or cash collected, on orders that weren't cancelled (paise) */
  received: number;
  /** cash on delivery not collected yet */
  codPending: number;
  /** online payments waiting to be checked */
  awaiting: number;
  refundsDue: number;
  refundsPaid: number;
  orders: number;
  cancelled: number;
}

export function financeSummary(orders: Pick<StaffOrder, "fulfilmentStatus" | "paymentStatus" | "total" | "refund">[]): FinanceSummary {
  const sum: FinanceSummary = { received: 0, codPending: 0, awaiting: 0, refundsDue: 0, refundsPaid: 0, orders: orders.length, cancelled: 0 };
  for (const o of orders) {
    const total = o.total || 0;
    const cancelled = o.fulfilmentStatus === "cancelled";
    if (cancelled) sum.cancelled += 1;
    if (o.refund?.status === "due") sum.refundsDue += o.refund.amount || 0;
    if (o.refund?.status === "refunded") sum.refundsPaid += o.refund.amount || 0;
    if (cancelled) continue;
    if (PAID.has(o.paymentStatus)) sum.received += total;
    else if (o.paymentStatus === "cod_pending") sum.codPending += total;
    else if (o.paymentStatus === "awaiting_verification") sum.awaiting += total;
  }
  return sum;
}

/** "Blue Kurta (M)" → "blue-kurta-m" */
export function slugify(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}
