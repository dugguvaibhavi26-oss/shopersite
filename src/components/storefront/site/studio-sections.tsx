"use client";

import * as React from "react";
import { ArrowLeft, ArrowRight, Droplets, Flame, Hand, Microwave, Snowflake, Sparkles } from "lucide-react";
import type { ProductData } from "@/lib/store-service";
import { cn } from "@/lib/utils";
import { rupees, useSite, visibleProducts } from "./context";
import { Container, MLink, Stars } from "./ui";

/**
 * Sections first made for Theme 07 (ceramics), open to any theme: a glaze picker, a care guide with stamps and a
 * batch calendar. Each is text- and colour-led rather than another big photo.
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

function matching(products: ProductData[], term: string, limit: number) {
  const safe = (term || "").trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (!safe) return [];
  const word = new RegExp(`\\b${safe}(s)?\\b`, "i");
  return products.filter((p) => word.test(`${p.title} ${p.description || ""}`)).slice(0, limit);
}

const colourOf = (v: string | undefined, fallback: string) => (/^#[0-9a-fA-F]{3,8}$/.test((v || "").trim()) ? v!.trim() : fallback);

/** Round glaze swatches; the chosen one fills a big tile with its colour, its words and the pieces made in it. */
export function GlazePicker({ s }: { s: Record<string, string> }) {
  const { store } = useSite();
  const glazes = [1, 2, 3, 4, 5]
    .map((n) => ({ n, name: (s[`g${n}Name`] || "").trim(), colour: colourOf(s[`g${n}Colour`], "#D9CFC2"), text: s[`g${n}Text`] || "", match: s[`g${n}Match`] || "" }))
    .filter((g) => g.name);
  const [pick, setPick] = React.useState(0);
  if (!glazes.length) return null;
  const g = glazes[Math.min(pick, glazes.length - 1)];
  const found = matching(visibleProducts(store), g.match || g.name, 3);
  return (
    <section className="t-glaze py-[clamp(44px,6.5vw,104px)]">
      <Container className="grid items-center gap-[clamp(28px,4vw,64px)] md:grid-cols-[1fr_1.15fr]">
        <div>
          <h2 className="m-h t-title">
            <Lines text={s.heading} />
          </h2>
          {s.text && <p className="m-muted mt-4 max-w-md text-[length:calc(14px*var(--m-scale))] leading-relaxed">{s.text}</p>}
          <div className="t-glaze-swatches mt-7 flex flex-wrap gap-3 sm:gap-4" role="tablist" aria-label={s.heading?.replace(/\*/g, "") || "Glazes"}>
            {glazes.map((x, i) => (
              <button
                key={x.n}
                type="button"
                role="tab"
                aria-selected={i === pick}
                aria-label={x.name}
                onClick={() => setPick(i)}
                style={{ "--glaze": x.colour, "--n": i } as React.CSSProperties}
                className={cn(
                  "t-swatch relative h-[clamp(52px,6vw,72px)] w-[clamp(52px,6vw,72px)] min-h-0 shrink-0 rounded-full transition-transform duration-300 hover:-translate-y-1",
                  i === pick && "ring-2 ring-[var(--m-accent)] ring-offset-4 ring-offset-[var(--m-bg)]"
                )}
              />
            ))}
          </div>
          <p className="mt-4 text-[length:calc(11.5px*var(--m-scale))] font-semibold uppercase tracking-[0.14em] text-[var(--m-accent)]">
            {String(pick + 1).padStart(2, "0")} / {String(glazes.length).padStart(2, "0")} · {g.name}
          </p>
        </div>

        <div key={g.n} className="t-glaze-tile m-line grid border sm:grid-cols-[0.9fr_1fr]">
          <div className="relative flex aspect-square items-center justify-center overflow-hidden sm:aspect-auto sm:min-h-[340px]" style={{ background: `color-mix(in srgb, ${g.colour} 22%, var(--m-bg))` }}>
            <span className="t-swatch t-glaze-pot block aspect-square w-[62%] rounded-full" style={{ "--glaze": g.colour } as React.CSSProperties} aria-hidden />
          </div>
          <div className="flex flex-col p-[clamp(18px,2.4vw,32px)]">
            <p className="m-h text-[length:calc(clamp(24px,2.6vw,36px)*var(--m-scale))] leading-none">{g.name}</p>
            {g.text && <p className="m-muted mt-3 text-[length:calc(13.5px*var(--m-scale))] leading-relaxed">{g.text}</p>}
            <div className="mt-5 flex-1 space-y-2">
              {found.map((p) => (
                <MLink key={p.id} to={`/products/${p.slug || p.id}`} className="m-line group flex items-center gap-3 border-t pt-2">
                  {p.images?.[0] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.images[0]} alt="" loading="lazy" className="m-panel h-12 w-12 shrink-0 object-cover" />
                  )}
                  <span className="min-w-0 flex-1 truncate text-[length:calc(13px*var(--m-scale))] font-medium group-hover:text-[var(--m-accent)]">{p.title}</span>
                  <span className="text-[length:calc(12.5px*var(--m-scale))] font-semibold tabular-nums">{rupees(p.price)}</span>
                </MLink>
              ))}
              {!found.length && s.emptyText && <p className="m-muted text-[length:calc(13px*var(--m-scale))]">{s.emptyText}</p>}
            </div>
            {s.linkLabel && (
              <MLink to={`/search?q=${encodeURIComponent(g.match || g.name)}`} className="mt-5 inline-flex items-center gap-1.5 self-start text-[length:calc(12px*var(--m-scale))] font-semibold uppercase tracking-[0.06em] text-[var(--m-accent)] hover:gap-2.5">
                {s.linkLabel} <ArrowRight className="h-4 w-4" />
              </MLink>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}

const CARE_ICONS: Record<string, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  dishwasher: Droplets,
  microwave: Microwave,
  oven: Flame,
  freezer: Snowflake,
  hand: Hand,
  shine: Sparkles,
};

/** Care marks in a row, like the label stitched inside a garment: a round icon, a small coloured verdict, the
 *  title and a line of advice, all centred under one heading. */
export function CareGuide({ s }: { s: Record<string, string> }) {
  const tiles = [1, 2, 3, 4, 5, 6]
    .map((n) => ({ n, title: s[`c${n}Title`] || "", icon: CARE_ICONS[s[`c${n}Icon`]] || Sparkles, stamp: s[`c${n}Stamp`] || "", tone: s[`c${n}Tone`] || "yes", text: s[`c${n}Text`] || "" }))
    .filter((t) => t.title);
  if (!tiles.length) return null;
  return (
    <section className="t-care py-[clamp(48px,7vw,112px)]">
      <Container>
        <div className="t-care-label m-line mx-auto max-w-[1180px] border px-[clamp(18px,4vw,64px)] py-[clamp(32px,5vw,72px)]">
          <div className="mx-auto max-w-xl text-center">
            <h2 className="m-h t-title">
              <Lines text={s.heading} />
            </h2>
            {s.text && <p className="m-muted mt-4 text-[length:calc(14px*var(--m-scale))] leading-relaxed">{s.text}</p>}
          </div>
          <ul className="m-stagger mt-[clamp(28px,4vw,56px)] grid grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-3 lg:grid-cols-6">
            {tiles.map((t) => {
              const Icon = t.icon;
              return (
                <li key={t.n} className="t-care-tile flex flex-col items-center text-center">
                  <span className="t-care-ring m-line flex h-[clamp(56px,5vw,68px)] w-[clamp(56px,5vw,68px)] items-center justify-center rounded-full border">
                    <Icon className="h-[42%] w-[42%]" strokeWidth={1.4} />
                  </span>
                  {t.stamp && (
                    <span data-tone={t.tone} className="t-stamp mt-3 text-[length:calc(10px*var(--m-scale))] font-bold uppercase tracking-[0.18em]">
                      {t.stamp}
                    </span>
                  )}
                  <p className="m-h mt-1.5 text-[length:calc(14px*var(--m-scale))]">{t.title}</p>
                  {t.text && <p className="m-muted mt-1.5 max-w-[15rem] text-[length:calc(12.5px*var(--m-scale))] leading-relaxed">{t.text}</p>}
                </li>
              );
            })}
          </ul>
          {s.note && <p className="m-line mx-auto mt-[clamp(28px,4vw,48px)] max-w-lg border-t pt-5 text-center text-[length:calc(12.5px*var(--m-scale))] italic opacity-75">{s.note}</p>}
        </div>
      </Container>
    </section>
  );
}

/** The next few drops, kept quiet: three columns between thin rules, each with its date, name, a line and a status. */
export function BatchCalendar({ s }: { s: Record<string, string> }) {
  const rows = [1, 2, 3, 4, 5]
    .map((n) => ({ n, date: s[`b${n}Date`] || "", title: s[`b${n}Title`] || "", note: s[`b${n}Note`] || "", status: s[`b${n}Status`] || "soon", link: s[`b${n}Link`] || "" }))
    .filter((r) => r.title)
    .slice(0, 3);
  if (!rows.length) return null;
  const word = (st: string) => (st === "open" ? s.openLabel : st === "sold" ? s.soldLabel : s.soonLabel) || "";
  return (
    <section className="t-batch py-[clamp(48px,7vw,112px)]">
      <Container>
        <div className="mx-auto mb-[clamp(24px,3.4vw,48px)] max-w-xl text-center">
          <h2 className="m-h t-section">
            <Lines text={s.heading} />
          </h2>
          {s.text && <p className="m-muted mt-3 text-[length:calc(13.5px*var(--m-scale))] leading-relaxed">{s.text}</p>}
        </div>
        <ol className="m-line grid border-y sm:grid-cols-3">
          {rows.map((r, i) => {
            const inner = (
              <>
                <span className="t-batch-date text-[length:calc(11px*var(--m-scale))] font-semibold uppercase tracking-[0.2em] text-[var(--m-accent)]">{r.date}</span>
                <span className="m-h mt-3 block text-[length:calc(clamp(17px,1.5vw,20px)*var(--m-scale))] leading-snug">{r.title}</span>
                {r.note && <span className="m-muted mt-1.5 block text-[length:calc(13px*var(--m-scale))] leading-relaxed">{r.note}</span>}
                {word(r.status) && (
                  <span data-status={r.status} className="t-batch-status mt-4 inline-flex items-center gap-2 text-[length:calc(11px*var(--m-scale))] font-semibold uppercase tracking-[0.12em]">
                    <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current" />
                    {word(r.status)}
                    {r.link && r.status === "open" && <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />}
                  </span>
                )}
              </>
            );
            const cls = "group flex h-full flex-col items-center px-4 py-[clamp(22px,3vw,40px)] text-center";
            return (
              <li key={r.n} className={cn("t-batch-row m-line", i > 0 && "border-t sm:border-l sm:border-t-0")} style={{ "--n": i } as React.CSSProperties}>
                {r.link && r.status === "open" ? (
                  <MLink to={r.link} className={cls}>
                    {inner}
                  </MLink>
                ) : (
                  <div className={cn(cls, r.status === "sold" && "opacity-55")}>{inner}</div>
                )}
              </li>
            );
          })}
        </ol>
      </Container>
    </section>
  );
}

/** The shop's reviews on a dark band: the heading and average on top, then soft rounded cards that slide sideways,
 *  moved by the arrows, by swiping, or gently on their own until a buyer points at them. Hidden until the shop has
 *  reviews. */
export function ReviewBoard({ s }: { s: Record<string, string> }) {
  const { store, editing } = useSite();
  const reviews = (store.reviews || []).filter((r) => r.status === "approved" && r.comment).slice(0, 12);
  const track = React.useRef<HTMLDivElement>(null);
  const paused = React.useRef(false);
  const step = React.useCallback((dir: number) => {
    const el = track.current;
    if (!el) return;
    const card = el.firstElementChild as HTMLElement | null;
    const by = card ? card.offsetWidth + 16 : el.clientWidth * 0.8;
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
    if (dir > 0 && atEnd) el.scrollTo({ left: 0, behavior: "smooth" });
    else el.scrollBy({ left: dir * by, behavior: "smooth" });
  }, []);
  // slide on by itself every few seconds, unless the buyer is pointing at or touching the cards
  React.useEffect(() => {
    if (editing || reviews.length < 2) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setInterval(() => {
      if (!paused.current) step(1);
    }, 4500);
    return () => window.clearInterval(t);
  }, [editing, reviews.length, step]);

  if (!reviews.length) {
    return editing ? (
      <Container className="py-10">
        <div className="m-muted rounded-2xl bg-[var(--m-panel)] p-8 text-center text-[length:calc(13px*var(--m-scale))]">Your customers&apos; reviews show here once you have some.</div>
      </Container>
    ) : null;
  }
  const avg = reviews.reduce((t, r) => t + r.rating, 0) / reviews.length;
  const summary = (s.summary || "{n} reviews").split("{n}").join(String(reviews.length)).split("{avg}").join(avg.toFixed(1));
  const arrow = "flex h-11 w-11 min-h-0 items-center justify-center rounded-full border border-white/25 text-white transition-colors hover:border-white hover:bg-white hover:text-[var(--m-text)]";
  return (
    <section className="t-review-board overflow-hidden bg-[var(--m-text)] py-[clamp(52px,7vw,112px)] text-white">
      <Container>
        <div className="mb-[clamp(24px,3.4vw,48px)] flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            {s.label && <p className="text-[length:calc(11.5px*var(--m-scale))] font-semibold uppercase tracking-[0.18em] text-white/60">{s.label}</p>}
            <h2 className="m-h t-title mt-2 !text-white">
              <Lines text={s.heading} />
            </h2>
            <p className="mt-3 flex items-center gap-2.5 text-[length:calc(13px*var(--m-scale))] text-white/70">
              <Stars value={avg} className="text-[#F2C14E]" />
              {summary}
            </p>
          </div>
          <div className="flex gap-2">
            <button type="button" aria-label="Previous reviews" onClick={() => step(-1)} className={arrow}>
              <ArrowLeft className="h-4 w-4" />
            </button>
            <button type="button" aria-label="Next reviews" onClick={() => step(1)} className={arrow}>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </Container>
      <div
        ref={track}
        onMouseEnter={() => (paused.current = true)}
        onMouseLeave={() => (paused.current = false)}
        onTouchStart={() => (paused.current = true)}
        className="t-review-track m-scroll m-stagger flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-[var(--g)] pb-2 scroll-px-[var(--g)]"
      >
        {reviews.map((r) => {
          const p = store.products.find((x) => x.id === r.productId);
          return (
            <figure key={r.id} className="t-review-card flex w-[82%] shrink-0 snap-start flex-col rounded-[22px] bg-white/[0.07] p-[clamp(20px,2.4vw,30px)] ring-1 ring-white/10 transition-colors hover:bg-white/[0.11] sm:w-[340px]">
              <Stars value={r.rating} className="text-[#F2C14E]" />
              <blockquote className="mt-4 flex-1 text-[length:calc(16px*var(--m-scale))] leading-relaxed text-white/90">&ldquo;{r.comment}&rdquo;</blockquote>
              <figcaption className="mt-6 flex items-center gap-3 border-t border-white/10 pt-4">
                {p?.images?.[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.images[0]} alt="" loading="lazy" className="h-11 w-11 shrink-0 rounded-full object-cover" />
                ) : (
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--m-accent)] text-[length:calc(14px*var(--m-scale))] font-semibold">{r.customerName.charAt(0).toUpperCase()}</span>
                )}
                <span className="min-w-0">
                  <span className="block truncate text-[length:calc(14px*var(--m-scale))] font-semibold">{r.customerName}</span>
                  <span className="block truncate text-[length:calc(12px*var(--m-scale))] text-white/55">
                    {r.verifiedPurchase && s.verifiedLabel ? `${s.verifiedLabel}${p ? " · " : ""}` : ""}
                    {p && (
                      <MLink to={`/products/${p.slug || p.id}`} className="min-h-0 hover:text-white">
                        {p.title}
                      </MLink>
                    )}
                  </span>
                </span>
              </figcaption>
            </figure>
          );
        })}
      </div>
    </section>
  );
}

/** The studio's story as two photos pinned up like tilted prints, taped at the top with a handwritten caption,
 *  beside a short letter that ends with a signature and a link. */
export function StudioPrints({ s }: { s: Record<string, string> }) {
  const prints = [
    { image: s.image, caption: s.caption },
    { image: s.image2, caption: s.caption2 },
  ].filter((p) => p.image);
  if (!prints.length && !s.text) return null;
  return (
    <section className="t-prints overflow-hidden py-[clamp(56px,8vw,128px)]">
      <Container className="grid items-center gap-[clamp(40px,6vw,96px)] md:grid-cols-[1.05fr_1fr]">
        {prints.length > 0 && (
          <div className="t-prints-board relative mx-auto h-[clamp(390px,112vw,450px)] w-full max-w-[560px] md:h-[clamp(470px,46vw,600px)]">
            {prints.map((p, i) => (
              <figure
                key={i}
                style={{ "--n": i } as React.CSSProperties}
                className={cn(
                  // the first print lies on top, so the second one's corner tucks under it and both captions stay readable
                  "t-print absolute w-[54%] bg-white p-[clamp(8px,1vw,14px)] pb-0 shadow-[0_24px_50px_-24px_rgb(0_0_0/0.45)] transition-transform duration-500 hover:z-10 hover:rotate-0 hover:scale-[1.03] md:w-[56%]",
                  i === 0 ? "left-[2%] top-0 z-[2] rotate-[-5deg]" : "bottom-0 right-[2%] z-[1] rotate-[5deg]",
                  prints.length === 1 && "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                )}
              >
                <span aria-hidden className="t-print-tape absolute -top-3 left-1/2 h-6 w-20 -translate-x-1/2 rotate-[-3deg]" />
                <span className="block aspect-[4/5] overflow-hidden bg-[var(--m-panel)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.image} alt={p.caption || ""} loading="lazy" className="h-full w-full object-cover" />
                </span>
                <figcaption className="t-print-caption flex min-h-[clamp(40px,4.4vw,58px)] items-center justify-center px-2 text-center text-[length:calc(clamp(13px,1.3vw,17px)*var(--m-scale))] text-[#3a2c26]">
                  {p.caption}
                </figcaption>
              </figure>
            ))}
          </div>
        )}
        <div className="t-prints-letter max-w-lg">
          {s.label && <p className="text-[length:calc(11.5px*var(--m-scale))] font-semibold uppercase tracking-[0.18em] text-[var(--m-accent)]">{s.label}</p>}
          <h2 className="m-h t-title mt-3">
            <Lines text={s.heading} />
          </h2>
          {s.text && <p className="mt-6 text-[length:calc(clamp(16px,1.4vw,19px)*var(--m-scale))] leading-relaxed">{s.text}</p>}
          {s.text2 && <p className="m-muted mt-4 text-[length:calc(14.5px*var(--m-scale))] leading-relaxed">{s.text2}</p>}
          {s.signature && (
            <p className="t-print-caption mt-8 flex items-center gap-3 text-[length:calc(clamp(18px,1.7vw,22px)*var(--m-scale))] text-[var(--m-accent)]">
              <span aria-hidden className="h-px w-10 bg-current" />
              {s.signature}
            </p>
          )}
          {s.linkLabel && (
            <MLink to={s.linkUrl || "/pages/about"} className="mt-8 inline-flex items-center gap-2 border-b-2 border-current pb-1 text-[length:calc(12px*var(--m-scale))] font-semibold uppercase tracking-[0.08em] text-[var(--m-accent)] transition-[gap] hover:gap-3">
              {s.linkLabel} <ArrowRight className="h-4 w-4" />
            </MLink>
          )}
        </div>
      </Container>
    </section>
  );
}
