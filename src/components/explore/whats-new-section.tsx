"use client";

import React, { useState } from "react";
import { Sparkles, CheckCircle2, Clock, Calendar, ArrowRight } from "lucide-react";
import { PLATFORM_CHANGELOG, type ChangelogItem } from "@/lib/explore-data";

export function WhatsNewSection() {
  const [selectedStatus, setSelectedStatus] = useState<string>("All");

  const statuses = ["All", "Released", "In Progress", "Planned"];

  const filtered = PLATFORM_CHANGELOG.filter(
    (item) => selectedStatus === "All" || item.status === selectedStatus
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-800 text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 text-black" />
            Platform Development & Roadmap
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-950">
            What's New in Shopersite
          </h2>
          <p className="text-sm text-neutral-600 mt-1">
            Chronological log of new capabilities, theme updates, payment integrations, and our upcoming roadmap.
          </p>
        </div>

        {/* Status filters */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-neutral-100 border border-neutral-200">
          {statuses.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSelectedStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedStatus === s
                  ? "bg-black text-white shadow-xs"
                  : "text-neutral-700 hover:text-black"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {filtered.map((item, idx) => (
          <div
            key={idx}
            className="rounded-[20px] border border-neutral-200/90 bg-white p-5 sm:p-7 transition-all hover:border-neutral-400"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-4">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="font-mono text-xs font-extrabold px-2.5 py-1 rounded-lg bg-neutral-950 text-white">
                  {item.version}
                </span>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    item.status === "Released"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : item.status === "In Progress"
                      ? "bg-amber-50 text-amber-700 border border-amber-200"
                      : "bg-blue-50 text-blue-700 border border-blue-200"
                  }`}
                >
                  {item.status}
                </span>
                <span className="text-xs font-medium text-neutral-500">{item.date}</span>
                {item.planRequired && (
                  <span className="text-[10px] font-semibold text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded">
                    {item.planRequired}
                  </span>
                )}
              </div>
              <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                {item.type}
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-bold text-neutral-950 mt-4 mb-3">
              {item.title}
            </h3>

            <ul className="space-y-2 text-xs sm:text-sm text-neutral-700">
              {item.highlights.map((h, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-neutral-900 mt-2 shrink-0" />
                  <span className="leading-relaxed">{h}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

