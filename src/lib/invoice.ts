/**
 * Invoices (Pro). Prices on ShoperSite include GST, so each line's GST is worked out backwards from
 * what the buyer paid: taxable value = amount × 100 / (100 + rate). Sellers with a GSTIN get a tax
 * invoice (CGST + SGST inside their state, IGST outside it); sellers without one get a bill of supply.
 * All money is in paise and the lines always add up exactly to what the buyer paid.
 */
import type { OrderData, StoreData } from "./store-service";

export const GST_RATES = [0, 3, 5, 12, 18, 28] as const;

export interface InvoiceLine {
  label: string;
  qty: number;
  /** amount the buyer paid for this line, after its share of any discount */
  amount: number;
  rate: number;
  taxable: number;
  tax: number;
}

export interface Invoice {
  number: string;
  date: string;
  kind: "tax" | "supply";
  intraState: boolean;
  lines: InvoiceLine[];
  taxable: number;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
  discount: number;
}

const validRate = (r: unknown): number | null => (typeof r === "number" && (GST_RATES as readonly number[]).includes(r) ? r : null);

/** "2026-27" for dates from April 2026 to March 2027. */
export function financialYear(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const start = d.getMonth() >= 3 ? y : y - 1;
  return `${start}-${String((start + 1) % 100).padStart(2, "0")}`;
}

function split(amount: number, rate: number) {
  const taxable = Math.round((amount * 100) / (100 + rate));
  return { taxable, tax: amount - taxable };
}

export function buildInvoice(
  store: Pick<StoreData, "gstin" | "gstState" | "defaultGstRate" | "products">,
  order: OrderData
): Invoice {
  const hasGst = !!store.gstin;
  const fallback = validRate(store.defaultGstRate) ?? 18;
  const rateOf = (productId: string) => (hasGst ? validRate(store.products?.find((p) => p.id === productId)?.gstRate) ?? fallback : 0);

  // share the discount across the items in proportion, keeping exact paise
  const itemsPaid = Math.max(0, order.subtotal - order.discount);
  const gross = order.items.map((i) => i.price * i.quantity);
  const grossSum = gross.reduce((a, b) => a + b, 0) || 1;
  let left = itemsPaid;
  const lines: InvoiceLine[] = order.items.map((i, n) => {
    const amount = n === order.items.length - 1 ? left : Math.round((gross[n] * itemsPaid) / grossSum);
    left -= amount;
    const rate = rateOf(i.productId);
    return { label: i.title + (i.variantName ? ` (${i.variantName})` : ""), qty: i.quantity, amount, rate, ...split(amount, rate) };
  });
  const chargeRate = hasGst ? fallback : 0;
  if (order.delivery > 0) lines.push({ label: "Delivery", qty: 1, amount: order.delivery, rate: chargeRate, ...split(order.delivery, chargeRate) });
  if (order.codFee > 0) lines.push({ label: "Cash on delivery charge", qty: 1, amount: order.codFee, rate: chargeRate, ...split(order.codFee, chargeRate) });

  const tax = lines.reduce((a, l) => a + l.tax, 0);
  const intraState = !!store.gstState && store.gstState.trim().toLowerCase() === (order.address.state || "").trim().toLowerCase();
  const cgst = hasGst && intraState ? Math.floor(tax / 2) : 0;
  return {
    number: `INV/${financialYear(order.createdAt)}/${order.number.replace(/^#/, "")}`,
    date: order.createdAt,
    kind: hasGst ? "tax" : "supply",
    intraState,
    lines,
    taxable: lines.reduce((a, l) => a + l.taxable, 0),
    cgst,
    sgst: hasGst && intraState ? tax - cgst : 0,
    igst: hasGst && !intraState ? tax : 0,
    total: lines.reduce((a, l) => a + l.amount, 0),
    discount: order.discount,
  };
}
