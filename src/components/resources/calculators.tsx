"use client";

import * as React from "react";

/** Small, honest calculators for sellers. Everything runs in the browser; nothing is saved. */

const inr = (n: number) => (Number.isFinite(n) ? `₹${Math.round(n).toLocaleString("en-IN")}` : "—");
const pct = (n: number) => (Number.isFinite(n) ? `${n.toFixed(1)}%` : "—");

function Field({ label, value, onChange, suffix, hint }: { label: string; value: string; onChange: (v: string) => void; suffix?: string; hint?: string }) {
  return (
    <label className="block">
      <span className="text-[13px] font-medium text-neutral-700">{label}</span>
      <span className="mt-1.5 flex h-11 items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3.5 focus-within:border-neutral-950">
        {!suffix && <span className="text-[14px] text-neutral-400">₹</span>}
        <input inputMode="decimal" value={value} onChange={(e) => onChange(e.target.value.replace(/[^\d.]/g, "").slice(0, 9))} className="w-full bg-transparent text-[15px] tabular-nums outline-none" />
        {suffix && <span className="text-[14px] text-neutral-400">{suffix}</span>}
      </span>
      {hint && <span className="mt-1 block text-[12px] text-neutral-400">{hint}</span>}
    </label>
  );
}

function Result({ rows, big }: { rows: [string, string][]; big: [string, string] }) {
  return (
    <div className="flex flex-col justify-between rounded-2xl bg-neutral-950 p-5 text-white">
      <div>
        <p className="text-[13px] text-white/60">{big[0]}</p>
        <p className="mt-1 text-[34px] font-semibold tracking-[-0.02em] tabular-nums">{big[1]}</p>
      </div>
      <dl className="mt-5 space-y-2 border-t border-white/10 pt-4 text-[13.5px]">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between gap-3">
            <dt className="text-white/60">{k}</dt>
            <dd className="font-semibold tabular-nums">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function Card({ id, title, text, children }: { id: string; title: string; text: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-28 rounded-[24px] border border-neutral-200 bg-white p-5 sm:p-7">
      <h2 className="text-[21px] font-semibold tracking-[-0.015em] text-neutral-950">{title}</h2>
      <p className="mt-1 text-[14.5px] text-neutral-500">{text}</p>
      <div className="mt-6 grid gap-5 md:grid-cols-[1fr_280px]">{children}</div>
    </section>
  );
}

const num = (s: string) => Number(s) || 0;

export function PriceCalculator() {
  const [cost, setCost] = React.useState("400");
  const [pack, setPack] = React.useState("25");
  const [ship, setShip] = React.useState("70");
  const [ads, setAds] = React.useState("80");
  const [margin, setMargin] = React.useState("40");
  const fee = 2; // % payment fee
  const base = num(cost) + num(pack) + num(ship) + num(ads);
  const m = Math.min(90, num(margin)) / 100;
  const price = base / (1 - m - fee / 100);
  const profit = price - base - (price * fee) / 100;
  return (
    <Card id="price" title="Selling price & profit" text="Work out the price that leaves the margin you want after every cost.">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Product cost" value={cost} onChange={setCost} />
        <Field label="Packaging" value={pack} onChange={setPack} />
        <Field label="Delivery you pay" value={ship} onChange={setShip} />
        <Field label="Ads per order" value={ads} onChange={setAds} hint="Your ad spend ÷ orders" />
        <Field label="Profit margin you want" value={margin} onChange={setMargin} suffix="%" hint="Includes a 2% online payment fee" />
      </div>
      <Result big={["Sell at least at", inr(price)]} rows={[["True cost per order", inr(base)], ["Payment fee (2%)", inr((price * fee) / 100)], ["Profit per order", inr(profit)], ["Markup on product cost", pct(((price - num(cost)) / Math.max(1, num(cost))) * 100)]]} />
    </Card>
  );
}

export function GstCalculator() {
  const [amount, setAmount] = React.useState("1180");
  const [rate, setRate] = React.useState("18");
  const [inclusive, setInclusive] = React.useState(true);
  const r = num(rate) / 100;
  const taxable = inclusive ? num(amount) / (1 + r) : num(amount);
  const tax = taxable * r;
  return (
    <Card id="gst" title="GST calculator" text="Split a price into taxable value and GST, or add GST to a price.">
      <div className="space-y-4">
        <div className="inline-flex rounded-xl bg-neutral-100 p-1 text-[13.5px]">
          {[true, false].map((v) => (
            <button key={String(v)} type="button" onClick={() => setInclusive(v)} className={`h-9 rounded-lg px-4 font-medium ${inclusive === v ? "bg-white text-neutral-950 shadow-sm" : "text-neutral-500"}`}>
              {v ? "Price includes GST" : "Add GST to price"}
            </button>
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Amount" value={amount} onChange={setAmount} />
          <label className="block">
            <span className="text-[13px] font-medium text-neutral-700">GST rate</span>
            <select value={rate} onChange={(e) => setRate(e.target.value)} className="mt-1.5 h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 text-[15px] outline-none focus:border-neutral-950">
              {["0", "3", "5", "12", "18", "28"].map((x) => (
                <option key={x} value={x}>
                  {x}%
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="text-[12.5px] leading-relaxed text-neutral-400">Within your state, GST splits equally into CGST and SGST. For buyers in another state it's IGST. Check the right rate for your product with your CA.</p>
      </div>
      <Result big={["Total with GST", inr(taxable + tax)]} rows={[["Taxable value", inr(taxable)], ["GST", inr(tax)], ["CGST + SGST (each)", inr(tax / 2)]]} />
    </Card>
  );
}

export function CodCalculator() {
  const [orders, setOrders] = React.useState("100");
  const [rto, setRto] = React.useState("20");
  const [ship, setShip] = React.useState("70");
  const [codFee, setCodFee] = React.useState("35");
  const o = num(orders);
  const returned = (o * Math.min(100, num(rto))) / 100;
  const wasted = returned * num(ship) * 2;
  const charges = (o - returned) * num(codFee);
  return (
    <Card id="cod" title="COD returns (RTO) cost" text="See what refused cash-on-delivery parcels cost you each month.">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="COD orders a month" value={orders} onChange={setOrders} suffix="orders" />
        <Field label="Return-to-origin rate" value={rto} onChange={setRto} suffix="%" />
        <Field label="Shipping per parcel (one way)" value={ship} onChange={setShip} />
        <Field label="Courier COD charge per order" value={codFee} onChange={setCodFee} />
      </div>
      <Result big={["Lost to RTO each month", inr(wasted)]} rows={[["Parcels returned", `${Math.round(returned)}`], ["COD charges", inr(charges)], ["Total COD cost", inr(wasted + charges)]]} />
    </Card>
  );
}

export function DiscountCalculator() {
  const [mrp, setMrp] = React.useState("1999");
  const [off, setOff] = React.useState("25");
  const [cost, setCost] = React.useState("700");
  const price = num(mrp) * (1 - Math.min(100, num(off)) / 100);
  return (
    <Card id="discount" title="Discount & sale price" text="Check what's left after a sale discount, before you announce it.">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="MRP" value={mrp} onChange={setMrp} />
        <Field label="Discount" value={off} onChange={setOff} suffix="%" />
        <Field label="Your cost per order" value={cost} onChange={setCost} hint="Product, packaging, delivery and fees" />
      </div>
      <Result big={["Sale price", inr(price)]} rows={[["Buyer saves", inr(num(mrp) - price)], ["Your profit", inr(price - num(cost))], ["Margin at sale price", pct(((price - num(cost)) / Math.max(1, price)) * 100)]]} />
    </Card>
  );
}
