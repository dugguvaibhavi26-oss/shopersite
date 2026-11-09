"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { Loader2, Printer } from "lucide-react";
import { buildInvoice } from "@/lib/invoice";
import type { OrderData, StoreData } from "@/lib/store-service";

/** A printable invoice (Pro). "Print or save as PDF" uses the browser's own PDF saving. */

type InvoiceStore = Pick<StoreData, "name" | "subdomain" | "logoUrl" | "businessAddress" | "gstin" | "gstState" | "defaultGstRate" | "contactEmail" | "contactPhone" | "products">;

const money = (p: number) => `₹${(p / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function InvoicePage() {
  const { store: sub, token } = useParams<{ store: string; token: string }>();
  const [data, setData] = React.useState<{ store: InvoiceStore; order: OrderData } | null>(null);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    fetch(`/api/invoice?store=${encodeURIComponent(sub)}&token=${encodeURIComponent(token)}`, { cache: "no-store" })
      .then(async (r) => {
        const body = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(body.error || "Invoice not found.");
        setData(body);
      })
      .catch((e) => setError(e.message));
  }, [sub, token]);

  if (error) return <p className="p-10 text-center text-sm text-neutral-600 font-[Inter,sans-serif]">{error}</p>;
  if (!data)
    return (
      <p className="flex items-center justify-center gap-2 p-10 text-sm text-neutral-500 font-[Inter,sans-serif]">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading invoice…
      </p>
    );

  const { store, order } = data;
  const inv = buildInvoice(store, order);
  const isTax = inv.kind === "tax";

  return (
    <div className="min-h-screen bg-neutral-100 py-6 font-[Inter,sans-serif] text-neutral-900 print:bg-white print:py-0">
      <div className="mx-auto mb-4 flex max-w-[800px] justify-end px-4 print:hidden">
        <button type="button" onClick={() => window.print()} className="inline-flex h-10 items-center gap-2 rounded-xl bg-neutral-950 px-4 text-sm font-semibold text-white hover:bg-black">
          <Printer className="h-4 w-4" /> Print or save as PDF
        </button>
      </div>

      <article className="mx-auto max-w-[800px] bg-white p-6 shadow-sm sm:p-10 print:max-w-none print:p-0 print:shadow-none">
        <header className="flex flex-wrap items-start justify-between gap-6 border-b border-neutral-200 pb-6">
          <div className="min-w-0">
            {store.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={store.logoUrl} alt="" className="mb-3 max-h-12 max-w-[180px] object-contain" />
            ) : null}
            <p className="text-lg font-semibold">{store.name}</p>
            {store.businessAddress && <p className="mt-1 max-w-xs whitespace-pre-line text-sm text-neutral-600">{store.businessAddress}</p>}
            <p className="mt-1 text-sm text-neutral-600">{[store.contactPhone, store.contactEmail].filter(Boolean).join(" · ")}</p>
            {isTax && <p className="mt-1 text-sm font-medium">GSTIN: {store.gstin}</p>}
          </div>
          <div className="text-right">
            <p className="text-xl font-semibold tracking-tight">{isTax ? "Tax Invoice" : "Bill of Supply"}</p>
            <p className="mt-2 text-sm text-neutral-600">
              Invoice no. <b className="text-neutral-900">{inv.number}</b>
            </p>
            <p className="text-sm text-neutral-600">Date: {new Date(inv.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
            <p className="text-sm text-neutral-600">Order: {order.number}</p>
          </div>
        </header>

        <section className="grid gap-6 border-b border-neutral-200 py-6 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Bill to / Ship to</p>
            <p className="mt-2 font-medium">{order.customer.name}</p>
            <p className="text-sm text-neutral-600">{order.address.street}</p>
            <p className="text-sm text-neutral-600">
              {order.address.city}, {order.address.state} {order.address.pincode}
            </p>
            <p className="text-sm text-neutral-600">{order.customer.phone}</p>
          </div>
          <div className="sm:text-right">
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Payment</p>
            <p className="mt-2 text-sm">
              {order.paymentMethod === "cod" ? "Cash on delivery" : order.paymentMethod === "upi" ? "UPI" : "Paid online"}
              {order.paymentUtr ? <span className="block text-neutral-500">Ref: {order.paymentUtr}</span> : null}
            </p>
            {isTax && <p className="mt-1 text-sm text-neutral-600">Place of supply: {order.address.state}</p>}
          </div>
        </section>

        <table className="mt-6 w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-left text-xs uppercase tracking-wider text-neutral-500">
              <th className="py-2 pr-2 font-semibold">Item</th>
              <th className="py-2 px-2 text-right font-semibold">Qty</th>
              {isTax && <th className="py-2 px-2 text-right font-semibold">Taxable</th>}
              {isTax && <th className="py-2 px-2 text-right font-semibold">GST</th>}
              <th className="py-2 pl-2 text-right font-semibold">Amount</th>
            </tr>
          </thead>
          <tbody>
            {inv.lines.map((l, i) => (
              <tr key={i} className="border-b border-neutral-100 align-top">
                <td className="py-2.5 pr-2">{l.label}</td>
                <td className="py-2.5 px-2 text-right tabular-nums">{l.qty}</td>
                {isTax && <td className="py-2.5 px-2 text-right tabular-nums">{money(l.taxable)}</td>}
                {isTax && (
                  <td className="py-2.5 px-2 text-right tabular-nums">
                    {money(l.tax)} <span className="text-neutral-400">({l.rate}%)</span>
                  </td>
                )}
                <td className="py-2.5 pl-2 text-right tabular-nums">{money(l.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-6 flex justify-end">
          <dl className="w-full max-w-xs space-y-1.5 text-sm">
            {inv.discount > 0 && (
              <div className="flex justify-between text-neutral-600">
                <dt>Discount (already applied)</dt>
                <dd className="tabular-nums">−{money(inv.discount)}</dd>
              </div>
            )}
            {isTax && (
              <div className="flex justify-between text-neutral-600">
                <dt>Taxable value</dt>
                <dd className="tabular-nums">{money(inv.taxable)}</dd>
              </div>
            )}
            {inv.cgst > 0 && (
              <div className="flex justify-between text-neutral-600">
                <dt>CGST</dt>
                <dd className="tabular-nums">{money(inv.cgst)}</dd>
              </div>
            )}
            {inv.sgst > 0 && (
              <div className="flex justify-between text-neutral-600">
                <dt>SGST</dt>
                <dd className="tabular-nums">{money(inv.sgst)}</dd>
              </div>
            )}
            {inv.igst > 0 && (
              <div className="flex justify-between text-neutral-600">
                <dt>IGST</dt>
                <dd className="tabular-nums">{money(inv.igst)}</dd>
              </div>
            )}
            <div className="flex justify-between border-t border-neutral-200 pt-2 text-base font-semibold">
              <dt>Total</dt>
              <dd className="tabular-nums">{money(inv.total)}</dd>
            </div>
          </dl>
        </div>

        <footer className="mt-10 border-t border-neutral-200 pt-4 text-xs text-neutral-500">
          {isTax ? "Prices include GST. " : "The seller isn't registered for GST, so no tax is charged. "}
          This is a computer-generated invoice and needs no signature. Sold by {store.name}; generated with ShoperSite.
        </footer>
      </article>
    </div>
  );
}
