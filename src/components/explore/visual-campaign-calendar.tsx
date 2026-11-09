"use client";

import React, { useState } from "react";
import { Calendar, Sparkles, Clock, ArrowRight, Tag, CheckCircle2, ChevronRight, X } from "lucide-react";
import { FESTIVE_CALENDAR, type FestiveCampaign } from "@/lib/explore-rich-data";

export function VisualCampaignCalendar() {
  const [selectedCampaign, setSelectedCampaign] = useState<FestiveCampaign | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-800 text-xs font-semibold uppercase tracking-wider mb-2">
            <Calendar className="w-3.5 h-3.5 text-black" />
            Annual Indian Retail Roadmap
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-950">
            Campaign Calendar & Festive Planning
          </h2>
          <p className="text-sm text-neutral-600 mt-1">
            Visual timelines, discount strategies, and week-by-week preparation roadmaps for peak Indian shopping seasons.
          </p>
        </div>
      </div>

      {/* Visual Banners Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {FESTIVE_CALENDAR.map((camp) => (
          <div
            key={camp.id}
            onClick={() => setSelectedCampaign(camp)}
            className="group cursor-pointer rounded-[24px] border border-neutral-200/90 bg-white overflow-hidden transition-all duration-300 hover:border-black hover:shadow-xl flex flex-col justify-between"
          >
            <div>
              {/* Photo Banner with Badges */}
              <div className="relative aspect-[16/9] overflow-hidden bg-neutral-100">
                <img
                  src={camp.imageUrl}
                  alt={camp.name}
                  loading="lazy"
                  className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-2">
                  <span className="px-3 py-1 rounded-full bg-black/80 backdrop-blur-md text-white text-xs font-bold uppercase tracking-wider border border-white/20">
                    {camp.month}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-emerald-500/90 backdrop-blur-md text-white text-xs font-bold">
                    {camp.expectedOrderSurge}
                  </span>
                </div>

                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <span className="text-xs text-neutral-300 font-medium block">
                    {camp.dateStr} • Prep: {camp.prepWindow}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-white mt-0.5">
                    {camp.name}
                  </h3>
                </div>
              </div>

              {/* Content Body */}
              <div className="p-5 sm:p-6 space-y-4">
                <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                  {camp.overview}
                </p>

                <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs space-y-1">
                  <span className="font-bold text-neutral-900 block flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-emerald-600" />
                    Recommended Discount Model:
                  </span>
                  <p className="text-neutral-700">{camp.discountStrategy}</p>
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-6 pt-0">
              <button
                type="button"
                className="w-full py-2.5 px-4 rounded-xl bg-neutral-100 group-hover:bg-black group-hover:text-white text-neutral-900 text-xs font-bold transition-colors flex items-center justify-center gap-2"
              >
                <span>View 4-Week Prep Checklist</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Campaign Roadmap Modal */}
      {selectedCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-[24px] bg-white text-neutral-950 p-6 sm:p-10 shadow-2xl animate-in zoom-in-95">
            <button
              type="button"
              onClick={() => setSelectedCampaign(null)}
              className="absolute right-5 top-5 w-9 h-9 rounded-full border border-neutral-200 flex items-center justify-center text-neutral-500 hover:bg-neutral-100 hover:text-black"
            >
              <X className="w-4 h-4" />
            </button>

            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 block mb-1">
              {selectedCampaign.dateStr} • {selectedCampaign.expectedOrderSurge}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-950">
              {selectedCampaign.name}
            </h2>
            <p className="text-xs sm:text-sm text-neutral-600 mt-1">
              {selectedCampaign.tagline}
            </p>

            <div className="my-5 rounded-2xl overflow-hidden aspect-[16/8] relative">
              <img
                src={selectedCampaign.imageUrl}
                alt={selectedCampaign.name}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200/90 text-xs sm:text-sm text-neutral-700 space-y-2">
                <span className="font-bold text-neutral-950 block uppercase tracking-wider text-xs flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Creative & Visual Direction
                </span>
                <p className="leading-relaxed">{selectedCampaign.creativeDirection}</p>
              </div>

              {/* Weekly Checklist Timeline */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-950 mb-3">
                  Week-by-Week Preparation Roadmap
                </h3>
                <div className="space-y-3">
                  {selectedCampaign.weeklyRoadmap.map((w, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl border border-neutral-200 bg-white shadow-2xs space-y-2"
                    >
                      <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
                        <span className="text-xs font-bold text-neutral-950">{w.phase}</span>
                        <span className="text-[11px] font-semibold text-neutral-500 px-2 py-0.5 rounded bg-neutral-100">
                          {w.timeline}
                        </span>
                      </div>
                      <ul className="space-y-1.5 text-xs text-neutral-600">
                        {w.tasks.map((task, tIdx) => (
                          <li key={tIdx} className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{task}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-neutral-200 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedCampaign(null)}
                className="px-6 py-2.5 rounded-xl bg-black text-white text-xs font-bold hover:bg-neutral-800"
              >
                Close Roadmap
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

