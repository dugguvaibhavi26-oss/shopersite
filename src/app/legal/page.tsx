import Link from "next/link";
import type { Metadata } from "next";
import { ArrowUpRight, FileText, Lock, ShieldCheck, ShoppingBag, Store } from "lucide-react";
import { LEGAL_DOCS, LEGAL_GROUPS, LEGAL_UPDATED } from "@/lib/legal/docs";
import { defaultCompany as company } from "@/lib/legal/company";
import { LegalShell } from "@/components/legal/legal-shell";

export const metadata: Metadata = {
  title: `Legal & policies · ${company.brand}`,
  description: "ShoperSite's terms, privacy, refund, payments, acceptable use and other policies.",
};

const GROUP_INFO: Record<(typeof LEGAL_GROUPS)[number], { icon: React.ElementType; text: string }> = {
  Core: { icon: FileText, text: "The basics that apply to everyone using ShoperSite." },
  Sellers: { icon: Store, text: "For people running a shop: plans, payments and buyer data." },
  Buyers: { icon: ShoppingBag, text: "For shoppers buying from a shop built on ShoperSite." },
  "Trust & safety": { icon: ShieldCheck, text: "What isn't allowed, and how to report a problem." },
};

export default function LegalHub() {
  return (
    <LegalShell>
      <section className="border-b border-neutral-200 bg-neutral-50/70">
        <div className="mx-auto max-w-7xl px-4 pb-14 pt-12 text-center sm:px-6 sm:pb-16 sm:pt-16">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-[14px] bg-neutral-950 text-white">
            <Lock className="h-5 w-5" />
          </span>
          <h1 className="mt-5 text-[32px] font-semibold tracking-[-0.025em] sm:text-[44px]">Legal & policies</h1>
          <p className="mx-auto mt-3 max-w-xl text-[15px] leading-relaxed text-neutral-600">
            How {company.brand} works, what we promise, and what we expect from sellers and buyers. Each policy starts with a plain-language summary.
          </p>
          <p className="mt-4 text-[13px] text-neutral-500">Last updated {LEGAL_UPDATED}</p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-14 px-4 py-12 sm:px-6 sm:py-16">
        {LEGAL_GROUPS.map((g) => {
          const Icon = GROUP_INFO[g].icon;
          return (
            <section key={g}>
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-neutral-200">
                  <Icon className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="text-[18px] font-semibold tracking-[-0.01em]">{g}</h2>
                  <p className="text-[13px] text-neutral-500">{GROUP_INFO[g].text}</p>
                </div>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {LEGAL_DOCS.filter((d) => d.group === g).map((d) => (
                  <Link
                    key={d.slug}
                    href={`/legal/${d.slug}`}
                    className="group flex flex-col rounded-[16px] border border-neutral-200 bg-white p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-neutral-950 hover:shadow-[0_20px_44px_-24px_rgba(0,0,0,0.3)]"
                  >
                    <span className="flex items-start justify-between gap-3">
                      <span className="text-[16px] font-semibold">{d.title}</span>
                      <ArrowUpRight className="h-4 w-4 shrink-0 text-neutral-400 transition-colors group-hover:text-neutral-950" />
                    </span>
                    <span className="mt-2 text-[14px] leading-relaxed text-neutral-600">{d.blurb}</span>
                    <span className="mt-4 text-[12px] text-neutral-400">{d.sections.length} sections</span>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}

        <section className="rounded-[20px] bg-neutral-950 p-6 text-white sm:p-8">
          <h2 className="text-[20px] font-semibold">Running a shop? Your buyers need your policies too.</h2>
          <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-white/60">
            These pages cover {company.brand} itself. Every shop also needs its own terms, returns, shipping and privacy pages, and a shop with none stays closed.
            Ready-to-edit templates are in Dashboard → Policies.
          </p>
          <Link href="/dashboard" className="mt-5 inline-flex h-11 items-center rounded-[12px] bg-white px-5 text-[14px] font-semibold text-neutral-950 hover:bg-neutral-100">
            Open my dashboard
          </Link>
        </section>
      </div>
    </LegalShell>
  );
}
