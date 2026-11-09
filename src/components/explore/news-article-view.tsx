"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Newspaper, CheckCircle2, User, Calendar, ExternalLink } from "lucide-react";
import { NewsArticle } from "@/lib/explore-rich-data";

export function NewsArticleView({
  article,
  onBack,
}: {
  article: NewsArticle;
  onBack: () => void;
}) {
  return (
    <div className="space-y-8 animate-in fade-in-50 duration-300">
      {/* Top Back Navigation */}
      <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-bold text-neutral-600 hover:text-black py-1.5 px-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Platform Newsroom</span>
        </button>

        <span className="px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-800 text-xs font-bold uppercase tracking-wider">
          {article.category}
        </span>
      </div>

      {/* Article Header */}
      <div className="space-y-3 max-w-3xl">
        <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 block">
          {article.badge} • {article.date}
        </span>
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-neutral-950 leading-tight">
          {article.title}
        </h1>
        <p className="text-sm font-medium text-neutral-600">
          Published by {article.author}
        </p>
      </div>

      {/* Featured Photo Banner */}
      <div className="rounded-[28px] overflow-hidden aspect-[16/8] bg-neutral-100 shadow-md">
        <img
          src={article.imageUrl}
          alt={article.title}
          className="w-full h-full object-cover object-center"
        />
      </div>

      {/* Article Narrative Body */}
      <div className="max-w-3xl space-y-6 text-sm sm:text-base text-neutral-700 leading-relaxed font-normal">
        <p className="text-lg font-serif italic text-neutral-900 leading-relaxed border-l-2 border-black pl-4">
          "{article.summary}"
        </p>

        {article.content.map((p, idx) => (
          <p key={idx}>{p}</p>
        ))}

        <div className="p-6 rounded-[22px] bg-neutral-50 border border-neutral-200/90 my-6 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-950 block">
            Executive Summary & Milestones:
          </span>
          <ul className="space-y-2 text-xs sm:text-sm text-neutral-700">
            {article.keyPoints.map((pt, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{pt}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="pt-6 border-t border-neutral-200 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="px-5 py-2.5 rounded-xl bg-black text-white text-xs font-bold hover:bg-neutral-800"
        >
          ← Return to Newsroom
        </button>
      </div>
    </div>
  );
}

