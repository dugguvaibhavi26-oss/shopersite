"use client";

import React from "react";
import { BookOpen, Clock, User, ArrowRight, Layers, Sparkles, CheckCircle2 } from "lucide-react";
import { ACADEMY_COURSES, type AcademyCourse } from "@/lib/explore-rich-data";

export function AcademyCatalogFlow({
  onSelectCourse,
}: {
  onSelectCourse: (course: AcademyCourse) => void;
}) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-neutral-200 pb-6 space-y-4">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-800 text-xs font-semibold uppercase tracking-wider">
          <BookOpen className="w-3.5 h-3.5 text-black" />
          Seller Academy Curriculum
        </div>
        <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-neutral-950">
          D2C Masterclasses & Operations Guides
        </h1>
        <p className="text-sm text-neutral-600 mt-1 max-w-2xl leading-relaxed">
          In-depth multi-chapter masterclasses covering smartphone studio photography, Indian D2C pricing unit economics, and WhatsApp retention.
        </p>

        {/* Quick Curriculum Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
          <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200/80">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
              Available Masterclasses
            </span>
            <span className="text-xl font-black text-neutral-950 mt-0.5 block">
              {ACADEMY_COURSES.length} Comprehensive Tracks
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200/80">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
              Average Reading Duration
            </span>
            <span className="text-xl font-black text-neutral-950 mt-0.5 block">
              18–22 Minutes
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200/80">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
              Pedagogy
            </span>
            <span className="text-xl font-black text-emerald-600 mt-0.5 block">
              100% Actionable Steps
            </span>
          </div>
        </div>
      </div>

      {/* Course Syllabus Stream */}
      <div className="space-y-6">
        {ACADEMY_COURSES.map((course, idx) => (
          <div
            key={course.id}
            onClick={() => onSelectCourse(course)}
            className="group cursor-pointer rounded-[28px] border border-neutral-200 bg-white overflow-hidden shadow-2xs hover:border-black hover:shadow-xl transition-all duration-300"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
              {/* Photo Column */}
              <div className="lg:col-span-5 relative min-h-[240px] lg:min-h-full overflow-hidden bg-neutral-100">
                <img
                  src={course.imageUrl}
                  alt={course.title}
                  className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-black/80 via-black/20 to-transparent" />

                <div className="absolute top-3 left-3">
                  <span className="px-3 py-1 rounded-full bg-black/80 backdrop-blur-md text-white text-xs font-bold uppercase tracking-wider border border-white/20">
                    {course.category}
                  </span>
                </div>

                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <span className="text-xs text-neutral-300 block font-medium">
                    {course.chaptersCount} Chapters • {course.duration}
                  </span>
                  <h3 className="text-xl font-black text-white mt-0.5">
                    {course.title}
                  </h3>
                </div>
              </div>

              {/* Syllabus Breakdown Segment */}
              <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2 text-xs">
                    <span className="text-neutral-500 font-medium flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-neutral-400" />
                      {course.instructor}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-bold">
                      {course.level}
                    </span>
                  </div>

                  <p className="text-sm text-neutral-700 leading-relaxed font-medium">
                    {course.summary}
                  </p>

                  {/* Chapter Highlights List */}
                  <div className="mt-4 pt-4 border-t border-neutral-100 space-y-1.5">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                      Curriculum Chapters Included:
                    </span>
                    {course.chapters.map((ch, cIdx) => (
                      <div key={cIdx} className="flex items-center justify-between text-xs text-neutral-600">
                        <span className="font-semibold text-neutral-900 truncate">
                          {cIdx + 1}. {ch.title}
                        </span>
                        <span className="text-[11px] text-neutral-400 shrink-0 ml-2">{ch.duration}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-neutral-100 flex items-center justify-between">
                  <span className="text-xs text-neutral-500 font-medium">
                    Self-paced Masterclass
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-neutral-900 group-hover:text-black group-hover:translate-x-1 transition-all">
                    <span>Enter Course Workspace</span>
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

