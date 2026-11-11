"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Check, ChevronDown, ExternalLink, Lock, Monitor, Play, Search, ShoppingBag, Smartphone, X } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { usePlatformSettings } from "@/lib/use-platform-settings";
import { getAllThemes, type ThemeDefinition } from "@/lib/themes";
import { getCustomTheme } from "@/lib/site-content";
import { PLATFORM_PLANS } from "@/lib/plans";
import { formatThemePrice, getThemePlan, getThemePrice, THEME_SALES } from "@/lib/theme-pricing";
import { SiteFooter, SiteHeader } from "@/components/home/site-chrome";
import { ShopperMark } from "@/components/brand/shopper-logo";

// The shop categories are fine-grained ("Food & Bakery", "Food & Grocery"), so the filter groups them
const GROUPS: { label: string; match: string[] }[] = [
  { label: "Fashion", match: ["Fashion", "Footwear"] },
  { label: "Beauty", match: ["Beauty"] },
  { label: "Jewellery", match: ["Jewellery"] },
  { label: "Home", match: ["Home", "Furniture"] },
  { label: "Food", match: ["Food"] },
  { label: "Electronics", match: ["Electronics"] },
  { label: "Pets", match: ["Pets"] },
];
const groupOf = (category?: string) => GROUPS.find((g) => g.match.some((m) => category?.startsWith(m)))?.label || "More";

const PLAN_ORDER = ["free", "starter", "pro"] as const;
type PlanId = (typeof PLAN_ORDER)[number];
const monthly = (id: PlanId) => {
  const p = PLATFORM_PLANS[id];
  return p.priceMonthly ? `₹${(p.priceMonthly / 100).toLocaleString("en-IN")}/mo` : "Free";
};
/**
 * How a shop gets a theme: free on every plan, or included with Growth or Pro for as long as the shop is on that
 * plan. (With THEME_SALES on, a theme can also be bought once.) "price" above 0 means the theme isn't free.
 */
const offerFor = (slug: string) => {
  const price = getThemePrice(slug);
  const plan = getThemePlan(slug);
  return {
    price,
    plan,
    label: price && !THEME_SALES && plan ? `${PLATFORM_PLANS[plan].name} plan` : formatThemePrice(price),
    /** "Growth" or "Pro": the cheapest plan that includes it */
    planName: plan ? PLATFORM_PLANS[plan].name : null,
  };
};
type Offer = ReturnType<typeof offerFor>;
const previewUrl = (slug: string) => `/themes/preview/${slug}`;
/** The newest built-in themes; built-ins have no date of their own. */
const NEWEST_BUILT_IN = ["theme31", "theme32", "theme33", "theme34", "theme35"];
const RECENT_DAYS = 30;
/** "Recently added": one of the newest built-in themes, or one the admin uploaded in the last 30 days. */
const isRecent = (slug: string) => {
  const uploaded = getCustomTheme(slug)?.uploadedAt;
  if (uploaded) return Date.now() - new Date(uploaded).getTime() < RECENT_DAYS * 24 * 60 * 60 * 1000;
  return NEWEST_BUILT_IN.includes(slug);
};

export default function ThemesPage() {
  return (
    <React.Suspense fallback={null}>
      <ThemeMarketplace />
    </React.Suspense>
  );
}

function ThemeMarketplace() {
  const router = useRouter();
  const search = useSearchParams();
  const { user, signOut } = useAuth();
  // uploaded themes and plan rules arrive from the platform after the first render
  usePlatformSettings();
  const themes = getAllThemes();

  const [query, setQuery] = React.useState("");
  const [group, setGroup] = React.useState("All");
  const [kind, setKind] = React.useState<"all" | "free" | "premium">("all");

  const groups = ["All", ...GROUPS.map((g) => g.label), "More"].filter(
    (g) => g === "All" || themes.some((t) => groupOf(t.category) === g)
  );
  const freeCount = themes.filter((t) => getThemePrice(t.slug) === 0).length;

  const q = query.trim().toLowerCase();
  const shown = themes.filter(
    (t) =>
      (group === "All" || groupOf(t.category) === group) &&
      (kind === "all" || (kind === "free") === (getThemePrice(t.slug) === 0)) &&
      (!q || [t.name, t.tagline, t.category, t.description].some((s) => s?.toLowerCase().includes(q)))
  );

  // the open theme lives in the URL (?theme=slug), so the homepage carousel can link straight to one
  const openSlug = search.get("theme");
  const open = themes.find((t) => t.slug === openSlug) || null;
  const setOpen = (slug: string | null) => {
    const next = new URLSearchParams(search.toString());
    if (slug) next.set("theme", slug);
    else next.delete("theme");
    const qs = next.toString();
    router.replace(qs ? `/themes?${qs}` : "/themes", { scroll: false });
  };

  const useHref = (t: ThemeDefinition) => {
    return user ? `/dashboard?tab=themes&use=${t.slug}` : `/register?theme=${t.slug}`;
  };

  const clear = () => {
    setQuery("");
    setGroup("All");
    setKind("all");
  };

  return (
    <div className="home-sans flex min-h-screen flex-col overflow-x-clip bg-white font-[Inter,sans-serif] text-neutral-950">
      <SiteHeader user={!!user} onSignOut={() => signOut()} />

      <main className="flex-1">
        {/* straight into the marketplace: a quiet title and search, then the categories as tabs */}
        <section className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 sm:pt-8">
          {/* the title and search over a slow drift of real theme websites */}
          <div className="relative -mx-4 overflow-hidden rounded-none py-14 sm:mx-0 sm:rounded-[14px] sm:py-20">
            <LiveBackdrop themes={themes} />
            <div className="relative flex flex-col items-center gap-6 px-4 text-center">
            <h1 className="text-[32px] font-semibold tracking-[-0.025em] text-neutral-950 sm:text-[42px]">Theme marketplace</h1>
            <label className="relative block w-full max-w-[420px] text-left">
              <span className="sr-only">Search themes</span>
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-950" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search themes"
                className="h-11 w-full rounded-[8px] border-[1.5px] border-neutral-950 bg-white pl-10 pr-9 text-sm text-neutral-950 shadow-[0_12px_30px_-18px_rgba(0,0,0,0.45)] outline-none transition-shadow placeholder:text-neutral-500 focus:ring-2 focus:ring-neutral-950/15 focus:ring-offset-2"
              />
              {query && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => setQuery("")}
                  className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-[6px] text-neutral-500 hover:bg-neutral-100 hover:text-black"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </label>
          </div>
          </div>

          <div className="mt-8 flex items-end gap-6 border-b border-neutral-200">
            <div className="-mx-4 flex min-w-0 flex-1 gap-7 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0">
              {groups.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGroup(g)}
                  aria-pressed={group === g}
                  className={`relative -mb-px shrink-0 border-b-2 pb-3 text-[14px] transition-colors duration-200 ${
                    group === g ? "border-neutral-950 font-semibold text-neutral-950" : "border-transparent font-medium text-neutral-500 hover:text-neutral-950"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
            <div className="hidden shrink-0 items-center gap-4 pb-2.5 md:flex">
              {freeCount > 0 && freeCount < themes.length && (
                <div className="flex rounded-[8px] border border-neutral-300 p-0.5">
                  {(["all", "free", "premium"] as const).map((id) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setKind(id)}
                      aria-pressed={kind === id}
                      className={`h-7 rounded-[6px] px-3 text-xs font-semibold capitalize transition-colors ${kind === id ? "bg-neutral-950 text-white" : "text-neutral-600 hover:text-neutral-950"}`}
                    >
                      {id}
                    </button>
                  ))}
                </div>
              )}
              <span className="text-[13px] tabular-nums text-neutral-500">
                {shown.length === themes.length ? `${themes.length} themes` : `${shown.length} of ${themes.length}`}
              </span>
            </div>
          </div>
        </section>

        {/* the themes */}
        <section className="mx-auto max-w-7xl px-4 pb-24 pt-10 sm:px-6">
          {shown.length === 0 ? (
            <div className="rounded-[20px] border border-dashed border-neutral-300 px-6 py-20 text-center">
              <p className="text-lg font-semibold">No themes match that</p>
              <p className="mt-1 text-sm text-neutral-500">Try another word, or look through every theme.</p>
              <button type="button" onClick={clear} className="mt-6 h-10 rounded-full bg-black px-5 text-sm font-semibold text-white hover:bg-neutral-800">
                Show all themes
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-x-5 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
              {shown.map((t, i) => (
                <ThemeCard key={t.slug} theme={t} offer={offerFor(t.slug)} delay={Math.min(i, 8) * 40} useHref={useHref(t)} onOpen={() => setOpen(t.slug)} />
              ))}
            </div>
          )}
        </section>

        {/* closing band */}
        <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6">
          <div className="flex flex-col items-start justify-between gap-6 rounded-[28px] bg-neutral-950 px-8 py-12 text-white sm:flex-row sm:items-center sm:px-12">
            <div>
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Not sure which one yet?</h2>
              <p className="mt-2 text-sm text-white/60 sm:text-base">Start free with any theme. Your products stay put when you switch.</p>
            </div>
            <Link
              href={user ? "/dashboard?tab=themes" : "/register"}
              className="group inline-flex h-12 shrink-0 items-center gap-2 rounded-[14px] bg-white px-6 text-sm font-semibold text-black transition-transform hover:-translate-y-0.5"
            >
              {user ? "Go to my themes" : "Start for free"}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />

      {open && <ThemeDetails theme={open} offer={offerFor(open.slug)} useHref={useHref(open)} signedIn={!!user} onClose={() => setOpen(null)} />}
    </div>
  );
}

/**
 * Behind the title: two rows of real theme websites drifting slowly in opposite directions, washed out so the
 * title and search stay crisp. It stands still for visitors who prefer less motion.
 */
function LiveBackdrop({ themes }: { themes: ThemeDefinition[] }) {
  const rows = [themes.filter((_, i) => i % 2 === 0), themes.filter((_, i) => i % 2 === 1)];
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 flex flex-col justify-center gap-4 bg-neutral-50">
      {rows.map((row, r) => (
        <div key={r} className="flex w-max gap-4 animate-marquee" style={{ animationDuration: `${90 + r * 20}s`, animationDirection: r ? "reverse" : "normal" }}>
          {[...row, ...row].map((t, i) => (
            <span key={`${t.slug}-${i}`} className="relative block aspect-[16/10] w-[220px] shrink-0 overflow-hidden rounded-[8px] ring-1 ring-black/5 sm:w-[260px]">
              <img src={`/theme-previews/${t.slug}.webp`} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover object-top" />
            </span>
          ))}
        </div>
      ))}
      {/* a soft white wash, strongest in the middle where the title sits */}
      <span className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.97)_0%,rgba(255,255,255,0.9)_38%,rgba(255,255,255,0.55)_75%,rgba(255,255,255,0.35)_100%)]" />
    </div>
  );
}

/** The theme's homepage as a picture: a screenshot of its live preview, else its photo, else its colours. */
function Shot({ theme, className = "" }: { theme: ThemeDefinition; className?: string }) {
  const [src, setSrc] = React.useState<string | null>(`/theme-previews/${theme.slug}.webp`);
  if (!src) {
    return (
      <span className="absolute inset-0 flex" aria-hidden>
        {theme.previewColors.map((c) => (
          <span key={c} className="flex-1" style={{ background: c }} />
        ))}
      </span>
    );
  }
  return (
    <img
      src={src}
      alt={`${theme.name} website preview`}
      loading="lazy"
      onError={() => setSrc(src.startsWith("/theme-previews/") ? theme.previewImage || null : null)}
      className={`absolute inset-0 h-full w-full object-cover object-top ${className}`}
    />
  );
}

function Swatches({ colors, size = "h-3.5 w-3.5", ring = "ring-white" }: { colors: string[]; size?: string; ring?: string }) {
  return (
    <span className="flex -space-x-1">
      {colors.slice(0, 3).map((c) => (
        <span key={c} className={`${size} rounded-full ring-2 ${ring}`} style={{ background: c }} />
      ))}
    </span>
  );
}


/**
 * A small black label that follows the cursor over a card's buttons, naming what each one does. It's drawn on the
 * page itself (not inside the lifted card) so the card's scaling doesn't stretch or offset it.
 */
function useCursorTip() {
  const [tip, setTip] = React.useState({ text: "", x: 0, y: 0, on: false });
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  const bind = (text: string) => ({
    onPointerEnter: (e: React.PointerEvent) => setTip({ text, x: e.clientX, y: e.clientY, on: true }),
    onPointerMove: (e: React.PointerEvent) => setTip({ text, x: e.clientX, y: e.clientY, on: true }),
    onPointerLeave: () => setTip((t) => ({ ...t, on: false })),
  });
  const node = mounted
    ? createPortal(
        <span
          aria-hidden
          className={`pointer-events-none fixed left-0 top-0 z-[90] whitespace-nowrap rounded-[6px] bg-neutral-950 px-2.5 py-1.5 text-[11.5px] font-semibold text-white shadow-[0_10px_24px_-8px_rgba(0,0,0,0.55)] ring-1 ring-white/15 transition-[opacity,transform] duration-100 ease-out ${
            tip.on ? "opacity-100" : "opacity-0"
          }`}
          style={{ transform: `translate3d(${tip.x + 14}px, ${tip.y + 18}px, 0)` }}
        >
          {tip.text}
        </span>,
        document.body
      )
    : null;
  return { bind, node, hide: () => setTip((t) => ({ ...t, on: false })) };
}

const ctl = "flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-[transform,border-color,background-color] duration-200 hover:scale-110";

/**
 * A theme in the grid: its website, then the name and price. With a mouse, resting on a card for a moment grows it
 * into a streaming-style title card: the theme's name set over the website like a film title, round controls to
 * preview, buy and open the details, and a line of facts and "genres" underneath. It's the card itself that grows,
 * and it stays above its neighbours until it has shrunk back, so it never slips under them on the way out; the card
 * being entered always sits above the one leaving.
 */
function ThemeCard({ theme, offer, delay, useHref, onOpen }: { theme: ThemeDefinition; offer: Offer; delay: number; useHref: string; onOpen: () => void }) {
  const [hot, setHot] = React.useState(false);
  const [raised, setRaised] = React.useState(false);
  const [origin, setOrigin] = React.useState("origin-center");
  const panelRef = React.useRef<HTMLDivElement>(null);
  const tip = useCursorTip();
  const [panelH, setPanelH] = React.useState(0);
  React.useEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setPanelH(el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const timer = React.useRef<number | undefined>(undefined);
  React.useEffect(() => () => window.clearTimeout(timer.current), []);

  const enter = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse" || !window.matchMedia("(min-width: 1024px)").matches) return;
    // cards at the edges grow inwards so they never spill off the page
    const r = e.currentTarget.getBoundingClientRect();
    setOrigin(r.left < 100 ? "origin-left" : r.right > window.innerWidth - 100 ? "origin-right" : "origin-center");
    window.clearTimeout(timer.current);
    setRaised(true);
    timer.current = window.setTimeout(() => setHot(true), 220);
  };
  const leave = () => {
    window.clearTimeout(timer.current);
    tip.hide();
    setHot(false);
    timer.current = window.setTimeout(() => setRaised(false), 460);
  };

  const price = offer.label;
  // the line under the price: how else to get it
  const also = offer.price ? (!THEME_SALES && offer.plan ? `From ${monthly(offer.plan)}` : offer.planName ? `or with ${offer.planName}` : "Own it forever") : `Edit from ${monthly("starter")}`;
  const getIt = !THEME_SALES && offer.planName ? `Use with ${offer.planName}` : `Buy for ${price}`;

  return (
    <div className={`hero-rise relative ${hot ? "z-40" : raised ? "z-30" : "z-0"}`} style={{ animationDelay: `${delay}ms` }} onPointerEnter={enter} onPointerLeave={leave}>
      <div className={`relative ${origin} transition-[scale,translate] duration-[450ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${hot ? "-translate-y-4 scale-[1.12]" : ""}`}>
        {/* a thin black gradient border around the whole lifted card, website and panel */}
        <span
          aria-hidden
          className={`pointer-events-none absolute -left-[2px] -right-[2px] -top-[2px] rounded-[8px] bg-[linear-gradient(145deg,#000_0%,#4a4a4a_38%,#0a0a0a_62%,#5a5a5a_100%)] transition-opacity duration-300 ${hot ? "opacity-100" : "opacity-0"}`}
          style={{ height: `calc(100% + ${panelH}px + 4px)` }}
        />
        <button
          type="button"
          onClick={onOpen}
          aria-label={`${theme.name} details`}
          className={`relative block aspect-[16/10] w-full overflow-hidden bg-neutral-100 ring-1 ring-black/[0.07] transition-[border-radius] duration-[450ms] ${hot ? "rounded-t-[6px]" : "rounded-[10px]"}`}
        >
          <Shot theme={theme} />
          {/* the title treatment, like a film's poster */}
          <span aria-hidden className={`absolute inset-0 transition-opacity duration-300 ${hot ? "opacity-100" : "opacity-0"}`}>
            <span className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-[#141414] via-[#141414]/60 to-transparent" />
            <span className="absolute left-0 top-2.5 flex items-center gap-1.5 bg-neutral-950 py-1 pl-2.5 pr-5 text-[9px] font-bold uppercase tracking-[0.22em] text-white shadow-[0_6px_14px_-6px_rgba(0,0,0,0.6)] [clip-path:polygon(0_0,100%_0,calc(100%-10px)_100%,0_100%)]">
              <ShopperMark className="h-3 w-auto" /> Theme
            </span>
            <span
              className={`absolute bottom-2.5 left-3.5 right-3.5 truncate text-left text-[24px] font-black uppercase leading-none tracking-[-0.01em] text-white transition-[translate,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] [text-shadow:0_2px_14px_rgba(0,0,0,0.5)] ${
                hot ? "translate-y-0 opacity-100 delay-100" : "translate-y-2 opacity-0"
              }`}
            >
              {theme.name}
            </span>
          </span>
        </button>

        {/* "Recently added", floating across the website's bottom edge with a soft shadow */}
        {isRecent(theme.slug) && (
          <span
            aria-hidden
            className={`pointer-events-none absolute bottom-0 left-1/2 z-10 -translate-x-1/2 translate-y-1/2 transition-opacity duration-300 ${hot ? "opacity-0" : "opacity-100"}`}
          >
            <span className="block animate-float-gentle whitespace-nowrap rounded-[6px] bg-neutral-950 px-2.5 py-1 text-[10.5px] font-semibold tracking-[0.02em] text-white shadow-[0_12px_24px_-8px_rgba(0,0,0,0.55),0_3px_6px_-2px_rgba(0,0,0,0.3)] ring-1 ring-white/10">
              Recently added
            </span>
          </span>
        )}

        {/* the panel under the website: controls, facts, genres */}
        <div
          ref={panelRef}
          aria-hidden={!hot}
          className={`absolute inset-x-0 top-full rounded-b-[6px] bg-[#141414] px-4 py-4 text-white shadow-[0_40px_70px_-24px_rgba(0,0,0,0.7)] transition-[opacity,translate] duration-300 ease-out ${
            hot ? "translate-y-0 opacity-100 delay-100" : "pointer-events-none -translate-y-1.5 opacity-0"
          }`}
        >
          <div className="flex items-center gap-3">
            <button type="button" tabIndex={hot ? 0 : -1} onClick={onOpen} aria-label={`${theme.name} details`} {...tip.bind("Details")} className={`${ctl} border-2 border-white/40 hover:border-white`}>
              <ChevronDown className="h-4 w-4" />
            </button>
            <Link
              href={useHref}
              tabIndex={hot ? 0 : -1}
              aria-label={offer.price && THEME_SALES ? `Buy ${theme.name}` : `Use ${theme.name}`}
              {...tip.bind(offer.price ? getIt : "Use for free")}
              className={`${ctl} border-2 border-white/40 hover:border-white`}
            >
              <ShoppingBag className="h-4 w-4" />
            </Link>
            <a
              href={previewUrl(theme.slug)}
              target="_blank"
              rel="noopener"
              tabIndex={hot ? 0 : -1}
              aria-label={`Live preview of ${theme.name}`}
              {...tip.bind("Live preview")}
              className={`${ctl} ml-auto bg-white text-black hover:bg-neutral-200`}
            >
              <Play className="ml-0.5 h-4 w-4 fill-current" />
            </a>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <span className="text-[14px] font-bold tabular-nums">{price}</span>
            <span className="rounded-[3px] border border-white/40 px-1.5 py-px text-[10.5px] font-medium leading-tight text-white/85">{offer.price ? (offer.plan === "pro" ? "Pro" : offer.planName ? `${offer.planName}+` : "Own it") : "All plans"}</span>
            <span className="rounded-[3px] border border-white/40 px-1.5 py-px text-[10.5px] font-medium leading-tight text-white/85">Phone + desktop</span>
            <span className="ml-auto">
              <Swatches colors={theme.previewColors} size="h-3 w-3" ring="ring-[#141414]" />
            </span>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onOpen}
        tabIndex={hot ? -1 : 0}
        // hidden under the lifted card, so it mustn't catch the clicks meant for the panel's buttons
        className={`mt-[18px] flex w-full items-start justify-between gap-3 px-0.5 text-left transition-opacity duration-200 ${hot ? "pointer-events-none opacity-0" : "opacity-100"}`}
      >
        <span className="min-w-0">
          <span className="block truncate text-[15px] font-semibold tracking-tight">{theme.name}</span>
          <span className="mt-0.5 block truncate text-[13px] text-neutral-500">{theme.category}</span>
        </span>
        <span className="shrink-0 text-right">
          <span className="block text-[16px] font-bold tabular-nums tracking-tight">{price}</span>
          <span className="mt-0.5 block text-[12px] text-neutral-500">{also}</span>
        </span>
      </button>
      {tip.node}
    </div>
  );
}

/** The theme's live website in a browser-style frame, scaled to fit, as a desktop or a phone. */
function LiveFrame({ slug, device }: { slug: string; device: "desktop" | "phone" }) {
  const box = React.useRef<HTMLDivElement>(null);
  const [w, setW] = React.useState(0);
  const [loaded, setLoaded] = React.useState(false);
  React.useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  React.useEffect(() => setLoaded(false), [slug]);

  const desk = w / 1440;
  // the phone view gets a taller stage on narrow screens, so the phone is big enough to read
  const tall = typeof window === "undefined" ? 0 : Math.round(Math.min(470, window.innerHeight * 0.56));
  const height = device === "phone" ? Math.max(Math.round(900 * desk), tall) : Math.round(900 * desk);
  const phone = Math.max(0.2, (height - 36) / 844);

  return (
    <div ref={box} className="relative w-full overflow-hidden bg-neutral-100 transition-[height] duration-300" style={{ height }}>
      {w > 0 &&
        (device === "desktop" ? (
          <iframe
            key="desktop"
            src={previewUrl(slug)}
            title="Live website preview"
            onLoad={() => setLoaded(true)}
            className="absolute left-0 top-0 origin-top-left border-0 bg-white"
            style={{ width: 1440, height: 900, transform: `scale(${desk})` }}
          />
        ) : (
          <div
            className="absolute left-1/2 top-[18px] -translate-x-1/2 overflow-hidden rounded-[26px] bg-white shadow-[0_20px_50px_-20px_rgba(0,0,0,0.45)] ring-[5px] ring-black"
            style={{ width: 390 * phone, height: 844 * phone }}
          >
            <iframe
              key="phone"
              src={previewUrl(slug)}
              title="Live website preview on a phone"
              onLoad={() => setLoaded(true)}
              className="absolute left-0 top-0 origin-top-left border-0"
              style={{ width: 390, height: 844, transform: `scale(${phone})` }}
            />
          </div>
        ))}
      {!loaded && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="h-7 w-7 animate-spin rounded-full border-2 border-neutral-900 border-t-transparent" aria-label="Loading the preview" />
        </div>
      )}
    </div>
  );
}

function ThemeDetails({ theme, offer, useHref, signedIn, onClose }: { theme: ThemeDefinition; offer: Offer; useHref: string; signedIn: boolean; onClose: () => void }) {
  const [device, setDevice] = React.useState<"desktop" | "phone">("desktop");
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // phones see the phone view first
    if (window.matchMedia("(max-width: 639px)").matches) setDevice("phone");
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={theme.name}>
      <div className="animate-backdrop-in absolute inset-0 bg-black/60 backdrop-blur-[2px]" onClick={onClose} />
      <div className="animate-sheet-up no-scrollbar relative max-h-[94svh] w-full max-w-5xl overflow-y-auto overscroll-contain rounded-t-[24px] bg-white sm:rounded-[24px]">
        {/* the website, live, on top */}
        <div className="sticky top-0 z-10 bg-white">
          <div className="flex items-center gap-2 border-b border-neutral-200 px-3 py-2 sm:gap-3 sm:px-4 sm:py-2.5">
            <span className="hidden gap-1.5 sm:flex" aria-hidden>
              <span className="h-2.5 w-2.5 rounded-full bg-neutral-300" />
              <span className="h-2.5 w-2.5 rounded-full bg-neutral-300" />
              <span className="h-2.5 w-2.5 rounded-full bg-neutral-300" />
            </span>
            <span className="min-w-0 flex-1 truncate rounded-full bg-neutral-100 px-3 py-1 text-center text-xs text-neutral-500">
              {theme.slug}.shopersite.in
            </span>
            <div className="flex shrink-0 items-center rounded-full bg-neutral-100 p-0.5">
              {(["desktop", "phone"] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDevice(d)}
                  aria-pressed={device === d}
                  aria-label={d === "desktop" ? "Desktop view" : "Phone view"}
                  className={`flex h-7 min-h-0 w-9 items-center justify-center rounded-full transition-colors ${device === d ? "bg-white text-black shadow-sm" : "text-neutral-500 hover:text-black"}`}
                >
                  {d === "desktop" ? <Monitor className="h-3.5 w-3.5" /> : <Smartphone className="h-3.5 w-3.5" />}
                </button>
              ))}
            </div>
            <button type="button" onClick={onClose} aria-label="Close" className="flex h-8 min-h-0 w-8 shrink-0 items-center justify-center rounded-full hover:bg-neutral-100">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <LiveFrame slug={theme.slug} device={device} />

        {/* about the theme, and what it costs */}
        <div className="grid gap-5 px-5 pb-6 pt-5 sm:gap-8 sm:p-9 md:grid-cols-[1.25fr_1fr]">
          <div>
            <span className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-neutral-500 sm:text-[11px]">{theme.category}</span>
            <h2 className="mt-1 text-[1.6rem] font-bold leading-tight tracking-[-0.03em] sm:mt-2 sm:text-4xl">{theme.name}</h2>
            <p className="mt-1 text-sm text-neutral-500 sm:mt-2 sm:text-base">{theme.tagline}</p>
            <p className="mt-3 text-[13.5px] leading-relaxed text-neutral-700 sm:mt-5 sm:text-[15px]">{theme.description}</p>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-x-5 gap-y-3 sm:mt-5 sm:flex-col sm:items-start sm:justify-start sm:gap-y-6">
              <div className="flex items-center gap-3">
                <span className="text-sm text-neutral-500">Colours</span>
                <Swatches colors={theme.previewColors} size="h-6 w-6" />
              </div>
              <a href={previewUrl(theme.slug)} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 text-sm font-semibold underline-offset-4 hover:underline">
                Open the full preview <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

          <div className="rounded-[18px] border border-neutral-200 p-4 sm:p-5">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-semibold">Pricing</span>
              <Link href="/#pricing" className="text-xs text-neutral-500 underline-offset-4 hover:text-black hover:underline">
                Compare plans
              </Link>
            </div>
            <div className="mt-3 divide-y divide-neutral-100">
              {[
                ...(offer.price && THEME_SALES ? [{ key: "own", name: "Buy once", price: offer.label, has: true, top: true, text: "Yours for good on any plan, editor included" }] : []),
                ...PLAN_ORDER.map((id) => {
                  const included = offer.price === 0 || (id === "starter" ? offer.plan === "starter" : id === "pro" ? !!offer.plan : false);
                  return {
                    key: id,
                    name: `${PLATFORM_PLANS[id].name} plan`,
                    price: id === "free" ? "₹0" : monthly(id),
                    has: included,
                    top: offer.price === 0 ? id === "free" : !THEME_SALES && id === offer.plan,
                    text: !included
                      ? id === "free" && THEME_SALES ? "Buy it once to use it on Free" : "Not included"
                      : id === "free" ? "This theme as it comes" : offer.price ? "Included while you're on the plan, with the editor" : "This theme, plus the editor",
                  };
                }),
              ].map((row) => (
                <div key={row.key} className="flex items-start justify-between gap-3 py-3">
                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5 text-sm font-semibold">
                      {row.name}
                      {row.top && <span className="rounded-full bg-black px-1.5 py-px text-[9.5px] font-semibold uppercase tracking-wider text-white">{offer.price && THEME_SALES ? "Best value" : "Starts here"}</span>}
                    </span>
                    <span className="mt-0.5 block text-xs text-neutral-500">{row.text}</span>
                  </span>
                  <span className={`flex shrink-0 items-center gap-1.5 text-sm font-semibold tabular-nums ${row.has ? "" : "text-neutral-400"}`}>
                    {row.has ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : <Lock className="h-3.5 w-3.5" />}
                    {row.price}
                  </span>
                </div>
              ))}
            </div>
            <Link
              href={useHref}
              className="group mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-[14px] bg-black text-sm font-semibold text-white transition-colors hover:bg-neutral-800"
            >
              {!THEME_SALES && offer.planName
                ? signedIn ? `Use it with ${offer.planName}` : `Start your shop, then go ${offer.planName}`
                : signedIn ? (offer.price ? `Get it for ${offer.label}` : "Use this theme") : offer.price ? `Start and get it for ${offer.label}` : "Start free with this theme"}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <p className="mt-2.5 text-center text-xs text-neutral-500">
              {signedIn
                ? THEME_SALES ? "Opens your dashboard's themes, where you can buy it or use it with your plan." : "Opens your dashboard's themes, where you can use it with your plan."
                : offer.price
                  ? THEME_SALES ? "Create your free shop, then buy it once in Themes. Pay by UPI." : `Create your shop, then switch to this theme on ${offer.planName || "a paid plan"}.`
                  : "No card needed. Switch themes any time."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
