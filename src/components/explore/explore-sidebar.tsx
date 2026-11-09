"use client";

import React from "react";
import Link from "next/link";
import {
  TrendingUp,
  Calendar,
  Sparkles,
  BookOpen,
  Calculator,
  CheckCircle2,
  Palette,
  Newspaper,
  BookMarked,
  ArrowRight,
  ExternalLink,
  Flame,
  FileText,
  X,
  Compass,
} from "lucide-react";

export type ExploreSectionId =
  | "trending"
  | "calendar"
  | "creative"
  | "tools"
  | "checklist"
  | "academy"
  | "playbooks"
  | "news"
  | "themes";

interface SidebarProps {
  currentSection: ExploreSectionId;
  onSelectSection: (section: ExploreSectionId) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export function ExploreSidebar({
  currentSection,
  onSelectSection,
  isOpenMobile,
  onCloseMobile,
}: SidebarProps) {
  const navGroups = [
    {
      group: "DISCOVER",
      items: [
        {
          id: "trending" as ExploreSectionId,
          label: "Trending Niches",
          icon: TrendingUp,
          badge: "Velocity",
          badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
        },
        {
          id: "calendar" as ExploreSectionId,
          label: "Campaign Calendar",
          icon: Calendar,
          badge: "12 Festivals",
          badgeColor: "bg-neutral-100 text-neutral-700 border-neutral-200",
        },
        {
          id: "themes" as ExploreSectionId,
          label: "Themes & Design",
          icon: Palette,
          badge: "37 Themes",
          badgeColor: "bg-neutral-100 text-neutral-700 border-neutral-200",
        },
      ],
    },
    {
      group: "TOOLS & STUDIO",
      items: [
        {
          id: "creative" as ExploreSectionId,
          label: "Creative Copy Studio",
          icon: Sparkles,
          badge: "Interactive",
          badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
        },
        {
          id: "tools" as ExploreSectionId,
          label: "Financial Calculators",
          icon: Calculator,
          badge: "5 Tools",
          badgeColor: "bg-neutral-100 text-neutral-700 border-neutral-200",
        },
        {
          id: "checklist" as ExploreSectionId,
          label: "Store Launch Checklist",
          icon: CheckCircle2,
          badge: "Roadmap",
          badgeColor: "bg-neutral-100 text-neutral-700 border-neutral-200",
        },
      ],
    },
    {
      group: "KNOWLEDGE & INTEL",
      items: [
        {
          id: "academy" as ExploreSectionId,
          label: "Seller Academy",
          icon: BookOpen,
          badge: "Masterclasses",
          badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
        },
        {
          id: "playbooks" as ExploreSectionId,
          label: "D2C Scaling Playbooks",
          icon: BookMarked,
        },
        {
          id: "news" as ExploreSectionId,
          label: "Platform Newsroom",
          icon: Newspaper,
          badge: "Official",
          badgeColor: "bg-neutral-100 text-neutral-700 border-neutral-200",
        },
      ],
    },
  ];

  const content = (
    <div className="flex flex-col justify-between h-full p-4 sm:p-5 select-none">
      <div>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between pb-5 border-b border-neutral-200/80 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-black text-white flex items-center justify-center font-bold text-sm shadow-xs">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-black tracking-wider uppercase text-neutral-900 block leading-tight">
                Explore Hub
              </span>
              <span className="text-[10px] text-neutral-500 font-medium block">
                Resources & Ecosystem
              </span>
            </div>
          </div>

          {/* Mobile close button */}
          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-neutral-400 hover:text-black hover:bg-neutral-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Sections */}
        <div className="space-y-6">
          {navGroups.map((grp) => (
            <div key={grp.group} className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-400 px-3 block mb-2">
                {grp.group}
              </span>

              <div className="space-y-0.5">
                {grp.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentSection === item.id;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        onSelectSection(item.id);
                        onCloseMobile();
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between group ${
                        isActive
                          ? "bg-black text-white shadow-xs"
                          : "text-neutral-700 hover:text-black hover:bg-neutral-100/90"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon
                          className={`w-4 h-4 transition-colors ${
                            isActive ? "text-white" : "text-neutral-400 group-hover:text-black"
                          }`}
                        />
                        <span>{item.label}</span>
                      </div>

                      {item.badge && (
                        <span
                          className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md border ${
                            isActive
                              ? "bg-white/20 text-white border-white/20"
                              : `${item.badgeColor}`
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Sticky Action Box */}
      <div className="pt-5 border-t border-neutral-200/80 space-y-3">
        <Link
          href="/docs"
          className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 hover:bg-neutral-100 border border-neutral-200/80 text-xs font-semibold text-neutral-800 transition-colors"
        >
          <div className="flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-neutral-500" />
            <span>Platform Docs & APIs</span>
          </div>
          <ExternalLink className="w-3 h-3 text-neutral-400" />
        </Link>

        <div className="p-3.5 rounded-xl bg-neutral-950 text-white space-y-2">
          <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">
            Shopersite Launch
          </span>
          <p className="text-[11px] text-neutral-300 leading-snug">
            Ready to sell? Launch your branded store with 0% commission in 60s.
          </p>
          <Link
            href="/register"
            className="block text-center w-full py-1.5 rounded-lg bg-white text-black text-xs font-bold hover:bg-neutral-200 transition-colors"
          >
            Start Free Store
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside className="hidden lg:block w-72 shrink-0 border-r border-neutral-200 bg-white sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto [scrollbar-width:none]">
        {content}
      </aside>

      {/* Mobile Slide-over Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="fixed inset-y-0 left-0 w-4/5 max-w-xs bg-white shadow-2xl z-10 flex flex-col">
            {content}
          </div>
        </div>
      )}
    </>
  );
}

