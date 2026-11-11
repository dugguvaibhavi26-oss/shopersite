import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, Minus } from "lucide-react";
import { LegalShell } from "@/components/legal/legal-shell";
import { Faqs, JsonLd, Rich } from "@/components/resources/blocks";
import { Breadcrumbs, StartBand } from "@/components/resources/parts";
import { LANDING_ICONS, LANDINGS, type Landing } from "@/lib/landings";
import { GUIDE_BY_SLUG } from "@/lib/resources/guides";
import { DOC_BY_SLUG } from "@/lib/resources/docs";
import { PLATFORM_PLANS, priceAfterTrial, trialLength } from "@/lib/plans";
import { SITE_URL, breadcrumbs } from "@/lib/seo";
import { faqLd } from "@/lib/resources";

/**
 * One SEO landing page: explains the product for a specific search intent before asking anyone to
 * sign up. Everything renders on the server; screenshots are real storefront themes.
 */

const rupees = (p: number) => `₹${Math.round(p / 100)}`;

function Screens({ shots }: { shots: { src: string; alt: string }[] }) {
  const [a, b] = shots;
  return (
    <div className="relative mx-auto w-full max-w-[560px] pb-10 lg:pb-0">
      <figure className="overflow-hidden rounded-[18px] border border-neutral-200 bg-white shadow-[0_40px_80px_-40px_rgba(0,0,0,0.45)]">
        <div className="flex items-center gap-1.5 border-b border-neutral-100 bg-neutral-50 px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-neutral-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-neutral-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-neutral-300" />
          <span className="ml-3 truncate rounded-md bg-white px-2.5 py-0.5 text-[11px] text-neutral-500 ring-1 ring-neutral-200">yourbrand.shopersite.in</span>
        </div>
        <Image src={a.src} alt={a.alt} width={1200} height={750} priority sizes="(min-width: 1024px) 560px, 100vw" className="h-auto w-full" />
      </figure>
      {b && (
        <figure className="absolute -bottom-2 -left-4 hidden w-[46%] overflow-hidden rounded-[14px] border border-neutral-200 bg-white shadow-[0_30px_60px_-30px_rgba(0,0,0,0.5)] sm:block lg:-bottom-10 lg:-left-10">
          <Image src={b.src} alt={b.alt} width={1200} height={750} sizes="260px" className="h-auto w-full" />
        </figure>
      )}
    </div>
  );
}

/** What's free and what's paid, straight from the plan settings — so it's always accurate. */
export function PlanFacts() {
  const free = PLATFORM_PLANS.free;
  const growth = PLATFORM_PLANS.starter;
  const pro = PLATFORM_PLANS.pro;
  const rows: [string, boolean | string, boolean | string, boolean | string][] = [
    ["Price", "₹0 forever", ...[growth, pro].map((p) => (p.trialDays ? `${trialLength(p.trialDays)} free, then ${priceAfterTrial(p)}` : priceAfterTrial(p))) as [string, string]],
    ["Products", `Up to ${free.maxProducts}`, `Up to ${growth.maxProducts}`, "Unlimited"],
    ["Your own shop address (yourbrand.shopersite.in)", true, true, true],
    ["Cash on delivery", true, true, true],
    ["Online payments (UPI, cards) via Razorpay", false, true, true],
    ["WhatsApp order messages", true, true, true],
    ["Coupons, reviews, abandoned-cart recovery", false, true, true],
    ["Shiprocket shipping and bulk CSV upload", false, true, true],
    ["Your own domain (www.yourbrand.com)", false, false, true],
    ["GST invoices, no Shopersite branding", false, false, true],
  ];
  const cell = (v: boolean | string) =>
    typeof v === "string" ? <span className="text-[13.5px] font-medium text-neutral-800">{v}</span> : v ? <Check className="mx-auto h-4 w-4 text-neutral-950" aria-label="Included" /> : <Minus className="mx-auto h-4 w-4 text-neutral-300" aria-label="Not included" />;
  return (
    <div className="overflow-x-auto rounded-[22px] border border-neutral-200 bg-white">
      <table className="w-full min-w-[620px] border-collapse text-left">
        <caption className="sr-only">What each Shopersite plan includes</caption>
        <thead>
          <tr className="border-b border-neutral-200 bg-neutral-50">
            <th className="px-5 py-3.5 text-[13px] font-medium text-neutral-500">Feature</th>
            {[free, growth, pro].map((p) => (
              <th key={p.id} className="px-3 py-3.5 text-center text-[14px] font-semibold text-neutral-950">
                {p.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(([k, a, b, c]) => (
            <tr key={k} className="border-b border-neutral-100 last:border-0">
              <th scope="row" className="px-5 py-3 text-[14px] font-normal text-neutral-700">
                {k}
              </th>
              <td className="px-3 py-3 text-center">{cell(a)}</td>
              <td className="px-3 py-3 text-center">{cell(b)}</td>
              <td className="px-3 py-3 text-center">{cell(c)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function LandingPage({ page }: { page: Landing }) {
  const others = (page.related || []).map((s) => LANDINGS.find((l) => l.slug === s)).filter(Boolean) as Landing[];
  const reads = [...(page.guides || []).map((s) => GUIDE_BY_SLUG[s] && { href: `/explore/${s}`, title: GUIDE_BY_SLUG[s].title, kind: "Guide" }), ...(page.docs || []).map((s) => DOC_BY_SLUG[s] && { href: `/docs/${s}`, title: DOC_BY_SLUG[s].title, kind: "Help" })].filter(Boolean) as { href: string; title: string; kind: string }[];

  return (
    <LegalShell>
      <JsonLd data={breadcrumbs([{ name: "Home", path: "/" }, { name: page.crumb, path: `/${page.slug}` }])} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: page.metaTitle,
          description: page.metaDescription,
          url: `${SITE_URL}/${page.slug}`,
          inLanguage: "en-IN",
          isPartOf: { "@id": `${SITE_URL}/#website` },
          about: { "@id": `${SITE_URL}/#software` },
        }}
      />
      {page.faqs.length > 0 && <JsonLd data={faqLd(page.faqs)} />}

      {/* hero */}
      <section className="relative overflow-hidden border-b border-neutral-200 bg-[radial-gradient(70%_60%_at_100%_0%,#f4f4f5_0%,#ffffff_70%)]">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 pb-14 pt-10 sm:px-6 sm:pb-20 sm:pt-14 lg:grid-cols-[1.05fr_1fr]">
          <div>
            <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: page.crumb }]} />
            <p className="mt-6 text-[13px] font-semibold uppercase tracking-[0.14em] text-neutral-500">{page.kicker}</p>
            <h1 className="mt-3 text-[38px] font-semibold leading-[1.04] tracking-[-0.035em] text-neutral-950 sm:text-[56px]">{page.h1}</h1>
            <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-neutral-600 sm:text-[18px]">{page.lead}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/register" className="inline-flex h-12 items-center gap-2 rounded-full bg-neutral-950 px-6 text-[15px] font-semibold text-white transition-colors hover:bg-black">
                {page.cta || "Create your free store"} <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#how-it-works" className="inline-flex h-12 items-center rounded-full border border-neutral-300 bg-white px-6 text-[15px] font-semibold text-neutral-900 transition-colors hover:border-neutral-950">
                See how it works
              </a>
            </div>
            <ul className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-[13.5px] text-neutral-600">
              {["Free plan, ₹0 forever", "No credit card needed", "No coding"].map((t) => (
                <li key={t} className="inline-flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-emerald-600" /> {t}
                </li>
              ))}
            </ul>
          </div>
          <Screens shots={page.shots} />
        </div>
      </section>

      {/* intro */}
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
        <h2 className="text-[28px] font-semibold leading-tight tracking-[-0.02em] text-neutral-950 sm:text-[36px]">{page.introTitle}</h2>
        <div className="mt-5 space-y-4 text-[17px] leading-[1.75] text-neutral-600">
          {page.intro.map((p, i) => (
            <p key={i}>
              <Rich text={p} />
            </p>
          ))}
        </div>
      </section>

      {/* features */}
      <section className="border-y border-neutral-200 bg-neutral-50/70">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
          <h2 className="max-w-2xl text-[28px] font-semibold leading-tight tracking-[-0.02em] text-neutral-950 sm:text-[36px]">{page.featuresTitle}</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {page.features.map((f) => {
              const Icon = LANDING_ICONS[f.icon];
              return (
                <div key={f.title} className="rounded-[22px] border border-neutral-200 bg-white p-6">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-neutral-950 text-white">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 text-[17px] font-semibold text-neutral-950">{f.title}</h3>
                  <p className="mt-1.5 text-[14.5px] leading-relaxed text-neutral-600">
                    <Rich text={f.text} />
                  </p>
                  {f.plan && <p className="mt-3 text-[12px] font-medium text-neutral-400">{f.plan}</p>}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* how it works */}
      <section id="how-it-works" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-16 sm:px-6 sm:py-20">
        <h2 className="text-[28px] font-semibold leading-tight tracking-[-0.02em] text-neutral-950 sm:text-[36px]">{page.stepsTitle}</h2>
        <ol className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {page.steps.map((s, i) => (
            <li key={s.title} className="relative rounded-[22px] border border-neutral-200 p-6">
              <span className="text-[13px] font-semibold tabular-nums text-neutral-400">Step {i + 1}</span>
              <h3 className="mt-2 text-[17px] font-semibold text-neutral-950">{s.title}</h3>
              <p className="mt-1.5 text-[14.5px] leading-relaxed text-neutral-600">
                <Rich text={s.text} />
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* extra section unique to the page */}
      {page.extra && (
        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 sm:pb-20">
          <div className="grid gap-10 rounded-[28px] bg-neutral-950 p-8 text-white sm:p-12 lg:grid-cols-[1fr_1.2fr]">
            <div>
              <h2 className="text-[26px] font-semibold leading-tight tracking-[-0.02em] sm:text-[32px]">{page.extra.title}</h2>
              <p className="mt-3 text-[15.5px] leading-relaxed text-white/60">{page.extra.text}</p>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2">
              {page.extra.items.map((it) => (
                <li key={it.title} className="rounded-2xl border border-white/10 p-4">
                  <p className="text-[15px] font-semibold">{it.title}</p>
                  <p className="mt-1 text-[13.5px] leading-relaxed text-white/60">{it.text}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* plans */}
      <section className="mx-auto max-w-5xl px-4 pb-16 sm:px-6 sm:pb-20">
        <h2 className="text-[28px] font-semibold leading-tight tracking-[-0.02em] text-neutral-950 sm:text-[34px]">{page.plansTitle || "What's free, and what's paid"}</h2>
        <p className="mt-3 max-w-2xl text-[16px] leading-relaxed text-neutral-600">
          The Free plan is genuinely free — no trial clock and no card. Paid plans add online payments, marketing tools and your own domain when you need them. Payment and shipping partners bill their own fees.
        </p>
        <div className="mt-8">
          <PlanFacts />
        </div>
      </section>

      {/* faqs */}
      {page.faqs.length > 0 && (
        <section className="mx-auto max-w-3xl px-4 pb-16 sm:px-6 sm:pb-20">
          <h2 className="mb-6 text-[28px] font-semibold leading-tight tracking-[-0.02em] text-neutral-950 sm:text-[34px]">Questions sellers ask</h2>
          <Faqs faqs={page.faqs} />
        </section>
      )}

      {/* keep exploring */}
      <section className="border-t border-neutral-200 bg-neutral-50/60">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2">
          {others.length > 0 && (
            <div>
              <h2 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-neutral-400">Also on Shopersite</h2>
              <ul className="mt-4 space-y-2">
                {others.map((o) => (
                  <li key={o.slug}>
                    <Link href={`/${o.slug}`} className="group flex items-center justify-between gap-3 rounded-2xl border border-neutral-200 bg-white px-5 py-4 hover:border-neutral-950">
                      <span>
                        <span className="block text-[15px] font-semibold text-neutral-950">{o.crumb}</span>
                        <span className="block text-[13.5px] text-neutral-500">{o.cardText}</span>
                      </span>
                      <ArrowRight className="h-4 w-4 shrink-0 text-neutral-400 group-hover:text-neutral-950" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {reads.length > 0 && (
            <div>
              <h2 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-neutral-400">Read next</h2>
              <ul className="mt-4 space-y-2">
                {reads.map((r) => (
                  <li key={r.href}>
                    <Link href={r.href} className="group flex items-center justify-between gap-3 rounded-2xl border border-neutral-200 bg-white px-5 py-4 hover:border-neutral-950">
                      <span className="min-w-0">
                        <span className="block text-[12px] font-medium text-neutral-400">{r.kind}</span>
                        <span className="block text-[15px] font-semibold text-neutral-950">{r.title}</span>
                      </span>
                      <ArrowRight className="h-4 w-4 shrink-0 text-neutral-400 group-hover:text-neutral-950" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      <div className="pt-16">
        <StartBand title={page.bandTitle || "Build your online store for free"} text="Free plan, ₹0 forever. No credit card. Your shop is live in minutes." />
      </div>
    </LegalShell>
  );
}
