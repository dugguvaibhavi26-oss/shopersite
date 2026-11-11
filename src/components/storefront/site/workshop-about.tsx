"use client";

import * as React from "react";
import { ArrowRight } from "lucide-react";
import type { SitePage } from "@/lib/site-content";
import { useSite } from "./context";
import { Container, MLink } from "./ui";

/**
 * F02's own About page, unlike any other theme's: a wide photo with the title on a linen card, the workshop's spec
 * sheet beside the story, the making of a table measured along a ruler, a row of numbers and a way back to the shop.
 * Its words are F02 settings ("About page").
 */
export function WorkshopAbout({ page }: { page: SitePage }) {
  const { content } = useSite();
  const o = content.options;
  const [lead, ...rest] = page.body.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const specs = [1, 2, 3, 4, 5].map((n) => ({ label: o[`aboutSpec${n}Label`], value: o[`aboutSpec${n}Value`] })).filter((x) => x.label && x.value);
  const steps = [1, 2, 3, 4].map((n) => ({ mark: o[`aboutStep${n}Mark`], title: o[`aboutStep${n}Title`], text: o[`aboutStep${n}Text`] })).filter((x) => x.title);
  const stats = [1, 2, 3].map((n) => ({ value: o[`aboutStat${n}Value`], label: o[`aboutStat${n}Label`] })).filter((x) => x.value);

  return (
    <div className="t-about t-about-workshop pb-[clamp(48px,7vw,110px)]">
      {/* a wide photo, the title on a linen card over its lower corner */}
      <Container className="pt-[clamp(12px,2vw,28px)]">
        <div className="relative">
          <div className="t-workshop-photo m-panel relative aspect-[4/3] overflow-hidden sm:aspect-[16/8] lg:aspect-[16/7]">
            {page.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={page.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
            )}
          </div>
          <div className="t-workshop-card relative -mt-16 ml-3 mr-3 bg-[var(--m-bg)] p-[clamp(20px,3vw,44px)] shadow-[0_30px_60px_-40px_rgb(0_0_0/0.5)] sm:absolute sm:bottom-0 sm:left-0 sm:m-0 sm:w-[min(560px,58%)] sm:translate-y-1/3">
            {o.aboutEyebrow && <p className="text-[length:calc(11px*var(--m-scale))] font-semibold uppercase tracking-[0.18em] text-[var(--m-accent)]">{o.aboutEyebrow}</p>}
            <h1 className="m-h m-display mt-3 text-[length:calc(clamp(34px,4.6vw,68px)*var(--m-scale))] leading-[0.95] tracking-[-0.03em] text-[var(--m-accent)] [overflow-wrap:anywhere]">{page.title}</h1>
            {lead && <p className="mt-4 text-[length:calc(clamp(14.5px,1.25vw,17px)*var(--m-scale))] leading-relaxed">{lead}</p>}
          </div>
        </div>
      </Container>

      {/* the spec sheet beside the rest of the story */}
      {(specs.length > 0 || rest.length > 0) && (
        <Container className="grid gap-[clamp(28px,5vw,80px)] pt-[clamp(56px,11vw,180px)] md:grid-cols-[1fr_1.1fr]">
          {specs.length > 0 && (
            <div>
              {o.aboutSpecHeading && <p className="m-line border-b pb-2 text-[length:calc(11px*var(--m-scale))] font-semibold uppercase tracking-[0.18em] opacity-70">{o.aboutSpecHeading}</p>}
              <dl>
                {specs.map((x, i) => (
                  <div key={i} className="t-spec-row m-line grid grid-cols-[0.8fr_1.2fr] gap-4 border-b py-3.5" style={{ "--n": i } as React.CSSProperties}>
                    <dt className="text-[length:calc(13px*var(--m-scale))] opacity-60">{x.label}</dt>
                    <dd className="text-[length:calc(14px*var(--m-scale))] font-medium">{x.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
          {rest.length > 0 && (
            <div className="space-y-5 self-center">
              {rest.map((p, i) => (
                <p key={i} className={i === 0 ? "m-h text-[length:calc(clamp(19px,2vw,27px)*var(--m-scale))] leading-snug" : "m-muted whitespace-pre-line text-[length:calc(15.5px*var(--m-scale))] leading-relaxed"}>
                  {p}
                </p>
              ))}
            </div>
          )}
        </Container>
      )}

      {/* the making of a table, measured along a ruler */}
      {steps.length > 0 && (
        <Container className="pt-[clamp(56px,8vw,120px)]">
          {o.aboutStepsHeading && <h2 className="m-h t-section mb-[clamp(20px,3vw,36px)]">{o.aboutStepsHeading}</h2>}
          <div className="t-ruler h-7 w-full" aria-hidden />
          <ol className="grid gap-x-6 gap-y-8 pt-5 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((x, i) => (
              <li key={i} className="t-ruler-step" style={{ "--n": i } as React.CSSProperties}>
                {x.mark && <span className="text-[length:calc(11px*var(--m-scale))] font-semibold uppercase tracking-[0.14em] text-[var(--m-accent)]">{x.mark}</span>}
                <p className="m-h mt-2 text-[length:calc(clamp(17px,1.5vw,20px)*var(--m-scale))]">{x.title}</p>
                {x.text && <p className="m-muted mt-1.5 text-[length:calc(13.5px*var(--m-scale))] leading-relaxed">{x.text}</p>}
              </li>
            ))}
          </ol>
        </Container>
      )}

      {/* numbers, set between thin rules */}
      {stats.length > 0 && (
        <Container className="pt-[clamp(56px,8vw,120px)]">
          <div className="m-line grid border-y sm:grid-cols-3">
            {stats.map((x, i) => (
              <div key={i} className={i > 0 ? "m-line border-t py-[clamp(20px,3vw,40px)] sm:border-l sm:border-t-0 sm:pl-[clamp(16px,2.4vw,36px)]" : "py-[clamp(20px,3vw,40px)]"}>
                <p className="m-h m-display text-[length:calc(clamp(38px,4.6vw,68px)*var(--m-scale))] leading-none text-[var(--m-accent)]">{x.value}</p>
                {x.label && <p className="m-muted mt-2 text-[length:calc(13.5px*var(--m-scale))]">{x.label}</p>}
              </div>
            ))}
          </div>
        </Container>
      )}

      {/* the way back to the shop */}
      {o.aboutCtaHeading && (
        <Container className="pt-[clamp(56px,8vw,120px)]">
          <div className="flex flex-col items-start justify-between gap-6 bg-[var(--m-accent)] px-[clamp(20px,4vw,56px)] py-[clamp(32px,5vw,64px)] text-[var(--m-accent-text)] md:flex-row md:items-center" style={{ borderRadius: "var(--m-card)" }}>
            <h2 className="m-h t-section max-w-xl !text-[var(--m-accent-text)]">{o.aboutCtaHeading}</h2>
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
