"use client";

import React, { useState } from "react";
import { Tag, Sparkles, TrendingUp, CheckCircle2 } from "lucide-react";
import { MARKETING_IDEAS } from "@/lib/explore-data";

export function MarketingDiscounts() {
  const [selectedType, setSelectedType] = useState<string>("All");

  const types = ["All", "Bundle", "Seasonal", "First Order", "VIP", "Retention"];

  const filtered = MARKETING_IDEAS.filter(
    (item) => selectedType === "All" || item.type === selectedType
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-800 text-xs font-semibold uppercase tracking-wider mb-2">
            <Tag className="w-3.5 h-3.5 text-black" />
            Strategic Promotion Blueprints
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-950">
            Discount & Promotional Ideas
          </h2>
          <p className="text-sm text-neutral-600 mt-1">
            Proven promotional models that drive urgency and increase basket size without eroding your brand equity.
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-neutral-100 border border-neutral-200">
          {types.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setSelectedType(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedType === t
                  ? "bg-black text-white shadow-xs"
                  : "text-neutral-700 hover:text-black"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((idea) => (
          <div
            key={idea.id}
            className="flex flex-col justify-between rounded-[20px] border border-neutral-200/90 bg-white p-5 sm:p-6 transition-all hover:border-neutral-400 hover:shadow-[0_8px_24px_-10px_rgba(0,0,0,0.08)]"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-800 border border-neutral-200">
                  {idea.type} Promotion
                </span>
                <span className="text-[11px] text-neutral-500 font-medium">
                  {idea.bestFor}
                </span>
              </div>

              <h3 className="text-base font-bold text-neutral-950 mb-2">{idea.title}</h3>

              <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-neutral-800 space-y-1">
                <span className="font-semibold text-neutral-900 block">Offer Structure:</span>
                <p className="font-mono text-neutral-700">{idea.structure}</p>
              </div>

              <div className="mt-3.5 space-y-2 text-xs">
                <div>
                  <span className="font-semibold text-neutral-900 block">Real Example:</span>
                  <p className="text-neutral-600 mt-0.5">{idea.example}</p>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3.5 border-t border-neutral-100 flex items-start gap-2 text-xs text-emerald-800 bg-emerald-50/60 p-2.5 rounded-lg border border-emerald-100">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{idea.benefit}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

