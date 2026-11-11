import { BarChart3, Bot, CreditCard, Globe, Image as ImageIcon, LayoutTemplate, MessageCircle, Package, Palette, Receipt, Search, ShieldCheck, ShoppingBag, Smartphone, Store, Tag, Truck, Wallet, Zap } from "lucide-react";
import type { Faq } from "@/lib/resources/types";

/**
 * SEO landing pages, each aimed at one search intent. Every claim here must match the product
 * (plans in lib/plans.ts). Keep the copy unique per page — no swapping keywords into the same text.
 */

export const LANDING_ICONS = { BarChart3, Bot, CreditCard, Globe, ImageIcon, LayoutTemplate, MessageCircle, Package, Palette, Receipt, Search, ShieldCheck, ShoppingBag, Smartphone, Store, Tag, Truck, Wallet, Zap };
type IconName = keyof typeof LANDING_ICONS;

export interface Landing {
  slug: string;
  /** primary keyword this page targets */
  keyword: string;
  secondary: string[];
  metaTitle: string;
  metaDescription: string;
  crumb: string;
  cardText: string;
  kicker: string;
  h1: string;
  lead: string;
  cta?: string;
  shots: { src: string; alt: string }[];
  introTitle: string;
  intro: string[];
  featuresTitle: string;
  features: { icon: IconName; title: string; text: string; plan?: string }[];
  stepsTitle: string;
  steps: { title: string; text: string }[];
  extra?: { title: string; text: string; items: { title: string; text: string }[] };
  plansTitle?: string;
  faqs: Faq[];
  related?: string[];
  guides?: string[];
  docs?: string[];
  bandTitle?: string;
}

const SHOT = {
  bloom: { src: "/theme-previews/classic-bloom.webp", alt: "A Shopersite store using the Lume Editorial theme, with a hero banner and product grid" },
  mono: { src: "/theme-previews/mono-studio.webp", alt: "A Shopersite store using the Mono Studio theme with bold headings and full-width photos" },
  f01: { src: "/theme-previews/f01.webp", alt: "A fashion store built on Shopersite showing new arrivals" },
  t03: { src: "/theme-previews/theme03.webp", alt: "A Shopersite storefront with large lifestyle photography" },
  t04: { src: "/theme-previews/theme04.webp", alt: "A Shopersite fashion storefront with a magazine-style layout" },
  t06: { src: "/theme-previews/theme06.webp", alt: "A Shopersite storefront theme with product collections" },
};

export const LANDINGS: Landing[] = [
  {
    slug: "free-online-store-builder",
    keyword: "free online store builder",
    secondary: ["free store builder", "create online store for free", "free shopping website builder"],
    metaTitle: "Free Online Store Builder — Create Your Store in Minutes",
    metaDescription: "Shopersite is a free online store builder for Indian sellers. Add products, take cash-on-delivery orders and share your shop link. ₹0 forever plan, no credit card.",
    crumb: "Free online store builder",
    cardText: "What you get on the ₹0 plan, and when to upgrade.",
    kicker: "Free online store builder",
    h1: "A free online store builder that's actually free",
    lead: "Create a real online store — product pages, cart, checkout and order tracking — on a plan that costs ₹0 forever. No trial clock, no card, no coding.",
    shots: [SHOT.bloom, SHOT.mono],
    introTitle: "What “free” means on Shopersite",
    intro: [
      "Many store builders call themselves free but only let you design a store, not sell from it, or stop working when a trial ends. Shopersite's **Free plan** is a working shop: buyers can browse, add to cart and order with **cash on delivery**, and you manage every order from your dashboard.",
      "You get up to **75 products**, a ready-made theme, your own address at **yourbrand.shopersite.in**, editable policy pages and one-tap WhatsApp order updates. When you're ready for online payments, coupons or your own domain, you can upgrade — not before.",
    ],
    featuresTitle: "Everything on the Free plan",
    features: [
      { icon: "Store", title: "A complete storefront", text: "Home page, product pages, categories, cart, checkout and an order-tracking page for buyers." },
      { icon: "Package", title: "Up to 75 products", text: "Photos, prices, MRP, stock and options like size and colour." },
      { icon: "Wallet", title: "Cash on delivery", text: "Take orders from day one. Add a COD fee or an order limit if you like." },
      { icon: "MessageCircle", title: "WhatsApp order updates", text: "Ready-written confirmed, shipped and delivered messages, sent from your own number." },
      { icon: "BarChart3", title: "Sales dashboard", text: "Today's orders and sales, low-stock alerts and your best sellers." },
      { icon: "Bot", title: "Roxy, the AI assistant", text: "Ask questions about your shop and get product descriptions written for you, within a daily limit." },
    ],
    stepsTitle: "From sign-up to first order",
    steps: [
      { title: "Sign up free", text: "Name your shop and pick a category. No card is asked for on the Free plan." },
      { title: "Add products", text: "A photo, a name, a price and stock is enough to start." },
      { title: "Add a policy page", text: "Pick a ready template for returns, shipping or terms. Your shop opens once it has one." },
      { title: "Share your link", text: "Put yourbrand.shopersite.in in your Instagram bio and WhatsApp status." },
    ],
    faqs: [
      { q: "Is Shopersite free forever, or is it a free trial?", a: "The Free plan is free forever — ₹0, with no time limit and no card. Free trials apply only if you choose to try a paid plan: 1 month on Growth, 10 days on Pro." },
      { q: "Can I take online payments on the free plan?", a: "The Free plan takes orders with cash on delivery. Online payments (UPI, cards, net banking) through your own Razorpay account start on the Growth plan." },
      { q: "Will my store show Shopersite branding?", a: "A small “Made with Shopersite” note appears on Free and Growth stores. Pro removes it." },
      { q: "What happens if I upgrade and later stop paying?", a: "Your store moves back to Free plan limits. Your products, orders and customers stay." },
    ],
    related: ["free-ecommerce-website-builder", "build-online-store-for-free", "online-store-builder-india"],
    guides: ["create-online-store-for-free-india", "free-vs-paid-ecommerce-platforms"],
    docs: ["plans-compared", "create-your-shop"],
  },
  {
    slug: "free-ecommerce-website-builder",
    keyword: "free ecommerce website builder",
    secondary: ["free ecommerce platform", "free website builder for online store", "ecommerce website builder India"],
    metaTitle: "Free Ecommerce Website Builder for Small Brands in India",
    metaDescription: "Build an ecommerce website free with Shopersite: fast mobile themes, product pages, checkout, order management and SEO-friendly pages. Upgrade only when you grow.",
    crumb: "Free ecommerce website builder",
    cardText: "The ecommerce features behind every Shopersite store.",
    kicker: "Free ecommerce website builder",
    h1: "The ecommerce website builder built for selling, not just showing",
    lead: "A website that only looks good isn't a shop. Shopersite gives you the commerce parts that matter — catalog, checkout, orders, stock and customers — in one dashboard, free to start.",
    shots: [SHOT.f01, SHOT.t04],
    introTitle: "An ecommerce engine, not a page builder",
    intro: [
      "General website builders are great for portfolios but leave selling to add-ons. Shopersite starts from the other end: every store is an **ecommerce website** with a catalog, cart, checkout, stock tracking and an order workflow from confirmed to delivered.",
      "Pages are rendered fast and work on phones first — where most Indian buyers shop. Product and category pages can be found by search engines, and you can add Meta Pixel and Google Analytics to measure your marketing.",
    ],
    featuresTitle: "Ecommerce features that come with every store",
    features: [
      { icon: "ShoppingBag", title: "Cart and checkout", text: "Guest checkout by default, with order notes, minimum order value and COD limits you control." },
      { icon: "Package", title: "Catalog and stock", text: "Categories, collections, product options and automatic stock updates with every order." },
      { icon: "Receipt", title: "Order workflow", text: "Confirm, pack, ship and deliver, with a tracking page buyers can open any time." },
      { icon: "Search", title: "Search-friendly pages", text: "Clear product and category pages that search engines can read. [Get found on Google](/docs/seo-basics)." },
      { icon: "CreditCard", title: "Online payments", text: "Connect your Razorpay account for UPI, cards and net banking.", plan: "Growth and Pro" },
      { icon: "Tag", title: "Coupons and reviews", text: "Discount codes, verified buyer reviews and abandoned-checkout recovery.", plan: "Growth and Pro" },
    ],
    stepsTitle: "Launch your ecommerce website",
    steps: [
      { title: "Choose a theme", text: "Start with a ready, mobile-first design. Preview themes with your own products." },
      { title: "Build your catalog", text: "Add products one by one or, on Growth, upload many from a spreadsheet." },
      { title: "Set checkout rules", text: "Delivery fees, COD options and what buyers fill in at checkout." },
      { title: "Go live and measure", text: "Share your link, then watch orders and sales on your dashboard." },
    ],
    extra: {
      title: "Made for how India buys",
      text: "Commerce details that generic builders leave to plugins are built in.",
      items: [
        { title: "Cash on delivery controls", text: "COD fee and maximum order value for COD." },
        { title: "Prices in rupees, GST-ready", text: "Show prices inclusive of GST; add your GSTIN in settings." },
        { title: "Indian couriers", text: "Ship with Shiprocket and its courier partners on Growth." },
        { title: "WhatsApp-first updates", text: "Order messages buyers actually read, from your own number." },
      ],
    },
    faqs: [
      { q: "Is this a real ecommerce platform or just a website builder?", a: "It's an ecommerce platform: products, stock, cart, checkout, orders and customers are all built in, with a website on top." },
      { q: "Do I need hosting or a developer?", a: "No. Hosting, security (SSL) and updates are included. You manage everything from the dashboard or the Android app." },
      { q: "Can I move to my own domain later?", a: "Yes, on the Pro plan you can connect a domain like www.yourbrand.com. Your shopersite.in address keeps working too." },
    ],
    related: ["free-online-store-builder", "online-store-builder-india", "website-builder-for-small-business"],
    guides: ["create-ecommerce-website-without-coding", "best-free-ecommerce-website-builders-india"],
    docs: ["checkout-rules", "online-payments-razorpay"],
  },
  {
    slug: "build-online-store-for-free",
    keyword: "build an online store for free",
    secondary: ["create your own online store", "how to create an online shopping website for free", "online store creator"],
    metaTitle: "Build an Online Store for Free — Step-by-Step in 4 Steps",
    metaDescription: "Build your online store for free in four simple steps: sign up, add products, set delivery and payments, and share your link. A practical Shopersite walkthrough.",
    crumb: "Build an online store for free",
    cardText: "A step-by-step walkthrough from sign-up to first order.",
    kicker: "Step-by-step",
    h1: "Build an online store for free, step by step",
    lead: "Here's exactly how to go from nothing to a live store taking orders — what to prepare, what to click, and what to do on day one.",
    cta: "Start building — it's free",
    shots: [SHOT.t03, SHOT.bloom],
    introTitle: "Before you start: what to have ready",
    intro: [
      "You don't need much. Keep these handy and the setup really does take minutes: your **brand name**, **5–10 product photos** taken in daylight, a **price and stock count** for each, and a rough idea of your **delivery charge**.",
      "Optional but useful: a short line about what makes your products different, your WhatsApp Business number, and your GSTIN if you're registered.",
    ],
    featuresTitle: "What you'll have at the end",
    features: [
      { icon: "Globe", title: "A live web address", text: "yourbrand.shopersite.in, secure and ready to share." },
      { icon: "LayoutTemplate", title: "A designed home page", text: "Your theme with banner, collections and products." },
      { icon: "Package", title: "Product pages", text: "Photos, price, MRP, options and stock for every item." },
      { icon: "ShieldCheck", title: "Policy pages", text: "Returns, shipping, terms and privacy from editable templates." },
      { icon: "Truck", title: "Delivery rules", text: "Free, flat or free above a value — your choice." },
      { icon: "Smartphone", title: "A dashboard in your pocket", text: "Manage orders from your phone browser or the Android app." },
    ],
    stepsTitle: "The four steps",
    steps: [
      { title: "Create your account", text: "Go to [sign up](/register), name your shop and choose what you sell. Pick the Free plan." },
      { title: "Add your products", text: "Products → Add product. Clear names like “Cotton kurta set, blue” help buyers and search engines." },
      { title: "Set delivery and payments", text: "Choose a delivery fee rule. Cash on delivery is on by default; online payments come with Growth." },
      { title: "Add a policy and open", text: "Add at least one policy page, switch your shop on and share the link everywhere." },
    ],
    extra: {
      title: "Your first week after launch",
      text: "The store is the start. These small habits bring the first orders.",
      items: [
        { title: "Day 1", text: "Share with friends, family and WhatsApp groups. Ask for honest feedback." },
        { title: "Day 2–3", text: "Post a reel showing a product in use, with your link." },
        { title: "Day 4–5", text: "Fix photos or descriptions on products that get views but no orders." },
        { title: "Day 6–7", text: "Try a small first-order coupon on Growth, or free delivery above a value." },
      ],
    },
    faqs: [
      { q: "How long does it take to build the store?", a: "Signing up takes a couple of minutes. Adding your first products and a policy page usually takes under an hour, depending on how many products you have." },
      { q: "Can I build the store on my phone?", a: "Yes. The whole dashboard works in a phone browser and in the Shopersite Android app." },
      { q: "Do I need a GST number to start?", a: "No. You can add a GSTIN later if you're registered. Check with a CA about whether you need one." },
    ],
    related: ["free-online-store-builder", "instagram-store-builder", "whatsapp-selling-website"],
    guides: ["create-online-store-for-free-india", "start-selling-online-without-investment"],
    docs: ["create-your-shop", "add-a-product", "open-your-shop"],
    bandTitle: "Ready? Build your store now",
  },
  {
    slug: "online-store-builder-india",
    keyword: "online store builder India",
    secondary: ["free online store builder India", "create ecommerce website free India", "free ecommerce platform for Indian sellers"],
    metaTitle: "Online Store Builder for India — COD, UPI, GST and Indian Couriers",
    metaDescription: "An online store builder made for India: cash on delivery, UPI and cards via Razorpay, rupee prices with GST, Shiprocket couriers and WhatsApp updates. Free to start.",
    crumb: "Online store builder for India",
    cardText: "COD, UPI, GST and couriers — built for Indian sellers.",
    kicker: "Made for Indian sellers",
    h1: "The online store builder made for selling in India",
    lead: "Cash on delivery, UPI, GST, Indian couriers and WhatsApp — the things Indian buyers expect, built in from the start rather than bolted on.",
    shots: [SHOT.t04, SHOT.t06],
    introTitle: "Global builders weren't designed for Indian buyers",
    intro: [
      "Indian shoppers still love **cash on delivery**, pay online mostly by **UPI**, and expect order updates on **WhatsApp**. Sellers deal with **GST**, **RTO** on COD orders and a patchwork of couriers.",
      "Shopersite is built around exactly that: COD controls to cut returns, Razorpay for UPI and cards, rupee pricing with GST settings, Shiprocket for courier booking, and one-tap WhatsApp messages from your own number.",
    ],
    featuresTitle: "India-first features",
    features: [
      { icon: "Wallet", title: "Cash on delivery, controlled", text: "Add a COD fee or a maximum order value for COD to reduce refused parcels." },
      { icon: "CreditCard", title: "UPI, cards and net banking", text: "Through your own Razorpay account; money goes straight to you.", plan: "Growth and Pro" },
      { icon: "Receipt", title: "GST settings and invoices", text: "GSTIN, state, default rate and “inclusive of all taxes” pricing. Invoices on Pro." },
      { icon: "Truck", title: "Shiprocket couriers", text: "Compare courier rates, print labels and book pickups from each order.", plan: "Growth and Pro" },
      { icon: "MessageCircle", title: "WhatsApp order updates", text: "Confirmed, shipped and delivered messages in one tap, on every plan." },
      { icon: "Smartphone", title: "Android app", text: "Run your shop from your phone with the Shopersite Android app." },
    ],
    stepsTitle: "Selling across India in four steps",
    steps: [
      { title: "Create your store", text: "Free plan, rupee pricing, your own shopersite.in address." },
      { title: "Set COD and delivery", text: "Pick a delivery rule and your COD options." },
      { title: "Add online payments", text: "On Growth, paste your Razorpay keys to accept UPI and cards." },
      { title: "Ship and update buyers", text: "Book couriers with Shiprocket and send WhatsApp updates." },
    ],
    extra: {
      title: "Plan your year around Indian festivals",
      text: "Diwali, Raksha Bandhan, Navratri, wedding season — see what sells and when to start.",
      items: [
        { title: "Festival calendar", text: "Every selling moment of the year in one place." },
        { title: "Festival playbook", text: "A six-week plan for stock, offers and delivery cut-offs." },
        { title: "Coupons and banners", text: "Festive codes and home-page banners on Growth." },
        { title: "Abandoned carts", text: "Remind buyers who didn't finish checkout during busy weeks." },
      ],
    },
    faqs: [
      { q: "Does Shopersite support UPI payments?", a: "Yes, through Razorpay on the Growth and Pro plans: buyers pay by UPI, cards, net banking or wallets and the money goes to your Razorpay account." },
      { q: "Can I sell all over India?", a: "Yes. With Shiprocket on Growth you can ship to pin codes its courier partners serve; you can also use any courier and add tracking manually." },
      { q: "Are prices shown in rupees with GST?", a: "Prices are in rupees. You choose whether they include GST, and product pages say “Inclusive of all taxes” when they do." },
    ],
    related: ["free-online-store-builder", "whatsapp-selling-website", "website-builder-for-small-business"],
    guides: ["gst-for-online-sellers", "cod-vs-prepaid-reduce-rto", "festival-sales-playbook"],
    docs: ["cash-on-delivery", "ship-with-shiprocket"],
  },
  {
    slug: "website-builder-for-small-business",
    keyword: "website builder for small business",
    secondary: ["free ecommerce website for small business", "online store for small businesses in India", "free website for home businesses"],
    metaTitle: "Website Builder for Small Businesses That Sell Products",
    metaDescription: "A simple website builder for small businesses, home brands and resellers: list products, take orders and manage customers without a developer. Free plan available.",
    crumb: "Website builder for small business",
    cardText: "For home brands, boutiques, bakers and resellers.",
    kicker: "For small businesses",
    h1: "A website builder for small businesses that sell things",
    lead: "Boutiques, home bakers, jewellery makers, resellers, local shops — get a website that takes orders and keeps your customers in one place, without hiring anyone.",
    shots: [SHOT.mono, SHOT.f01],
    introTitle: "Built for businesses run by one or a few people",
    intro: [
      "Small businesses don't need a hundred settings; they need the basics to work every day. Shopersite keeps it simple: add products, get orders, ship them, and see who your customers are.",
      "You can run everything from your phone between other jobs, and **Roxy**, the built-in AI assistant, can answer “how many orders this week?” or draft a product description in seconds.",
    ],
    featuresTitle: "What small businesses use most",
    features: [
      { icon: "Store", title: "Your own shop link", text: "One link for Instagram, WhatsApp, visiting cards and Google." },
      { icon: "Receipt", title: "Orders in one place", text: "No more notebooks and screenshots — every order with address and status." },
      { icon: "BarChart3", title: "Customers and repeat buyers", text: "See who ordered, how often and how much, with one-tap WhatsApp or call." },
      { icon: "Bot", title: "AI help when you're busy", text: "Roxy answers questions and prepares changes for you to confirm." },
      { icon: "ShieldCheck", title: "Policies done for you", text: "Ready templates for returns, shipping, terms and privacy." },
      { icon: "Smartphone", title: "Run it from your phone", text: "Full dashboard in the browser or the Android app." },
    ],
    stepsTitle: "Getting your small business online",
    steps: [
      { title: "Sign up", text: "Choose your category — food, fashion, beauty, home and more." },
      { title: "List what you sell", text: "Start with your best 10 products; add the rest later." },
      { title: "Decide delivery", text: "Local delivery, a flat fee, or couriers for all-India orders." },
      { title: "Tell your customers", text: "Share the link with existing buyers first — they're your easiest orders." },
    ],
    extra: {
      title: "Who uses it",
      text: "A few of the kinds of businesses Shopersite is designed for.",
      items: [
        { title: "Home bakers and food brands", text: "Pre-orders, local delivery and repeat buyers. FSSAI rules apply to food." },
        { title: "Boutiques and designers", text: "Sizes, colours and new-arrival drops." },
        { title: "Jewellery and accessories", text: "Light to ship, great for gifting seasons." },
        { title: "Resellers", text: "A professional shop link instead of forwarded catalogue photos." },
      ],
    },
    faqs: [
      { q: "I already sell offline. Is an online store worth it?", a: "For most small shops it's a second channel: regulars can reorder from home, and your link reaches people who never walk past. Start free and see." },
      { q: "Can I manage it without technical skills?", a: "Yes. If you can use WhatsApp, you can run a Shopersite store. There's a Help Center and an AI assistant for questions." },
      { q: "How many products can a small business list for free?", a: "Up to 75 on the Free plan, 200 on Growth and unlimited on Pro." },
    ],
    related: ["free-website-for-small-business", "build-online-store-for-free", "online-store-builder-india"],
    guides: ["take-your-local-shop-online", "home-business-ideas-india"],
    docs: ["dashboard-tour", "customers"],
  },
  {
    slug: "instagram-store-builder",
    keyword: "website for Instagram sellers",
    secondary: ["how to create a store for Instagram business", "Instagram shop website", "online store for Instagram"],
    metaTitle: "Store Builder for Instagram Sellers — Turn DMs Into Orders",
    metaDescription: "Selling on Instagram? Give followers a real shop link with prices, sizes and checkout. Shopersite turns “price?” DMs into orders you can track. Free to start.",
    crumb: "Store for Instagram sellers",
    cardText: "One bio link that takes orders while you post.",
    kicker: "For Instagram sellers",
    h1: "Your Instagram already sells. Give it a proper store.",
    lead: "Stop answering “price?” in DMs. Put one link in your bio that shows every product with price, sizes and stock — and lets followers order themselves, day or night.",
    cta: "Create my Instagram store",
    shots: [SHOT.f01, SHOT.t03],
    introTitle: "Why Instagram sellers move orders to a website",
    intro: [
      "Instagram is brilliant for being discovered and terrible for taking orders. Prices get lost in comments, addresses come in screenshots, and payment mix-ups eat your evenings.",
      "With a Shopersite store, your posts and reels keep doing the marketing, while your bio link does the selling: buyers pick products, enter their own address and choose how to pay. Every order lands in one dashboard. Read more in [Instagram shop vs your own website](/explore/instagram-shop-vs-own-website).",
    ],
    featuresTitle: "Made for social selling",
    features: [
      { icon: "Globe", title: "One link for your bio", text: "yourbrand.shopersite.in, or your own domain on Pro." },
      { icon: "ImageIcon", title: "Product pages that match your feed", text: "Big photos, clean themes and options like size and colour." },
      { icon: "ShoppingBag", title: "Self-serve checkout", text: "Buyers fill in their own details — no more typing addresses from screenshots." },
      { icon: "MessageCircle", title: "WhatsApp updates", text: "Confirmed and shipped messages written for you." },
      { icon: "Tag", title: "Drop-day coupons", text: "Codes for followers and early-access offers.", plan: "Growth and Pro" },
      { icon: "BarChart3", title: "Pixel tracking", text: "Connect Meta Pixel to see which posts and ads bring orders." },
    ],
    stepsTitle: "Set it up between posts",
    steps: [
      { title: "Create your store", text: "Use your Instagram handle as the shop name so it feels familiar." },
      { title: "Add your current collection", text: "Start with what's in your highlights." },
      { title: "Swap your bio link", text: "Replace link-in-bio pages with your store link." },
      { title: "Reply with links", text: "When someone asks the price, reply with the product link." },
    ],
    faqs: [
      { q: "Does this replace Instagram Shopping?", a: "It works alongside it. Your store is the place every link — bio, stories, DMs and captions — sends buyers to complete their order." },
      { q: "Can I add a link to a specific product in a story?", a: "Yes. Every product has its own link you can copy from the Products page and add as a story link sticker." },
      { q: "Can I see which Instagram posts drive sales?", a: "Add your Meta Pixel ID in Settings → Tracking & ads, and use links with UTM tags in your bio and stories." },
    ],
    related: ["whatsapp-selling-website", "free-online-store-builder", "build-online-store-for-free"],
    guides: ["sell-on-instagram-and-whatsapp", "instagram-shop-vs-own-website"],
    docs: ["tracking-pixels", "whatsapp-order-messages"],
    bandTitle: "Turn your followers into orders",
  },
  {
    slug: "whatsapp-selling-website",
    keyword: "online store for WhatsApp sellers",
    secondary: ["how to sell products through WhatsApp", "WhatsApp business website", "sell on WhatsApp with a website"],
    metaTitle: "Online Store for WhatsApp Sellers — Catalog, Checkout, Updates",
    metaDescription: "Sell on WhatsApp without the chaos: share one store link, let buyers order themselves, and send ready-written order updates from your own WhatsApp number. Free plan.",
    crumb: "Store for WhatsApp sellers",
    cardText: "Keep chatting on WhatsApp; let the store take the orders.",
    kicker: "For WhatsApp sellers",
    h1: "Sell on WhatsApp, with a store that does the busywork",
    lead: "Keep the conversations on WhatsApp. Move the catalog, order details and payment into a store link — then send order updates back to WhatsApp in one tap.",
    shots: [SHOT.t06, SHOT.bloom],
    introTitle: "WhatsApp is for talking. Your store is for ordering.",
    intro: [
      "Forwarding catalogue photos, confirming sizes, collecting addresses and chasing payment screenshots — it works for ten orders a week and breaks at fifty.",
      "With Shopersite, buyers browse your full catalog from one link and place the order themselves. You get every order in your dashboard, and each order has **WhatsApp the buyer** buttons that open WhatsApp with the update already written — confirmed, shipped with tracking, delivered. It's free on every plan and uses your own number.",
    ],
    featuresTitle: "Built around WhatsApp",
    features: [
      { icon: "MessageCircle", title: "One-tap order messages", text: "Four ready messages per order. Edit the wording any time with placeholders like {name} and {tracking}." },
      { icon: "Store", title: "A catalog link to share", text: "Post it on Status, in groups and in your WhatsApp Business profile." },
      { icon: "ShoppingBag", title: "Orders with full details", text: "Address, phone, items and payment method — no screenshots." },
      { icon: "BarChart3", title: "Customers list", text: "See repeat buyers and message them in one tap." },
      { icon: "Zap", title: "Abandoned-checkout reminders", text: "See who didn't finish and nudge them on WhatsApp.", plan: "Growth and Pro" },
      { icon: "Wallet", title: "COD or online payment", text: "Cash on delivery on every plan; UPI and cards on Growth." },
    ],
    stepsTitle: "How WhatsApp selling works with a store",
    steps: [
      { title: "Share your store link", text: "On Status, in your profile and in replies." },
      { title: "Buyer orders themselves", text: "They pick products, sizes and pay or choose COD." },
      { title: "You confirm in one tap", text: "Open the order and tap “Order confirmed” to message them." },
      { title: "Ship and update", text: "Send tracking with the “Shipped” message." },
    ],
    faqs: [
      { q: "Do I need the WhatsApp Business API?", a: "No. Messages open in your normal WhatsApp or WhatsApp Business app with the text filled in. You press send — so it's free." },
      { q: "Can I change the wording of the messages?", a: "Yes. In Plugins → WhatsApp, edit each message and use placeholders like {name}, {order} and {tracking_link}." },
      { q: "Can buyers still message me?", a: "Of course. Your number stays on your store, and buyers can reach you on WhatsApp any time." },
    ],
    related: ["instagram-store-builder", "online-store-builder-india", "free-online-store-builder"],
    guides: ["how-to-sell-on-whatsapp", "get-repeat-customers"],
    docs: ["whatsapp-order-messages", "abandoned-checkouts"],
    bandTitle: "Give your WhatsApp business a store",
  },
  {
    slug: "free-website-for-small-business",
    keyword: "free website for small business",
    secondary: ["free business website builder", "free website builder", "free selling website", "free website for resellers"],
    metaTitle: "Free Website for Small Business — With Ordering Built In",
    metaDescription: "Get a free website for your small business that also takes orders: products, contact details, policies and your own web address. No coding, no credit card.",
    crumb: "Free website for small business",
    cardText: "A free business website that also takes orders.",
    kicker: "Free business website",
    h1: "A free website for your small business — that also takes orders",
    lead: "Most free business websites are a page with your phone number. Yours can show everything you sell, take orders and look professional when customers search for you.",
    shots: [SHOT.bloom, SHOT.t03],
    introTitle: "More than an online visiting card",
    intro: [
      "Customers check a business online before they buy. A Shopersite site gives them what they're looking for — what you sell, prices, how delivery works, your policies and how to reach you — and lets them order on the spot.",
      "It's free on the Free plan with your own address at **yourbrand.shopersite.in**. If you want **www.yourbrand.com**, connect your own domain on Pro.",
    ],
    featuresTitle: "What your free business website includes",
    features: [
      { icon: "LayoutTemplate", title: "A professional design", text: "A ready theme with your logo, banner and colours." },
      { icon: "Package", title: "Your products and prices", text: "Up to 75 products on Free, organised in categories." },
      { icon: "ShieldCheck", title: "Trust pages", text: "Contact details and policy pages from templates." },
      { icon: "Search", title: "Findable on Google", text: "Clear pages search engines can read, with your shop name in the title." },
      { icon: "Palette", title: "Your look", text: "Change photos on Free; text, sections and colours on Growth." },
      { icon: "Globe", title: "Your own domain", text: "Connect www.yourbrand.com when you're ready.", plan: "Pro" },
    ],
    stepsTitle: "Your business online today",
    steps: [
      { title: "Sign up free", text: "No card, no coding." },
      { title: "Add your logo and products", text: "Settings → Store link & logo, then Products." },
      { title: "Add contact and policies", text: "So customers know how to reach you and what to expect." },
      { title: "Share and list it", text: "Add the link to Google Business Profile, Instagram and WhatsApp." },
    ],
    faqs: [
      { q: "Is the website really free?", a: "Yes — the Free plan is ₹0 forever with your own shopersite.in address. You pay only if you choose Growth or Pro features." },
      { q: "Can I use my own domain for free?", a: "Connecting your own domain is part of the Pro plan. On Free and Growth, your shop lives at yourbrand.shopersite.in." },
      { q: "Can resellers use it?", a: "Yes. Resellers often use it to share one professional catalog link instead of forwarding photos. Make sure you have the right to sell and photograph the products you list." },
    ],
    related: ["website-builder-for-small-business", "free-online-store-builder", "free-ecommerce-website-builder"],
    guides: ["take-your-local-shop-online", "start-selling-online-without-investment"],
    docs: ["logo-and-store-link", "connect-your-own-domain", "seo-basics"],
  },
];

export const LANDING_BY_SLUG = Object.fromEntries(LANDINGS.map((l) => [l.slug, l]));
