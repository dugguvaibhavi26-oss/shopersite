"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Clock,
  User,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  ArrowRight,
  Bookmark,
} from "lucide-react";
import { AcademyCourse } from "@/lib/explore-rich-data";

export function AcademyCoursePlayer({
  course,
  onBack,
}: {
  course: AcademyCourse;
  onBack: () => void;
}) {
  const [activeChapterIdx, setActiveChapterIdx] = useState(0);
  const currentChapter = course.chapters[activeChapterIdx] || course.chapters[0];

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-300">
      {/* Top Breadcrumb & Back Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-bold text-neutral-600 hover:text-black py-1.5 px-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Academy Curriculum</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-800 text-xs font-bold uppercase tracking-wider">
            {course.category}
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold">
            {course.level}
          </span>
        </div>
      </div>

      {/* Course Title Header */}
      <div className="space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
          Seller Masterclass • {course.duration} Total
        </span>
        <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-neutral-950">
          {course.title}
        </h1>
        <p className="text-sm sm:text-base text-neutral-600 font-medium">
          Instructed by {course.instructor}
        </p>
      </div>

      {/* Course Player Canvas: Left Syllabus Sidebar + Right Reading Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-2">
        {/* Left Syllabus Column */}
        <div className="lg:col-span-4 rounded-[22px] border border-neutral-200 bg-neutral-50/70 p-5 space-y-3 sticky top-20">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
            Course Curriculum ({course.chapters.length} Chapters)
          </span>

          <div className="space-y-2">
            {course.chapters.map((ch, idx) => {
              const isActive = activeChapterIdx === idx;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveChapterIdx(idx)}
                  className={`w-full text-left p-3.5 rounded-xl border text-xs transition-all flex items-start gap-3 ${
                    isActive
                      ? "bg-black text-white border-black shadow-sm font-bold"
                      : "bg-white text-neutral-700 border-neutral-200/80 hover:border-black font-semibold"
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center shrink-0 mt-0.5 ${
                      isActive ? "bg-white text-black font-extrabold" : "bg-neutral-100 text-neutral-600"
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <div>
                    <span className="block leading-snug">{ch.title}</span>
                    <span
                      className={`text-[10px] block mt-0.5 ${
                        isActive ? "text-neutral-300" : "text-neutral-400"
                      }`}
                    >
                      {ch.duration}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Active Chapter Canvas */}
        <div className="lg:col-span-8 p-6 sm:p-10 rounded-[28px] border border-neutral-200 bg-white shadow-2xs space-y-6">
          <div className="border-b border-neutral-200 pb-5">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 block mb-1">
              Chapter {activeChapterIdx + 1} of {course.chapters.length} • {currentChapter.duration}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-950">
              {currentChapter.title}
            </h2>
            <p className="text-sm text-neutral-600 mt-2 leading-relaxed">
              {currentChapter.summary}
            </p>
          </div>

          {/* Actionable Steps Matrix */}
          <div className="space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-900 block">
              Execution Action Steps
            </span>
            <div className="space-y-3">
              {currentChapter.steps.map((step, sIdx) => (
                <div
                  key={sIdx}
                  className="p-4 rounded-xl bg-neutral-50 border border-neutral-200/80 flex items-start gap-3 text-xs sm:text-sm text-neutral-800"
                >
                  <span className="w-5 h-5 rounded-full bg-black text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {sIdx + 1}
                  </span>
                  <span className="leading-relaxed">{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pro Tip Callout Box */}
          <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/80 border border-amber-200/90 text-xs sm:text-sm text-amber-950 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="font-bold block text-amber-900">Expert Masterclass Rule:</strong>
              <p className="leading-relaxed">{currentChapter.proTip}</p>
            </div>
          </div>

          {/* Chapter Navigation Controls */}
          <div className="pt-6 border-t border-neutral-200 flex items-center justify-between">
            {activeChapterIdx > 0 ? (
              <button
                type="button"
                onClick={() => setActiveChapterIdx((i) => i - 1)}
                className="px-4 py-2.5 rounded-xl border border-neutral-200 text-xs font-bold text-neutral-800 hover:bg-neutral-50"
              >
                ← Previous Chapter
              </button>
            ) : <div />}

            {activeChapterIdx < course.chapters.length - 1 ? (
              <button
                type="button"
                onClick={() => setActiveChapterIdx((i) => i + 1)}
                className="px-5 py-2.5 rounded-xl bg-black text-white text-xs font-bold hover:bg-neutral-800 flex items-center gap-1.5"
              >
                <span>Next Chapter</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onBack}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700"
              >
                Complete Course & Return ✓
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

