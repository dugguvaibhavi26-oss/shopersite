/**
 * The free command assistant: common requests understood by our own code, with no AI and no limit.
 * Anything it doesn't recognise goes to the AI (if the seller has budget left).
 *
 * Works for simple English and common Hinglish ("orders dikhao", "1043 ship karo").
 */

export type DashPage =
  | "overview"
  | "analytics"
  | "products"
  | "categories"
  | "orders"
  | "discounts"
  | "customers"
  | "reviews"
  | "themes"
  | "plugins"
  | "settings"
  | "billing"
  | "policies"
  | "notifications"
  | "profile";

export const PAGE_LABELS: Record<DashPage, string> = {
  overview: "Home",
  analytics: "Analytics",
  products: "Products",
  categories: "Categories",
  orders: "Orders",
  discounts: "Discounts",
  customers: "Customers",
  reviews: "Reviews",
  themes: "Themes",
  plugins: "Plugins",
  settings: "Settings",
  billing: "Plan & billing",
  policies: "Policies",
  notifications: "Notifications",
  profile: "Profile",
};

export type OrderStep = "confirmed" | "packed" | "shipped" | "delivered";

export type Command =
  | { kind: "navigate"; page: DashPage; action?: "add-product" }
  | { kind: "order_status"; number: string; status: OrderStep }
  | { kind: "stat"; metric: "orders_today" | "orders_week" | "pending_orders" | "sales_today" | "sales_week" | "sales_month" | "low_stock" | "product_count" | "customer_count" };

// order matters: more specific words first
const PAGES: [RegExp, DashPage][] = [
  [/\b(plan|plans|billing|upgrade|subscription)\b/, "billing"],
  [/\b(analytics|reports?|insights|stats|statistics)\b/, "analytics"],
  [/\b(polic(y|ies)|terms|refund policy|privacy)\b/, "policies"],
  [/\b(discounts?|coupons?|offers?|promo)\b/, "discounts"],
  [/\b(reviews?|ratings?)\b/, "reviews"],
  [/\b(customers?|buyers?|grahak)\b/, "customers"],
  [/\b(categor(y|ies)|collections?)\b/, "categories"],
  [/\b(themes?|design|look)\b/, "themes"],
  [/\b(plugins?|shiprocket|gmail|integrations?)\b/, "plugins"],
  [/\b(notifications?|alerts?)\b/, "notifications"],
  [/\b(profile|account)\b/, "profile"],
  [/\b(orders?)\b/, "orders"],
  [/\b(products?|items?|inventory|catalog(ue)?)\b/, "products"],
  [/\b(settings?|payments?|upi|cod|delivery|shipping|taxes|gst|domain)\b/, "settings"],
  [/\b(home|dashboard|overview)\b/, "overview"],
];

const OPEN = /\b(open|show|go( to)?|take me( to)?|view|see|dikhao|dikha|kholo|khol|batao)\b/;

const STEP_WORDS: [RegExp, OrderStep][] = [
  [/\b(deliver(ed)?|delivery done|pahunch)/, "delivered"],
  [/\b(ship(ped)?|dispatch(ed)?|bhej)/, "shipped"],
  [/\b(pack(ed)?)\b/, "packed"],
  [/\b(confirm(ed)?|accept(ed)?)\b/, "confirmed"],
];

export function parseCommand(input: string): Command | null {
  const t = ` ${input.toLowerCase().replace(/[?!.,]+/g, " ").replace(/\s+/g, " ").trim()} `;
  if (t.trim().length < 2 || t.length > 120) return null;

  // "mark order 1043 shipped", "#1043 delivered", "1043 ship karo"
  const num = t.match(/#\s?(\d{3,7})\b/) || t.match(/\border\s+(?:no\.?\s*|number\s*)?#?(\d{3,7})\b/) || (/\b(mark|set|make|karo|kar do)\b/.test(t) ? t.match(/\b(\d{3,7})\b/) : null);
  if (num) {
    for (const [re, status] of STEP_WORDS) if (re.test(t)) return { kind: "order_status", number: num[1], status };
  }

  // longer sentences are real questions: leave them to the AI
  if (t.trim().split(" ").length > 7) return null;

  // quick numbers
  const asks = /\b(how many|kitne|kitna|count|total|today|aaj|this week|week|month|sales|sold|revenue|earn(ed|ings)?|kamai)\b/.test(t);
  if (asks || /\b(pending|new|naye?)\s+orders?\b/.test(t) || /\blow stock|out of stock|stock (khatam|kam)\b/.test(t)) {
    if (/\b(low stock|out of stock|stock (khatam|kam)|running out)\b/.test(t)) return { kind: "stat", metric: "low_stock" };
    if (/\b(pending|new|naye?|waiting)\b/.test(t) && /\borders?\b/.test(t)) return { kind: "stat", metric: "pending_orders" };
    if (/\b(sales|sold|revenue|earn(ed|ings)?|kamai|money)\b/.test(t)) {
      if (/\b(month|mahina|mahine)\b/.test(t)) return { kind: "stat", metric: "sales_month" };
      if (/\b(week|hafta|hafte)\b/.test(t)) return { kind: "stat", metric: "sales_week" };
      if (/\b(today|aaj)\b/.test(t)) return { kind: "stat", metric: "sales_today" };
    }
    if (/\borders?\b/.test(t)) {
      if (/\b(week|hafta|hafte)\b/.test(t)) return { kind: "stat", metric: "orders_week" };
      if (/\b(today|aaj)\b/.test(t)) return { kind: "stat", metric: "orders_today" };
    }
    if (/\b(how many|kitne|count|total)\b/.test(t)) {
      if (/\bproducts?\b/.test(t)) return { kind: "stat", metric: "product_count" };
      if (/\bcustomers?\b/.test(t)) return { kind: "stat", metric: "customer_count" };
    }
  }

  // "add product" / "new product" (only the bare command; details go to the AI)
  if (/^ (add|new|create) (a )?product $/.test(t) || /^ (naya|nayi) product (add )?(karo|banao)? ?$/.test(t)) return { kind: "navigate", page: "products", action: "add-product" };

  // "open orders", "show customers", or just "orders"
  const words = t.trim().split(" ");
  if (OPEN.test(t) || words.length <= 2) {
    for (const [re, page] of PAGES) if (re.test(t)) return { kind: "navigate", page };
  }
  return null;
}
