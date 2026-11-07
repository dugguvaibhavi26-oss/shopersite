import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { siteConfig } from "@/lib/config/site";

/**
 * ShoperSite's own legal pages (for sellers using the platform). Each shop writes its own buyer
 * policies in Dashboard → Policies. These are a plain-language starting point; have them checked
 * by a lawyer before relying on them.
 */

const NAME = "ShoperSite";
const UPDATED = "7 November 2026";
const EMAIL = siteConfig.supportEmail;

type Doc = { title: string; intro: string; sections: [string, string][] };

const DOCS: Record<string, Doc> = {
  terms: {
    title: "Seller Terms of Service",
    intro: `These terms are an agreement between you (the seller) and Roxten Studios Pvt Ltd, which runs ${NAME} ("we"), when you create or run a shop on ${siteConfig.domain}. By creating a shop you accept them.`,
    sections: [
      ["Your account", "You must be 18 or older and give true details (name, phone, email, UPI ID). Keep your password private; you're responsible for everything done from your account. Tell us at once if you think someone else has access."],
      ["Your shop", `You are the seller of everything in your shop. ${NAME} provides the software: storefront, dashboard and checkout. We are not a party to sales between you and your buyers, and we don't hold, pool or settle your money. Buyers pay you directly to your own UPI ID, bank account or payment gateway account.`],
      ["Your responsibilities", "You must describe products honestly, honour the prices you show, ship what you sell, and publish your own terms, return/refund, shipping and privacy policies. You're responsible for your taxes (including GST where it applies), licences, and following the Consumer Protection (E-Commerce) Rules, 2020, the Legal Metrology rules and other laws that apply to your business."],
      ["What you can't sell", "See our Acceptable Use Policy. We may hide products or suspend a shop that breaks it, sells counterfeit goods, or gets repeated fraud complaints."],
      ["Buyer data", "Buyer details you receive through your shop are only for fulfilling and supporting their orders, and for marketing only to buyers who subscribed. You must protect them and delete them when no longer needed, as required by the Digital Personal Data Protection Act, 2023."],
      ["Plans and payment", "Paid plans are billed in advance for the period you choose. Prices include applicable taxes unless shown otherwise. If a plan isn't renewed, your shop moves to the Free plan and features beyond it switch off; your data stays. See the Refund Policy for refunds."],
      ["Content", "You keep ownership of your photos, text and brand. You give us permission to host and show them to run your shop. Don't upload anything you don't have the right to use."],
      ["Suspension and closing", "You can close your shop at any time. We may suspend or close a shop that breaks these terms or the law, puts buyers at risk, or doesn't pay for a paid plan, and we'll tell you why when we can."],
      ["Liability", `${NAME} is provided "as is". We work to keep it secure and available, but we can't promise it will never be interrupted. To the extent the law allows, our total liability to you is limited to what you paid us in the 3 months before the claim.`],
      ["Changes and law", "We may update these terms and will tell you about important changes in your dashboard. These terms are governed by the laws of India, and Indian courts have jurisdiction."],
      ["Contact", `Questions or complaints: ${EMAIL}. Our Grievance Officer replies within 48 hours and resolves complaints within one month.`],
    ],
  },
  privacy: {
    title: "Privacy Policy",
    intro: `This policy explains how ${NAME} handles personal data of sellers using the platform and of buyers shopping on shops built with it, under India's Digital Personal Data Protection Act, 2023.`,
    sections: [
      ["Sellers: what we collect", "Your name, email, phone, UPI ID, shop details, plan and payment references, and basic device information needed for sign-in and security."],
      ["Buyers: what we process", `When you order from a shop on ${NAME}, the shop (the seller) decides how your details are used. We store your name, phone, email, address and order details on the seller's behalf so they can deliver your order. Read the shop's own privacy policy too.`],
      ["Why we use it", "To create and run accounts and shops, process orders, show order status, prevent fraud and abuse, provide support, send service messages, and meet legal obligations. We don't sell personal data."],
      ["Who we share it with", "Cloud hosting (Google Firebase and Vercel), email delivery, and payment gateways a seller chooses to connect, only as needed to provide the service. We may share data when the law requires it."],
      ["Security", "Data is sent over HTTPS and stored with access rules so that a shop's orders can only be read by that shop's owner. Passwords are handled by Google Firebase Authentication and never stored by us. Email passwords are stored encrypted."],
      ["How long we keep it", "While your account is open, and afterwards only as long as the law requires (for example for tax records)."],
      ["Your rights", `You can ask to access, correct or delete your data, or withdraw consent, by writing to ${EMAIL}. Buyers should first contact the shop they ordered from. We respond within 30 days.`],
      ["Cookies", "We use only what's needed to keep you signed in, remember your bag and settings, and keep the service secure."],
      ["Contact", `Grievance Officer, ${NAME}: ${EMAIL}.`],
    ],
  },
  refunds: {
    title: "Plan Refund & Cancellation Policy",
    intro: `This policy covers payments sellers make to ${NAME} for plans and themes. Refunds for things buyers bought from a shop are handled by that shop under its own policy.`,
    sections: [
      ["Cancelling a plan", "You can cancel from Dashboard → Subscription at any time. Your plan stays active until the end of the period you paid for and is not renewed. Nothing is charged automatically."],
      ["Refunds", "If you were charged by mistake, paid twice, or your payment was received but your plan wasn't switched on within 24 hours, write to us within 7 days and we'll refund the full amount to your original payment method within 5–7 working days."],
      ["Partly used periods", "We don't refund the unused part of a period after a plan has been switched on, except where the law requires it."],
      ["Themes", "Bought themes stay yours. A theme purchase can be refunded within 7 days if it couldn't be used because of a fault on our side."],
      ["Contact", `${EMAIL}`],
    ],
  },
  "acceptable-use": {
    title: "Acceptable Use Policy",
    intro: `To keep buyers safe, shops on ${NAME} may not sell or promote:`,
    sections: [
      ["Illegal or restricted goods", "Drugs and drug paraphernalia, weapons and ammunition, explosives, prescription medicines without a licence, tobacco and e-cigarettes, alcohol, wildlife products, and anything banned under Indian law."],
      ["Fakes and stolen goods", "Counterfeit or replica branded goods, pirated content, stolen goods, or products infringing someone else's trademark or copyright."],
      ["Harmful content", "Adult or sexual content, hate speech, content that promotes violence, gambling, or misleading health claims."],
      ["Financial products and scams", "Cryptocurrency, investment schemes, loans, lottery, chain/MLM schemes, fake reviews, or collecting payment for goods you don't intend to deliver."],
      ["Misuse of the platform", "Pretending to be another business, phishing, sending spam, attacking or overloading the service, or trying to get around plan limits or security."],
      ["What happens", `We may hide products, suspend or close shops that break this policy, and report illegal activity to the authorities. Report a shop to ${EMAIL}.`],
    ],
  },
};

export function generateStaticParams() {
  return Object.keys(DOCS).map((doc) => ({ doc }));
}

export async function generateMetadata({ params }: { params: Promise<{ doc: string }> }): Promise<Metadata> {
  const { doc } = await params;
  const d = DOCS[doc];
  return { title: d ? `${d.title} · ${NAME}` : NAME };
}

export default async function LegalPage({ params }: { params: Promise<{ doc: string }> }) {
  const { doc } = await params;
  const d = DOCS[doc];
  if (!d) notFound();
  return (
    <main className="min-h-screen bg-white px-4 py-10 text-neutral-900 font-[Inter,sans-serif] sm:py-16">
      <article className="mx-auto max-w-2xl">
        <Link href="/" className="text-sm font-semibold text-neutral-500 hover:text-black">
          ← {NAME}
        </Link>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight [font-family:inherit]">{d.title}</h1>
        <p className="mt-2 text-sm text-neutral-500">Last updated {UPDATED}</p>
        <p className="mt-6 leading-relaxed text-neutral-700">{d.intro}</p>
        <div className="mt-8 space-y-7">
          {d.sections.map(([h, t], i) => (
            <section key={h}>
              <h2 className="text-base font-semibold [font-family:inherit]">
                {i + 1}. {h}
              </h2>
              <p className="mt-2 leading-relaxed text-neutral-700">{t}</p>
            </section>
          ))}
        </div>
        <nav className="mt-12 flex flex-wrap gap-x-5 gap-y-2 border-t border-neutral-200 pt-6 text-sm">
          {Object.entries(DOCS).map(([id, x]) => (
            <Link key={id} href={`/legal/${id}`} className={id === doc ? "font-semibold text-black" : "text-neutral-500 hover:text-black"}>
              {x.title}
            </Link>
          ))}
        </nav>
      </article>
    </main>
  );
}
