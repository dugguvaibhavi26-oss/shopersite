"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  X,
  Menu,
  ChevronRight,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Calendar,
  BookOpen,
  Newspaper,
  Calculator,
  CheckCircle2,
  Zap,
  BookMarked,
  Palette,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { SiteFooter, SiteHeader } from "@/components/home/site-chrome";
import {
  ExploreSidebar,
  type ExploreSectionId,
} from "@/components/explore/explore-sidebar";
import { TrendingListFlow } from "@/components/explore/trending-list-flow";
import { TrendingDossierView } from "@/components/explore/trending-dossier-view";
import { CampaignTimelineFlow } from "@/components/explore/campaign-timeline-flow";
import { CampaignDetailView } from "@/components/explore/campaign-detail-view";
import { AcademyCatalogFlow } from "@/components/explore/academy-catalog-flow";
import { AcademyCoursePlayer } from "@/components/explore/academy-course-player";
import { NewsStreamFlow } from "@/components/explore/news-stream-flow";
import { NewsArticleView } from "@/components/explore/news-article-view";
import { CreativeStudioWorkspace } from "@/components/explore/creative-studio-workspace";
import { BusinessTools } from "@/components/explore/business-tools";
import { GrowthChecklist } from "@/components/explore/growth-checklist";
import { PlaybooksGuides } from "@/components/explore/playbooks-guides";
import { MarketingDiscounts } from "@/components/explore/marketing-discounts";
import { VisualThemeShowcase } from "@/components/explore/visual-theme-showcase";
import {
  VISUAL_TRENDS,
  FESTIVE_CALENDAR,
  ACADEMY_COURSES,
  NEWSROOM_ARTICLES,
  type VisualTrend,
  type FestiveCampaign,
  type AcademyCourse,
  type NewsArticle,
} from "@/lib/explore-rich-data";

const VALID_SECTIONS: ExploreSectionId[] = [
  "trending",
  "calendar",
  "creative",
  "tools",
  "checklist",
  "academy",
  "playbooks",
  "news",
  "themes",
];

function getSectionMeta(section: ExploreSectionId): {
  title: string;
  badge: string;
} {
  switch (section) {
    case "trending":
      return { title: "Trending Niches", badge: "Social Commerce" };
    case "calendar":
      return { title: "Campaign Calendar", badge: "12 Indian Festivals" };
    case "creative":
      return { title: "Creative Copy Studio", badge: "Interactive Mockup" };
    case "tools":
      return { title: "Financial Calculators", badge: "5 Tools" };
    case "checklist":
      return { title: "Launch Checklist", badge: "Roadmap" };
    case "academy":
      return { title: "Seller Academy", badge: "Masterclasses" };
    case "playbooks":
      return { title: "D2C Scaling Playbooks", badge: "Strategy Guides" };
    case "news":
      return { title: "Platform Newsroom", badge: "Official Releases" };
    case "themes":
      return { title: "Themes & Design", badge: "37 Storefronts" };
    default:
      return { title: "Explore", badge: "Ecosystem" };
  }
}

function getItemTitle(section: ExploreSectionId, itemId: string): string {
  if (section === "trending") {
    return VISUAL_TRENDS.find((t) => t.id === itemId)?.title || "Trend Dossier";
  }
  if (section === "calendar") {
    return FESTIVE_CALENDAR.find((c) => c.id === itemId)?.name || "Campaign Plan";
  }
  if (section === "academy") {
    return ACADEMY_COURSES.find((c) => c.id === itemId)?.title || "Course Masterclass";
  }
  if (section === "news") {
    return NEWSROOM_ARTICLES.find((n) => n.id === itemId)?.title || "Press Release";
  }
  return "Overview";
}

export default function ExplorePage() {
  return (
    <React.Suspense fallback={null}>
      <ExploreApp />
    </React.Suspense>
  );
}

function ExploreApp() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, signOut } = useAuth();

  const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  // Determine current active section from query param: ?section=... or legacy ?view=...
  const rawSection = searchParams.get("section") || searchParams.get("view");
  const currentSection: ExploreSectionId =
    rawSection && VALID_SECTIONS.includes(rawSection as ExploreSectionId)
      ? (rawSection as ExploreSectionId)
      : "trending";

  // Determine selected item (for full-page dossier/view): ?item=...
  const currentItem = searchParams.get("item") || null;

  const navigateToSection = (section: ExploreSectionId) => {
    setMobileSidebarOpen(false);
    setSearchQuery("");
    const params = new URLSearchParams();
    params.set("section", section);
    router.push(`/explore?${params.toString()}`);
  };

  const navigateToItem = (itemId: string | null) => {
    const params = new URLSearchParams();
    params.set("section", currentSection);
    if (itemId) {
      params.set("item", itemId);
    }
    router.push(`/explore?${params.toString()}`);
  };

  const navigateToSearchItem = (section: ExploreSectionId, itemId: string) => {
    setSearchQuery("");
    const params = new URLSearchParams();
    params.set("section", section);
    params.set("item", itemId);
    router.push(`/explore?${params.toString()}`);
  };

  const q = searchQuery.trim().toLowerCase();

  // Cross-cutting search engine across all 4 rich content categories
  const searchResults = React.useMemo(() => {
    if (!q) return null;
    return {
      trends: VISUAL_TRENDS.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q)
      ),
      campaigns: FESTIVE_CALENDAR.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.overview.toLowerCase().includes(q) ||
          c.creativeDirection.toLowerCase().includes(q)
      ),
      courses: ACADEMY_COURSES.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.summary.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q)
      ),
      news: NEWSROOM_ARTICLES.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.summary.toLowerCase().includes(q)
      ),
    };
  }, [q]);

  const hasSearchResults =
    searchResults &&
    (searchResults.trends.length > 0 ||
      searchResults.campaigns.length > 0 ||
      searchResults.courses.length > 0 ||
      searchResults.news.length > 0);

  // Selected item data resolution
  const selectedTrend =
    currentSection === "trending" && currentItem
      ? VISUAL_TRENDS.find((t) => t.id === currentItem) || null
      : null;

  const selectedCampaign =
    currentSection === "calendar" && currentItem
      ? FESTIVE_CALENDAR.find((c) => c.id === currentItem) || null
      : null;

  const selectedCourse =
    currentSection === "academy" && currentItem
      ? ACADEMY_COURSES.find((c) => c.id === currentItem) || null
      : null;

  const selectedArticle =
    currentSection === "news" && currentItem
      ? NEWSROOM_ARTICLES.find((a) => a.id === currentItem) || null
      : null;

  const sectionMeta = getSectionMeta(currentSection);

  return (
    <div className="home-sans flex min-h-screen flex-col overflow-x-clip bg-neutral-50 font-[Inter,sans-serif] text-neutral-950">
      {/* Global Header */}
      <SiteHeader user={!!user} onSignOut={() => signOut()} />

      {/* Sub-Header: Sideways Breadcrumb Bar & Quick Search */}
      <div className="sticky top-14 z-30 bg-white/95 backdrop-blur-xl border-b border-neutral-200/90 shadow-2xs">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="h-14 flex items-center justify-between gap-4">
            {/* Mobile Sidebar Toggle & Breadcrumb */}
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(true)}
                className="lg:hidden p-2 rounded-xl border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-800 transition-colors"
                aria-label="Open Explore Navigation"
              >
                <Menu className="w-4 h-4" />
              </button>

              <nav className="flex items-center gap-1.5 text-xs font-semibold text-neutral-500 truncate">
                <button
                  type="button"
                  onClick={() => navigateToSection("trending")}
                  className="hover:text-black transition-colors shrink-0"
                >
                  Explore
                </button>
                <ChevronRight className="w-3.5 h-3.5 text-neutral-300 shrink-0" />
                <button
                  type="button"
                  onClick={() => navigateToItem(null)}
                  className={`hover:text-black transition-colors truncate ${
                    !currentItem ? "text-neutral-950 font-bold" : ""
                  }`}
                >
                  {sectionMeta.title}
                </button>
                {currentItem && (
                  <>
                    <ChevronRight className="w-3.5 h-3.5 text-neutral-300 shrink-0" />
                    <span className="text-neutral-950 font-bold truncate max-w-[140px] sm:max-w-[260px]">
                      {getItemTitle(currentSection, currentItem)}
                    </span>
                  </>
                )}
              </nav>
            </div>

            {/* Quick Search */}
            <div className="relative w-44 sm:w-72 shrink-0">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search guides, tools, niches..."
                className="w-full h-8 pl-8 pr-7 rounded-lg bg-neutral-100 border border-neutral-200/80 text-xs font-medium focus:bg-white focus:ring-1 focus:ring-black outline-none transition-all placeholder:text-neutral-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Two-Column App Layout */}
      <div className="flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 py-6 sm:py-8 flex gap-8">
        {/* Left Sideways Navigation Sidebar */}
        <ExploreSidebar
          currentSection={currentSection}
          onSelectSection={navigateToSection}
          isOpenMobile={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
        />

        {/* Right Main Content Workspace */}
        <main className="flex-1 min-w-0">
          {/* SEARCH RESULTS VIEW */}
          {q ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-neutral-950">
                    Search Results for "{searchQuery}"
                  </h2>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Click any result below to open its dedicated full-page document.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="text-xs font-semibold text-neutral-600 hover:text-black underline"
                >
                  Clear search
                </button>
              </div>

              {!hasSearchResults ? (
                <div className="rounded-[24px] border border-dashed border-neutral-300 bg-white p-12 text-center">
                  <p className="text-base font-bold text-neutral-800">
                    No results found for "{searchQuery}"
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">
                    Try searching for "Linen", "Diwali", "Photography", "Margin", or "WhatsApp".
                  </p>
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="mt-4 px-4 py-2 rounded-xl bg-black text-white text-xs font-bold"
                  >
                    Reset Search
                  </button>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Trends Matches */}
                  {searchResults.trends.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-xs font-black uppercase tracking-wider text-neutral-500">
                        Trending Niches ({searchResults.trends.length})
                      </h3>
                      <div className="space-y-2">
                        {searchResults.trends.map((t) => (
                          <div
                            key={t.id}
                            onClick={() => navigateToSearchItem("trending", t.id)}
                            className="p-4 rounded-xl border border-neutral-200 bg-white hover:border-black cursor-pointer transition-all flex items-center justify-between group shadow-2xs"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-800">
                                  {t.category}
                                </span>
                                <span className="text-xs font-bold text-emerald-700">
                                  {t.growthRate}
                                </span>
                              </div>
                              <h4 className="text-sm font-bold text-neutral-950 mt-1 group-hover:underline">
                                {t.title}
                              </h4>
                              <p className="text-xs text-neutral-600 mt-0.5 line-clamp-1">
                                {t.description}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 text-xs font-bold text-black shrink-0 ml-4">
                              <span>Open Dossier</span>
                              <ChevronRight className="w-4 h-4" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Campaigns Matches */}
                  {searchResults.campaigns.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-xs font-black uppercase tracking-wider text-neutral-500">
                        Festive Campaigns ({searchResults.campaigns.length})
                      </h3>
                      <div className="space-y-2">
                        {searchResults.campaigns.map((c) => (
                          <div
                            key={c.id}
                            onClick={() => navigateToSearchItem("calendar", c.id)}
                            className="p-4 rounded-xl border border-neutral-200 bg-white hover:border-black cursor-pointer transition-all flex items-center justify-between group shadow-2xs"
                          >
                            <div>
                              <span className="text-[10px] font-bold text-neutral-500">
                                {c.dateStr} • {c.expectedOrderSurge} Surge
                              </span>
                              <h4 className="text-sm font-bold text-neutral-950 mt-1 group-hover:underline">
                                {c.name}
                              </h4>
                              <p className="text-xs text-neutral-600 mt-0.5 line-clamp-1">
                                {c.overview}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 text-xs font-bold text-black shrink-0 ml-4">
                              <span>View Plan</span>
                              <ChevronRight className="w-4 h-4" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Courses Matches */}
                  {searchResults.courses.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-xs font-black uppercase tracking-wider text-neutral-500">
                        Academy Masterclasses ({searchResults.courses.length})
                      </h3>
                      <div className="space-y-2">
                        {searchResults.courses.map((c) => (
                          <div
                            key={c.id}
                            onClick={() => navigateToSearchItem("academy", c.id)}
                            className="p-4 rounded-xl border border-neutral-200 bg-white hover:border-black cursor-pointer transition-all flex items-center justify-between group shadow-2xs"
                          >
                            <div>
                              <span className="text-[10px] font-bold text-neutral-500">
                                {c.category} • {c.duration} • {c.chaptersCount} Chapters
                              </span>
                              <h4 className="text-sm font-bold text-neutral-950 mt-1 group-hover:underline">
                                {c.title}
                              </h4>
                              <p className="text-xs text-neutral-600 mt-0.5 line-clamp-1">
                                {c.summary}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 text-xs font-bold text-black shrink-0 ml-4">
                              <span>Start Reading</span>
                              <ChevronRight className="w-4 h-4" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* News Matches */}
                  {searchResults.news.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-xs font-black uppercase tracking-wider text-neutral-500">
                        Platform News ({searchResults.news.length})
                      </h3>
                      <div className="space-y-2">
                        {searchResults.news.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => navigateToSearchItem("news", n.id)}
                            className="p-4 rounded-xl border border-neutral-200 bg-white hover:border-black cursor-pointer transition-all flex items-center justify-between group shadow-2xs"
                          >
                            <div>
                              <span className="text-[10px] font-bold text-neutral-500">
                                {n.date} • {n.category}
                              </span>
                              <h4 className="text-sm font-bold text-neutral-950 mt-1 group-hover:underline">
                                {n.title}
                              </h4>
                              <p className="text-xs text-neutral-600 mt-0.5 line-clamp-1">
                                {n.summary}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 text-xs font-bold text-black shrink-0 ml-4">
                              <span>Read Release</span>
                              <ChevronRight className="w-4 h-4" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* DEDICATED FULL-PAGE ITEM VIEWS (NO MODALS) */}
              {selectedTrend && (
                <TrendingDossierView
                  trend={selectedTrend}
                  onBack={() => navigateToItem(null)}
                />
              )}

              {selectedCampaign && (
                <CampaignDetailView
                  campaign={selectedCampaign}
                  onBack={() => navigateToItem(null)}
                />
              )}

              {selectedCourse && (
                <AcademyCoursePlayer
                  course={selectedCourse}
                  onBack={() => navigateToItem(null)}
                />
              )}

              {selectedArticle && (
                <NewsArticleView
                  article={selectedArticle}
                  onBack={() => navigateToItem(null)}
                />
              )}

              {/* DEDICATED SECTION FLOWS (WHEN NO ITEM IS SELECTED) */}
              {!currentItem && (
                <>
                  {currentSection === "trending" && (
                    <TrendingListFlow
                      onSelectTrend={(trend) => navigateToItem(trend.id)}
                    />
                  )}

                  {currentSection === "calendar" && (
                    <CampaignTimelineFlow
                      onSelectCampaign={(camp) => navigateToItem(camp.id)}
                    />
                  )}

                  {currentSection === "creative" && <CreativeStudioWorkspace />}

                  {currentSection === "tools" && <BusinessTools />}

                  {currentSection === "checklist" && <GrowthChecklist />}

                  {currentSection === "academy" && (
                    <AcademyCatalogFlow
                      onSelectCourse={(course) => navigateToItem(course.id)}
                    />
                  )}

                  {currentSection === "playbooks" && (
                    <div className="space-y-12">
                      <PlaybooksGuides />
                      <MarketingDiscounts />
                    </div>
                  )}

                  {currentSection === "news" && (
                    <NewsStreamFlow
                      onSelectArticle={(article) => navigateToItem(article.id)}
                    />
                  )}

                  {currentSection === "themes" && <VisualThemeShowcase />}
                </>
              )}
            </>
          )}

          {/* Bottom Conversion Banner */}
          <div className="mt-16 rounded-[28px] bg-neutral-950 text-white p-8 sm:p-12 relative overflow-hidden shadow-2xl">
            <div className="relative z-10 max-w-2xl space-y-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-semibold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                Zero Commission • 60-Second Setup
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                Ready to Turn Inspiration Into Sales?
              </h2>
              <p className="text-sm sm:text-base text-neutral-300 leading-relaxed">
                Launch your branded mobile storefront with direct UPI settlements straight into your bank account. No technical setup, no credit cards required.
              </p>
              <div className="pt-2 flex flex-wrap items-center gap-4">
                <Link
                  href="/register"
                  className="px-6 py-3.5 rounded-xl bg-white text-neutral-950 text-xs font-bold hover:bg-neutral-100 transition-all shadow-lg inline-flex items-center gap-2"
                >
                  Start Selling for Free
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/themes"
                  className="px-5 py-3.5 rounded-xl bg-white/10 text-white text-xs font-bold hover:bg-white/20 border border-white/15 transition-colors"
                >
                  Browse 37 Themes
                </Link>
              </div>
            </div>

            <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-white/5 to-transparent pointer-events-none hidden lg:block" />
          </div>
        </main>
      </div>

      <SiteFooter />
    </div>
  );
}
