"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { siteConfig } from "@/lib/config/site";
import { usePlatformSettings } from "@/lib/use-platform-settings";
import { PLATFORM_PLANS, planDiscountPercent, calculatePlanPrice, BILLING_CYCLES, type BillingCycle } from "@/lib/plans";
import { PLATFORM_THEMES } from "@/lib/themes";
import { cn } from "@/lib/utils";
import {
  StoreMockup,
  PaymentCard,
  OrderCard,
  SalesChart,
  UpiMockup,
  ChatMockup,
  OrdersMockup,
  unsplash,
} from "@/components/home/mockups";
import { Reveal, CountUp, AnimatedTitle, type TitleEffect } from "@/components/home/reveal";
import { PhotoCollage } from "@/components/home/photo-collage";
import { SiteFooter, SiteHeader } from "@/components/home/site-chrome";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Store,
  Megaphone,
  ShieldCheck,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Content                                                             */
/* ------------------------------------------------------------------ */

// Counters animate from `from` to `to` when they scroll into view
const STATS = [
  { from: 30, to: 0, suffix: "%", label: "Commission on your sales" },
  { from: 0, to: 60, suffix: "s", label: "To launch your store" },
  { from: 0, to: Object.keys(PLATFORM_THEMES).length, suffix: "+", label: "Designer themes" },
  { from: 999, to: 0, prefix: "₹", label: "To get started" },
];

const PLATFORM_TABS = [
  {
    key: "build",
    title: "Build your store",
    text: "Pick a theme, add products and go live on your own subdomain. No code, no designers, no waiting.",
    visual: "store",
  },
  {
    key: "paid",
    title: "Get paid directly",
    text: "Buyers pay with any UPI app, COD or your payment link. Money lands straight in your bank — we never hold it.",
    visual: "upi",
  },
  {
    key: "orders",
    title: "Manage every order",
    text: "Move orders from Placed to Delivered, verify payments and share tracking links in one dashboard.",
    visual: "orders",
  },
  {
    key: "grow",
    title: "Grow your sales",
    text: "Run banners and coupons, announce new drops and see what sells with built-in insights.",
    visual: "grow",
  },
] as const;

const STEPS = [
  { n: "01", title: "Claim your name", text: `Pick a shop name and get yourshop.${siteConfig.domain} instantly.` },
  { n: "02", title: "Add your products", text: "Upload photos, set prices and variants. Choose a theme that fits your brand." },
  { n: "03", title: "Start selling", text: "Share your link on Instagram and WhatsApp. Orders and payments start flowing in." },
];

const FAQS = [
  {
    q: `What is ${siteConfig.name} and how does it work?`,
    a: `${siteConfig.name} is a store builder for social sellers. You claim a subdomain, add products and pick a theme. Buyers browse your store and pay you directly via UPI, COD or your own payment link.`,
  },
  {
    q: "How much does it cost?",
    a: `You can start free with up to ${PLATFORM_PLANS.free.maxProducts} products. Every theme is free. Paid plans unlock more products, the website editor, custom domains and marketing tools. We never take a commission on your sales.`,
  },
  {
    q: "Do you hold or process my customers' money?",
    a: "No. Payments go directly from your buyer to your bank account or UPI ID. We only charge a flat subscription for paid plans.",
  },
  {
    q: "Can I use my own domain name?",
    a: "Yes. Custom domains are available on the Pro plan. Every plan includes a free subdomain.",
  },
  {
    q: "Do I need to be a designer or developer?",
    a: "Not at all. Every theme is ready to go. Just add your logo, colours and products — your store looks professional from day one.",
  },
];

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function HomePage() {
  const router = useRouter();
  const { user, signOut } = useAuth();

  const claimStore = (raw: string) => {
    const clean = raw.toLowerCase().replace(/[^a-z0-9]/g, "");
    router.push(clean ? `/register?subdomain=${clean}` : "/register");
  };

  return (
    <div className="home-sans flex flex-col min-h-screen overflow-x-clip bg-white text-neutral-950 font-[Inter,sans-serif]">
      <SiteHeader user={!!user} onSignOut={() => signOut()} />

      <main className="flex-1">
        <Hero onClaim={claimStore} />

        {/* The rest of the page is one sheet that slides up over the pinned hero */}
        <div className="relative z-10 bg-white rounded-t-[28px] sm:rounded-t-[44px] shadow-[0_-28px_60px_-18px_rgba(0,0,0,0.28),0_-2px_10px_-4px_rgba(0,0,0,0.08)]">
          <span aria-hidden className="block mx-auto pt-3 w-12">
            <span className="block h-1.5 rounded-full bg-neutral-200" />
          </span>
          <StorefrontStage />
          <StatsAndMarquee />
          <FeatureCards />
          <PlatformTabs />
          <ThemesCarousel />
          <HowItWorks />
          <Statement />
          <Pricing />
          <Faq />
          <FinalCta onClaim={claimStore} />
          <SiteFooter />
        </div>
      </main>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Hero                                                                */
/* ------------------------------------------------------------------ */

function ClaimForm({ onClaim, dark = false }: { onClaim: (v: string) => void; dark?: boolean }) {
  const [value, setValue] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onClaim(value);
      }}
      className={cn(
        "flex items-center gap-2 rounded-[20px] p-1.5 pl-5 w-full max-w-lg",
        dark
          ? "bg-white/10 border border-white/20 focus-within:border-white/60"
          : "bg-white border border-neutral-300 shadow-lg shadow-black/5 focus-within:border-black focus-within:shadow-xl focus-within:shadow-black/10",
        "transition-all duration-300"
      )}
    >
      <div className="flex items-center flex-1 min-w-0">
        <input
          type="text"
          aria-label="Shop name"
          placeholder="yourshop"
          value={value}
          onChange={(e) => setValue(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ""))}
          className={cn(
            "w-full min-w-0 bg-transparent text-base focus:outline-none !min-h-0",
            dark ? "text-white placeholder-white/50" : "text-black placeholder-neutral-400"
          )}
        />
        <span className={cn("hidden sm:inline text-sm shrink-0", dark ? "text-white/60" : "text-neutral-500")}>
          .{siteConfig.domain}
        </span>
      </div>
      <button
        type="submit"
        className={cn(
          "group/btn shrink-0 inline-flex items-center gap-1.5 rounded-[14px] px-5 py-3 text-sm font-semibold transition-all duration-300 active:scale-95",
          dark ? "bg-white text-black hover:bg-neutral-200" : "bg-black text-white hover:bg-neutral-800"
        )}
      >
        Start free
        <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
      </button>
    </form>
  );
}

/** Centres the hero card and tilts it in 3D toward the mouse (mouse devices only). */
function HeroStage({ children }: { children: React.ReactNode }) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    setTilt({ x: x * 10, y: -y * 8 });
  };
  return (
    <div
      onPointerMove={onMove}
      onPointerLeave={() => setTilt({ x: 0, y: 0 })}
      className="relative flex-1 flex items-center justify-center px-4 sm:px-8 py-6 [perspective:1400px]"
    >
      <div
        className="w-full flex justify-center [transform-style:preserve-3d] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{ transform: `rotateX(${tilt.y}deg) rotateY(${tilt.x}deg)` }}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * Keeps the hero pinned while the page sheet slides over it: as the sheet covers the hero,
 * the hero panel eases back (slightly smaller and darker) instead of moving away.
 */
function useHeroSink() {
  const sectionRef = React.useRef<HTMLElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const shadeRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const section = sectionRef.current;
    const panel = panelRef.current;
    const shade = shadeRef.current;
    if (!section || !panel || !shade) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      // 0 at the top of the page, 1 once the sheet has fully covered the hero
      const p = Math.min(1, Math.max(0, window.scrollY / Math.max(1, section.offsetHeight)));
      panel.style.transform = reduce.matches ? "" : `scale(${1 - p * 0.07})`;
      shade.style.opacity = String(p * 0.45);
      // Once fully covered, take the hero out of the picture so a late-painting sheet can never reveal it
      section.style.visibility = p >= 1 ? "hidden" : "";
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return { sectionRef, panelRef, shadeRef };
}

function Hero({ onClaim }: { onClaim: (v: string) => void }) {
  const { sectionRef, panelRef, shadeRef } = useHeroSink();
  return (
    // First screen (below the 68px header): an inset, rounded panel with the drifting
    // photo collage and a floating 3D text card in the middle. It stays pinned in place
    // while the rest of the page slides up over it.
    <section ref={sectionRef} className="hero-pinned sticky top-[68px] z-0 px-4 sm:px-6 lg:px-8 pt-2 pb-4 sm:pb-6 h-[calc(100svh-68px)] min-h-[600px]">
      <div
        ref={panelRef}
        className="relative h-full rounded-[28px] sm:rounded-[36px] overflow-hidden bg-neutral-100 flex flex-col origin-top will-change-transform"
      >
        {/* darkens as the page sheet covers the hero */}
        <div ref={shadeRef} aria-hidden className="pointer-events-none absolute inset-0 z-20 bg-black" style={{ opacity: 0 }} />
        {/* Drifting full-colour photo collage — wider columns on phones, more on larger screens */}
        <div aria-hidden className="absolute inset-0">
          <PhotoCollage columns={3} className="sm:hidden absolute -inset-x-[25%] -top-[30%] h-[160%] opacity-90" />
          <PhotoCollage columns={6} className="hidden sm:flex absolute -inset-x-[12%] -top-[40%] h-[180%] opacity-90" />
        </div>

        <HeroStage>
          <div className="animate-float-gentle relative w-full max-w-2xl [transform-style:preserve-3d]">
          {/* soft colour glow behind the card */}
          <div aria-hidden className="hero-ring absolute -inset-2 rounded-[44px] blur-2xl opacity-50" />
          {/* slowly rotating pastel border */}
          <div className="hero-ring relative rounded-[26px] sm:rounded-[38px] p-[2px] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.45),0_20px_40px_-20px_rgba(0,0,0,0.3)]">
          <div className="hero-rise w-full rounded-[24px] sm:rounded-[36px] bg-white px-5 py-8 sm:px-10 sm:py-11 flex flex-col items-center text-center">
          <a
            href="#pricing"
            className="hero-rise group/pill inline-flex items-center gap-2 rounded-[10px] border border-neutral-200 bg-white pl-1.5 pr-3 py-1 text-xs font-medium text-neutral-700 hover:border-neutral-400 transition-colors"
          >
            <span className="rounded-[7px] bg-black text-white px-2 py-0.5 text-[10px] font-semibold">NEW</span>
            Free plan with {PLATFORM_PLANS.free.maxProducts} products — no card needed
            <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover/pill:translate-x-0.5" />
          </a>

          <h1 style={{ animationDelay: "90ms" }} className="hero-rise mt-6 text-[2.15rem] leading-[1.08] sm:text-5xl lg:text-[3.6rem] font-medium !tracking-[-0.04em] mx-auto text-neutral-950 text-balance">
            Your shop, online
            <br />
            in{" "}
            <span className="relative inline-block whitespace-nowrap">
              60 seconds
              {/* hand-drawn underline that draws itself in */}
              <svg
                aria-hidden
                viewBox="0 0 300 20"
                preserveAspectRatio="none"
                className="absolute left-0 -bottom-[0.18em] w-full h-[0.32em] overflow-visible"
              >
                <path
                  d="M3 13 C 60 4, 120 3, 175 8 S 265 15, 297 6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="5"
                  strokeLinecap="round"
                  pathLength={1}
                  className="hero-underline"
                />
              </svg>
            </span>
            .
          </h1>

          <p style={{ animationDelay: "180ms" }} className="hero-rise mt-5 text-[15px] sm:text-[17px] text-neutral-500 max-w-sm mx-auto leading-relaxed text-balance">
            A beautiful store for your Instagram and WhatsApp buyers — paid straight to your UPI.
          </p>

          <div style={{ animationDelay: "270ms" }} className="hero-rise mt-8 w-full flex flex-col items-center gap-4">
            <ClaimForm onClaim={onClaim} />
            <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-[13px] text-neutral-500">
              {["Free plan", "0% commission", "Direct UPI"].map((t) => (
                <li key={t} className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-neutral-900" strokeWidth={2.5} />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          </div>
          </div>
          </div>
        </HeroStage>

      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Storefront preview — second screen                                  */
/* ------------------------------------------------------------------ */

function StorefrontStage() {
  return (
    <section id="storefront" className="scroll-mt-20 max-w-7xl mx-auto px-4 sm:px-6 py-24 sm:py-32">
      <SectionIntro
        center
        eyebrow="Your storefront"
        title="A store your buyers will love."
        effect="words-up"
        sub="track"
        text="Every store comes with a beautiful theme, fast checkout and order alerts — ready the moment you sign up."
      />

      <Reveal delay={120} variant="zoom" className="group/stage relative mt-16 sm:mt-20 mx-auto max-w-5xl">
        <div className="scroll-stage">
          <div className="absolute inset-x-0 -bottom-10 top-16 rounded-[28px] bg-neutral-100" aria-hidden />
          <div className="relative px-2 sm:px-10">
            <StoreMockup autoplay className="text-left transition-transform duration-700 ease-out group-hover/stage:-translate-y-2" />

            {/* smaller and tucked into the corners on phones */}
            <PaymentCard className="absolute -left-1 -top-12 scale-[0.62] origin-top-left md:scale-100 md:-left-6 lg:-left-16 md:top-24 text-left animate-float-gentle z-10" />
            <OrderCard className="absolute -right-1 -bottom-10 scale-[0.62] origin-bottom-right md:scale-100 md:-right-6 lg:-right-16 md:top-52 md:bottom-auto text-left animate-float-gentle [animation-delay:1.2s] z-10" />
          </div>
        </div>
      </Reveal>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Stats + marquee                                                     */
/* ------------------------------------------------------------------ */

function StatsAndMarquee() {
  const categories = Array.from(
    new Set(Object.values(PLATFORM_THEMES).map((t) => t.category).filter(Boolean))
  ) as string[];
  const loop = [...categories, ...categories];

  return (
    <section className="border-y border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-2 lg:grid-cols-4">
        {STATS.map((s, i) => (
          <Reveal
            key={s.label}
            delay={i * 110}
            variant="pop"
            spotlight
            className={cn(
              "group py-10 sm:py-14 text-center border-neutral-200 hot:bg-neutral-50",
              i % 2 === 0 && "border-r",
              i < 2 && "border-b lg:border-b-0",
              i === 1 && "lg:border-r"
            )}
          >
            <div className="text-4xl sm:text-6xl font-semibold tracking-tighter transition-transform duration-500 group-hot:scale-110">
              <CountUp from={s.from} to={s.to} prefix={s.prefix} suffix={s.suffix} />
            </div>
            <div className="mt-2 text-xs sm:text-sm text-neutral-500">{s.label}</div>
          </Reveal>
        ))}
      </div>

      <div className="border-t border-neutral-200 py-6 space-y-3 overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_10%,black_90%,transparent)]">
        {[false, true].map((reverse) => (
          <div
            key={String(reverse)}
            // inline so it beats the .animate-marquee shorthand
            style={reverse ? { animationDirection: "reverse", animationDuration: "55s" } : undefined}
            className="flex w-max animate-marquee gap-12 hover:[animation-play-state:paused]"
          >
            {loop.map((c, i) => (
              <span
                key={i}
                className={cn(
                  "text-lg sm:text-2xl font-bold tracking-tight whitespace-nowrap transition-colors duration-300 hover:text-black cursor-default",
                  reverse ? "text-transparent [-webkit-text-stroke:1px_#a3a3a3]" : "text-neutral-300"
                )}
              >
                {c}
              </span>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Feature cards (bento)                                               */
/* ------------------------------------------------------------------ */

function SectionIntro({
  eyebrow,
  title,
  text,
  dark = false,
  center = false,
  effect = "words-up",
  sub = "rise",
}: {
  eyebrow: string;
  /** "\n" breaks the line from the sm breakpoint up */
  title: string;
  text?: string;
  dark?: boolean;
  center?: boolean;
  /** How the heading animates in — each section uses a different one */
  effect?: TitleEffect;
  /** How the eyebrow and paragraph animate in */
  sub?: "rise" | "track" | "side";
}) {
  // The scroll-linked fill animates on its own, so it only needs a slide-in wrapper
  const wrapper = effect === "fill" ? "left" : "none";
  return (
    <Reveal variant={wrapper} className={cn("max-w-2xl mx-auto text-center", center && "")}>
      <span
        className={cn(
          "inline-block text-xs font-semibold uppercase tracking-[0.18em]",
          wrapper === "none" && `fx-sub fx-sub-${sub}`,
          dark ? "text-neutral-400" : "text-neutral-500"
        )}
      >
        {eyebrow}
      </span>
      <AnimatedTitle
        text={title}
        effect={effect}
        className={cn("mt-4 text-[2.25rem] sm:text-5xl font-semibold leading-[1.08]", dark ? "text-white" : "text-black")}
      />
      {text && (
        <p
          style={{ "--d": "450ms" } as React.CSSProperties}
          className={cn(
            "mt-5 text-base sm:text-lg leading-relaxed text-balance",
            wrapper === "none" && `fx-sub fx-sub-${sub}`,
            dark ? "text-neutral-400" : "text-neutral-600"
          )}
        >
          {text}
        </p>
      )}
    </Reveal>
  );
}

function FeatureCard({
  eyebrow,
  title,
  text,
  children,
  className,
  delay = 0,
  from = "left",
  index = 0,
}: {
  eyebrow: string;
  title: string;
  text: string;
  children: React.ReactNode;
  className?: string;
  delay?: number;
  from?: "left" | "right";
  index?: number;
}) {
  return (
    // On phones every card sticks a little lower than the last, so they pile up like a deck
    <div data-stack-card className="max-md:sticky" style={{ top: `calc(var(--stack-top, 88px) + ${index * 12}px)` }}>
      <Reveal delay={delay} variant={from} spotlight className={cn("group flex flex-col", className)}>
        <div
          data-stack-face
          className="origin-top flex flex-col max-md:rounded-[22px] max-md:bg-white max-md:border max-md:border-neutral-200 max-md:p-2.5 max-md:pb-5 max-md:shadow-[0_-12px_40px_-24px_rgba(0,0,0,0.35)] will-change-transform"
        >
          <div className="relative flex-1 min-h-[300px] sm:min-h-[340px] max-md:min-h-[240px] rounded-[17px] bg-neutral-100 overflow-hidden flex items-center justify-center p-6 pt-12 transition-all duration-500 group-hot:-translate-y-1.5 group-hot:bg-neutral-200/70 group-hot:shadow-[0_24px_50px_-20px_rgba(0,0,0,0.25)]">
            <span className="absolute top-5 left-5 text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
              {eyebrow}
            </span>
            <span className="md:hidden absolute top-4 right-4 text-[10px] font-semibold tabular-nums text-neutral-400">0{index + 1} / 04</span>
            <div className="transition-transform duration-700 ease-out group-hot:scale-[1.05] group-hot:-rotate-1">{children}</div>
          </div>
          <h3 className="mt-5 max-md:mt-4 max-md:px-2 text-xl font-bold flex items-center gap-2">
            {title}
            <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 transition-all duration-300 group-hot:opacity-100 group-hot:translate-x-0" />
          </h3>
          <p className="mt-1.5 max-md:px-2 text-neutral-600 leading-relaxed">{text}</p>
        </div>
      </Reveal>
    </div>
  );
}

/** Phones: as each stacked card is covered by the next, shrink and dim it slightly. */
function useCardStack(ref: React.RefObject<HTMLElement | null>) {
  React.useEffect(() => {
    const root = ref.current;
    if (!root || typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 767px)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;

    const update = () => {
      frame = 0;
      const cards = Array.from(root.querySelectorAll<HTMLElement>("[data-stack-card]"));
      const faces = cards.map((c) => c.querySelector<HTMLElement>("[data-stack-face]"));
      cards.forEach((card, i) => {
        const face = faces[i];
        if (!face) return;
        const next = cards[i + 1];
        if (!mq.matches || reduce.matches || !next) {
          face.style.transform = "";
          face.style.filter = "";
          return;
        }
        const a = card.getBoundingClientRect();
        const b = next.getBoundingClientRect();
        // 0 while the next card is a full card-height away, 1 once it has slid over this one
        const p = Math.min(1, Math.max(0, 1 - (b.top - a.top) / a.height));
        face.style.transform = `scale(${1 - p * 0.07})`;
        face.style.filter = `brightness(${1 - p * 0.12})`;
      });
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    mq.addEventListener("change", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      mq.removeEventListener("change", onScroll);
    };
  }, [ref]);
}

function FeatureCards() {
  const themeImages = Object.values(PLATFORM_THEMES)
    .map((t) => t.previewImage)
    .filter(Boolean)
    .slice(0, 5) as string[];
  const stackRef = React.useRef<HTMLDivElement>(null);
  const headingRef = React.useRef<HTMLDivElement>(null);
  useCardStack(stackRef);

  // Cards pin just below the pinned heading, whatever height it wraps to
  React.useEffect(() => {
    const heading = headingRef.current;
    const stack = stackRef.current;
    if (!heading || !stack || typeof ResizeObserver === "undefined") return;
    const sync = () => stack.style.setProperty("--stack-top", `${64 + heading.offsetHeight + 8}px`);
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(heading);
    return () => ro.disconnect();
  }, []);

  // Phones: once the stack stops being pinned, the heading scrolls away together with it,
  // as if the whole block were ordinary content
  React.useEffect(() => {
    const heading = headingRef.current;
    const stack = stackRef.current;
    if (!heading || !stack || typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 767px)");
    let shift = 0;
    const update = () => {
      const first = stack.querySelector<HTMLElement>("[data-stack-card]");
      if (!mq.matches || !first) {
        shift = 0;
        heading.style.transform = "";
        return;
      }
      // The heading sits 8px above the first card while the stack is pinned. When the stack
      // starts scrolling away, keep that same gap so the heading leaves with it.
      const naturalTop = heading.getBoundingClientRect().top - shift;
      const anchoredTop = first.getBoundingClientRect().top - 8 - heading.offsetHeight;
      shift = Math.min(0, anchoredTop - naturalTop);
      heading.style.transform = shift ? `translateY(${shift}px)` : "";
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 py-24 sm:py-32">
      <div>
      {/* On phones the heading stays pinned under the menu bar while the cards stack beneath it */}
      <div ref={headingRef} className="max-md:sticky max-md:top-[64px] max-md:z-20 max-md:-mx-4 max-md:px-4 max-md:pt-4 max-md:pb-3 max-md:bg-white">
        <SectionIntro eyebrow="Everything you need" title="Sell more with less effort." effect="fill" />
      </div>
      <Reveal className="max-w-2xl mx-auto text-center">
        <p className="mt-5 max-md:mt-1 text-base sm:text-lg leading-relaxed text-balance text-neutral-600">
          One platform for your store, payments, orders and marketing. Built for sellers who grew on social.
        </p>
      </Reveal>

      <div ref={stackRef} className="mt-14 max-md:mt-8 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-14 max-md:gap-y-5 max-md:pb-6">
        <FeatureCard
          index={0}
          eyebrow="Customizable themes"
          title="Create a stunning store in seconds"
          text="Designer themes for fashion, beauty, tech, home and more. Switch anytime — your products come with you."
        >
          <div className="flex -space-x-10 sm:-space-x-12">
            {themeImages.map((src, i) => (
              <img
                key={src}
                src={src}
                alt=""
                loading="lazy"
                className="w-24 h-36 sm:w-32 sm:h-48 object-cover rounded-[8px] border-4 border-white shadow-lg transition-transform duration-700 ease-out [transform:rotate(var(--r))_translateY(var(--y))] group-hot:[transform:rotate(var(--r2))_translateY(var(--y2))]"
                style={
                  {
                    "--r": `${(i - 2) * 5}deg`,
                    "--y": `${Math.abs(i - 2) * 10}px`,
                    "--r2": `${(i - 2) * 9}deg`,
                    "--y2": `${Math.abs(i - 2) * 18 - 6}px`,
                  } as React.CSSProperties
                }
              />
            ))}
          </div>
        </FeatureCard>

        <FeatureCard
          index={1}
          eyebrow="Direct payments"
          title="Keep 100% of every sale"
          delay={120}
          from="right"
          text="Buyers pay with GPay, PhonePe, Paytm or COD. Money goes straight to your bank — we never touch it."
        >
          <UpiMockup />
        </FeatureCard>

        <FeatureCard
          index={2}
          eyebrow="Social selling"
          title="Sell where your buyers already are"
          text="Share products on Instagram and WhatsApp. Buyers check out on your store and get order updates instantly."
        >
          <ChatMockup />
        </FeatureCard>

        <FeatureCard
          index={3}
          eyebrow="Insights"
          title="Know what's working"
          delay={120}
          from="right"
          text="See sales, top products and order status at a glance so you can restock and grow with confidence."
        >
          <SalesChart className="w-72" />
        </FeatureCard>
      </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Platform tabs (dark)                                                */
/* ------------------------------------------------------------------ */

function PlatformTabs() {
  const [active, setActive] = useState(0);
  const [inView, setInView] = useState(false);
  const sectionRef = React.useRef<HTMLElement>(null);
  const tab = PLATFORM_TABS[active];

  // Only auto-advance while the section is on screen
  React.useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section ref={sectionRef} id="platform" className="bg-black text-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-24 sm:py-32">
        <SectionIntro
          dark
          eyebrow="The platform"
          title={"See your whole business\nclick into place."}
          effect="words-blur"
          sub="track"
        />

        <Reveal variant="zoom" className="mt-14 grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-10 lg:gap-16 items-center">
          <div role="tablist" aria-label="Platform features" className="divide-y divide-white/10 border-y border-white/10">
            {PLATFORM_TABS.map((t, i) => {
              const isActive = i === active;
              return (
                <button
                  key={t.key}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActive(i)}
                  className="relative w-full text-left py-6 group"
                >
                  {isActive && (
                    <span
                      key={active}
                      aria-hidden
                      onAnimationEnd={() => setActive((a) => (a + 1) % PLATFORM_TABS.length)}
                      style={{ animationPlayState: inView ? "running" : "paused" }}
                      className="animate-tab-progress absolute left-0 -bottom-px h-[2px] w-full bg-white"
                    />
                  )}
                  <div className="flex items-center justify-between gap-4">
                    <span
                      className={cn(
                        "inline-block text-xl sm:text-2xl font-bold tracking-tight transition-all duration-300",
                        isActive ? "text-white" : "text-neutral-500 group-hover:text-neutral-300 group-hover:translate-x-1.5"
                      )}
                    >
                      {t.title}
                    </span>
                    <ArrowUpRight
                      className={cn("w-5 h-5 transition-all", isActive ? "opacity-100 rotate-45" : "opacity-0 group-hover:opacity-60")}
                    />
                  </div>
                  <div
                    className={cn(
                      "grid transition-all duration-300",
                      isActive ? "grid-rows-[1fr] opacity-100 mt-3" : "grid-rows-[0fr] opacity-0"
                    )}
                  >
                    <p className="overflow-hidden text-neutral-400 leading-relaxed max-w-md">{t.text}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="scroll-stage relative rounded-[17px] bg-neutral-900 border border-white/10 min-h-[380px] sm:min-h-[460px] flex items-center justify-center p-6 sm:p-10 overflow-hidden">
            <div key={tab.key} className="w-full flex justify-center animate-card-3d">
              {tab.visual === "store" && <StoreMockup className="w-full max-w-lg text-black" />}
              {tab.visual === "upi" && (
                <div className="flex flex-col sm:flex-row items-center gap-6 text-black">
                  <UpiMockup />
                  <PaymentCard />
                </div>
              )}
              {tab.visual === "orders" && <OrdersMockup className="max-w-lg text-black" />}
              {tab.visual === "grow" && (
                <div className="w-full max-w-md space-y-4">
                  <SalesChart dark className="border border-white/10" />
                  <div className="rounded-[11px] bg-white text-black p-5 flex items-center justify-between">
                    <div>
                      <div className="text-[11px] text-neutral-500">Coupon · DIWALI20</div>
                      <div className="text-lg font-bold tracking-tight">128 orders redeemed</div>
                    </div>
                    <Megaphone className="w-6 h-6" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Themes carousel                                                     */
/* ------------------------------------------------------------------ */

function ThemesCarousel() {
  const themes = Object.values(PLATFORM_THEMES);
  const n = themes.length;
  // Three copies so there is always a card on both sides; the index stays in the middle copy
  const slides = [...themes, ...themes, ...themes];
  const [index, setIndex] = React.useState(n);
  const [animate, setAnimate] = React.useState(true);
  const [hovered, setHovered] = React.useState(false);
  const [inView, setInView] = React.useState(false);
  const viewport = React.useRef<HTMLDivElement>(null);
  const touchX = React.useRef<number | null>(null);

  const go = (next: number) => {
    setAnimate(true);
    setIndex(Math.max(0, Math.min(slides.length - 1, next)));
  };

  // Once a slide lands outside the middle copy, jump back to the matching card without animating
  React.useEffect(() => {
    if (index >= n && index < 2 * n) return;
    const t = setTimeout(() => {
      setAnimate(false);
      setIndex(((((index - n) % n) + n) % n) + n);
    }, 750);
    return () => clearTimeout(t);
  }, [index, n]);
  React.useEffect(() => {
    if (animate) return;
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setAnimate(true));
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, [animate]);

  React.useEffect(() => {
    const el = viewport.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  React.useEffect(() => {
    if (hovered || !inView || n < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(() => {
      if (document.hidden) return;
      setAnimate(true);
      setIndex((i) => (i + 1 >= 3 * n ? i : i + 1));
    }, 1500);
    return () => clearInterval(timer);
  }, [hovered, inView, n]);

  const ease = "ease-[cubic-bezier(0.22,1,0.36,1)]";
  const current = ((index % n) + n) % n;

  return (
    <section id="themes" className="py-24 sm:py-32 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col items-center gap-6">
        <SectionIntro
          eyebrow="Themes"
          title="Designed to sell."
          effect="words-up"
          sub="rise"
          text="Start with Lume Editorial for free. Upgrade to unlock our full collection of designer themes."
        />
        <div className="flex gap-2 shrink-0">
          <button
            type="button"
            aria-label="Previous theme"
            onClick={() => go(index - 1)}
            className="w-12 h-12 rounded-full border border-neutral-300 flex items-center justify-center hover:bg-black hover:text-white hover:border-black hover:scale-105 active:scale-95 transition-all duration-300"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            aria-label="Next theme"
            onClick={() => go(index + 1)}
            className="w-12 h-12 rounded-full border border-neutral-300 flex items-center justify-center hover:bg-black hover:text-white hover:border-black hover:scale-105 active:scale-95 transition-all duration-300"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div
        ref={viewport}
        className="mt-10 pb-8 [--w:68vw] [--g:10px] sm:[--w:320px] sm:[--g:20px] lg:[--w:340px]"
        onPointerEnter={(e) => e.pointerType === "mouse" && setHovered(true)}
        onPointerLeave={(e) => e.pointerType === "mouse" && setHovered(false)}
        onTouchStart={(e) => {
          touchX.current = e.touches[0].clientX;
        }}
        onTouchEnd={(e) => {
          if (touchX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          touchX.current = null;
          if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
        }}
      >
        <div
          className={`flex w-max ${animate ? `transition-transform duration-700 ${ease}` : ""}`}
          style={{
            marginLeft: "50%",
            gap: "var(--g)",
            transform: `translateX(calc(var(--w) * -0.5 - ${index} * (var(--w) + var(--g))))`,
          }}
        >
          {slides.map((theme, i) => {
            const active = i === index;
            const near = Math.abs(i - index) <= 1;
            return (
              <Link
                key={i}
                href={`/themes?theme=${theme.slug}`}
                tabIndex={active ? 0 : -1}
                aria-hidden={!active}
                onClick={(e) => {
                  if (!active) {
                    e.preventDefault();
                    go(i);
                  }
                }}
                className={`group block shrink-0 py-2 ${animate ? `transition-[transform,opacity] duration-700 ${ease}` : ""} ${
                  active ? "scale-100 opacity-100" : near ? "scale-[0.9] opacity-60" : "scale-[0.9] opacity-30"
                }`}
                style={{ width: "var(--w)" }}
              >
                <div
                  className={`relative aspect-[4/5] rounded-[17px] overflow-hidden bg-neutral-100 transition-shadow duration-700 ${
                    active ? "shadow-[0_30px_60px_-30px_rgba(0,0,0,0.45)]" : ""
                  }`}
                >
                  {theme.previewImage && (
                    <img
                      src={theme.previewImage}
                      alt={`${theme.name} theme preview`}
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/0" />
                  <span className="absolute top-4 left-4 rounded-[7px] bg-white text-black text-[10px] font-bold uppercase tracking-wider px-2.5 py-1">
                    {theme.tier === "free" ? "Free" : theme.tier === "starter" ? "Growth" : "Pro"}
                  </span>
                  <div className="absolute bottom-0 inset-x-0 p-5 text-white flex items-end justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[11px] uppercase tracking-[0.14em] text-white/70">{theme.category}</div>
                      <div className="text-xl font-bold tracking-tight truncate">{theme.name}</div>
                    </div>
                    <span className="w-10 h-10 shrink-0 rounded-full bg-white text-black flex items-center justify-center transition-transform duration-300 group-hover:rotate-45 group-hover:scale-110">
                      <ArrowUpRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="flex justify-center gap-1.5">
        {themes.map((theme, k) => (
          <button
            key={theme.slug}
            type="button"
            aria-label={`Show ${theme.name}`}
            onClick={() => go(index - current + k)}
            style={{ minHeight: 0 }}
            className={`h-1.5 rounded-full transition-all duration-500 ${current === k ? "w-6 bg-black" : "w-1.5 bg-neutral-300 hover:bg-neutral-400"}`}
          />
        ))}
      </div>

      <div className="mt-10 flex justify-center">
        <Link
          href="/themes"
          className="group inline-flex items-center gap-2 rounded-full border border-neutral-300 px-6 py-3 text-sm font-semibold transition-colors duration-300 hover:border-black hover:bg-black hover:text-white"
        >
          Browse all {n} themes
          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
        </Link>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* How it works                                                        */
/* ------------------------------------------------------------------ */

function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-neutral-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-24 sm:py-32">
        <SectionIntro eyebrow="How it works" title="Three steps to your first sale." effect="words-blur" />
        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-5">
          {STEPS.map((s, i) => (
            <Reveal
              key={s.n}
              delay={i * 120}
              variant="flip"
              spotlight
              className="group relative overflow-hidden rounded-[17px] bg-white p-8 sm:p-10 flex flex-col min-h-[280px] cursor-default hot:-translate-y-2 hot:shadow-[0_30px_60px_-25px_rgba(0,0,0,0.5)]"
            >
              {/* black fill that wipes up from the bottom */}
              <span
                aria-hidden
                className="absolute inset-0 bg-black origin-bottom scale-y-0 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hot:scale-y-100"
              />
              <span
                aria-hidden
                className="absolute top-8 right-8 w-11 h-11 rounded-full bg-white text-black flex items-center justify-center opacity-0 -rotate-90 scale-50 transition-all duration-500 group-hot:opacity-100 group-hot:rotate-0 group-hot:scale-100"
              >
                <ArrowUpRight className="w-5 h-5" />
              </span>
              <span className="relative text-6xl font-semibold tracking-tighter text-neutral-200 transition-all duration-500 group-hot:text-neutral-700 group-hot:translate-x-2">{s.n}</span>
              <h3 className="relative mt-auto pt-10 text-2xl font-bold transition-colors duration-300 group-hot:text-white">{s.title}</h3>
              <p className="relative mt-2 text-neutral-600 leading-relaxed transition-colors duration-500 group-hot:text-neutral-400">{s.text}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Statement                                                           */
/* ------------------------------------------------------------------ */

function Statement() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-24 sm:py-32">
      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-10 lg:gap-16 items-center">
        <Reveal variant="left">
          <ShieldCheck className="w-10 h-10" />
          <blockquote className="scroll-text-fill mt-6 text-3xl sm:text-5xl font-bold tracking-tight leading-[1.15]">
            &ldquo;Your money goes straight from your buyer to your bank. We never hold it, pool it or take a cut.&rdquo;
          </blockquote>
          <p className="mt-6 text-neutral-500">The {siteConfig.name} promise · RBI-aligned, zero money handling</p>
        </Reveal>
        <Reveal variant="zoom" spotlight className="group relative aspect-square rounded-[17px] overflow-hidden bg-neutral-100">
          <img
            src={unsplash("photo-1441986300917-64674bd600d8", 900)}
            alt="A small boutique store interior"
            loading="lazy"
            className="scroll-parallax absolute inset-0 w-full h-full object-cover grayscale transition-[filter,scale] duration-1000 ease-out group-hot:grayscale-0 group-hot:scale-105"
          />
          <PaymentCard className="absolute bottom-5 left-5 right-5 w-auto transition-transform duration-500 group-hot:-translate-y-2" />
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Pricing                                                             */
/* ------------------------------------------------------------------ */

function Pricing() {
  usePlatformSettings();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");

  return (
    <section id="pricing" className="border-t border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-24 sm:py-32">
        <SectionIntro
          center
          eyebrow="Pricing"
          title="Run your entire store with one plan."
          effect="words-up"
          text="No commissions, no hidden fees. Start free and upgrade when you're ready."
        />

        {/* 3-way Billing Cycle Toggle */}
        <div className="mt-10 flex flex-col items-center justify-center gap-2">
          <div className="inline-flex flex-wrap items-center justify-center rounded-2xl bg-neutral-100 p-1.5 text-xs font-semibold gap-1 border border-neutral-200/80 shadow-2xs">
            {BILLING_CYCLES.map((cycle) => {
              const isSelected = billingCycle === cycle.id;
              return (
                <button
                  key={cycle.id}
                  type="button"
                  onClick={() => setBillingCycle(cycle.id)}
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all duration-200 cursor-pointer",
                    isSelected
                      ? "bg-black text-white shadow-sm"
                      : "text-neutral-600 hover:text-black hover:bg-neutral-200/50"
                  )}
                >
                  <span>{cycle.label}</span>
                  {cycle.tag && (
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase",
                        isSelected
                          ? "bg-amber-400 text-black"
                          : cycle.id === "yearly"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-blue-100 text-blue-800"
                      )}
                    >
                      {cycle.tag}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-neutral-500 font-medium">
            {billingCycle === "quarterly" && "Save 5% on 3-month commitments. Billed quarterly."}
            {billingCycle === "yearly" && "Save 10% on annual commitments. Billed annually."}
            {billingCycle === "monthly" && "Standard month-to-month billing. Cancel anytime."}
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
          {Object.values(PLATFORM_PLANS).map((plan, i) => {
            const hi = !!plan.highlight;
            const pricing = calculatePlanPrice(plan.id, billingCycle);
            const isFree = plan.priceMonthly === 0;

            return (
              <Reveal
                key={plan.id}
                delay={i * 120}
                variant="up"
                spotlight
                className={cn(
                  "relative rounded-[17px] p-8 flex flex-col hot:-translate-y-2 hot:scale-[1.02]",
                  hi
                    ? "bg-black text-white hot:shadow-[0_30px_60px_-20px_rgba(0,0,0,0.5)]"
                    : "bg-white border border-neutral-200 hot:border-black hot:shadow-[0_30px_60px_-25px_rgba(0,0,0,0.25)]"
                )}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold">{plan.name}</h3>
                  {hi ? (
                    <span className="relative rounded-[7px] bg-white text-black text-[10px] font-bold uppercase tracking-wider px-2.5 py-1">
                      Best value
                    </span>
                  ) : pricing.discountPercent > 0 ? (
                    <span className="relative rounded-[7px] bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1">
                      Save {pricing.discountPercent}%
                    </span>
                  ) : null}
                </div>
                <p className={cn("mt-2 text-sm", hi ? "text-neutral-400" : "text-neutral-600")}>{plan.description}</p>
                <div className="mt-6">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <span className="text-5xl font-semibold tracking-tighter">
                      {isFree ? "₹0" : pricing.formattedMonthly}
                    </span>
                    {billingCycle === "monthly" && plan.originalPriceFormatted && (
                      <span className={cn("text-lg line-through", hi ? "text-neutral-500" : "text-neutral-400")}>
                        {plan.originalPriceFormatted.split(" ")[0]}
                      </span>
                    )}
                    <span className={cn("text-sm", hi ? "text-neutral-400" : "text-neutral-500")}>/month</span>
                  </div>
                  {!isFree && billingCycle !== "monthly" && (
                    <p className={cn("mt-1 text-xs font-medium", hi ? "text-amber-300" : "text-emerald-700")}>
                      {pricing.billingText}
                    </p>
                  )}
                </div>
                {billingCycle === "monthly" && planDiscountPercent(plan) > 0 && (
                  <span className="mt-2 self-start rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-600">
                    Save {planDiscountPercent(plan)}% · launch offer
                  </span>
                )}

                <Link
                  href={plan.id === "free" ? "/register" : `/register?plan=${plan.id}&cycle=${billingCycle}`}
                  className={cn(
                    "mt-6 py-3.5 rounded-[14px] text-sm font-semibold text-center transition-all duration-300 hover:shadow-lg active:scale-[0.98]",
                    hi ? "bg-white text-black hover:bg-neutral-200" : "bg-black text-white hover:bg-neutral-800"
                  )}
                >
                  {plan.id === "free" ? "Get started free" : `Choose ${plan.name}`}
                </Link>

                <ul className={cn("mt-8 pt-6 space-y-3 text-sm border-t", hi ? "border-white/15" : "border-neutral-200")}>
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 shrink-0 mt-0.5" />
                      <span className={hi ? "text-neutral-300" : "text-neutral-700"}>{f}</span>
                    </li>
                  ))}
                </ul>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}


/* ------------------------------------------------------------------ */
/* FAQ                                                                 */
/* ------------------------------------------------------------------ */

function Faq() {
  return (
    <section id="faq" className="max-w-7xl mx-auto px-4 sm:px-6 pb-24 sm:pb-32">
      <div className="max-w-3xl mx-auto flex flex-col gap-10">
        <SectionIntro eyebrow="FAQ" title="Questions?" effect="words-blur" />
        <div className="border-t border-neutral-200">
          {FAQS.map((f, i) => (
            <Reveal key={f.q} delay={i * 90} variant="right">
            <details className="group border-b border-neutral-200">
              <summary className="flex items-center justify-between gap-4 py-6 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                <span className="text-lg sm:text-xl font-semibold tracking-tight transition-transform duration-300 group-hover:translate-x-1">{f.q}</span>
                <span className="w-9 h-9 rounded-full border border-neutral-300 flex items-center justify-center shrink-0 transition-all duration-300 group-open:rotate-45 group-hover:bg-black group-hover:text-white group-hover:border-black">
                  <span className="text-xl leading-none">+</span>
                </span>
              </summary>
              <p className="animate-in slide-in-from-top-2 pb-6 -mt-1 text-neutral-600 leading-relaxed max-w-2xl">{f.a}</p>
            </details>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Final CTA                                                           */
/* ------------------------------------------------------------------ */

function FinalCta({ onClaim }: { onClaim: (v: string) => void }) {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-24">
      <Reveal variant="zoom" spotlight className="group relative rounded-[22px] bg-black text-white overflow-hidden px-6 py-14 sm:px-14 sm:py-20">
        <div aria-hidden className="absolute -right-24 -top-24 w-96 h-96 rounded-full border border-white/10 transition-transform duration-1000 ease-out group-hot:scale-125 animate-float-gentle" />
        <div aria-hidden className="absolute -right-8 -top-8 w-64 h-64 rounded-full border border-white/10 transition-transform duration-1000 ease-out group-hot:scale-150 animate-float-gentle [animation-delay:1.5s]" />
        <div className="relative grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-10 items-center">
          <div>
            <AnimatedTitle
              text={"Make your\nnext move."}
              effect="words-up"
              className="text-4xl sm:text-6xl font-semibold leading-[1.02]"
            />
            <p className="mt-5 text-neutral-400 text-lg max-w-md">
              Claim your shop name now. It takes less than a minute.
            </p>
            <div className="mt-8">
              <ClaimForm dark onClaim={onClaim} />
            </div>
          </div>
          <ul className="space-y-4 text-base">
            {["Free forever starter plan", "0% commission on every sale", "Direct UPI to your bank", "Cancel or switch plans anytime"].map(
              (t, i) => (
                <Reveal as="li" key={t} delay={200 + i * 110} variant="left" className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-white text-black flex items-center justify-center shrink-0">
                    <Check className="w-4 h-4" />
                  </span>
                  {t}
                </Reveal>
              )
            )}
          </ul>
        </div>
      </Reveal>
    </section>
  );
}
