"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  X,
  Rocket,
  Package,
  QrCode,
  Truck,
  Palette,
  CreditCard,
  Code,
  ChevronRight,
  ChevronDown,
  Copy,
  Check,
  ArrowRight,
  ArrowLeft,
  ExternalLink,
  BookOpen,
  Info,
  CheckCircle2,
  AlertTriangle,
  FileText,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { SiteFooter, SiteHeader } from "@/components/home/site-chrome";
import { DOCS_CATEGORIES, type DocArticle, type DocCategory } from "@/lib/docs-data";

const ICON_MAP: Record<string, React.ElementType> = {
  Rocket,
  Package,
  QrCode,
  Truck,
  Palette,
  CreditCard,
  Code,
};

export default function DocsPage() {
  return (
    <React.Suspense fallback={null}>
      <DocsContent />
    </React.Suspense>
  );
}

function DocsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, signOut } = useAuth();

  const articleIdParam = searchParams.get("article") || "create-account";
  const [searchQuery, setSearchQuery] = React.useState("");
  const [copiedCode, setCopiedCode] = React.useState<string | null>(null);
  const [feedback, setFeedback] = React.useState<"up" | "down" | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  // Find active article & its category
  let activeArticle: DocArticle | null = null;
  let activeCategory: DocCategory | null = null;

  for (const cat of DOCS_CATEGORIES) {
    const found = cat.articles.find((a) => a.id === articleIdParam);
    if (found) {
      activeArticle = found;
      activeCategory = cat;
      break;
    }
  }

  // Fallback to first article if param not found
  if (!activeArticle) {
    activeCategory = DOCS_CATEGORIES[0];
    activeArticle = activeCategory.articles[0];
  }

  const selectArticle = (id: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("article", id);
    router.replace(`/docs?${params.toString()}`, { scroll: true });
    setMobileMenuOpen(false);
    setFeedback(null);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const q = searchQuery.trim().toLowerCase();

  // Search filtering across all articles & steps
  const searchResults = React.useMemo(() => {
    if (!q) return null;
    const matches: { article: DocArticle; category: DocCategory }[] = [];
    for (const cat of DOCS_CATEGORIES) {
      for (const art of cat.articles) {
        if (
          art.title.toLowerCase().includes(q) ||
          art.summary.toLowerCase().includes(q) ||
          art.steps.some((s) => s.title.toLowerCase().includes(q) || s.description.toLowerCase().includes(q))
        ) {
          matches.push({ article: art, category: cat });
        }
      }
    }
    return matches;
  }, [q]);

  // Find Next & Previous articles for bottom pagination
  const allArticlesList: { article: DocArticle; category: DocCategory }[] = [];
  for (const c of DOCS_CATEGORIES) {
    for (const a of c.articles) {
      allArticlesList.push({ article: a, category: c });
    }
  }
  const currentIndex = allArticlesList.findIndex((item) => item.article.id === activeArticle?.id);
  const prevArticle = currentIndex > 0 ? allArticlesList[currentIndex - 1] : null;
  const nextArticle = currentIndex < allArticlesList.length - 1 ? allArticlesList[currentIndex + 1] : null;

  return (
    <div className="home-sans flex min-h-screen flex-col overflow-x-clip bg-white font-[Inter,sans-serif] text-neutral-950">
      <SiteHeader user={!!user} onSignOut={() => signOut()} />

      <main className="flex-1 border-t border-neutral-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8">
          {/* Top Breadcrumb & Mobile Menu Switcher */}
          <div className="flex items-center justify-between pb-6 border-b border-neutral-200 mb-6">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-neutral-500">
              <Link href="/explore" className="hover:text-black">
                Explore Hub
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
              <span className="text-neutral-700">{activeCategory?.title}</span>
              <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
              <span className="font-bold text-neutral-950">{activeArticle.title}</span>
            </div>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden px-3 py-1.5 rounded-lg border border-neutral-200 text-xs font-semibold text-neutral-800 flex items-center gap-1.5"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>All Docs Topics</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Sidebar Navigation */}
            <aside
              className={`lg:col-span-4 xl:col-span-3 space-y-6 lg:block ${
                mobileMenuOpen ? "block" : "hidden"
              }`}
            >
              {/* Docs Search Box */}
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search documentation..."
                  className="w-full h-10 pl-9 pr-8 rounded-xl bg-neutral-100 border border-neutral-200 text-xs font-medium focus:bg-white focus:ring-1 focus:ring-black outline-none transition-all placeholder:text-neutral-400"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* If Searching: Search Results List */}
              {searchResults ? (
                <div className="space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 block">
                    Found {searchResults.length} Match{searchResults.length === 1 ? "" : "es"}
                  </span>
                  <div className="space-y-1">
                    {searchResults.map((res) => (
                      <button
                        key={res.article.id}
                        type="button"
                        onClick={() => {
                          selectArticle(res.article.id);
                          setSearchQuery("");
                        }}
                        className="w-full text-left p-2.5 rounded-xl border border-neutral-200/80 hover:border-black bg-white hover:bg-neutral-50 transition-colors block"
                      >
                        <span className="text-xs font-bold text-neutral-950 block">{res.article.title}</span>
                        <span className="text-[10px] text-neutral-500 block mt-0.5">{res.category.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                /* Category Accordion / List */
                <nav className="space-y-6">
                  {DOCS_CATEGORIES.map((cat) => {
                    const Icon = ICON_MAP[cat.iconName] || FileText;
                    const isCurrentCat = cat.id === activeCategory?.id;

                    return (
                      <div key={cat.id} className="space-y-1.5">
                        <div className="flex items-center gap-2 px-2 py-1 text-xs font-bold uppercase tracking-wider text-neutral-900">
                          <Icon className="w-3.5 h-3.5 text-neutral-700" />
                          <span>{cat.title}</span>
                        </div>

                        <div className="space-y-0.5 pl-2 border-l border-neutral-200">
                          {cat.articles.map((art) => {
                            const isSelected = art.id === activeArticle?.id;
                            return (
                              <button
                                key={art.id}
                                type="button"
                                onClick={() => selectArticle(art.id)}
                                className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors block ${
                                  isSelected
                                    ? "bg-black text-white font-bold shadow-2xs"
                                    : "text-neutral-600 hover:text-black hover:bg-neutral-100"
                                }`}
                              >
                                {art.title}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </nav>
              )}
            </aside>

            {/* Main Article Reading Area */}
            <article className="lg:col-span-8 xl:col-span-9 max-w-3xl space-y-8">
              {/* Article Header */}
              <div className="border-b border-neutral-200 pb-6 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-800 text-xs font-bold uppercase tracking-wider">
                    {activeCategory?.title}
                  </span>
                  <span className="text-xs text-neutral-500 font-medium">
                    {activeArticle.readTime} • Updated {activeArticle.updatedAt}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-neutral-950">
                  {activeArticle.title}
                </h1>

                <p className="text-sm sm:text-base text-neutral-600 leading-relaxed font-medium">
                  {activeArticle.summary}
                </p>
              </div>

              {/* Step-by-Step Sections */}
              <div className="space-y-8">
                {activeArticle.steps.map((step, idx) => (
                  <div key={idx} className="space-y-3">
                    <h2 className="text-lg font-bold text-neutral-950 flex items-center gap-2">
                      <span>{step.title}</span>
                    </h2>

                    <p className="text-sm text-neutral-700 leading-relaxed">
                      {step.description}
                    </p>

                    {step.bulletPoints && (
                      <ul className="space-y-1.5 text-xs sm:text-sm text-neutral-700 pl-4 border-l-2 border-neutral-200 my-3">
                        {step.bulletPoints.map((b, bIdx) => (
                          <li key={bIdx} className="leading-relaxed">
                            • {b}
                          </li>
                        ))}
                      </ul>
                    )}

                    {step.codeBlock && (
                      <div className="relative my-3 rounded-xl bg-neutral-950 text-neutral-200 p-4 font-mono text-xs overflow-x-auto">
                        <button
                          type="button"
                          onClick={() => handleCopyCode(step.codeBlock!)}
                          className="absolute right-3 top-3 px-2 py-1 rounded bg-neutral-800 text-[11px] font-sans font-bold text-neutral-300 hover:text-white flex items-center gap-1"
                        >
                          {copiedCode === step.codeBlock ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                        <pre className="whitespace-pre-wrap">{step.codeBlock}</pre>
                      </div>
                    )}

                    {step.alert && (
                      <div
                        className={`p-4 rounded-xl text-xs sm:text-sm my-3 flex items-start gap-3 ${
                          step.alert.type === "tip"
                            ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
                            : step.alert.type === "warning"
                            ? "bg-amber-50 text-amber-900 border border-amber-200"
                            : "bg-blue-50 text-blue-900 border border-blue-200"
                        }`}
                      >
                        {step.alert.type === "tip" && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />}
                        {step.alert.type === "warning" && <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />}
                        {step.alert.type === "note" && <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />}
                        <div className="leading-relaxed font-medium">
                          <strong>{step.alert.type.toUpperCase()}: </strong>
                          <span>{step.alert.text}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Feedback Widget */}
              <div className="p-5 rounded-2xl border border-neutral-200 bg-neutral-50/70 flex flex-col sm:flex-row items-center justify-between gap-4 mt-12">
                <span className="text-xs font-bold text-neutral-800">
                  Was this article helpful?
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setFeedback("up")}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-colors ${
                      feedback === "up"
                        ? "bg-black text-white border-black"
                        : "bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-100"
                    }`}
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>Yes, helpful</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFeedback("down")}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-colors ${
                      feedback === "down"
                        ? "bg-black text-white border-black"
                        : "bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-100"
                    }`}
                  >
                    <ThumbsDown className="w-3.5 h-3.5" />
                    <span>Need more detail</span>
                  </button>
                </div>
              </div>

              {/* Bottom Pagination (Previous & Next Articles) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-neutral-200">
                {prevArticle ? (
                  <button
                    type="button"
                    onClick={() => selectArticle(prevArticle.article.id)}
                    className="p-4 rounded-xl border border-neutral-200 hover:border-black text-left group transition-all"
                  >
                    <span className="text-[11px] font-bold text-neutral-400 block mb-1">
                      ← Previous Article
                    </span>
                    <span className="text-xs font-bold text-neutral-950 group-hover:underline">
                      {prevArticle.article.title}
                    </span>
                  </button>
                ) : <div />}

                {nextArticle ? (
                  <button
                    type="button"
                    onClick={() => selectArticle(nextArticle.article.id)}
                    className="p-4 rounded-xl border border-neutral-200 hover:border-black text-right group transition-all sm:col-start-2"
                  >
                    <span className="text-[11px] font-bold text-neutral-400 block mb-1">
                      Next Article →
                    </span>
                    <span className="text-xs font-bold text-neutral-950 group-hover:underline">
                      {nextArticle.article.title}
                    </span>
                  </button>
                ) : <div />}
              </div>
            </article>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

