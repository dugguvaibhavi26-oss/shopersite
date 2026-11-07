"use client";

import * as React from "react";
import type { OrderItemData, ProductData, StoreData, CategoryData } from "@/lib/store-service";
import { canEditTheme } from "@/lib/theme-pricing";
import { resolveSiteContent, SITE_THEME_STYLE, toSiteTheme, type SiteContent, type SiteThemeSlug } from "@/lib/site-content";

/** One line in the bag. `key` keeps the same product in two sizes apart. */
export interface BagLine extends OrderItemData {
  key: string;
}

export interface SavedDetails {
  name: string;
  phone: string;
  email: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
}

export const EMPTY_DETAILS: SavedDetails = { name: "", phone: "", email: "", street: "", city: "", state: "", pincode: "" };

interface SiteContextValue {
  store: StoreData;
  theme: SiteThemeSlug;
  /** the chosen theme's own slug: the same as theme, or an uploaded theme drawn with theme's layout */
  themeKey: string;
  /** the theme's fixed look (header style, card corners, footer) */
  look: (typeof SITE_THEME_STYLE)[SiteThemeSlug];
  content: SiteContent;
  /** true inside the theme editor's preview frame */
  editing: boolean;
  /** a dashboard theme preview with sample products: nothing a buyer does there is saved to the shop */
  demo: boolean;
  /** "/s/shop" on the app's address, "" on the store's own address */
  base: string;
  href: (path: string) => string;
  bag: BagLine[];
  bagCount: number;
  addToBag: (product: ProductData, quantity?: number, variantName?: string) => void;
  setQuantity: (key: string, quantity: number) => void;
  removeLine: (key: string) => void;
  clearBag: () => void;
  coupon: string;
  setCoupon: (code: string) => void;
  wishlist: string[];
  toggleWish: (productId: string) => void;
  orderTokens: string[];
  rememberOrder: (token: string) => void;
  details: SavedDetails;
  saveDetails: (d: SavedDetails) => void;
  toast: { text: string; bag: boolean } | null;
  showToast: (text: string, bag?: boolean) => void;
}

export const SiteContext = React.createContext<SiteContextValue | null>(null);

export function useSite(): SiteContextValue {
  const ctx = React.useContext(SiteContext);
  if (!ctx) throw new Error("useSite must be used inside <SiteProvider>");
  return ctx;
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

/** A bag, wishlist, past orders and saved address for this shop, kept on the buyer's device. */
function useStored<T>(key: string, fallback: T): [T, (next: T | ((prev: T) => T)) => void] {
  const [value, setValue] = React.useState<T>(fallback);
  React.useEffect(() => {
    setValue(readJson(key, fallback));
    const onStorage = (e: StorageEvent) => e.key === key && setValue(readJson(key, fallback));
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const update = React.useCallback(
    (next: T | ((prev: T) => T)) =>
      setValue((prev) => {
        const v = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        writeJson(key, v);
        return v;
      }),
    [key]
  );
  return [value, update];
}

export function SiteProvider({
  store,
  base,
  theme,
  draft,
  editing,
  demo = false,
  previewQuery,
  children,
}: {
  store: StoreData;
  base: string;
  /** unsaved content sent by the theme editor */
  draft: unknown;
  /** the chosen theme: a built-in slug or an uploaded theme's own slug */
  theme: string;
  editing: boolean;
  demo?: boolean;
  /** kept on every link while a seller previews the theme, e.g. "?preview_theme=mono-studio" */
  previewQuery: string;
  children: React.ReactNode;
}) {
  // the sample products get their own bag and wishlist, so they never mix with the real ones
  const sub = demo ? `${store.subdomain}_demo` : store.subdomain;
  const [bag, setBag] = useStored<BagLine[]>(`shopersite_bag_${sub}`, []);
  const [coupon, setCouponState] = useStored<string>(`shopersite_coupon_${sub}`, "");
  const [wishlist, setWishlist] = useStored<string[]>(`shopersite_wish_${sub}`, []);
  const [orderTokens, setOrderTokens] = useStored<string[]>(`shopersite_orders_${sub}`, []);
  const [details, setDetails] = useStored<SavedDetails>(`shopersite_details_${sub}`, EMPTY_DETAILS);
  const [toast, setToast] = React.useState<{ text: string; bag: boolean } | null>(null);
  const toastTimer = React.useRef<number | undefined>(undefined);

  // Edits show on plans with the theme editor, and on a theme the shop bought; otherwise the theme as it comes
  const content = React.useMemo(() => {
    const saved = draft ?? (canEditTheme(store, theme) ? store.themeContent?.[theme] : undefined);
    return resolveSiteContent(saved, theme, store.name);
  }, [draft, theme, store]);

  const href = React.useCallback(
    (path: string) => {
      if (/^(https?:|mailto:|tel:|#)/.test(path)) return path;
      const clean = path.startsWith("/") ? path : `/${path}`;
      const joined = `${base}${clean === "/" ? "" : clean}` || "/";
      if (!previewQuery) return joined;
      return joined.includes("?") ? `${joined}&${previewQuery.slice(1)}` : `${joined}${previewQuery}`;
    },
    [base, previewQuery]
  );

  const showToast = React.useCallback((text: string, bag = false) => {
    setToast({ text, bag });
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2600);
  }, []);

  const addToBag = React.useCallback(
    (product: ProductData, quantity = 1, variantName?: string) => {
      const key = `${product.id}::${variantName || ""}`;
      setBag((prev) => {
        const found = prev.find((l) => l.key === key);
        const max = product.stock > 0 ? product.stock : 99;
        if (found) return prev.map((l) => (l.key === key ? { ...l, quantity: Math.min(max, l.quantity + quantity) } : l));
        return [
          ...prev,
          {
            key,
            productId: product.id,
            title: product.title,
            image: product.images?.[0] || "",
            quantity: Math.min(max, quantity),
            price: product.price,
            ...(variantName ? { variantName } : {}),
          },
        ];
      });
      showToast("Added to your bag", true);
    },
    [setBag, showToast]
  );

  const drawn = toSiteTheme(theme);
  const value: SiteContextValue = {
    store,
    theme: drawn,
    themeKey: theme,
    look: SITE_THEME_STYLE[drawn],
    content,
    editing,
    demo,
    base,
    href,
    bag,
    bagCount: bag.reduce((n, l) => n + l.quantity, 0),
    addToBag,
    setQuantity: (key, quantity) =>
      setBag((prev) => (quantity <= 0 ? prev.filter((l) => l.key !== key) : prev.map((l) => (l.key === key ? { ...l, quantity } : l)))),
    removeLine: (key) => setBag((prev) => prev.filter((l) => l.key !== key)),
    clearBag: () => {
      setBag([]);
      setCouponState("");
    },
    coupon,
    setCoupon: setCouponState,
    wishlist,
    toggleWish: (id) => setWishlist((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])),
    orderTokens,
    rememberOrder: (token) => setOrderTokens((prev) => [token, ...prev.filter((t) => t !== token)].slice(0, 50)),
    details,
    saveDetails: setDetails,
    toast,
    showToast,
  };

  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
}

// --- helpers shared by the theme's pages --------------------------------------------------------

export const rupees = (paise: number) => `₹${Math.round(paise / 100).toLocaleString("en-IN")}`;

export function visibleProducts(store: StoreData): ProductData[] {
  return (store.products || []).filter((p) => p.status === "published");
}

export function activeCategories(store: StoreData): CategoryData[] {
  return (store.categories || []).filter((c) => c.isActive ?? true).sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
}

/** Categories buyers shop by: the child categories, or every category when none are nested. */
export function shoppableCategories(store: StoreData): CategoryData[] {
  const all = activeCategories(store);
  const leaves = all.filter((c) => !c.isParent);
  return leaves.length ? leaves : all;
}

const slugify = (v: string) => v.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Products in a category; a parent category also includes its children's products. */
export function productsInCategory(store: StoreData, category: CategoryData): ProductData[] {
  const members = [category, ...(store.categories || []).filter((c) => c.parentId === category.id)];
  const keys = new Set(members.flatMap((c) => [c.name.toLowerCase(), c.slug.toLowerCase(), c.id.toLowerCase()]));
  return visibleProducts(store).filter((p) => {
    const cat = (p.category || "").toLowerCase();
    return keys.has(cat) || keys.has(slugify(cat));
  });
}

/** How many of each product have been ordered, for "Best sellers". */
export function unitsSold(store: StoreData): Record<string, number> {
  const sold: Record<string, number> = {};
  for (const o of store.orders || []) {
    if (o.fulfilmentStatus === "cancelled") continue;
    for (const it of o.items || []) sold[it.productId] = (sold[it.productId] || 0) + it.quantity;
  }
  return sold;
}

/** Products for a product row: "bestsellers", "newest", "sale", "all" or "category:<slug>". */
export function productsFromSource(store: StoreData, source: string, limit = 12): ProductData[] {
  let list = visibleProducts(store);
  const newest = (a: ProductData, b: ProductData) => (b.createdAt || "").localeCompare(a.createdAt || "");
  if (source.startsWith("category:")) {
    const cat = (store.categories || []).find((c) => c.slug === source.slice(9));
    list = cat ? productsInCategory(store, cat) : [];
  } else if (source === "newest") {
    list = [...list].sort(newest);
  } else if (source === "sale") {
    list = list.filter((p) => p.compareAtPrice && p.compareAtPrice > p.price);
  } else if (source === "bestsellers") {
    const sold = unitsSold(store);
    list = [...list].sort((a, b) => (sold[b.id] || 0) - (sold[a.id] || 0) || (b.reviewCount || 0) - (a.reviewCount || 0) || newest(a, b));
  }
  return list.slice(0, limit);
}

export function discountPercent(p: ProductData): number {
  return p.compareAtPrice && p.compareAtPrice > p.price ? Math.round((1 - p.price / p.compareAtPrice) * 100) : 0;
}

/** Where the gift note written on the homepage waits for checkout, per shop (session storage). */
export function giftNoteKey(subdomain: string) {
  return `shopersite_gift_note:${subdomain}`;
}

/** wa.me link for the shop's phone, with an optional message. */
export function whatsappLink(phone: string | undefined, text?: string): string {
  const digits = (phone || "").replace(/[^0-9]/g, "");
  if (!digits) return "";
  const full = digits.length === 10 ? `91${digits}` : digits;
  return `https://wa.me/${full}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}
