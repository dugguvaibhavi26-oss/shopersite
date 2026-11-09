"use client";

import React from "react";
import { Newspaper, Calendar, ArrowRight, User, Sparkles, CheckCircle2 } from "lucide-react";
import { NEWSROOM_ARTICLES, type NewsArticle } from "@/lib/explore-rich-data";
import { WhatsNewSection } from "@/components/explore/whats-new-section";

export function NewsStreamFlow({
  onSelectArticle,
}: {
  onSelectArticle: (article: NewsArticle) => void;
}) {
  const featured = NEWSROOM_ARTICLES[0];
  const others = NEWSROOM_ARTICLES.slice(1);

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="border-b border-neutral-200 pb-6 space-y-4">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-800 text-xs font-semibold uppercase tracking-wider">
          <Newspaper className="w-3.5 h-3.5 text-black" />
          Official Platform Press & Milestones
        </div>
        <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-neutral-950">
          Shopersite Platform Newsroom
        </h1>
        <p className="text-sm text-neutral-600 mt-1 max-w-2xl leading-relaxed">
          Official releases, mobile architecture developments, logistics integrations, and verified seller milestone announcements.
        </p>
      </div>

      {/* Featured Lead Story */}
      {featured && (
        <div
          onClick={() => onSelectArticle(featured)}
          className="group cursor-pointer rounded-[28px] border border-neutral-200 bg-white overflow-hidden shadow-md hover:border-black hover:shadow-xl transition-all duration-300"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
            <div className="lg:col-span-6 p-6 sm:p-10 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2.5 py-0.5 rounded-full bg-black text-white text-[10px] font-bold uppercase tracking-wider">
                    {featured.badge}
                  </span>
                  <span className="text-xs text-neutral-500 font-medium">{featured.date}</span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-950 leading-tight">
                  {featured.title}
                </h2>

                <p className="text-sm text-neutral-600 mt-3 leading-relaxed">
                  {featured.summary}
                </p>
              </div>

              <div className="pt-4 border-t border-neutral-100 flex items-center justify-between">
                <span className="text-xs text-neutral-500 font-medium">By {featured.author}</span>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-900 group-hover:underline">
                  <span>Read Full Statement</span>
                  <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </div>

            <div className="lg:col-span-6 relative min-h-[260px] lg:min-h-full overflow-hidden bg-neutral-100">
              <img
                src={featured.imageUrl}
                alt={featured.title}
                className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
              />
            </div>
          </div>
        </div>
      )}

      {/* Other News Items */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-900">
          Recent Platform Announcements
        </h3>
        <div className="divide-y divide-neutral-200 border-y border-neutral-200">
          {others.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectArticle(item)}
              className="py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer group hover:bg-neutral-50 -mx-3 px-3 rounded-2xl transition-all"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-neutral-100 shrink-0 border border-neutral-200">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-800 text-[10px] font-bold uppercase">
                      {item.category}
                    </span>
                    <span className="text-xs text-neutral-400 font-medium">{item.date}</span>
                  </div>

                  <h4 className="text-base font-bold text-neutral-950 group-hover:text-black transition-colors mt-1 truncate">
                    {item.title}
                  </h4>

                  <p className="text-xs text-neutral-500 mt-0.5 line-clamp-1 max-w-xl">
                    {item.summary}
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="px-4 py-2 rounded-xl bg-neutral-100 group-hover:bg-black group-hover:text-white text-neutral-900 text-xs font-bold transition-all flex items-center gap-1.5 self-end sm:self-center shrink-0"
              >
                <span>Read Article</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Product Changelog Section */}
      <WhatsNewSection />
    </div>
  );
}

