"use client";

import React, { useState } from "react";
import { TrendingUp, Sparkles, Tag, Eye, Lightbulb, ArrowUpRight } from "lucide-react";
import { TRENDING_ITEMS, type TrendingItem } from "@/lib/explore-data";
import Link from "next/link";

export function TrendingSection() {
  const [selectedCat, setSelectedCat] = useState<string>("All");

  const categories = ["All", "Fashion", "Jewellery", "Beauty", "Home", "Food"];

  const filtered = TRENDING_ITEMS.filter(
    (item) => selectedCat === "All" || item.category === selectedCat
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-800 text-xs font-semibold uppercase tracking-wider mb-2">
            <TrendingUp className="w-3.5 h-3.5 text-black" />
            Social E-Commerce Velocity
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-950">
            What's Trending in D2C India
          </h2>
          <p className="text-sm text-neutral-600 mt-1">
            Fast-growing categories, high-velocity consumer search patterns, and trending product presentation formats.
          </p>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-neutral-100 border border-neutral-200">
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

      {/* Grid of Trending Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="flex flex-col justify-between rounded-[20px] border border-neutral-200/90 bg-white p-5 sm:p-6 transition-all hover:border-neutral-400 hover:shadow-[0_8px_24px_-10px_rgba(0,0,0,0.08)] group"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-800 border border-neutral-200">
                  {item.category}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <TrendingUp className="w-3 h-3" />
                  {item.growthRate}
                </span>
              </div>

              <h3 className="text-lg font-bold text-neutral-950 group-hover:text-neutral-800 transition-colors">
                {item.title}
              </h3>
              <p className="text-xs font-medium text-neutral-500 mt-0.5">{item.season}</p>
              
              <p className="text-xs text-neutral-600 mt-3 leading-relaxed">
                {item.description}
              </p>

              {/* Presentation Tips */}
              <div className="mt-4 pt-3.5 border-t border-neutral-100">
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-900 flex items-center gap-1.5 mb-2">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                  Presentation & Photography Tips
                </span>
                <ul className="space-y-1.5 text-xs text-neutral-600">
                  {item.presentationTips.map((tip, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 mt-1.5 shrink-0" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-neutral-100 flex flex-wrap items-center gap-1.5">
              {item.suggestedTags.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] font-medium text-neutral-500 bg-neutral-50 px-2 py-0.5 rounded-md border border-neutral-200/60"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Emerging Selling Trends Banner */}
      <div className="rounded-2xl bg-neutral-950 text-white p-6 sm:p-8 mt-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-white" />
              Emerging 2026 Selling Shifts
            </span>
            <h3 className="text-lg sm:text-xl font-bold text-white">
              The 4 Pillars Powering High-Growth Indian Social Brands
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 text-xs text-neutral-300">
              <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800">
                <span className="font-bold text-white block mb-0.5">1. WhatsApp VIP Broadcasts</span>
                Drop previews exclusively to loyal buyers 24h before public Instagram launch.
              </div>
              <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800">
                <span className="font-bold text-white block mb-0.5">2. 60-Second Video Commerce</span>
                Short embedded video loops showing textile drape and authenticity on mobile screens.
              </div>
              <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800">
                <span className="font-bold text-white block mb-0.5">3. 1-Tap Direct UPI Payment</span>
                Zero-friction UPI QR checkouts that bypass multi-field credit card forms.
              </div>
              <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800">
                <span className="font-bold text-white block mb-0.5">4. Zero-Inventory Pre-Orders</span>
                Validating demand with 50-unit pre-orders before investing capital into bulk manufacturing.
              </div>
            </div>
          </div>

          <div className="shrink-0">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-neutral-950 text-xs font-bold hover:bg-neutral-100 transition-colors"
            >
              Start Your Shop
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

