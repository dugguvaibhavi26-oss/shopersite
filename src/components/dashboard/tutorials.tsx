"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, ArrowRight, Check, X } from "lucide-react";
import type { DashPage } from "@/lib/assistant/commands";

/**
 * Interactive tutorials: each one opens the right part of the dashboard and walks through it
 * step by step, with each tip next to the button or field it's about. The page stays usable, so
 * sellers can try each step as they go (nothing is saved unless they press Save themselves).
 */

export interface TutorialStep {
  /** page to show for this step */
  tab?: DashPage;
  /** a Settings section to open */
  settings?: "general" | "payments" | "delivery" | "checkout" | "taxes" | "policies" | "store";
  /** open the add-product form first */
  action?: "add-product";
  /** CSS selector of what to point at; missing → the tip shows in the middle */
  target?: string;
  title: string;
  text: string;
}

export interface Tutorial {
  id: string;
  title: string;
  summary: string;
  mins: number;
  steps: TutorialStep[];
}

export const TUTORIALS: Tutorial[] = [
  {
    id: "first-product",
    title: "Add your first product",
    summary: "Name, price, stock and photo, then publish.",
    mins: 2,
    steps: [
      { tab: "products", target: '[data-tour="nav-products"]', title: "Products live here", text: "Everything you sell is on the Products page. Let's add one together." },
      { tab: "products", action: "add-product", target: '[data-tour="p-title"]', title: "Give it a clear name", text: "Write what buyers search for, e.g. “Red cotton saree with zari border”. Try typing one now." },
      { action: "add-product", target: '[data-tour="p-price"]', title: "Set the price", text: "The price buyers pay, in rupees. You can also add an MRP above it to show a discount." },
      { action: "add-product", target: '[data-tour="p-stock"]', title: "How many do you have?", text: "Stock goes down with every order. At 0 the product shows as sold out." },
      { action: "add-product", target: '[data-tour="p-photo"]', title: "Add a good photo", text: "Upload a photo or paste a link. Daylight, a plain background and a square crop work best." },
      { action: "add-product", target: '[data-tour="p-save"]', title: "Publish it", text: "Press Publish when you're ready. Your product goes live on your shop straight away." },
    ],
  },
  {
    id: "payments",
    title: "Set up payments",
    summary: "Cash on delivery and online payments.",
    mins: 2,
    steps: [
      { tab: "settings", target: '[data-tour="set-payments"]', title: "Payments are in Settings", text: "Open Settings → Payments any time to change how buyers pay you." },
      { tab: "settings", settings: "payments", title: "Choose how buyers pay", text: "Cash on Delivery works on every plan. On Growth and Pro, connect Razorpay for cards, UPI and net banking. Payment keys are always entered by you." },
    ],
  },
  {
    id: "delivery",
    title: "Set delivery charges",
    summary: "Free delivery, a flat fee, or free above a value.",
    mins: 1,
    steps: [
      { tab: "settings", target: '[data-tour="set-delivery"]', title: "Shipping & delivery", text: "Delivery fees live in Settings → Shipping & delivery." },
      { tab: "settings", settings: "delivery", title: "Pick a delivery rule", text: "Free for everyone, a flat fee, or free above an order value (e.g. ₹999). Free-above usually raises the order size." },
    ],
  },
  {
    id: "coupon",
    title: "Create a coupon",
    summary: "A code buyers enter for money off.",
    mins: 1,
    steps: [
      { tab: "discounts", target: '[data-tour="add-coupon"]', title: "Start a new coupon", text: "Press New coupon. (Coupons are on the Growth and Pro plans.)" },
      { tab: "discounts", title: "Set the details", text: "Pick a code like DIWALI10, a percentage or flat amount, an optional minimum order and an end date. Share the code on WhatsApp and Instagram." },
    ],
  },
  {
    id: "ship-order",
    title: "Ship an order",
    summary: "From new order to delivered.",
    mins: 2,
    steps: [
      { tab: "orders", target: '[data-tour="nav-orders"]', title: "Your orders", text: "New orders appear here. A dot on Orders means something is waiting." },
      { tab: "orders", title: "Move it along", text: "Open an order and move it: Confirmed → Packed → Shipped → Delivered. Add the courier and tracking number when you ship, and buyers see it on their order page." },
      { tab: "plugins", target: '[data-tour="plugin-shiprocket"]', title: "Book couriers faster", text: "Connect Shiprocket to compare courier prices and book pickups right from each order." },
    ],
  },
  {
    id: "policies",
    title: "Add your policy pages",
    summary: "Needed before your shop can open.",
    mins: 2,
    steps: [
      { tab: "settings", target: '[data-tour="set-policies"]', title: "Policies keep you safe", text: "Indian law asks online shops to show their policies. Your shop stays closed until you add at least one." },
      { tab: "settings", settings: "policies", title: "Use a template", text: "Pick returns & refunds, shipping, terms or privacy. Each has a ready template: edit the details and save." },
    ],
  },
];

/* ------------------------------ runner ------------------------------ */

export function TutorialRunner({ tutorial, onPrepare, onClose }: { tutorial: Tutorial; onPrepare: (step: TutorialStep) => void; onClose: () => void }) {
  const [at, setAt] = React.useState(0);
  const [rect, setRect] = React.useState<DOMRect | null>(null);
  const step = tutorial.steps[at];
  const last = at === tutorial.steps.length - 1;

  // open the right page, then wait for the thing to point at
  React.useEffect(() => {
    onPrepare(step);
    setRect(null);
    if (!step.target) return;
    let el: HTMLElement | null = null;
    let tries = 0;
    let raf = 0;
    const update = () => el && setRect(el.getBoundingClientRect());
    const find = window.setInterval(() => {
      tries++;
      // the first one actually on screen (phones and computers show different menus)
      const found = Array.from(document.querySelectorAll<HTMLElement>(step.target!)).find((x) => x.getClientRects().length > 0);
      if (found) {
        el = found;
        window.clearInterval(find);
        el.scrollIntoView({ block: "center", behavior: "smooth" });
        window.setTimeout(update, 400);
        update();
      } else if (tries > 25) window.clearInterval(find);
    }, 120);
    const onMove = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };
    window.addEventListener("resize", onMove);
    window.addEventListener("scroll", onMove, true);
    return () => {
      window.clearInterval(find);
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onMove);
      window.removeEventListener("scroll", onMove, true);
    };
    // onPrepare changes identity every render; the step is what matters
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [at, tutorial.id]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setAt((a) => Math.min(tutorial.steps.length - 1, a + 1));
      if (e.key === "ArrowLeft") setAt((a) => Math.max(0, a - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, tutorial.steps.length]);

  if (typeof window === "undefined") return null;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const cardW = Math.min(360, vw - 24);
  const cardH = 210;
  let top = vh - cardH - 24;
  let left = vw / 2 - cardW / 2;
  if (rect) {
    const below = rect.bottom + 14;
    top = below + cardH < vh ? below : Math.max(70, rect.top - cardH - 14);
    left = Math.min(vw - cardW - 12, Math.max(12, rect.left + rect.width / 2 - cardW / 2));
  }
  const pad = 6;

  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-[995]">
      {/* tutorial bar */}
      <div className="pointer-events-auto fixed left-1/2 top-3 flex -translate-x-1/2 items-center gap-3 rounded-full bg-neutral-950 py-1.5 pl-4 pr-1.5 text-xs text-white shadow-xl">
        <span className="font-semibold">Tutorial · {tutorial.title}</span>
        <span className="hidden text-white/50 sm:inline">Your real dashboard: nothing changes unless you save</span>
        <button type="button" onClick={onClose} style={{ minHeight: 0 }} className="rounded-full bg-white/15 px-2.5 py-1 font-semibold hover:bg-white/25">
          Exit
        </button>
      </div>

      {/* highlight around the target (the page stays usable) */}
      {rect && (
        <div
          className="fixed rounded-xl transition-all duration-300"
          style={{ top: rect.top - pad, left: rect.left - pad, width: rect.width + pad * 2, height: rect.height + pad * 2, boxShadow: "0 0 0 9999px rgba(0,0,0,0.35), 0 0 0 2px #fff, 0 0 0 5px rgba(0,0,0,0.85)" }}
        />
      )}

      {/* the tip */}
      <div className="pointer-events-auto fixed rounded-2xl bg-white p-4 text-neutral-900 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.45)] ring-1 ring-black/5 transition-all duration-300" style={{ top, left, width: cardW }}>
        <div className="flex items-center justify-between gap-3">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
            Step {at + 1} of {tutorial.steps.length}
          </span>
          <button type="button" onClick={onClose} aria-label="Exit tutorial" style={{ minHeight: 0 }} className="rounded-md p-1 text-neutral-400 hover:text-neutral-900">
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-1 text-[15px] font-semibold">{step.title}</p>
        <p className="mt-1 text-sm leading-relaxed text-neutral-600">{step.text}</p>
        <div className="mt-4 flex items-center justify-between">
          <span className="flex gap-1">
            {tutorial.steps.map((_, i) => (
              <span key={i} className={`h-1.5 rounded-full transition-all ${i === at ? "w-5 bg-neutral-950" : i < at ? "w-1.5 bg-neutral-500" : "w-1.5 bg-neutral-200"}`} />
            ))}
          </span>
          <span className="flex gap-2">
            {at > 0 && (
              <button type="button" onClick={() => setAt(at - 1)} style={{ minHeight: 0 }} className="inline-flex h-9 items-center gap-1 rounded-full px-3 text-sm font-medium text-neutral-600 hover:bg-neutral-100">
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
            )}
            <button type="button" onClick={() => (last ? onClose() : setAt(at + 1))} style={{ minHeight: 0 }} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-neutral-950 px-4 text-sm font-semibold text-white hover:bg-black">
              {last ? (
                <>
                  <Check className="h-4 w-4" /> Done
                </>
              ) : (
                <>
                  Next <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </span>
        </div>
      </div>
    </div>,
    document.body
  );
}
