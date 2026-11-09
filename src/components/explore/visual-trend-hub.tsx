"use client";

import React, { useState } from "react";
import { TrendingUp, Sparkles, Eye, ArrowUpRight, X, Camera, Tag, Layers, Check } from "lucide-react";
import { VISUAL_TRENDS, type VisualTrend } from "@/lib/explore-rich-data";
import Link from "next/link";

export function VisualTrendHub() {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [activeTrend, setActiveTrend] = useState<VisualTrend | null>(null);

  const categories = ["All", "Fashion", "Jewellery", "Beauty", "Home", "Food"];

  const filtered = VISUAL_TRENDS.filter(
    (t) => selectedCategory === "All" || t.category === selectedCategory
  );

  return (
    <div className="space-y-6">
      {/* Header with Category Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-800 text-xs font-semibold uppercase tracking-wider mb-2">
            <TrendingUp className="w-3.5 h-3.5 text-black" />
            Social Commerce Velocity Index
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-950">
            What's Trending Across Indian D2C
          </h2>
          <p className="text-sm text-neutral-600 mt-1">
            Curated high-velocity product formats, consumer search volume, and visual presentation guides.
          </p>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-neutral-100 border border-neutral-200">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setSelectedCategory(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedCategory === c
                  ? "bg-black text-white shadow-xs"
                  : "text-neutral-700 hover:text-black"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Visual Magazine Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {filtered.map((trend) => (
          <div
            key={trend.id}
            onClick={() => setActiveTrend(trend)}
            className="group cursor-pointer rounded-[22px] border border-neutral-200/90 bg-white overflow-hidden transition-all duration-300 hover:border-black hover:shadow-[0_14px_30px_-12px_rgba(0,0,0,0.12)] flex flex-col justify-between"
          >
            <div>
              {/* Image Frame with Badges */}
              <div className="relative aspect-[3/4] overflow-hidden bg-neutral-100">
                <img
                  src={trend.imageUrl}
                  alt={trend.title}
                  loading="lazy"
                  className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

                {/* Top badges */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-black/75 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider border border-white/20">
                    {trend.category}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/90 backdrop-blur-md text-white text-[10px] font-bold flex items-center gap-1">
                    <TrendingUp className="w-2.5 h-2.5" />
                    {trend.growthRate}
                  </span>
                </div>

                {/* Bottom title on image */}
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <span className="text-[11px] text-neutral-300 font-medium block">
                    Rank #{trend.velocityRank} • {trend.season}
                  </span>
                  <h3 className="text-base font-extrabold text-white leading-snug line-clamp-2 mt-0.5">
                    {trend.title}
                  </h3>
                </div>
              </div>

              {/* Card Meta Content */}
              <div className="p-4 space-y-3">
                <p className="text-xs text-neutral-600 line-clamp-2 leading-relaxed">
                  {trend.description}
                </p>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-neutral-100 text-[11px]">
                  <div>
                    <span className="text-neutral-400 block">Avg. Basket</span>
                    <span className="font-bold text-neutral-900">{trend.averageBasketSize}</span>
                  </div>
                  <div>
                    <span className="text-neutral-400 block">Sweet Spot</span>
                    <span className="font-bold text-neutral-900">{trend.bestSellingPriceRange}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 pt-0">
              <button
                type="button"
                className="w-full py-2 px-3 rounded-xl bg-neutral-100 group-hover:bg-black group-hover:text-white text-neutral-800 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
              >
                <span>View Trend Guide</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Trend Deep Dive Modal */}
      {activeTrend && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[24px] bg-white text-neutral-950 p-6 sm:p-8 shadow-2xl animate-in zoom-in-95">
            <button
              type="button"
              onClick={() => setActiveTrend(null)}
              className="absolute right-4 top-4 w-9 h-9 rounded-full border border-neutral-200 flex items-center justify-center text-neutral-500 hover:bg-neutral-100 hover:text-black"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-800 text-xs font-bold uppercase">
                {activeTrend.category}
              </span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                {activeTrend.growthRate}
              </span>
            </div>

            <h2 className="text-2xl font-extrabold text-neutral-950">{activeTrend.title}</h2>
            <p className="text-xs text-neutral-500 font-medium mt-1">
              Season: {activeTrend.season} • Target Audience: {activeTrend.targetDemographic}
            </p>

            <div className="my-5 rounded-2xl overflow-hidden aspect-[16/9] relative">
              <img
                src={activeTrend.imageUrl}
                alt={activeTrend.title}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-neutral-700">
              <p className="leading-relaxed">{activeTrend.description}</p>

              <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200/90 space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-900 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-black" />
                  Photography & Presentation Blueprint
                </span>
                <ul className="space-y-1.5 text-xs text-neutral-700">
                  {activeTrend.photoStylingGuide.map((step, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-neutral-900 mt-1.5 shrink-0" />
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-900 block mb-2">
                  Top Performing Subcategories:
                </span>
                <div className="flex flex-wrap gap-2">
                  {activeTrend.topSubcategories.map((sub, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 rounded-lg bg-neutral-100 border border-neutral-200 text-xs font-semibold text-neutral-800"
                    >
                      {sub}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-neutral-950 text-white text-xs">
                <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                  Proven Product Description Hook:
                </span>
                <p className="font-mono text-neutral-200 leading-relaxed">
                  "{activeTrend.productHook}"
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-neutral-200 flex items-center justify-between">
              <Link
                href="/register"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-black hover:underline"
              >
                Launch This Category in 60s →
              </Link>
              <button
                type="button"
                onClick={() => setActiveTrend(null)}
                className="px-5 py-2 rounded-xl bg-black text-white text-xs font-bold"
              >
                Close Deep Dive
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

