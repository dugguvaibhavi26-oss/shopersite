import { PLATFORM_PLANS } from "./plans";
import { BRAND_DEFINITION } from "./seo";

/**
 * The homepage FAQ. The page shows these and the homepage's FAQPage data is built from the same
 * list, so what search engines read is exactly what visitors see. Prices come from the plans.
 */
const r = (paise: number) => `₹${Math.round(paise / 100).toLocaleString("en-IN")}`;
const free = PLATFORM_PLANS.free;
const growth = PLATFORM_PLANS.starter;
const pro = PLATFORM_PLANS.pro;

export const HOME_FAQS: { q: string; a: string }[] = [
  {
    q: "What is Shopersite and how does it work?",
    a: `${BRAND_DEFINITION} You pick your shop name, add products and choose a theme. Buyers browse your shop, order, and track their delivery.`,
  },
  {
    q: "How much does it cost?",
    a: `The Free plan costs ${r(0)} with up to ${free.maxProducts} products and one theme. Growth is ${r(growth.priceMonthly)} a month with a free trial, and Pro is ${pro.introPriceMonthly ? `${r(pro.introPriceMonthly)} a month for the first ${pro.introMonths} months, then ` : ""}${r(pro.priceMonthly)} a month. Prices include GST. We never take a commission on your sales.`,
  },
  {
    q: "Do you hold or process my customers' money?",
    a: "No. Cash on delivery is collected by you or your courier. Online payments go through your own Razorpay account and settle straight to your bank. We only charge a flat monthly fee for paid plans.",
  },
  {
    q: "Can I use my own domain name?",
    a: "Yes. Custom domains such as www.yourbrand.com are part of the Pro plan. Every plan includes a free yourname.shopersite.in address.",
  },
  {
    q: "Do I need to be a designer or developer?",
    a: "No. Every theme is ready to use. Add your logo, colours and products, and your shop looks professional from day one.",
  },
];
