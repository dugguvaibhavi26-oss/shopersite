import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, CalendarDays, Compass } from "lucide-react";
import { LegalShell } from "@/components/legal/legal-shell";
import { DocsSearch } from "@/components/resources/docs-search";
import { JsonLd } from "@/components/resources/blocks";
import { GUIDE_ICONS, GuideCard, RESOURCE_LINKS, StartBand } from "@/components/resources/parts";
import { GUIDE_CATEGORIES, GUIDES } from "@/lib/resources/guides";
import { MONTHS, SELLING_MOMENTS } from "@/lib/resources/festivals";
import { SITE_URL, breadcrumbLd, searchIndex } from "@/lib/resources";

// the "coming up" list follows the calendar
export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Explore — guides to start and grow your online shop in India | Shopersite",
  description:
    "Free guides for Indian online sellers: how to start an online store, sell on Instagram and WhatsApp, price products, cut COD returns, ship, handle GST, and plan festival sales.",
  alternates: { canonical: "/explore" },
  openGraph: {
    title: "Explore — guides for Indian online sellers",
    description: "Start, sell more and grow: practical guides, tools and a festival selling calendar.",
    url: `${SITE_URL}/explore`,
    type: "website",
  },
};

const CATEGORY_TEXT: Record<string, string> = {
  Start: "From idea to your first orders.",
  "Sell more": "Photos, pricing and words that convert.",
  Marketing: "Bring buyers in and bring them back.",
  Operations: "Payments, shipping and taxes, sorted.",
  Trends: "What Indian shoppers are buying.",
  Compare: "Pick the right way to sell.",
};

export default function ExploreHome() {
  const featured = GUIDES.filter((g) => g.featured);
  const lead = featured[0];
  const side = featured.slice(1, 3);
  const month = new Date().getMonth() + 1;
  const upcoming = [...SELLING_MOMENTS].sort((a, b) => ((a.month - month + 12) % 12) - ((b.month - month + 12) % 12)).slice(0, 4);

  return (
    <LegalShell>
      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Explore", path: "/explore" }])} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Explore — guides for Indian online sellers",
          url: `${SITE_URL}/explore`,
          hasPart: GUIDES.map((g) => ({ "@type": "Article", headline: g.title, url: `${SITE_URL}/explore/${g.slug}` })),
        }}
      />

      {/* hero */}
      <section className="border-b border-neutral-200">
        <div className="mx-auto max-w-7xl px-4 pb-14 pt-14 sm:px-6 sm:pb-16 sm:pt-20">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-neutral-200 px-3 py-1 text-[12px] font-medium text-neutral-600">
              <Compass className="h-3.5 w-3.5" /> Explore
            </span>
            <h1 className="mt-5 text-[40px] font-semibold leading-[1.02] tracking-[-0.035em] text-neutral-950 sm:text-[64px]">
              Grow your online shop,
              <br className="hidden sm:block" /> <span className="text-neutral-400">one guide at a time.</span>
            </h1>
            <p className="mt-5 max-w-xl text-[16px] leading-relaxed text-neutral-500 sm:text-[18px]">
              Practical, no-fluff guides for Indian sellers — starting up, pricing, payments, shipping, marketing and festival sales.
            </p>
            <div className="mt-8 max-w-xl">
              <DocsSearch entries={searchIndex()} placeholder="Search guides and help articles" />
            </div>
          </div>
          <nav aria-label="Guide topics" className="mt-10 flex flex-wrap gap-2">
            {GUIDE_CATEGORIES.map((c) => {
              const Icon = GUIDE_ICONS[c];
              return (
                <a key={c} href={`#${c.toLowerCase().replace(/\s+/g, "-")}`} className="inline-flex h-10 items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 text-[14px] font-medium text-neutral-700 transition-colors hover:border-neutral-950 hover:text-neutral-950">
                  <Icon className="h-4 w-4" /> {c}
                </a>
              );
            })}
          </nav>
        </div>
      </section>

      {/* start here */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-neutral-400">Start here</h2>
        <div className="mt-5 grid gap-5 lg:grid-cols-[1.6fr_1fr]">
          {lead && <GuideCard guide={lead} wide />}
          <div className="grid gap-5">
            {side.map((g) => (
              <Link key={g.slug} href={`/explore/${g.slug}`} className="group flex flex-col justify-between rounded-[22px] border border-neutral-200 p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-[0_24px_50px_-30px_rgba(0,0,0,0.35)]">
                <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-neutral-400">{g.category}</span>
                <span className="mt-3 block text-[19px] font-semibold leading-snug tracking-[-0.01em] text-neutral-950">{g.title}</span>
                <span className="mt-2 line-clamp-2 block text-[14px] leading-relaxed text-neutral-500">{g.summary}</span>
                <span className="mt-4 inline-flex items-center gap-1 text-[13px] font-semibold text-neutral-950">
                  Read · {g.minutes} min <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* tools, calendar, help */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-4 md:grid-cols-3">
          {RESOURCE_LINKS.map((r) => (
            <Link key={r.href} href={r.href} className="group flex items-center gap-4 rounded-[22px] bg-neutral-100/80 p-5 transition-colors hover:bg-neutral-950 hover:text-white">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-neutral-950 shadow-sm">
                <r.icon className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[16px] font-semibold">{r.title}</span>
                <span className="block text-[13.5px] text-neutral-500 group-hover:text-white/60">{r.text}</span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 opacity-40 transition-transform group-hover:translate-x-0.5 group-hover:opacity-100" />
            </Link>
          ))}
        </div>
      </section>

      {/* coming up */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-[26px] font-semibold tracking-[-0.02em] text-neutral-950 sm:text-[32px]">Coming up to sell for</h2>
            <p className="mt-1.5 text-[15px] text-neutral-500">Start planning about six weeks before each one.</p>
          </div>
          <Link href="/explore/festival-calendar" className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-neutral-950 hover:underline">
            Full calendar <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {upcoming.map((m) => (
            <div key={m.id} className="flex flex-col rounded-[22px] border border-neutral-200 p-5">
              <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
                <CalendarDays className="h-3.5 w-3.5" /> {MONTHS[m.month - 1]}
              </span>
              <span className="mt-3 text-[17px] font-semibold leading-snug text-neutral-950">{m.name}</span>
              <span className="mt-1 text-[13px] text-neutral-500">{m.when}</span>
              <span className="mt-4 text-[13.5px] leading-relaxed text-neutral-600">{m.idea}</span>
            </div>
          ))}
        </div>
      </section>

      {/* every guide, by topic */}
      <div className="border-t border-neutral-200 bg-neutral-50/60">
        <div className="mx-auto max-w-7xl space-y-16 px-4 py-16 sm:px-6 sm:py-20">
          {GUIDE_CATEGORIES.map((c) => {
            const list = GUIDES.filter((g) => g.category === c);
            if (!list.length) return null;
            const Icon = GUIDE_ICONS[c];
            return (
              <section key={c} id={c.toLowerCase().replace(/\s+/g, "-")} className="scroll-mt-28">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-950 text-white">
                    <Icon className="h-[18px] w-[18px]" />
                  </span>
                  <div>
                    <h2 className="text-[22px] font-semibold tracking-[-0.015em] text-neutral-950">{c}</h2>
                    <p className="text-[14px] text-neutral-500">{CATEGORY_TEXT[c]}</p>
                  </div>
                </div>
                <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {list.map((g) => (
                    <GuideCard key={g.slug} guide={g} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>

      <div className="pt-16">
        <StartBand title="Put these guides to work" text="Create your shop free, add your products and take your first order today." />
      </div>
    </LegalShell>
  );
}
