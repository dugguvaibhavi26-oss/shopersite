"use client";

import * as React from "react";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { productsFromSource, rupees, useSite } from "./context";
import { Container, MLink } from "./ui";

/**
 * Sections first made for Mono Studio (everyday essentials), open to any theme: the products as a numbered index
 * like a catalogue page, and a big clock counting down to the next drop.
 */

function Lines({ text }: { text: string }) {
  return (
    <>
      {(text || "").split("\n").map((l, i) => (
        <React.Fragment key={i}>
          {i > 0 && <br />}
          {l.split(/\*([^*]+)\*/).map((part, j) => (j % 2 ? <em key={j} className="m-em">{part}</em> : part))}
        </React.Fragment>
      ))}
    </>
  );
}

/** The products as a numbered index: number, name, a line of detail, category and price on each row. Pointing at a
 *  row turns it black and shows the product's photo beside the pointer; on phones each row carries a small photo. */
export function SpecIndex({ s }: { s: Record<string, string> }) {
  const { store } = useSite();
  const products = productsFromSource(store, s.source || "bestsellers", Math.min(12, Math.max(3, Number(s.count) || 6)));
  const box = React.useRef<HTMLDivElement>(null);
  const [hover, setHover] = React.useState<{ i: number; x: number; y: number } | null>(null);
  if (!products.length) return null;
  const catName = (slug?: string) => (store.categories || []).find((c) => c.slug === slug || c.name.toLowerCase() === (slug || "").toLowerCase())?.name || "";
  const shown = hover ? products[hover.i] : undefined;
  return (
    <section className="t-index py-[clamp(48px,7vw,112px)]">
      <Container>
        <div className="mb-[clamp(20px,3vw,40px)] flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <h2 className="m-h t-title">
            <Lines text={s.heading} />
          </h2>
          {s.text && <p className="m-muted max-w-sm text-[length:calc(13px*var(--m-scale))] leading-relaxed md:text-right">{s.text}</p>}
        </div>
        <div
          ref={box}
          className="relative"
          onMouseLeave={() => setHover(null)}
          onMouseMove={(e) => {
            if (!hover || !box.current) return;
            const r = box.current.getBoundingClientRect();
            setHover({ ...hover, x: e.clientX - r.left, y: e.clientY - r.top });
          }}
        >
          <div className="m-line hidden grid-cols-[3.5rem_1.2fr_2fr_1fr_6rem] gap-4 border-b pb-2 text-[length:calc(10.5px*var(--m-scale))] font-semibold uppercase tracking-[0.14em] opacity-55 md:grid">
            <span>{s.colNo}</span>
            <span>{s.colName}</span>
            <span>{s.colDetail}</span>
            <span>{s.colType}</span>
            <span className="text-right">{s.colPrice}</span>
          </div>
          <ol>
            {products.map((p, i) => (
              <li key={p.id} className="t-index-row m-line border-b" style={{ "--n": i } as React.CSSProperties}>
                <MLink
                  to={`/products/${p.slug || p.id}`}
                  onMouseEnter={(e) => {
                    const r = box.current?.getBoundingClientRect();
                    setHover({ i, x: r ? e.clientX - r.left : 0, y: r ? e.clientY - r.top : 0 });
                  }}
                  className="grid min-h-0 grid-cols-[56px_1fr_auto] items-center gap-x-3 gap-y-0.5 py-3 transition-colors duration-200 md:grid-cols-[3.5rem_1.2fr_2fr_1fr_6rem] md:gap-4 md:px-2 md:py-4 md:hover:bg-[var(--m-text)] md:hover:text-[var(--m-bg)]"
                >
                  <span className="hidden text-[length:calc(12px*var(--m-scale))] tabular-nums opacity-60 md:block">{String(i + 1).padStart(2, "0")}</span>
                  {/* phones: a small photo instead of the number */}
                  <span className="m-panel relative row-span-2 block h-14 w-14 overflow-hidden md:hidden">
                    {p.images?.[0] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.images[0]} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
                    )}
                  </span>
                  <span className="m-cap truncate text-[length:calc(13px*var(--m-scale))] font-semibold tracking-[0.04em]">{p.title}</span>
                  <span className="order-last col-start-2 col-end-4 truncate text-[length:calc(12.5px*var(--m-scale))] opacity-60 md:order-none md:col-auto md:opacity-75">{p.description}</span>
                  <span className="hidden text-[length:calc(12px*var(--m-scale))] opacity-70 md:block">{catName(p.category)}</span>
                  <span className="text-right text-[length:calc(13px*var(--m-scale))] font-medium tabular-nums">{rupees(p.price)}</span>
                </MLink>
              </li>
            ))}
          </ol>
          {/* the hovered product's photo, following the pointer (wide screens only) */}
          {shown?.images?.[0] && hover && (
            <span
              aria-hidden
              className="t-index-peek pointer-events-none absolute z-10 hidden h-[220px] w-[170px] overflow-hidden bg-[var(--m-panel)] shadow-[0_24px_50px_-20px_rgb(0_0_0/0.5)] md:block"
              style={{ left: Math.min(hover.x + 28, (box.current?.clientWidth || 9999) - 190), top: hover.y - 110 }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img key={shown.id} src={shown.images[0]} alt="" className="h-full w-full object-cover" />
            </span>
          )}
        </div>
        {s.linkLabel && (
          <MLink to={s.linkUrl || "/catalog"} className="m-cap mt-6 inline-flex items-center gap-1.5 text-[length:calc(12px*var(--m-scale))] font-semibold tracking-[0.08em] underline underline-offset-4 hover:no-underline">
            {s.linkLabel} <ArrowUpRight className="h-4 w-4" />
          </MLink>
        )}
      </Container>
    </section>
  );
}

/** When the next drop lands: a date like "2026-12-01 18:00", or, when none is set (or it has passed), next Friday 6 pm. */
export function nextDropTime(endsAt: string | undefined, now: Date): Date {
  const raw = (endsAt || "").trim();
  if (raw) {
    const d = new Date(raw.replace(" ", "T"));
    if (!Number.isNaN(d.getTime()) && d.getTime() > now.getTime()) return d;
  }
  const d = new Date(now);
  d.setHours(18, 0, 0, 0);
  const add = (5 - d.getDay() + 7) % 7;
  d.setDate(d.getDate() + add);
  if (d.getTime() <= now.getTime()) d.setDate(d.getDate() + 7);
  return d;
}

/** A black band with a big clock counting down to the next drop, a few words and a button. */
export function DropClock({ s }: { s: Record<string, string> }) {
  const [now, setNow] = React.useState<Date | null>(null);
  React.useEffect(() => {
    setNow(new Date());
    const t = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(t);
  }, []);
  const target = nextDropTime(s.endsAt, now || new Date(0));
  const left = now ? Math.max(0, target.getTime() - now.getTime()) : 0;
  const parts = [
    { v: Math.floor(left / 86400000), label: s.daysLabel },
    { v: Math.floor(left / 3600000) % 24, label: s.hoursLabel },
    { v: Math.floor(left / 60000) % 60, label: s.minutesLabel },
    { v: Math.floor(left / 1000) % 60, label: s.secondsLabel },
  ];
  return (
    <section className="t-drop bg-[var(--m-text)] py-[clamp(52px,7.5vw,120px)] text-[var(--m-bg)]">
      <Container className="grid items-end gap-[clamp(28px,4vw,64px)] lg:grid-cols-[1fr_1.4fr]">
        <div>
          {s.label && <p className="m-cap text-[length:calc(11px*var(--m-scale))] font-semibold tracking-[0.2em] opacity-60">{s.label}</p>}
          <h2 className="m-h t-title mt-3 !text-[var(--m-bg)]">
            <Lines text={s.heading} />
          </h2>
          {s.text && <p className="mt-4 max-w-sm text-[length:calc(13.5px*var(--m-scale))] leading-relaxed opacity-75">{s.text}</p>}
          {s.buttonLabel && (
            <MLink to={s.buttonLink || "/catalog"} className="m-cap mt-7 inline-flex h-12 items-center gap-2 border border-current px-6 text-[length:calc(12px*var(--m-scale))] font-semibold tracking-[0.1em] transition-colors hover:bg-[var(--m-bg)] hover:text-[var(--m-text)]">
              {s.buttonLabel} <ArrowUpRight className="h-4 w-4" />
            </MLink>
          )}
        </div>
        <div className="grid grid-cols-4 border-l border-t border-[color-mix(in_srgb,var(--m-bg)_25%,transparent)]" role="timer" aria-label={parts.map((p) => `${p.v} ${p.label || ""}`).join(", ")}>
          {parts.map((p, i) => (
            <div key={i} className="t-drop-cell border-b border-r border-[color-mix(in_srgb,var(--m-bg)_25%,transparent)] px-2 py-[clamp(14px,2.4vw,32px)] text-center">
              <span key={p.v} className={cn("t-drop-digit m-h m-display block text-[length:calc(clamp(34px,7vw,104px)*var(--m-scale))] leading-none tabular-nums !text-[var(--m-bg)]")}>
                {String(p.v).padStart(2, "0")}
              </span>
              {p.label && <span className="m-cap mt-2 block text-[length:calc(10px*var(--m-scale))] tracking-[0.18em] opacity-55">{p.label}</span>}
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
