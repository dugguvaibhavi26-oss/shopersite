import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ogImage } from "@/lib/seo";
import { ArrowRight, CalendarDays, Clock } from "lucide-react";
import { LegalShell, LegalToc } from "@/components/legal/legal-shell";
import { Blocks, Faqs, JsonLd } from "@/components/resources/blocks";
import { Breadcrumbs, GuideArt, GuideCard, RESOURCE_LINKS, StartBand } from "@/components/resources/parts";
import { GUIDE_BY_SLUG, GUIDES } from "@/lib/resources/guides";
import { headingsOf } from "@/lib/resources/types";
import { PUBLISHER, SITE_URL, breadcrumbLd, faqLd } from "@/lib/resources";

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const g = GUIDE_BY_SLUG[slug];
  if (!g) return { title: "Explore | Shopersite" };
  return {
    title: `${g.title} | Shopersite`.length <= 60 ? `${g.title} | Shopersite` : g.title,
    description: g.summary,
    keywords: g.keywords,
    alternates: { canonical: `/explore/${g.slug}` },
    openGraph: { title: g.title, description: g.summary, url: `${SITE_URL}/explore/${g.slug}`, type: "article", publishedTime: g.date, modifiedTime: g.date, authors: ["Shopersite team"], siteName: "Shopersite", locale: "en_IN", images: [{ url: ogImage(g.title, "Guide"), width: 1200, height: 630, alt: g.title }] },
    twitter: { card: "summary_large_image", title: g.title, description: g.summary, images: [ogImage(g.title, "Guide")] },
  };
}

const fmt = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const g = GUIDE_BY_SLUG[slug];
  if (!g) notFound();
  const toc = headingsOf(g.body);
  const related = [
    ...(g.related || []).map((s) => GUIDE_BY_SLUG[s]).filter(Boolean),
    ...GUIDES.filter((x) => x.category === g.category && x.slug !== g.slug && !(g.related || []).includes(x.slug)),
  ].slice(0, 3);

  const ld = [
    breadcrumbLd([
      { name: "Explore", path: "/explore" },
      { name: g.category, path: `/explore#${g.category.toLowerCase().replace(/\s+/g, "-")}` },
      { name: g.title, path: `/explore/${g.slug}` },
    ]),
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: g.title,
      description: g.summary,
      datePublished: g.date,
      dateModified: g.date,
      keywords: g.keywords.join(", "),
      mainEntityOfPage: `${SITE_URL}/explore/${g.slug}`,
      author: { "@type": "Organization", name: "Shopersite" },
      publisher: PUBLISHER,
    },
    ...(g.faqs?.length ? [faqLd(g.faqs)] : []),
  ];

  return (
    <LegalShell>
      {ld.map((x, i) => (
        <JsonLd key={i} data={x} />
      ))}

      {/* header */}
      <header className="border-b border-neutral-200">
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <Breadcrumbs items={[{ label: "Explore", href: "/explore" }, { label: g.category, href: `/explore#${g.category.toLowerCase().replace(/\s+/g, "-")}` }]} />
            <h1 className="mt-5 text-[34px] font-semibold leading-[1.08] tracking-[-0.03em] text-neutral-950 sm:text-[48px]">{g.title}</h1>
            <p className="mt-5 max-w-2xl text-[17px] leading-relaxed text-neutral-500 sm:text-[18px]">{g.summary}</p>
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-neutral-500">
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" /> {g.minutes} min read
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" /> {fmt(g.date)}
              </span>
              <span>By the Shopersite team</span>
            </div>
          </div>
          <div className="hidden h-[280px] overflow-hidden rounded-[28px] border border-neutral-200 lg:block">
            <GuideArt guide={g} size="lg" />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-12 py-10 lg:grid-cols-[minmax(0,1fr)_260px] lg:py-14">
          <article className="min-w-0 max-w-[720px]">
            {/* phones: contents */}
            {toc.length > 2 && (
              <details className="group mb-8 rounded-2xl border border-neutral-200 lg:hidden">
                <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 text-[14px] font-semibold text-neutral-950 [&::-webkit-details-marker]:hidden">
                  In this guide
                  <span className="text-neutral-400 transition-transform group-open:rotate-45">+</span>
                </summary>
                <ol className="space-y-2 border-t border-neutral-100 px-5 py-4 text-[14px]">
                  {toc.map((t, i) => (
                    <li key={t.id}>
                      <a href={`#${t.id}`} className="text-neutral-600 hover:text-neutral-950">
                        <span className="tabular-nums text-neutral-400">{i + 1}.</span> {t.title}
                      </a>
                    </li>
                  ))}
                </ol>
              </details>
            )}

            <Blocks body={g.body} />

            {g.faqs?.length ? (
              <section className="mt-14">
                <h2 className="mb-4 text-[24px] font-semibold tracking-[-0.015em] text-neutral-950">Frequently asked questions</h2>
                <Faqs faqs={g.faqs} />
              </section>
            ) : null}

            {/* inline sign-up */}
            <div className="mt-14 flex flex-col items-start gap-4 rounded-[22px] border border-neutral-200 bg-neutral-50 p-6 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <p className="text-[17px] font-semibold text-neutral-950">Ready to try it?</p>
                <p className="mt-1 text-[14.5px] text-neutral-500">Create your shop free and put this guide to work today.</p>
              </div>
              <Link href="/register" className="inline-flex h-11 items-center gap-2 rounded-full bg-neutral-950 px-5 text-[14px] font-semibold text-white hover:bg-black">
                Start for free <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </article>

          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-8">
              {toc.length > 1 && (
                <div>
                  <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.12em] text-neutral-400">In this guide</p>
                  <LegalToc items={toc} />
                </div>
              )}
              <div className="space-y-2">
                <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.12em] text-neutral-400">Resources</p>
                {RESOURCE_LINKS.map((r) => (
                  <Link key={r.href} href={r.href} className="flex items-center gap-3 rounded-xl px-2 py-2 text-[13.5px] text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950">
                    <r.icon className="h-4 w-4 shrink-0" /> {r.title}
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {related.length > 0 && (
        <section className="border-t border-neutral-200 bg-neutral-50/60">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 className="text-[24px] font-semibold tracking-[-0.02em] text-neutral-950 sm:text-[28px]">Keep reading</h2>
              <Link href="/explore" className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-neutral-950 hover:underline">
                All guides <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-7 grid gap-5 md:grid-cols-3">
              {related.map((r) => (
                <GuideCard key={r.slug} guide={r} />
              ))}
            </div>
          </div>
        </section>
      )}

      <div className="pt-16">
        <StartBand />
      </div>
    </LegalShell>
  );
}
