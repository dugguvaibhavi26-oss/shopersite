"use client";

import * as React from "react";
import { ImageIcon } from "lucide-react";
import { storeService, type PlatformBanner } from "@/lib/store-service";
import { cn } from "@/lib/utils";

const AUTO_MS = 5000;

/** `/dashboard?tab=<tab>` links switch tabs in place instead of reloading the dashboard. */
export function dashboardTabFromLink(link?: string): string | null {
  return link?.match(/^\/dashboard\?(?:.*&)?tab=([\w-]+)/)?.[1] ?? null;
}

/**
 * Image carousel above Quick actions. One shape everywhere (1600 x 600, 8:3), so the whole image shows on phones and computers. It shows only the banner
 * images the platform admin uploads: no text, no buttons. Each image opens its redirect path or URL.
 * Slides auto-advance and loop, pause while touched or hovered, and swipe on phones.
 * With no banners published it shows an empty image placeholder of the same size.
 */
export function AnnouncementBanners({ onOpenTab }: { onOpenTab?: (tab: string) => void }) {
  const [banners, setBanners] = React.useState<PlatformBanner[]>([]);
  const [index, setIndex] = React.useState(0);
  const [paused, setPaused] = React.useState(false);
  const [dragX, setDragX] = React.useState(0);
  const touch = React.useRef<{ x: number; y: number; moved: boolean } | null>(null);

  React.useEffect(() => {
    const sync = () => setBanners(storeService.getPlatformBanners().filter((b) => b.imageUrl));
    sync();
    return storeService.subscribe(sync);
  }, []);

  const count = banners.length;
  const current = count ? index % count : 0;
  const go = React.useCallback((i: number) => count && setIndex(((i % count) + count) % count), [count]);

  React.useEffect(() => {
    if (count < 2 || paused) return;
    const reduced = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    const id = window.setTimeout(() => go(current + 1), AUTO_MS);
    return () => window.clearTimeout(id);
  }, [current, count, paused, go]);

  const frame = "relative block w-full shrink-0 aspect-[8/3] overflow-hidden";

  if (count === 0) {
    return (
      <div
        aria-label="Banner"
        className={cn(frame, "rounded-2xl bg-neutral-100 flex items-center justify-center text-neutral-300")}
      >
        <ImageIcon className="h-10 w-10" strokeWidth={1.5} />
      </div>
    );
  }

  const swallowIfSwiped = (e: React.MouseEvent) => {
    if (touch.current?.moved) {
      e.preventDefault();
      return true;
    }
    return false;
  };

  return (
    <div
      className="relative overflow-hidden rounded-2xl bg-neutral-100 select-none"
      role="region"
      aria-roledescription="carousel"
      aria-label="Banners"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => {
        setPaused(true);
        touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, moved: false };
      }}
      onTouchMove={(e) => {
        const t = touch.current;
        if (!t || count < 2) return;
        const dx = e.touches[0].clientX - t.x;
        if (Math.abs(dx) > Math.abs(e.touches[0].clientY - t.y)) {
          t.moved = true;
          setDragX(dx);
        }
      }}
      onTouchEnd={() => {
        const dx = dragX;
        setDragX(0);
        setPaused(false);
        // keep `moved` for the click that follows this touch, then reset
        window.setTimeout(() => (touch.current = null), 0);
        if (dx < -40) go(current + 1);
        else if (dx > 40) go(current - 1);
      }}
    >
      <div
        className="flex"
        style={{
          transform: `translateX(calc(${-current * 100}% + ${dragX}px))`,
          transition: dragX ? "none" : "transform 600ms cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {banners.map((b, i) => {
          const hidden = i !== current;
          const img = (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={b.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" draggable={false} />
          );
          const common = {
            "aria-roledescription": "slide",
            "aria-label": `Banner ${i + 1} of ${count}`,
            "aria-hidden": hidden,
            tabIndex: hidden ? -1 : 0,
          } as const;
          const link = (b.link || "").trim();
          const tab = dashboardTabFromLink(link);
          if (tab && onOpenTab) {
            return (
              <button
                key={b.id}
                type="button"
                {...common}
                onClick={(e) => !swallowIfSwiped(e) && onOpenTab(tab)}
                className={cn(frame, "!min-h-0")}
              >
                {img}
              </button>
            );
          }
          if (link) {
            const external = /^https?:\/\//.test(link);
            return (
              <a
                key={b.id}
                href={link}
                {...common}
                target={external ? "_blank" : undefined}
                rel={external ? "noopener noreferrer" : undefined}
                onClick={swallowIfSwiped}
                className={frame}
                style={{ minHeight: 0 }}
              >
                {img}
              </a>
            );
          }
          return (
            <div key={b.id} {...common} className={frame}>
              {img}
            </div>
          );
        })}
      </div>

      {count > 1 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-2.5 flex justify-center gap-1.5" aria-hidden>
          {banners.map((b, i) => (
            <span
              key={b.id}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === current ? "w-5 bg-white" : "w-1.5 bg-white/55"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
