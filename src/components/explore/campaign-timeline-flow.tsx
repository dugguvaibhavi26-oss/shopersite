"use client";

import React, { useState } from "react";
import { Calendar, Sparkles, ArrowRight, Tag, ChevronRight, Clock } from "lucide-react";
import { FESTIVE_CALENDAR, type FestiveCampaign } from "@/lib/explore-rich-data";

export function CampaignTimelineFlow({
  onSelectCampaign,
}: {
  onSelectCampaign: (campaign: FestiveCampaign) => void;
}) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-neutral-200 pb-6 space-y-4">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-800 text-xs font-semibold uppercase tracking-wider">
          <Calendar className="w-3.5 h-3.5 text-black" />
          Annual Indian Retail Calendar
        </div>
        <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-neutral-950">
          Festive Drops & Seasonal Campaign Timelines
        </h1>
        <p className="text-sm text-neutral-600 mt-1 max-w-2xl leading-relaxed">
          Plan inventory buffers, packaging supplies, and VIP WhatsApp broadcasts around India's highest spending celebration dates.
        </p>

        {/* Quick Macro Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
          <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200/80">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
              Peak Spending Season
            </span>
            <span className="text-xl font-black text-neutral-950 mt-0.5 block">
              October – February
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200/80">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
              Highest Basket Surge
            </span>
            <span className="text-xl font-black text-emerald-600 mt-0.5 block">
              +380% (Diwali)
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200/80">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
              Recommended Lead Time
            </span>
            <span className="text-xl font-black text-neutral-950 mt-0.5 block">
              4 to 6 Weeks Prior
            </span>
          </div>
        </div>
      </div>

      {/* Chronological Timeline Stream */}
      <div className="space-y-6">
        {FESTIVE_CALENDAR.map((camp, idx) => (
          <div
            key={camp.id}
            onClick={() => onSelectCampaign(camp)}
            className="group cursor-pointer rounded-[24px] border border-neutral-200 bg-white overflow-hidden shadow-2xs hover:border-black hover:shadow-xl transition-all duration-300"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
              {/* Photo Banner Segment */}
              <div className="lg:col-span-5 relative min-h-[220px] lg:min-h-full overflow-hidden bg-neutral-100">
                <img
                  src={camp.imageUrl}
                  alt={camp.name}
                  className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-black/80 via-black/20 to-transparent" />

                <div className="absolute top-3 left-3">
                  <span className="px-3 py-1 rounded-full bg-black/80 backdrop-blur-md text-white text-xs font-bold uppercase tracking-wider border border-white/20">
                    {camp.month}
                  </span>
                </div>

                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <span className="text-xs text-neutral-300 block font-medium">
                    {camp.dateStr}
                  </span>
                  <h3 className="text-xl font-black text-white mt-0.5">
                    {camp.name}
                  </h3>
                </div>
              </div>

              {/* Strategy Details Segment */}
              <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-bold text-neutral-500 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" /> Start prep {camp.prepWindow}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                      {camp.expectedOrderSurge}
                    </span>
                  </div>

                  <p className="text-sm text-neutral-700 leading-relaxed font-medium">
                    {camp.overview}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {camp.bestFitCategories.map((cat, cIdx) => (
                      <span
                        key={cIdx}
                        className="px-2.5 py-1 rounded-lg bg-neutral-100 text-neutral-800 text-xs font-semibold"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-neutral-100 flex items-center justify-between">
                  <span className="text-xs text-neutral-500 font-medium">
                    {camp.weeklyRoadmap.length} Execution Phases Planned
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-neutral-900 group-hover:text-black group-hover:translate-x-1 transition-all">
                    <span>Open Complete Strategy Document</span>
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

