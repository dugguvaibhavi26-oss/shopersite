"use client";

import React, { useState } from "react";
import { Newspaper, Calendar, ArrowRight, User, CheckCircle2, X } from "lucide-react";
import { NEWSROOM_ARTICLES, type NewsArticle } from "@/lib/explore-rich-data";

export function VisualNewsroom() {
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-800 text-xs font-semibold uppercase tracking-wider mb-2">
            <Newspaper className="w-3.5 h-3.5 text-black" />
            Official Platform Press & Milestones
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-950">
            Shopersite Newsroom
          </h2>
          <p className="text-sm text-neutral-600 mt-1">
            Official announcements, major platform updates, mobile architecture releases, and seller milestones.
          </p>
        </div>
      </div>

      {/* News Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {NEWSROOM_ARTICLES.map((article) => (
          <div
            key={article.id}
            onClick={() => setSelectedArticle(article)}
            className="group cursor-pointer rounded-[24px] border border-neutral-200/90 bg-white overflow-hidden transition-all duration-300 hover:border-black hover:shadow-xl flex flex-col justify-between"
          >
            <div>
              {/* Image Frame */}
              <div className="relative aspect-[16/10] overflow-hidden bg-neutral-100">
                <img
                  src={article.imageUrl}
                  alt={article.title}
                  loading="lazy"
                  className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-black/80 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider border border-white/20">
                    {article.category}
                  </span>
                  <span className="text-[11px] text-neutral-200 font-medium">
                    {article.date}
                  </span>
                </div>

                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <h3 className="text-base sm:text-lg font-extrabold text-white leading-snug line-clamp-2">
                    {article.title}
                  </h3>
                </div>
              </div>

              {/* Snippet */}
              <div className="p-5 space-y-3">
                <p className="text-xs text-neutral-600 leading-relaxed line-clamp-3">
                  {article.summary}
                </p>

                <div className="pt-3 border-t border-neutral-100 text-[11px] text-neutral-500 font-medium">
                  By {article.author}
                </div>
              </div>
            </div>

            <div className="p-5 pt-0">
              <button
                type="button"
                className="w-full py-2.5 px-4 rounded-xl bg-neutral-100 group-hover:bg-black group-hover:text-white text-neutral-900 text-xs font-bold transition-colors flex items-center justify-center gap-2"
              >
                <span>Read Full Announcement</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Article Detail Modal */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-[24px] bg-white text-neutral-950 p-6 sm:p-10 shadow-2xl animate-in zoom-in-95">
            <button
              type="button"
              onClick={() => setSelectedArticle(null)}
              className="absolute right-5 top-5 w-9 h-9 rounded-full border border-neutral-200 flex items-center justify-center text-neutral-500 hover:bg-neutral-100 hover:text-black"
            >
              <X className="w-4 h-4" />
            </button>

            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 block mb-1">
              {selectedArticle.category} • {selectedArticle.date}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-950">
              {selectedArticle.title}
            </h2>
            <p className="text-xs text-neutral-500 mt-1 font-medium">
              By {selectedArticle.author}
            </p>

            <div className="my-5 rounded-2xl overflow-hidden aspect-[16/8] relative">
              <img
                src={selectedArticle.imageUrl}
                alt={selectedArticle.title}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-neutral-700 leading-relaxed">
              {selectedArticle.content.map((p, idx) => (
                <p key={idx}>{p}</p>
              ))}

              <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200/90 mt-4 space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-900 block">
                  Key Capabilities & Takeaways:
                </span>
                <ul className="space-y-1.5 text-xs text-neutral-700">
                  {selectedArticle.keyPoints.map((pt, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-neutral-200 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedArticle(null)}
                className="px-6 py-2.5 rounded-xl bg-black text-white text-xs font-bold hover:bg-neutral-800"
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

