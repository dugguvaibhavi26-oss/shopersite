"use client";

import * as React from "react";
import { ArrowUpRight } from "lucide-react";
import type { SitePage } from "@/lib/site-content";
import { useSite } from "./context";
import { Container, MLink } from "./ui";

/**
 * Mono Studio's own About page, unlike any other theme's: a huge outlined title over a black-and-white photo strip,
 * a numbered manifesto, and a black band with a garment tag listing what the clothes are made of. Its words are
 * Mono Studio settings ("About page").
 */
export function MonoAbout({ page }: { page: SitePage }) {
  const { content, store } = useSite();
  const o = content.options;
  const [lead, ...rest] = page.body.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const points = [1, 2, 3, 4].map((n) => ({ title: o[`aboutPoint${n}Title`], text: o[`aboutPoint${n}Text`] })).filter((x) => x.title);
  const tag = [1, 2, 3, 4, 5].map((n) => ({ label: o[`aboutTag${n}Label`], value: o[`aboutTag${n}Value`] })).filter((x) => x.label && x.value);

  return (
    <div className="t-about t-about-mono pb-[clamp(48px,7vw,110px)]">
      {/* the title huge and outlined, the photo in black and white under it */}
      <Container className="pt-[clamp(28px,5vw,72px)]">
        {o.aboutEyebrow && <p className="m-cap text-[length:calc(11px*var(--m-scale))] font-semibold tracking-[0.22em] opacity-60">{o.aboutEyebrow}</p>}
        <h1 className="m-h m-display t-mono-outline mt-3 [overflow-wrap:anywhere]">{page.title}</h1>
      </Container>
      {page.image && (
        <div className="t-mono-strip relative mt-[clamp(16px,2.4vw,32px)] aspect-[16/10] overflow-hidden bg-[var(--m-panel)] sm:aspect-[21/8]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={page.image} alt="" className="absolute inset-0 h-full w-full object-cover grayscale" />
        </div>
      )}
      {lead && (
        <Container className="pt-[clamp(28px,4vw,56px)]">
          <p className="max-w-3xl text-[length:calc(clamp(18px,2vw,28px)*var(--m-scale))] font-medium leading-snug">{lead}</p>
        </Container>
      )}

      {/* the manifesto: numbered points between rules */}
      {points.length > 0 && (
        <Container className="pt-[clamp(48px,7vw,104px)]">
          {o.aboutPointsHeading && <h2 className="m-h t-section mb-[clamp(16px,2.4vw,32px)]">{o.aboutPointsHeading}</h2>}
          <ol className="m-stagger grid border-t border-[var(--m-text)] sm:grid-cols-2">
            {points.map((x, i) => (
              <li key={i} className="m-line border-b py-[clamp(18px,2.6vw,36px)] sm:odd:border-r sm:odd:pr-[clamp(16px,3vw,48px)] sm:even:pl-[clamp(16px,3vw,48px)]">
                <span className="m-h m-display block text-[length:calc(clamp(30px,3.4vw,48px)*var(--m-scale))] leading-none">{String(i + 1).padStart(2, "0")}</span>
                <p className="m-cap mt-4 text-[length:calc(14px*var(--m-scale))] font-semibold tracking-[0.06em]">{x.title}</p>
                {x.text && <p className="m-muted mt-2 text-[length:calc(14px*var(--m-scale))] leading-relaxed">{x.text}</p>}
              </li>
            ))}
          </ol>
        </Container>
      )}

      {/* a black band with the garment tag beside the rest of the story */}
      {(tag.length > 0 || rest.length > 0) && (
        <section className="mt-[clamp(48px,7vw,104px)] bg-[var(--m-text)] py-[clamp(44px,6vw,96px)] text-[var(--m-bg)]">
          <Container className="grid items-center gap-[clamp(28px,5vw,80px)] md:grid-cols-[0.8fr_1.2fr]">
            {tag.length > 0 && (
              <div className="t-garment-tag relative mx-auto w-full max-w-[300px] bg-[var(--m-bg)] px-6 pb-7 pt-12 text-[var(--m-text)]">
                <span aria-hidden className="absolute left-1/2 top-4 h-3.5 w-3.5 -translate-x-1/2 rounded-full border-2 border-[var(--m-text)]" />
                <p className="m-h m-display text-center text-[length:calc(18px*var(--m-scale))]">{store.name}</p>
                <dl className="mt-5 border-t border-dashed border-[var(--m-text)]">
                  {tag.map((x, i) => (
                    <div key={i} className="flex items-baseline justify-between gap-3 border-b border-dashed border-[color-mix(in_srgb,var(--m-text)_35%,transparent)] py-2.5">
                      <dt className="m-cap text-[length:calc(10.5px*var(--m-scale))] tracking-[0.14em] opacity-60">{x.label}</dt>
                      <dd className="text-right text-[length:calc(13px*var(--m-scale))] font-semibold">{x.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
            {rest.length > 0 && (
              <div className="space-y-5">
                {rest.map((p, i) => (
                  <p key={i} className={i === 0 ? "text-[length:calc(clamp(18px,1.9vw,26px)*var(--m-scale))] font-medium leading-snug" : "whitespace-pre-line text-[length:calc(15px*var(--m-scale))] leading-relaxed opacity-70"}>
                    {p}
                  </p>
                ))}
              </div>
            )}
          </Container>
        </section>
      )}

      {/* the way back to the shop: one big outlined link */}
      {o.aboutCtaHeading && (
        <Container className="pt-[clamp(48px,7vw,104px)]">
          <MLink to="/catalog" className="group m-line flex items-center justify-between gap-6 border-y py-[clamp(20px,3vw,40px)]">
            <span className="m-h m-display t-mono-cta">{o.aboutCtaHeading}</span>
            <ArrowUpRight className="h-[clamp(28px,4vw,56px)] w-[clamp(28px,4vw,56px)] shrink-0 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" strokeWidth={1.4} />
          </MLink>
        </Container>
      )}
    </div>
  );
}
