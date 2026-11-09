"use client";

import React, { useState } from "react";
import { BookOpen, Clock, ArrowRight, CheckCircle2, X } from "lucide-react";
import { ACADEMY_LESSONS, type AcademyLesson } from "@/lib/explore-data";

export function SellerAcademy() {
  const [selectedLesson, setSelectedLesson] = useState<AcademyLesson | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const categories = ["All", "Strategy", "Photography", "Pricing", "Marketing", "SEO"];

  const filtered = ACADEMY_LESSONS.filter(
    (l) => selectedCategory === "All" || l.category === selectedCategory
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-800 text-xs font-semibold uppercase tracking-wider mb-2">
            <BookOpen className="w-3.5 h-3.5 text-black" />
            Bite-Sized Masterclasses
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-950">
            Seller Academy
          </h2>
          <p className="text-sm text-neutral-600 mt-1">
            Practical 5-minute playbooks covering product photography, Indian D2C pricing, WhatsApp retention, and SEO.
          </p>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-neutral-100 border border-neutral-200">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setSelectedCategory(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedCategory === c
                  ? "bg-black text-white shadow-xs"
                  : "text-neutral-700 hover:text-black"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((lesson) => (
          <div
            key={lesson.id}
            className="flex flex-col justify-between rounded-[20px] border border-neutral-200/90 bg-white p-5 sm:p-6 transition-all hover:border-neutral-400 hover:shadow-[0_8px_24px_-10px_rgba(0,0,0,0.08)] group"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-800 border border-neutral-200">
                  {lesson.category}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] text-neutral-500 font-medium">
                  <Clock className="w-3 h-3" />
                  {lesson.readTime}
                </span>
              </div>

              <h3 className="text-base sm:text-lg font-bold text-neutral-950 group-hover:text-neutral-800 transition-colors">
                {lesson.title}
              </h3>

              <p className="text-xs text-neutral-600 mt-2.5 leading-relaxed">
                {lesson.summary}
              </p>

              <div className="mt-4 pt-3.5 border-t border-neutral-100 space-y-1.5">
                <span className="text-[11px] font-bold text-neutral-900 block mb-1">
                  Key Takeaways:
                </span>
                {lesson.keyTakeaways.slice(0, 2).map((takeaway, idx) => (
                  <div key={idx} className="flex items-start gap-1.5 text-[11px] text-neutral-600">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{takeaway}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-neutral-100 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-neutral-500">
                Level: {lesson.level}
              </span>
              <button
                type="button"
                onClick={() => setSelectedLesson(lesson)}
                className="inline-flex items-center gap-1 text-xs font-bold text-black hover:underline"
              >
                Read Lesson
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Lesson Reader Modal */}
      {selectedLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl bg-white p-6 sm:p-8 shadow-2xl text-neutral-950 animate-in zoom-in-95">
            <button
              type="button"
              onClick={() => setSelectedLesson(null)}
              className="absolute right-4 top-4 w-8 h-8 rounded-full border border-neutral-200 flex items-center justify-center text-neutral-500 hover:bg-neutral-100 hover:text-black"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-800">
                {selectedLesson.category}
              </span>
              <span className="text-xs text-neutral-500 font-medium">
                {selectedLesson.readTime} • {selectedLesson.level}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-neutral-950 mt-1">
              {selectedLesson.title}
            </h2>

            <div className="mt-4 p-4 rounded-xl bg-neutral-50 border border-neutral-200/80">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-900 block mb-2">
                Core Takeaways:
              </span>
              <ul className="space-y-1.5 text-xs text-neutral-700">
                {selectedLesson.keyTakeaways.map((k, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{k}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6 space-y-4 text-sm text-neutral-800 leading-relaxed">
              {selectedLesson.content.map((paragraph, idx) => (
                <p key={idx}>{paragraph}</p>
              ))}
            </div>

            <div className="mt-8 pt-4 border-t border-neutral-200 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedLesson(null)}
                className="px-5 py-2.5 rounded-xl bg-black text-white text-xs font-bold hover:bg-neutral-800"
              >
                Done Reading
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

