import { describe, it, expect } from "vitest";
import { computeSalesAnalytics } from "@/lib/sales-analytics";
import type { OrderData } from "@/lib/store-service";

const NOW = new Date(2026, 10, 1, 15, 0, 0); // 1 Nov 2026, 3 PM local

let n = 0;
function order(daysAgo: number, hour: number, rupees: number, extra: Partial<OrderData> = {}): OrderData {
  const d = new Date(2026, 10, 1 - daysAgo, hour, 0, 0);
  n += 1;
  return {
    id: `o${n}`,
    customer: { name: "Priya", phone: "9000000001" },
    items: [{ quantity: 2 }],
    total: rupees * 100,
    fulfilmentStatus: "placed",
    paymentStatus: "paid",
    createdAt: d.toISOString(),
    ...extra,
  } as unknown as OrderData;
}

describe("computeSalesAnalytics", () => {
  it("is all zeros for a new store (no made-up numbers)", () => {
    const a = computeSalesAnalytics([], "7d", NOW);
    expect(a.revenue).toBe(0);
    expect(a.ordersCount).toBe(0);
    expect(a.deltaPercent).toBe("0%");
    expect(a.isEmpty).toBe(true);
    expect(a.yLabels[a.yLabels.length - 1]).toBe("₹0");
  });

  it("adds up today's real orders and puts them in the right 4-hour slot", () => {
    const orders = [order(0, 9, 500), order(0, 13, 1500), order(1, 10, 1000)];
    const a = computeSalesAnalytics(orders, "today", NOW);
    expect(a.revenue).toBe(200000); // ₹2,000 in paise
    expect(a.ordersCount).toBe(2);
    expect(a.deltaPercent).toBe("+100%"); // ₹2,000 vs ₹1,000 yesterday
    expect(a.itemsSold).toBe(4);
    expect(a.avgOrderValue).toBe(100000);
    // 8 AM-12 PM slot (index 2) and 12-4 PM slot (index 3) have sales; the 12 PM one is the peak
    expect(a.chartPoints[3].y).toBeLessThan(a.chartPoints[2].y);
    expect(a.chartPoints[0].y).toBeGreaterThan(a.chartPoints[2].y);
  });

  it("ignores cancelled orders and rejected payments", () => {
    const orders = [
      order(0, 9, 500),
      order(0, 10, 9999, { fulfilmentStatus: "cancelled" } as Partial<OrderData>),
      order(0, 11, 9999, { paymentStatus: "rejected" } as Partial<OrderData>),
    ];
    expect(computeSalesAnalytics(orders, "today", NOW).revenue).toBe(50000);
  });

  it("compares 7 days with the 7 days before and labels days", () => {
    const orders = [order(2, 12, 1000), order(9, 12, 2000)];
    const a = computeSalesAnalytics(orders, "7d", NOW);
    expect(a.revenue).toBe(100000);
    expect(a.deltaPercent).toBe("-50%");
    expect(a.isPositive).toBe(false);
    expect(a.xLabels).toHaveLength(7);
  });

  it("shows 'New' when there were no sales in the previous period", () => {
    expect(computeSalesAnalytics([order(3, 12, 800)], "30d", NOW).deltaPercent).toBe("New");
  });

  it("counts repeat buyers", () => {
    const orders = [
      order(1, 12, 100),
      order(20, 12, 100),
      order(2, 12, 100, { customer: { name: "Ravi", phone: "9000000002" } } as Partial<OrderData>),
    ];
    const a = computeSalesAnalytics(orders, "7d", NOW);
    expect(a.buyers).toBe(2);
    expect(a.repeatBuyerRate).toBe(50);
  });
});
