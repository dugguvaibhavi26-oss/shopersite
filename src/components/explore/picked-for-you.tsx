"use client";

import React, { useState } from "react";
import { Sparkles, Palette, ArrowRight, Copy, Check, ExternalLink } from "lucide-react";
import { PICKED_CATEGORIES } from "@/lib/explore-data";
import Link from "next/link";

export function PickedForYou() {
  const [activeCategory, setActiveCategory] = useState<string>("Fashion");
  const [copied, setCopied] = useState(false);

  const categories = Object.keys(PICKED_CATEGORIES);
  const current = PICKED_CATEGORIES[activeCategory];

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-[20px] border border-neutral-200/90 bg-white p-5 sm:p-8 shadow-[0_4px_24px_-10px_rgba(0,0,0,0.06)]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-800 text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 text-black" />
            Curated Recommendations
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-950">
            Picked For Your Niche
          </h2>
          <p className="text-sm text-neutral-600 mt-1">
            Personalized theme suggestions, campaign ideas, and marketing copy tailored to your industry.
          </p>
        </div>

        {/* Category selector */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-neutral-100 border border-neutral-200">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                setActiveCategory(cat);
                setCopied(false);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeCategory === cat
                  ? "bg-black text-white shadow-xs"
                  : "text-neutral-700 hover:text-black"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="pt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column: Theme & Product Recommendations */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-5">
          <div>
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
              {current.category}
            </span>
            <h3 className="text-lg font-bold text-neutral-950 mt-1">{current.tagline}</h3>

            <div className="mt-4">
              <span className="text-xs font-semibold text-neutral-700 block mb-2">
                Trending Product Formats in this Category:
              </span>
              <div className="flex flex-wrap gap-2">
                {current.featuredProductIdeas.map((idea) => (
                  <span
                    key={idea}
                    className="px-2.5 py-1 rounded-lg bg-neutral-100 border border-neutral-200 text-xs font-medium text-neutral-800"
                  >
                    {idea}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Theme suggestion card */}
          <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/70 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-neutral-950 text-white flex items-center justify-center shrink-0">
                <Palette className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-neutral-950">{current.suggestedTheme.name}</span>
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-white border border-neutral-200 text-neutral-600">
                    Recommended Theme
                  </span>
                </div>
                <p className="text-xs text-neutral-600 line-clamp-1">{current.suggestedTheme.tagline}</p>
              </div>
            </div>

            <Link
              href={`/themes?theme=${current.suggestedTheme.slug}`}
              className="inline-flex items-center gap-1 text-xs font-bold text-black hover:underline shrink-0"
            >
              Preview
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Right Column: Campaign & Copy Snippet */}
        <div className="lg:col-span-5 rounded-2xl bg-neutral-950 text-white p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3 mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Recommended Campaign
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-neutral-800 text-neutral-300">
                High Impact
              </span>
            </div>

            <h4 className="text-base font-bold text-white">{current.recommendedCampaign.title}</h4>
            <p className="text-xs text-neutral-300 mt-1 leading-relaxed">
              {current.recommendedCampaign.action}
            </p>

            <div className="mt-5 pt-4 border-t border-neutral-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-neutral-400 font-medium">
                  {current.marketingSnippet.channel}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(current.marketingSnippet.text)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-neutral-300 hover:text-white"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs font-mono bg-neutral-900 border border-neutral-800 p-3 rounded-xl text-neutral-200 leading-relaxed">
                "{current.marketingSnippet.text}"
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

