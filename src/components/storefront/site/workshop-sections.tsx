"use client";

import * as React from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Container, MLink } from "./ui";

/**
 * Sections first made for F02 (dining furniture), open to any theme: wood planks that open to tell each wood's
 * story, and a table sizer that draws the table and chairs from above for the number of seats picked.
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

const colourOf = (v: string | undefined, fallback: string) => (/^#[0-9a-fA-F]{3,8}$/.test((v || "").trim()) ? v!.trim() : fallback);

/** The woods a workshop uses as planks side by side; the open one widens to show its name, a note and its story. */
export function WoodPlanks({ s }: { s: Record<string, string> }) {
  const woods = [1, 2, 3, 4, 5]
    .map((n) => ({ n, name: (s[`w${n}Name`] || "").trim(), colour: colourOf(s[`w${n}Colour`], "#B98A5A"), note: s[`w${n}Note`] || "", text: s[`w${n}Text`] || "", link: s[`w${n}Link`] || "" }))
    .filter((w) => w.name);
  const [open, setOpen] = React.useState(0);
  if (!woods.length) return null;
  return (
    <section className="t-planks py-[clamp(48px,7vw,112px)]">
      <Container>
        <div className="m-line mb-[clamp(20px,3vw,40px)] grid gap-3 border-b pb-3 md:grid-cols-[1fr_1fr] md:items-end">
          <h2 className="m-h t-section">
            <Lines text={s.heading} />
          </h2>
          {s.text && <p className="m-muted max-w-md text-[length:calc(13.5px*var(--m-scale))] leading-relaxed md:justify-self-end md:text-right">{s.text}</p>}
        </div>
        <div className="t-plank-row flex flex-col gap-2 md:h-[clamp(380px,36vw,480px)] md:flex-row md:gap-3" role="tablist" aria-label={(s.heading || "Woods").replace(/\*/g, "")}>
          {woods.map((w, i) => {
            const on = i === open;
            return (
              <div
                key={w.n}
                data-open={on}
                style={{ "--wood": w.colour, "--n": i } as React.CSSProperties}
                className={cn("t-plank relative overflow-hidden text-white transition-[flex-grow,height] duration-700 [transition-timing-function:var(--ease-out)] md:basis-0", on ? "h-[300px] md:h-auto md:grow-[4]" : "h-16 md:h-auto md:grow")}
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={on}
                  onClick={() => setOpen(i)}
                  onMouseEnter={() => window.matchMedia?.("(hover: hover)").matches && setOpen(i)}
                  className="absolute inset-0 z-[1] block min-h-0 w-full cursor-pointer text-left"
                  aria-label={w.name}
                />
                {/* closed: the name along the plank */}
                <span className={cn("t-plank-name pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 whitespace-nowrap text-[length:calc(14px*var(--m-scale))] font-semibold uppercase tracking-[0.14em] transition-opacity duration-300 md:left-1/2 md:top-auto md:bottom-6 md:-translate-x-1/2 md:translate-y-0 md:[writing-mode:vertical-rl] md:rotate-180", on && "opacity-0")}>
                  {w.name}
                </span>
                {/* open: the wood's story */}
                <div className={cn("pointer-events-none absolute inset-x-0 bottom-0 z-[2] p-[clamp(18px,2.4vw,32px)] transition-[opacity,transform] duration-500", on ? "translate-y-0 opacity-100 delay-200" : "translate-y-4 opacity-0")}>
                  {w.note && <p className="text-[length:calc(11px*var(--m-scale))] font-semibold uppercase tracking-[0.16em] text-white/75">{w.note}</p>}
                  <p className="m-h mt-2 text-[length:calc(clamp(26px,3vw,44px)*var(--m-scale))] leading-none !text-white">{w.name}</p>
                  {w.text && <p className="mt-3 max-w-sm text-[length:calc(13.5px*var(--m-scale))] leading-relaxed text-white/85">{w.text}</p>}
                  {w.link && s.linkLabel && (
                    <MLink to={w.link} className="pointer-events-auto mt-4 inline-flex items-center gap-1.5 border-b border-white/70 pb-0.5 text-[length:calc(12px*var(--m-scale))] font-semibold uppercase tracking-[0.08em] hover:gap-2.5">
                      {s.linkLabel} <ArrowRight className="h-3.5 w-3.5" />
                    </MLink>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

/** Buyers pick how many people sit down; the table and chairs are drawn from above at that size, with the table's
 *  measurements, the room it needs and a link to tables that size. */
export function TableSizer({ s }: { s: Record<string, string> }) {
  const sizes = [1, 2, 3, 4]
    .map((n) => ({ n, seats: Math.min(12, Math.max(2, Math.round(Number(s[`z${n}Seats`]) || 0))), label: s[`z${n}Label`] || "", table: s[`z${n}Table`] || "", room: s[`z${n}Room`] || "", link: s[`z${n}Link`] || "" }))
    .filter((z) => z.label && Number(s[`z${z.n}Seats`]));
  const [pick, setPick] = React.useState(Math.min(1, Math.max(0, sizes.length - 1)));
  if (!sizes.length) return null;
  const z = sizes[Math.min(pick, sizes.length - 1)];
  // the drawing: a long table with chairs along both sides, and one at each end from six seats up
  const ends = z.seats >= 6 ? 2 : 0;
  const perSide = Math.ceil((z.seats - ends) / 2);
  const len = Math.min(330, 70 + perSide * 62);
  const W = 400;
  const H = 250;
  const tx = (W - len) / 2;
  const ty = 85;
  const th = 80;
  const chairs: { x: number; y: number; w: number; h: number }[] = [];
  for (let side = 0; side < 2; side++) {
    const count = side === 0 ? perSide : z.seats - ends - perSide;
    for (let i = 0; i < count; i++) {
      const cx = tx + (len / count) * (i + 0.5);
      chairs.push({ x: cx - 17, y: side === 0 ? ty - 34 : ty + th + 10, w: 34, h: 24 });
    }
  }
  if (ends) {
    chairs.push({ x: tx - 34, y: ty + th / 2 - 17, w: 24, h: 34 });
    chairs.push({ x: tx + len + 10, y: ty + th / 2 - 17, w: 24, h: 34 });
  }
  return (
    <section className="t-sizer bg-[var(--m-panel)] py-[clamp(48px,7vw,112px)]">
      <Container className="grid items-center gap-[clamp(28px,4vw,72px)] md:grid-cols-[0.9fr_1.2fr]">
        <div>
          <h2 className="m-h t-title">
            <Lines text={s.heading} />
          </h2>
          {s.text && <p className="m-muted mt-4 max-w-md text-[length:calc(14px*var(--m-scale))] leading-relaxed">{s.text}</p>}
          <div className="m-line mt-7 inline-flex border" role="tablist" aria-label="Seats">
            {sizes.map((x, i) => (
              <button
                key={x.n}
                type="button"
                role="tab"
                aria-selected={i === pick}
                onClick={() => setPick(i)}
                className={cn("m-line min-h-0 px-[clamp(12px,1.6vw,22px)] py-3 text-[length:calc(12.5px*var(--m-scale))] font-semibold transition-colors", i > 0 && "border-l", i === pick ? "bg-[var(--m-accent)] text-[var(--m-accent-text)]" : "hover:bg-[var(--m-bg)]")}
              >
                {x.label}
              </button>
            ))}
          </div>
          <dl className="m-line mt-7 grid max-w-md grid-cols-2 gap-px border bg-[color-mix(in_srgb,var(--m-text)_12%,transparent)]">
            <div className="bg-[var(--m-panel)] p-4">
              <dt className="text-[length:calc(10.5px*var(--m-scale))] font-semibold uppercase tracking-[0.14em] opacity-60">{s.sizeLabel}</dt>
              <dd className="m-h mt-1.5 text-[length:calc(clamp(17px,1.6vw,21px)*var(--m-scale))]">{z.table}</dd>
            </div>
            <div className="bg-[var(--m-panel)] p-4">
              <dt className="text-[length:calc(10.5px*var(--m-scale))] font-semibold uppercase tracking-[0.14em] opacity-60">{s.roomLabel}</dt>
              <dd className="m-h mt-1.5 text-[length:calc(clamp(17px,1.6vw,21px)*var(--m-scale))]">{z.room}</dd>
            </div>
          </dl>
          {z.link && s.linkLabel && (
            <MLink to={z.link} className="mt-6 inline-flex items-center gap-1.5 border-b-2 border-current pb-0.5 text-[length:calc(12px*var(--m-scale))] font-semibold uppercase tracking-[0.08em] text-[var(--m-accent)] hover:gap-2.5">
              {s.linkLabel.split("{seats}").join(String(z.seats))} <ArrowRight className="h-4 w-4" />
            </MLink>
          )}
        </div>
        <div className="t-sizer-plan relative bg-[var(--m-bg)] p-[clamp(12px,2vw,28px)]">
          <svg key={z.n} viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img" aria-label={`${z.label}: ${z.table}`}>
            <rect x="6" y="6" width={W - 12} height={H - 12} fill="none" stroke="currentColor" strokeOpacity="0.25" strokeDasharray="6 6" />
            {chairs.map((c, i) => (
              <rect key={i} className="t-sizer-chair" style={{ "--n": i } as React.CSSProperties} x={c.x} y={c.y} width={c.w} height={c.h} rx="6" fill="var(--m-panel)" stroke="currentColor" strokeOpacity="0.55" />
            ))}
            <rect className="t-sizer-table" x={tx} y={ty} width={len} height={th} rx="6" fill="var(--m-accent)" />
            <g stroke="currentColor" strokeOpacity="0.6" fill="none">
              <path d={`M${tx} ${ty + th + 46}H${tx + len}M${tx} ${ty + th + 40}v12M${tx + len} ${ty + th + 40}v12`} />
            </g>
            <text x={W / 2} y={ty + th + 40} textAnchor="middle" fontSize="12" fill="currentColor" fillOpacity="0.75" dy="-4">
              {z.table}
            </text>
            <text x={W / 2} y={ty + th / 2} textAnchor="middle" dominantBaseline="middle" fontSize="15" fontWeight="600" fill="var(--m-accent-text)">
              {z.seats}
            </text>
          </svg>
        </div>
      </Container>
    </section>
  );
}
