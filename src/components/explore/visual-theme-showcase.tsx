"use client";

import React, { useState } from "react";
import { Palette, ExternalLink, ArrowRight, Check } from "lucide-react";
import { getAllThemes, type ThemeDefinition } from "@/lib/themes";
import Link from "next/link";

export function VisualThemeShowcase() {
  const allThemes = getAllThemes();
  const [selectedGroup, setSelectedGroup] = useState<string>("All");

  const groups = ["All", "Fashion", "Beauty", "Jewellery", "Home", "Food"];

  const filteredThemes = allThemes.filter((t) => {
    if (selectedGroup === "All") return true;
    return t.category?.toLowerCase().includes(selectedGroup.toLowerCase());
  }).slice(0, 8); // top 8 spotlight themes

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-800 text-xs font-semibold uppercase tracking-wider mb-2">
            <Palette className="w-3.5 h-3.5 text-black" />
            Storefront Design Gallery
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-950">
            Themes & Storefront Inspiration
          </h2>
          <p className="text-sm text-neutral-600 mt-1">
            Explore 37 minimalist, high-converting storefront designs crafted specifically for Indian social sellers.
          </p>
        </div>

        <Link
          href="/themes"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-black text-white text-xs font-bold hover:bg-neutral-800 transition-colors self-start sm:self-auto shrink-0"
        >
          <span>View All 37 Themes</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Themes Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredThemes.map((theme) => (
          <div
            key={theme.slug}
            className="group rounded-[22px] border border-neutral-200/90 bg-white overflow-hidden transition-all duration-300 hover:border-black hover:shadow-xl flex flex-col justify-between"
          >
            <div>
              {/* Preview Image */}
              <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100">
                {theme.previewImage ? (
                  <img
                    src={theme.previewImage}
                    alt={theme.name}
                    loading="lazy"
                    className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-neutral-100 text-neutral-400">
                    <Palette className="w-8 h-8" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                <div className="absolute top-3 left-3">
                  <span className="px-2.5 py-0.5 rounded-full bg-black/80 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider border border-white/20">
                    {theme.category || "General"}
                  </span>
                </div>

                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <span className="text-sm font-extrabold text-white block">
                    {theme.name}
                  </span>
                </div>
              </div>

              {/* Theme description */}
              <div className="p-4 space-y-3">
                <p className="text-xs text-neutral-600 line-clamp-2 leading-relaxed">
                  {theme.description || theme.tagline}
                </p>

                {/* Color preview dots */}
                <div className="flex items-center gap-1.5 pt-2 border-t border-neutral-100">
                  <span className="text-[10px] text-neutral-400 font-medium mr-1">Palette:</span>
                  {(theme.previewColors || ["#111111", "#F4F2EE", "#FFFFFF"]).map((color, idx) => (
                    <span
                      key={idx}
                      className="w-3.5 h-3.5 rounded-full border border-neutral-300 shadow-2xs"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 pt-0">
              <Link
                href={`/themes?theme=${theme.slug}`}
                className="w-full py-2 px-3 rounded-xl bg-neutral-100 group-hover:bg-black group-hover:text-white text-neutral-800 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Live Preview</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

