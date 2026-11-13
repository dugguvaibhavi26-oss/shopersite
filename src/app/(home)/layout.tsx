import type { Metadata } from "next";
import { JsonLd } from "@/components/resources/blocks";
import { organizationLd, ogImage, softwareLd, websiteLd } from "@/lib/seo";
import { HOME_FAQS } from "@/lib/home-faqs";

/** The homepage's own metadata and the site-wide structured data (Organization, WebSite, SoftwareApplication). */
export const metadata: Metadata = {
  title: { absolute: "Shopersite – Free Online Store Builder for Indian Sellers" },
  description:
    "Build your online store for free with Shopersite. Add products, take orders with cash on delivery or Razorpay, and start selling online. No card needed.",
  keywords: ["free online store builder", "free ecommerce website builder", "online store builder India", "create online store for free", "website for Instagram sellers"],
  alternates: { canonical: "/" },
  openGraph: {
    title: "Shopersite – Free Online Store Builder for Indian Sellers",
    description: "Create your online store for free. Products, orders, cash on delivery and WhatsApp updates — no coding, no credit card.",
    url: "/",
    type: "website",
    siteName: "Shopersite",
    locale: "en_IN",
    images: [{ url: ogImage("Build your online store for free"), width: 1200, height: 630, alt: "Shopersite – build your online store for free" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Shopersite – Free Online Store Builder for Indian Sellers",
    description: "Create your online store for free. No coding, no credit card.",
    images: [ogImage("Build your online store for free")],
  },
};

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={organizationLd()} />
      <JsonLd data={websiteLd()} />
      <JsonLd data={softwareLd()} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: HOME_FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
        }}
      />
      {children}
    </>
  );
}
