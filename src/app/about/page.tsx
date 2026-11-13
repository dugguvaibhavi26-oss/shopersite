import Link from "next/link";
import type { Metadata } from "next";
import { LegalShell } from "@/components/legal/legal-shell";
import { JsonLd } from "@/components/resources/blocks";
import { PlanFacts } from "@/components/seo/plan-facts";
import { getCompany } from "@/lib/legal/company-server";
import { BRAND, BRAND_ALIASES, BRAND_DEFINITION, pageMeta } from "@/lib/seo";
import { SITE_URL } from "@/lib/resources";
import { PLATFORM_PLANS } from "@/lib/plans";

/**
 * About Shopersite: what it is, who it is for, how payments work and who runs it. Only facts the
 * product and the company details (Admin → Company & legal) back up: no invented numbers or awards.
 */

export const revalidate = 3600;

export const metadata: Metadata = pageMeta({
  title: "About Shopersite: free online store builder for India",
  description: "Shopersite is a free online store builder for Indian sellers: 0% commission, cash on delivery and Razorpay payments on your own shop address.",
  path: "/about",
  kicker: "About",
});

export default async function AboutPage() {
  const company = await getCompany();
  const facts: [string, string][] = [
    ["What it is", "An online store builder. You get a shop at yourname.shopersite.in (or your own domain on Pro), with products, checkout, orders and delivery tracking."],
    ["Who it is for", "Small Indian sellers, especially people who sell on Instagram and WhatsApp today and want a proper shop of their own."],
    ["Cost", `A free plan with up to ${PLATFORM_PLANS.free.maxProducts} products, and paid Growth and Pro plans. 0% commission on sales on every plan.`],
    ["How buyers pay", "Cash on delivery on every plan. On Growth and Pro, buyers can also pay by UPI, card or net banking through the seller's own Razorpay account, settled straight to the seller's bank."],
    ["Coding needed", "None. Pick a theme, add your logo and products, and the shop is ready."],
    ["Apps", "Works in any browser, and as an Android app for sellers."],
  ];
  const contact: [string, string][] = [
    ["Company", company.legalName],
    ["Based in", company.city],
    ["Email", company.email],
    ["Address", company.address],
  ].filter(([, v]) => !!v) as [string, string][];

  return (
    <LegalShell>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "AboutPage",
          url: `${SITE_URL}/about`,
          name: `About ${BRAND}`,
          description: BRAND_DEFINITION,
          mainEntity: {
            "@type": "Organization",
            "@id": `${SITE_URL}/#organization`,
            name: BRAND,
            alternateName: BRAND_ALIASES,
            url: SITE_URL,
            description: BRAND_DEFINITION,
            areaServed: "IN",
            ...(company.legalName ? { legalName: company.legalName } : {}),
            ...(company.email ? { email: company.email, contactPoint: { "@type": "ContactPoint", contactType: "customer support", email: company.email, areaServed: "IN", availableLanguage: ["en", "hi"] } } : {}),
            ...(company.city ? { address: { "@type": "PostalAddress", addressLocality: company.city, addressCountry: "IN" } } : {}),
          },
        }}
      />

      <section className="border-b border-neutral-200 bg-neutral-50/70">
        <div className="mx-auto max-w-5xl px-4 pb-12 pt-12 sm:px-6 sm:pt-16">
          <p className="text-[13px] font-medium text-neutral-500">About</p>
          <h1 className="mt-3 max-w-3xl text-[32px] font-semibold leading-[1.1] tracking-[-0.025em] sm:text-[44px]">About Shopersite</h1>
          <p className="mt-5 max-w-3xl text-lg leading-relaxed text-neutral-700">{BRAND_DEFINITION}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/register" className="inline-flex h-11 items-center rounded-full bg-neutral-950 px-6 text-sm font-semibold text-white hover:bg-black">
              Start your free shop
            </Link>
            <Link href="/pricing" className="inline-flex h-11 items-center rounded-full border border-neutral-300 px-6 text-sm font-semibold hover:border-neutral-950">
              See pricing
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Shopersite in short</h2>
        <dl className="mt-8 divide-y divide-neutral-200 border-y border-neutral-200">
          {facts.map(([k, v]) => (
            <div key={k} className="grid gap-1 py-5 sm:grid-cols-[200px_minmax(0,1fr)] sm:gap-6">
              <dt className="text-sm font-semibold text-neutral-950">{k}</dt>
              <dd className="text-[15px] leading-relaxed text-neutral-700">{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      <PlanFacts heading="Plans" />

      <section className="mx-auto max-w-5xl px-4 pb-16 sm:px-6">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Who runs it</h2>
        <p className="mt-2 max-w-2xl text-[15px] text-neutral-600">
          {BRAND} is run from India. Questions, partnerships and press: write to us, we read every message.
        </p>
        {contact.length > 0 && (
          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            {contact.map(([k, v]) => (
              <div key={k} className="rounded-[20px] bg-neutral-50 p-5 ring-1 ring-black/[0.04]">
                <dt className="text-[13px] text-neutral-500">{k}</dt>
                <dd className="mt-1 break-words text-[15px] font-medium text-neutral-950">
                  {k === "Email" ? (
                    <a href={`mailto:${v}`} className="underline underline-offset-2">
                      {v}
                    </a>
                  ) : (
                    v
                  )}
                </dd>
              </div>
            ))}
          </dl>
        )}
        <p className="mt-6 text-sm text-neutral-500">
          More: <Link href="/legal/contact" className="underline underline-offset-2">Contact</Link> ·{" "}
          <Link href="/legal/grievance" className="underline underline-offset-2">Grievance redressal</Link> ·{" "}
          <Link href="/docs" className="underline underline-offset-2">Help centre</Link> ·{" "}
          <Link href="/explore" className="underline underline-offset-2">Guides for sellers</Link>
        </p>
      </section>
    </LegalShell>
  );
}
