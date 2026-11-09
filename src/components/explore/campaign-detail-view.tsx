"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Sparkles,
  Tag,
  CheckCircle2,
  Clock,
  Truck,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import { FestiveCampaign } from "@/lib/explore-rich-data";

export function CampaignDetailView({
  campaign,
  onBack,
}: {
  campaign: FestiveCampaign;
  onBack: () => void;
}) {
  return (
    <div className="space-y-8 animate-in fade-in-50 duration-300">
      {/* Top Breadcrumb & Back Navigation */}
      <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-bold text-neutral-600 hover:text-black py-1.5 px-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Campaign Calendar</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-black text-white text-xs font-bold uppercase tracking-wider">
            {campaign.month}
          </span>
          <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
            {campaign.expectedOrderSurge}
          </span>
        </div>
      </div>

      {/* Main Campaign Header */}
      <div className="space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
          Festive Retail Strategy Document • Prep: {campaign.prepWindow}
        </span>
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-neutral-950">
          {campaign.name}
        </h1>
        <p className="text-base sm:text-lg text-neutral-600 font-medium max-w-3xl leading-relaxed">
          {campaign.tagline}
        </p>
      </div>

      {/* Full-bleed Photo Banner */}
      <div className="relative rounded-[28px] overflow-hidden aspect-[16/8] sm:aspect-[21/9] bg-neutral-100 shadow-lg">
        <img
          src={campaign.imageUrl}
          alt={campaign.name}
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute bottom-6 left-6 right-6 text-white flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs text-neutral-300 font-semibold block uppercase tracking-wider">
              Primary Dates
            </span>
            <span className="text-xl sm:text-2xl font-black text-white block mt-0.5">
              {campaign.dateStr}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {campaign.bestFitCategories.map((cat, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-lg bg-white/20 backdrop-blur-md text-white text-xs font-semibold"
              >
                {cat}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Strategy Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 sm:p-8 rounded-[24px] border border-neutral-200 bg-neutral-50/70 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-950 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500" />
            Creative & Staging Direction
          </span>
          <p className="text-xs sm:text-sm text-neutral-700 leading-relaxed">
            {campaign.creativeDirection}
          </p>
        </div>

        <div className="p-6 sm:p-8 rounded-[24px] border border-neutral-200 bg-neutral-50/70 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-950 flex items-center gap-1.5">
            <Tag className="w-4 h-4 text-emerald-600" />
            Pricing & Discount Architecture
          </span>
          <p className="text-xs sm:text-sm text-neutral-700 leading-relaxed">
            {campaign.discountStrategy}
          </p>
        </div>
      </div>

      {/* Detailed Week-by-Week Preparation Timeline Roadmap */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
          <h2 className="text-xl font-bold text-neutral-950">
            Week-by-Week Preparation Roadmap
          </h2>
          <span className="text-xs text-neutral-500">Chronological execution checklist</span>
        </div>

        <div className="space-y-4">
          {campaign.weeklyRoadmap.map((phase, idx) => (
            <div
              key={idx}
              className="p-6 rounded-[22px] border border-neutral-200 bg-white shadow-2xs space-y-3"
            >
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-black text-white text-xs font-bold flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <h3 className="text-base font-bold text-neutral-950">{phase.phase}</h3>
                </div>
                <span className="text-xs font-extrabold text-neutral-700 px-3 py-1 rounded-full bg-neutral-100">
                  {phase.timeline}
                </span>
              </div>

              <ul className="space-y-2 text-xs sm:text-sm text-neutral-700 pt-1">
                {phase.tasks.map((task, tIdx) => (
                  <li key={tIdx} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{task}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Logistics & Delivery Cut-Off Notice */}
      <div className="p-6 rounded-[22px] bg-neutral-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
            <Truck className="w-4 h-4 text-white" />
            Courier Delivery Cut-Off Protocol
          </span>
          <p className="text-xs sm:text-sm text-neutral-300 max-w-xl leading-relaxed">
            Interstate Indian couriers face peak congestion 5 days before major festivals. Display a countdown timer in your store announcement bar to nudge orders early.
          </p>
        </div>

        <Link
          href="/dashboard"
          className="px-5 py-2.5 rounded-xl bg-white text-black text-xs font-bold hover:bg-neutral-200 transition-colors shrink-0 text-center"
        >
          Open Seller Dashboard
        </Link>
      </div>
    </div>
  );
}

