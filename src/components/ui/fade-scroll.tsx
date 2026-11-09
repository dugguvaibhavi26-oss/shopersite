"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * A sideways-scrolling row that fades softly at an edge when there's more to see that way (instead
 * of cutting cards off hard), with small arrows on computers to slide it.
 */
export function FadeScroll({ className = "", children }: { className?: string; children: React.ReactNode }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [edges, setEdges] = React.useState({ left: false, right: false });

  const measure = React.useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const left = el.scrollLeft > 4;
    const right = el.scrollLeft + el.clientWidth < el.scrollWidth - 4;
    setEdges((e) => (e.left === left && e.right === right ? e : { left, right }));
  }, []);

  React.useEffect(() => {
    measure();
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    Array.from(el.children).forEach((c) => ro.observe(c));
    return () => ro.disconnect();
  }, [measure, children]);

  const slide = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: "smooth" });
  const fade = 56;
  const mask = `linear-gradient(to right, transparent 0, #000 ${edges.left ? fade : 0}px, #000 calc(100% - ${edges.right ? fade : 0}px), transparent 100%)`;

  return (
    <div className="group/fs relative">
      <div ref={ref} onScroll={measure} className={className} style={{ WebkitMaskImage: mask, maskImage: mask, transition: "mask-image 0.3s" }}>
        {children}
      </div>
      {edges.left && (
        <button type="button" onClick={() => slide(-1)} aria-label="Scroll left" style={{ minHeight: 0 }} className="absolute left-1 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-black/[0.06] bg-white/90 text-neutral-900 shadow-md backdrop-blur transition-opacity hover:bg-white md:flex">
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}
      {edges.right && (
        <button type="button" onClick={() => slide(1)} aria-label="Scroll right" style={{ minHeight: 0 }} className="absolute right-1 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-black/[0.06] bg-white/90 text-neutral-900 shadow-md backdrop-blur transition-opacity hover:bg-white md:flex">
          <ChevronRight className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
