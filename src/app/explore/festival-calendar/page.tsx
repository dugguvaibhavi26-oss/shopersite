import Link from "next/link";
import type { Metadata } from "next";
import { ogImage } from "@/lib/seo";
import { ArrowRight, Info } from "lucide-react";
import { LegalShell } from "@/components/legal/legal-shell";
import { JsonLd } from "@/components/resources/blocks";
import { Breadcrumbs, StartBand } from "@/components/resources/parts";
import { MONTHS, SELLING_MOMENTS } from "@/lib/resources/festivals";
import { SITE_URL, breadcrumbLd } from "@/lib/resources";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Festival selling calendar for Indian online shops | Shopersite",
  description:
    "Every Indian festival, gifting day and sale season in one calendar, with what sells, offer ideas and how early to plan: Diwali, Rakhi, weddings and more.",
  keywords: ["festival calendar india", "festive season sales", "diwali sale planning", "ecommerce calendar india", "marketing calendar india"],
  alternates: { canonical: "/explore/festival-calendar" },
  openGraph: { title: "Festival selling calendar for Indian online shops", description: "What sells, when to start, and offer ideas for every season.", url: `${SITE_URL}/explore/festival-calendar`, type: "article", images: [{ url: ogImage("The Indian seller's festival calendar", "Explore"), width: 1200, height: 630 }] },
};

const KIND_TONE: Record<string, string> = {
  Festival: "bg-amber-50 text-amber-800 ring-amber-200",
  "Sale season": "bg-sky-50 text-sky-800 ring-sky-200",
  "Gifting day": "bg-rose-50 text-rose-700 ring-rose-200",
  "National day": "bg-emerald-50 text-emerald-800 ring-emerald-200",
};

export default function FestivalCalendarPage() {
  const now = new Date().getMonth() + 1;
  const order = Array.from({ length: 12 }, (_, i) => ((now - 1 + i) % 12) + 1);

  return (
    <LegalShell>
      <JsonLd data={breadcrumbLd([{ name: "Explore", path: "/explore" }, { name: "Festival calendar", path: "/explore/festival-calendar" }])} />
      <header className="border-b border-neutral-200 bg-[radial-gradient(80%_80%_at_0%_0%,#fef3c7_0%,#ffffff_60%)]">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
          <Breadcrumbs items={[{ label: "Explore", href: "/explore" }, { label: "Festival calendar" }]} />
          <h1 className="mt-5 max-w-3xl text-[36px] font-semibold leading-[1.05] tracking-[-0.03em] text-neutral-950 sm:text-[52px]">The Indian seller's festival calendar</h1>
          <p className="mt-5 max-w-2xl text-[17px] leading-relaxed text-neutral-500">
            Every festival, gifting day and sale season worth planning for — what sells, a ready offer idea, and how early to start. Starting from this month.
          </p>
          <div className="mt-6 flex flex-wrap gap-2 text-[12px]">
            {Object.keys(KIND_TONE).map((k) => (
              <span key={k} className={`rounded-full px-2.5 py-1 font-medium ring-1 ${KIND_TONE[k]}`}>
                {k}
              </span>
            ))}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="mb-10 flex gap-3 rounded-2xl border border-sky-200 bg-sky-50/70 p-4 text-[14px] leading-relaxed text-sky-950 sm:p-5">
          <Info className="mt-0.5 h-[18px] w-[18px] shrink-0 text-sky-600" />
          <p>
            Many Indian festivals follow the lunar calendar, so their dates move every year. We show the usual month — check the exact date before you plan. Read the{" "}
            <Link href="/explore/festival-sales-playbook" className="font-semibold underline underline-offset-2">
              festival sales playbook
            </Link>{" "}
            for a six-week plan.
          </p>
        </div>

        <ol className="space-y-12">
          {order.map((m) => {
            const items = SELLING_MOMENTS.filter((x) => x.month === m);
            if (!items.length) return null;
            return (
              <li key={m} className="grid gap-5 md:grid-cols-[180px_minmax(0,1fr)]">
                <div className="md:sticky md:top-24 md:self-start">
                  <p className="text-[28px] font-semibold tracking-[-0.02em] text-neutral-950">{MONTHS[m - 1]}</p>
                  {m === now && <span className="mt-1 inline-block rounded-full bg-neutral-950 px-2.5 py-0.5 text-[11px] font-semibold text-white">This month</span>}
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  {items.map((it) => (
                    <article key={it.id} className="flex flex-col rounded-[22px] border border-neutral-200 bg-white p-5 sm:p-6">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${KIND_TONE[it.kind]}`}>{it.kind}</span>
                        <span className="text-[12px] text-neutral-400">Plan {it.leadWeeks} weeks ahead</span>
                      </div>
                      <h2 className="mt-3 text-[19px] font-semibold leading-snug text-neutral-950">{it.name}</h2>
                      <p className="mt-0.5 text-[13.5px] text-neutral-500">{it.when}</p>
                      <p className="mt-4 text-[12px] font-semibold uppercase tracking-[0.12em] text-neutral-400">What sells</p>
                      <ul className="mt-2 flex flex-wrap gap-1.5">
                        {it.sells.map((s) => (
                          <li key={s} className="rounded-full bg-neutral-100 px-2.5 py-1 text-[12.5px] text-neutral-700">
                            {s}
                          </li>
                        ))}
                      </ul>
                      <p className="mt-4 border-t border-neutral-100 pt-4 text-[14px] leading-relaxed text-neutral-700">
                        <span className="font-semibold text-neutral-950">Idea: </span>
                        {it.idea}
                      </p>
                    </article>
                  ))}
                </div>
              </li>
            );
          })}
        </ol>

        <div className="mt-16 grid gap-4 md:grid-cols-2">
          {[
            { href: "/explore/festival-sales-playbook", title: "Festival sales playbook", text: "The six-week plan: stock, offers, content and delivery cut-offs." },
            { href: "/docs/create-coupons", title: "Create a festival coupon", text: "Set up a code with a minimum order and an end date." },
          ].map((l) => (
            <Link key={l.href} href={l.href} className="group flex items-center justify-between gap-4 rounded-[22px] border border-neutral-200 p-6 hover:border-neutral-950">
              <span>
                <span className="block text-[17px] font-semibold text-neutral-950">{l.title}</span>
                <span className="mt-1 block text-[14px] text-neutral-500">{l.text}</span>
              </span>
              <ArrowRight className="h-5 w-5 shrink-0 text-neutral-400 transition-transform group-hover:translate-x-0.5 group-hover:text-neutral-950" />
            </Link>
          ))}
        </div>
      </div>
      <StartBand />
    </LegalShell>
  );
}
