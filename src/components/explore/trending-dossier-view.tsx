"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  TrendingUp,
  Camera,
  Tag,
  Copy,
  Check,
  CheckCircle2,
  Sparkles,
  Layers,
  DollarSign,
  ChevronRight,
} from "lucide-react";
import { VISUAL_TRENDS, type VisualTrend } from "@/lib/explore-rich-data";

export function TrendingDossierView({
  trend,
  onBack,
}: {
  trend: VisualTrend;
  onBack: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopyHook = () => {
    navigator.clipboard.writeText(trend.productHook);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-300">
      {/* Top Breadcrumb & Back Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-bold text-neutral-600 hover:text-black py-1.5 px-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Trending Niches</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-800 text-xs font-bold uppercase tracking-wider">
            {trend.category}
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            {trend.growthRate}
          </span>
        </div>
      </div>

      {/* Main Dossier Header */}
      <div className="space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
          Niche Intelligence Dossier • Rank #{trend.velocityRank}
        </span>
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-neutral-950">
          {trend.title}
        </h1>
        <p className="text-base sm:text-lg text-neutral-600 font-medium max-w-3xl leading-relaxed">
          {trend.description}
        </p>
      </div>

      {/* Full-bleed Photo & Core Metrics Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-8 rounded-[24px] overflow-hidden aspect-[16/9] lg:aspect-auto min-h-[350px] relative bg-neutral-100 shadow-md">
          <img
            src={trend.imageUrl}
            alt={trend.title}
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 text-white">
            <span className="text-xs text-neutral-300 font-medium block">
              Season: {trend.season}
            </span>
            <span className="text-sm font-bold text-white block mt-0.5">
              Target Audience: {trend.targetDemographic}
            </span>
          </div>
        </div>

        {/* Quick Market Numbers Cockpit */}
        <div className="lg:col-span-4 rounded-[24px] bg-neutral-950 text-white p-6 sm:p-8 flex flex-col justify-between shadow-xl">
          <div className="space-y-6">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-400 block mb-1">
                Average Basket Size
              </span>
              <span className="text-3xl font-black text-white">{trend.averageBasketSize}</span>
            </div>

            <div className="border-t border-neutral-800 pt-4">
              <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-400 block mb-1">
                Optimal Sweet-Spot Price Bracket
              </span>
              <span className="text-2xl font-bold text-emerald-400">{trend.bestSellingPriceRange}</span>
            </div>

            <div className="border-t border-neutral-800 pt-4 text-xs text-neutral-300 space-y-1">
              <span className="font-bold text-white block">Key Consumer Trigger:</span>
              <p className="text-neutral-400 leading-relaxed">
                Indian shoppers prioritize verified fabric/material composition, scale references, and 1-tap UPI payment trust badges.
              </p>
            </div>
          </div>

          <div className="pt-6 border-t border-neutral-800">
            <Link
              href="/register"
              className="w-full py-3 rounded-xl bg-white text-neutral-950 text-xs font-bold hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2"
            >
              <span>Launch a Store in This Niche</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Deep-Dive Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
        {/* Photography & Staging Guide */}
        <div className="p-6 rounded-[24px] border border-neutral-200 bg-neutral-50/70 space-y-4">
          <div className="flex items-center gap-2 text-neutral-950 font-bold text-base">
            <Camera className="w-5 h-5 text-black" />
            <h3>Photography & Visual Presentation Blueprint</h3>
          </div>
          <p className="text-xs text-neutral-600 leading-relaxed">
            Follow these visual cues to elevate your smartphone photos and maximize conversion:
          </p>
          <ul className="space-y-2.5 text-xs sm:text-sm text-neutral-700">
            {trend.photoStylingGuide.map((guide, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-black text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span className="leading-relaxed">{guide}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Top Performing Subcategories */}
        <div className="p-6 rounded-[24px] border border-neutral-200 bg-white space-y-4 shadow-2xs">
          <div className="flex items-center gap-2 text-neutral-950 font-bold text-base">
            <Layers className="w-5 h-5 text-black" />
            <h3>Top Performing Subcategories & SKUs</h3>
          </div>
          <p className="text-xs text-neutral-600 leading-relaxed">
            These specific silhouettes and formats generate 70% of GMV within this category:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {trend.topSubcategories.map((sub, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-neutral-50 border border-neutral-200/80 text-xs font-bold text-neutral-900 flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{sub}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* High-Conversion Product Description Hook */}
      <div className="p-6 sm:p-8 rounded-[24px] bg-neutral-950 text-white space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 block">
              Ready-to-Use Copy Script
            </span>
            <h3 className="text-lg font-bold text-white mt-0.5">
              Proven High-Converting Product Hook
            </h3>
          </div>

          <button
            type="button"
            onClick={handleCopyHook}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied to Clipboard</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Script</span>
              </>
            )}
          </button>
        </div>

        <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 font-mono text-xs sm:text-sm text-neutral-200 leading-relaxed">
          "{trend.productHook}"
        </div>
      </div>
    </div>
  );
}

