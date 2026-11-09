"use client";

import React, { useState } from "react";
import { TrendingUp, ArrowRight, Sparkles, Filter, ChevronRight, Eye } from "lucide-react";
import { VISUAL_TRENDS, type VisualTrend } from "@/lib/explore-rich-data";

export function TrendingListFlow({
  onSelectTrend,
}: {
  onSelectTrend: (trend: VisualTrend) => void;
}) {
  const [selectedCat, setSelectedCat] = useState<string>("All");

  const categories = ["All", "Fashion", "Jewellery", "Beauty", "Home", "Food"];

  const filtered = VISUAL_TRENDS.filter(
    (t) => selectedCat === "All" || t.category === selectedCat
  );

  const featured = filtered[0] || VISUAL_TRENDS[0];

  return (
    <div className="space-y-8">
      {/* Top Section Header & Velocity Index Metrics Bar */}
      <div className="border-b border-neutral-200 pb-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-800 text-xs font-semibold uppercase tracking-wider mb-2">
              <TrendingUp className="w-3.5 h-3.5 text-black" />
              Social Commerce Velocity Index
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-neutral-950">
              Trending Niches Across Indian D2C
            </h1>
            <p className="text-sm text-neutral-600 mt-1 max-w-2xl leading-relaxed">
              Real-time search patterns, consumer willingness to pay, and visual presentation blueprints for high-velocity social brands.
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-neutral-100 border border-neutral-200 self-start sm:self-auto">
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setSelectedCat(c)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedCat === c
                    ? "bg-black text-white shadow-xs"
                    : "text-neutral-700 hover:text-black"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Macro D2C Benchmarks */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
          <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200/80">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
              Active Tracked Niches
            </span>
            <span className="text-xl font-black text-neutral-950 mt-0.5 block">
              {VISUAL_TRENDS.length} Categories
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200/80">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
              Peak YoY Velocity
            </span>
            <span className="text-xl font-black text-emerald-600 mt-0.5 block">
              +210% Surge
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200/80">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
              Average Net Margin
            </span>
            <span className="text-xl font-black text-neutral-950 mt-0.5 block">
              52% – 68%
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200/80">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
              Primary Checkout Flow
            </span>
            <span className="text-xl font-black text-neutral-950 mt-0.5 block">
              1-Tap UPI QR
            </span>
          </div>
        </div>
      </div>

      {/* Hero Visual Spotlight Row */}
      {featured && (
        <div
          onClick={() => onSelectTrend(featured)}
          className="group cursor-pointer rounded-[28px] border border-neutral-200 bg-neutral-950 text-white overflow-hidden shadow-xl transition-all duration-300 hover:border-neutral-700"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
            <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-3 py-1 rounded-full bg-white/10 text-white border border-white/20 text-xs font-bold uppercase tracking-wider">
                    {featured.category} Spotlight
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-white text-xs font-bold">
                    Rank #1 • {featured.growthRate}
                  </span>
                </div>

                <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
                  {featured.title}
                </h2>

                <p className="text-sm text-neutral-300 mt-3 leading-relaxed max-w-xl">
                  {featured.description}
                </p>

                <div className="grid grid-cols-2 gap-4 mt-6 pt-5 border-t border-neutral-800 text-xs">
                  <div>
                    <span className="text-neutral-400 block">Average Basket Size</span>
                    <span className="text-lg font-bold text-white">{featured.averageBasketSize}</span>
                  </div>
                  <div>
                    <span className="text-neutral-400 block">Sweet Spot Pricing</span>
                    <span className="text-lg font-bold text-emerald-400">{featured.bestSellingPriceRange}</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex items-center gap-3">
                <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-neutral-950 text-xs font-bold group-hover:bg-neutral-200 transition-colors">
                  <span>Open Full Niche Dossier</span>
                  <ArrowRight className="w-4 h-4" />
                </span>
                <span className="text-xs text-neutral-400">Includes photography & copy blueprint</span>
              </div>
            </div>

            <div className="lg:col-span-5 relative min-h-[280px] lg:min-h-full overflow-hidden">
              <img
                src={featured.imageUrl}
                alt={featured.title}
                className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-neutral-950 via-neutral-950/20 to-transparent" />
            </div>
          </div>
        </div>
      )}

      {/* Directory Stream Layout (NOT product cards!) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-900">
            Market Intelligence Directory ({filtered.length} Niches)
          </h3>
          <span className="text-xs text-neutral-500">Tap any niche to open full dossier</span>
        </div>

        <div className="divide-y divide-neutral-200 border-y border-neutral-200">
          {filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectTrend(item)}
              className="py-4 sm:py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer group hover:bg-neutral-50 -mx-3 px-3 rounded-2xl transition-all"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-neutral-100 shrink-0 border border-neutral-200">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-neutral-400">
                      #{item.velocityRank}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-800 text-[10px] font-bold uppercase">
                      {item.category}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                      {item.growthRate}
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-neutral-950 group-hover:text-black transition-colors mt-1 truncate">
                    {item.title}
                  </h4>

                  <p className="text-xs text-neutral-500 mt-0.5 line-clamp-1 max-w-xl">
                    {item.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6 shrink-0 self-end sm:self-center pl-20 sm:pl-0">
                <div className="text-right hidden md:block">
                  <span className="text-[10px] text-neutral-400 uppercase font-semibold block">
                    Sweet Spot
                  </span>
                  <span className="text-xs font-bold text-neutral-900 block">
                    {item.bestSellingPriceRange}
                  </span>
                </div>

                <div className="text-right hidden sm:block">
                  <span className="text-[10px] text-neutral-400 uppercase font-semibold block">
                    Avg Basket
                  </span>
                  <span className="text-xs font-bold text-neutral-900 block">
                    {item.averageBasketSize}
                  </span>
                </div>

                <button
                  type="button"
                  className="px-4 py-2 rounded-xl bg-neutral-100 group-hover:bg-black group-hover:text-white text-neutral-900 text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <span>Read Dossier</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

