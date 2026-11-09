"use client";

import React, { useState } from "react";
import { Calculator, Percent, DollarSign, TrendingUp, HelpCircle, ArrowRight, RotateCcw } from "lucide-react";

export function BusinessTools() {
  const [activeTool, setActiveTool] = useState<"margin" | "gst" | "discount" | "roas" | "breakeven">("margin");

  return (
    <div className="rounded-[20px] border border-neutral-200/90 bg-white p-5 sm:p-8 shadow-[0_4px_24px_-10px_rgba(0,0,0,0.06)]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-800 text-xs font-semibold uppercase tracking-wider mb-2">
            <Calculator className="w-3.5 h-3.5" />
            Free E-commerce Calculators
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-950">
            Interactive Business Utilities
          </h2>
          <p className="text-sm text-neutral-600 mt-1">
            Browser-based financial tools to calculate margins, Indian GST splits, discounts, and ad profitability in real time.
          </p>
        </div>

        {/* Tool selector tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-neutral-100 border border-neutral-200">
          <button
            type="button"
            onClick={() => setActiveTool("margin")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTool === "margin" ? "bg-black text-white shadow-xs" : "text-neutral-700 hover:text-black"
            }`}
          >
            Profit Margin
          </button>
          <button
            type="button"
            onClick={() => setActiveTool("gst")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTool === "gst" ? "bg-black text-white shadow-xs" : "text-neutral-700 hover:text-black"
            }`}
          >
            GST Calculator
          </button>
          <button
            type="button"
            onClick={() => setActiveTool("discount")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTool === "discount" ? "bg-black text-white shadow-xs" : "text-neutral-700 hover:text-black"
            }`}
          >
            Sale & Discount
          </button>
          <button
            type="button"
            onClick={() => setActiveTool("roas")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTool === "roas" ? "bg-black text-white shadow-xs" : "text-neutral-700 hover:text-black"
            }`}
          >
            Ad ROAS
          </button>
          <button
            type="button"
            onClick={() => setActiveTool("breakeven")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTool === "breakeven" ? "bg-black text-white shadow-xs" : "text-neutral-700 hover:text-black"
            }`}
          >
            Break-Even
          </button>
        </div>
      </div>

      <div className="pt-6">
        {activeTool === "margin" && <MarginCalculator />}
        {activeTool === "gst" && <GstCalculator />}
        {activeTool === "discount" && <DiscountCalculator />}
        {activeTool === "roas" && <RoasCalculator />}
        {activeTool === "breakeven" && <BreakevenCalculator />}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 1. PROFIT MARGIN CALCULATOR                                                */
/* -------------------------------------------------------------------------- */

function MarginCalculator() {
  const [cost, setCost] = useState<number>(350);
  const [packaging, setPackaging] = useState<number>(35);
  const [shipping, setShipping] = useState<number>(75);
  const [sellingPrice, setSellingPrice] = useState<number>(899);

  const totalCost = cost + packaging + shipping;
  const netProfit = sellingPrice - totalCost;
  const marginPercent = sellingPrice > 0 ? ((netProfit / sellingPrice) * 100).toFixed(1) : "0";
  const markupPercent = totalCost > 0 ? ((netProfit / totalCost) * 100).toFixed(1) : "0";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <div className="lg:col-span-7 space-y-4">
        <h3 className="text-base font-bold text-neutral-900">Enter Your Product Costs</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Manufacturing / Cost Price (₹)
            </label>
            <input
              type="number"
              min="0"
              value={cost || ""}
              onChange={(e) => setCost(Number(e.target.value) || 0)}
              className="w-full h-10 px-3 rounded-lg border border-neutral-300 text-sm font-medium focus:ring-2 focus:ring-black outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Packaging & Branding (₹)
            </label>
            <input
              type="number"
              min="0"
              value={packaging || ""}
              onChange={(e) => setPackaging(Number(e.target.value) || 0)}
              className="w-full h-10 px-3 rounded-lg border border-neutral-300 text-sm font-medium focus:ring-2 focus:ring-black outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Average Shipping & Handling (₹)
            </label>
            <input
              type="number"
              min="0"
              value={shipping || ""}
              onChange={(e) => setShipping(Number(e.target.value) || 0)}
              className="w-full h-10 px-3 rounded-lg border border-neutral-300 text-sm font-medium focus:ring-2 focus:ring-black outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Target Selling Price (₹)
            </label>
            <input
              type="number"
              min="0"
              value={sellingPrice || ""}
              onChange={(e) => setSellingPrice(Number(e.target.value) || 0)}
              className="w-full h-10 px-3 rounded-lg border border-neutral-300 text-sm font-medium focus:ring-2 focus:ring-black outline-none"
            />
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-neutral-600 space-y-1">
          <p className="font-semibold text-neutral-800">💡 D2C Margin Benchmark:</p>
          <p>
            Healthy e-commerce brands in India aim for a minimum of <strong>45% to 65% Net Margin</strong> to comfortably absorb returns (RTO) and ad acquisition costs.
          </p>
        </div>
      </div>

      <div className="lg:col-span-5 rounded-2xl bg-neutral-950 text-white p-6 shadow-xl flex flex-col justify-between">
        <div>
          <span className="text-xs uppercase font-bold tracking-wider text-neutral-400">Profitability Summary</span>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold tracking-tight text-white">
              ₹{netProfit.toLocaleString("en-IN")}
            </span>
            <span className="text-sm font-medium text-neutral-300">Net Profit / Unit</span>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 border-t border-neutral-800 pt-5">
            <div>
              <span className="text-xs text-neutral-400 block">Profit Margin</span>
              <span className={`text-2xl font-bold ${Number(marginPercent) >= 40 ? "text-emerald-400" : "text-amber-400"}`}>
                {marginPercent}%
              </span>
            </div>
            <div>
              <span className="text-xs text-neutral-400 block">Markup on Cost</span>
              <span className="text-2xl font-bold text-white">
                {markupPercent}%
              </span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-neutral-800 text-xs text-neutral-300 flex justify-between">
            <span>Total Landed Cost:</span>
            <span className="font-semibold text-white">₹{totalCost.toLocaleString("en-IN")}</span>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-neutral-800 text-[11px] text-neutral-400 text-center">
          Net Margin = (Profit ÷ Selling Price) × 100
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 2. GST CALCULATOR                                                          */
/* -------------------------------------------------------------------------- */

function GstCalculator() {
  const [amount, setAmount] = useState<number>(1000);
  const [rate, setRate] = useState<number>(18);
  const [mode, setMode] = useState<"exclusive" | "inclusive">("exclusive");

  const gstRate = rate / 100;
  let baseAmount = 0;
  let gstAmount = 0;
  let totalAmount = 0;

  if (mode === "exclusive") {
    baseAmount = amount;
    gstAmount = amount * gstRate;
    totalAmount = amount + gstAmount;
  } else {
    totalAmount = amount;
    baseAmount = amount / (1 + gstRate);
    gstAmount = amount - baseAmount;
  }

  const cgst = gstAmount / 2;
  const sgst = gstAmount / 2;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <div className="lg:col-span-7 space-y-4">
        <h3 className="text-base font-bold text-neutral-900">Calculate Indian GST Breakdown</h3>
        
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMode("exclusive")}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all ${
              mode === "exclusive"
                ? "bg-black text-white border-black shadow-xs"
                : "bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50"
            }`}
          >
            GST Exclusive (Add Tax)
          </button>
          <button
            type="button"
            onClick={() => setMode("inclusive")}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all ${
              mode === "inclusive"
                ? "bg-black text-white border-black shadow-xs"
                : "bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50"
            }`}
          >
            GST Inclusive (Extract Tax)
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              {mode === "exclusive" ? "Net Price / Pre-Tax Amount (₹)" : "MRP / Total Invoiced Price (₹)"}
            </label>
            <input
              type="number"
              min="0"
              value={amount || ""}
              onChange={(e) => setAmount(Number(e.target.value) || 0)}
              className="w-full h-10 px-3 rounded-lg border border-neutral-300 text-sm font-medium focus:ring-2 focus:ring-black outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Select GST Slab (%)
            </label>
            <select
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
              className="w-full h-10 px-3 rounded-lg border border-neutral-300 text-sm font-medium focus:ring-2 focus:ring-black outline-none bg-white"
            >
              <option value={0}>0% — Fresh Unpackaged Foods</option>
              <option value={3}>3% — Gold & Silver Jewellery</option>
              <option value={5}>5% — Apparel (&lt;₹1,000) & Packaged Staples</option>
              <option value={12}>12% — Apparel (&gt;₹1,000) & Processed Foods</option>
              <option value={18}>18% — Skincare, Cosmetics & Lifestyle (Default)</option>
              <option value={28}>28% — Luxury Goods</option>
            </select>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-neutral-600 space-y-1">
          <p className="font-semibold text-neutral-800">State vs Interstate Rule:</p>
          <p>
            When shipping inside your own state: <strong>CGST ({(rate/2)}%)</strong> + <strong>SGST ({(rate/2)}%)</strong> applies. When shipping to another state: <strong>IGST ({rate}%)</strong> applies.
          </p>
        </div>
      </div>

      <div className="lg:col-span-5 rounded-2xl bg-neutral-950 text-white p-6 shadow-xl">
        <span className="text-xs uppercase font-bold tracking-wider text-neutral-400">Tax Invoice Breakdown</span>
        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-4xl font-extrabold tracking-tight text-white">
            ₹{totalAmount.toFixed(2)}
          </span>
          <span className="text-sm font-medium text-neutral-300">Final Total</span>
        </div>

        <div className="mt-6 space-y-3 border-t border-neutral-800 pt-4 text-xs">
          <div className="flex justify-between text-neutral-300">
            <span>Base Taxable Value:</span>
            <span className="font-semibold text-white">₹{baseAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-neutral-300">
            <span>Total GST ({rate}%):</span>
            <span className="font-semibold text-emerald-400">₹{gstAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-neutral-400 pl-3 border-l border-neutral-700">
            <span>CGST ({(rate / 2)}%):</span>
            <span>₹{cgst.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-neutral-400 pl-3 border-l border-neutral-700">
            <span>SGST ({(rate / 2)}%):</span>
            <span>₹{sgst.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 3. DISCOUNT & SALE CALCULATOR                                              */
/* -------------------------------------------------------------------------- */

function DiscountCalculator() {
  const [mrp, setMrp] = useState<number>(1499);
  const [discountType, setDiscountType] = useState<"percent" | "flat">("percent");
  const [discountVal, setDiscountVal] = useState<number>(20);

  let savings = 0;
  let finalPrice = mrp;
  let effectivePercent = 0;

  if (discountType === "percent") {
    savings = (mrp * Math.min(100, Math.max(0, discountVal))) / 100;
    finalPrice = Math.max(0, mrp - savings);
    effectivePercent = discountVal;
  } else {
    savings = Math.min(mrp, Math.max(0, discountVal));
    finalPrice = Math.max(0, mrp - savings);
    effectivePercent = mrp > 0 ? (savings / mrp) * 100 : 0;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <div className="lg:col-span-7 space-y-4">
        <h3 className="text-base font-bold text-neutral-900">Calculate Customer Savings</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Original MRP / Catalog Price (₹)
            </label>
            <input
              type="number"
              min="0"
              value={mrp || ""}
              onChange={(e) => setMrp(Number(e.target.value) || 0)}
              className="w-full h-10 px-3 rounded-lg border border-neutral-300 text-sm font-medium focus:ring-2 focus:ring-black outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Discount Type
            </label>
            <div className="flex rounded-lg border border-neutral-300 p-0.5 bg-neutral-100">
              <button
                type="button"
                onClick={() => setDiscountType("percent")}
                className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  discountType === "percent" ? "bg-white text-black shadow-xs" : "text-neutral-600"
                }`}
              >
                Percentage (%)
              </button>
              <button
                type="button"
                onClick={() => setDiscountType("flat")}
                className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  discountType === "flat" ? "bg-white text-black shadow-xs" : "text-neutral-600"
                }`}
              >
                Flat Amount (₹)
              </button>
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              {discountType === "percent" ? "Discount Percentage (%)" : "Flat Discount Amount (₹)"}
            </label>
            <input
              type="number"
              min="0"
              max={discountType === "percent" ? 100 : mrp}
              value={discountVal || ""}
              onChange={(e) => setDiscountVal(Number(e.target.value) || 0)}
              className="w-full h-10 px-3 rounded-lg border border-neutral-300 text-sm font-medium focus:ring-2 focus:ring-black outline-none"
            />
          </div>
        </div>
      </div>

      <div className="lg:col-span-5 rounded-2xl bg-neutral-950 text-white p-6 shadow-xl">
        <span className="text-xs uppercase font-bold tracking-wider text-neutral-400">Checkout Price</span>
        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-4xl font-extrabold tracking-tight text-white">
            ₹{Math.round(finalPrice).toLocaleString("en-IN")}
          </span>
          <span className="text-sm line-through text-neutral-400">
            ₹{mrp.toLocaleString("en-IN")}
          </span>
        </div>

        <div className="mt-6 border-t border-neutral-800 pt-4 space-y-2 text-xs">
          <div className="flex justify-between text-neutral-300">
            <span>Customer Saves:</span>
            <span className="font-bold text-emerald-400">₹{Math.round(savings).toLocaleString("en-IN")}</span>
          </div>
          <div className="flex justify-between text-neutral-300">
            <span>Effective Discount:</span>
            <span className="font-bold text-white">{effectivePercent.toFixed(1)}% OFF</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 4. ROAS (AD PROFITABILITY) CALCULATOR                                      */
/* -------------------------------------------------------------------------- */

function RoasCalculator() {
  const [adSpend, setAdSpend] = useState<number>(5000);
  const [adRevenue, setAdRevenue] = useState<number>(18500);
  const [ordersCount, setOrdersCount] = useState<number>(15);

  const roas = adSpend > 0 ? (adRevenue / adSpend).toFixed(2) : "0";
  const cac = ordersCount > 0 ? (adSpend / ordersCount).toFixed(0) : "0";
  const aov = ordersCount > 0 ? (adRevenue / ordersCount).toFixed(0) : "0";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <div className="lg:col-span-7 space-y-4">
        <h3 className="text-base font-bold text-neutral-900">Meta & Google Ads Efficiency</h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Total Ad Spend (₹)
            </label>
            <input
              type="number"
              min="0"
              value={adSpend || ""}
              onChange={(e) => setAdSpend(Number(e.target.value) || 0)}
              className="w-full h-10 px-3 rounded-lg border border-neutral-300 text-sm font-medium focus:ring-2 focus:ring-black outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Revenue Generated (₹)
            </label>
            <input
              type="number"
              min="0"
              value={adRevenue || ""}
              onChange={(e) => setAdRevenue(Number(e.target.value) || 0)}
              className="w-full h-10 px-3 rounded-lg border border-neutral-300 text-sm font-medium focus:ring-2 focus:ring-black outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Orders Received
            </label>
            <input
              type="number"
              min="1"
              value={ordersCount || ""}
              onChange={(e) => setOrdersCount(Number(e.target.value) || 1)}
              className="w-full h-10 px-3 rounded-lg border border-neutral-300 text-sm font-medium focus:ring-2 focus:ring-black outline-none"
            />
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-neutral-600">
          <p className="font-semibold text-neutral-800">Target ROAS Guidelines:</p>
          <p>
            • Below 2.0x: Likely unprofitable after factoring product cost and courier fees.
            <br />
            • 3.0x – 4.5x: Strong D2C performance with positive contribution margins.
          </p>
        </div>
      </div>

      <div className="lg:col-span-5 rounded-2xl bg-neutral-950 text-white p-6 shadow-xl">
        <span className="text-xs uppercase font-bold tracking-wider text-neutral-400">ROAS Performance</span>
        <div className="mt-4 flex items-baseline gap-2">
          <span className={`text-4xl font-extrabold tracking-tight ${Number(roas) >= 3 ? "text-emerald-400" : "text-amber-400"}`}>
            {roas}x
          </span>
          <span className="text-sm font-medium text-neutral-300">Return on Ad Spend</span>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 border-t border-neutral-800 pt-4 text-xs">
          <div>
            <span className="text-neutral-400 block">Est. CAC (Cost per Order)</span>
            <span className="text-lg font-bold text-white">₹{cac}</span>
          </div>
          <div>
            <span className="text-neutral-400 block">Average Order Value (AOV)</span>
            <span className="text-lg font-bold text-white">₹{aov}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 5. BREAK-EVEN CALCULATOR                                                   */
/* -------------------------------------------------------------------------- */

function BreakevenCalculator() {
  const [fixedCosts, setFixedCosts] = useState<number>(15000); // rent, shopersite plan, tools, shoot costs
  const [sellingPrice, setSellingPrice] = useState<number>(999);
  const [variableCost, setVariableCost] = useState<number>(450); // product + shipping + packaging

  const contributionMargin = Math.max(0, sellingPrice - variableCost);
  const breakEvenOrders = contributionMargin > 0 ? Math.ceil(fixedCosts / contributionMargin) : 0;
  const breakEvenRevenue = breakEvenOrders * sellingPrice;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <div className="lg:col-span-7 space-y-4">
        <h3 className="text-base font-bold text-neutral-900">Find Your Monthly Break-Even Point</h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Fixed Monthly Costs (₹)
            </label>
            <input
              type="number"
              min="0"
              value={fixedCosts || ""}
              onChange={(e) => setFixedCosts(Number(e.target.value) || 0)}
              className="w-full h-10 px-3 rounded-lg border border-neutral-300 text-sm font-medium focus:ring-2 focus:ring-black outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Average Selling Price (₹)
            </label>
            <input
              type="number"
              min="0"
              value={sellingPrice || ""}
              onChange={(e) => setSellingPrice(Number(e.target.value) || 0)}
              className="w-full h-10 px-3 rounded-lg border border-neutral-300 text-sm font-medium focus:ring-2 focus:ring-black outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Variable Cost / Unit (₹)
            </label>
            <input
              type="number"
              min="0"
              value={variableCost || ""}
              onChange={(e) => setVariableCost(Number(e.target.value) || 0)}
              className="w-full h-10 px-3 rounded-lg border border-neutral-300 text-sm font-medium focus:ring-2 focus:ring-black outline-none"
            />
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-neutral-600">
          <p className="font-semibold text-neutral-800">What are fixed costs?</p>
          <p>
            Your monthly store plan, photoshoot model/creator fees, workspace rent, and software utilities that you pay regardless of sales volume.
          </p>
        </div>
      </div>

      <div className="lg:col-span-5 rounded-2xl bg-neutral-950 text-white p-6 shadow-xl">
        <span className="text-xs uppercase font-bold tracking-wider text-neutral-400">Required Monthly Volume</span>
        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-4xl font-extrabold tracking-tight text-white">
            {breakEvenOrders}
          </span>
          <span className="text-sm font-medium text-neutral-300">Orders to Break Even</span>
        </div>

        <div className="mt-6 border-t border-neutral-800 pt-4 space-y-2 text-xs">
          <div className="flex justify-between text-neutral-300">
            <span>Unit Contribution Margin:</span>
            <span className="font-semibold text-white">₹{contributionMargin.toLocaleString("en-IN")}</span>
          </div>
          <div className="flex justify-between text-neutral-300">
            <span>Break-Even Sales Revenue:</span>
            <span className="font-bold text-emerald-400">₹{breakEvenRevenue.toLocaleString("en-IN")}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

