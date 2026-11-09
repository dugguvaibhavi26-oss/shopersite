import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Clock, LifeBuoy, Mail } from "lucide-react";
import { LegalShell } from "@/components/legal/legal-shell";
import { DocsSearch } from "@/components/resources/docs-search";
import { JsonLd } from "@/components/resources/blocks";
import { DOC_ICONS, GuideCard, StartBand } from "@/components/resources/parts";
import { DOC_BY_SLUG, DOC_CATEGORIES, DOCS, POPULAR_DOCS, docsIn } from "@/lib/resources/docs";
import { GUIDES } from "@/lib/resources/guides";
import { SITE_URL, breadcrumbLd, searchIndex } from "@/lib/resources";

export const metadata: Metadata = {
  title: "Help Center — set up and run your online shop | Shopersite",
  description:
    "Step-by-step guides for Shopersite sellers: create your shop, add products, take payments with COD and Razorpay, ship with Shiprocket, design your website and grow sales.",
  alternates: { canonical: "/docs" },
  openGraph: {
    title: "Shopersite Help Center",
    description: "Everything you need to set up and run your online shop, step by step.",
    url: `${SITE_URL}/docs`,
    type: "website",
  },
};

export default function DocsHome() {
  const popular = POPULAR_DOCS.map((s) => DOC_BY_SLUG[s]).filter(Boolean);
  const guides = GUIDES.filter((g) => g.featured).slice(0, 3);

  return (
    <LegalShell>
      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Help Center", path: "/docs" }])} />

      {/* hero */}
      <section className="relative overflow-hidden border-b border-neutral-200 bg-[radial-gradient(90%_70%_at_50%_0%,#f4f4f5_0%,#ffffff_70%)]">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.035)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(70%_60%_at_50%_0%,#000_30%,transparent_80%)]" />
        <div className="relative mx-auto max-w-3xl px-4 pb-16 pt-16 text-center sm:px-6 sm:pb-20 sm:pt-24">
          <span className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1 text-[12px] font-medium text-neutral-600">
            <LifeBuoy className="h-3.5 w-3.5" /> Shopersite Help Center
          </span>
          <h1 className="mt-5 text-[38px] font-semibold leading-[1.05] tracking-[-0.03em] text-neutral-950 sm:text-[56px]">How can we help?</h1>
          <p className="mx-auto mt-4 max-w-xl text-[16px] leading-relaxed text-neutral-500 sm:text-[17px]">
            {DOCS.length} step-by-step guides to set up your shop, take orders and grow — written for Indian sellers.
          </p>
          <div className="mx-auto mt-8 max-w-xl">
            <DocsSearch entries={searchIndex()} />
          </div>
          <p className="mt-4 text-[13px] text-neutral-400">
            Popular:{" "}
            {["online-payments-razorpay", "ship-with-shiprocket", "policy-pages"].map((s, i) => (
              <span key={s}>
                {i > 0 && " · "}
                <Link href={`/docs/${s}`} className="text-neutral-600 underline decoration-neutral-300 underline-offset-2 hover:text-neutral-950">
                  {DOC_BY_SLUG[s].title.replace(/ with .*/, "")}
                </Link>
              </span>
            ))}
          </p>
        </div>
      </section>

      {/* topics */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-[26px] font-semibold tracking-[-0.02em] text-neutral-950 sm:text-[32px]">Browse by topic</h2>
            <p className="mt-1.5 text-[15px] text-neutral-500">Pick a topic to see every article in it.</p>
          </div>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {DOC_CATEGORIES.map((c) => {
            const Icon = DOC_ICONS[c.icon];
            const list = docsIn(c.id);
            return (
              <div key={c.id} id={c.id} className="group flex scroll-mt-28 flex-col rounded-[22px] border border-neutral-200 bg-white p-6 transition-all duration-300 hover:border-neutral-300 hover:shadow-[0_24px_50px_-34px_rgba(0,0,0,0.35)]">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-neutral-950 text-white">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-[17px] font-semibold text-neutral-950">{c.title}</h3>
                    <p className="text-[12.5px] text-neutral-400">{list.length} articles</p>
                  </div>
                </div>
                <p className="mt-3 text-[14px] leading-relaxed text-neutral-500">{c.text}</p>
                <ul className="mt-4 space-y-1 border-t border-neutral-100 pt-4">
                  {list.slice(0, 4).map((d) => (
                    <li key={d.slug}>
                      <Link href={`/docs/${d.slug}`} className="flex items-center justify-between gap-2 rounded-lg py-1.5 text-[14px] text-neutral-700 hover:text-neutral-950">
                        <span className="truncate">{d.title}</span>
                        <ArrowRight className="h-3.5 w-3.5 shrink-0 text-neutral-300 transition-colors group-hover:text-neutral-500" />
                      </Link>
                    </li>
                  ))}
                </ul>
                {list.length > 4 && (
                  <Link href={`/docs/${list[0].slug}`} className="mt-3 text-[13px] font-semibold text-neutral-950 hover:underline">
                    All {list.length} articles
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* popular */}
      <section className="border-y border-neutral-200 bg-neutral-50/70">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1fr_2fr]">
          <div>
            <h2 className="text-[26px] font-semibold tracking-[-0.02em] text-neutral-950 sm:text-[32px]">Most read</h2>
            <p className="mt-2 max-w-sm text-[15px] leading-relaxed text-neutral-500">The articles new sellers open first. Start here and you'll be taking orders today.</p>
          </div>
          <ol className="grid gap-3 sm:grid-cols-2">
            {popular.map((d, i) => (
              <li key={d.slug}>
                <Link href={`/docs/${d.slug}`} className="group flex h-full gap-4 rounded-2xl border border-neutral-200 bg-white p-5 transition-colors hover:border-neutral-950">
                  <span className="text-[22px] font-semibold tabular-nums text-neutral-300 group-hover:text-neutral-950">{String(i + 1).padStart(2, "0")}</span>
                  <span className="min-w-0">
                    <span className="block text-[15px] font-semibold text-neutral-950">{d.title}</span>
                    <span className="mt-1 line-clamp-2 block text-[13.5px] leading-relaxed text-neutral-500">{d.summary}</span>
                    <span className="mt-2 inline-flex items-center gap-1 text-[12px] text-neutral-400">
                      <Clock className="h-3 w-3" /> {d.minutes} min
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* guides */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-[26px] font-semibold tracking-[-0.02em] text-neutral-950 sm:text-[32px]">Learn to sell more</h2>
            <p className="mt-1.5 text-[15px] text-neutral-500">In-depth guides on pricing, shipping, marketing and growth.</p>
          </div>
          <Link href="/explore" className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-neutral-950 hover:underline">
            All guides <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {guides.map((g) => (
            <GuideCard key={g.slug} guide={g} />
          ))}
        </div>
      </section>

      {/* contact */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        <div className="flex flex-col items-start gap-5 rounded-[22px] border border-neutral-200 p-6 sm:flex-row sm:items-center sm:p-8">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-neutral-100">
            <Mail className="h-5 w-5 text-neutral-700" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-[18px] font-semibold text-neutral-950">Still stuck?</h2>
            <p className="mt-1 text-[14.5px] text-neutral-500">Ask Roxy inside your dashboard for an instant answer, or write to us and a person will reply.</p>
          </div>
          <Link href="/legal/contact" className="inline-flex h-11 items-center rounded-full bg-neutral-950 px-5 text-[14px] font-semibold text-white hover:bg-black">
            Contact support
          </Link>
        </div>
      </section>

      <StartBand />
    </LegalShell>
  );
}
