/**
 * Short help articles the assistant answers from, so it explains Shopersite correctly instead of
 * guessing. Plain words, where to click, what each plan includes. Keep them short: the best 3
 * matches are sent with a question.
 */

export interface HelpArticle {
  id: string;
  title: string;
  keywords: string[];
  body: string;
}

export const HELP_ARTICLES: HelpArticle[] = [
  {
    id: "start",
    title: "Getting a shop live",
    keywords: ["start", "live", "open", "launch", "publish", "begin", "setup", "first"],
    body:
      "1) Add products (Products → Add product). 2) Payments: Cash on Delivery works on every plan; on Growth and Pro connect Razorpay in Settings → Payments for online payments. 3) Add at least one policy page in Settings → Policies (templates are ready). A shop with no policy page stays closed. 4) Turn the shop on from Home. Share the link yourshop.shopersite.in on WhatsApp and Instagram.",
  },
  {
    id: "products",
    title: "Adding and editing products",
    keywords: ["product", "add", "edit", "price", "stock", "photo", "image", "mrp", "draft", "hide", "variant", "size", "bulk", "upload"],
    body:
      "Products → Add product. Give a name, price (and MRP if you want a strikethrough price, which must be higher than the price), stock, category and photos. Status: Published (visible), Draft (not visible) or Hidden. Sizes/colours go under Options. You can upload many products at once from a spreadsheet with Bulk upload. Free plan: up to 75 products, Growth: 200, Pro: unlimited.",
  },
  {
    id: "categories",
    title: "Categories and collections",
    keywords: ["category", "categories", "collection", "group", "menu"],
    body: "Categories group products on your shop (e.g. Sarees, Kurtis). Add them in Categories. Collections are parent cards that hold several categories. Each product belongs to one category.",
  },
  {
    id: "orders",
    title: "Handling orders",
    keywords: ["order", "orders", "ship", "shipped", "deliver", "delivered", "packed", "confirm", "cancel", "status", "tracking", "courier"],
    body:
      "Orders shows every order. Open one to move it along: Confirmed → Packed → Shipped (add courier and tracking number) → Delivered. Buyers see the status on their order page. Cancelling and refunds are done by you from the order page.",
  },
  {
    id: "payments",
    title: "Payments: Cash on Delivery and Razorpay",
    keywords: ["payment", "payments", "upi", "cod", "cash", "razorpay", "online", "gateway", "card", "refund", "money", "payout"],
    body:
      "Settings → Payments. Cash on Delivery is on every plan (optionally add a COD fee or an order limit). Online payments are on Growth and Pro: Razorpay: buyers pay by card, UPI or netbanking and the order is marked paid automatically; paste your Razorpay keys in Settings → Payments. Payment keys and bank details are always entered by you, never by the assistant.",
  },
  {
    id: "delivery",
    title: "Delivery fees",
    keywords: ["delivery", "shipping", "fee", "free delivery", "charge"],
    body: "Settings → Shipping & delivery: choose free delivery for everyone, a flat fee, or free delivery above an order value.",
  },
  {
    id: "shiprocket",
    title: "Shiprocket shipping",
    keywords: ["shiprocket", "courier", "awb", "pickup", "label", "ship"],
    body:
      "Plugins → Shiprocket. Install the Shiprocket app or sign up on shiprocket.in, create an API user (Settings → API → Configure in Shiprocket), then enter that email and password in the plugin. After that, each order has a Ship with Shiprocket button that lists couriers with prices. Booking needs money in your Shiprocket wallet.",
  },
  {
    id: "whatsapp",
    title: "WhatsApp messages to buyers",
    keywords: ["whatsapp", "message", "buyer", "update", "notify"],
    body: "On each order, the WhatsApp button opens a ready-made message to the buyer (order confirmed, shipped, delivered…). You just tap send in WhatsApp. It's free.",
  },
  {
    id: "gmail",
    title: "Email alerts with Gmail",
    keywords: ["gmail", "email", "mail", "alert", "notification", "app password"],
    body: "Plugins → Gmail connects your Gmail so buyers get order emails from you and you get new-order alerts. It needs a Google App Password, which you create in your Google account and paste yourself.",
  },
  {
    id: "policies",
    title: "Policy pages",
    keywords: ["policy", "policies", "terms", "refund", "return", "privacy", "shipping policy", "legal", "closed"],
    body: "Settings → Policies. Indian law asks online shops to show their policies. Templates for terms, returns & refunds, shipping and privacy are ready to edit. Until you add at least one, your shop stays closed to buyers.",
  },
  {
    id: "themes",
    title: "Themes and design",
    keywords: ["theme", "themes", "design", "look", "colour", "color", "font", "editor", "banner", "homepage"],
    body: "Themes lets you pick your shop's design; every theme is free. The website editor (change text, photos, sections and colours) is on Growth and Pro. Banners are on Home → Banners: Free 1, Growth 5, Pro 20.",
  },
  {
    id: "discounts",
    title: "Coupons and discounts",
    keywords: ["coupon", "discount", "offer", "code", "sale", "promo"],
    body: "Discounts (Growth and Pro). Create a code with a percentage or flat amount off, an optional minimum order, a maximum discount and an end date. Turn a coupon off anytime.",
  },
  {
    id: "reviews",
    title: "Reviews",
    keywords: ["review", "reviews", "rating", "stars", "feedback"],
    body: "Reviews (Growth and Pro). Buyers rate items after delivery. Each review waits for your approval before it shows on your shop. You can hide or delete any review.",
  },
  {
    id: "plans",
    title: "Plans",
    keywords: ["plan", "plans", "pricing", "upgrade", "pro", "growth", "free", "price", "subscription", "billing"],
    body:
      "Free (₹0): up to 75 products, 1 theme, Cash on Delivery, edit your theme's photos. Growth (1 month free, then ₹199/month): 200 products, 7 themes and the full editor, online payments, coupons, reviews, abandoned carts, shipping and bulk upload. Pro (10 days free, then ₹299/month for 2 months, then ₹599/month): unlimited products, all 30 themes, your own domain, no Shopersite branding, invoices, email and AI insights. Upgrade in Settings → Plan & billing. Plan payments are always done by you.",
  },
  {
    id: "domain",
    title: "Custom domain",
    keywords: ["domain", "website", "www", "dns", "url", "own domain"],
    body: "Settings → Domain (Pro). Enter your domain (like www.yourbrand.com) and add the DNS record shown at your domain provider. It goes live within a few minutes to a few hours.",
  },
  {
    id: "invoices",
    title: "Invoices and GST",
    keywords: ["invoice", "invoices", "gst", "gstin", "tax", "taxes", "bill"],
    body: "Settings → Taxes: add your GSTIN, state, default GST rate and whether prices include tax. Pro shops get an invoice for every order (Invoice button on the order), and buyers can download it from their order page.",
  },
  {
    id: "abandoned",
    title: "Unfinished checkouts",
    keywords: ["abandoned", "cart", "unfinished", "checkout", "reminder", "left"],
    body: "Orders → Abandoned lists buyers who filled in their details but didn't pay. Tap WhatsApp to send a friendly reminder. Buyers who agreed get one automatic email reminder if your Gmail is connected.",
  },
  {
    id: "customers",
    title: "Customers",
    keywords: ["customer", "customers", "buyer", "buyers", "repeat", "contact"],
    body: "Customers lists everyone who ordered, with how many orders they placed and when. Use the WhatsApp or call button to reach them. Filter by repeat or new buyers.",
  },
  {
    id: "assistant",
    title: "About Roxy, the assistant",
    keywords: ["assistant", "roxy", "ai", "usage", "limit", "bar", "reset", "what can you do"],
    body:
      "Roxy, the assistant, can answer questions about your shop, find products, orders and customers, and prepare changes (add or edit products, categories, coupons, order status, reviews, shop text). Every change shows a Confirm card first. Payments, bank details, plans, domain, deleting things and turning the shop on or off stay manual. Simple commands like 'show orders' are free and unlimited; AI answers use the daily bar, which resets at midnight.",
  },
];

/** The best matching articles for a question (simple word overlap; titles and keywords count more). */
export function searchHelp(query: string, limit = 3): HelpArticle[] {
  const words = query.toLowerCase().match(/[a-z0-9]+/g) || [];
  if (!words.length) return [];
  const scored = HELP_ARTICLES.map((a) => {
    let score = 0;
    const title = a.title.toLowerCase();
    const body = a.body.toLowerCase();
    for (const w of words) {
      if (w.length < 3) continue;
      if (a.keywords.some((k) => k === w || k.split(" ").includes(w))) score += 4;
      else if (a.keywords.some((k) => k.startsWith(w) || w.startsWith(k))) score += 2;
      if (title.includes(w)) score += 2;
      if (body.includes(w)) score += 1;
    }
    return { a, score };
  });
  return scored
    .filter((s) => s.score > 0)
    .sort((x, y) => y.score - x.score)
    .slice(0, limit)
    .map((s) => s.a);
}
