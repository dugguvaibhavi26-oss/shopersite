"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Bell, Check, MessageCircle } from "lucide-react";
import { PhotoHero, AppSheet } from "@/components/app/photo-hero";
import { MOCK_PRODUCTS, unsplash } from "@/components/home/mockups";
import { markOnboarded } from "@/lib/native/app-start";
import { startNavProgress } from "@/components/nav-progress";
import { siteConfig } from "@/lib/config/site";

// Example address shown on the slides, e.g. yourshop.shopersite.in
const EXAMPLE_STORE_URL = `yourshop.${siteConfig.domain}`;
import { cn } from "@/lib/utils";

const SLIDES = [
  {
    eyebrow: "Build",
    title: "Sell what you love, from your phone.",
    text: "Snap a photo and add a price. Your shop is ready in 60 seconds.",
  },
  {
    eyebrow: "Share",
    title: "One link for WhatsApp and Instagram.",
    text: "Buyers browse, add to bag and order. Every order lands right here.",
  },
  {
    eyebrow: "Get paid",
    title: "Paid straight to your UPI.",
    text: "No middleman and 0% commission. Money goes straight to your bank.",
  },
] as const;

const primaryBtn =
  "w-full h-[52px] rounded-[16px] bg-black text-white text-[15px] font-semibold inline-flex items-center justify-center gap-2 active:scale-[0.98] transition-transform";

/** First-run onboarding: three swipeable slides, then create a shop or log in. */
export default function AppWelcomePage() {
  const router = useRouter();
  const [index, setIndex] = React.useState(0);
  const touchX = React.useRef<number | null>(null);
  const last = index === SLIDES.length - 1;
  const slide = SLIDES[index];

  const go = (path: string) => {
    markOnboarded();
    startNavProgress();
    router.replace(path);
  };
  const next = () => setIndex((i) => Math.min(i + 1, SLIDES.length - 1));
  const prev = () => setIndex((i) => Math.max(i - 1, 0));

  return (
    <div
      className="fixed inset-0 flex flex-col bg-white select-none"
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        touchX.current = null;
        if (dx < -50) next();
        else if (dx > 50) prev();
      }}
    >
      <PhotoHero
        className="flex-1 min-h-0"
        action={
          !last && (
            <button
              type="button"
              onClick={() => go("/app/login")}
              className="rounded-full bg-black/35 px-4 py-2 text-sm font-semibold text-white backdrop-blur-md"
            >
              Skip
            </button>
          )
        }
      >
        <div key={index} className="absolute inset-x-0 bottom-14 flex justify-center px-8 animate-enter-blur">
          {index === 0 && <ShopCard />}
          {index === 1 && <ShareCards />}
          {index === 2 && <PaidCard />}
        </div>
      </PhotoHero>

      <AppSheet>
        <div key={index} className="animate-enter-blur min-h-[9.5rem]">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">{slide.eyebrow}</span>
          <h1 className="mt-2 text-[1.9rem] font-semibold leading-[1.08] tracking-[-0.02em]">{slide.title}</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-neutral-600">{slide.text}</p>
        </div>

        <div className="mt-6 flex items-center gap-1.5" role="tablist" aria-label="Onboarding steps">
          {SLIDES.map((s, i) => (
            <button
              key={s.eyebrow}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Step ${i + 1}: ${s.eyebrow}`}
              onClick={() => setIndex(i)}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300 !min-h-0",
                i === index ? "w-6 bg-black" : "w-1.5 bg-neutral-300"
              )}
            />
          ))}
        </div>

        {last ? (
          <div className="mt-6 space-y-3">
            <button type="button" onClick={() => go("/register")} className={primaryBtn}>
              Create my shop
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => go("/app/login")}
              className="w-full h-[52px] rounded-[16px] border border-neutral-300 text-[15px] font-semibold active:scale-[0.98] transition-transform"
            >
              I already have a shop
            </button>
          </div>
        ) : (
          <button type="button" onClick={next} className={cn(primaryBtn, "mt-6")}>
            Next
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </AppSheet>
    </div>
  );
}

const card = "rounded-[18px] bg-white/95 backdrop-blur-md shadow-[0_24px_50px_-16px_rgba(0,0,0,0.45)]";

function ShopCard() {
  const items = MOCK_PRODUCTS.slice(0, 2);
  return (
    <div className={cn(card, "w-full max-w-[290px] p-3.5 animate-float-gentle")}>
      <div className="mb-3 flex items-center gap-2">
        <span className="h-7 w-7 rounded-[9px] bg-black text-white text-xs font-bold flex items-center justify-center">Y</span>
        <div className="leading-tight">
          <div className="text-sm font-semibold">Your shop</div>
          <div className="text-[11px] text-neutral-500">{EXAMPLE_STORE_URL}</div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {items.map((p) => (
          <div key={p.name}>
            <img src={unsplash(p.img, 300)} alt="" className="aspect-square w-full rounded-[11px] object-cover" />
            <div className="mt-1.5 truncate text-xs text-neutral-600">{p.name}</div>
            <div className="text-sm font-semibold">{p.price}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ShareCards() {
  return (
    <div className="w-full max-w-[300px] space-y-2.5">
      <div className={cn(card, "ml-auto w-fit max-w-[85%] rounded-br-[6px] px-3.5 py-2.5 text-sm")}>
        <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700">
          <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
        </div>
        Shop the new drop here: <span className="font-semibold underline">{EXAMPLE_STORE_URL}</span>
      </div>
      <div className={cn(card, "flex items-center gap-3 p-3 animate-float-gentle")}>
        <span className="h-10 w-10 shrink-0 rounded-[12px] bg-black text-white flex items-center justify-center">
          <Bell className="h-4 w-4" />
        </span>
        <div className="min-w-0 leading-tight">
          <div className="text-sm font-semibold">New order #1042</div>
          <div className="truncate text-xs text-neutral-500">Priya · Glow Skincare Set · ₹1,299</div>
        </div>
      </div>
    </div>
  );
}

function PaidCard() {
  return (
    <div className={cn(card, "w-full max-w-[260px] p-5 text-center animate-float-gentle")}>
      <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
        <Check className="h-5 w-5" />
      </span>
      <div className="mt-3 text-3xl font-semibold tracking-tight">₹1,299</div>
      <div className="mt-1 text-xs text-neutral-500">Paid straight to your UPI ID</div>
      <span className="mt-3 inline-block rounded-full border border-neutral-200 px-3 py-1 text-[11px] font-semibold">
        0% commission
      </span>
    </div>
  );
}
