import { describe, expect, it, vi } from "vitest";
import { buildInvoice, financialYear } from "@/lib/invoice";
import { buyerUpdateText, buyerWhatsAppLink } from "@/lib/whatsapp-messages";
import type { OrderData } from "@/lib/store-service";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/server/firebase-admin", () => ({ adminDb: () => ({}) }));
const { stepFor, assignError } = await import("@/lib/server/shiprocket-service");

const order = (over: Partial<OrderData> = {}): OrderData =>
  ({
    id: "ord_1",
    storeId: "s",
    number: "#1004",
    token: "tok_sh_abcdefgh",
    customer: { name: "Asha Rao", phone: "9876543210" },
    address: { street: "1 MG Road", city: "Bengaluru", state: "Karnataka", pincode: "560001" },
    items: [
      { productId: "p1", title: "Tee", price: 59900, quantity: 2, image: "" },
      { productId: "p2", title: "Cap", price: 30000, quantity: 1, image: "" },
    ],
    subtotal: 149800,
    discount: 14980,
    delivery: 5000,
    codFee: 0,
    total: 139820,
    paymentMethod: "cod",
    paymentStatus: "cod_pending",
    fulfilmentStatus: "placed",
    createdAt: "2026-11-08T10:00:00.000Z",
    updatedAt: "2026-11-08T10:00:00.000Z",
    ...over,
  }) as OrderData;

const store = { gstin: "29ABCDE1234F1Z5", gstState: "Karnataka", defaultGstRate: 18, products: [{ id: "p1", gstRate: 5 }, { id: "p2" }] as never };

describe("invoices", () => {
  it("adds up exactly to what the buyer paid", () => {
    const inv = buildInvoice(store, order());
    expect(inv.total).toBe(139820);
    expect(inv.lines.reduce((a, l) => a + l.taxable + l.tax, 0)).toBe(139820);
  });

  it("uses each product's rate and splits CGST/SGST inside the state", () => {
    const inv = buildInvoice(store, order());
    expect(inv.lines[0].rate).toBe(5);
    expect(inv.lines[1].rate).toBe(18);
    expect(inv.intraState).toBe(true);
    expect(inv.cgst + inv.sgst).toBe(inv.lines.reduce((a, l) => a + l.tax, 0));
    expect(inv.igst).toBe(0);
  });

  it("charges IGST to another state", () => {
    const inv = buildInvoice(store, order({ address: { street: "x", city: "Pune", state: "Maharashtra", pincode: "411001" } }));
    expect(inv.intraState).toBe(false);
    expect(inv.igst).toBeGreaterThan(0);
    expect(inv.cgst + inv.sgst).toBe(0);
  });

  it("is a bill of supply without a GSTIN", () => {
    const inv = buildInvoice({ products: [] }, order());
    expect(inv.kind).toBe("supply");
    expect(inv.lines.every((l) => l.tax === 0)).toBe(true);
    expect(inv.total).toBe(139820);
  });

  it("numbers by Indian financial year", () => {
    expect(financialYear("2026-11-08T10:00:00Z")).toBe("2026-27");
    expect(financialYear("2027-02-01T10:00:00Z")).toBe("2026-27");
    expect(buildInvoice(store, order()).number).toBe("INV/2026-27/1004");
  });
});

describe("plugins", () => {
  it("maps Shiprocket statuses to order steps", () => {
    expect(stepFor("IN TRANSIT")).toBe("shipped");
    expect(stepFor("OUT FOR DELIVERY")).toBe("shipped");
    expect(stepFor("Delivered")).toBe("delivered");
    expect(stepFor("RTO INITIATED")).toBeNull();
    expect(stepFor("PICKUP SCHEDULED")).toBeNull();
  });

  it("explains why a courier couldn't be booked", () => {
    expect(assignError("Insufficient wallet balance, please recharge")).toMatch(/wallet doesn't have enough balance/);
    expect(assignError("Please complete your KYC")).toMatch(/KYC/);
    expect(assignError("Something odd")).toBe("Shiprocket: Something odd");
    expect(assignError("")).toMatch(/Try another one/);
  });

  it("reads WhatsApp numbers safely", () => {
    expect(buyerWhatsAppLink("98765 43210", "hi")).toBe("https://wa.me/919876543210?text=hi");
  });

  it("writes buyer updates with tracking", () => {
    const text = buyerUpdateText({ name: "Lume" }, order({ courierName: "Delhivery", trackingNumber: "AWB1" }), "shipped", "https://x/order/t");
    expect(text).toContain("Delhivery");
    expect(text).toContain("AWB1");
    expect(text).toContain("#1004");
  });
});
