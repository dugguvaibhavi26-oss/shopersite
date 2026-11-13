/**
 * ShoperSite's own legal documents (the platform's, not a shop's: each shop writes its buyer
 * policies in Dashboard → Policies). Written to be read by sellers and buyers in plain language
 * while covering what Indian law expects of a software platform. They are not a substitute for
 * advice from a lawyer, who should review them before the business relies on them.
 */
import { courts, defaultCompany, seat, type Company } from "./company";

export const LEGAL_UPDATED = "8 November 2026";

/** A paragraph, or a bulleted list. */
export type Block = string | { list: string[] };
export interface Section {
  id: string;
  title: string;
  body: Block[];
}
export interface LegalDoc {
  slug: string;
  title: string;
  /** short name for menus */
  short: string;
  /** one line for the legal hub card */
  blurb: string;
  group: "Core" | "Sellers" | "Buyers" | "Trust & safety";
  /** "In short": 3–5 plain points shown above the full text */
  summary: string[];
  intro: string;
  sections: Section[];
}

const list = (...items: string[]): Block => ({ list: items });

/** Every document, filled with the company details saved in Admin → Company & legal. */
export function buildLegalDocs(C: Company): LegalDoc[] {
  const B = C.brand;
  const L = C.legalName;
  const E = C.email;
  const G = C.grievanceEmail || C.email;
  const D = C.domain;
  return [
  /* ------------------------------------------------------------------ */
  {
    slug: "terms",
    title: "Terms of Service",
    short: "Terms of Service",
    blurb: "The agreement for everyone who uses ShoperSite: sellers, buyers and visitors.",
    group: "Core",
    summary: [
      `${B} is software that lets sellers build and run their own online shops. We are not the seller of anything sold in those shops.`,
      "Sellers are fully responsible for their products, prices, delivery, refunds, taxes and the law that applies to their business.",
      "Money from buyers goes straight to the seller's own UPI, bank or payment-gateway account. We never hold or settle it.",
      "We can suspend shops that break the law or these terms. Our liability is limited, as set out below.",
    ],
    intro: `These Terms of Service ("Terms") are a binding agreement between you and ${L} ("${B}", "we", "us"), which operates the website ${D}, every shop address under it (such as yourshop.${D}), the ${B} mobile apps and related services (together, the "Service"). By opening, browsing, creating an account on, or using the Service in any way, you agree to these Terms and to the policies linked from them. If you don't agree, please don't use the Service.`,
    sections: [
      {
        id: "definitions",
        title: "Definitions",
        body: [
          list(
            `"Seller" means a person or business that creates a shop on ${B}.`,
            `"Buyer" means anyone who browses or orders from a shop built on ${B}.`,
            `"Shop" means a seller's online store, including its products, pages, policies and checkout.`,
            `"Seller Content" means everything a seller adds: products, photos, text, prices, logos, policies and messages.`,
            `"Policies" means our Privacy Policy, Acceptable Use Policy, Refund & Cancellation Policy, Payments Policy and the other documents listed at ${D}/legal, all of which form part of these Terms.`
          ),
        ],
      },
      {
        id: "what-we-do",
        title: `What ${B} is, and isn't`,
        body: [
          `${B} provides software: a storefront builder, themes, a seller dashboard, a checkout and order tools. We act as a technology service provider and an "intermediary" within the meaning of Section 2(1)(w) of the Information Technology Act, 2000.`,
          `${B} is not a marketplace and is not a party to any sale. Each Shop is owned and run by its Seller, who is the "seller" and the e-commerce entity for that Shop under the Consumer Protection Act, 2019 and the Consumer Protection (E-Commerce) Rules, 2020. Any contract of sale is made only between the Buyer and the Seller.`,
          "We do not own, inspect, store, pack, ship or guarantee any product, and we do not set any Seller's prices or policies.",
        ],
      },
      {
        id: "eligibility",
        title: "Who can use the Service",
        body: [
          "You must be at least 18 years old and able to enter into a binding contract under the Indian Contract Act, 1872 to create an account or open a Shop. Buyers under 18 may use a Shop only with the involvement of a parent or guardian.",
          "If you use the Service for a business, you confirm you are authorised to bind that business to these Terms.",
          "You may not use the Service if you have previously been suspended from it, or if Indian law prohibits you from doing so.",
        ],
      },
      {
        id: "accounts",
        title: "Your account",
        body: [
          "Give accurate, current and complete information when you sign up, and keep it up to date. Keep your password and sign-in methods private. You are responsible for everything done through your account, whether or not you authorised it.",
          `Tell us at ${E} straight away if you suspect someone else has access to your account. We are not liable for losses caused by unauthorised use of your account where you did not keep your credentials safe.`,
          "One person or business may run more than one Shop, but you may not create accounts to get around a suspension, a plan limit or these Terms.",
        ],
      },
      {
        id: "seller-duties",
        title: "Sellers' responsibilities",
        body: [
          "If you run a Shop, you agree that you alone are responsible for it, including:",
          list(
            "Describing products honestly and accurately, with true prices, images, quantities and all details required by law (including country of origin, MRP and seller details where the Legal Metrology (Packaged Commodities) Rules, 2011 apply).",
            "Holding every licence, registration and permission your business needs (for example GST registration, FSSAI for food, or drug licences), and paying all taxes due on your sales.",
            "Honouring the orders you accept, delivering what you sold on time and in the condition described, and handling cancellations, returns, refunds, warranties and complaints.",
            "Publishing your own terms, returns & refunds, shipping and privacy policies for your Shop. A Shop with no policy page stays closed to buyers.",
            "Complying with the Consumer Protection Act, 2019, the Consumer Protection (E-Commerce) Rules, 2020, the Digital Personal Data Protection Act, 2023, the Information Technology Act, 2000 and every other law that applies to your business.",
            "Displaying your name, contact details and grievance contact to your buyers.",
            "Not selling anything listed in our Acceptable Use Policy."
          ),
          "We may (but are not obliged to) review Shops or listings. Our not acting on something does not mean we approve of it.",
        ],
      },
      {
        id: "buyers",
        title: "Buyers",
        body: [
          `When you buy from a Shop, you buy from that Seller, not from ${B}. The Seller's own policies (shown on the Shop's pages and at checkout) govern your order, delivery, returns and refunds. See our Buyer Terms for more, including how to raise a complaint.`,
        ],
      },
      {
        id: "payments",
        title: "Payments between buyers and sellers",
        body: [
          `Buyers pay Sellers directly: by cash on delivery, or through a payment gateway account (such as Razorpay) that the Seller opens and connects in their own name. ${B} does not collect, hold, pool, escrow or settle any money paid for a Seller's products, and is not a payment aggregator or payment system operator.`,
          "Chargebacks, refunds, disputes, gateway fees, settlements and the Seller's agreement with their payment gateway are matters between the Seller, the Buyer and that gateway. Our Payments Policy has more detail.",
        ],
      },
      {
        id: "plans",
        title: "Plans, themes and fees",
        body: [
          `Creating a Shop is free. Optional paid plans (currently Growth and Pro) and premium themes are offered at the prices shown on ${D} at the time you buy. Prices are in Indian rupees and include applicable taxes unless stated otherwise.`,
          `${B} charges no commission on Sellers' sales.`,
          "Paid plans are billed monthly and renew automatically through Razorpay (card or UPI AutoPay) until you cancel. When a plan is cancelled or a payment cannot be collected, the Shop moves to the Free plan: features and limits beyond it switch off, but your Shop and data remain. Refunds are covered by our Refund & Cancellation Policy.",
          "We may change plan prices or features in the future. Changes never affect a period you have already paid for, and we will announce price changes before they apply to you.",
        ],
      },
      {
        id: "content",
        title: "Your content and our licence to use it",
        body: [
          `You keep all rights in your Seller Content. You give ${B} a worldwide, non-exclusive, royalty-free licence to host, store, copy, adapt (for example resize images), display and distribute your Seller Content only as needed to run, show and promote your Shop and the Service. The licence ends when you delete the content or your Shop, except for copies kept in backups for a limited time or as the law requires.`,
          "You confirm you own or have permission to use everything you upload, and that it doesn't infringe anyone's rights or break any law.",
          `With your permission (which you can withdraw at any time by writing to ${E}), we may show your Shop's name, logo or screenshots as an example of a ${B} shop.`,
        ],
      },
      {
        id: "our-ip",
        title: `${B}'s intellectual property`,
        body: [
          `The Service, including its software, themes, designs, logos, text and graphics (but not Seller Content), belongs to ${L} or its licensors and is protected by law. We give you a limited, personal, non-transferable, revocable right to use the Service under these Terms.`,
          "A theme you get on a plan, or buy, is licensed for use on your own Shop on the Service only. You may not copy, resell, redistribute, reverse-engineer or extract any part of the Service or its themes, or use them to build a competing product.",
        ],
      },
      {
        id: "prohibited",
        title: "Things you must not do",
        body: [
          list(
            "Break any law, or help anyone else do so.",
            "Sell or promote anything listed in the Acceptable Use Policy.",
            "Upload malware, or try to probe, scan, attack, overload or break the Service or its security, or get at data that isn't yours.",
            "Scrape, crawl or harvest the Service or other users' data by automated means without our written permission.",
            "Impersonate anyone, misrepresent your business, or create fake orders, reviews or accounts.",
            "Send spam, or use buyer contact details for anything other than their order and the marketing they agreed to.",
            "Use the Service to collect payment for goods or services you don't intend to deliver."
          ),
        ],
      },
      {
        id: "third-party",
        title: "Third-party services",
        body: [
          "The Service works with services run by others, such as Google (sign-in, hosting and analytics), Vercel (hosting), payment gateways, email providers, couriers and app stores. Your use of those services is governed by their own terms. We are not responsible for their availability, actions or charges.",
        ],
      },
      {
        id: "availability",
        title: "Availability and changes to the Service",
        body: [
          "We work hard to keep the Service secure and available, but we don't promise it will be uninterrupted, error-free or available at any particular time. We may carry out maintenance, and we may add, change or remove features.",
          "Keep your own copies of important content (such as product photos). We take regular backups, but you are responsible for keeping copies of your own material.",
        ],
      },
      {
        id: "suspension",
        title: "Suspension and termination",
        body: [
          "You may stop using the Service and close your Shop at any time.",
          "We may suspend or remove listings, close a Shop to buyers, limit features, or suspend or terminate an account, with or without notice, if we reasonably believe that it breaks these Terms or the law, puts Buyers or others at risk, harms the Service or our reputation, is the subject of repeated complaints, or if we are required to by law or by a government authority. Where the law allows and it is safe to do so, we will tell you why.",
          "When an account ends, your right to use the Service stops. Sections that by their nature should continue (including content licences already granted, payment obligations, disclaimers, limitation of liability, indemnity and governing law) survive.",
        ],
      },
      {
        id: "disclaimer",
        title: "Disclaimer of warranties",
        body: [
          `To the fullest extent the law allows, the Service is provided "as is" and "as available", without warranties of any kind, whether express or implied, including warranties of merchantability, fitness for a particular purpose, non-infringement, or that the Service will meet your needs or produce any particular sales or results.`,
          `${B} makes no promise about any Seller, product, listing, price, delivery or refund, and does not guarantee that any Seller or Buyer will complete a transaction.`,
        ],
      },
      {
        id: "liability",
        title: "Limitation of liability",
        body: [
          `To the fullest extent the law allows, ${B}, its directors, employees and partners will not be liable for any indirect, incidental, special, consequential, exemplary or punitive damages, or for any loss of profits, revenue, sales, data, goodwill or business opportunity, arising from or related to the Service, even if told such loss was possible.`,
          `${B} is not liable for any act or omission of a Seller, Buyer, payment gateway, courier or other third party, including the quality, safety, legality or delivery of any product, or any payment, refund or chargeback.`,
          `Our total liability for all claims arising from or related to the Service is limited to the greater of (a) the fees you paid to ${B} in the three months before the event giving rise to the claim, and (b) ₹1,000.`,
          "Nothing in these Terms limits liability that cannot be limited under Indian law, including for fraud.",
        ],
      },
      {
        id: "indemnity",
        title: "Indemnity",
        body: [
          `You agree to defend, indemnify and hold harmless ${L}, its directors, employees and partners from any claim, demand, loss, liability, penalty, cost or expense (including reasonable legal fees) arising from: your use of the Service; your Shop, products, Seller Content or sales; your dealings with Buyers; your breach of these Terms or the Policies; or your breach of any law or of anyone's rights.`,
        ],
      },
      {
        id: "force-majeure",
        title: "Events outside our control",
        body: [
          "We are not responsible for any delay or failure caused by events beyond our reasonable control, including natural disasters, epidemics, war, riots, government action, power or internet failures, failures of cloud, payment or telecom providers, or cyber-attacks.",
        ],
      },
      {
        id: "law",
        title: "Governing law and disputes",
        body: [
          `These Terms are governed by the laws of India. Before starting any formal proceedings, please write to us at ${E} so we can try to resolve the matter; most issues can be settled within 30 days.`,
          `If a dispute between you and ${B} isn't resolved within 30 days, it will be referred to final and binding arbitration by a sole arbitrator appointed by mutual agreement, under the Arbitration and Conciliation Act, 1996. The seat and venue will be ${seat(C)} and the language English. Subject to this, ${courts(C)} have exclusive jurisdiction.`,
          "Nothing here stops a consumer from approaching a consumer commission where the law gives them that right.",
        ],
      },
      {
        id: "general",
        title: "General",
        body: [
          list(
            "Changes: we may update these Terms. If a change is significant we will give notice on the Service or in your dashboard before it takes effect. Continuing to use the Service after that means you accept the updated Terms.",
            "Entire agreement: these Terms and the Policies are the whole agreement between you and us about the Service.",
            "Severability: if any part is found unenforceable, the rest stays in force.",
            "No waiver: if we don't enforce a right straight away, we haven't given it up.",
            "Assignment: you may not transfer your rights under these Terms without our consent. We may transfer ours as part of a merger, acquisition or sale of assets.",
            "Notices: we may send notices to the email or phone number on your account, or show them in your dashboard. Send notices to us at the address on our Contact page."
          ),
        ],
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  {
    slug: "privacy",
    title: "Privacy Policy",
    short: "Privacy Policy",
    blurb: "What personal data we collect, why, who we share it with and your rights under the DPDP Act.",
    group: "Core",
    summary: [
      "We collect only what we need to run accounts, shops and orders. We never sell personal data.",
      "For buyers' order details, the shop's seller decides how they're used; we process them on the seller's behalf.",
      "Data is stored with Google Cloud (Firebase) and Vercel, sent over HTTPS, and locked so each shop sees only its own orders.",
      `You can ask to see, correct or delete your data, or withdraw consent, by writing to ${E}.`,
    ],
    intro: `This Privacy Policy explains how ${L} ("${B}", "we") collects, uses, shares and protects personal data when you use ${D}, shops built on it, and our apps. It is written to meet the Digital Personal Data Protection Act, 2023 ("DPDP Act") and the Information Technology Act, 2000 and its rules. By using the Service you agree to the processing described here.`,
    sections: [
      {
        id: "roles",
        title: "Who is responsible for your data",
        body: [
          list(
            `For sellers' account data, and for visitors to ${D}, ${B} is the Data Fiduciary: we decide why and how that data is processed.`,
            `For buyers' order data in a shop, the shop's Seller is the Data Fiduciary. ${B} acts as a Data Processor, handling that data on the Seller's instructions to run their shop. Please read the shop's own privacy policy, and contact the Seller first about your order data.`
          ),
        ],
      },
      {
        id: "collect",
        title: "What we collect",
        body: [
          "From sellers:",
          list(
            "Name, email address, phone number and sign-in details (passwords are handled by Google Firebase Authentication; we never see or store them).",
            "Shop details: shop name, address, logo, products, policies, delivery settings and contact details you choose to show.",
            "Plan and theme purchases, payment references (such as UPI transaction IDs) and invoices.",
            "Payment-gateway connection details you give us, such as API keys. Secret keys are stored encrypted.",
            "Messages you send us, such as help requests."
          ),
          "From buyers (on behalf of the Seller):",
          list(
            "Name, phone number, email (if given), delivery address and order details.",
            "Payment references (for example a UPI reference number or a gateway payment ID). We do not receive or store card numbers, UPI PINs or net-banking passwords; these are handled by the payment gateway or your UPI app.",
            "Your bag, wishlist and saved address, kept in your own browser so they're there when you return."
          ),
          "Automatically, from everyone:",
          list(
            "Device and browser type, IP address, pages viewed, and the date and time of visits, collected through server logs and Google Analytics for Firebase.",
            "Cookies and similar storage, explained in our Cookie Policy."
          ),
        ],
      },
      {
        id: "use",
        title: "Why we use it",
        body: [
          list(
            "To create and secure accounts, and to build, host and run shops.",
            "To process, show and track orders and payments, and to send order and service messages.",
            "To provide support and respond to requests and complaints.",
            "To prevent fraud, spam and abuse, and to keep the Service secure.",
            "To understand how the Service is used so we can improve it (using aggregated or pseudonymous analytics).",
            "To send product news to sellers. You can opt out at any time.",
            "To meet legal obligations, such as tax, accounting and lawful requests from authorities."
          ),
          "We process data on the basis of your consent, or for the legitimate uses permitted by Section 7 of the DPDP Act (for example, where you have voluntarily given data for a specific purpose, or where processing is needed to comply with law).",
        ],
      },
      {
        id: "share",
        title: "Who we share it with",
        body: [
          "We never sell or rent personal data. We share it only with:",
          list(
            "The Seller of a shop you order from, so they can fulfil your order.",
            "Service providers who help us run the Service, under contracts that require them to protect the data: Google (Firebase hosting, database, authentication and analytics), Vercel (website hosting) and email delivery services.",
            "Payment gateways (such as Razorpay) that a Seller connects, to process the payments you choose to make.",
            "AI providers (Google Gemini and Groq) that power the optional assistant in the seller dashboard. When a Seller uses it, we send only what is needed to answer that request, such as product names, prices, order numbers and buyers' first names. We never send buyers' phone numbers, email addresses or delivery addresses. These providers process the data under their own terms and may use it to improve their services.",
            "Government or law-enforcement authorities, courts or regulators, when the law requires it or to protect the rights, property or safety of users, the public or us.",
            "A buyer or successor, if our business is merged or sold, who will be bound by this policy."
          ),
        ],
      },
      {
        id: "transfer",
        title: "Where data is stored",
        body: [
          "Our service providers may store and process data on servers in India or other countries. Wherever it is processed, we require the same level of protection described here, and we follow any restrictions the Government of India notifies under the DPDP Act.",
        ],
      },
      {
        id: "security",
        title: "How we protect it",
        body: [
          list(
            "All traffic is encrypted over HTTPS.",
            "Database access rules ensure a shop's orders, customers and payment records can be read only by that shop's owner and authorised platform administrators.",
            "Sensitive values, such as payment-gateway secret keys and email app passwords, are encrypted before they are stored.",
            "Access by our team is limited to those who need it."
          ),
          `No system is completely secure. If a personal data breach occurs, we will inform affected users and the Data Protection Board of India as the DPDP Act requires. Report a security concern to ${E}.`,
        ],
      },
      {
        id: "retention",
        title: "How long we keep it",
        body: [
          "We keep personal data while your account or the relevant shop is active, and after that only as long as needed for the purposes above or as the law requires (for example, tax and accounting records, typically up to 8 years). When data is no longer needed, we delete or anonymise it.",
        ],
      },
      {
        id: "rights",
        title: "Your rights",
        body: [
          "Under the DPDP Act you have the right to:",
          list(
            "Get a summary of the personal data we hold about you and how it is used.",
            "Have inaccurate or incomplete data corrected or updated.",
            "Have your data erased when it is no longer needed, unless the law requires us to keep it.",
            "Withdraw consent at any time (this doesn't affect processing already done).",
            "Nominate another person to exercise your rights if you die or become unable to.",
            "Have your grievance addressed, and then complain to the Data Protection Board of India if you aren't satisfied."
          ),
          `To use these rights, write to ${E}. Buyers asking about their order data should first contact the shop they ordered from; we will help the Seller respond. We reply within 30 days.`,
        ],
      },
      {
        id: "children",
        title: "Children",
        body: [
          `The Service is not meant for children under 18 to use on their own. We do not knowingly collect children's personal data without verifiable parental consent. If you believe a child has given us personal data, contact ${E} and we will delete it.`,
        ],
      },
      {
        id: "changes",
        title: "Changes to this policy",
        body: [
          "We may update this policy. If we make significant changes, we will tell you on the Service or by email before they take effect. The date at the top shows when it was last updated.",
        ],
      },
      {
        id: "contact",
        title: "Contact and grievances",
        body: [
          `Questions, requests or complaints about privacy go to our Grievance Officer${C.grievanceOfficer ? `, ${C.grievanceOfficer},` : ""} at ${G}. See the Grievance Redressal page for response times.`,
        ],
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  {
    slug: "refunds",
    title: "Refund & Cancellation Policy",
    short: "Refunds & Cancellations",
    blurb: "Refunds and cancellations for ShoperSite plans: free trials, monthly renewals, how to cancel and when money is returned.",
    group: "Sellers",
    summary: [
      "This covers what sellers pay ShoperSite (plans and themes). Refunds for products bought from a shop are handled by that shop.",
      "Paid plans are paid automatically each month through Razorpay (card or UPI AutoPay). Cancel any time in Settings → Plan & billing and no further payments are taken.",
      "Charged twice, charged by mistake, or not activated within 24 hours? You get a full refund. Ask within 7 days.",
      "Refunds reach your original payment method within 5–7 working days.",
    ],
    intro: `This policy applies to payments that sellers make to ${L} for ${B} plans and premium themes. It does not cover products that buyers purchase from a shop on ${B}; those are refunded by the Seller under the shop's own returns & refunds policy.`,
    sections: [
      {
        id: "cancel",
        title: "Cancelling a plan",
        body: [
          "Paid plans are billed monthly. When you subscribe you approve automatic payments (card or UPI AutoPay) through Razorpay, and the plan price is charged each month until you cancel. Where a free trial or an introductory price applies, the dates and amounts are shown before you approve.",
          "You can cancel at any time in Settings → Plan & billing. No further payments are taken. If you cancel during a free trial you are not charged. Your plan stays active until the end of the period you paid for (or the end of the free trial), then your shop moves to the Free plan. Your shop, products and orders are kept.",
        ],
      },
      {
        id: "eligible",
        title: "When you get a full refund",
        body: [
          list(
            "You were charged twice for the same plan or theme.",
            "You were charged by mistake, or for the wrong plan, and haven't used the paid features.",
            "Your payment was received but the plan or theme was not activated within 24 hours, and we couldn't fix it.",
            `A theme you bought can't be used on your shop because of a fault on ${B}'s side that we can't fix within 7 days.`
          ),
          "Ask within 7 days of the payment.",
        ],
      },
      {
        id: "not-eligible",
        title: "When refunds aren't given",
        body: [
          list(
            "For the unused part of a plan period after the plan was activated (except where the law requires it).",
            "For a theme that has been applied and used on your shop, apart from the fault cases above.",
            "If your shop was suspended or closed for breaking our Terms or Acceptable Use Policy.",
            "For fees charged by your bank, UPI app or payment provider."
          ),
        ],
      },
      {
        id: "how",
        title: "How to ask for a refund",
        body: [
          `Write to ${E} from the email on your account with your shop address, the plan or theme, the date and amount, and the UPI or payment reference number. We reply within 2 working days.`,
          "Approved refunds are sent to your original payment method (or to a UPI ID or bank account you confirm) within 5–7 working days. How long it then takes to show depends on your bank.",
        ],
      },
      {
        id: "buyers",
        title: "If you're a buyer",
        body: [
          `${B} does not sell the products in shops and cannot cancel orders or issue refunds for them. Please contact the shop: its returns & refunds policy is linked in the shop's footer and at checkout. If a shop doesn't respond, see our Buyer Terms and Grievance Redressal page.`,
        ],
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  {
    slug: "shipping",
    title: "Service Delivery Policy",
    short: "Service Delivery",
    blurb: "How ShoperSite plans and themes are delivered, and where shipping of products is covered.",
    group: "Sellers",
    summary: [
      `${B} sells only online services. Nothing is physically shipped by us.`,
      "Plans and themes are switched on in your dashboard, usually within minutes and always within 24 hours of payment.",
      "Products bought from a shop are shipped by that shop's seller under the shop's own shipping policy.",
    ],
    intro: `${B} provides software as an online service. This policy explains how what you buy from ${B} is delivered.`,
    sections: [
      {
        id: "delivery",
        title: "Delivery of plans and themes",
        body: [
          "Everything you buy from us is delivered digitally to your account. There is no physical delivery and no shipping charge.",
          list(
            "Free plan: available as soon as you create your shop.",
            "Paid plans and themes paid online: activated automatically once the payment is confirmed.",
            "Paid plans and themes paid by UPI transfer: activated after we verify the payment reference, usually within a few minutes and always within 24 hours."
          ),
          "You'll see the plan or theme as active in your dashboard, and on the Billing page.",
        ],
      },
      {
        id: "delays",
        title: "If something isn't activated",
        body: [
          `If a plan or theme isn't active within 24 hours of payment, write to ${E} with your payment reference. If we can't activate it, you'll get a full refund under our Refund & Cancellation Policy.`,
        ],
      },
      {
        id: "products",
        title: "Shipping of products from shops",
        body: [
          `Physical products ordered from a shop built on ${B} are packed and shipped by that shop's Seller, not by ${B}. Delivery areas, timelines and charges are set out in each shop's own shipping & delivery policy, linked in the shop's footer and shown before you pay. Please contact the shop about any delivery.`,
        ],
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  {
    slug: "payments",
    title: "Payments Policy",
    short: "Payments",
    blurb: "How buyer payments reach sellers, payment gateways, chargebacks and who is responsible.",
    group: "Sellers",
    summary: [
      `${B} never touches buyers' money. Payments go straight from the buyer to the seller.`,
      "Sellers take cash on delivery, or connect their own payment-gateway account and complete KYC with the gateway themselves.",
      "Chargebacks, refunds and gateway fees are between the seller, the buyer and the gateway.",
      "Test-mode gateway keys only work for the shop owner, so no real buyer can place a fake paid order.",
    ],
    intro: `This policy explains how payments work on shops built with ${B}. It forms part of our Terms of Service.`,
    sections: [
      {
        id: "how",
        title: "How buyers pay sellers",
        body: [
          "A Seller can offer one or more of these at checkout:",
          list(
            "Online payment through a payment gateway account (such as Razorpay) opened and verified in the Seller's own name. Money settles from the gateway to the Seller's bank account.",
            "Cash on delivery, collected by the Seller or their courier."
          ),
          `In every case the money is paid to the Seller. ${B} does not receive, hold, escrow, pool or settle buyers' payments, does not act as a payment aggregator, and is not a party to the payment.`,
        ],
      },
      {
        id: "gateways",
        title: "Payment gateway accounts",
        body: [
          "Sellers who accept online payments must open their own account with the payment gateway, complete its KYC, and accept its terms. The gateway, not ShoperSite, decides whether to approve an account and when to settle funds.",
          "Sellers connect their account by entering their API keys (or by an authorised connection the gateway provides). Secret keys are stored encrypted and used only to create and check payments for that Seller's shop. Sellers can disconnect at any time.",
          "Gateway fees, settlement times, holds, reserves and account limits are set by the gateway and are the Seller's responsibility.",
        ],
      },
      {
        id: "verification",
        title: "How payments are confirmed",
        body: [
          "For gateway payments, an order is marked paid only after the payment is checked with the gateway (by verifying its signature and amount). For UPI transfers, the order shows as awaiting confirmation until the Seller confirms receipt; a UPI reference can be used for one order only.",
          "Test-mode gateway keys move no real money. While a shop uses them, online payment is offered only to the shop owner for testing, never to buyers.",
        ],
      },
      {
        id: "refunds",
        title: "Refunds, chargebacks and disputes",
        body: [
          "Refunds to buyers are issued by the Seller, through their gateway dashboard or directly, under the shop's own refund policy.",
          "Chargebacks and payment disputes raised by buyers or banks are handled between the Seller and their gateway. The Seller is responsible for any amount reversed, and any related fees or penalties.",
          `${B} is not liable for failed, delayed, duplicated or reversed payments, or for any act of a gateway, bank or UPI app.`,
        ],
      },
      {
        id: "platform-fees",
        title: "Payments to ShoperSite",
        body: [
          `Sellers pay ${B} only for optional plans and themes, by the methods shown at the time. These payments are covered by our Refund & Cancellation Policy and Service Delivery Policy. ${B} charges no commission on Sellers' sales.`,
        ],
      },
      {
        id: "fraud",
        title: "Fraud",
        body: [
          `We may block payments, close a shop's checkout or suspend a shop if we reasonably suspect fraud, money laundering or misuse of payment methods, and we may report it to the gateway and the authorities. Report suspected fraud to ${E}.`,
        ],
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  {
    slug: "acceptable-use",
    title: "Acceptable Use & Prohibited Items Policy",
    short: "Acceptable Use",
    blurb: "What can't be sold or done on ShoperSite, how to report a shop that breaks the rules, and what happens next.",
    group: "Trust & safety",
    summary: [
      "No illegal, counterfeit, dangerous or adult products, and no scams.",
      "No spam, impersonation, fake reviews or attacks on the platform.",
      "We can remove listings, close shops to buyers and report illegal activity, often without notice.",
    ],
    intro: `To keep buyers, sellers and ${B} safe and within the law, shops may not list, sell, promote or link to anything below, and nobody may use the Service in the ways listed. This applies in addition to the law; if something is illegal where you or your buyer are, it is not allowed here.`,
    sections: [
      {
        id: "illegal",
        title: "Illegal and restricted goods",
        body: [
          list(
            "Narcotics, psychotropic substances, and drug paraphernalia (NDPS Act, 1985).",
            "Prescription medicines, or any medicine sold without the licences required by the Drugs and Cosmetics Act, 1940; medical devices that need registration and don't have it.",
            "Weapons, firearms and their parts, ammunition, explosives, fireworks without licence, and items designed to injure.",
            "Alcohol, tobacco, e-cigarettes and vaping products (Prohibition of Electronic Cigarettes Act, 2019).",
            "Wildlife and animal parts protected under the Wild Life (Protection) Act, 1972; live animals where prohibited.",
            "Human organs, body parts or fluids.",
            "Stolen goods, or goods obtained illegally.",
            "Government IDs, documents, uniforms, or currency, and counterfeit currency or stamps.",
            "Hazardous materials, toxic substances, and pesticides that are banned or restricted.",
            "Spy equipment, signal jammers, and devices for illegal surveillance or hacking.",
            "Lottery tickets, betting and gambling services."
          ),
        ],
      },
      {
        id: "ip",
        title: "Counterfeit and infringing items",
        body: [
          list(
            "Counterfeit, replica, \"first copy\" or \"master copy\" branded goods.",
            "Pirated software, films, music, books, courses or other content, or account sharing and resold subscriptions.",
            "Anything that uses someone else's trademark, copyright, design or likeness without permission."
          ),
          "Rights holders can report infringement under our Intellectual Property & Takedown Policy.",
        ],
      },
      {
        id: "harmful",
        title: "Harmful or offensive content",
        body: [
          list(
            "Sexually explicit material, adult services, and anything involving minors in a sexual way (strictly prohibited and reported to authorities).",
            "Content promoting hatred, violence or discrimination against any group, or terrorism.",
            "Content that is defamatory, obscene, invasive of privacy, or harassing.",
            "Misleading health claims, such as products claiming to cure diseases, and anything covered by the Drugs and Magic Remedies (Objectionable Advertisements) Act, 1954.",
            "Content that threatens India's unity, integrity, sovereignty, security or public order, or that the law otherwise prohibits under the IT (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021."
          ),
        ],
      },
      {
        id: "financial",
        title: "Financial products and schemes",
        body: [
          list(
            "Cryptocurrency or token sales, investment or trading schemes, and guaranteed-return offers.",
            "Loans, credit repair or debt collection without the required licences.",
            "Multi-level marketing, pyramid or chain schemes, and unregulated deposit schemes (Banning of Unregulated Deposit Schemes Act, 2019).",
            "Gift cards or vouchers resold without authorisation."
          ),
        ],
      },
      {
        id: "conduct",
        title: "Misuse of the Service",
        body: [
          list(
            "Taking payment for products you don't have or don't intend to deliver, or misdescribing products.",
            "Fake orders, fake reviews, or manipulating ratings.",
            "Impersonating another person, brand or business, or phishing.",
            "Spam, or using buyer contact details for anything they didn't agree to.",
            "Hacking, scanning, overloading or disrupting the Service, uploading malware, or trying to get around security, plan limits or a suspension.",
            "Reselling or sublicensing access to the Service or its themes without our written permission."
          ),
        ],
      },
      {
        id: "enforcement",
        title: "What happens if this policy is broken",
        body: [
          "We may, at our discretion and without prior notice where the law allows: remove or hide listings or content; close a shop to buyers; disable checkout or payment options; limit features; suspend or terminate the account; keep records; and report the matter to payment providers, rights holders and law-enforcement authorities.",
          "Where the IT Rules require, we act on content we are notified about within the time limits they set.",
        ],
      },
      {
        id: "report",
        title: "Report a shop",
        body: [
          `Seen something that breaks this policy? Email ${E} with the shop address, a link to the product and what's wrong. We review every report.`,
        ],
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  {
    slug: "buyer-terms",
    title: "Buyer Terms",
    short: "Buyer Terms",
    blurb: "For shoppers: who you're buying from, and how to get help with an order.",
    group: "Buyers",
    summary: [
      `Every shop on ${B} is run by its own independent seller. You buy from the seller, not from ${B}.`,
      "The seller handles your delivery, returns and refunds under the shop's own policies.",
      "Your money goes straight to the seller, by UPI, card or cash on delivery.",
      "If a seller doesn't help, tell us. We can take action against shops that break our rules.",
    ],
    intro: `These Buyer Terms apply when you browse or buy from a shop built on ${B}. They sit alongside our Terms of Service and each shop's own policies.`,
    sections: [
      {
        id: "who",
        title: "Who you are buying from",
        body: [
          `Each shop (for example, anyname.${D}) is owned and run by an independent Seller. The Seller is responsible for the products, prices, descriptions, stock, delivery, returns, refunds, warranties and invoices. ${B} provides the software only and is not the seller, agent or guarantor of any product.`,
          "The Seller's contact details and policies are shown on the shop's pages and in its footer.",
        ],
      },
      {
        id: "orders",
        title: "Placing an order",
        body: [
          "When you place an order, you make an offer to buy from the Seller. The Seller may accept or cancel it (for example if an item is out of stock, or a price was shown wrongly). If a paid order is cancelled by the Seller, they must refund you.",
          "Please give a correct name, phone number and address, and keep your order link: it lets you see your order status and contact the Seller.",
        ],
      },
      {
        id: "payment",
        title: "Paying",
        body: [
          `You pay the Seller directly. Online payments are processed by the Seller's payment gateway (such as Razorpay); ${B} never sees your card number, UPI PIN or bank password. For UPI transfers, enter the correct 12-digit UPI reference so the Seller can match your payment.`,
          "Never pay a seller outside the shop's checkout because someone asked you to by message or call. It may be a scam.",
        ],
      },
      {
        id: "delivery-returns",
        title: "Delivery, returns and refunds",
        body: [
          "These follow the shop's own shipping and returns & refunds policies, which you agree to at checkout. Where a shop allows it, you can cancel or ask for a return from your order page.",
        ],
      },
      {
        id: "help",
        title: "Getting help with an order",
        body: [
          list(
            "First, contact the Seller using the details on the shop or your order page.",
            `If the Seller doesn't respond within 48 hours, or you think the shop is fraudulent, write to ${E} with the shop address and your order number. We'll contact the Seller, and we can suspend shops that break our rules.`,
            "You can also contact the National Consumer Helpline (1915 or consumerhelpline.gov.in) or a consumer commission."
          ),
          `${B} cannot itself refund money paid to a Seller, but we will cooperate with you, the Seller, payment providers and authorities.`,
        ],
      },
      {
        id: "reviews",
        title: "Reviews",
        body: [
          "If a shop allows reviews, they must be honest and based on your own experience. Reviews are marked verified only when they come from a real order. We may remove reviews that are fake, abusive or unlawful.",
        ],
      },
      {
        id: "liability",
        title: `${B}'s responsibility`,
        body: [
          `Because ${B} is not the seller, our responsibility for products and orders is limited as described in our Terms of Service. Nothing here limits your rights against the Seller under the Consumer Protection Act, 2019.`,
        ],
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  {
    slug: "cookies",
    title: "Cookie Policy",
    short: "Cookies",
    blurb: "The cookies and browser storage ShoperSite uses, and how to control them.",
    group: "Core",
    summary: [
      "We use essential storage to keep you signed in, remember your bag and keep the Service secure.",
      "We use Google Analytics for Firebase to understand, in aggregate, how the Service is used.",
      "We don't use advertising cookies or sell browsing data.",
    ],
    intro: `This policy explains how ${B} uses cookies and similar technologies (such as local storage) on ${D}, shops built on it, and our apps.`,
    sections: [
      {
        id: "what",
        title: "What cookies are",
        body: [
          "Cookies are small files a website stores in your browser. Local and session storage work in a similar way. They let a site remember things between pages and visits.",
        ],
      },
      {
        id: "types",
        title: "What we use",
        body: [
          list(
            "Essential: keeping you signed in (Google Firebase Authentication), protecting forms and checkout from abuse, and remembering security settings. The Service can't work without these.",
            "Functional: remembering your bag, wishlist, saved delivery details, recent orders and preferences in a shop, kept in your own browser.",
            "Analytics: Google Analytics for Firebase, which records pages viewed, device type and approximate location so we can see how the Service is used and fix problems. We use it in aggregate and don't use it to identify you personally."
          ),
          "We do not use advertising or cross-site tracking cookies. A seller may add their own tools to their shop; their shop's privacy policy should explain them.",
        ],
      },
      {
        id: "control",
        title: "Your choices",
        body: [
          "You can block or delete cookies and site data in your browser settings. Blocking essential storage will stop sign-in and checkout from working. You can opt out of Google Analytics using Google's browser add-on or your device's advertising-ID settings in the app.",
        ],
      },
      {
        id: "more",
        title: "More information",
        body: [`See our Privacy Policy, or write to ${E}.`],
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  {
    slug: "intellectual-property",
    title: "Intellectual Property & Takedown Policy",
    short: "IP & Takedown",
    blurb: "How rights holders report infringing content, and how sellers can respond.",
    group: "Trust & safety",
    summary: [
      "We respect intellectual property and expect sellers to do the same.",
      "Rights holders can ask us to remove infringing listings by sending a notice with the details below.",
      "Sellers whose content is removed can send a counter-notice. Repeat infringers lose their shops.",
    ],
    intro: `${B} respects the intellectual property rights of others and acts on proper notices of infringement under the Copyright Act, 1957, the Trade Marks Act, 1999 and the Information Technology Act, 2000 and its rules.`,
    sections: [
      {
        id: "notice",
        title: "Reporting infringement",
        body: [
          `If you own a copyright, trademark or design (or are authorised to act for the owner) and believe content in a shop on ${B} infringes it, email ${E} with the subject "IP notice" and include:`,
          list(
            "Your name, address, phone and email, and your relationship to the rights owner.",
            "The work or mark you say is infringed, with proof of ownership (for example a registration certificate).",
            "The exact address (URL) of each infringing page or listing.",
            "A statement that you believe in good faith the use isn't authorised by the owner or the law.",
            "A statement that the information in your notice is accurate, and your physical or electronic signature."
          ),
        ],
      },
      {
        id: "action",
        title: "What we do",
        body: [
          "On receiving a complete notice, we review it and, where appropriate, remove or disable access to the content within the time required by law, and tell the Seller. Incomplete notices may delay action. Court orders and notices from authorised government agencies are acted on as the law requires.",
        ],
      },
      {
        id: "counter",
        title: "Counter-notice for sellers",
        body: [
          `If your content was removed and you believe that was a mistake, or you have the right to use it, email ${E} with the subject "IP counter-notice", identifying the removed content, explaining why, and including your contact details and a statement that the information is accurate. We may share it with the person who complained and may restore the content if they don't start legal proceedings within a reasonable time.`,
        ],
      },
      {
        id: "repeat",
        title: "Repeat infringers",
        body: [
          "We suspend or close shops that repeatedly infringe others' rights.",
        ],
      },
      {
        id: "misuse",
        title: "False notices",
        body: [
          "Knowingly sending a false notice or counter-notice can make you liable for damages. We may ignore notices we reasonably believe are abusive.",
        ],
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  {
    slug: "data-processing",
    title: "Data Processing Terms for Sellers",
    short: "Data Processing",
    blurb: "How ShoperSite processes your buyers' data on your behalf, and your duties as a Data Fiduciary.",
    group: "Sellers",
    summary: [
      "You (the seller) decide how your buyers' data is used. We process it only to run your shop.",
      "We keep it secure, don't sell it, and help you answer your buyers' data requests.",
      "You must have a lawful basis to use buyer data and must publish a privacy policy for your shop.",
    ],
    intro: `These terms form part of the Terms of Service and apply where ${B} processes personal data of a Seller's buyers ("Buyer Data") on the Seller's behalf, as required by the Digital Personal Data Protection Act, 2023.`,
    sections: [
      {
        id: "roles",
        title: "Roles",
        body: [
          `The Seller is the Data Fiduciary for Buyer Data. ${B} is the Data Processor and processes Buyer Data only to provide the Service to the Seller and on the Seller's documented instructions (which include the Seller's use of the Service's features).`,
        ],
      },
      {
        id: "our-duties",
        title: `${B}'s commitments`,
        body: [
          list(
            "Process Buyer Data only to provide and secure the Service, and as the law requires.",
            "Keep Buyer Data confidential and limit access to people who need it and are bound by confidentiality.",
            "Use reasonable security safeguards, including encryption in transit, access controls that keep each shop's data separate, and encryption of sensitive credentials.",
            "Use sub-processors (currently Google Cloud / Firebase, Vercel and email delivery services) only under terms that protect the data at least as well as these.",
            "Tell the Seller without undue delay after becoming aware of a personal data breach affecting their Buyer Data, and help them meet their notification duties.",
            "Help the Seller respond to buyers' requests to access, correct or erase their data.",
            "Delete or return Buyer Data when the Seller closes their shop, except where the law requires us to keep it."
          ),
        ],
      },
      {
        id: "seller-duties",
        title: "The Seller's commitments",
        body: [
          list(
            "Collect and use Buyer Data lawfully, for clear purposes, and give buyers a privacy notice (your shop's privacy policy).",
            "Send marketing only to buyers who agreed to it, and honour unsubscribes.",
            "Not export Buyer Data for unrelated purposes, or share or sell it to others without a lawful basis.",
            "Keep your account secure, and respond to buyers' data requests and grievances.",
            "Delete Buyer Data you've downloaded once it's no longer needed."
          ),
        ],
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  {
    slug: "grievance",
    title: "Grievance Redressal",
    short: "Grievance Redressal",
    blurb: "How to raise a complaint with ShoperSite, who our Grievance Officer is, and how quickly we respond under Indian rules.",
    group: "Trust & safety",
    summary: [
      "Complaints about the Service, a shop, content, privacy or IP all come to our Grievance Officer.",
      "We acknowledge within 24 hours and aim to resolve within 15 days (and always within one month).",
      "Urgent content complaints (such as non-consensual or sexual content) are acted on within 24 hours.",
    ],
    intro: `In line with the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021, the Consumer Protection (E-Commerce) Rules, 2020 and the Digital Personal Data Protection Act, 2023, ${B} has appointed a Grievance Officer to handle complaints.`,
    sections: [
      {
        id: "officer",
        title: "Grievance Officer",
        body: [
          list(
            ...[
              C.grievanceOfficer ? `Name: ${C.grievanceOfficer}` : "",
              `Company: ${L}`,
              `Email: ${G}`,
              C.phone ? `Phone: ${C.phone}` : "",
              C.address ? `Address: ${C.address}` : "",
              "Hours: Monday to Saturday, 10 am to 6 pm IST (emails are accepted at any time)",
            ].filter(Boolean)
          ),
        ],
      },
      {
        id: "how",
        title: "How to raise a complaint",
        body: [
          `Email the Grievance Officer at ${G} with:`,
          list(
            "Your name and contact details.",
            "What your complaint is about (the Service, a shop, a listing, privacy, intellectual property, or something else).",
            "The shop address and order number or page link, if relevant.",
            "Any screenshots or documents that help."
          ),
          "If you bought from a shop, please contact the shop's Seller first; most order issues are resolved fastest that way.",
        ],
      },
      {
        id: "timelines",
        title: "What happens next",
        body: [
          list(
            "We acknowledge your complaint within 24 hours (48 hours at the latest).",
            "We aim to resolve it within 15 days, and always within one month of receiving it.",
            "Complaints about content that exposes a person's private areas, shows them in sexual acts, or impersonates them are acted on within 24 hours.",
            "We'll tell you the outcome and the reasons."
          ),
        ],
      },
      {
        id: "escalate",
        title: "If you're not satisfied",
        body: [
          "Depending on the issue, you may approach the Grievance Appellate Committee under the IT Rules, the Data Protection Board of India for privacy matters, the National Consumer Helpline (1915 or consumerhelpline.gov.in), or a consumer commission.",
        ],
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  {
    slug: "disclaimer",
    title: "Disclaimer",
    short: "Disclaimer",
    blurb: "Limits on what ShoperSite promises about shops, products and information on the site.",
    group: "Core",
    summary: [
      `Shops on ${B} are run by independent sellers. We don't endorse or guarantee them.`,
      "Templates, guides and policy drafts we provide are a starting point, not legal or tax advice.",
      "Results such as sales aren't guaranteed.",
    ],
    intro: `This disclaimer applies to ${D}, shops built on it, and our apps, and forms part of our Terms of Service.`,
    sections: [
      {
        id: "sellers",
        title: "Independent sellers",
        body: [
          `Shops are created and run by independent Sellers. ${B} does not endorse, verify or guarantee any Seller, product, claim, price or review, and is not responsible for them. A shop using a ${B} address or theme does not mean it is run or approved by ${B}.`,
        ],
      },
      {
        id: "advice",
        title: "Not legal, tax or financial advice",
        body: [
          "Policy templates, guides, tips and other material we provide are general information to help you get started. They aren't legal, tax, accounting or financial advice. Sellers should make sure their own policies and practices suit their business and the law, and get professional advice where needed.",
        ],
      },
      {
        id: "results",
        title: "No guaranteed results",
        body: [
          "Examples, statistics or testimonials on the site don't guarantee that you'll get similar results. Sales depend on many things outside our control.",
        ],
      },
      {
        id: "links",
        title: "External links",
        body: [
          "The Service may link to websites and services run by others. We don't control them and aren't responsible for their content or practices.",
        ],
      },
      {
        id: "accuracy",
        title: "Accuracy",
        body: [
          "We try to keep information on the site accurate and up to date, but it may contain errors or become outdated. We may correct it at any time without notice.",
        ],
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  {
    slug: "contact",
    title: "Contact Us",
    short: "Contact",
    blurb: "How to reach the ShoperSite team: support email, WhatsApp, grievance officer and our company details.",
    group: "Core",
    summary: [
      `Email ${E}. We reply within 1 working day.`,
      "For an order from a shop, contact that shop first: its details are on the shop and your order page.",
    ],
    intro: `${B} is operated by ${L}. We're happy to help with your account, your shop, plans, billing, or anything else.`,
    sections: [
      {
        id: "reach",
        title: "Reach us",
        body: [
          list(
            ...[
              `Email: ${E}`,
              C.phone ? `Phone: ${C.phone}` : "",
              C.whatsapp ? `WhatsApp: +${C.whatsapp}` : "",
              C.address ? `Registered office: ${C.address}` : "",
              C.cin ? `CIN: ${C.cin}` : "",
              C.gstin ? `GSTIN: ${C.gstin}` : "",
              "Support hours: Monday to Saturday, 10 am to 6 pm IST",
            ].filter(Boolean)
          ),
        ],
      },
      {
        id: "sellers",
        title: "Sellers",
        body: [
          "Signed in to your dashboard? Use \"Don't know how to connect?\" on the payments card, or email us from the address on your account so we can find your shop quickly.",
        ],
      },
      {
        id: "buyers",
        title: "Buyers",
        body: [
          `For orders, delivery, returns or refunds, please contact the shop you bought from. ${B} doesn't sell the products and can't change or refund orders, but if a shop isn't responding, email us with the shop address and order number and we'll follow up.`,
        ],
      },
      {
        id: "complaints",
        title: "Complaints",
        body: [`Formal complaints go to our Grievance Officer at ${G}. See the Grievance Redressal page.`],
      },
    ],
  },
  ];
}

/** Titles, slugs and groups (the same whatever the company details) for menus, links and the sitemap. */
export const LEGAL_DOCS = buildLegalDocs(defaultCompany);
export const LEGAL_GROUPS: LegalDoc["group"][] = ["Core", "Sellers", "Buyers", "Trust & safety"];
