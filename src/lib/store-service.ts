import { BILLING_CYCLES, PLATFORM_PLANS, canAddProduct, canUseCoupons, calculatePlanPrice, type BillingCycle, applyPlanAccess, getDefaultPlanAccess, getAllPlanAccess, applyPlanDetails, getAllPlanDetails, getDefaultPlanDetails, type PlanAccess, type PlanDetails, type PlanId } from "./plans";
import { getTheme, PLATFORM_THEMES } from "./themes";
import { applyThemePricing, canUseTheme, FREE_THEME_SLUG, THEME_SALES, formatThemePrice, getThemePlan, getThemePrice, getThemePricingOverrides, MAX_THEME_PRICE, ownsTheme, type ThemePlan } from "./theme-pricing";
import { registerCustomThemes, type CustomThemeDef } from "./site-content";
import { auth, db, storage } from "./firebase";
import { getStoreDomain, siteConfig } from "./config/site";
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import {
  collection,
  collectionGroup,
  doc,
  setDoc,
  updateDoc,
  getDoc,
  getDocFromServer,
  deleteDoc,
  getDocs,
  onSnapshot,
} from "firebase/firestore";
import { isReservedSubdomain } from "./reserved-names";
import type { OrderPolicy, PolicyId, StorePolicy } from "./policies";
import { BILLING_KEYS, OWNER_LOCKED_KEYS, mergeStoreParts, splitStoreUpdate } from "./store-keys";
import type { PlanBilling } from "./billing/subscription-core";

export interface ProductVariant {
  id: string;
  name: string; // e.g. "Size", "Color"
  options: string[]; // ["S", "M", "L"]
}

export interface ProductData {
  id: string;
  storeId: string;
  title: string;
  slug: string;
  description: string;
  price: number; // in paise (e.g. 69900 = ₹699)
  compareAtPrice?: number; // in paise
  costPrice?: number; // in paise
  /** GST % for invoices (0, 3, 5, 12, 18, 28); missing = the store's default in Settings → Taxes */
  gstRate?: number;
  stock: number;
  category: string;
  gender?: "Men" | "Women" | "Unisex";
  images: string[];
  status: "published" | "draft" | "hidden";
  rating?: number;
  reviewCount?: number;
  colorSwatches?: string[]; // e.g. ["#111111", "#EDE6DC", "#545C4B"]
  options?: ProductVariant[];
  /** most a buyer can order of this product in one order; missing = no limit (only stock) */
  maxPerOrder?: number;
  /** cash on delivery isn't offered when this product is in the bag (online payment only) */
  codBlocked?: boolean;
  details?: {
    fabric?: string;
    fit?: string;
    care?: string;
  };
  createdAt: string;
}

export interface BannerData {
  id: string;
  storeId: string;
  title?: string;
  subtitle?: string;
  imageUrl: string;
  ctaText?: string;
  ctaLink: string;
  targetType?: "category" | "product" | "custom";
  targetValue?: string;
  position: number;
  isActive: boolean;
}

export interface ReviewData {
  id: string;
  storeId: string;
  productId: string;
  customerName: string;
  customerPhone?: string;
  rating: number; // 1-5
  title?: string;
  comment: string;
  verifiedPurchase: boolean;
  status: "approved" | "pending" | "rejected";
  createdAt: string;
}

export interface OrderItemData {
  productId: string;
  title: string;
  image: string;
  quantity: number;
  price: number; // paise
  variantName?: string;
}

export interface OrderData {
  id: string;
  storeId: string;
  number: string; // e.g. "#1004"
  token: string; // unguessable tracking token
  customer: {
    name: string;
    phone: string;
    email?: string;
    /** a second number to reach the buyer (Settings → Checkout) */
    altPhone?: string;
  };
  /** the buyer's account, when they were signed in to the shop while ordering */
  customerUid?: string;
  address: {
    street: string;
    /** a landmark near the address (Settings → Checkout) */
    landmark?: string;
    city: string;
    state: string;
    pincode: string;
  };
  /** the buyer ticked "send me offers" at checkout */
  marketingOptIn?: boolean;
  items: OrderItemData[];
  subtotal: number; // paise
  discount: number; // paise
  delivery: number; // paise
  codFee: number; // paise
  total: number; // paise
  /** "cashfree"/"razorpay": paid online through the seller's own payment account (settled to the seller) */
  paymentMethod: "upi" | "cod" | "bank_transfer" | "cashfree" | "razorpay";
  paymentStatus: "awaiting_verification" | "verified" | "cod_pending" | "paid" | "rejected";
  paymentUtr?: string;
  /** Cashfree order id (same as `id` for online orders) */
  cfOrderId?: string;
  /** Cashfree payment id of the successful payment */
  cfPaymentId?: string;
  fulfilmentStatus: "placed" | "confirmed" | "packed" | "shipped" | "delivered" | "cancelled";
  courierName?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  /** set by the Shiprocket plugin once the order is pushed to the seller's Shiprocket account */
  shiprocket?: {
    orderId: number;
    shipmentId: number;
    awb?: string;
    courierId?: number;
    labelUrl?: string;
    pickupBooked?: boolean;
    /** Shiprocket's latest status text, e.g. "IN TRANSIT" */
    status?: string;
    updatedAt: string;
  };
  notes?: string;
  /** set when the order is marked delivered (starts the return window) */
  deliveredAt?: string;
  cancelledAt?: string;
  cancelledBy?: "buyer" | "seller";
  /** shown to the buyer */
  cancelReason?: string;
  /** a buyer's return request and the shop's answer */
  returnRequest?: {
    status: "requested" | "approved" | "declined" | "received";
    reason: string;
    requestedAt: string;
    answeredAt?: string;
    /** the shop's note to the buyer (why declined, how to send it back…) */
    note?: string;
  };
  /** money owed back to the buyer after a cancellation or return */
  refund?: {
    status: "due" | "refunded";
    amount: number; // paise
    reference?: string;
    refundedAt?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CustomerData {
  id: string;
  storeId: string;
  name: string;
  phone: string;
  email?: string;
  totalOrders: number;
  totalSpent: number; // paise
  lastOrderAt: string;
  /** agreed at checkout to get offers and new arrivals from the shop */
  marketingOptIn?: boolean;
}

export interface CustomBrandTheme {
  primary: string; // Brand accent & buttons (e.g. #111111)
  background: string; // Page background / canvas (e.g. #FDFBF7)
  surface: string; // Card / container surface (e.g. #FFFFFF)
}

export interface CategoryData {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  /** wide photo across the top of the category's page, in themes that show one (falls back to imageUrl) */
  bannerUrl?: string;
  itemCount?: number;
  isActive: boolean;
  position: number;
  createdAt?: string;
  isParent?: boolean; // true if this is a Parent Category / Collection card
  parentId?: string; // id of parent category if this is a child
  subtitle?: string; // e.g. "Modern fits for everyday style."
  ctaText?: string; // e.g. "Shop Denim & Jeans"
  ctaCategorySlug?: string;
}

export interface DiscountData {
  id: string;
  code: string; // e.g. "WELCOME10", "FESTIVE20"
  type: "percentage" | "flat"; // percentage or flat in paise
  value: number; // percentage (e.g. 15 for 15%) or paise (e.g. 10000 for ₹100)
  minOrderValue?: number; // in paise
  maxDiscount?: number; // in paise (for percentage discounts)
  usageLimit?: number;
  timesUsed: number;
  isActive: boolean;
  startsAt?: string;
  expiresAt?: string;
  createdAt: string;
}

export interface CheckoutRules {
  /** smallest order (after discount, before delivery) in paise; 0 = no minimum */
  minOrder?: number;
  /** largest order total allowed with cash on delivery, in paise; 0 = no limit */
  codMax?: number;
  /** show the "note for the shop" box at checkout (on unless switched off) */
  orderNotes?: boolean;
  /** buyer email at checkout */
  email?: "optional" | "required" | "hidden";
  /** buyers must sign in before ordering */
  requireLogin?: boolean;
  /** ask for a landmark near the address */
  landmark?: "optional" | "required" | "hidden";
  /** ask for a second phone number */
  altPhone?: "optional" | "required" | "hidden";
  /** show an unticked "send me offers" box at checkout */
  marketingOptIn?: boolean;
  /** PIN codes where cash on delivery isn't offered (when online payment is set up) */
  codPincodes?: string[];
  /** the shop's own words on the order confirmation page */
  thankYou?: string;
}

export interface StoreData {
  id: string;
  name: string;
  subdomain: string;
  status: "draft" | "published" | "suspended";
  category: string;
  tagline: string;
  logoUrl?: string;
  ownerName: string;
  ownerId?: string;
  ownerEmail?: string;
  contactPhone: string;
  contactEmail?: string;
  instagramHandle?: string;
  /** the seller's business address, shown to buyers on the contact page (Settings → General) */
  businessAddress?: string;
  /** Settings → Checkout and Customer accounts (see lib/checkout-rules.ts) */
  checkoutRules?: CheckoutRules;
  /** Settings → Taxes: GST number shown to buyers, and whether prices include GST */
  gstin?: string;
  pricesIncludeTax?: boolean;
  /** GST % used when a product has none of its own (default 18) */
  defaultGstRate?: number;
  /** the state the GSTIN is registered in (decides CGST+SGST or IGST on invoices) */
  gstState?: string;
  /** Settings → Notifications: email the seller when an order comes in (on unless switched off) */
  notifyNewOrders?: boolean;
  /** email the owner when an order leaves a product with 5 or fewer in stock (on unless switched off) */
  notifyLowStock?: boolean;
  /** email the owner when a buyer leaves a review (on unless switched off) */
  notifyReviews?: boolean;
  /** Pro: staff members (by id) who also get new-order emails */
  notifyStaff?: string[];
  /** Settings → Tracking & ads */
  tracking?: { metaPixelId?: string; gaId?: string };
  /** Settings → Customer privacy: show a cookie notice before tracking runs */
  cookieBanner?: boolean;
  /** Settings → Domain (Pro): the seller's own domain, written only by the server once connected */
  customDomain?: string;
  /** the store's 5-digit ID, which staff type to sign in; written only by the server */
  storeCode?: string;
  upiId: string; // Direct UPI ID for customer QR payments
  codEnabled: boolean;
  codFee: number; // paise
  freeDeliveryThreshold: number; // paise (e.g. 99900 = ₹999)
  standardDeliveryFee: number; // paise (e.g. 7000 = ₹70)
  planId: "free" | "starter" | "pro";
  activeThemeSlug: string;
  customBrandTheme?: CustomBrandTheme;
  fontFamily?: string;
  announcementText?: string;
  isPaused: boolean; // set by the platform admin (suspension)
  pauseMessage?: string;
  /** The seller switched their shop off: buyers see an "unavailable" card and can't order */
  isClosed?: boolean;
  /** Optional note shown to buyers while the shop is switched off */
  closedMessage?: string;
  categories: CategoryData[];
  products: ProductData[];
  banners: BannerData[];
  reviews: ReviewData[];
  orders: OrderData[];
  customers: CustomerData[];
  subscribers?: SubscriberData[];
  pendingSubscription?: SubscriptionRequest | null;
  subscriptionHistory?: SubscriptionRequest[];
  /** when the paid plan runs out (set when a plan payment is approved); none means paid with no end on record */
  planPaidUntil?: string;
  /** "off" when the seller cancelled their subscription: it ends on planPaidUntil and isn't renewed */
  planRenewal?: "on" | "off";
  /** the Razorpay subscription paying for the plan (private; written only by the server) */
  planBilling?: PlanBilling | null;
  /** set in memory (never saved) when the paid plan has ended: the plan it was on; planId is then "free" */
  expiredPlanId?: string;
  /** themes this shop bought; they're theirs on any plan */
  ownedThemes?: string[];
  /** themes the shop switched to through its plan; they lock again if the plan isn't renewed */
  planThemes?: string[];
  /** theme payments, newest first */
  themePurchases?: ThemePurchase[];
  discounts?: DiscountData[];
  /** the shop's own legal pages, written in Dashboard → Policies */
  policies?: Partial<Record<PolicyId, StorePolicy>>;
  /** whether buyers can cancel / return orders themselves */
  orderPolicy?: OrderPolicy;
  pluginsConfig?: PluginsConfigData;
  /** the seller's own wording for the one-tap WhatsApp buyer messages */
  whatsappTemplates?: Partial<Record<"confirmed" | "shipped" | "delivered" | "payment", string>>;
  homepageSections?: string[];
  themeSectionOrders?: Record<string, string[]>;
  /** Text, photos and sections set in the theme editor, per theme slug (see src/lib/site-content.ts) */
  themeContent?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformPayment {
  /** UPI ID sellers pay their subscription to */
  upiId: string;
  /** Name shown in the buyer's UPI app */
  payeeName: string;
}

export interface PlatformPaymentSettings {
  accounts: PlatformPayment[];
  /** the account sellers pay to */
  activeUpiId: string;
}

/**
 * Checks a coupon code against the store's active discounts for a bag subtotal (paise). Used by
 * the storefront to show the saving and by createOrder to charge it, so both always agree.
 */
import { evaluateCoupon } from "./coupons";
export { evaluateCoupon };

export function isValidUpiId(value: string): boolean {
  return /^[\w.\-]{2,256}@[a-zA-Z][a-zA-Z0-9]{1,64}$/.test(value.trim());
}

/** A one-time payment for a theme, checked and approved by the admin like plan payments. */
export interface ThemePurchase {
  id: string;
  referenceId: string;
  themeSlug: string;
  themeName: string;
  amount: number;
  amountFormatted: string;
  status: "pending_verification" | "verified" | "rejected";
  payeeUpiId: string;
  paymentUtr?: string;
  createdAt: string;
  verifiedAt?: string;
  rejectedAt?: string;
  note?: string;
  seenBySeller?: boolean;
}

export interface SubscriptionRequest {
  id: string;
  referenceId: string;
  storeSubdomain: string;
  storeName: string;
  planId: "starter" | "pro";
  planName: string;
  amount: number;
  amountFormatted: string;
  billingCycle: "monthly" | "quarterly" | "yearly";
  status: "pending_verification" | "verified" | "rejected";
  /** "razorpay": an automatic monthly payment through Razorpay Subscriptions */
  paymentMethod: "upi" | "razorpay";
  payeeUpiId: string;
  paymentUtr?: string;
  createdAt: string;
  estimatedVerificationTime: string;
  verifiedAt?: string;
  rejectedAt?: string;
  /** False until the seller has seen the approved / rejected notice */
  seenBySeller?: boolean;
  note?: string;
}

export interface SubscriberData {
  id: string;
  email: string;
  subscribedAt: string;
}

export interface PlatformBroadcast {
  id: string;
  target: "all" | "free" | "starter" | "pro";
  subject: string;
  message: string;
  ctaText?: string;
  ctaLink?: string;
  sentAt: string;
  recipientCount: number;
}

// Image banner the platform admin shows on every seller's dashboard overview
export interface PlatformBanner {
  id: string;
  imageUrl: string;
  link?: string; // path inside the app (e.g. /dashboard?tab=themes) or a full URL
  storagePath?: string; // set when the image lives in Firebase Storage
  createdAt: string;
}

export interface PluginsConfigData {
  gmail?: {
    connected: boolean;
    email: string;
    autoDropAlerts: boolean;
    lastSyncAt?: string;
  };
  gmailIntegration?: {
    isConnected: boolean;
    connectedEmail?: string;
    autoSendNewDropAlerts: boolean;
    lastCampaignSentAt?: string;
    campaignsSentCount?: number;
  };
  whatsappBot?: {
    connected: boolean;
    phone?: string;
  };
  whatsappNotifications?: {
    isConnected: boolean;
  };
}

export interface HomepageSectionItem {
  id: string;
  title: string;
  subtitle: string;
}

export const DEFAULT_HOMEPAGE_SECTIONS: HomepageSectionItem[] = [
  {
    id: "hero",
    title: "Hero Banner & Carousel",
    subtitle: "Top promotional slides and showcase banner",
  },
  {
    id: "stories",
    title: "Category Stories",
    subtitle: "Circular category quick-navigation stories",
  },
  {
    id: "featured-collections",
    title: "Featured Collections",
    subtitle: "Highlighted collection cards and parent categories",
  },
  {
    id: "products",
    title: "Product Catalog Grid",
    subtitle: "Best sellers, product cards and catalog directory",
  },
  {
    id: "editorial-promo",
    title: "Editorial Promo Banner",
    subtitle: "Full-width campaign spotlight and promo banner",
  },
  {
    id: "categories-grid",
    title: "Shop by Category Grid",
    subtitle: "Visual grid directory of all store categories",
  },
];

export const DEFAULT_HOMEPAGE_SECTION_IDS: string[] = DEFAULT_HOMEPAGE_SECTIONS.map((s) => s.id);

/**
 * IDs of the demo stores ("Lume." and "Jaipur Crafts") that older versions created and copied into
 * Firestore. They are hidden everywhere; sellers only ever see real stores.
 */
export const DEMO_STORE_IDS = new Set(["store-lume-001", "store-jaipur-crafts-001"]);
const isDemoStore = (s: Partial<StoreData> | null | undefined) =>
  !!s && (DEMO_STORE_IDS.has(String(s.id)) || s.subdomain === "lume" || s.subdomain === "jaipurcrafts");

type NewStoreInput = {
  name: string;
  subdomain: string;
  category: string;
  ownerName: string;
  contactPhone: string;
  contactEmail?: string;
  upiId: string;
  tagline?: string;
  ownerId?: string;
  ownerEmail?: string;
};

/** Set by the test setup: no database connection at all. */
const isOffline = () => (globalThis as { __SHOPERSITE_OFFLINE__?: boolean }).__SHOPERSITE_OFFLINE__ === true;

/** Price in paise above 0, MRP (if any) above the price, stock a whole number: what every product must have. */
export function productProblem(p: Pick<ProductData, "price" | "compareAtPrice" | "stock"> & { title?: string }): string {
  if (p.title !== undefined && !p.title.trim()) return "Give your product a name.";
  if (!Number.isInteger(p.price) || p.price <= 0) return "Price must be more than ₹0.";
  if (p.price > 100000000) return "Price can't be more than ₹10,00,000.";
  if (p.compareAtPrice !== undefined && p.compareAtPrice !== null) {
    if (!Number.isInteger(p.compareAtPrice) || p.compareAtPrice < 0) return "MRP can't be negative.";
    if (p.compareAtPrice > 0 && p.compareAtPrice <= p.price) return "MRP must be higher than the selling price.";
  }
  if (!Number.isInteger(p.stock) || p.stock < 0) return "Stock is a whole number, 0 or more.";
  return "";
}

// Global Store State Manager with Firebase Firestore Cloud Sync & LocalStorage fallback
class StoreService {
  private stores: Record<string, StoreData> = {};
  private initialized = false;
  private firebaseConnected = false;
  private cloudSynced = false;

  /** True once the first cloud snapshot of stores has arrived (or the listener failed). */
  public isCloudSynced(): boolean {
    return this.cloudSynced;
  }
  private listeners: (() => void)[] = [];

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => {
      try {
        l();
      } catch (err) {
        console.error("StoreService listener error:", err);
      }
    });
  }

  /** Set by the admin panel once the signed-in user is confirmed as an admin. */
  private adminMode = false;
  public setAdminMode(on: boolean) {
    this.adminMode = on;
    if (on) this.watchAllPrivate();
  }

  /**
   * Saves only the fields that changed, each to its own document: public fields to
   * stores/{subdomain}, buyers' details and payments to stores/{subdomain}/private/data.
   * A seller never sends plan, ownership or payment-approval fields (the database refuses them
   * anyway); those change only through the server or an admin.
   */
  public async syncStoreToFirebase(subdomain: string, keys?: string[]) {
    if (typeof window === "undefined") return;
    const store = this.stores[subdomain];
    if (!store) return;
    const blocked = new Set<string>(this.adminMode ? [] : [...OWNER_LOCKED_KEYS, ...BILLING_KEYS]);
    const picked: Record<string, unknown> = {};
    for (const k of keys || Object.keys(store)) {
      if (blocked.has(k)) continue;
      picked[k] = (store as unknown as Record<string, unknown>)[k];
    }
    // only stores the database has: a deleted store must never be written back
    if (!this.publicData[subdomain]) {
      console.warn(`[Firebase Firestore] Not saving "${subdomain}": it isn't in the database.`);
      return;
    }
    const parts = splitStoreUpdate(JSON.parse(JSON.stringify(picked)));
    const now = new Date().toISOString();
    try {
      // updateDoc fails if the store was deleted meanwhile, instead of creating it again
      if (Object.keys(parts.pub).length) await updateDoc(doc(db, "stores", subdomain), { ...parts.pub, updatedAt: now });
      if (Object.keys(parts.priv).length) await setDoc(doc(db, "stores", subdomain, "private", "data"), { ...parts.priv, updatedAt: now }, { merge: true });
    } catch (err) {
      console.warn(`[Firebase Firestore] Store "${subdomain}" save refused or failed:`, err);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("shopersite:save-failed", { detail: { subdomain, code: (err as { code?: string })?.code || "" } }));
      }
    }
  }

  // private parts of stores this browser may read (the owner's own stores, or all for an admin)
  private privateData: Record<string, Partial<StoreData>> = {};
  private publicData: Record<string, Partial<StoreData>> = {};
  private privateWatches = new Map<string, () => void>();
  private allPrivateWatch: (() => void) | null = null;

  private applyPrivate(subdomain: string, priv: Partial<StoreData> | undefined) {
    if (priv) this.privateData[subdomain] = priv;
    else delete this.privateData[subdomain];
    const pub = this.publicData[subdomain] || this.stores[subdomain];
    if (!pub) return;
    this.stores[subdomain] = mergeStoreParts(pub, this.privateData[subdomain]);
    this.persist();
    this.notify();
  }

  /** Follows the private part (orders, customers, payments) of the signed-in seller's stores. */
  public watchPrivate(subdomains: string[]) {
    if (typeof window === "undefined" || this.allPrivateWatch) return;
    const wanted = new Set(subdomains);
    for (const [sub, stop] of this.privateWatches) {
      if (!wanted.has(sub)) {
        stop();
        this.privateWatches.delete(sub);
      }
    }
    for (const sub of wanted) {
      if (this.privateWatches.has(sub)) continue;
      const stop = onSnapshot(
        doc(db, "stores", sub, "private", "data"),
        (snap) => this.applyPrivate(sub, snap.exists() ? (snap.data() as Partial<StoreData>) : undefined),
        (error) => console.warn(`[Firebase Firestore] Private data for "${sub}" not readable:`, error.code)
      );
      this.privateWatches.set(sub, stop);
    }
  }

  /** Signed out: stop following private data and forget it in this browser. */
  public clearPrivate() {
    for (const stop of this.privateWatches.values()) stop();
    this.privateWatches.clear();
    this.allPrivateWatch?.();
    this.allPrivateWatch = null;
    this.adminMode = false;
    const subs = Object.keys(this.privateData);
    this.privateData = {};
    for (const sub of subs) {
      const pub = this.publicData[sub];
      if (pub) this.stores[sub] = mergeStoreParts(pub, null);
    }
    this.persist();
    this.notify();
  }

  /** Admin: follows the private part of every store. */
  private watchAllPrivate() {
    if (typeof window === "undefined" || this.allPrivateWatch) return;
    for (const stop of this.privateWatches.values()) stop();
    this.privateWatches.clear();
    this.allPrivateWatch = onSnapshot(
      collectionGroup(db, "private"),
      (snap) => {
        snap.docChanges().forEach((ch) => {
          const sub = ch.doc.ref.parent.parent?.id;
          if (!sub) return;
          this.applyPrivate(sub, ch.type === "removed" ? undefined : (ch.doc.data() as Partial<StoreData>));
        });
      },
      (error) => console.warn("[Firebase Firestore] Admin private data listener:", error.code)
    );
  }

  private connectFirebase() {
    if (isOffline()) {
      this.cloudSynced = true;
      return;
    }
    if (typeof window === "undefined" || this.firebaseConnected) return;
    this.firebaseConnected = true;
    // a very slow or offline connection: stop waiting after a while so pages can show what they have
    window.setTimeout(() => {
      if (!this.cloudSynced) {
        this.cloudSynced = true;
        this.notify();
      }
    }, 10000);

    try {
      const storesCol = collection(db, "stores");
      onSnapshot(
        storesCol,
        (snapshot) => {
          // the database is the only source of truth: stores it doesn't have are dropped here
          const seen = new Set<string>();
          const nextPublic: Record<string, Partial<StoreData>> = {};
          const nextStores: Record<string, StoreData> = {};
          snapshot.docs.forEach((d) => {
            const data = d.data() as StoreData;
            if (data && data.subdomain && !isDemoStore(data)) {
              seen.add(data.subdomain);
              nextPublic[data.subdomain] = data;
              nextStores[data.subdomain] = mergeStoreParts(data, this.privateData[data.subdomain]);
            }
          });
          for (const sub of Object.keys(this.privateData)) if (!seen.has(sub)) delete this.privateData[sub];
          this.publicData = nextPublic;
          this.stores = nextStores;
          if (!snapshot.metadata.fromCache) this.cloudSynced = true;
          this.notify();
        },
        (error) => {
          console.warn("[Firebase Firestore] Real-time listener warning:", error);
          this.cloudSynced = true;
          this.notify();
        }
      );
    } catch (err) {
      console.warn("[Firebase Firestore] Connection failed:", err);
    }
  }

  private initClient() {
    if (typeof window !== "undefined" && !this.initialized) {
      // Stores come only from the database. Older versions kept a copy of every store in the
      // browser, which kept deleted stores showing up; remove it.
      try {
        localStorage.removeItem("shopper_stores_state");
      } catch {
        // storage blocked: nothing to remove
      }

      // Ensure all stores have categories, subscribers, and pluginsConfig initialized cleanly (no demo mocks)
      Object.keys(this.stores).forEach((sub) => {
        const s = this.stores[sub];
        // Categories are only what the seller creates (no stock or placeholder collections)
        if (!s.categories) {
          s.categories = [];
        }

        if (!s.subscribers) {
          s.subscribers = [];
        }
        // Stores start with no coupons; sellers create their own in the dashboard
        if (!s.discounts) {
          s.discounts = [];
        }
        if (!s.pluginsConfig) {
          s.pluginsConfig = {
            gmail: {
              connected: false,
              email: s.contactEmail || "",
              autoDropAlerts: false,
              lastSyncAt: undefined,
            },
            gmailIntegration: {
              isConnected: false,
              connectedEmail: s.contactEmail || "",
              autoSendNewDropAlerts: false,
              campaignsSentCount: 0,
            },
            whatsappBot: {
              connected: false,
              phone: s.contactPhone || "",
            },
            whatsappNotifications: {
              isConnected: false,
            },
          };
        }
      });

      this.persist();
      this.initialized = true;
      this.connectFirebase();
      this.loadPlanDetails();
      this.connectPlanDetails();
      this.loadPlatformThemes();
      this.connectPlatformThemes();
      this.loadPlanAccess();
      this.connectPlanAccess();
      this.loadThemePrices();
      this.connectThemePrices();
      this.loadPlatformPayment();
      this.connectPlatformPayment();
    }
  }


  /** Stores are no longer copied into the browser (see initClient); kept as a no-op for callers. */
  private persist() {}

  public getAllStores(): StoreData[] {
    this.initClient();
    return Object.values(this.stores);
  }

  public getUserStores(ownerId?: string, ownerEmail?: string): StoreData[] {
    this.initClient();
    if (!ownerId && !ownerEmail) return [];
    return Object.values(this.stores).filter((s) => {
      if (ownerId && s.ownerId === ownerId) return true;
      if (ownerEmail) {
        const cleanEmail = ownerEmail.toLowerCase().trim();
        if (s.ownerEmail && s.ownerEmail.toLowerCase().trim() === cleanEmail) return true;
        if (s.contactEmail && s.contactEmail.toLowerCase().trim() === cleanEmail) return true;
      }
      return false;
    });
  }

  public getStore(subdomainOrId: string): StoreData | null {
    this.initClient();
    if (!subdomainOrId) return null;
    const cleanKey = subdomainOrId.toLowerCase().trim();
    // Direct subdomain lookup
    if (this.stores[cleanKey]) {
      return this.stores[cleanKey];
    }
    // Search by id or matching subdomain
    const found = Object.values(this.stores).find(
      (s) => s.id === subdomainOrId || s.subdomain.toLowerCase() === cleanKey
    );
    return found || null;
  }

  public getProductBySlug(
    subdomain: string,
    slug: string
  ): { store: StoreData; product: ProductData } | null {
    this.initClient();
    const store = this.getStore(subdomain);
    if (!store) return null;

    const product = store.products.find(
      (p) => p.slug === slug || p.id === slug
    );
    if (!product) return null;

    return { store, product };
  }

  /** Asks the database itself whether a web address is in use. */
  public async isSubdomainTaken(subdomain: string): Promise<boolean> {
    const sub = subdomain.toLowerCase().trim();
    try {
      return (await getDocFromServer(doc(db, "stores", sub))).exists();
    } catch {
      // offline: fall back to the live list
      return !!this.publicData[sub] || (await getDoc(doc(db, "stores", sub)).then((d) => d.exists()).catch(() => false));
    }
  }

  public async registerStore(input: NewStoreInput): Promise<StoreData> {
    this.initClient();
    const newStore = this.buildStore(input);
    const cleanSubdomain = newStore.subdomain;
    if (cleanSubdomain.length < 3) throw new Error("Use at least 3 letters or numbers for your web address.");
    if (isReservedSubdomain(cleanSubdomain)) throw new Error(`${getStoreDomain(cleanSubdomain)} can't be used. Try another.`);
    if (await this.isSubdomainTaken(cleanSubdomain)) {
      throw new Error(`${getStoreDomain(cleanSubdomain)} is taken. Try another.`);
    }
    await this.createStoreDocs(newStore);
    this.stores[cleanSubdomain] = newStore;
    this.notify();
    return newStore;
  }

  /** Tests only (no database): adds a new store in memory. */
  public registerStoreOffline(input: NewStoreInput): StoreData {
    if (!isOffline()) throw new Error("registerStoreOffline is for tests only.");
    this.initClient();
    const newStore = this.buildStore(input);
    if (this.stores[newStore.subdomain]) throw new Error(`${getStoreDomain(newStore.subdomain)} is taken. Try another.`);
    this.stores[newStore.subdomain] = newStore;
    this.notify();
    return newStore;
  }

  private buildStore(input: NewStoreInput): StoreData {
    const cleanSubdomain = input.subdomain
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]/g, "");

    const newStoreId = `store-${cleanSubdomain}-${Date.now().toString(36)}`;
    const now = new Date().toISOString();

    const newStore: StoreData = {
      id: newStoreId,
      ownerId: input.ownerId,
      ownerEmail: input.ownerEmail || input.contactEmail,
      name: input.name,
      subdomain: cleanSubdomain,
      status: "published",
      category: input.category,
      tagline: input.tagline || `Welcome to ${input.name}`,
      ownerName: input.ownerName,
      contactPhone: input.contactPhone,
      contactEmail: input.contactEmail,
      upiId: input.upiId,
      codEnabled: true,
      codFee: 0,
      freeDeliveryThreshold: 50000, // ₹500
      standardDeliveryFee: 5000, // ₹50
      planId: "free",
      // new shops start on Lume Editorial, the Free plan's theme, which every plan can use
      activeThemeSlug: FREE_THEME_SLUG,
      customBrandTheme: {
        primary: "#111111",
        background: "#FDFBF7",
        surface: "#FFFFFF",
      },
      fontFamily: "Outfit",
      announcementText: `Welcome to ${input.name}. Free shipping on orders above ₹500.`,
      isPaused: false,
      // A new store starts empty: no sample products, banners or stock-photo collections.
      // One category is created from what the seller said they sell, with no placeholder image.
      banners: [],
      categories: [
        {
          id: `cat-${cleanSubdomain}-1`,
          name: input.category,
          slug: input.category.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "products",
          isActive: true,
          position: 0,
          createdAt: now,
        },
      ],
      products: [],

      reviews: [],
      orders: [],
      customers: [],
      createdAt: now,
      updatedAt: now,
    };

    return newStore;
  }

  /** First save of a new store: the public document plus an empty private one. */
  private async createStoreDocs(store: StoreData) {
    if (typeof window === "undefined") return;
    const parts = splitStoreUpdate(JSON.parse(JSON.stringify(store)));
    try {
      await setDoc(doc(db, "stores", store.subdomain), parts.pub);
      await setDoc(doc(db, "stores", store.subdomain, "private", "data"), {
        orders: [],
        customers: [],
        subscribers: [],
        subscriptionHistory: [],
        themePurchases: [],
        pendingSubscription: null,
        updatedAt: store.createdAt,
      });
      this.publicData[store.subdomain] = parts.pub as Partial<StoreData>;
      this.watchPrivate([...this.privateWatches.keys(), store.subdomain]);
    } catch (err) {
      console.warn(`[Firebase Firestore] Couldn't create store "${store.subdomain}":`, err);
      const code = (err as { code?: string })?.code || "";
      throw new Error(
        code === "permission-denied"
          ? `${getStoreDomain(store.subdomain)} is taken. Try another.`
          : "Couldn't create your store. Check your internet connection and try again."
      );
    }
  }

  public updateStore(subdomain: string, updates: Partial<StoreData>): StoreData {
    this.initClient();
    const store = this.getStore(subdomain);
    if (!store) {
      throw new Error(`Store "${subdomain}" not found.`);
    }

    const updated = {
      ...store,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.stores[store.subdomain] = updated;
    this.persist();
    this.syncStoreToFirebase(store.subdomain, Object.keys(updates));
    this.notify();
    return updated;
  }

  public addProduct(
    subdomain: string,
    product: Omit<ProductData, "id" | "storeId" | "createdAt">
  ): { success: boolean; product?: ProductData; error?: string } {
    this.initClient();
    const store = this.getStore(subdomain);
    if (!store) return { success: false, error: "Store not found." };

    // Enforce Plan Limits
    const quota = canAddProduct(store.products.length, store.planId);
    if (!quota.allowed) {
      return {
        success: false,
        error: `Your current ${store.planId.toUpperCase()} plan limit is ${quota.limit} products. Upgrade your subscription to add more products.`,
      };
    }

    const bad = productProblem(product);
    if (bad) return { success: false, error: bad };

    const now = new Date().toISOString();
    const newProduct: ProductData = {
      ...product,
      id: `prod-${store.subdomain}-${Date.now().toString(36)}`,
      storeId: store.id,
      createdAt: now,
    };

    store.products.unshift(newProduct);
    this.updateStore(store.subdomain, { products: store.products });
    return { success: true, product: newProduct };
  }

  /**
   * Bulk upload: adds many products (and any categories they name that don't exist yet) in one save.
   * Every row is checked first; nothing is added if one is wrong or the plan's limit would be passed.
   */
  public addProductsBulk(
    subdomain: string,
    rows: Omit<ProductData, "id" | "storeId" | "createdAt">[]
  ): { success: boolean; added?: number; newCategories?: string[]; error?: string } {
    this.initClient();
    const store = this.getStore(subdomain);
    if (!store) return { success: false, error: "Store not found." };
    if (!rows.length) return { success: false, error: "There are no products to add." };
    const quota = canAddProduct(store.products.length + rows.length - 1, store.planId);
    if (!quota.allowed) {
      const room = Math.max(0, (quota.limit ?? 0) - store.products.length);
      return { success: false, error: `Your plan allows ${quota.limit} products. You can add ${room} more; upgrade to add the rest.` };
    }
    for (const [i, r] of rows.entries()) {
      const bad = productProblem(r);
      if (bad) return { success: false, error: `Row ${i + 1}: ${bad}` };
    }
    const categories = [...(store.categories || [])];
    const newCategories: string[] = [];
    const now = new Date();
    for (const r of rows) {
      const name = r.category.trim();
      if (categories.some((c) => !c.isParent && c.name.toLowerCase() === name.toLowerCase())) {
        r.category = categories.find((c) => !c.isParent && c.name.toLowerCase() === name.toLowerCase())!.name;
        continue;
      }
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `category-${categories.length + 1}`;
      categories.push({
        id: `cat-${store.subdomain}-${now.getTime().toString(36)}-${categories.length}`,
        name,
        slug: categories.some((c) => c.slug === slug) ? `${slug}-${categories.length}` : slug,
        description: "",
        isActive: true,
        position: categories.length,
        createdAt: now.toISOString(),
        isParent: false,
      });
      newCategories.push(name);
    }
    const added: ProductData[] = rows.map((r, i) => ({
      ...r,
      id: `prod-${store.subdomain}-${now.getTime().toString(36)}-${i.toString(36)}`,
      storeId: store.id,
      createdAt: new Date(now.getTime() + i).toISOString(),
    }));
    this.updateStore(store.subdomain, { products: [...added.reverse(), ...store.products], categories });
    return { success: true, added: added.length, newCategories };
  }

  public updateProduct(
    subdomain: string,
    productId: string,
    updates: Partial<ProductData>
  ): ProductData {
    this.initClient();
    const store = this.getStore(subdomain);
    if (!store) throw new Error("Store not found.");

    const index = store.products.findIndex((p) => p.id === productId);
    if (index === -1) throw new Error("Product not found.");

    const updated = { ...store.products[index], ...updates };
    const bad = productProblem(updated);
    if (bad) throw new Error(bad);
    store.products[index] = updated;
    this.updateStore(store.subdomain, { products: store.products });
    return updated;
  }

  public deleteProduct(subdomain: string, productId: string): boolean {
    this.initClient();
    const store = this.getStore(subdomain);
    if (!store) return false;

    store.products = store.products.filter((p) => p.id !== productId);
    this.updateStore(store.subdomain, { products: store.products });
    return true;
  }

  public upgradeStorePlan(
    subdomain: string,
    planId: "free" | "starter" | "pro"
  ): StoreData {
    this.initClient();
    const store = this.getStore(subdomain);
    if (!store) throw new Error("Store not found.");

    return this.updateStore(store.subdomain, { planId });
  }

  /** Calls one of the app's server routes; signed-in routes send the seller's Firebase token. */
  private async callApi<T>(path: string, body: unknown, signedIn = false): Promise<T> {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (signedIn) {
      const user = auth.currentUser;
      if (!user) throw new Error("Please sign in again.");
      headers.Authorization = `Bearer ${await user.getIdToken()}`;
    }
    const res = await fetch(path, { method: "POST", headers, body: JSON.stringify(body) });
    const data = (await res.json().catch(() => ({}))) as T & { error?: string };
    if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");
    return data;
  }

  /** The plan as the server just saved it (after an automatic payment was set up or cancelled). */
  public applyPlan(
    subdomain: string,
    plan: { planId: StoreData["planId"]; planPaidUntil: string | null; planRenewal: "on" | "off" | null; planBilling: PlanBilling | null; subscriptionHistory: SubscriptionRequest[] }
  ) {
    const store = this.getStore(subdomain);
    if (!store) return;
    this.stores[store.subdomain] = {
      ...store,
      planId: plan.planId,
      planPaidUntil: plan.planPaidUntil || undefined,
      planRenewal: plan.planRenewal || undefined,
      planBilling: plan.planBilling,
      subscriptionHistory: plan.subscriptionHistory,
    };
    this.notify();
  }

  /**
   * Seller: tells the server they paid for a plan by UPI (with the 12-digit UTR). The server sets
   * the amount and the reference; the plan turns on only when an admin approves the payment.
   */
  public async createSubscriptionPayment(
    subdomain: string,
    data: { planId: "starter" | "pro"; billingCycle?: BillingCycle; paymentUtr: string }
  ): Promise<SubscriptionRequest> {
    const { request } = await this.callApi<{ request: SubscriptionRequest }>(
      "/api/billing/plan",
      { store: subdomain, planId: data.planId, billingCycle: data.billingCycle || "monthly", utr: data.paymentUtr },
      true
    );
    const store = this.getStore(subdomain);
    if (store) {
      this.stores[store.subdomain] = { ...store, pendingSubscription: request, subscriptionHistory: [request, ...(store.subscriptionHistory || [])] };
      this.notify();
    }
    return request;
  }

  public verifySubscriptionPayment(
    subdomain: string,
    requestId?: string
  ): { success: boolean; store?: StoreData; error?: string } {
    this.initClient();
    const store = this.getStore(subdomain);
    if (!store) return { success: false, error: "Store not found." };

    const pending = store.pendingSubscription;
    if (!pending) return { success: false, error: "No pending subscription found for verification." };

    if (requestId && pending.id !== requestId) {
      return { success: false, error: "Subscription request ID does not match pending request." };
    }

    const verifiedReq: SubscriptionRequest = {
      ...pending,
      status: "verified",
      verifiedAt: new Date().toISOString(),
      seenBySeller: false,
    };

    const updatedHistory = (store.subscriptionHistory || []).map((h) =>
      h.id === pending.id ? verifiedReq : h
    );

    const months = BILLING_CYCLES.find((c) => c.id === pending.billingCycle)?.months || 1;
    const stillPaid = store.planId === pending.planId && store.planPaidUntil && new Date(store.planPaidUntil).getTime() > Date.now();
    const from = stillPaid ? new Date(store.planPaidUntil!) : new Date();
    from.setMonth(from.getMonth() + months);

    const updated = this.updateStore(store.subdomain, {
      planId: pending.planId,
      planPaidUntil: from.toISOString(),
      planRenewal: "on",
      pendingSubscription: null,
      subscriptionHistory: updatedHistory,
    });

    return { success: true, store: updated };
  }

  /** Seller: withdraw a plan payment that hasn't been checked yet. */
  public async cancelSubscriptionRequest(subdomain: string): Promise<void> {
    await this.callApi("/api/billing/plan/cancel", { store: subdomain }, true);
  }

  /** Admin: payment couldn't be confirmed. The store stays on its current plan. */
  public rejectSubscriptionPayment(subdomain: string, reason?: string): boolean {
    this.initClient();
    const store = this.getStore(subdomain);
    const pending = store?.pendingSubscription;
    if (!store || !pending) return false;

    const rejectedReq: SubscriptionRequest = {
      ...pending,
      status: "rejected",
      rejectedAt: new Date().toISOString(),
      note: reason?.trim() || "We couldn't find this payment.",
      seenBySeller: false,
    };

    this.updateStore(store.subdomain, {
      pendingSubscription: null,
      subscriptionHistory: (store.subscriptionHistory || []).map((h) => (h.id === pending.id ? rejectedReq : h)),
    });
    return true;
  }

  /** Seller has seen their approved / rejected payment notices. */
  public markSubscriptionUpdatesSeen(subdomain: string): void {
    const store = this.getStore(subdomain);
    const unseen = store?.subscriptionHistory?.some((h) => h.seenBySeller === false) || store?.themePurchases?.some((t) => t.seenBySeller === false);
    if (!store || !unseen) return;
    // hide the notice straight away; the server records it
    this.stores[store.subdomain] = {
      ...store,
      subscriptionHistory: (store.subscriptionHistory || []).map((h) => (h.seenBySeller === false ? { ...h, seenBySeller: true } : h)),
      themePurchases: (store.themePurchases || []).map((t) => (t.seenBySeller === false ? { ...t, seenBySeller: true } : t)),
    };
    this.notify();
    this.callApi("/api/billing/seen", { store: subdomain }, true).catch((err) => console.warn("[billing] mark seen failed", err));
  }

  public setStoreTheme(
    subdomain: string,
    themeSlug: string
  ): { success: boolean; error?: string } {
    this.initClient();
    const store = this.getStore(subdomain);
    if (!store) return { success: false, error: "Store not found." };

    const theme = getTheme(themeSlug);
    if (!theme) return { success: false, error: "Invalid theme." };

    if (!canUseTheme(store, themeSlug)) {
      const price = getThemePrice(themeSlug);
      const plan = getThemePlan(themeSlug);
      const withPlan = plan ? ` or get it with ${PLATFORM_PLANS[plan]?.name || "a paid plan"}` : "";
      return {
        success: false,
        error: !THEME_SALES && plan
          ? `${theme.name} comes with the ${plan === "pro" ? "Pro plan" : "Growth and Pro plans"}. Upgrade to use it.`
          : price
          ? `${theme.name} costs ${formatThemePrice(price)}. Buy it once to keep it for good${withPlan}.`
          : `${theme.name} isn't included in your plan. Upgrade to use it.`,
      };
    }

    // a theme picked through the plan (not free, not bought) locks again if the plan lapses
    const viaPlan = getThemePrice(themeSlug) > 0 && !ownsTheme(store, themeSlug);
    const planThemes = (store.planThemes || []).filter((t) => t !== themeSlug);
    this.updateStore(store.subdomain, { activeThemeSlug: themeSlug, planThemes: viaPlan ? [...planThemes, themeSlug] : planThemes });
    return { success: true };
  }

  /** Seller: tells the server they paid for a theme by UPI. It unlocks when an admin approves it. */
  public async createThemePurchase(subdomain: string, themeSlug: string, data: { paymentUtr: string }): Promise<ThemePurchase> {
    const { purchase } = await this.callApi<{ purchase: ThemePurchase }>(
      "/api/billing/theme",
      { store: subdomain, themeSlug, utr: data.paymentUtr },
      true
    );
    const store = this.getStore(subdomain);
    if (store) {
      this.stores[store.subdomain] = { ...store, themePurchases: [purchase, ...(store.themePurchases || [])] };
      this.notify();
    }
    return purchase;
  }

  /** Admin: the theme payment arrived. The shop owns the theme from now on. */
  public verifyThemePurchase(subdomain: string, purchaseId: string): boolean {
    this.initClient();
    const store = this.getStore(subdomain);
    const purchase = store?.themePurchases?.find((p) => p.id === purchaseId && p.status === "pending_verification");
    if (!store || !purchase) return false;
    this.updateStore(store.subdomain, {
      ownedThemes: Array.from(new Set([...(store.ownedThemes || []), purchase.themeSlug])),
      themePurchases: store.themePurchases!.map((p) =>
        p.id === purchaseId ? { ...p, status: "verified", verifiedAt: new Date().toISOString(), seenBySeller: false } : p
      ),
    });
    return true;
  }

  /** Admin: the theme payment couldn't be found. The seller sees the reason. */
  public rejectThemePurchase(subdomain: string, purchaseId: string, reason?: string): boolean {
    this.initClient();
    const store = this.getStore(subdomain);
    if (!store?.themePurchases?.some((p) => p.id === purchaseId && p.status === "pending_verification")) return false;
    this.updateStore(store.subdomain, {
      themePurchases: store.themePurchases.map((p) =>
        p.id === purchaseId
          ? { ...p, status: "rejected", rejectedAt: new Date().toISOString(), note: reason?.trim() || "We couldn't find this payment.", seenBySeller: false }
          : p
      ),
    });
    return true;
  }

  /** Seller: withdraw a theme payment that hasn't been checked yet. */
  public async cancelThemePurchase(subdomain: string, purchaseId: string): Promise<void> {
    await this.callApi("/api/billing/theme/cancel", { store: subdomain, purchaseId }, true);
  }

  public setStoreHomepageSections(
    subdomain: string,
    sections: string[],
    themeSlug?: string
  ): StoreData {
    this.initClient();
    const store = this.getStore(subdomain);
    if (!store) throw new Error("Store not found.");

    const themeOrders = { ...(store.themeSectionOrders || {}) };
    if (themeSlug) {
      themeOrders[themeSlug] = sections;
    }

    return this.updateStore(store.subdomain, {
      homepageSections: sections,
      themeSectionOrders: themeOrders,
    });
  }

  /**
   * Buyer: places a UPI or cash-on-delivery order through the server, which prices it from the
   * store's saved products, checks the UPI reference and saves it. Returns the saved order.
   */
  public async createOrder(
    subdomain: string,
    input: {
      method: "upi" | "cod";
      items: { productId: string; quantity: number; variantName?: string }[];
      customer: { name: string; phone: string; email?: string; altPhone?: string };
      address: { street: string; landmark?: string; city: string; state: string; pincode: string };
      marketingOptIn?: boolean;
      utr?: string;
      couponCode?: string;
      notes?: string;
    }
  ): Promise<OrderData> {
    // signed-in buyers send their login so the order shows in their account on any device
    const { order } = await this.callApi<{ order: OrderData }>("/api/orders/place", { store: subdomain, ...input }, !!auth.currentUser);
    return order;
  }

  /**
   * Brings in orders paid online (Cashfree or Razorpay). The server records them, but a browser holding an
   * older copy of the store can save over that list, so the dashboard re-applies them from the
   * server's payment records. Returns true if anything changed.
   */
  public mergeOnlineOrders(subdomain: string, paidOrders: OrderData[]): boolean {
    this.initClient();
    const store = this.getStore(subdomain);
    if (!store || !paidOrders.length) return false;
    const orders = [...(store.orders || [])];
    let changed = false;
    for (const paid of paidOrders) {
      const i = orders.findIndex((o) => o.id === paid.id);
      if (i === -1) {
        orders.push(paid);
        changed = true;
      } else if (orders[i].paymentStatus !== "paid" && orders[i].paymentStatus !== "verified") {
        orders[i] = {
          ...orders[i],
          paymentMethod: paid.paymentMethod === "razorpay" ? "razorpay" : "cashfree",
          paymentStatus: "paid",
          ...(paid.cfPaymentId ? { cfPaymentId: paid.cfPaymentId } : {}),
          paymentUtr: paid.paymentUtr ?? orders[i].paymentUtr,
        };
        changed = true;
      }
    }
    if (!changed) return false;
    orders.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
    this.updateStore(store.subdomain, { orders });
    return true;
  }

  public updateOrderStatus(
    subdomain: string,
    orderId: string,
    updates: Partial<OrderData>
  ): OrderData {
    this.initClient();
    const store = this.getStore(subdomain);
    if (!store) throw new Error("Store not found.");

    const index = store.orders.findIndex((o) => o.id === orderId);
    if (index === -1) throw new Error("Order not found.");

    const updated = {
      ...store.orders[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    store.orders[index] = updated;
    this.updateStore(store.subdomain, { orders: store.orders });
    return updated;
  }

  /** Buyer: posts a review through the server (verified only if the buyer's own order has it). */
  public async addReview(
    subdomain: string,
    input: { productId: string; customerName: string; rating: number; comment: string; orderTokens?: string[] }
  ): Promise<ReviewData> {
    const { review } = await this.callApi<{ review: ReviewData }>("/api/store/review", {
      store: subdomain,
      productId: input.productId,
      name: input.customerName,
      rating: input.rating,
      comment: input.comment,
      tokens: input.orderTokens || [],
    });
    return review;
  }

  public updateReviewStatus(
    subdomain: string,
    reviewId: string,
    status: "approved" | "pending" | "rejected"
  ): ReviewData {
    this.initClient();
    const store = this.getStore(subdomain);
    if (!store) throw new Error("Store not found.");

    const index = store.reviews.findIndex((r) => r.id === reviewId);
    if (index === -1) throw new Error("Review not found.");

    store.reviews[index].status = status;
    this.updateStore(store.subdomain, { reviews: store.reviews });
    return store.reviews[index];
  }

  public deleteReview(subdomain: string, reviewId: string): boolean {
    this.initClient();
    const store = this.getStore(subdomain);
    if (!store) return false;

    store.reviews = store.reviews.filter((r) => r.id !== reviewId);
    this.updateStore(store.subdomain, { reviews: store.reviews });
    return true;
  }

  /** Uploads a photo for the store's theme (editor images) to Storage, or keeps a small compressed copy. */
  public async uploadStoreImage(subdomain: string, file: File): Promise<string> {
    // each uploader writes only inside their own folder (storage.rules checks the uid)
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error("Please sign in again.");
    const { url } = await hostPlatformImage(file, `store_assets/${subdomain}/u_${uid}/theme`, 1400);
    return url;
  }

  public saveBanners(subdomain: string, banners: BannerData[]): BannerData[] {
    this.initClient();
    const store = this.getStore(subdomain);
    if (!store) throw new Error("Store not found.");

    this.updateStore(store.subdomain, { banners });
    return banners;
  }

  /** Stores never get placeholder categories; this only exists so older callers get an empty list. */
  public buildDefaultCategoriesForStore(_store: StoreData): CategoryData[] {
    return [];
  }

  public getCategories(subdomain: string): CategoryData[] {
    this.initClient();
    const store = this.getStore(subdomain);
    if (!store) return [];

    if (!store.categories || store.categories.length === 0) {
      store.categories = this.buildDefaultCategoriesForStore(store);
      this.persist();
    }

    return store.categories
      .map((cat, idx) => {
        const count = store.products.filter(
          (p) =>
            p.category.toLowerCase() === cat.name.toLowerCase() ||
            p.category.toLowerCase().replace(/[^a-z0-9]+/g, "-") === cat.slug
        ).length;
        return {
          ...cat,
          position: cat.position ?? idx,
          itemCount: count,
        };
      })
      .sort((a, b) => a.position - b.position);
  }

  public getCategoryBySlug(subdomain: string, slug: string): CategoryData | null {
    const categories = this.getCategories(subdomain);
    const cleanSlug = slug.toLowerCase().trim();
    return (
      categories.find(
        (c) => c.slug === cleanSlug || c.name.toLowerCase() === cleanSlug
      ) || null
    );
  }

  public addCategory(
    subdomain: string,
    data: {
      name: string;
      slug?: string;
      description?: string;
      imageUrl?: string;
      bannerUrl?: string;
      isActive?: boolean;
      isParent?: boolean;
      parentId?: string;
      subtitle?: string;
      ctaText?: string;
    }
  ): { success: boolean; category?: CategoryData; error?: string } {
    this.initClient();
    const store = this.getStore(subdomain);
    if (!store) return { success: false, error: "Store not found." };

    if (!data.name || !data.name.trim()) {
      return { success: false, error: "Category name is required." };
    }

    const trimmedName = data.name.trim();
    const generatedSlug = (data.slug?.trim() || trimmedName)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    if (!store.categories) {
      store.categories = this.buildDefaultCategoriesForStore(store);
    }

    const existing = store.categories.find(
      (c) => c.slug === generatedSlug || c.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (existing) {
      return { success: false, error: `Category "${trimmedName}" or slug "${generatedSlug}" already exists.` };
    }

    const now = new Date().toISOString();
    const newCategory: CategoryData = {
      id: data.isParent
        ? `cat-parent-${store.subdomain}-${Date.now().toString(36)}`
        : `cat-${store.subdomain}-${Date.now().toString(36)}`,
      name: trimmedName,
      slug: generatedSlug,
      description: data.description?.trim() || "",
      imageUrl: data.imageUrl?.trim() || undefined,
      bannerUrl: data.bannerUrl?.trim() || undefined,
      isActive: data.isActive !== false,
      position: store.categories.length,
      createdAt: now,
      isParent: Boolean(data.isParent),
      parentId: data.parentId || undefined,
      subtitle: data.subtitle?.trim() || undefined,
      ctaText: data.ctaText?.trim() || undefined,
    };

    store.categories.push(newCategory);
    this.updateStore(store.subdomain, { categories: store.categories });
    return { success: true, category: newCategory };
  }

  public updateCategory(
    subdomain: string,
    categoryId: string,
    updates: Partial<CategoryData>
  ): { success: boolean; error?: string; category?: CategoryData } {
    this.initClient();
    const store = this.getStore(subdomain);
    if (!store) return { success: false, error: "Store not found." };

    if (!store.categories) {
      store.categories = this.buildDefaultCategoriesForStore(store);
    }

    const index = store.categories.findIndex((c) => c.id === categoryId);
    if (index === -1) return { success: false, error: "Category not found." };

    const oldName = store.categories[index].name;
    const oldSlug = store.categories[index].slug;

    if (updates.slug && updates.slug !== oldSlug) {
      const collision = store.categories.find(
        (c) => c.id !== categoryId && c.slug === updates.slug
      );
      if (collision) {
        return { success: false, error: `Category slug "${updates.slug}" is already in use.` };
      }
    }

    const updatedCat: CategoryData = {
      ...store.categories[index],
      ...updates,
    };

    store.categories[index] = updatedCat;

    if (updates.name && updates.name !== oldName) {
      store.products.forEach((p) => {
        if (p.category.toLowerCase() === oldName.toLowerCase()) {
          p.category = updates.name!;
        }
      });
    }

    this.updateStore(store.subdomain, {
      categories: store.categories,
      products: store.products,
    });

    return { success: true, category: updatedCat };
  }

  public deleteCategory(subdomain: string, categoryId: string): { success: boolean; error?: string } {
    this.initClient();
    const store = this.getStore(subdomain);
    if (!store) return { success: false, error: "Store not found." };

    if (!store.categories) {
      store.categories = this.buildDefaultCategoriesForStore(store);
    }

    const catToDelete = store.categories.find((c) => c.id === categoryId);
    if (!catToDelete) return { success: false, error: "Category not found." };

    store.categories = store.categories.filter((c) => c.id !== categoryId);
    this.updateStore(store.subdomain, { categories: store.categories });
    return { success: true };
  }

  public reorderCategories(subdomain: string, categoryIds: string[]): { success: boolean; error?: string } {
    this.initClient();
    const store = this.getStore(subdomain);
    if (!store) return { success: false, error: "Store not found." };

    if (!store.categories) return { success: false, error: "No categories to reorder." };

    const map = new Map(store.categories.map((c) => [c.id, c]));
    const reordered: CategoryData[] = [];

    categoryIds.forEach((id, idx) => {
      const item = map.get(id);
      if (item) {
        reordered.push({ ...item, position: idx });
        map.delete(id);
      }
    });

    map.forEach((item) => {
      reordered.push({ ...item, position: reordered.length });
    });

    store.categories = reordered;
    this.updateStore(store.subdomain, { categories: store.categories });
    return { success: true };
  }

  /** Buyer: joins the shop's drop-alert list (through the server). */
  public async addSubscriber(subdomain: string, email: string): Promise<{ success: boolean; message: string }> {
    try {
      const r = await this.callApi<{ already: boolean }>("/api/store/subscribe", { store: subdomain, email });
      return { success: true, message: r.already ? "You are already subscribed to drop alerts!" : "Subscribed! You'll receive drop notifications." };
    } catch (err) {
      return { success: false, message: err instanceof Error ? err.message : "Couldn't subscribe. Please try again." };
    }
  }

  public getSubscribers(subdomain: string): SubscriberData[] {
    this.initClient();
    const store = this.getStore(subdomain);
    return store?.subscribers || [];
  }

  public updatePluginsConfig(subdomain: string, config: Partial<PluginsConfigData>): PluginsConfigData {
    this.initClient();
    const store = this.getStore(subdomain);
    if (!store) throw new Error("Store not found");

    const gmailConnected = config.gmailIntegration?.isConnected ?? config.gmail?.connected ?? store.pluginsConfig?.gmail?.connected ?? true;
    const gmailEmail = config.gmailIntegration?.connectedEmail ?? config.gmail?.email ?? store.pluginsConfig?.gmail?.email ?? store.contactEmail ?? "concierge@lume.store";
    const gmailAlerts = config.gmailIntegration?.autoSendNewDropAlerts ?? config.gmail?.autoDropAlerts ?? store.pluginsConfig?.gmail?.autoDropAlerts ?? true;

    const updated: PluginsConfigData = {
      gmail: {
        connected: gmailConnected,
        email: gmailEmail,
        autoDropAlerts: gmailAlerts,
        lastSyncAt: new Date().toISOString(),
      },
      gmailIntegration: {
        isConnected: gmailConnected,
        connectedEmail: gmailEmail,
        autoSendNewDropAlerts: gmailAlerts,
        lastCampaignSentAt: config.gmailIntegration?.lastCampaignSentAt || store.pluginsConfig?.gmailIntegration?.lastCampaignSentAt,
        campaignsSentCount: config.gmailIntegration?.campaignsSentCount ?? store.pluginsConfig?.gmailIntegration?.campaignsSentCount ?? 0,
      },
      whatsappBot: {
        connected: config.whatsappBot?.connected ?? store.pluginsConfig?.whatsappBot?.connected ?? false,
        phone: config.whatsappBot?.phone ?? store.pluginsConfig?.whatsappBot?.phone ?? store.contactPhone,
      },
      whatsappNotifications: {
        isConnected: config.whatsappNotifications?.isConnected ?? true,
      },
    };
    this.updateStore(store.subdomain, { pluginsConfig: updated });
    return updated;
  }

  public sendDropAnnouncement(
    subdomain: string,
    campaign: { subject: string; message: string; collectionName?: string }
  ): { success: boolean; sentCount: number; message: string } {
    this.initClient();
    const store = this.getStore(subdomain);
    if (!store) return { success: false, sentCount: 0, message: "Store not found" };

    const subs = store.subscribers || [];
    const isConnected = store.pluginsConfig?.gmailIntegration?.isConnected ?? store.pluginsConfig?.gmail?.connected ?? true;
    const senderEmail = store.pluginsConfig?.gmailIntegration?.connectedEmail ?? store.pluginsConfig?.gmail?.email ?? "concierge@lume.store";

    if (!isConnected) {
      return {
        success: false,
        sentCount: 0,
        message: "Gmail is not connected. Connect your Gmail account first in Plugins.",
      };
    }

    const currentCount = store.pluginsConfig?.gmailIntegration?.campaignsSentCount || 0;
    const now = new Date().toISOString();

    const pluginsConfig: PluginsConfigData = {
      ...(store.pluginsConfig || {}),
      gmail: {
        connected: true,
        email: senderEmail,
        autoDropAlerts: true,
        lastSyncAt: now,
      },
      gmailIntegration: {
        isConnected: true,
        connectedEmail: senderEmail,
        autoSendNewDropAlerts: true,
        lastCampaignSentAt: now,
        campaignsSentCount: currentCount + 1,
      },
    };

    this.updateStore(store.subdomain, { pluginsConfig });

    return {
      success: true,
      sentCount: subs.length,
      message: `Successfully broadcasted to ${subs.length} subscriber(s) via ${senderEmail}.`,
    };
  }

  // --- Super Admin / Parent Platform Management Methods ---
  private platformBroadcasts: PlatformBroadcast[] = [];

  public deleteStore(subdomain: string): boolean {
    this.initClient();
    const cleanSub = subdomain.toLowerCase().trim();
    if (!this.stores[cleanSub]) return false;

    delete this.stores[cleanSub];
    this.persist();

    if (typeof window !== "undefined") {
      try {
        deleteDoc(doc(db, "stores", cleanSub, "private", "data")).catch(() => {});
        deleteDoc(doc(db, "stores", cleanSub)).catch((err) =>
          console.warn(`[Firebase] Failed to delete store ${cleanSub}:`, err)
        );
      } catch (e) {
        console.warn("[Firebase] Delete store doc error:", e);
      }
    }

    this.notify();
    return true;
  }

  public setStoreStatus(
    subdomain: string,
    status: "published" | "suspended" | "draft",
    pauseMessage?: string
  ): StoreData {
    return this.updateStore(subdomain, {
      status,
      isPaused: status === "suspended",
      pauseMessage:
        pauseMessage ||
        (status === "suspended" ? "This store has been temporarily paused by platform lead." : undefined),
    });
  }

  public setStorePlan(
    subdomain: string,
    planId: "free" | "starter" | "pro"
  ): StoreData {
    return this.updateStore(subdomain, { planId });
  }

  public getPlatformBroadcasts(): PlatformBroadcast[] {
    this.initClient();
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("shopper_platform_broadcasts");
        if (saved) {
          this.platformBroadcasts = JSON.parse(saved);
        }
      } catch (e) {
        console.error("Failed to load platform broadcasts", e);
      }
    }
    return this.platformBroadcasts;
  }

  public sendPlatformBroadcast(input: {
    target: "all" | "free" | "starter" | "pro";
    subject: string;
    message: string;
    ctaText?: string;
    ctaLink?: string;
  }): { success: boolean; broadcast: PlatformBroadcast } {
    this.initClient();
    const all = this.getAllStores();
    const recipients =
      input.target === "all" ? all : all.filter((s) => s.planId === input.target);

    const now = new Date().toISOString();
    const newBroadcast: PlatformBroadcast = {
      id: `bc-${Date.now().toString(36)}`,
      target: input.target,
      subject: input.subject.trim(),
      message: input.message.trim(),
      ctaText: input.ctaText?.trim(),
      ctaLink: input.ctaLink?.trim(),
      sentAt: now,
      recipientCount: recipients.length,
    };

    this.platformBroadcasts.unshift(newBroadcast);

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(
          "shopper_platform_broadcasts",
          JSON.stringify(this.platformBroadcasts)
        );
        const clean = JSON.parse(JSON.stringify(newBroadcast));
        setDoc(doc(db, "platform_broadcasts", newBroadcast.id), clean).catch(console.warn);
      } catch (e) {
        console.warn("[Firebase] Broadcast save error", e);
      }
    }

    this.notify();
    return { success: true, broadcast: newBroadcast };
  }

  // --- Platform banners (admin uploads, shown on every seller dashboard) ---
  private platformBanners: PlatformBanner[] = [];
  private platformBannersLoaded = false;
  private platformBannersConnected = false;

  public getPlatformBanners(): PlatformBanner[] {
    this.initClient();
    if (typeof window !== "undefined") {
      if (!this.platformBannersLoaded) {
        this.platformBannersLoaded = true;
        try {
          const saved = localStorage.getItem("shopper_platform_banners");
          if (saved) this.platformBanners = JSON.parse(saved);
        } catch (e) {
          console.error("Failed to load platform banners", e);
        }
      }
      this.connectPlatformBanners();
    }
    return this.platformBanners;
  }

  private connectPlatformBanners() {
    if (this.platformBannersConnected) return;
    this.platformBannersConnected = true;
    try {
      onSnapshot(
        collection(db, "platform_banners"),
        (snapshot) => {
          // an empty cloud collection never wipes banners saved locally before sync
          if (snapshot.empty) return;
          this.platformBanners = snapshot.docs
            .map((d) => d.data() as PlatformBanner)
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
          this.persistPlatformBanners();
          this.notify();
        },
        (error) => console.warn("[Firebase Firestore] Banner listener warning:", error)
      );
    } catch (err) {
      console.warn("[Firebase Firestore] Banner listener failed:", err);
    }
  }

  private persistPlatformBanners() {
    try {
      localStorage.setItem("shopper_platform_banners", JSON.stringify(this.platformBanners));
    } catch (e) {
      console.warn("Failed to save platform banners locally", e);
    }
  }

  /** Admin: uploads an image for a platform setting (e.g. a Discover card) and returns its URL. */
  public async uploadPlatformImage(file: File, name: string): Promise<string> {
    const { url } = await hostPlatformImage(file, `platform_banners/${name.replace(/[^\w-]/g, "_")}`, 1400);
    return url;
  }

  public async addPlatformBanner(file: File, link?: string): Promise<PlatformBanner> {
    this.getPlatformBanners();
    const id = `pb-${Date.now().toString(36)}`;
    let imageUrl: string;
    let storagePath: string | undefined;

    ({ url: imageUrl, storagePath } = await hostPlatformImage(file, `platform_banners/${id}`));

    const banner: PlatformBanner = {
      id,
      imageUrl,
      link: link?.trim() || undefined,
      storagePath,
      createdAt: new Date().toISOString(),
    };
    this.platformBanners = [banner, ...this.platformBanners];
    this.persistPlatformBanners();
    setDoc(doc(db, "platform_banners", id), JSON.parse(JSON.stringify(banner))).catch((err) =>
      console.warn("[Firebase Firestore] Banner save error", err)
    );
    this.notify();
    return banner;
  }

  // --- Where sellers pay their subscription (UPI IDs added by the admin; one is in use) ---
  private paymentSettings: PlatformPaymentSettings = {
    accounts: [{ upiId: siteConfig.platformUpiId, payeeName: siteConfig.platformMerchantName }],
    activeUpiId: siteConfig.platformUpiId,
  };

  /** The UPI ID sellers pay to right now. */
  public getPlatformPayment(): PlatformPayment {
    this.initClient();
    const { accounts, activeUpiId } = this.paymentSettings;
    return accounts.find((a) => a.upiId === activeUpiId) || accounts[0];
  }

  /** Every UPI ID the admin has added, and which one is in use. */
  public getPlatformPaymentSettings(): PlatformPaymentSettings {
    this.initClient();
    return { accounts: this.paymentSettings.accounts.map((a) => ({ ...a })), activeUpiId: this.paymentSettings.activeUpiId };
  }

  /** Cleans saved settings: keeps valid, unique UPI IDs; also reads the older single-UPI shape. */
  private applyPlatformPayment(saved?: Partial<PlatformPaymentSettings & PlatformPayment> | null) {
    const name = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim().slice(0, 50) : siteConfig.platformMerchantName);
    const seen = new Set<string>();
    const accounts: PlatformPayment[] = [];
    const add = (upiId: unknown, payeeName: unknown) => {
      if (typeof upiId !== "string" || !isValidUpiId(upiId)) return;
      const id = upiId.trim();
      if (seen.has(id.toLowerCase())) return;
      seen.add(id.toLowerCase());
      accounts.push({ upiId: id, payeeName: name(payeeName) });
    };
    if (Array.isArray(saved?.accounts)) saved!.accounts.forEach((a) => add(a?.upiId, a?.payeeName));
    if (accounts.length === 0) add(saved?.upiId, saved?.payeeName);
    if (accounts.length === 0) add(siteConfig.platformUpiId, siteConfig.platformMerchantName);
    const wanted = typeof saved?.activeUpiId === "string" ? saved.activeUpiId : typeof saved?.upiId === "string" ? saved.upiId : "";
    const active = accounts.find((a) => a.upiId.toLowerCase() === wanted.trim().toLowerCase()) || accounts[0];
    this.paymentSettings = { accounts, activeUpiId: active.upiId };
  }

  private loadPlatformPayment() {
    try {
      const saved = localStorage.getItem("shopper_platform_payment");
      if (saved) this.applyPlatformPayment(JSON.parse(saved));
    } catch (e) {
      console.warn("Failed to load payment settings", e);
    }
  }

  private connectPlatformPayment() {
    try {
      onSnapshot(
        doc(db, "platform_settings", "payment"),
        (snap) => {
          if (!snap.exists()) return;
          this.applyPlatformPayment(snap.data() as Partial<PlatformPaymentSettings & PlatformPayment>);
          try {
            localStorage.setItem("shopper_platform_payment", JSON.stringify(this.paymentSettings));
          } catch {
            // local copy is only a fast start
          }
          this.notify();
        },
        (error) => console.warn("[Firebase Firestore] Payment settings listener warning:", error)
      );
    } catch (err) {
      console.warn("[Firebase Firestore] Payment settings listener failed:", err);
    }
  }

  /** Admin: save the list of UPI IDs and which one sellers pay to. */
  public savePlatformPaymentSettings(next: PlatformPaymentSettings): { success: boolean; error?: string } {
    this.initClient();
    const bad = next.accounts.find((a) => !isValidUpiId(a.upiId));
    if (bad) return { success: false, error: `${bad.upiId || "That"} isn't a valid UPI ID. Use one like name@okaxis.` };
    if (next.accounts.length === 0) return { success: false, error: "Keep at least one UPI ID." };
    this.applyPlatformPayment(next);
    const active = this.getPlatformPayment();
    try {
      localStorage.setItem("shopper_platform_payment", JSON.stringify(this.paymentSettings));
    } catch {
      // ignore: Firestore below is what other devices read
    }
    setDoc(doc(db, "platform_settings", "payment"), {
      accounts: this.paymentSettings.accounts,
      activeUpiId: this.paymentSettings.activeUpiId,
      // the UPI ID in use, also kept flat for anything reading the older shape
      upiId: active.upiId,
      payeeName: active.payeeName,
      updatedAt: new Date().toISOString(),
    }).catch((err) => console.warn("[Firebase Firestore] Payment settings save error", err));
    this.notify();
    return { success: true };
  }

  // --- Feature access per plan (set by the admin, followed by every store on that plan) ---
  private loadPlanAccess() {
    try {
      const saved = localStorage.getItem("shopper_plan_access");
      if (saved) applyPlanAccess(JSON.parse(saved));
    } catch (e) {
      console.warn("Failed to load plan access settings", e);
    }
  }

  private connectPlanAccess() {
    try {
      onSnapshot(
        doc(db, "platform_settings", "plan_access"),
        (snap) => {
          if (!snap.exists()) return;
          const plans = (snap.data() as { plans?: Record<string, Partial<PlanAccess>> }).plans;
          applyPlanAccess(plans);
          try {
            localStorage.setItem("shopper_plan_access", JSON.stringify(plans || {}));
          } catch {
            // local copy is only a fast start; Firestore stays the source
          }
          this.notify();
        },
        (error) => console.warn("[Firebase Firestore] Plan access listener warning:", error)
      );
    } catch (err) {
      console.warn("[Firebase Firestore] Plan access listener failed:", err);
    }
  }

  /** Admin: save what each plan unlocks. Applies everywhere straight away. */
  public savePlanAccess(plans: Record<PlanId, PlanAccess>) {
    this.initClient();
    applyPlanAccess(plans);
    try {
      localStorage.setItem("shopper_plan_access", JSON.stringify(plans));
    } catch {
      // ignore: Firestore below is what other devices read
    }
    setDoc(doc(db, "platform_settings", "plan_access"), {
      plans: JSON.parse(JSON.stringify(plans)),
      updatedAt: new Date().toISOString(),
    }).catch((err) => console.warn("[Firebase Firestore] Plan access save error", err));
    this.notify();
  }

  public resetPlanAccess() {
    this.savePlanAccess(getDefaultPlanAccess());
  }

  // --- One-time theme prices (set by the admin) ---
  private loadThemePrices() {
    try {
      const saved = localStorage.getItem("shopper_theme_pricing");
      if (saved) applyThemePricing(JSON.parse(saved));
    } catch (e) {
      console.warn("Failed to load theme prices", e);
    }
  }

  private connectThemePrices() {
    try {
      onSnapshot(
        doc(db, "platform_settings", "theme_prices"),
        (snap) => {
          if (!snap.exists()) return;
          const data = snap.data() as { prices?: Record<string, number>; plans?: Record<string, ThemePlan> };
          applyThemePricing(data);
          try {
            localStorage.setItem("shopper_theme_pricing", JSON.stringify({ prices: data.prices || {}, plans: data.plans || {} }));
          } catch {
            // local copy is only a fast start; Firestore stays the source
          }
          this.notify();
        },
        (error) => console.warn("[Firebase Firestore] Theme prices listener warning:", error)
      );
    } catch (err) {
      console.warn("[Firebase Firestore] Theme prices listener failed:", err);
    }
  }

  /**
   * Admin: set a theme's one-time price in paise (0 makes it free) and/or the plan it comes with ("starter" is
   * Growth, null for none). Applies everywhere straight away.
   */
  public setThemePricing(slug: string, change: { price?: number; plan?: ThemePlan }): { success: boolean; error?: string } {
    this.initClient();
    const { prices, plans } = getThemePricingOverrides();
    if (change.price !== undefined) {
      if (!Number.isFinite(change.price) || change.price < 0 || change.price > MAX_THEME_PRICE) return { success: false, error: "Enter a price between ₹0 and ₹1,00,000." };
      prices[slug] = Math.round(change.price);
    }
    if (change.plan !== undefined) plans[slug] = change.plan;
    applyThemePricing({ prices, plans });
    try {
      localStorage.setItem("shopper_theme_pricing", JSON.stringify({ prices, plans }));
    } catch {
      // ignore: Firestore below is what other devices read
    }
    setDoc(doc(db, "platform_settings", "theme_prices"), { prices, plans, updatedAt: new Date().toISOString() }).catch((err) =>
      console.warn("[Firebase Firestore] Theme prices save error", err)
    );
    this.notify();
    return { success: true };
  }

  // --- Themes the admin uploaded as zips (shown to sellers next to the built-in ones) ---
  private platformThemes: CustomThemeDef[] = [];

  /** Uploaded themes, newest first. Also makes them known to the storefront and theme lists. */
  public getPlatformThemes(): CustomThemeDef[] {
    this.initClient();
    return this.platformThemes;
  }

  private applyPlatformThemes(list: unknown) {
    const themes = Array.isArray(list) ? (list as CustomThemeDef[]).filter((t) => t && typeof t.slug === "string" && t.slug.startsWith("custom-") && t.content) : [];
    this.platformThemes = themes.sort((a, b) => (b.uploadedAt || "").localeCompare(a.uploadedAt || ""));
    registerCustomThemes(this.platformThemes);
  }

  private loadPlatformThemes() {
    try {
      const saved = localStorage.getItem("shopper_platform_themes");
      if (saved) this.applyPlatformThemes(JSON.parse(saved));
    } catch (e) {
      console.warn("Failed to load uploaded themes", e);
    }
  }

  private connectPlatformThemes() {
    try {
      onSnapshot(
        doc(db, "platform_settings", "themes"),
        (snap) => {
          if (!snap.exists()) return;
          this.applyPlatformThemes((snap.data() as { themes?: unknown }).themes);
          try {
            localStorage.setItem("shopper_platform_themes", JSON.stringify(this.platformThemes));
          } catch {
            // local copy is only a fast start; Firestore stays the source
          }
          this.notify();
        },
        (error) => console.warn("[Firebase Firestore] Themes listener warning:", error)
      );
    } catch (err) {
      console.warn("[Firebase Firestore] Themes listener failed:", err);
    }
  }

  private savePlatformThemes(list: CustomThemeDef[]) {
    this.applyPlatformThemes(list);
    try {
      localStorage.setItem("shopper_platform_themes", JSON.stringify(this.platformThemes));
    } catch {
      // ignore: Firestore below is what other devices read
    }
    setDoc(doc(db, "platform_settings", "themes"), {
      themes: JSON.parse(JSON.stringify(this.platformThemes)),
      updatedAt: new Date().toISOString(),
    }).catch((err) => console.warn("[Firebase Firestore] Themes save error", err));
    this.notify();
  }

  /** Admin: add an uploaded theme, or replace one with the same slug. */
  public addPlatformTheme(theme: CustomThemeDef) {
    this.initClient();
    this.savePlatformThemes([theme, ...this.platformThemes.filter((t) => t.slug !== theme.slug)]);
  }

  /** Admin: show or hide an uploaded theme for sellers. Shops already using it keep it. */
  public setPlatformThemeEnabled(slug: string, enabled: boolean) {
    this.initClient();
    this.savePlatformThemes(this.platformThemes.map((t) => (t.slug === slug ? { ...t, enabled } : t)));
  }

  /** Admin: remove an uploaded theme. Shops still using it go back to the default theme. */
  public deletePlatformTheme(slug: string) {
    this.initClient();
    this.savePlatformThemes(this.platformThemes.filter((t) => t.slug !== slug));
  }

  // --- Plan name, price, description and features (set by the admin) ---
  private loadPlanDetails() {
    try {
      const saved = localStorage.getItem("shopper_plan_details");
      if (saved) applyPlanDetails(JSON.parse(saved));
    } catch (e) {
      console.warn("Failed to load plan details", e);
    }
  }

  private connectPlanDetails() {
    try {
      onSnapshot(
        doc(db, "platform_settings", "plan_details"),
        (snap) => {
          if (!snap.exists()) return;
          const plans = (snap.data() as { plans?: Record<string, Partial<PlanDetails>> }).plans;
          applyPlanDetails(plans);
          try {
            localStorage.setItem("shopper_plan_details", JSON.stringify(plans || {}));
          } catch {
            // local copy is only a fast start
          }
          this.notify();
        },
        (error) => console.warn("[Firebase Firestore] Plan details listener warning:", error)
      );
    } catch (err) {
      console.warn("[Firebase Firestore] Plan details listener failed:", err);
    }
  }

  public savePlanDetails(plans: Record<PlanId, PlanDetails>) {
    this.initClient();
    applyPlanDetails(plans);
    const clean = getAllPlanDetails();
    try {
      localStorage.setItem("shopper_plan_details", JSON.stringify(clean));
    } catch {
      // ignore: Firestore below is what other devices read
    }
    setDoc(doc(db, "platform_settings", "plan_details"), {
      plans: JSON.parse(JSON.stringify(clean)),
      updatedAt: new Date().toISOString(),
    }).catch((err) => console.warn("[Firebase Firestore] Plan details save error", err));
    this.notify();
  }

  /** Admin: save one plan's details and what it unlocks together. */
  public savePlan(id: PlanId, details: PlanDetails, access: PlanAccess) {
    this.savePlanDetails({ ...getAllPlanDetails(), [id]: details });
    this.savePlanAccess({ ...getAllPlanAccess(), [id]: access });
  }

  /** Admin: put one plan back to its built-in name, price, text, features and access. */
  public resetPlan(id: PlanId) {
    this.savePlan(id, getDefaultPlanDetails()[id], getDefaultPlanAccess()[id]);
  }

  public updatePlatformBannerLink(id: string, link: string) {
    this.getPlatformBanners();
    this.platformBanners = this.platformBanners.map((b) => (b.id === id ? { ...b, link: link.trim() || undefined } : b));
    this.persistPlatformBanners();
    const updated = this.platformBanners.find((b) => b.id === id);
    if (updated) {
      setDoc(doc(db, "platform_banners", id), JSON.parse(JSON.stringify(updated))).catch((err) =>
        console.warn("[Firebase Firestore] Banner update error", err)
      );
    }
    this.notify();
  }

  public deletePlatformBanner(id: string) {
    this.getPlatformBanners();
    const banner = this.platformBanners.find((b) => b.id === id);
    this.platformBanners = this.platformBanners.filter((b) => b.id !== id);
    this.persistPlatformBanners();
    deleteDoc(doc(db, "platform_banners", id)).catch((err) => console.warn("[Firebase Firestore] Banner delete error", err));
    if (banner?.storagePath) {
      deleteObject(storageRef(storage, banner.storagePath)).catch((err) =>
        console.warn("[Firebase Storage] Banner image delete error", err)
      );
    }
    this.notify();
  }

  public getPlatformStats() {
    this.initClient();
    const stores = this.getAllStores();
    const totalStores = stores.length;
    const activeStores = stores.filter((s) => s.status === "published").length;
    const suspendedStores = stores.filter((s) => s.status === "suspended").length;

    let totalRevenue = 0;
    let totalOrders = 0;
    let totalProducts = 0;
    const customerPhoneSet = new Set<string>();
    let totalSubscribers = 0;

    let freeStores = 0;
    let starterStores = 0;
    let proStores = 0;

    stores.forEach((s) => {
      totalProducts += s.products?.length || 0;
      totalOrders += s.orders?.length || 0;
      (s.orders || []).forEach((o) => {
        totalRevenue += o.total || 0;
      });
      (s.customers || []).forEach((c) => {
        if (c.phone) customerPhoneSet.add(c.phone);
      });
      totalSubscribers += s.subscribers?.length || 0;

      if (s.planId === "pro") proStores++;
      else if (s.planId === "starter") starterStores++;
      else freeStores++;
    });

    const mrr = starterStores * (PLATFORM_PLANS.starter.priceMonthly / 100) + proStores * (PLATFORM_PLANS.pro.priceMonthly / 100);

    return {
      totalStores,
      activeStores,
      suspendedStores,
      totalRevenue,
      totalOrders,
      totalProducts,
      totalCustomers: customerPhoneSet.size,
      totalSubscribers,
      freeStores,
      starterStores,
      proStores,
      mrr,
    };
  }

  public getStoreDiscounts(subdomain: string): DiscountData[] {
    this.initClient();
    const store = this.getStore(subdomain);
    return store?.discounts || [];
  }

  public addDiscount(
    subdomain: string,
    discountInput: Omit<DiscountData, "id" | "timesUsed" | "createdAt">
  ): DiscountData {
    this.initClient();
    const store = this.getStore(subdomain);
    if (!store) throw new Error("Store not found");

    if (!store.discounts) store.discounts = [];
    const newDiscount: DiscountData = {
      ...discountInput,
      id: `disc-${Date.now().toString(36)}`,
      code: discountInput.code.trim().toUpperCase(),
      timesUsed: 0,
      createdAt: new Date().toISOString(),
    };

    store.discounts.unshift(newDiscount);
    this.updateStore(subdomain, { discounts: store.discounts });
    return newDiscount;
  }

  public toggleDiscount(subdomain: string, discountId: string): boolean {
    this.initClient();
    const store = this.getStore(subdomain);
    if (!store || !store.discounts) return false;

    const discount = store.discounts.find((d) => d.id === discountId);
    if (!discount) return false;

    discount.isActive = !discount.isActive;
    this.updateStore(subdomain, { discounts: store.discounts });
    return true;
  }

  public deleteDiscount(subdomain: string, discountId: string): boolean {
    this.initClient();
    const store = this.getStore(subdomain);
    if (!store || !store.discounts) return false;

    store.discounts = store.discounts.filter((d) => d.id !== discountId);
    this.updateStore(subdomain, { discounts: store.discounts });
    return true;
  }
}


export const storeService = new StoreService();

// Shrinks an image to `maxWidth` and re-encodes it as JPEG, for when cloud upload isn't available
function compressImageToDataUrl(file: File, maxWidth: number, quality: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Could not read image"));
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/** Uploads an admin image to Firebase Storage, or keeps a compressed copy if that isn't available. */
async function hostPlatformImage(file: File, pathBase: string, maxWidth = 1600): Promise<{ url: string; storagePath?: string }> {
  try {
    // give up after 20s so the admin isn't left waiting
    const path = `${pathBase}-${Date.now().toString(36)}-${file.name.replace(/[^\w.-]/g, "_")}`;
    const uploaded = await Promise.race([
      uploadBytes(storageRef(storage, path), file, { contentType: file.type }),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("upload timed out")), 20000)),
    ]);
    return { url: await getDownloadURL(uploaded.ref), storagePath: path };
  } catch (err) {
    console.warn("[Firebase Storage] Upload failed, storing a compressed copy instead:", err);
    return { url: await compressImageToDataUrl(file, maxWidth, 0.82) };
  }
}
