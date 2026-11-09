"use client";

import React, { useState } from "react";
import { Calendar, ChevronDown, ChevronUp, Clock, Sparkles, Tag, ArrowRight } from "lucide-react";
import { CAMPAIGN_EVENTS, type CampaignEvent } from "@/lib/explore-data";

export function CampaignCalendar() {
  const [selectedType, setSelectedType] = useState<string>("All");
  const [expandedId, setExpandedId] = useState<string | null>("cal-diwali");

  const types = ["All", "Indian Festival", "Seasonal Sale", "Global Event"];

  const filtered = CAMPAIGN_EVENTS.filter(
    (ev) => selectedType === "All" || ev.type === selectedType
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-800 text-xs font-semibold uppercase tracking-wider mb-2">
            <Calendar className="w-3.5 h-3.5 text-black" />
            Annual Indian Retail Roadmap
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-950">
            Campaign Calendar & Festive Planning
          </h2>
          <p className="text-sm text-neutral-600 mt-1">
            Plan your stock, discounts, and marketing campaigns ahead of major Indian festivals and seasonal sale dates.
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

      <div className="space-y-4">
        {filtered.map((event) => {
          const isOpen = expandedId === event.id;
          return (
            <div
              key={event.id}
              className="rounded-[18px] border border-neutral-200/90 bg-white transition-all overflow-hidden hover:border-neutral-400"
            >
              <div
                onClick={() => setExpandedId(isOpen ? null : event.id)}
                className="p-5 sm:p-6 flex items-start sm:items-center justify-between gap-4 cursor-pointer select-none"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5 flex-1">
                  <div className="flex flex-col items-start min-w-[130px]">
                    <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                      {event.month}
                    </span>
                    <span className="text-sm font-extrabold text-neutral-950 mt-0.5">
                      {event.dateStr}
                    </span>
                  </div>

                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base sm:text-lg font-bold text-neutral-950">
                        {event.name}
                      </h3>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-800 border border-neutral-200">
                        {event.type}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-neutral-600 mt-1 line-clamp-1 sm:line-clamp-none">
                      {event.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="hidden md:inline-flex items-center gap-1 text-xs font-medium text-neutral-500">
                    <Clock className="w-3.5 h-3.5" /> Start prep {event.prepWeeks}w prior
                  </span>
                  <div className="w-8 h-8 rounded-full border border-neutral-200 flex items-center justify-center text-neutral-600 hover:bg-neutral-100">
                    {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>
              </div>

              {isOpen && (
                <div className="px-5 sm:px-6 pb-6 pt-2 border-t border-neutral-100 bg-neutral-50/50 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-white border border-neutral-200/80 shadow-2xs">
                      <span className="text-xs font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        Campaign Concept
                      </span>
                      <p className="text-xs text-neutral-700 leading-relaxed">{event.campaignIdea}</p>
                    </div>

                    <div className="p-4 rounded-xl bg-white border border-neutral-200/80 shadow-2xs">
                      <span className="text-xs font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                        <Tag className="w-3.5 h-3.5 text-emerald-600" />
                        Discount Strategy
                      </span>
                      <p className="text-xs text-neutral-700 leading-relaxed">{event.discountStrategy}</p>
                    </div>
                  </div>

                  {/* Preparation Timeline */}
                  <div>
                    <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider mb-3">
                      Recommended Preparation Timeline
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {event.timeline.map((step, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-xl bg-white border border-neutral-200 text-xs flex flex-col justify-between"
                        >
                          <span className="font-extrabold text-neutral-950 mb-1 flex items-center gap-1.5">
                            <span className="w-4 h-4 rounded-full bg-neutral-950 text-white text-[10px] inline-flex items-center justify-center">
                              {idx + 1}
                            </span>
                            {step.week}
                          </span>
                          <p className="text-neutral-600 leading-relaxed text-[11px]">{step.action}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

