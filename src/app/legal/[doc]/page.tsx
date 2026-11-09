import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, ArrowRight, Check, Mail } from "lucide-react";
import { LEGAL_DOCS, LEGAL_GROUPS, LEGAL_UPDATED, buildLegalDocs } from "@/lib/legal/docs";
import { defaultCompany } from "@/lib/legal/company";
import { getCompany } from "@/lib/legal/company-server";
import { LegalShell, LegalToc, PrintButton } from "@/components/legal/legal-shell";
import { LegalBlock } from "@/components/legal/legal-text";

/**
 * ShoperSite's own legal pages, laid out like the rest of the marketing site: the document list on
 * the left, the text in the middle, "On this page" on the right. Content lives in lib/legal/docs.ts.
 */

// company details edited in the admin are saved, then these pages refresh (saving also refreshes them at once)
export const revalidate = 3600;

export function generateStaticParams() {
  return LEGAL_DOCS.map((d) => ({ doc: d.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ doc: string }> }): Promise<Metadata> {
  const { doc } = await params;
  const d = LEGAL_DOCS.find((x) => x.slug === doc);
  if (!d) return { title: defaultCompany.brand };
  return { title: `${d.title} · ${defaultCompany.brand}`, description: d.blurb };
}

export default async function LegalPage({ params }: { params: Promise<{ doc: string }> }) {
  const { doc } = await params;
  if (!LEGAL_DOCS.some((x) => x.slug === doc)) notFound();
  const company = await getCompany();
  const docs = buildLegalDocs(company);
  const index = docs.findIndex((x) => x.slug === doc);
  const d = docs[index];
  const prev = docs[index - 1];
  const next = docs[index + 1];

  return (
    <LegalShell>
      {/* title band */}
      <section className="border-b border-neutral-200 bg-neutral-50/70">
        <div className="mx-auto max-w-7xl px-4 pb-10 pt-10 sm:px-6 sm:pb-12 sm:pt-14">
          <nav className="flex items-center gap-2 text-[13px] text-neutral-500" aria-label="Breadcrumb">
            <Link href="/legal" className="hover:text-neutral-950">
              Legal
            </Link>
            <span aria-hidden>/</span>
            <span className="text-neutral-950">{d.short}</span>
          </nav>
          <h1 className="mt-4 max-w-3xl text-[32px] font-semibold leading-[1.1] tracking-[-0.025em] sm:text-[44px]">{d.title}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-[13px] text-neutral-500">
            <span className="rounded-full border border-neutral-200 bg-white px-2.5 py-1 font-medium text-neutral-700">{d.group}</span>
            <span>Last updated {LEGAL_UPDATED}</span>
            <span aria-hidden>·</span>
            <span>{company.legalName}</span>
          </div>
        </div>
      </section>

      {/* phone: the document list as a scrollable row */}
      <div className="border-b border-neutral-200 lg:hidden print:hidden">
        <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-3 [scrollbar-width:none] sm:px-6">
          {LEGAL_DOCS.map((x) => (
            <Link
              key={x.slug}
              href={`/legal/${x.slug}`}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-[13px] font-medium ${
                x.slug === d.slug ? "border-neutral-950 bg-neutral-950 text-white" : "border-neutral-200 text-neutral-600"
              }`}
            >
              {x.short}
            </Link>
          ))}
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[220px_minmax(0,1fr)_220px]">
        {/* all documents */}
        <aside className="hidden lg:block print:hidden">
          <div className="sticky top-24 space-y-6">
            {LEGAL_GROUPS.map((g) => (
              <div key={g}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-400">{g}</p>
                <ul className="mt-2 space-y-0.5">
                  {LEGAL_DOCS.filter((x) => x.group === g).map((x) => (
                    <li key={x.slug}>
                      <Link
                        href={`/legal/${x.slug}`}
                        aria-current={x.slug === d.slug ? "page" : undefined}
                        className={`block rounded-[8px] px-2.5 py-1.5 text-[14px] transition-colors ${
                          x.slug === d.slug ? "bg-neutral-100 font-semibold text-neutral-950" : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-950"
                        }`}
                      >
                        {x.short}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </aside>

        {/* the document */}
        <article className="min-w-0 max-w-[720px]">
          <div className="rounded-[16px] border border-neutral-200 bg-neutral-50 p-5 sm:p-6">
            <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-neutral-500">In short</p>
            <ul className="mt-3 space-y-2.5">
              {d.summary.map((s) => (
                <li key={s} className="flex gap-3 text-[15px] leading-relaxed text-neutral-800">
                  <span className="mt-[3px] flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-neutral-950 text-white">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-[12px] text-neutral-500">This summary is for convenience. The full text below is what applies.</p>
          </div>

          <p className="mt-8 text-[16px] leading-[1.75] text-neutral-800">{d.intro}</p>

          <div className="mt-10 space-y-11">
            {d.sections.map((s, i) => (
              <section key={s.id} id={s.id} className="scroll-mt-24">
                <h2 className="flex items-baseline gap-3 text-[20px] font-semibold tracking-[-0.015em] text-neutral-950">
                  <span className="tabular-nums text-[15px] font-medium text-neutral-400">{String(i + 1).padStart(2, "0")}</span>
                  <a href={`#${s.id}`} className="hover:underline hover:decoration-neutral-300 hover:underline-offset-4">
                    {s.title}
                  </a>
                </h2>
                <div className="mt-3.5 space-y-4">
                  {s.body.map((b, j) => (
                    <LegalBlock key={j} block={b} self={d.slug} />
                  ))}
                </div>
              </section>
            ))}
          </div>

          {/* questions */}
          <div className="mt-14 flex flex-col gap-4 rounded-[16px] bg-neutral-950 p-6 text-white sm:flex-row sm:items-center sm:justify-between print:hidden">
            <div>
              <p className="text-[16px] font-semibold">Questions about this policy?</p>
              <p className="mt-1 text-[14px] text-white/60">We usually reply within one working day.</p>
            </div>
            <a
              href={`mailto:${company.email}`}
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-[12px] bg-white px-5 text-[14px] font-semibold text-neutral-950 hover:bg-neutral-100"
            >
              <Mail className="h-4 w-4" /> {company.email}
            </a>
          </div>

          {/* previous / next */}
          <nav className="mt-8 grid gap-3 sm:grid-cols-2 print:hidden">
            {prev ? (
              <Link href={`/legal/${prev.slug}`} className="group rounded-[14px] border border-neutral-200 p-4 transition-colors hover:border-neutral-950">
                <span className="flex items-center gap-1.5 text-[12px] text-neutral-500">
                  <ArrowLeft className="h-3.5 w-3.5" /> Previous
                </span>
                <span className="mt-1 block text-[15px] font-semibold">{prev.title}</span>
              </Link>
            ) : (
              <span />
            )}
            {next && (
              <Link href={`/legal/${next.slug}`} className="group rounded-[14px] border border-neutral-200 p-4 text-right transition-colors hover:border-neutral-950">
                <span className="flex items-center justify-end gap-1.5 text-[12px] text-neutral-500">
                  Next <ArrowRight className="h-3.5 w-3.5" />
                </span>
                <span className="mt-1 block text-[15px] font-semibold">{next.title}</span>
              </Link>
            )}
          </nav>
        </article>

        {/* on this page */}
        <aside className="hidden xl:block print:hidden">
          <div className="sticky top-24">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-400">On this page</p>
            <LegalToc items={d.sections.map((s) => ({ id: s.id, title: s.title }))} />
            <div className="mt-6">
              <PrintButton />
            </div>
          </div>
        </aside>
      </div>
    </LegalShell>
  );
}
