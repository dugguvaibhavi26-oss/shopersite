"use client";

import * as React from "react";
import { ArrowRight, ArrowUpRight, BookOpen, CalendarDays, Check, Copy, Flame, Layers, Sparkles, TrendingUp, Wand2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import type { StoreData } from "@/lib/store-service";
import type { DashPage } from "@/lib/assistant/commands";
import { DISCOVER_DEFAULTS, EXPLORE_IDS, type DiscoverId } from "@/lib/discover";
import { useDiscoverCards } from "@/lib/discover-client";
import { DESIGN_TIPS, HomeDiscover, PHOTO_TIPS, templates } from "./home-discover";

/**
 * Home → Discover, a small growth hub: tabs for For you, Trends, Campaigns, Design, Templates and
 * Learn. "For you" shows the picked cards and an Explore row; each other tab shows its content
 * right here. Card words and links come from Admin → Discover cards.
 */

export type GrowthTab = "for-you" | "trends" | "campaigns" | "design" | "templates" | "learn";
type Tab = GrowthTab;
const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "for-you", label: "For you", icon: Sparkles },
  { id: "trends", label: "Trends", icon: TrendingUp },
  { id: "campaigns", label: "Campaigns", icon: CalendarDays },
  { id: "design", label: "Design", icon: Layers },
  { id: "templates", label: "Templates", icon: Wand2 },
  { id: "learn", label: "Learn", icon: BookOpen },
];

const DAY = 86400_000;

/* ------------------------------ campaign calendar ------------------------------ */

interface Campaign {
  name: string;
  /** exact date, or null when it follows the lunar calendar (shown by month) */
  date: Date | null;
  year: number;
  month: number;
  tip: string;
}

const nthWeekday = (y: number, m: number, weekday: number, n: number) => {
  const d = new Date(y, m, 1);
  const shift = (weekday - d.getDay() + 7) % 7;
  return new Date(y, m, 1 + shift + (n - 1) * 7);
};

function campaignsFor(year: number): Campaign[] {
  const fixed = (m: number, d: number, name: string, tip: string): Campaign => ({ name, date: new Date(year, m, d), year, month: m, tip });
  const lunar = (m: number, name: string, tip: string): Campaign => ({ name, date: null, year, month: m, tip });
  const thanksgiving = nthWeekday(year, 10, 4, 4);
  return [
    fixed(0, 13, "Lohri", "Warm winter wear and festive gifting for Punjab buyers."),
    fixed(0, 14, "Makar Sankranti & Pongal", "Traditional wear, kites and festive combos."),
    fixed(0, 26, "Republic Day sale", "A 26%-off deal on one category is a classic."),
    fixed(1, 14, "Valentine's Day", "Gift edits and couple combos. Remind buyers a week early."),
    lunar(2, "Holi (date varies)", "Bright colours and white party outfits."),
    fixed(2, 8, "Women's Day", "Celebrate women buyers or the women behind your shop."),
    { name: "Mother's Day", date: nthWeekday(year, 4, 0, 2), year, month: 4, tip: "Gift guide plus a gift note at checkout." },
    { name: "Father's Day", date: nthWeekday(year, 5, 0, 3), year, month: 5, tip: "Gifts for dads under a set price." },
    { name: "Friendship Day", date: nthWeekday(year, 7, 0, 1), year, month: 7, tip: "Buy-2 combos and friendship gift sets." },
    lunar(7, "Raksha Bandhan (date varies)", "Rakhi gift hampers. Show clear order-by dates."),
    fixed(7, 15, "Independence Day", "Tricolour edits and a freedom sale."),
    lunar(8, "Ganesh Chaturthi & Onam (dates vary)", "Festive wear and decor. Start Diwali teasers."),
    fixed(8, 5, "Teachers' Day", "Small gifts and thank-you combos."),
    lunar(9, "Navratri & Dussehra (dates vary)", "Colour-of-the-day posts for nine days."),
    fixed(9, 2, "Gandhi Jayanti", "Khadi and handmade spotlights."),
    lunar(9, "Diwali (Oct/Nov, date varies)", "The biggest week: gift guides, combos and order-by dates."),
    fixed(10, 14, "Children's Day", "Kids' picks and family combos."),
    { name: "Black Friday", date: new Date(year, 10, thanksgiving.getDate() + 1), year, month: 10, tip: "A weekend-only coupon with a clear end time." },
    fixed(11, 25, "Christmas", "Secret-Santa gifts under ₹500 / ₹999."),
    fixed(11, 31, "New Year's Eve", "Party looks and a year-end sale."),
  ];
}

/** The next twelve months of campaigns, soonest first. */
function upcomingCampaigns(now = new Date()): (Campaign & { inDays: number | null })[] {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const all = [...campaignsFor(now.getFullYear()), ...campaignsFor(now.getFullYear() + 1)];
  return all
    .map((c) => {
      const monthStart = new Date(c.year, c.month, 1).getTime();
      return { ...c, sortAt: c.date ? c.date.getTime() : monthStart + 14 * DAY, inDays: c.date ? Math.round((c.date.getTime() - today) / DAY) : null };
    })
    .filter((c) => c.sortAt >= today && c.sortAt < today + 365 * DAY)
    // the lunar ones appear once per year: keep the first
    .filter((c, i, arr) => arr.findIndex((x) => x.name === c.name) === i)
    .sort((a, b) => a.sortAt - b.sortAt);
}

/* ------------------------------ trends ------------------------------ */

const SEASON_TRENDS: string[][] = [
  ["Winter wear", "Festive combos", "Kites & Sankranti", "New-year planners"],
  ["Gift hampers", "Jewellery", "Couple combos", "Wedding guest wear"],
  ["Holi whites", "Summer cotton", "Skincare", "Year-end clearance"],
  ["Summer dresses", "Sunglasses", "Linen", "Travel accessories"],
  ["Mother's Day gifts", "Vacation wear", "Light fabrics", "Hampers"],
  ["Monsoon wear", "Office wear", "Back to school", "Umbrellas & bags"],
  ["End-of-season sale", "Monsoon accessories", "Home decor", "Bundles"],
  ["Rakhi hampers", "Tricolour wear", "Ethnic wear", "Gift boxes"],
  ["Festive wear", "Puja essentials", "Onam whites", "Decor"],
  ["Navratri chaniya choli", "Diwali gifts", "Lights & decor", "Sweets boxes"],
  ["Wedding wear", "Jewellery", "Gift hampers", "Winter wear"],
  ["Party wear", "Secret-Santa gifts", "Winter wear", "Year-end sale"],
];

/* ------------------------------ creative lab & academy ------------------------------ */

const CREATIVE = [
  { title: "Product description", text: "Short, warm and honest copy for a product.", prompt: "Write a short product description for my newest product. Ask me if you need details." },
  { title: "Instagram caption", text: "A caption with hashtags for your next post.", prompt: "Write an Instagram caption with 5 hashtags for my newest product." },
  { title: "WhatsApp broadcast", text: "A message to send to all your buyers.", prompt: "Write a WhatsApp broadcast message announcing my latest products, with my shop link." },
  { title: "Banner headline", text: "A punchy line for your homepage banner.", prompt: "Suggest 5 short homepage banner headlines for my shop this season." },
  { title: "Festive offer idea", text: "An offer that fits the season, ready to create.", prompt: "Suggest a festive offer for my shop this month and prepare the coupon." },
  { title: "Reply to a buyer", text: "A polite reply for a question or complaint.", prompt: "Help me write a polite reply to a buyer. I'll paste their message next." },
];

export interface Lesson {
  title: string;
  mins: number;
  points: string[];
  page?: DashPage;
  pageLabel?: string;
}
export const LESSONS: Lesson[] = [
  {
    title: "Your first 10 orders",
    mins: 3,
    points: [
      "Start with friends, family and your WhatsApp contacts: share your shop link with a short personal message.",
      "Post 3 products on Instagram stories with the link sticker, every day for a week.",
      "Offer a small first-order coupon (e.g. 10%) and mention it in every share.",
      "Ask every happy buyer for a review and a screenshot you can share.",
    ],
    page: "discounts",
    pageLabel: "Create a coupon",
  },
  {
    title: "Pricing that sells",
    mins: 3,
    points: [
      "Add up product cost, packing, delivery and payment fees, then add your margin.",
      "Show an MRP above the price only when it's real; buyers trust honest discounts.",
      "Use free delivery above a value (e.g. ₹999) to raise the order size.",
      "Round prices to ₹499 / ₹999 style numbers.",
    ],
    page: "settings",
    pageLabel: "Delivery settings",
  },
  {
    title: "Photos that convert",
    mins: 2,
    points: PHOTO_TIPS.slice(0, 5).map((t) => `${t.t}: ${t.d}`),
    page: "products",
    pageLabel: "Update photos",
  },
  {
    title: "Selling on WhatsApp",
    mins: 3,
    points: [
      "Put your shop link in your WhatsApp Business profile and status.",
      "Use broadcast lists (not groups) for offers, at most 2–3 times a week.",
      "Reply fast: buyers who get an answer within minutes order far more often.",
      "Send order updates from each order with one tap.",
    ],
    page: "orders",
    pageLabel: "Open orders",
  },
  {
    title: "Shipping without stress",
    mins: 3,
    points: [
      "Pack the same day and mark orders Packed so buyers see progress.",
      "Connect Shiprocket to compare courier prices and book pickups.",
      "Add the tracking number when you ship; buyers stop asking 'where is my order?'.",
      "Keep some money in your Shiprocket wallet so bookings don't fail.",
    ],
    page: "plugins",
    pageLabel: "Open Plugins",
  },
  {
    title: "Handling COD and returns",
    mins: 3,
    points: [
      "Set a COD limit and a small COD fee to cut fake orders.",
      "Call or WhatsApp the buyer to confirm big COD orders before shipping.",
      "Write a clear return policy: how many days, what condition, who pays shipping.",
      "Answer return requests quickly from the order page.",
    ],
    page: "policies",
    pageLabel: "Edit policies",
  },
];

/* ------------------------------ component ------------------------------ */

const ICONS: Record<(typeof EXPLORE_IDS)[number], React.ElementType> = { trending: Flame, calendar: CalendarDays, creative: Wand2, academy: BookOpen };
const EXPLORE_TAB: Record<(typeof EXPLORE_IDS)[number], Tab> = { trending: "trends", calendar: "campaigns", creative: "templates", academy: "learn" };
const panel = "rounded-[22px] border border-black/[0.06] bg-white p-5 sm:p-6";

export function HomeGrowth({
  store,
  storeLink,
  onNavigate,
  onAsk,
  only,
}: {
  store: StoreData;
  storeLink: string;
  onNavigate: (page: DashPage) => void;
  onAsk: (text: string) => void;
  /** show just this section, without the heading and tabs (used in Home's Explore windows) */
  only?: Tab;
}) {
  const [tabState, setTab] = React.useState<Tab>("for-you");
  const tab = only ?? tabState;
  const [lesson, setLesson] = React.useState<Lesson | null>(null);
  const [copied, setCopied] = React.useState("");
  const [tplTab, setTplTab] = React.useState<"WhatsApp" | "Instagram" | "Status & stories">("WhatsApp");
  const admin = useDiscoverCards();
  const month = new Date().getMonth();

  const openExplore = (id: (typeof EXPLORE_IDS)[number]) => {
    const link = admin[id as DiscoverId].link;
    if (!link) return setTab(EXPLORE_TAB[id]);
    if (link.startsWith("/")) window.location.assign(link);
    else window.open(link, "_blank", "noopener,noreferrer");
  };
  const copy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(""), 1500);
    } catch {
      // clipboard blocked
    }
  };

  const trends = React.useMemo(() => {
    const now = Date.now();
    const units = (from: number, to: number) => {
      const m = new Map<string, { title: string; qty: number }>();
      for (const o of store.orders || []) {
        const t = Date.parse(o.createdAt);
        if (t < from || t >= to || o.fulfilmentStatus === "cancelled") continue;
        for (const it of o.items) {
          const x = m.get(it.productId) || { title: it.title, qty: 0 };
          x.qty += it.quantity;
          m.set(it.productId, x);
        }
      }
      return m;
    };
    const cur = units(now - 7 * DAY, now + DAY);
    const prev = units(now - 14 * DAY, now - 7 * DAY);
    const rising = [...cur.entries()]
      .map(([id, v]) => ({ id, title: v.title, qty: v.qty, before: prev.get(id)?.qty || 0 }))
      .sort((a, b) => b.qty - b.before - (a.qty - a.before))
      .slice(0, 5);
    const lowViewsHint = (store.products || []).filter((p) => p.status === "published" && !cur.has(p.id)).length;
    return { rising, quiet: lowViewsHint };
  }, [store]);
  const campaigns = React.useMemo(() => upcomingCampaigns().slice(0, 8), []);
  const tpl = React.useMemo(() => templates(store.name, storeLink), [store.name, storeLink]);

  return (
    <section className="space-y-5">
      {/* heading + tabs */}
      {!only && (
      <>
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-400">Discover</p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">Grow your shop</h2>
        <p className="mt-1 text-sm text-neutral-500">Ideas, tools and lessons to sell more and build a stronger brand.</p>
      </div>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            style={{ minHeight: 0 }}
            className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-medium transition-colors ${tab === t.id ? "bg-neutral-950 text-white" : "border border-black/[0.08] bg-white text-neutral-700 hover:border-neutral-900"}`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>
      </>
      )}

      <div key={tab} className="tab-enter space-y-6">
        {/* FOR YOU */}
        {tab === "for-you" && (
          <>
            <div>
              <h3 className="mb-3 text-base font-semibold">Picked for you</h3>
              <HomeDiscover store={store} storeLink={storeLink} onNavigate={onNavigate} onAsk={onAsk} />
            </div>
            <div>
              <h3 className="mb-3 text-base font-semibold">Explore more</h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {EXPLORE_IDS.filter((id) => admin[id].enabled).map((id) => {
                  const Icon = ICONS[id];
                  const c = admin[id];
                  const d = DISCOVER_DEFAULTS[id];
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => openExplore(id)}
                      className="group flex items-start gap-3 rounded-[20px] border border-black/[0.06] bg-white p-4 text-left transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-30px_rgba(0,0,0,0.4)]"
                    >
                      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-neutral-900" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold">{c.title || d.title}</span>
                        <span className="mt-0.5 block text-xs leading-relaxed text-neutral-500">{c.text || d.text}</span>
                      </span>
                      <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-neutral-300 transition-all group-hover:translate-x-0.5 group-hover:text-neutral-900" />
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* TRENDS */}
        {tab === "trends" && (
          <div className="grid gap-4 lg:grid-cols-2">
            <div className={panel}>
              <p className="text-base font-semibold">Rising in your shop</p>
              <p className="text-xs text-neutral-500">Units sold this week vs last week</p>
              {trends.rising.length ? (
                <ul className="mt-4 divide-y divide-neutral-100">
                  {trends.rising.map((r) => (
                    <li key={r.id} className="flex items-center gap-3 py-3 text-sm">
                      <span className="min-w-0 flex-1 truncate">{r.title}</span>
                      <span className="tabular-nums text-neutral-500">{r.qty} sold</span>
                      <span className={`w-14 text-right text-xs font-semibold tabular-nums ${r.qty >= r.before ? "text-emerald-600" : "text-neutral-400"}`}>{r.before ? `${r.qty >= r.before ? "+" : ""}${r.qty - r.before}` : "new"}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-neutral-500">No sales this week yet. Share a product today to get things moving.</p>
              )}
              {trends.quiet > 0 && (
                <button type="button" onClick={() => onAsk("Which of my products haven't sold recently, and how can I promote them?")} style={{ minHeight: 0 }} className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-neutral-900 hover:underline">
                  {trends.quiet} product{trends.quiet === 1 ? "" : "s"} had no sales this week: get ideas <ArrowUpRight className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className={panel}>
              <p className="text-base font-semibold">Popular this season</p>
              <p className="text-xs text-neutral-500">What Indian shoppers look for in {new Date().toLocaleDateString("en-IN", { month: "long" })}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {SEASON_TRENDS[month].map((t) => (
                  <button key={t} type="button" onClick={() => onAsk(`"${t}" is popular this season. How can my shop take part? Suggest products, a coupon and a caption.`)} style={{ minHeight: 0 }} className="rounded-full border border-black/[0.08] px-3.5 py-2 text-sm transition-colors hover:border-neutral-900">
                    {t}
                  </button>
                ))}
              </div>
              <p className="mt-4 text-xs text-neutral-400">Tap one to plan it with the assistant.</p>
            </div>
          </div>
        )}

        {/* CAMPAIGNS */}
        {tab === "campaigns" && (
          <div className={panel}>
            {!only && <p className="text-base font-semibold">Campaign calendar</p>}
            <p className="text-xs text-neutral-500">Plan 2–3 weeks ahead. Festivals marked &ldquo;date varies&rdquo; follow the lunar calendar.</p>
            <ul className="mt-4 divide-y divide-neutral-100">
              {campaigns.map((c) => (
                <li key={c.name} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3.5">
                  <span className="w-16 shrink-0 text-center">
                    <span className="block text-[11px] uppercase tracking-wide text-neutral-400">{new Date(c.year, c.month, 1).toLocaleDateString("en-IN", { month: "short" })}</span>
                    <span className="block text-lg font-semibold tabular-nums">{c.date ? c.date.getDate() : "—"}</span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">{c.name}</span>
                    <span className="block text-xs text-neutral-500">{c.tip}</span>
                  </span>
                  {c.inDays !== null && <span className="text-xs tabular-nums text-neutral-500">{c.inDays === 0 ? "today" : c.inDays === 1 ? "tomorrow" : `in ${c.inDays} days`}</span>}
                  <button type="button" onClick={() => onAsk(`Plan a ${c.name.replace(/\s*\(.*\)/, "")} campaign for my shop: which products to feature, a coupon, and a WhatsApp message.`)} style={{ minHeight: 0 }} className="rounded-full border border-black/[0.08] px-3 py-1.5 text-xs font-semibold hover:border-neutral-900">
                    Plan it
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* DESIGN */}
        {tab === "design" && (
          <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
            <div className={panel}>
              <p className="text-base font-semibold">Make your shop look like a brand</p>
              <div className="mt-4 space-y-4">
                {DESIGN_TIPS.map((d, i) => (
                  <div key={d.t} className="flex gap-3">
                    <span className="w-5 shrink-0 text-sm font-semibold tabular-nums text-neutral-300">{i + 1}</span>
                    <span>
                      <span className="block text-sm font-semibold">{d.t}</span>
                      <span className="block text-sm text-neutral-500">{d.d}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <button type="button" onClick={() => onNavigate("themes")} className={`${panel} group flex items-center justify-between text-left`}>
                <span>
                  <span className="block text-sm font-semibold">Browse themes</span>
                  <span className="block text-xs text-neutral-500">Every theme is free to use</span>
                </span>
                <ArrowRight className="h-4 w-4 text-neutral-300 group-hover:text-neutral-900" />
              </button>
              <button type="button" onClick={() => onAsk("Look at my products and categories and give me 3 specific ideas to make my shop's homepage look better.")} className={`${panel} group flex items-center justify-between text-left`}>
                <span>
                  <span className="block text-sm font-semibold">Ideas for my shop</span>
                  <span className="block text-xs text-neutral-500">The assistant looks at your shop</span>
                </span>
                <Sparkles className="h-4 w-4 text-neutral-300 group-hover:text-neutral-900" />
              </button>
              <button type="button" onClick={() => onNavigate("settings")} className={`${panel} group flex items-center justify-between text-left`}>
                <span>
                  <span className="block text-sm font-semibold">Logo and shop details</span>
                  <span className="block text-xs text-neutral-500">Settings → General</span>
                </span>
                <ArrowRight className="h-4 w-4 text-neutral-300 group-hover:text-neutral-900" />
              </button>
            </div>
          </div>
        )}

        {/* TEMPLATES + CREATIVE LAB */}
        {tab === "templates" && (
          <div className="grid gap-4 lg:grid-cols-2">
            <div className={panel}>
              <p className="text-base font-semibold">Ready-to-send templates</p>
              <p className="text-xs text-neutral-500">Already filled in with your shop name and link</p>
              <div className="mt-4 inline-flex rounded-full bg-neutral-100 p-1 text-xs">
                {(Object.keys(tpl) as (keyof typeof tpl)[]).map((k) => (
                  <button key={k} type="button" onClick={() => setTplTab(k)} style={{ minHeight: 0 }} className={`h-7 rounded-full px-3 font-medium ${tplTab === k ? "bg-white text-neutral-950 shadow-sm" : "text-neutral-500"}`}>
                    {k}
                  </button>
                ))}
              </div>
              <div className="mt-3 space-y-2.5">
                {tpl[tplTab].map((t) => {
                  const key = `${tplTab}-${t.title}`;
                  return (
                    <div key={key} className="rounded-2xl bg-neutral-50 p-3.5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold">{t.title}</p>
                        <button type="button" onClick={() => copy(key, t.text)} style={{ minHeight: 0 }} className="inline-flex h-7 items-center gap-1 rounded-full px-2.5 text-xs font-medium text-neutral-600 hover:bg-white hover:text-neutral-900">
                          {copied === key ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                          {copied === key ? "Copied" : "Copy"}
                        </button>
                      </div>
                      <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-[13px] leading-relaxed text-neutral-600">{t.text}</p>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className={panel}>
              <p className="flex items-center gap-2 text-base font-semibold">
                <Wand2 className="h-4 w-4" /> Creative lab
              </p>
              <p className="text-xs text-neutral-500">The assistant writes it for your shop. Tap a tool.</p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {CREATIVE.map((c) => (
                  <button key={c.title} type="button" onClick={() => onAsk(c.prompt)} className="group rounded-2xl border border-black/[0.06] p-3.5 text-left transition-colors hover:border-neutral-900">
                    <span className="flex items-center justify-between text-sm font-semibold">
                      {c.title}
                      <ArrowUpRight className="h-3.5 w-3.5 text-neutral-300 group-hover:text-neutral-900" />
                    </span>
                    <span className="mt-0.5 block text-xs text-neutral-500">{c.text}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* LEARN */}
        {tab === "learn" && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {LESSONS.map((l, i) => (
              <button key={l.title} type="button" onClick={() => setLesson(l)} className={`${panel} group flex flex-col text-left transition-all duration-300 hover:-translate-y-0.5`}>
                <span className="text-xs tabular-nums text-neutral-400">Lesson {i + 1} · {l.mins} min read</span>
                <span className="mt-2 text-base font-semibold">{l.title}</span>
                <span className="mt-1 line-clamp-2 text-sm text-neutral-500">{l.points[0]}</span>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold">
                  Read <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={!!lesson} onClose={() => setLesson(null)} title={lesson?.title} description={lesson ? `${lesson.mins} min read · Seller academy` : undefined}>
        {lesson && (
          <>
            <ol className="space-y-3">
              {lesson.points.map((pt, i) => (
                <li key={i} className="flex gap-3 text-sm text-neutral-700">
                  <span className="w-5 shrink-0 font-semibold tabular-nums text-neutral-300">{i + 1}</span>
                  {pt}
                </li>
              ))}
            </ol>
            {lesson.page && (
              <button type="button" onClick={() => { onNavigate(lesson.page!); setLesson(null); }} className="mt-5 inline-flex h-10 items-center rounded-xl bg-neutral-950 px-4 text-sm font-semibold text-white hover:bg-black">
                {lesson.pageLabel}
              </button>
            )}
          </>
        )}
      </Modal>
    </section>
  );
}
