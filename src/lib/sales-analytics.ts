import type { OrderData } from "./store-service";

/**
 * Real sales numbers for the dashboard, worked out from the store's own orders.
 * Cancelled orders and rejected payments don't count as sales.
 */

export type SalesRange = "today" | "yesterday" | "7d" | "30d";

export interface ChartPoint {
  x: number;
  y: number;
}

export interface SalesAnalytics {
  label: string;
  periodText: string;
  revenue: number; // paise
  deltaPercent: string;
  isPositive: boolean;
  ordersCount: number;
  ordersDelta: string;
  avgOrderValue: number; // paise
  buyers: number;
  itemsSold: number;
  repeatBuyerRate: number; // 0-100, share of this period's buyers who have ordered more than once
  chartPoints: ChartPoint[];
  lastPoint: ChartPoint;
  linePath: string;
  areaPath: string;
  xLabels: string[];
  yLabels: string[]; // top to bottom
  isEmpty: boolean;
}

// Chart area in the dashboard's 500 x 120 SVG
const X_START = 20;
const X_END = 485;
const Y_TOP = 10;
const Y_BASE = 115;

const DAY = 24 * 60 * 60 * 1000;

export function countsAsSale(o: Pick<OrderData, "fulfilmentStatus" | "paymentStatus">): boolean {
  return o.fulfilmentStatus !== "cancelled" && o.paymentStatus !== "rejected";
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function percentChange(current: number, previous: number): { text: string; positive: boolean } {
  if (previous === 0) return current > 0 ? { text: "New", positive: true } : { text: "0%", positive: true };
  const pct = ((current - previous) / previous) * 100;
  const rounded = Math.abs(pct) >= 10 ? Math.round(pct) : Math.round(pct * 10) / 10;
  return { text: `${rounded > 0 ? "+" : ""}${rounded}%`, positive: pct >= 0 };
}

/** Rounds up to a tidy chart maximum (1, 2, 2.5 or 5 x 10^n), in rupees. */
function niceMax(rupees: number): number {
  if (rupees <= 0) return 0;
  const exp = Math.pow(10, Math.floor(Math.log10(rupees)));
  for (const m of [1, 2, 2.5, 5, 10]) if (m * exp >= rupees) return m * exp;
  return 10 * exp;
}

const compactRupees = (rupees: number) =>
  rupees === 0
    ? "₹0"
    : `₹${new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 }).format(rupees)}`;

function buildPaths(values: number[]) {
  const maxRupees = niceMax(Math.max(0, ...values) / 100);
  const step = values.length > 1 ? (X_END - X_START) / (values.length - 1) : 0;
  const points = values.map((v, i) => ({
    x: Math.round((X_START + i * step) * 10) / 10,
    y: maxRupees > 0 ? Math.round((Y_BASE - (v / 100 / maxRupees) * (Y_BASE - Y_TOP)) * 10) / 10 : Y_BASE - 1,
  }));
  let line = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const dx = (b.x - a.x) / 2;
    line += ` C ${a.x + dx} ${a.y}, ${b.x - dx} ${b.y}, ${b.x} ${b.y}`;
  }
  const last = points[points.length - 1];
  const area = `${line} L ${last.x} ${Y_BASE} L ${points[0].x} ${Y_BASE} Z`;
  const yLabels = [1, 2 / 3, 1 / 3, 0].map((f) => compactRupees(Math.round(maxRupees * f)));
  return { points, line, area, last, yLabels };
}

export function computeSalesAnalytics(orders: OrderData[], range: SalesRange, now: Date = new Date()): SalesAnalytics {
  const sales = (orders || []).filter(countsAsSale);
  const today = startOfDay(now);

  // Period window, the previous window of the same length, and chart buckets
  let start: Date;
  let end: Date;
  let buckets: { from: number; to: number }[] = [];
  let xLabels: string[];
  let label: string;
  let periodText: string;

  const hourLabels = ["12 AM", "4 AM", "8 AM", "12 PM", "4 PM", "8 PM"];
  if (range === "today" || range === "yesterday") {
    start = range === "today" ? today : new Date(today.getTime() - DAY);
    end = new Date(start.getTime() + DAY);
    buckets = Array.from({ length: 6 }, (_, i) => ({
      from: start.getTime() + i * 4 * 3600 * 1000,
      to: start.getTime() + (i + 1) * 4 * 3600 * 1000,
    }));
    xLabels = hourLabels;
    label = range === "today" ? "Today" : "Yesterday";
    periodText = range === "today" ? "vs yesterday" : "vs the day before";
  } else {
    const days = range === "7d" ? 7 : 30;
    end = new Date(today.getTime() + DAY);
    start = new Date(end.getTime() - days * DAY);
    buckets = Array.from({ length: days }, (_, i) => ({
      from: start.getTime() + i * DAY,
      to: start.getTime() + (i + 1) * DAY,
    }));
    if (range === "7d") {
      xLabels = buckets.map((b) => new Date(b.from).toLocaleDateString("en-IN", { weekday: "short" }));
      label = "Last 7 days";
      periodText = "vs previous 7 days";
    } else {
      xLabels = [0, 7, 14, 21, 29].map((i) =>
        new Date(buckets[i].from).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
      );
      label = "Last 30 days";
      periodText = "vs previous 30 days";
    }
  }

  const length = end.getTime() - start.getTime();
  const prevStart = start.getTime() - length;
  const ts = (o: OrderData) => new Date(o.createdAt).getTime();
  const inPeriod = sales.filter((o) => ts(o) >= start.getTime() && ts(o) < end.getTime());
  const inPrev = sales.filter((o) => ts(o) >= prevStart && ts(o) < start.getTime());

  const revenue = inPeriod.reduce((s, o) => s + o.total, 0);
  const prevRevenue = inPrev.reduce((s, o) => s + o.total, 0);
  const revDelta = percentChange(revenue, prevRevenue);
  const ordDelta = percentChange(inPeriod.length, inPrev.length);

  const buyerKey = (o: OrderData) => (o.customer?.phone || o.customer?.email || o.customer?.name || "").trim().toLowerCase();
  const buyers = new Set(inPeriod.map(buyerKey).filter(Boolean));
  const ordersPerBuyer = new Map<string, number>();
  sales.forEach((o) => {
    const k = buyerKey(o);
    if (k) ordersPerBuyer.set(k, (ordersPerBuyer.get(k) || 0) + 1);
  });
  const repeat = [...buyers].filter((k) => (ordersPerBuyer.get(k) || 0) > 1).length;

  const values = buckets.map((b) => inPeriod.filter((o) => ts(o) >= b.from && ts(o) < b.to).reduce((s, o) => s + o.total, 0));
  const { points, line, area, last, yLabels } = buildPaths(values);

  return {
    label,
    periodText,
    revenue,
    deltaPercent: revDelta.text,
    isPositive: revDelta.positive,
    ordersCount: inPeriod.length,
    ordersDelta: ordDelta.text,
    avgOrderValue: inPeriod.length ? Math.round(revenue / inPeriod.length) : 0,
    buyers: buyers.size,
    itemsSold: inPeriod.reduce((s, o) => s + (o.items || []).reduce((n, it) => n + (it.quantity || 0), 0), 0),
    repeatBuyerRate: buyers.size ? Math.round((repeat / buyers.size) * 100) : 0,
    chartPoints: range === "30d" ? [] : points,
    lastPoint: last,
    linePath: line,
    areaPath: area,
    xLabels,
    yLabels,
    isEmpty: inPeriod.length === 0,
  };
}
