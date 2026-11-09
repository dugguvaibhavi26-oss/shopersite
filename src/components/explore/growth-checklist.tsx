"use client";

import React, { useState, useEffect } from "react";
import { CheckCircle2, Circle, Sparkles, RotateCcw, ArrowRight } from "lucide-react";
import { GROWTH_CHECKLIST, type GrowthTask } from "@/lib/explore-data";
import Link from "next/link";

const STORAGE_KEY = "shopersite_explore_growth_checklist";

export function GrowthChecklist() {
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [selectedCat, setSelectedCat] = useState<string>("All");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setCompletedIds(JSON.parse(saved));
    } catch {}
  }, []);

  const toggleTask = (id: string) => {
    setCompletedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const resetAll = () => {
    setCompletedIds([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  };

  const categories = ["All", "Setup", "Catalog", "Payments", "Marketing", "Fulfillment"];
  const filtered = GROWTH_CHECKLIST.filter(
    (t) => selectedCat === "All" || t.category === selectedCat
  );

  const percent = Math.round((completedIds.length / GROWTH_CHECKLIST.length) * 100);

  return (
    <div className="rounded-[20px] border border-neutral-200/90 bg-white p-5 sm:p-8 shadow-[0_4px_24px_-10px_rgba(0,0,0,0.06)]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-neutral-200 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-800 text-xs font-semibold uppercase tracking-wider mb-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Store Launch & Growth Roadmap
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-950">
            Store Launch & Growth Checklist
          </h2>
          <p className="text-sm text-neutral-600 mt-1">
            8 essential steps every top-performing social seller completes before marketing to cold traffic.
          </p>
        </div>

        {/* Progress tracker widget */}
        <div className="flex items-center gap-4 bg-neutral-50 border border-neutral-200/80 rounded-2xl p-4 min-w-[240px]">
          <div className="flex-1">
            <div className="flex justify-between text-xs font-semibold text-neutral-700 mb-1.5">
              <span>{completedIds.length} of {GROWTH_CHECKLIST.length} Completed</span>
              <span className="font-bold text-neutral-950">{percent}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-neutral-200 overflow-hidden">
              <div
                className="h-full bg-black transition-all duration-500 rounded-full"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
          {completedIds.length > 0 && (
            <button
              type="button"
              onClick={resetAll}
              title="Reset checklist"
              className="p-1.5 text-neutral-400 hover:text-black rounded-lg hover:bg-neutral-200 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Categories */}
      <div className="flex flex-wrap items-center gap-2 pt-6 pb-4">
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setSelectedCat(c)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedCat === c
                ? "bg-black text-white shadow-xs"
                : "bg-neutral-100 text-neutral-700 hover:text-black"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Task List */}
      <div className="divide-y divide-neutral-100">
        {filtered.map((task) => {
          const isDone = completedIds.includes(task.id);
          return (
            <div
              key={task.id}
              onClick={() => toggleTask(task.id)}
              className="py-4 flex items-start gap-3.5 cursor-pointer group hover:bg-neutral-50/70 -mx-2 px-2 rounded-xl transition-colors"
            >
              <button
                type="button"
                className="mt-0.5 text-neutral-400 group-hover:text-black transition-colors"
              >
                {isDone ? (
                  <CheckCircle2 className="w-5 h-5 text-black fill-black text-white" />
                ) : (
                  <Circle className="w-5 h-5 text-neutral-300" />
                )}
              </button>

              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`text-sm font-semibold transition-colors ${
                      isDone ? "line-through text-neutral-400" : "text-neutral-900"
                    }`}
                  >
                    {task.title}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      task.impact === "Essential"
                        ? "bg-red-50 text-red-700 border border-red-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}
                  >
                    {task.impact}
                  </span>
                  <span className="text-[10px] text-neutral-500 font-medium">{task.category}</span>
                </div>
                <p className="text-xs text-neutral-600 mt-1 leading-relaxed">{task.tip}</p>
              </div>
            </div>
          );
        })}
      </div>

      {percent === 100 && (
        <div className="mt-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
          <p className="text-sm font-bold text-emerald-900">🎉 Outstanding work! Your store setup is 100% complete.</p>
          <p className="text-xs text-emerald-700 mt-1">
            You are ready to launch paid ads or publish your link on your Instagram bio.
          </p>
        </div>
      )}
    </div>
  );
}

