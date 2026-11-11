/**
 * Every place in the seller dashboard a Home card can open. The admin picks one from this list
 * (Admin → Discover cards → "Opens"), so a card about payments can take the seller straight to
 * Payments. Add a line here when the dashboard gets a new page.
 */

export type FeatureTarget =
  | { kind: "tab"; tab: "analytics" | "products" | "categories" | "orders" | "discounts" | "customers" | "reviews" | "staff" | "workplace" | "themes" | "plugins" | "notifications" | "profile" }
  | { kind: "settings"; section: "general" | "billing" | "store" | "domain" | "payments" | "checkout" | "accounts" | "delivery" | "taxes" | "notifications" | "events" | "privacy" | "policies" }
  | { kind: "plugin"; plugin: "razorpay" | "shiprocket" | "whatsapp" | "gmail" }
  | { kind: "add-product" }
  | { kind: "abandoned" }
  | { kind: "assistant" }
  | { kind: "tool"; tool: "trending" | "calendar" | "creative" | "academy" }
  | { kind: "tips"; tips: "season" | "design" | "templates" | "photo" | "new" };

export interface DashboardFeature {
  id: string;
  label: string;
  group: string;
  /** one line saying what the page is for (shown in the picker, and searched) */
  hint: string;
  /** the button text a card gets when the admin leaves it empty */
  button: string;
  /** extra words to find it by */
  words?: string;
  target: FeatureTarget;
}

export const DASHBOARD_FEATURES: DashboardFeature[] = [
  // selling
  { id: "products", group: "Selling", label: "Products", hint: "The list of everything the shop sells", button: "Open products", words: "catalogue items stock inventory", target: { kind: "tab", tab: "products" } },
  { id: "add-product", group: "Selling", label: "Add a product", hint: "Opens the new product form", button: "Add a product", words: "new item create upload", target: { kind: "add-product" } },
  { id: "categories", group: "Selling", label: "Categories", hint: "Group products so buyers find them", button: "Open categories", words: "collections groups", target: { kind: "tab", tab: "categories" } },
  { id: "orders", group: "Selling", label: "Orders", hint: "New, shipped and delivered orders, with invoices", button: "View orders", words: "sales invoice gst ship fulfil", target: { kind: "tab", tab: "orders" } },
  { id: "abandoned", group: "Selling", label: "Unfinished checkouts", hint: "Buyers who left before paying", button: "See unfinished checkouts", words: "abandoned cart recover", target: { kind: "abandoned" } },
  { id: "discounts", group: "Selling", label: "Discounts & coupons", hint: "Coupon codes and offers", button: "Create a coupon", words: "sale offer promo code", target: { kind: "tab", tab: "discounts" } },
  { id: "customers", group: "Selling", label: "Customers", hint: "Everyone who has ordered", button: "View customers", words: "buyers people contacts", target: { kind: "tab", tab: "customers" } },
  { id: "reviews", group: "Selling", label: "Reviews", hint: "What buyers said about products", button: "See reviews", words: "ratings stars feedback", target: { kind: "tab", tab: "reviews" } },
  { id: "analytics", group: "Selling", label: "Analytics", hint: "Sales, visits and best sellers (computers)", button: "See analytics", words: "reports numbers stats revenue", target: { kind: "tab", tab: "analytics" } },

  // store design
  { id: "themes", group: "Store design", label: "Themes & store editor", hint: "Change the look, banners and sections of the store", button: "Customise store", words: "design template banner slider layout colours", target: { kind: "tab", tab: "themes" } },
  { id: "settings-store", group: "Store design", label: "Store link & logo", hint: "Web address, logo and the message bar", button: "Add your logo", words: "subdomain announcement branding", target: { kind: "settings", section: "store" } },
  { id: "settings-domain", group: "Store design", label: "Custom domain (Pro)", hint: "Use www.yourbrand.com for the store", button: "Connect a domain", words: "dns website address url", target: { kind: "settings", section: "domain" } },

  // payments and delivery
  { id: "settings-payments", group: "Payments & delivery", label: "Payments", hint: "Razorpay and cash on delivery", button: "Set up payments", words: "payment gateway razorpay cod online card money", target: { kind: "settings", section: "payments" } },
  { id: "plugin-razorpay", group: "Payments & delivery", label: "Razorpay one-click connect", hint: "Connect Razorpay by signing in, no keys to copy", button: "Connect Razorpay", words: "payment gateway razorpay online upi card plugin oauth", target: { kind: "plugin", plugin: "razorpay" } },
  { id: "settings-checkout", group: "Payments & delivery", label: "Checkout", hint: "Minimum order, COD limit, buyer fields", button: "Open checkout settings", words: "order rules minimum", target: { kind: "settings", section: "checkout" } },
  { id: "settings-delivery", group: "Payments & delivery", label: "Shipping & delivery", hint: "What buyers pay for delivery", button: "Set delivery charges", words: "shipping rates courier free delivery pincode", target: { kind: "settings", section: "delivery" } },
  { id: "settings-taxes", group: "Payments & delivery", label: "Taxes", hint: "GST number and how prices are shown", button: "Add GST details", words: "gst tax gstin", target: { kind: "settings", section: "taxes" } },
  { id: "plugin-shiprocket", group: "Payments & delivery", label: "Shiprocket shipping", hint: "Compare couriers, book pickups, track orders", button: "Connect Shiprocket", words: "courier label tracking plugin", target: { kind: "plugin", plugin: "shiprocket" } },

  // talking to buyers
  { id: "plugin-whatsapp", group: "Talking to buyers", label: "WhatsApp order updates", hint: "One-tap order messages to buyers", button: "Set up WhatsApp", words: "message chat plugin", target: { kind: "plugin", plugin: "whatsapp" } },
  { id: "plugin-gmail", group: "Talking to buyers", label: "Emails to buyers (Gmail)", hint: "Order and new-product emails from your Gmail", button: "Connect Gmail", words: "email mail newsletter plugin", target: { kind: "plugin", plugin: "gmail" } },
  { id: "plugins", group: "Talking to buyers", label: "All plugins", hint: "Every add-on in one place", button: "Browse plugins", words: "apps integrations add-ons", target: { kind: "tab", tab: "plugins" } },
  { id: "settings-accounts", group: "Talking to buyers", label: "Customer accounts", hint: "Guest orders or sign-in first", button: "Open customer accounts", words: "login sign in guest", target: { kind: "settings", section: "accounts" } },
  { id: "settings-events", group: "Talking to buyers", label: "Tracking & ads", hint: "Meta and Google tracking for visits and ads", button: "Connect tracking", words: "pixel facebook instagram google analytics marketing", target: { kind: "settings", section: "events" } },

  // team
  { id: "staff", group: "Team", label: "Staff accounts (Pro)", hint: "Give helpers their own sign-in and role", button: "Add staff", words: "team members roles employees", target: { kind: "tab", tab: "staff" } },
  { id: "workplace", group: "Team", label: "WorkPlace team chat (Pro)", hint: "Chat with your staff inside the dashboard", button: "Open WorkPlace", words: "messages chat team", target: { kind: "tab", tab: "workplace" } },

  // grow
  { id: "assistant", group: "Grow", label: "Roxy assistant", hint: "Ask questions and get things done by chat", button: "Ask Roxy", words: "ai help chat", target: { kind: "assistant" } },
  { id: "tool-trending", group: "Grow", label: "What's trending", hint: "Rising products and what sells this season", button: "See what's trending", words: "trends popular", target: { kind: "tool", tool: "trending" } },
  { id: "tool-calendar", group: "Grow", label: "Campaign calendar", hint: "Upcoming festivals and sale days", button: "Open calendar", words: "festival sale dates plan", target: { kind: "tool", tool: "calendar" } },
  { id: "tool-creative", group: "Grow", label: "Creative lab", hint: "Captions, posts and descriptions with AI", button: "Open Creative lab", words: "ai writing captions instagram", target: { kind: "tool", tool: "creative" } },
  { id: "tool-academy", group: "Grow", label: "Seller academy", hint: "Short lessons to get more orders", button: "Start learning", words: "learn lessons guide", target: { kind: "tool", tool: "academy" } },
  { id: "tips-season", group: "Grow", label: "Seasonal selling ideas", hint: "This month's festival and sale ideas", button: "See this month's ideas", words: "festival diwali wedding", target: { kind: "tips", tips: "season" } },
  { id: "tips-design", group: "Grow", label: "Store design inspiration", hint: "Simple tips for a better-looking shop", button: "Get design ideas", words: "tips look brand", target: { kind: "tips", tips: "design" } },
  { id: "tips-templates", group: "Grow", label: "Marketing templates", hint: "Ready WhatsApp and Instagram messages", button: "Copy a template", words: "messages captions share", target: { kind: "tips", tips: "templates" } },
  { id: "tips-photo", group: "Grow", label: "Product photo tips", hint: "Better photos with a phone and daylight", button: "See photo tips", words: "pictures images camera", target: { kind: "tips", tips: "photo" } },
  { id: "tips-new", group: "Grow", label: "New in Shopersite", hint: "The latest features", button: "See what's new", words: "updates changelog", target: { kind: "tips", tips: "new" } },

  // account and store settings
  { id: "settings-general", group: "Account & settings", label: "General settings", hint: "Store name, contact details, open or closed", button: "Open settings", words: "store name phone address", target: { kind: "settings", section: "general" } },
  { id: "settings-billing", group: "Account & settings", label: "Plan & billing", hint: "The Shopersite plan, limits and past payments", button: "See plans", words: "upgrade subscription pro growth price", target: { kind: "settings", section: "billing" } },
  { id: "settings-policies", group: "Account & settings", label: "Policies", hint: "Terms, returns, shipping and privacy pages", button: "Write policies", words: "legal refund return terms", target: { kind: "settings", section: "policies" } },
  { id: "settings-privacy", group: "Account & settings", label: "Customer privacy", hint: "Cookie notice and data requests", button: "Open privacy settings", words: "cookies data consent", target: { kind: "settings", section: "privacy" } },
  { id: "settings-notifications", group: "Account & settings", label: "Notification settings", hint: "Emails Shopersite sends about the store", button: "Choose notifications", words: "alerts email", target: { kind: "settings", section: "notifications" } },
  { id: "notifications", group: "Account & settings", label: "Notifications inbox", hint: "Recent alerts about orders and the store", button: "Open notifications", words: "alerts bell", target: { kind: "tab", tab: "notifications" } },
  { id: "profile", group: "Account & settings", label: "Profile", hint: "Your name, email and sign-in", button: "Open profile", words: "account password", target: { kind: "tab", tab: "profile" } },
];

const BY_ID = new Map(DASHBOARD_FEATURES.map((f) => [f.id, f]));

export function getFeature(id: unknown): DashboardFeature | undefined {
  return typeof id === "string" ? BY_ID.get(id) : undefined;
}

/** a saved feature id, or "" when it is not one we know (a removed page never breaks a card) */
export function cleanFeature(id: unknown): string {
  return getFeature(id)?.id ?? "";
}

/** The features matching what was typed: every word must appear in the name, group, hint or extra words. */
export function searchFeatures(query: string): DashboardFeature[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return DASHBOARD_FEATURES;
  return DASHBOARD_FEATURES.filter((f) => {
    const hay = `${f.label} ${f.group} ${f.hint} ${f.words || ""}`.toLowerCase();
    return words.every((w) => hay.includes(w));
  });
}
