"use client";

import * as React from "react";
import {
  ArrowDown,
  ArrowUp,
  Check,
  ExternalLink,
  Layers,
  Loader2,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  Trash2,
  Eye,
  Sliders,
} from "lucide-react";
import { getAllThemes, getTheme, type ThemeDefinition } from "@/lib/themes";
import { DEFAULT_FEATURED_THEME_SLUGS, DEFAULT_LANDING_CONFIG, type LandingConfig } from "@/lib/landing-config";
import { saveLandingConfig, useLandingConfig } from "@/lib/landing-client";

export function LandingSettings({ myEmail }: { myEmail: string }) {
  const { config: live, loaded } = useLandingConfig();
  const [form, setForm] = React.useState<LandingConfig | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [error, setError] = React.useState("");
  const [themeSearch, setThemeSearch] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState("All");

  // All themes available on the platform
  const allThemes = React.useMemo(() => getAllThemes(), []);

  // Initialize form once live data arrives
  React.useEffect(() => {
    if (loaded && !form) {
      setForm(live);
    }
  }, [loaded, live, form]);

  if (!form) {
    return (
      <div className="flex items-center gap-2 text-sm text-neutral-500 py-12">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading landing page settings…
      </div>
    );
  }

  const isDirty = JSON.stringify(form) !== JSON.stringify(live);

  // Selected themes resolved to ThemeDefinition
  const selectedThemes: ThemeDefinition[] = form.selectedThemeSlugs
    .map((slug) => allThemes.find((t) => t.slug === slug) || getTheme(slug))
    .filter(Boolean);

  // Unselected themes available to be added
  const availableThemes = allThemes.filter((t) => {
    const isAlreadySelected = form.selectedThemeSlugs.includes(t.slug);
    if (isAlreadySelected) return false;

    const matchesSearch =
      t.name.toLowerCase().includes(themeSearch.toLowerCase()) ||
      t.slug.toLowerCase().includes(themeSearch.toLowerCase()) ||
      (t.category && t.category.toLowerCase().includes(themeSearch.toLowerCase()));

    const matchesCategory =
      categoryFilter === "All" ||
      (t.category && t.category.toLowerCase().includes(categoryFilter.toLowerCase()));

    return matchesSearch && matchesCategory;
  });

  const categories = ["All", "Fashion", "Beauty", "Home", "Jewellery", "Food"];

  // Handlers for theme carousel curation
  const addTheme = (slug: string) => {
    if (form.selectedThemeSlugs.includes(slug)) return;
    setForm({
      ...form,
      selectedThemeSlugs: [...form.selectedThemeSlugs, slug],
    });
  };

  const removeTheme = (slug: string) => {
    setForm({
      ...form,
      selectedThemeSlugs: form.selectedThemeSlugs.filter((s) => s !== slug),
    });
  };

  const moveTheme = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= form.selectedThemeSlugs.length) return;
    const next = [...form.selectedThemeSlugs];
    const [moved] = next.splice(index, 1);
    next.splice(targetIndex, 0, moved);
    setForm({ ...form, selectedThemeSlugs: next });
  };

  const resetToDefaults = () => {
    setForm({
      ...form,
      selectedThemeSlugs: [...DEFAULT_FEATURED_THEME_SLUGS],
      themesEyebrow: DEFAULT_LANDING_CONFIG.themesEyebrow,
      themesTitle: DEFAULT_LANDING_CONFIG.themesTitle,
      themesText: DEFAULT_LANDING_CONFIG.themesText,
    });
  };

  const handleSave = async () => {
    if (form.selectedThemeSlugs.length === 0) {
      setError("Please select at least 1 theme to display on the landing page.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      await saveLandingConfig(form, myEmail);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError("Failed to save landing page settings. Check permissions.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-800 text-xs font-semibold uppercase tracking-wider mb-2">
            <Sliders className="w-3.5 h-3.5 text-black" />
            Homepage Presentation
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-950">
            Landing Page Content
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            Curate which themes appear in the landing page carousel and customize marketing copy.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-neutral-200 bg-white text-xs font-semibold text-neutral-800 hover:border-black transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>View Landing Page</span>
            <ExternalLink className="w-3 h-3 text-neutral-400" />
          </a>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !isDirty}
            className={`inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${
              saved
                ? "bg-emerald-600 text-white"
                : isDirty
                ? "bg-black text-white hover:bg-neutral-800 active:scale-95"
                : "bg-neutral-200 text-neutral-400 cursor-not-allowed"
            }`}
          >
            {saving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving…</span>
              </>
            ) : saved ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Saved & Live</span>
              </>
            ) : (
              <span>Save Changes</span>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
          {error}
        </div>
      )}

      {/* SECTION 1: THEMES CAROUSEL CURATION */}
      <div className="rounded-2xl border border-neutral-200/90 bg-white p-5 sm:p-7 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-100">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-neutral-900" />
              <h3 className="text-base font-bold text-neutral-950">
                Curated Themes for Landing Carousel
              </h3>
            </div>
            <p className="text-xs text-neutral-500 mt-1">
              Only these selected themes will show in the "Designed to sell." carousel on the homepage.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-800">
              {form.selectedThemeSlugs.length} theme{form.selectedThemeSlugs.length !== 1 ? "s" : ""} selected
            </span>
            <button
              type="button"
              onClick={resetToDefaults}
              className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-neutral-600 hover:text-black hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Defaults</span>
            </button>
          </div>
        </div>

        {/* Selected themes list (reorderable) */}
        <div className="space-y-3">
          <label className="text-xs font-black uppercase tracking-wider text-neutral-500 block">
            Active Carousel Order (Swipe Sequence)
          </label>

          {selectedThemes.length === 0 ? (
            <div className="p-8 rounded-xl border border-dashed border-neutral-300 text-center text-xs text-neutral-500">
              No themes selected. Pick themes from the list below to feature them on the landing page.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {selectedThemes.map((theme, idx) => (
                <div
                  key={theme.slug}
                  className="flex items-center justify-between p-3 rounded-xl border border-neutral-200 bg-neutral-50/70 hover:bg-white hover:border-neutral-300 transition-all group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 h-6 rounded-full bg-neutral-200/80 text-neutral-700 text-xs font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div className="w-12 h-14 rounded-lg overflow-hidden bg-neutral-200 shrink-0 border border-neutral-300/60 relative">
                      {theme.previewImage ? (
                        <img
                          src={theme.previewImage}
                          alt={theme.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-neutral-400">
                          Theme
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-bold text-neutral-950 truncate">
                          {theme.name}
                        </h4>
                        <span
                          className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded ${
                            theme.tier === "free"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-neutral-900 text-white"
                          }`}
                        >
                          {theme.tier || "Free"}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-500 truncate mt-0.5">
                        {theme.category || "General"} • {theme.slug}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <button
                      type="button"
                      onClick={() => moveTheme(idx, -1)}
                      disabled={idx === 0}
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-black hover:bg-neutral-200 disabled:opacity-20 disabled:hover:bg-transparent transition-colors"
                      title="Move up in carousel"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveTheme(idx, 1)}
                      disabled={idx === selectedThemes.length - 1}
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-black hover:bg-neutral-200 disabled:opacity-20 disabled:hover:bg-transparent transition-colors"
                      title="Move down in carousel"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeTheme(theme.slug)}
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Remove from landing carousel"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add more themes selector */}
        <div className="pt-4 border-t border-neutral-100 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <label className="text-xs font-black uppercase tracking-wider text-neutral-500">
              Add Themes to Landing Carousel ({availableThemes.length} available)
            </label>

            {/* Filter controls */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-44">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-neutral-400" />
                <input
                  value={themeSearch}
                  onChange={(e) => setThemeSearch(e.target.value)}
                  placeholder="Filter themes..."
                  className="w-full h-7 pl-7 pr-2 rounded-lg bg-neutral-100 border border-neutral-200 text-xs outline-none focus:bg-white focus:ring-1 focus:ring-black"
                />
              </div>

              <div className="flex items-center gap-1">
                {categories.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCategoryFilter(c)}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                      categoryFilter === c
                        ? "bg-black text-white"
                        : "bg-neutral-100 text-neutral-600 hover:text-black"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-72 overflow-y-auto p-1">
            {availableThemes.map((theme) => (
              <div
                key={theme.slug}
                onClick={() => addTheme(theme.slug)}
                className="group cursor-pointer rounded-xl border border-neutral-200 hover:border-black bg-white p-2.5 flex flex-col justify-between transition-all hover:shadow-xs"
              >
                <div className="aspect-[4/3] rounded-lg overflow-hidden bg-neutral-100 relative mb-2">
                  {theme.previewImage ? (
                    <img
                      src={theme.previewImage}
                      alt={theme.name}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : null}
                  <div className="absolute top-1.5 left-1.5">
                    <span className="px-1.5 py-0.2 rounded text-[8px] font-black uppercase tracking-wider bg-black/70 text-white">
                      {theme.tier || "Free"}
                    </span>
                  </div>
                </div>

                <div>
                  <h5 className="text-xs font-bold text-neutral-950 truncate">
                    {theme.name}
                  </h5>
                  <p className="text-[10px] text-neutral-500 truncate">
                    {theme.category || "Design"}
                  </p>
                </div>

                <div className="mt-2 pt-2 border-t border-neutral-100 flex items-center justify-between text-[11px] font-bold text-neutral-700 group-hover:text-black">
                  <span>Add to Carousel</span>
                  <Plus className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION 2: THEMES SECTION TEXT & COPY CONTROLS */}
      <div className="rounded-2xl border border-neutral-200/90 bg-white p-5 sm:p-7 shadow-xs space-y-4">
        <div className="pb-3 border-b border-neutral-100">
          <h3 className="text-base font-bold text-neutral-950">
            Themes Section Copy
          </h3>
          <p className="text-xs text-neutral-500 mt-0.5">
            Customize the section heading displayed directly above the themes carousel.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-neutral-700 block mb-1">
              Eyebrow Label
            </label>
            <input
              value={form.themesEyebrow}
              onChange={(e) => setForm({ ...form, themesEyebrow: e.target.value })}
              placeholder="Themes"
              className="w-full h-9 px-3 rounded-xl border border-neutral-200 text-xs font-medium focus:ring-1 focus:ring-black outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-neutral-700 block mb-1">
              Main Section Title
            </label>
            <input
              value={form.themesTitle}
              onChange={(e) => setForm({ ...form, themesTitle: e.target.value })}
              placeholder="Designed to sell."
              className="w-full h-9 px-3 rounded-xl border border-neutral-200 text-xs font-medium focus:ring-1 focus:ring-black outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-xs font-bold text-neutral-700 block mb-1">
              Subtitle / Description
            </label>
            <textarea
              rows={2}
              value={form.themesText}
              onChange={(e) => setForm({ ...form, themesText: e.target.value })}
              placeholder="Start with Lume Editorial for free. Upgrade to unlock our full collection of designer themes."
              className="w-full p-3 rounded-xl border border-neutral-200 text-xs font-medium focus:ring-1 focus:ring-black outline-none resize-none"
            />
          </div>
        </div>
      </div>

      {/* SECTION 3: HERO ANNOUNCEMENT PILL */}
      <div className="rounded-2xl border border-neutral-200/90 bg-white p-5 sm:p-7 shadow-xs space-y-4">
        <div className="pb-3 border-b border-neutral-100">
          <h3 className="text-base font-bold text-neutral-950">
            Hero Announcement Badge
          </h3>
          <p className="text-xs text-neutral-500 mt-0.5">
            Pill badge shown on the landing page hero banner.
          </p>
        </div>

        <div>
          <label className="text-xs font-bold text-neutral-700 block mb-1">
            Announcement Text
          </label>
          <input
            value={form.announcementBadge || ""}
            onChange={(e) => setForm({ ...form, announcementBadge: e.target.value })}
            placeholder="Zero Commission • Direct UPI Settlements"
            className="w-full h-9 px-3 rounded-xl border border-neutral-200 text-xs font-medium focus:ring-1 focus:ring-black outline-none"
          />
        </div>
      </div>
    </div>
  );
}

