"use client";

import React, { useState } from "react";
import { BookOpen, Clock, User, ArrowRight, CheckCircle2, ChevronRight, X, Sparkles } from "lucide-react";
import { ACADEMY_COURSES, type AcademyCourse } from "@/lib/explore-rich-data";

export function VisualAcademyHub() {
  const [selectedCourse, setSelectedCourse] = useState<AcademyCourse | null>(null);
  const [activeChapterIdx, setActiveChapterIdx] = useState<number>(0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-800 text-xs font-semibold uppercase tracking-wider mb-2">
            <BookOpen className="w-3.5 h-3.5 text-black" />
            Seller Academy Masterclasses
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-950">
            D2C Masterclasses & Operations Guides
          </h2>
          <p className="text-sm text-neutral-600 mt-1">
            Complete multi-chapter courses on smartphone photography, pricing unit economics, and WhatsApp retention.
          </p>
        </div>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {ACADEMY_COURSES.map((course) => (
          <div
            key={course.id}
            onClick={() => {
              setSelectedCourse(course);
              setActiveChapterIdx(0);
            }}
            className="group cursor-pointer rounded-[24px] border border-neutral-200/90 bg-white overflow-hidden transition-all duration-300 hover:border-black hover:shadow-xl flex flex-col justify-between"
          >
            <div>
              {/* Course Cover Image */}
              <div className="relative aspect-[16/10] overflow-hidden bg-neutral-100">
                <img
                  src={course.imageUrl}
                  alt={course.title}
                  loading="lazy"
                  className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-black/80 backdrop-blur-md text-white text-[11px] font-bold uppercase tracking-wider border border-white/20">
                    {course.category}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-md text-neutral-950 text-[10px] font-bold">
                    {course.level}
                  </span>
                </div>

                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <span className="text-[11px] text-neutral-300 font-medium block">
                    {course.chaptersCount} Chapters • {course.duration}
                  </span>
                  <h3 className="text-base sm:text-lg font-extrabold text-white leading-snug mt-0.5">
                    {course.title}
                  </h3>
                </div>
              </div>

              {/* Course Meta */}
              <div className="p-5 space-y-3">
                <p className="text-xs text-neutral-600 leading-relaxed line-clamp-3">
                  {course.summary}
                </p>

                <div className="pt-3 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500 font-medium">
                  <span className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-neutral-400" />
                    {course.instructor}
                  </span>
                  <span>{course.duration}</span>
                </div>
              </div>
            </div>

            <div className="p-5 pt-0">
              <button
                type="button"
                className="w-full py-2.5 px-4 rounded-xl bg-neutral-100 group-hover:bg-black group-hover:text-white text-neutral-900 text-xs font-bold transition-colors flex items-center justify-center gap-2"
              >
                <span>Start Course</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Multi-Chapter Course Reader Modal */}
      {selectedCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[24px] bg-white text-neutral-950 p-6 sm:p-10 shadow-2xl animate-in zoom-in-95">
            <button
              type="button"
              onClick={() => setSelectedCourse(null)}
              className="absolute right-5 top-5 w-9 h-9 rounded-full border border-neutral-200 flex items-center justify-center text-neutral-500 hover:bg-neutral-100 hover:text-black"
            >
              <X className="w-4 h-4" />
            </button>

            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 block mb-1">
              {selectedCourse.category} • {selectedCourse.level} • {selectedCourse.duration}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-950">
              {selectedCourse.title}
            </h2>
            <p className="text-xs sm:text-sm text-neutral-600 mt-1 font-medium">
              Curated by {selectedCourse.instructor}
            </p>

            {/* Chapter Selector Tabs */}
            <div className="flex gap-2 overflow-x-auto py-4 border-b border-neutral-200 mt-4 [scrollbar-width:none]">
              {selectedCourse.chapters.map((ch, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveChapterIdx(idx)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    activeChapterIdx === idx
                      ? "bg-black text-white shadow-xs"
                      : "bg-neutral-100 text-neutral-600 hover:text-black"
                  }`}
                >
                  Chapter {idx + 1} ({ch.duration})
                </button>
              ))}
            </div>

            {/* Chapter Content */}
            {selectedCourse.chapters[activeChapterIdx] && (
              <div className="mt-6 space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-neutral-950">
                    {selectedCourse.chapters[activeChapterIdx].title}
                  </h3>
                  <p className="text-sm text-neutral-600 mt-2 leading-relaxed">
                    {selectedCourse.chapters[activeChapterIdx].summary}
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-neutral-50 border border-neutral-200/90 space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-900 block">
                    Action Steps:
                  </span>
                  <div className="space-y-2">
                    {selectedCourse.chapters[activeChapterIdx].steps.map((step, sIdx) => (
                      <div key={sIdx} className="flex items-start gap-3 text-xs sm:text-sm text-neutral-700">
                        <span className="w-5 h-5 rounded-full bg-black text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {sIdx + 1}
                        </span>
                        <span className="leading-relaxed">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200/90 text-xs sm:text-sm text-amber-900 flex items-start gap-3">
                  <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold">Pro Tip: </strong>
                    <span>{selectedCourse.chapters[activeChapterIdx].proTip}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-8 pt-4 border-t border-neutral-200 flex items-center justify-between">
              {activeChapterIdx > 0 ? (
                <button
                  type="button"
                  onClick={() => setActiveChapterIdx((i) => i - 1)}
                  className="px-4 py-2 rounded-xl border border-neutral-200 text-xs font-bold text-neutral-800 hover:bg-neutral-50"
                >
                  ← Previous Chapter
                </button>
              ) : <div />}

              {activeChapterIdx < selectedCourse.chapters.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setActiveChapterIdx((i) => i + 1)}
                  className="px-5 py-2.5 rounded-xl bg-black text-white text-xs font-bold hover:bg-neutral-800"
                >
                  Next Chapter →
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setSelectedCourse(null)}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700"
                >
                  Complete Course ✓
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

