import Link from "next/link";
import type { Metadata } from "next";
import { ogImage } from "@/lib/seo";
import { LegalShell } from "@/components/legal/legal-shell";
import { JsonLd } from "@/components/resources/blocks";
import { Breadcrumbs, StartBand } from "@/components/resources/parts";
import { CodCalculator, DiscountCalculator, GstCalculator, PriceCalculator } from "@/components/resources/calculators";
import { SITE_URL, breadcrumbLd } from "@/lib/resources";

export const metadata: Metadata = {
  title: "Free seller calculators: profit, GST and COD | Shopersite",
  description:
    "Free calculators for Indian online sellers: selling price and profit margin, GST, what COD returns cost you, and sale discounts.",
  keywords: ["profit margin calculator", "gst calculator india", "selling price calculator", "rto cost calculator", "discount calculator"],
  alternates: { canonical: "/explore/tools" },
  openGraph: { title: "Free calculators for online sellers", description: "Profit, GST, COD returns and discount calculators.", url: `${SITE_URL}/explore/tools`, type: "website", images: [{ url: ogImage("Free calculators for online sellers", "Seller tools"), width: 1200, height: 630 }] },
};

const TOOLS = [
  { id: "price", title: "Selling price & profit" },
  { id: "gst", title: "GST" },
  { id: "cod", title: "COD returns" },
  { id: "discount", title: "Discount" },
];

export default function ToolsPage() {
  return (
    <LegalShell>
      <JsonLd data={breadcrumbLd([{ name: "Explore", path: "/explore" }, { name: "Seller tools", path: "/explore/tools" }])} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "Shopersite seller calculators",
          url: `${SITE_URL}/explore/tools`,
          applicationCategory: "BusinessApplication",
          operatingSystem: "Any",
          offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
        }}
      />
      <header className="border-b border-neutral-200 bg-[radial-gradient(80%_80%_at_100%_0%,#d1fae5_0%,#ffffff_60%)]">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
          <Breadcrumbs items={[{ label: "Explore", href: "/explore" }, { label: "Seller tools" }]} />
          <h1 className="mt-5 max-w-3xl text-[36px] font-semibold leading-[1.05] tracking-[-0.03em] text-neutral-950 sm:text-[52px]">Free calculators for online sellers</h1>
          <p className="mt-5 max-w-2xl text-[17px] leading-relaxed text-neutral-500">Price for profit, split GST, see what COD returns really cost, and sanity-check a sale — in seconds.</p>
          <nav className="mt-7 flex flex-wrap gap-2">
            {TOOLS.map((t) => (
              <a key={t.id} href={`#${t.id}`} className="inline-flex h-10 items-center rounded-full border border-neutral-200 bg-white px-4 text-[14px] font-medium text-neutral-700 hover:border-neutral-950 hover:text-neutral-950">
                {t.title}
              </a>
            ))}
          </nav>
        </div>
      </header>
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-12 sm:px-6 sm:py-16">
        <PriceCalculator />
        <GstCalculator />
        <CodCalculator />
        <DiscountCalculator />
        <p className="px-1 text-[13px] leading-relaxed text-neutral-400">
          These are estimates to help you plan. For tax decisions, check with a chartered accountant. Learn more in{" "}
          <Link href="/explore/how-to-price-your-products" className="underline underline-offset-2 hover:text-neutral-700">
            How to price your products
          </Link>{" "}
          and{" "}
          <Link href="/explore/cod-vs-prepaid-reduce-rto" className="underline underline-offset-2 hover:text-neutral-700">
            COD vs prepaid
          </Link>
          .
        </p>
      </div>
      <StartBand />
    </LegalShell>
  );
}
