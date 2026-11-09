"use client";

import React, { useState } from "react";
import { Sparkles, ArrowRight, Clock, TrendingUp, Calendar, BookOpen, Calculator, Newspaper, X, Palette } from "lucide-react";
import { HERO_STORIES, type VisualStory } from "@/lib/explore-rich-data";
import Link from "next/link";

export function RichMagazineHero({
  onSelectSection,
}: {
  onSelectSection: (sectionId: string) => void;
}) {
  const [selectedStory, setSelectedStory] = useState<VisualStory | null>(null);
  const featured = HERO_STORIES[0];

  return (
    <div className="space-y-6">
      {/* Featured Editorial Spotlight Banner */}
      <div className="relative overflow-hidden rounded-[24px] sm:rounded-[32px] bg-neutral-950 text-white border border-neutral-800 shadow-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
          {/* Left Text Column */}
          <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12 flex flex-col justify-between z-10">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="px-3 py-1 rounded-full bg-white/10 text-neutral-200 border border-white/20 text-xs font-semibold uppercase tracking-wider backdrop-blur-md flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                  {featured.badge}
                </span>
                <span className="text-xs text-neutral-400 font-medium">
                  {featured.readTime} • {featured.date}
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-[1.15]">
                {featured.title}
              </h1>

              <p className="text-sm sm:text-base text-neutral-300 mt-4 leading-relaxed line-clamp-3 sm:line-clamp-none">
                {featured.subtitle}
              </p>

              {/* Stat badges */}
              {featured.stats && (
                <div className="grid grid-cols-3 gap-3 sm:gap-4 mt-6 pt-6 border-t border-white/10">
                  {featured.stats.map((s, idx) => (
                    <div key={idx}>
                      <span className="text-lg sm:text-2xl font-black text-white block">
                        {s.value}
                      </span>
                      <span className="text-[11px] text-neutral-400 block mt-0.5 leading-tight">
                        {s.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setSelectedStory(featured)}
                className="px-6 py-3 rounded-xl bg-white text-neutral-950 text-xs font-bold hover:bg-neutral-100 transition-all shadow-md inline-flex items-center gap-2"
              >
                Read Cover Story
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => onSelectSection("trending")}
                className="px-5 py-3 rounded-xl bg-white/10 text-white text-xs font-semibold hover:bg-white/20 border border-white/10 transition-colors"
              >
                Explore Trending Categories
              </button>
            </div>
          </div>

          {/* Right Image Column */}
          <div className="lg:col-span-5 relative min-h-[300px] lg:min-h-full overflow-hidden">
            <img
              src={featured.imageUrl}
              alt={featured.title}
              className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-neutral-950 via-neutral-950/40 to-transparent" />
          </div>
        </div>
      </div>

      {/* Quick In-Page Ecosystem Destination Hub (App-style launchpad) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <button
          type="button"
          onClick={() => onSelectSection("trending")}
          className="p-4 rounded-2xl border border-neutral-200/90 bg-white hover:border-black hover:shadow-md transition-all text-left group"
        >
          <div className="w-9 h-9 rounded-xl bg-neutral-100 text-neutral-900 group-hover:bg-black group-hover:text-white flex items-center justify-center transition-colors mb-2.5">
            <TrendingUp className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-neutral-950 block">What's Trending</span>
          <span className="text-[11px] text-neutral-500 block mt-0.5">10 High-Growth Niches</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectSection("calendar")}
          className="p-4 rounded-2xl border border-neutral-200/90 bg-white hover:border-black hover:shadow-md transition-all text-left group"
        >
          <div className="w-9 h-9 rounded-xl bg-neutral-100 text-neutral-900 group-hover:bg-black group-hover:text-white flex items-center justify-center transition-colors mb-2.5">
            <Calendar className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-neutral-950 block">Campaign Calendar</span>
          <span className="text-[11px] text-neutral-500 block mt-0.5">Festive Sale Timelines</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectSection("creative")}
          className="p-4 rounded-2xl border border-neutral-200/90 bg-white hover:border-black hover:shadow-md transition-all text-left group"
        >
          <div className="w-9 h-9 rounded-xl bg-neutral-100 text-neutral-900 group-hover:bg-black group-hover:text-white flex items-center justify-center transition-colors mb-2.5">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-neutral-950 block">Creative Lab</span>
          <span className="text-[11px] text-neutral-500 block mt-0.5">1-Click Marketing Copy</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectSection("academy")}
          className="p-4 rounded-2xl border border-neutral-200/90 bg-white hover:border-black hover:shadow-md transition-all text-left group"
        >
          <div className="w-9 h-9 rounded-xl bg-neutral-100 text-neutral-900 group-hover:bg-black group-hover:text-white flex items-center justify-center transition-colors mb-2.5">
            <BookOpen className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-neutral-950 block">Seller Academy</span>
          <span className="text-[11px] text-neutral-500 block mt-0.5">6 Multi-Chapter Masterclasses</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectSection("tools")}
          className="p-4 rounded-2xl border border-neutral-200/90 bg-white hover:border-black hover:shadow-md transition-all text-left group"
        >
          <div className="w-9 h-9 rounded-xl bg-neutral-100 text-neutral-900 group-hover:bg-black group-hover:text-white flex items-center justify-center transition-colors mb-2.5">
            <Calculator className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-neutral-950 block">Business Tools</span>
          <span className="text-[11px] text-neutral-500 block mt-0.5">5 Interactive Calculators</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectSection("news")}
          className="p-4 rounded-2xl border border-neutral-200/90 bg-white hover:border-black hover:shadow-md transition-all text-left group"
        >
          <div className="w-9 h-9 rounded-xl bg-neutral-100 text-neutral-900 group-hover:bg-black group-hover:text-white flex items-center justify-center transition-colors mb-2.5">
            <Newspaper className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-neutral-950 block">Newsroom</span>
          <span className="text-[11px] text-neutral-500 block mt-0.5">Latest Announcements</span>
        </button>
      </div>

      {/* Full Article Reader Modal */}
      {selectedStory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-[24px] bg-white text-neutral-950 shadow-2xl p-6 sm:p-10 animate-in zoom-in-95">
            <button
              type="button"
              onClick={() => setSelectedStory(null)}
              className="absolute right-5 top-5 w-9 h-9 rounded-full border border-neutral-200 flex items-center justify-center text-neutral-500 hover:bg-neutral-100 hover:text-black"
            >
              <X className="w-4 h-4" />
            </button>

            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 block mb-2">
              {selectedStory.badge}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-950 leading-tight">
              {selectedStory.title}
            </h2>
            <p className="text-sm text-neutral-600 mt-2 font-medium">
              By {selectedStory.author} • {selectedStory.readTime} • {selectedStory.date}
            </p>

            <div className="my-6 rounded-2xl overflow-hidden aspect-[16/9]">
              <img
                src={selectedStory.imageUrl}
                alt={selectedStory.title}
                className="w-full h-full object-cover"
              />
            </div>

            <p className="text-base font-serif italic text-neutral-800 leading-relaxed border-l-2 border-black pl-4 my-6">
              "{selectedStory.leadParagraph}"
            </p>

            <div className="space-y-6 text-sm text-neutral-700 leading-relaxed">
              {selectedStory.sections.map((sec, i) => (
                <div key={i} className="space-y-2">
                  <h3 className="text-lg font-bold text-neutral-950">{sec.heading}</h3>
                  <p>{sec.body}</p>
                  {sec.highlight && (
                    <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200 text-neutral-900 font-semibold text-xs my-3">
                      💡 {sec.highlight}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-neutral-200 flex items-center justify-between">
              <span className="text-xs text-neutral-500">Shopersite D2C Research Collective</span>
              <button
                type="button"
                onClick={() => setSelectedStory(null)}
                className="px-5 py-2.5 rounded-xl bg-black text-white text-xs font-bold hover:bg-neutral-800"
              >
                Close Article
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

