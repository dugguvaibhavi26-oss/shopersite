"use client";

import * as React from "react";
import { ArrowRight, Check, Copy } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { FadeScroll } from "@/components/ui/fade-scroll";
import type { StoreData } from "@/lib/store-service";
import type { DashPage } from "@/lib/assistant/commands";
import { DISCOVER_DEFAULTS, type DiscoverId } from "@/lib/discover";
import { useDiscoverCards } from "@/lib/discover-client";

/**
 * Home → Discover: ideas to grow, each with something to do next. Seasonal ideas follow the Indian
 * selling calendar and change every month; templates are filled in with the shop's own name and link.
 */

/* ------------------------------ seasons ------------------------------ */

export interface Season {
  title: string;
  when: string;
  pitch: string;
  ideas: string[];
  prompt: string;
}

// month index 0–11
export const SEASONS: Season[] = [
  {
    title: "Sankranti, Pongal & Republic Day",
    when: "January",
    pitch: "Fresh-start shopping and festive gifting all month.",
    ideas: ["Bundle festive outfits with accessories", "A Republic Day sale on 26 Jan (e.g. 26% off one category)", "New Year new-arrivals post on Instagram", "Clear winter stock before February"],
    prompt: "Plan a Sankranti / Republic Day sale for my shop: which products to feature, a coupon, and a WhatsApp message.",
  },
  {
    title: "Valentine's & wedding gifting",
    when: "February",
    pitch: "Gifts for partners, and the wedding season is still on.",
    ideas: ["A 'Gifts under ₹999' collection", "Couple combos or gift wrapping as an add-on", "Valentine's week countdown posts (7–14 Feb)", "Free delivery above a small amount for gifting"],
    prompt: "Plan Valentine's week for my shop: a gift collection, a coupon idea and an Instagram caption.",
  },
  {
    title: "Holi & Women's Day",
    when: "March",
    pitch: "Colourful collections and celebrating women on 8 March.",
    ideas: ["A bright 'Holi edit' of colourful products", "Women's Day offer or a story about the women behind your shop", "Year-end (March) clearance for old stock", "White and pastel outfits for Holi parties"],
    prompt: "Plan a Holi and Women's Day promotion for my shop with a coupon and a WhatsApp message.",
  },
  {
    title: "Ugadi, Baisakhi & summer",
    when: "April",
    pitch: "New-year festivals in many states, and summer begins.",
    ideas: ["Summer essentials: light fabrics, cotton, pastels", "Ugadi / Gudi Padwa / Baisakhi festive picks", "Show breathable fabrics in your photos", "A 'Summer sale' banner on your homepage"],
    prompt: "Plan a summer collection launch for my shop: which products, a banner text and an Instagram caption.",
  },
  {
    title: "Mother's Day & summer holidays",
    when: "May",
    pitch: "Gifts for mothers (second Sunday) and vacation shopping.",
    ideas: ["A Mother's Day gift guide", "Vacation and travel-ready picks", "Offer gift notes at checkout (use order notes)", "Remind buyers 5 days before Mother's Day"],
    prompt: "Plan Mother's Day for my shop: a gift list from my products, a coupon and a WhatsApp reminder.",
  },
  {
    title: "Monsoon & back to school",
    when: "June",
    pitch: "Rainy-day styles and new-term shopping.",
    ideas: ["Monsoon-friendly products and quick-dry fabrics", "Back-to-school or office-wear edits", "A mid-year sale to clear summer stock", "Indoor, cosy product photos"],
    prompt: "Plan a monsoon sale for my shop: which products, a coupon and a WhatsApp message.",
  },
  {
    title: "Mid-year sale season",
    when: "July",
    pitch: "Big marketplaces run sales; buyers expect deals.",
    ideas: ["An end-of-season sale with a clear end date", "Free delivery for a weekend", "Bundle slow movers with best sellers", "Ask happy buyers for reviews"],
    prompt: "Plan an end-of-season sale for my shop with a coupon, an end date and a WhatsApp broadcast message.",
  },
  {
    title: "Raksha Bandhan & Independence Day",
    when: "August",
    pitch: "Gifting for siblings and patriotic, tricolour themes.",
    ideas: ["A Rakhi gift collection with delivery cut-off dates", "Gift hampers and combos", "Independence Day offer on 15 Aug", "Show 'order by' dates clearly for Rakhi delivery"],
    prompt: "Plan Raksha Bandhan for my shop: gift ideas from my products, an order-by date message and a coupon.",
  },
  {
    title: "Ganesh Chaturthi & Onam",
    when: "September",
    pitch: "Festive dressing and decor; the big festive season starts.",
    ideas: ["Traditional wear and festive decor", "Onam whites and gold for Kerala buyers", "Stock up before Navratri and Diwali", "Start teasing your Diwali collection"],
    prompt: "Plan my festive season (Ganesh Chaturthi to Diwali): what to stock, when to launch and a teaser message.",
  },
  {
    title: "Navratri, Dussehra & Diwali",
    when: "October",
    pitch: "The biggest shopping weeks of the year.",
    ideas: ["Nine-day Navratri colour-of-the-day posts", "A Diwali gift guide and festive combos", "Clear 'order by' dates for Diwali delivery", "A festive coupon for repeat buyers"],
    prompt: "Plan Navratri and Diwali for my shop: a gift guide, a festive coupon and a WhatsApp message.",
  },
  {
    title: "Wedding season & Black Friday",
    when: "November",
    pitch: "Weddings, sangeets and gifting, plus end-of-month deals.",
    ideas: ["A wedding-guest edit: outfits, jewellery, gifts", "Bridal and trousseau shopping lists", "A Black Friday weekend coupon", "Gift cards or combos for wedding gifting"],
    prompt: "Plan a wedding-season collection and a Black Friday offer for my shop with a WhatsApp message.",
  },
  {
    title: "Christmas & New Year",
    when: "December",
    pitch: "Party wear, gifting and year-end sales.",
    ideas: ["Party and New Year's Eve looks", "Secret Santa gifts under ₹500 / ₹999", "A year-end sale for the last week", "Thank your customers with a 'year in review' post"],
    prompt: "Plan Christmas and a year-end sale for my shop: gifts, a coupon and an Instagram caption.",
  },
];

/* ------------------------------ templates ------------------------------ */

export const templates = (shop: string, link: string) => ({
  WhatsApp: [
    { title: "New arrivals", text: `✨ New arrivals at ${shop}!\n\nFresh styles just dropped. Have a look before they sell out 👇\n${link}\n\nReply here if you'd like help choosing 😊` },
    { title: "Festive offer", text: `🎉 Festive offer at ${shop}\n\nGet 10% off with code FESTIVE10 (this week only).\nShop now: ${link}` },
    { title: "Back in stock", text: `Good news! 🙌 Your favourites are back in stock at ${shop}.\n\nLimited pieces, grab yours: ${link}` },
    { title: "Thank you + review", text: `Hi! Thank you for shopping with ${shop} 💛\n\nWe'd love to hear how you liked your order. You can leave a quick review from your order page.\n\nSee what's new: ${link}` },
  ],
  Instagram: [
    { title: "Launch caption", text: `New drop 🛍️\nMade for everyday moments. Tap the link in bio to shop ${shop}.\n\n#newarrivals #shoplocal #supportsmallbusiness #madeinindia` },
    { title: "Sale caption", text: `SALE is live ⏳\nYour favourites, now at special prices. Only till Sunday!\nShop via link in bio → ${link}\n\n#sale #onlineshopping #india` },
    { title: "Behind the scenes", text: `From our hands to yours 🤍\nEvery order at ${shop} is packed with care. Thank you for supporting a small business!\n\n#smallbusiness #packingorders #behindthescenes` },
  ],
  "Status & stories": [
    { title: "Countdown", text: `⏰ 24 hours left!\nOur offer ends tomorrow. Shop now: ${link}` },
    { title: "Poll idea", text: `Which one should we restock first? 🤔\nA or B? Reply to vote!\n(Shop: ${link})` },
  ],
});

/* ------------------------------ tips & news ------------------------------ */

export const PHOTO_TIPS = [
  { t: "Use daylight", d: "Shoot near a window in the morning or late afternoon. Avoid harsh direct sun and yellow room lights." },
  { t: "Plain background", d: "A white wall, bedsheet or chart paper makes your product stand out and keeps your shop looking consistent." },
  { t: "Square photos", d: "Square (1:1) photos look neat in product grids. Keep the product in the centre with some space around it." },
  { t: "Show 3–5 angles", d: "Front, back, close-up of the fabric or detail, and one photo of it being used or worn." },
  { t: "Show the size", d: "Include a photo in hand or on a person so buyers understand the real size." },
  { t: "Clean the lens", d: "Wipe your phone camera before shooting. Tap the product on screen to focus." },
  { t: "Keep colours true", d: "Don't use heavy filters. Buyers return products that look different from the photo." },
  { t: "Same style for all", d: "Use the same background and light for every product so your shop looks like a brand." },
];

export const DESIGN_TIPS = [
  { t: "One strong banner", d: "Use your best product photo with a short line, e.g. 'Festive edit is here'. Change it every season." },
  { t: "3–6 categories", d: "Fewer, clear categories (Sarees, Kurtis, Jewellery) are easier to browse than many small ones." },
  { t: "Logo and colours", d: "Add your logo and pick one brand colour. Keep everything else black and white for a clean look." },
  { t: "Announcement bar", d: "Use it for one message: free delivery, an offer, or a delivery cut-off date." },
];

export const WHATS_NEW = [
  { t: "AI assistant", d: "Ask questions about your shop, write descriptions, create coupons and update orders. Every change is confirmed by you first.", page: null },
  { t: "Shiprocket shipping", d: "Compare courier prices and book pickups right from an order.", page: "plugins" as DashPage },
  { t: "Invoices (Pro)", d: "A GST invoice for every order, downloadable by you and your buyer.", page: "orders" as DashPage },
  { t: "Unfinished checkouts", d: "See buyers who didn't finish and bring them back with one WhatsApp tap.", page: "orders" as DashPage },
  { t: "Custom domain (Pro)", d: "Use your own www.yourbrand.com for your shop.", page: "settings" as DashPage },
  { t: "One-tap WhatsApp updates", d: "Send ready-made order updates to buyers from each order.", page: "orders" as DashPage },
];

/* ------------------------------ art ------------------------------ */

function Art({ kind }: { kind: "design" | "new" | "templates" | "photo" }) {
  const stroke = "#171717";
  if (kind === "design")
    return (
      <svg viewBox="0 0 200 110" className="h-full w-full" aria-hidden>
        <rect x="40" y="18" width="120" height="78" rx="8" fill="#fff" stroke={stroke} strokeWidth="1.5" />
        <rect x="48" y="26" width="104" height="26" rx="4" fill="#171717" />
        <rect x="48" y="58" width="32" height="30" rx="3" fill="#e5e5e5" />
        <rect x="84" y="58" width="32" height="30" rx="3" fill="#e5e5e5" />
        <rect x="120" y="58" width="32" height="30" rx="3" fill="#e5e5e5" />
        <rect x="56" y="34" width="40" height="4" rx="2" fill="#fff" />
        <rect x="56" y="42" width="24" height="4" rx="2" fill="#fff" opacity=".5" />
      </svg>
    );
  if (kind === "new")
    return (
      <svg viewBox="0 0 200 110" className="h-full w-full" aria-hidden>
        <path d="M100 22 L106 48 L132 55 L106 62 L100 88 L94 62 L68 55 L94 48 Z" fill="#171717" />
        <path d="M150 24 L153 34 L163 37 L153 40 L150 50 L147 40 L137 37 L147 34 Z" fill="#171717" opacity=".5" />
        <path d="M52 66 L54 73 L61 75 L54 77 L52 84 L50 77 L43 75 L50 73 Z" fill="#171717" opacity=".35" />
      </svg>
    );
  if (kind === "templates")
    return (
      <svg viewBox="0 0 200 110" className="h-full w-full" aria-hidden>
        <rect x="44" y="20" width="84" height="30" rx="12" fill="#fff" stroke={stroke} strokeWidth="1.5" />
        <rect x="54" y="30" width="50" height="4" rx="2" fill="#171717" />
        <rect x="54" y="38" width="32" height="4" rx="2" fill="#a3a3a3" />
        <rect x="76" y="58" width="84" height="32" rx="12" fill="#171717" />
        <rect x="88" y="68" width="56" height="4" rx="2" fill="#fff" />
        <rect x="88" y="76" width="36" height="4" rx="2" fill="#fff" opacity=".5" />
      </svg>
    );
  return (
    <svg viewBox="0 0 200 110" className="h-full w-full" aria-hidden>
      <rect x="58" y="22" width="84" height="66" rx="10" fill="#fff" stroke={stroke} strokeWidth="1.5" />
      <path d="M86 22 v66 M114 22 v66 M58 44 h84 M58 66 h84" stroke="#d4d4d4" strokeWidth="1" />
      <circle cx="100" cy="55" r="14" fill="#171717" />
      <circle cx="100" cy="55" r="6" fill="#fff" />
    </svg>
  );
}

/* ------------------------------ component ------------------------------ */

type Open = null | "season" | "design" | "new" | "templates" | "photo";

export function HomeDiscover({
  store,
  storeLink,
  onNavigate,
  onAsk,
  layout = "grid",
}: {
  store: StoreData;
  storeLink: string;
  onNavigate: (page: DashPage) => void;
  onAsk: (text: string) => void;
  /** grid: bento tiles; row: one swipeable row of equal cards */
  layout?: "grid" | "row";
}) {
  const row = layout === "row";
  const [open, setOpen] = React.useState<Open>(null);
  const month = new Date().getMonth();
  const season = SEASONS[month];
  const next = SEASONS[(month + 1) % 12];
  const daysLeft = new Date(new Date().getFullYear(), month + 1, 0).getDate() - new Date().getDate();
  const tpl = React.useMemo(() => templates(store.name, storeLink), [store.name, storeLink]);
  const [tab, setTab] = React.useState<keyof ReturnType<typeof templates>>("WhatsApp");
  const [copied, setCopied] = React.useState("");

  const copy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(""), 1500);
    } catch {
      // clipboard blocked: nothing to do
    }
  };
  const close = () => setOpen(null);
  const ask = (text: string) => {
    close();
    onAsk(text);
  };

  const admin = useDiscoverCards();
  const TONES: Record<"design" | "templates" | "photo" | "new", { bg: string; art: "design" | "new" | "templates" | "photo" }> = {
    design: { bg: "bg-neutral-50", art: "design" },
    templates: { bg: "bg-neutral-50", art: "templates" },
    photo: { bg: "bg-neutral-50", art: "photo" },
    new: { bg: "bg-neutral-50", art: "new" },
  };
  // a card with a link opens it (a guide); otherwise the built-in tips
  const openCard = (id: Exclude<Open, null>) => {
    const link = admin[id as DiscoverId].link;
    if (!link) return setOpen(id);
    if (link.startsWith("/")) window.location.assign(link);
    else window.open(link, "_blank", "noopener,noreferrer");
  };
  const small = (["design", "templates", "photo", "new"] as const).filter((id) => admin[id].enabled);
  const sc = admin.season;
  const seasonTitle = sc.title || season.title;
  const seasonText = sc.text || season.pitch;

  return (
    <section className="space-y-3">
      {row ? (
        /* three landscape cards. They never get narrower than 300px (they scroll sideways
           instead), and the image keeps a fixed 16:9 shape, so uploaded pictures aren't squashed. */
        <FadeScroll className="grid snap-x snap-mandatory auto-cols-[minmax(300px,1fr)] grid-flow-col gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {(["season", ...small] as const).filter((id) => id !== "season" || sc.enabled).slice(0, 3).map((id) => {
            const c = admin[id];
            const isSeason = id === "season";
            const title = isSeason ? seasonTitle : c.title || DISCOVER_DEFAULTS[id].title;
            const text = isSeason ? seasonText : c.text || DISCOVER_DEFAULTS[id].text;
            return (
              <button
                key={id}
                type="button"
                onClick={() => openCard(id)}
                className="group flex snap-start flex-col overflow-hidden rounded-[22px] border border-black/[0.06] bg-white text-left transition-shadow duration-300 hover:shadow-[0_24px_48px_-30px_rgba(0,0,0,0.45)]"
              >
                <span className={`relative block aspect-[16/9] w-full overflow-hidden ${c.imageUrl ? "bg-neutral-100" : isSeason ? "bg-neutral-950" : "bg-neutral-50"}`}>
                  {c.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.imageUrl} alt="" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  ) : isSeason ? (
                    <svg viewBox="0 0 240 240" className="h-full w-full" aria-hidden>
                      <path d="M0 60 Q 60 110 120 60 T 240 70" fill="none" stroke="#ffffff22" strokeWidth="1" />
                      {Array.from({ length: 11 }, (_, i) => {
                        const x = 10 + i * 22;
                        const y = 66 + Math.sin(i * 0.9) * 16;
                        return <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 3.4 : 2.3} fill={i % 4 === 0 ? "#fcd34d" : "#fff"} opacity={i % 2 ? 0.55 : 0.95} />;
                      })}
                      <text x="20" y="200" fill="#fff" fontSize="22" fontWeight="600" fontFamily="inherit">{season.when}</text>
                    </svg>
                  ) : (
                    <span className="block h-full px-8 py-10 transition-transform duration-700 group-hover:scale-105">
                      <Art kind={TONES[id as keyof typeof TONES].art} />
                    </span>
                  )}
                  {isSeason && <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-neutral-900">{daysLeft} days left</span>}
                </span>
                <span className="flex flex-col justify-center px-4 py-3.5">
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-semibold">{title}</span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-neutral-300 transition-all group-hover:translate-x-0.5 group-hover:text-neutral-900" />
                  </span>
                  <span className="mt-0.5 line-clamp-1 text-xs text-neutral-500">{text}</span>
                </span>
              </button>
            );
          })}
        </FadeScroll>
      ) : (
      <div className="m-stagger grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {/* seasonal: the big one */}
        {sc.enabled && (
          <button
            type="button"
            onClick={() => openCard("season")}
            className={`group relative flex flex-col justify-between overflow-hidden rounded-[22px] p-5 text-left text-white transition-transform duration-300 hover:-translate-y-0.5 ${row ? "h-[250px] w-[300px] shrink-0 snap-start sm:w-[360px]" : `col-span-2 min-h-[260px] lg:p-6 ${small.length ? "lg:row-span-2" : ""}`} ${sc.imageUrl ? "bg-neutral-900" : "bg-neutral-950"}`}
          >
            {sc.imageUrl ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={sc.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
                <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
              </>
            ) : (
              <>
                <span aria-hidden className="absolute -bottom-24 -right-16 h-64 w-64 rounded-full bg-white/[0.06] blur-3xl" />
                {/* festive lights */}
                <svg viewBox="0 0 300 160" className="pointer-events-none absolute inset-x-0 top-0 h-40 w-full opacity-90" aria-hidden>
                  <path d="M0 20 Q75 60 150 24 T300 30" fill="none" stroke="#ffffff22" strokeWidth="1" />
                  {Array.from({ length: 13 }, (_, i) => {
                    const x = 10 + i * 23;
                    const y = 22 + Math.sin(i * 0.9) * 12 + 10;
                    return <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 3.2 : 2.2} fill={i % 4 === 0 ? "#fcd34d" : "#ffffff"} opacity={i % 2 ? 0.55 : 0.95} className="animate-pulse" style={{ animationDelay: `${i * 0.2}s`, animationDuration: "2.6s" }} />;
                  })}
                </svg>
              </>
            )}
            <span className="relative mt-12 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.16em] text-white/60">
              <span>Seasonal selling · {season.when}</span>
              <span className="rounded-full bg-white/15 px-2 py-0.5 normal-case tracking-normal text-white backdrop-blur">{daysLeft} days left</span>
            </span>
            <span className="relative">
              <span className="block text-xl font-semibold leading-tight tracking-tight sm:text-[26px]">{seasonTitle}</span>
              <span className="mt-1.5 block max-w-md text-sm text-white/70">{seasonText}</span>
              <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-sm font-semibold text-neutral-950">
                {sc.link ? sc.linkLabel || "Read guide" : "See ideas"} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
              {!sc.title && <span className="mt-3 block text-[11px] text-white/50">Coming up in {next.when}: {next.title}</span>}
            </span>
          </button>
        )}

        {small.map((id) => {
          const c = admin[id];
          const d = DISCOVER_DEFAULTS[id];
          const t = TONES[id];
          return (
            <button
              key={id}
              type="button"
              onClick={() => openCard(id)}
              className={`group flex flex-col overflow-hidden rounded-[22px] border border-black/[0.06] bg-white text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_44px_-28px_rgba(0,0,0,0.4)] ${row ? "h-[250px] w-[240px] shrink-0 snap-start" : ""}`}
            >
              <span className={`relative block h-28 overflow-hidden sm:h-32 ${c.imageUrl ? "bg-neutral-100" : `${t.bg} px-6 py-3`}`}>
                {c.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.imageUrl} alt="" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                ) : (
                  <span className="block h-full transition-transform duration-500 group-hover:scale-105">
                    <Art kind={t.art} />
                  </span>
                )}
              </span>
              <span className="flex flex-1 flex-col p-4">
                <span className="flex items-center justify-between gap-2 text-sm font-semibold">
                  {c.title || d.title}
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-500 transition-colors group-hover:bg-neutral-950 group-hover:text-white">
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </span>
                <span className="mt-0.5 block text-xs leading-relaxed text-neutral-500">{c.text || d.text}</span>
                {c.link && c.linkLabel && <span className="mt-2 text-xs font-semibold text-neutral-900">{c.linkLabel} →</span>}
              </span>
            </button>
          );
        })}
      </div>
      )}

      {/* seasonal ideas */}
      <Modal isOpen={open === "season"} onClose={close} title={season.title} description={`${season.when} · ${season.pitch}`}>
        <ul className="space-y-2.5">
          {season.ideas.map((i) => (
            <li key={i} className="flex gap-2.5 text-sm text-neutral-700">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-neutral-900" />
              {i}
            </li>
          ))}
        </ul>
        <div className="mt-5 flex flex-wrap gap-2">
          <button type="button" onClick={() => ask(season.prompt)} className="inline-flex h-10 items-center rounded-xl bg-neutral-950 px-4 text-sm font-semibold text-white hover:bg-black">
            Plan it with the assistant
          </button>
          <button type="button" onClick={() => { close(); onNavigate("discounts"); }} className="inline-flex h-10 items-center rounded-xl border border-neutral-200 px-4 text-sm font-semibold hover:border-neutral-900">
            Create a coupon
          </button>
        </div>
        <p className="mt-4 text-xs text-neutral-400">Next month: {next.title}. Start planning 2–3 weeks early.</p>
      </Modal>

      {/* design */}
      <Modal isOpen={open === "design"} onClose={close} title="Store design inspiration" description="Small changes that make a big difference.">
        <div className="space-y-3">
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
        <div className="mt-5 flex flex-wrap gap-2">
          <button type="button" onClick={() => { close(); onNavigate("themes"); }} className="inline-flex h-10 items-center rounded-xl bg-neutral-950 px-4 text-sm font-semibold text-white hover:bg-black">
            Browse themes
          </button>
          <button type="button" onClick={() => ask("Give me 3 specific ideas to make my shop's homepage look better, based on my products and categories.")} className="inline-flex h-10 items-center rounded-xl border border-neutral-200 px-4 text-sm font-semibold hover:border-neutral-900">
            Ideas for my shop
          </button>
        </div>
      </Modal>

      {/* templates */}
      <Modal isOpen={open === "templates"} onClose={close} title="Marketing templates" description="Already filled in with your shop name and link. Copy, tweak, send.">
        <div className="mb-3 inline-flex rounded-xl bg-neutral-100 p-1 text-sm">
          {(Object.keys(tpl) as (keyof typeof tpl)[]).map((k) => (
            <button key={k} type="button" onClick={() => setTab(k)} style={{ minHeight: 0 }} className={`h-8 rounded-lg px-3 font-medium transition-colors ${tab === k ? "bg-white text-neutral-950 shadow-sm" : "text-neutral-500 hover:text-neutral-900"}`}>
              {k}
            </button>
          ))}
        </div>
        <div className="max-h-[55vh] space-y-2.5 overflow-y-auto pr-1">
          {tpl[tab].map((t) => {
            const key = `${tab}-${t.title}`;
            return (
              <div key={key} className="rounded-xl border border-neutral-200 p-3.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold">{t.title}</p>
                  <button type="button" onClick={() => copy(key, t.text)} style={{ minHeight: 0 }} className="inline-flex h-7 items-center gap-1 rounded-lg px-2 text-xs font-medium text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900">
                    {copied === key ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied === key ? "Copied" : "Copy"}
                  </button>
                </div>
                <p className="mt-1.5 whitespace-pre-wrap text-[13px] leading-relaxed text-neutral-600">{t.text}</p>
              </div>
            );
          })}
        </div>
        <button type="button" onClick={() => ask("Write a WhatsApp message and an Instagram caption to promote my newest products.")} className="mt-4 text-sm font-semibold underline underline-offset-2">
          Write one for my products with the assistant
        </button>
      </Modal>

      {/* photos */}
      <Modal isOpen={open === "photo"} onClose={close} title="Product photo tips" description="All you need is your phone, a window and a plain wall.">
        <div className="grid gap-x-5 gap-y-3 sm:grid-cols-2">
          {PHOTO_TIPS.map((p) => (
            <div key={p.t}>
              <p className="text-sm font-semibold">{p.t}</p>
              <p className="text-[13px] text-neutral-500">{p.d}</p>
            </div>
          ))}
        </div>
        <button type="button" onClick={() => { close(); onNavigate("products"); }} className="mt-5 inline-flex h-10 items-center rounded-xl bg-neutral-950 px-4 text-sm font-semibold text-white hover:bg-black">
          Update product photos
        </button>
      </Modal>

      {/* what's new */}
      <Modal isOpen={open === "new"} onClose={close} title="New in Shopersite" description="Recently added to help you sell.">
        <div className="space-y-3.5">
          {WHATS_NEW.map((n) => (
            <div key={n.t} className="flex items-start justify-between gap-3">
              <span>
                <span className="block text-sm font-semibold">{n.t}</span>
                <span className="block text-[13px] text-neutral-500">{n.d}</span>
              </span>
              {n.page && (
                <button type="button" onClick={() => { close(); onNavigate(n.page!); }} style={{ minHeight: 0 }} className="shrink-0 rounded-full border border-neutral-200 px-2.5 py-1 text-xs font-semibold hover:border-neutral-900">
                  Open
                </button>
              )}
            </div>
          ))}
        </div>
      </Modal>
    </section>
  );
}
