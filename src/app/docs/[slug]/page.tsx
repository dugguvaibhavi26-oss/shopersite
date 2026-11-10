import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ogImage } from "@/lib/seo";
import { ArrowLeft, ArrowRight, ChevronDown, Clock, Sparkles } from "lucide-react";
import { LegalShell, LegalToc } from "@/components/legal/legal-shell";
import { Blocks, Faqs, JsonLd } from "@/components/resources/blocks";
import { Breadcrumbs, DOC_ICONS, PlanBadge, StartBand } from "@/components/resources/parts";
import { DocsSearch } from "@/components/resources/docs-search";
import { DOC_BY_SLUG, DOC_CATEGORIES, DOCS, docsIn } from "@/lib/resources/docs";
import { headingsOf } from "@/lib/resources/types";
import { PUBLISHER, SITE_URL, breadcrumbLd, faqLd, searchIndex } from "@/lib/resources";

export function generateStaticParams() {
  return DOCS.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const d = DOC_BY_SLUG[slug];
  if (!d) return { title: "Help Center | Shopersite" };
  return {
    title: `${d.title} | Shopersite Help Center`,
    description: d.summary,
    keywords: d.keywords,
    alternates: { canonical: `/docs/${d.slug}` },
    openGraph: { title: d.title, description: d.summary, url: `${SITE_URL}/docs/${d.slug}`, type: "article", siteName: "Shopersite", locale: "en_IN", images: [{ url: ogImage(d.title, "Help Center"), width: 1200, height: 630, alt: d.title }] },
    twitter: { card: "summary_large_image", title: d.title, description: d.summary, images: [ogImage(d.title, "Help Center")] },
  };
}

export default async function DocPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const d = DOC_BY_SLUG[slug];
  if (!d) notFound();
  const cat = DOC_CATEGORIES.find((c) => c.id === d.category)!;
  const index = DOCS.indexOf(d);
  const prev = DOCS[index - 1];
  const next = DOCS[index + 1];
  const related = (d.related || []).map((s) => DOC_BY_SLUG[s]).filter(Boolean);
  const toc = headingsOf(d.body);
  const steps = d.body.find((b) => b.type === "steps");

  const ld = [
    breadcrumbLd([
      { name: "Help Center", path: "/docs" },
      { name: cat.title, path: `/docs#${cat.id}` },
      { name: d.title, path: `/docs/${d.slug}` },
    ]),
    steps && steps.type === "steps"
      ? {
          "@context": "https://schema.org",
          "@type": "HowTo",
          name: d.title,
          description: d.summary,
          totalTime: `PT${d.minutes}M`,
          step: steps.items.map((s, i) => ({ "@type": "HowToStep", position: i + 1, name: s.title, text: s.text.replace(/\*\*(.+?)\*\*/g, "$1").replace(/\[(.+?)\]\((.+?)\)/g, "$1") })),
        }
      : {
          "@context": "https://schema.org",
          "@type": "TechArticle",
          headline: d.title,
          description: d.summary,
          url: `${SITE_URL}/docs/${d.slug}`,
          publisher: PUBLISHER,
        },
    ...(d.faqs?.length ? [faqLd(d.faqs)] : []),
  ];

  const nav = (
    <nav aria-label="Help topics" className="space-y-6">
      {DOC_CATEGORIES.map((c) => {
        const Icon = DOC_ICONS[c.icon];
        return (
          <div key={c.id}>
            <p className="mb-1.5 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
              <Icon className="h-3.5 w-3.5" /> {c.title}
            </p>
            <ul className="space-y-0.5">
              {docsIn(c.id).map((x) => (
                <li key={x.slug}>
                  <Link
                    href={`/docs/${x.slug}`}
                    aria-current={x.slug === d.slug ? "page" : undefined}
                    className={`block rounded-lg px-2.5 py-1.5 text-[13.5px] leading-snug ${x.slug === d.slug ? "bg-neutral-950 font-semibold text-white" : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950"}`}
                  >
                    {x.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </nav>
  );

  return (
    <LegalShell>
      {ld.map((x, i) => (
        <JsonLd key={i} data={x} />
      ))}
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-10 py-8 lg:grid-cols-[250px_minmax(0,1fr)] lg:py-12 xl:grid-cols-[250px_minmax(0,1fr)_220px]">
          {/* left: every topic */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 max-h-[calc(100vh-7rem)] space-y-6 overflow-y-auto pb-10 pr-2 [scrollbar-width:thin]">
              <DocsSearch entries={searchIndex()} size="sm" placeholder="Search help" />
              {nav}
            </div>
          </aside>

          {/* middle: the article */}
          <article className="min-w-0">
            <Breadcrumbs items={[{ label: "Help Center", href: "/docs" }, { label: cat.title, href: `/docs#${cat.id}` }, { label: d.title }]} />

            {/* phones: search and topics */}
            <div className="mt-5 space-y-3 lg:hidden">
              <DocsSearch entries={searchIndex()} size="sm" placeholder="Search help" />
              <details className="group rounded-xl border border-neutral-200 bg-white">
                <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-[14px] font-semibold text-neutral-950 [&::-webkit-details-marker]:hidden">
                  All help topics
                  <ChevronDown className="h-4 w-4 text-neutral-400 transition-transform group-open:rotate-180" />
                </summary>
                <div className="max-h-[60vh] overflow-y-auto border-t border-neutral-100 p-4">{nav}</div>
              </details>
            </div>

            <header className="mt-6 border-b border-neutral-200 pb-8">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-[12px] font-medium text-neutral-600">{cat.title}</span>
                <PlanBadge plan={d.plan} />
              </div>
              <h1 className="mt-4 text-[32px] font-semibold leading-[1.1] tracking-[-0.025em] text-neutral-950 sm:text-[42px]">{d.title}</h1>
              <p className="mt-4 max-w-2xl text-[17px] leading-relaxed text-neutral-500">{d.summary}</p>
              <p className="mt-4 inline-flex items-center gap-1.5 text-[13px] text-neutral-400">
                <Clock className="h-3.5 w-3.5" /> {d.minutes} min read
              </p>
            </header>

            <div className="mt-8 max-w-[720px]">
              <Blocks body={d.body} />

              {d.faqs?.length ? (
                <section className="mt-12">
                  <h2 className="mb-4 text-[22px] font-semibold tracking-[-0.015em] text-neutral-950">Questions</h2>
                  <Faqs faqs={d.faqs} />
                </section>
              ) : null}

              {related.length > 0 && (
                <section className="mt-12">
                  <h2 className="mb-4 text-[13px] font-semibold uppercase tracking-[0.12em] text-neutral-400">Related articles</h2>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {related.map((r) => (
                      <Link key={r.slug} href={`/docs/${r.slug}`} className="group rounded-2xl border border-neutral-200 p-4 transition-colors hover:border-neutral-950">
                        <span className="block text-[15px] font-semibold text-neutral-950">{r.title}</span>
                        <span className="mt-1 line-clamp-2 block text-[13.5px] leading-relaxed text-neutral-500">{r.summary}</span>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* previous / next */}
              <div className="mt-12 grid gap-3 border-t border-neutral-200 pt-8 sm:grid-cols-2">
                {prev ? (
                  <Link href={`/docs/${prev.slug}`} className="group rounded-2xl border border-neutral-200 p-4 hover:border-neutral-950">
                    <span className="inline-flex items-center gap-1 text-[12px] text-neutral-400">
                      <ArrowLeft className="h-3.5 w-3.5" /> Previous
                    </span>
                    <span className="mt-1 block text-[15px] font-semibold text-neutral-950">{prev.title}</span>
                  </Link>
                ) : (
                  <span />
                )}
                {next && (
                  <Link href={`/docs/${next.slug}`} className="group rounded-2xl border border-neutral-200 p-4 text-right hover:border-neutral-950">
                    <span className="inline-flex items-center gap-1 text-[12px] text-neutral-400">
                      Next <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                    <span className="mt-1 block text-[15px] font-semibold text-neutral-950">{next.title}</span>
                  </Link>
                )}
              </div>
            </div>
          </article>

          {/* right: on this page */}
          <aside className="hidden xl:block">
            <div className="sticky top-24 space-y-6">
              {toc.length > 1 && (
                <div>
                  <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.12em] text-neutral-400">On this page</p>
                  <LegalToc items={toc} />
                </div>
              )}
              <div className="rounded-2xl bg-neutral-950 p-5 text-white">
                <Sparkles className="h-5 w-5 text-white/70" />
                <p className="mt-3 text-[15px] font-semibold leading-snug">Try it on your own shop</p>
                <p className="mt-1 text-[13px] leading-relaxed text-white/60">Free forever plan. Live in minutes.</p>
                <Link href="/register" className="mt-4 inline-flex h-9 items-center rounded-full bg-white px-4 text-[13px] font-semibold text-neutral-950 hover:bg-neutral-200">
                  Start for free
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
      <StartBand />
    </LegalShell>
  );
}
