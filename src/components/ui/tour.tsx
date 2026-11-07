"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

export type TourStep = {
  /** CSS selector of the thing to point at (e.g. [data-tour="add-product"]); missing or hidden → shown in the middle */
  target?: string;
  title: string;
  text: string;
};

const seenKey = (id: string) => `shopersite_tour_${id}`;

/**
 * A short guided tour that highlights parts of the page one by one. Shows itself the first time
 * (per device); `startRef.current()` replays it (the "Show me around" button).
 */
export function Tour({ id, steps, startRef, autoStart = true }: { id: string; steps: TourStep[]; startRef?: React.MutableRefObject<(() => void) | null>; autoStart?: boolean }) {
  const [at, setAt] = React.useState<number | null>(null);
  const [rect, setRect] = React.useState<DOMRect | null>(null);
  const [mounted, setMounted] = React.useState(false);

  // only steps whose target is on screen now (phone and desktop show different things)
  const visibleSteps = React.useCallback(
    () =>
      steps.filter((s) => {
        if (!s.target) return true;
        const el = document.querySelector<HTMLElement>(s.target);
        return !!el && el.getClientRects().length > 0;
      }),
    [steps]
  );
  const [list, setList] = React.useState<TourStep[]>([]);

  const start = React.useCallback(() => {
    setList(visibleSteps());
    setAt(0);
  }, [visibleSteps]);

  React.useEffect(() => {
    setMounted(true);
    if (startRef) startRef.current = start;
    if (!autoStart) return;
    let seen = false;
    try {
      seen = localStorage.getItem(seenKey(id)) === "1";
    } catch {
      seen = true; // no storage: don't keep showing it
    }
    if (seen) return;
    const t = window.setTimeout(start, 1200);
    return () => window.clearTimeout(t);
  }, [id, start, startRef, autoStart]);

  const step = at !== null ? list[at] : null;

  React.useLayoutEffect(() => {
    if (!step) return;
    const el = step.target ? document.querySelector<HTMLElement>(step.target) : null;
    if (!el) return setRect(null);
    el.scrollIntoView({ block: "center", behavior: "smooth" });
    const update = () => setRect(el.getBoundingClientRect());
    const t = window.setTimeout(update, 350);
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [step]);

  const close = React.useCallback(() => {
    setAt(null);
    try {
      localStorage.setItem(seenKey(id), "1");
    } catch {
      // fine
    }
  }, [id]);

  React.useEffect(() => {
    if (at === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") setAt((a) => (a !== null && a < list.length - 1 ? a + 1 : a));
      if (e.key === "ArrowLeft") setAt((a) => (a ? a - 1 : a));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [at, list.length, close]);

  if (!mounted || !step || at === null) return null;
  const pad = 6;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const cardW = Math.min(340, vw - 32);
  let top = vh / 2 - 90;
  let left = vw / 2 - cardW / 2;
  if (rect) {
    const below = rect.bottom + 12;
    top = below + 190 < vh ? below : Math.max(12, rect.top - 202);
    left = Math.min(vw - cardW - 16, Math.max(16, rect.left + rect.width / 2 - cardW / 2));
  }
  const last = at === list.length - 1;

  return createPortal(
    <div className="fixed inset-0 z-[990]" role="dialog" aria-modal="true" aria-label={step.title}>
      {rect ? (
        <div
          className="pointer-events-none fixed rounded-xl transition-all duration-300"
          style={{
            top: rect.top - pad,
            left: rect.left - pad,
            width: rect.width + pad * 2,
            height: rect.height + pad * 2,
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.55), 0 0 0 2px #fff",
          }}
        />
      ) : (
        <div className="fixed inset-0 bg-black/55" />
      )}
      <div className="fixed inset-0" onClick={close} />
      <div className="fixed rounded-2xl bg-white p-4 text-neutral-900 shadow-2xl transition-all duration-300 font-[Inter,sans-serif]" style={{ top, left, width: cardW }}>
        <div className="flex items-start justify-between gap-3">
          <p className="text-[15px] font-semibold leading-snug">{step.title}</p>
          <button type="button" onClick={close} className="-mr-1 -mt-1 rounded-lg p-1 text-neutral-400 hover:text-black" aria-label="Close tutorial">
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-1.5 text-sm leading-relaxed text-neutral-600">{step.text}</p>
        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="flex gap-1">
            {list.map((_, i) => (
              <span key={i} className={`h-1.5 rounded-full transition-all ${i === at ? "w-4 bg-black" : "w-1.5 bg-neutral-300"}`} />
            ))}
          </span>
          <span className="flex gap-2">
            {at > 0 && (
              <button type="button" onClick={() => setAt(at - 1)} className="h-9 rounded-lg px-3 text-sm font-semibold text-neutral-600 hover:text-black">
                Back
              </button>
            )}
            <button type="button" onClick={() => (last ? close() : setAt(at + 1))} className="h-9 rounded-lg bg-black px-4 text-sm font-semibold text-white">
              {last ? "Got it" : "Next"}
            </button>
          </span>
        </div>
      </div>
    </div>,
    document.body
  );
}
