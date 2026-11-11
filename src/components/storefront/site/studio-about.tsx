"use client";

import * as React from "react";
import { ArrowRight } from "lucide-react";
import type { SitePage } from "@/lib/site-content";
import { useSite } from "./context";
import { Container, MLink } from "./ui";

/**
 * Theme 07's own About page, unlike any other theme's: the title big beside an arched photo with a turning maker's
 * mark, the story in two columns, the studio's years on a line, its numbers, values on glaze test tiles and a way
 * back to the shop. Its words are Theme 07 settings ("About page").
 */

const GLAZES = ["#C8391F", "#E9B949", "#8FB3C9", "#7C8B6A"];

export function StudioAbout({ page }: { page: SitePage }) {
  const { content, store } = useSite();
  const o = content.options;
  const [lead, ...rest] = page.body.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const stats = [1, 2, 3].map((n) => ({ value: o[`aboutStat${n}Value`], label: o[`aboutStat${n}Label`] })).filter((x) => x.value);
  const years = [1, 2, 3, 4].map((n) => ({ value: o[`aboutYear${n}Value`], title: o[`aboutYear${n}Title`], text: o[`aboutYear${n}Text`] })).filter((x) => x.value && x.title);
  const values = [1, 2, 3].map((n) => ({ title: o[`aboutValue${n}Title`], text: o[`aboutValue${n}Text`] })).filter((x) => x.title);
  const stamp = (o.aboutStamp || `${store.name} · handmade ·`).toUpperCase();
  const id = React.useId().replace(/:/g, "");

  return (
    <div className="t-about t-about-studio pb-[clamp(48px,7vw,110px)]">
      {/* the title big beside an arched photo, a maker's mark turning where they meet */}
      <Container className="grid items-end gap-8 pt-[clamp(28px,5vw,72px)] md:grid-cols-[1.1fr_1fr] md:gap-12">
        <div className="order-2 md:order-1 md:pb-6">
          {o.aboutEyebrow && <p className="text-[length:calc(11.5px*var(--m-scale))] font-semibold uppercase tracking-[0.18em] text-[var(--m-accent)]">{o.aboutEyebrow}</p>}
          <h1 className="m-h m-display t-studio-title mt-3 text-[var(--m-accent)] [overflow-wrap:anywhere]">{page.title}</h1>
          {lead && <p className="mt-6 max-w-lg text-[length:calc(clamp(15px,1.4vw,19px)*var(--m-scale))] leading-relaxed">{lead}</p>}
        </div>
        <div className="relative order-1 md:order-2">
          <div className="t-studio-arch m-panel relative aspect-[4/5] overflow-hidden" style={{ borderRadius: "999px 999px 0 0" }}>
            {page.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={page.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
            )}
          </div>
          <svg viewBox="0 0 200 200" aria-hidden className="t-studio-stamp absolute -bottom-10 -left-6 h-[clamp(108px,12vw,150px)] w-[clamp(108px,12vw,150px)] text-[var(--m-accent)] md:-left-14">
            <defs>
              <path id={`ring-${id}`} d="M100,100 m-74,0 a74,74 0 1,1 148,0 a74,74 0 1,1 -148,0" />
            </defs>
            <circle cx="100" cy="100" r="98" fill="var(--m-bg)" />
            <circle cx="100" cy="100" r="96" fill="none" stroke="currentColor" strokeWidth="2" />
            <text fill="currentColor" fontSize="17" fontWeight="700" letterSpacing="3">
              <textPath href={`#ring-${id}`}>{`${stamp} ${stamp}`.slice(0, 64)}</textPath>
            </text>
            <circle cx="100" cy="100" r="30" fill="currentColor" />
          </svg>
        </div>
      </Container>

      {/* the rest of the story in two columns, the first letter big */}
      {rest.length > 0 && (
        <Container className="grid gap-6 pt-[clamp(72px,9vw,140px)] md:grid-cols-[1fr_3fr] md:gap-14">
          <p className="text-[length:calc(11.5px*var(--m-scale))] font-semibold uppercase tracking-[0.18em] opacity-60">{o.aboutStoryLabel || "The story"}</p>
          <div className="t-studio-story gap-10 space-y-5 text-[length:calc(16px*var(--m-scale))] leading-relaxed md:columns-2 md:space-y-0">
            {rest.map((p, i) => (
              <p key={i} className="whitespace-pre-line md:mb-5">
                {p}
              </p>
            ))}
          </div>
        </Container>
      )}

      {/* the studio's years on a line, each marked by a glaze dot */}
      {years.length > 0 && (
        <Container className="pt-[clamp(56px,8vw,120px)]">
          <ol className="t-studio-years relative grid gap-8 border-l-2 border-[color-mix(in_srgb,var(--m-text)_15%,transparent)] pl-7 md:grid-cols-4 md:gap-6 md:border-l-0 md:border-t-2 md:pl-0 md:pt-8">
            {years.map((y, i) => (
              <li key={i} className="relative" style={{ "--n": i } as React.CSSProperties}>
                <span aria-hidden className="absolute -left-[37px] top-1 h-4 w-4 rounded-full ring-4 ring-[var(--m-bg)] md:-top-[41px] md:left-0" style={{ background: GLAZES[i % GLAZES.length] }} />
                <span className="m-h block text-[length:calc(clamp(28px,3vw,44px)*var(--m-scale))] leading-none text-[var(--m-accent)]">{y.value}</span>
                <span className="m-h mt-3 block text-[length:calc(16px*var(--m-scale))]">{y.title}</span>
                {y.text && <span className="m-muted mt-1.5 block text-[length:calc(13px*var(--m-scale))] leading-relaxed">{y.text}</span>}
              </li>
            ))}
          </ol>
        </Container>
      )}

      {/* the numbers side by side on the panel colour */}
      {stats.length > 0 && (
        <section className="mt-[clamp(56px,8vw,120px)] bg-[var(--m-panel)]">
          <Container className="grid divide-y divide-[color-mix(in_srgb,var(--m-text)_14%,transparent)] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {stats.map((x, i) => (
              <div key={i} className="flex items-baseline gap-4 py-[clamp(22px,3.4vw,48px)] sm:flex-col sm:items-start sm:gap-2 sm:px-[clamp(16px,2.4vw,36px)]">
                <span className="m-h m-display text-[length:calc(clamp(40px,5vw,76px)*var(--m-scale))] leading-none text-[var(--m-accent)]">{x.value}</span>
                {x.label && <span className="text-[length:calc(13.5px*var(--m-scale))] leading-snug">{x.label}</span>}
              </div>
            ))}
          </Container>
        </section>
      )}

      {/* values on glaze test tiles: a dipped colour band on top of each */}
      {values.length > 0 && (
        <Container className="pt-[clamp(56px,8vw,120px)]">
          {o.aboutValuesHeading && <h2 className="m-h t-section mb-[clamp(20px,3vw,40px)]">{o.aboutValuesHeading}</h2>}
          <div className="m-stagger grid gap-4 sm:grid-cols-3">
            {values.map((v, i) => (
              <div key={i} className="t-test-tile m-line relative overflow-hidden border">
                <span aria-hidden className="block h-[clamp(64px,7vw,96px)]" style={{ background: GLAZES[(i + 1) % GLAZES.length] }} />
                <div className="p-[clamp(18px,2.2vw,28px)]">
                  <span className="text-[length:calc(11px*var(--m-scale))] font-semibold tabular-nums opacity-50">{String(i + 1).padStart(2, "0")}</span>
                  <p className="m-h mt-2 text-[length:calc(clamp(17px,1.6vw,21px)*var(--m-scale))]">{v.title}</p>
                  {v.text && <p className="m-muted mt-2 text-[length:calc(13.5px*var(--m-scale))] leading-relaxed">{v.text}</p>}
                </div>
              </div>
            ))}
          </div>
        </Container>
      )}

      {/* the way back to the shop */}
      {o.aboutCtaHeading && (
        <Container className="pt-[clamp(56px,8vw,120px)]">
          <div className="flex flex-col items-start justify-between gap-6 bg-[var(--m-accent)] px-[clamp(20px,4vw,56px)] py-[clamp(32px,5vw,64px)] text-[var(--m-accent-text)] md:flex-row md:items-center">
            <h2 className="m-h m-display t-section max-w-xl !text-[var(--m-accent-text)]">{o.aboutCtaHeading}</h2>
            <MLink to="/catalog" className="inline-flex h-12 shrink-0 items-center gap-2 bg-[var(--m-accent-text)] px-7 text-[length:calc(12.5px*var(--m-scale))] font-semibold uppercase tracking-[0.06em] text-[var(--m-accent)] transition-[gap] hover:gap-3">
              {o.aboutCtaButton || "Shop now"}
              <ArrowRight className="h-4 w-4" />
            </MLink>
          </div>
        </Container>
      )}
    </div>
  );
}
