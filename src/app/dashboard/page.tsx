"use client";

import { RAIL_WIDTH, SidebarRail } from "./sidebar-rail";
import { MobileDock } from "./mobile-dock";
import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  storeService,
  StoreData,
  ProductData,
  CategoryData,
  OrderData,
  ReviewData,
  BannerData,
  PlatformBroadcast,
  DiscountData,
} from "@/lib/store-service";
import { PLATFORM_PLANS, canAddProduct, canUseReviews, canUseCoupons, canUseEmail, planDiscountPercent, cheapestPlanWith, canAddBanner, canUseThemeEditor, isPaidPlan, calculatePlanPrice, BILLING_CYCLES, type BillingCycle } from "@/lib/plans";
import { CountUp } from "@/components/home/reveal";
import { ShopperLogo, ShopperMark } from "@/components/brand/shopper-logo";
import { AnnouncementBanners } from "@/components/dashboard/announcement-banners";
import { HelpAndMore } from "@/components/dashboard/help-and-more";
import { SetupWizard, SETUP_STEPS, isSetupStepDone } from "@/components/dashboard/setup-wizard";
import { LockedFeature } from "@/components/dashboard/locked-feature";
import { SubscriptionPaymentModal } from "@/components/dashboard/subscription-payment-modal";
import { CashfreePaymentsCard } from "@/components/dashboard/cashfree-payments";
import { fetchPaidOnlineOrders } from "@/lib/payments/client";
import { ThemePurchaseModal } from "@/components/dashboard/theme-purchase-modal";
import { canEditTheme, canUseTheme, formatThemePrice, getThemePrice, ownsTheme, planIncludesTheme } from "@/lib/theme-pricing";
import { getTheme, getAllThemes } from "@/lib/themes";
import { computeSalesAnalytics } from "@/lib/sales-analytics";
import { siteConfig, getStoreUrl, getPublicStoreUrl, getPublicStoreAddress } from "@/lib/config/site";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import {
  LayoutDashboard,
  Globe,
  Package,
  ShoppingBag,
  Users,
  Star,
  Image as ImageIcon,
  Palette,
  CreditCard,
  Settings,
  ExternalLink,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  Truck,
  QrCode,
  Share2,
  MessageCircle,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  Copy,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  Phone,
  DollarSign,
  Search,
  UploadCloud,
  Eye,
  EyeOff,
  Monitor,
  Smartphone,
  Tablet,
  Type,
  Sparkles,
  Check,
  RefreshCw,
  FolderTree,
  Lock,
  Upload,
  ArrowUpDown,
  Plug,
  Mail,
  Send,
  CheckCircle2,
  LogOut,
  Store,
  Bell,
  Tag,
  TrendingUp,
  TrendingDown,
  Info,
  Activity,
  MoreVertical,
  Clock,
  Percent,
  ShoppingCart,
  BarChart2,
  SlidersHorizontal,
  IndianRupee,
  ArrowUpRight,
  ArrowLeft,
  MapPin,
} from "lucide-react";

// On desktop the dashboard scrolls inside its rounded panel, on phones the page itself scrolls; this moves both.
function scrollDashTop(options: ScrollToOptions) {
  window.scrollTo(options);
  document.getElementById("dash-scroll")?.scrollTo(options);
}

export default function DashboardPageWrapper() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-neutral-500 font-medium">Loading Seller Dashboard...</p>
          </div>
        </div>
      }
    >
      <DashboardPageContent />
    </Suspense>
  );
}

function DashboardPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlStoreParam = searchParams.get("store");
  const urlTabParam = searchParams.get("tab");
  const { user, loading: authLoading, signOut } = useAuth();

  const [activeSubdomain, setActiveSubdomain] = useState<string>(urlStoreParam || "");
  const [store, setStore] = useState<StoreData | null>(null);
  const [userStores, setUserStores] = useState<StoreData[]>([]);
  const [activeTab, setActiveTab] = useState<
    "overview" | "products" | "categories" | "orders" | "discounts" | "customers" | "reviews" | "banners" | "themes" | "billing" | "settings" | "plugins" | "notifications" | "profile"
  >((urlTabParam as any) || "overview");

  // Remember the pages visited so each page's back button can return to the previous one
  const tabHistory = React.useRef<(typeof activeTab)[]>([]);
  const lastTab = React.useRef(activeTab);
  const goingBack = React.useRef(false);
  useEffect(() => {
    if (lastTab.current !== activeTab) {
      if (!goingBack.current) tabHistory.current = [...tabHistory.current, lastTab.current].slice(-20);
      goingBack.current = false;
      lastTab.current = activeTab;
    }
  }, [activeTab]);
  const goBackTab = () => {
    const previous = tabHistory.current.pop();
    goingBack.current = true;
    setActiveTab(previous && previous !== activeTab ? previous : "overview");
    scrollDashTop({ top: 0 });
  };

  // Android back button in the mobile app: step back through dashboard pages before leaving
  useEffect(() => {
    const onAppBack = (e: Event) => {
      if (activeTab === "overview") return;
      e.preventDefault();
      goBackTab();
    };
    window.addEventListener("app:back", onAppBack);
    return () => window.removeEventListener("app:back", onAppBack);
  });

  useEffect(() => {
    if (urlTabParam && urlTabParam !== activeTab) {
      setActiveTab(urlTabParam as any);
    }
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const action = params.get("action");
      if (action === "new-product" || action === "new") {
        setIsProductModalOpen(true);
      }
      if (action === "new-category") {
        setIsCategoryModalOpen(true);
      }
      if (action === "new-coupon") {
        setIsDiscountModalOpen(true);
      }
      if (action === "new-banner") {
        setIsBannerModalOpen(true);
      }
    }
  }, [urlTabParam]);

  // Keep the open page in the URL so a refresh lands back on it
  useEffect(() => {
    const url = new URL(window.location.href);
    if (activeTab === "overview") url.searchParams.delete("tab");
    else url.searchParams.set("tab", activeTab);
    url.searchParams.delete("action");
    if (url.href !== window.location.href) window.history.replaceState(window.history.state, "", url.href);
  }, [activeTab]);

  // Time-Range Filters & Performance Metrics
  const [timeRange, setTimeRange] = useState<"today" | "yesterday" | "7d" | "30d">("today");
  const [isAllMetricsExpanded, setIsAllMetricsExpanded] = useState(false);

  // Notifications Drawer State
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const notificationRef = React.useRef<HTMLDivElement>(null);

  // Close the notifications card on any tap outside it, a scroll, Escape or a page change
  useEffect(() => {
    if (!isNotificationOpen) return;
    const close = () => setIsNotificationOpen(false);
    const onPointerDown = (e: PointerEvent) => {
      if (!notificationRef.current?.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", close, { passive: true });
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", close);
    };
  }, [isNotificationOpen]);
  // Notifications come from the store's real orders and stock; read ones are remembered on this device
  const [readNoticeIds, setReadNoticeIds] = useState<string[]>([]);
  useEffect(() => {
    if (!activeSubdomain) return;
    try {
      setReadNoticeIds(JSON.parse(localStorage.getItem(`shopper_read_notices_${activeSubdomain}`) || "[]"));
    } catch {
      setReadNoticeIds([]);
    }
  }, [activeSubdomain]);

  // Mobile Bottom Pill & Drawer State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Discounts & Coupons Modal State
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  // Setup checklist: step-by-step card, opened at the step that was tapped
  const [setupStart, setSetupStart] = useState<number | null>(null);
  const [dCode, setDCode] = useState("");
  const [dType, setDType] = useState<"percentage" | "flat">("percentage");
  const [dValue, setDValue] = useState("");
  const [dMinOrder, setDMinOrder] = useState("");
  const [dMaxDiscount, setDMaxDiscount] = useState("");
  const [dIsActive, setDIsActive] = useState(true);

  // Plugins & Gmail Integration State
  const [gmailEmailInput, setGmailEmailInput] = useState("");
  const [gmailAutoAlerts, setGmailAutoAlerts] = useState(false);
  const [gmailConnected, setGmailConnected] = useState(false);
  const [gmailSaveToast, setGmailSaveToast] = useState(false);
  const [testEmailToast, setTestEmailToast] = useState(false);
  const [dropSubject, setDropSubject] = useState("");
  const [dropCollection, setDropCollection] = useState("");
  const [dropMessage, setDropMessage] = useState("");
  const [dropSending, setDropSending] = useState(false);
  const [dropSentSuccess, setDropSentSuccess] = useState(false);

  // Add/Edit Product Modal
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [subscriptionModalPlanId, setSubscriptionModalPlanId] = useState<"starter" | "pro">("starter");
  const [subscriptionModalBillingCycle, setSubscriptionModalBillingCycle] = useState<BillingCycle>("monthly");
  const [dashboardBillingCycle, setDashboardBillingCycle] = useState<BillingCycle>("monthly");

  const openSubscriptionModal = (
    planId: "starter" | "pro" = "starter",
    cycle: BillingCycle = "monthly"
  ) => {
    setSubscriptionModalPlanId(planId);
    setSubscriptionModalBillingCycle(cycle);
    setIsSubscriptionModalOpen(true);
  };

  // Checkout in the URL (?checkout=starter|pro&cycle=..., or ?upgrade= from sign-up): open the
  // upgrade page once the store loads, so arriving from sign-up or refreshing mid-payment lands there
  const checkoutParam = searchParams.get("checkout") || searchParams.get("upgrade");
  const cycleParam = searchParams.get("cycle");
  const openedCheckoutFor = React.useRef("");
  useEffect(() => {
    if (!store || (checkoutParam !== "starter" && checkoutParam !== "pro")) return;
    if (openedCheckoutFor.current === store.subdomain) return;
    openedCheckoutFor.current = store.subdomain;
    if (store.planId === checkoutParam && !store.pendingSubscription) {
      // already on that plan: drop the leftover checkout params
      const url = new URL(window.location.href);
      ["checkout", "upgrade", "cycle", "step", "ref"].forEach((k) => url.searchParams.delete(k));
      window.history.replaceState(window.history.state, "", url.href);
      return;
    }
    const cycle: BillingCycle = cycleParam === "quarterly" || cycleParam === "yearly" ? cycleParam : "monthly";
    setActiveTab("billing");
    openSubscriptionModal(checkoutParam, cycle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store?.subdomain, checkoutParam]);

  // list filters for the products, orders and customers pages
  const [productSearch, setProductSearch] = useState("");
  const [productFilter, setProductFilter] = useState<"all" | "in" | "low" | "out">("all");
  const [orderFilter, setOrderFilter] = useState<"all" | "toship" | "shipped" | "delivered">("all");
  const [customerSearch, setCustomerSearch] = useState("");
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [pTitle, setPTitle] = useState("");
  const [pCategory, setPCategory] = useState("");
  const [pPrice, setPPrice] = useState("");
  const [pComparePrice, setPComparePrice] = useState("");
  const [pStock, setPStock] = useState("10");
  const [pDesc, setPDesc] = useState("");
  const [pImageUrl, setPImageUrl] = useState("");

  // Category Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [cName, setCName] = useState("");
  const [cSlug, setCSlug] = useState("");
  const [cDesc, setCDesc] = useState("");
  const [cImageUrl, setCImageUrl] = useState("");
  const [cIsActive, setCIsActive] = useState(true);
  const [cIsParent, setCIsParent] = useState(false);
  const [cParentId, setCParentId] = useState("");
  const [cSubtitle, setCSubtitle] = useState("");
  const [cCtaText, setCCtaText] = useState("");
  const [cSelectedChildren, setCSelectedChildren] = useState<string[]>([]);
  const [catSearchQuery, setCatSearchQuery] = useState("");
  const [categoryViewTab, setCategoryViewTab] = useState<"categories" | "collections">("categories");
  const [catMenuId, setCatMenuId] = useState<string | null>(null);

  // Brand Logo State
  const [logoUrlInput, setLogoUrlInput] = useState("");
  const [logoSavedToast, setLogoSavedToast] = useState(false);

  // Platform Broadcasts from Lead Admin
  const [platformBroadcasts, setPlatformBroadcasts] = useState<PlatformBroadcast[]>([]);
  const [dismissedBroadcastIds, setDismissedBroadcastIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("shopper_dismissed_broadcasts") || "[]");
      if (Array.isArray(saved)) setDismissedBroadcastIds(saved);
    } catch {}
  }, []);

  // (section order is now edited in the website editor)

  // Upgrade Modal
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [selectedUpgradePlan, setSelectedUpgradePlan] = useState<"starter" | "pro">("starter");
  const [upgradeSuccess, setUpgradeSuccess] = useState(false);

  // Order Details Modal
  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null);
  const [courierNameInput, setCourierNameInput] = useState("");
  const [trackingNumberInput, setTrackingNumberInput] = useState("");

  // Banner Modal State
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
  const [bImageUrl, setBImageUrl] = useState("");
  const [bTargetType, setBTargetType] = useState<"category" | "product" | "">("");
  const [bSelectedCategory, setBSelectedCategory] = useState("");
  const [bSelectedProduct, setBSelectedProduct] = useState<ProductData | null>(null);
  const [bSearchQuery, setBSearchQuery] = useState("");

  // Settings State
  const [announcementInput, setAnnouncementInput] = useState("");
  const [upiIdInput, setUpiIdInput] = useState("");
  const [codEnabledInput, setCodEnabledInput] = useState(true);
  const [codFeeInput, setCodFeeInput] = useState("0");

  // Brand Theme State (3 Fields: Primary, Background, Surface)
  const [themeAppliedToast, setThemeAppliedToast] = useState<string | null>(null);
  // the theme the seller is buying, in the purchase window
  const [themeToBuy, setThemeToBuy] = useState<string | null>(() => searchParams.get("buy"));

  const [copiedLink, setCopiedLink] = useState(false);

  // Redirect to login if user is not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirect=/dashboard");
    }
  }, [authLoading, user, router]);

  // Signed in but no shop yet: go straight to creating one. Only decided once the store list has
  // arrived from Firestore, so a fresh phone isn't sent to signup before its stores have loaded.
  const [storesReady, setStoresReady] = useState(storeService.isCloudSynced());
  useEffect(() => storeService.subscribe(() => setStoresReady(storeService.isCloudSynced())), []);
  useEffect(() => {
    if (authLoading || !user || !storesReady) return;
    if (storeService.getUserStores(user.uid, user.email || undefined).length === 0) {
      router.replace("/register");
    }
  }, [authLoading, user, storesReady, router]);

  // Orders paid online (Cashfree) are recorded by the server; re-apply them here in case an older copy
  // of the store saved over the order list. Runs when the store opens and when Orders is opened.
  const onlineOrdersStore = store?.subdomain;
  const ordersOpen = activeTab === "orders";
  useEffect(() => {
    if (!user || !onlineOrdersStore) return;
    let cancelled = false;
    fetchPaidOnlineOrders(onlineOrdersStore)
      .then((orders) => {
        if (!cancelled && orders.length) storeService.mergeOnlineOrders(onlineOrdersStore, orders);
      })
      .catch(() => {
        // payments not set up on this server, or offline: nothing to merge
      });
    return () => {
      cancelled = true;
    };
  }, [user, onlineOrdersStore, ordersOpen]);

  // Sync activeSubdomain when URL search param changes
  useEffect(() => {
    if (urlStoreParam && urlStoreParam !== activeSubdomain) {
      setActiveSubdomain(urlStoreParam);
    }
  }, [urlStoreParam, activeSubdomain]);

  // Load user's real stores and subscribe to live changes
  useEffect(() => {
    if (!user) return;

    const applyStore = (s: StoreData) => {
      setStore(s);
      setAnnouncementInput(s.announcementText || "");
      setUpiIdInput(s.upiId || "");
      setCodEnabledInput(s.codEnabled);
      setCodFeeInput((s.codFee / 100).toString());
      setLogoUrlInput(s.logoUrl || "");
      if (s.pluginsConfig?.gmailIntegration) {
        setGmailEmailInput(s.pluginsConfig.gmailIntegration.connectedEmail || s.contactEmail || "");
        setGmailAutoAlerts(s.pluginsConfig.gmailIntegration.autoSendNewDropAlerts ?? false);
        setGmailConnected(s.pluginsConfig.gmailIntegration.isConnected ?? false);
      } else {
        setGmailEmailInput(s.contactEmail || "");
        setGmailConnected(false);
        setGmailAutoAlerts(false);
      }
    };

    const loadStoreData = () => {
      const myStores = storeService.getUserStores(user.uid, user.email || undefined);
      setUserStores(myStores);

      if (myStores.length === 0) {
        setStore(null);
        return;
      }

      // Check if requested store or current activeSubdomain is in user's stores
      let current = urlStoreParam ? myStores.find((s) => s.subdomain === urlStoreParam) : null;
      if (!current && activeSubdomain) {
        current = myStores.find((s) => s.subdomain === activeSubdomain);
      }
      if (!current) {
        current = myStores[0];
      }

      if (current) {
        setActiveSubdomain(current.subdomain);
        applyStore(current);
      }

      setPlatformBroadcasts(storeService.getPlatformBroadcasts());
    };

    loadStoreData();

    // Live subscription to Firebase Firestore updates
    const unsubscribe = storeService.subscribe(() => {
      loadStoreData();
    });

    return () => unsubscribe();
  }, [user, activeSubdomain, urlStoreParam]);

  const refreshStore = () => {
    if (!store) return;
    const loaded = storeService.getStore(store.subdomain);
    if (loaded) setStore({ ...loaded });
  };

  // Shop on/off switch (Sales card): buyers see an "unavailable" card while the shop is off
  const [closedMsgDraft, setClosedMsgDraft] = useState("");
  useEffect(() => {
    setClosedMsgDraft(store?.closedMessage || "");
    // only reset the draft when switching shops, not on every store update while typing
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store?.subdomain]);
  const saveClosedMessage = () => {
    if (!store || (store.closedMessage || "") === closedMsgDraft.trim()) return;
    storeService.updateStore(store.subdomain, { closedMessage: closedMsgDraft.trim() });
    refreshStore();
  };
  const toggleShopOpen = () => {
    if (!store) return;
    storeService.updateStore(store.subdomain, { isClosed: !store.isClosed, closedMessage: closedMsgDraft.trim() });
    refreshStore();
  };

  const activeBroadcasts = useMemo(() => {
    if (!store) return [];
    return platformBroadcasts.filter(
      (b) =>
        (b.target === "all" || b.target === store.planId) &&
        !dismissedBroadcastIds.includes(b.id)
    );
  }, [platformBroadcasts, store, dismissedBroadcastIds]);

  const handleDismissBroadcast = (id: string) => {
    setDismissedBroadcastIds((prev) => [...prev, id]);
    try {
      const saved = JSON.parse(localStorage.getItem("shopper_dismissed_broadcasts") || "[]");
      localStorage.setItem("shopper_dismissed_broadcasts", JSON.stringify([...saved, id]));
    } catch {}
  };

  const currentPlan = useMemo(() => {
    return PLATFORM_PLANS[store?.planId || "free"];
  }, [store?.planId]);

  const productQuota = useMemo(() => {
    if (!store) return { allowed: true, limit: 10, remaining: 10 };
    return canAddProduct(store.products.length, store.planId);
  }, [store]);

  // uploaded themes arrive from the platform after the first render, so the list follows them
  const platformThemes = storeService.getPlatformThemes();
  const allThemes = useMemo(() => getAllThemes(), [platformThemes]);

  const ownerName = useMemo(() => {
    if (store?.ownerName) return store.ownerName;
    if (user?.displayName) return user.displayName;
    if (user?.email) {
      const prefix = user.email.split("@")[0];
      return prefix.charAt(0).toUpperCase() + prefix.slice(1);
    }
    return "Store Owner";
  }, [store?.ownerName, user]);

  const ownerInitials = useMemo(() => {
    return ownerName.slice(0, 2).toUpperCase();
  }, [ownerName]);

  const greetingTime = useMemo(() => {
    const hr = new Date().getHours();
    if (hr < 12) return "Good morning";
    if (hr < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  const unfulfilledOrders = useMemo(() => {
    if (!store?.orders) return [];
    return store.orders.filter((o) => o.fulfilmentStatus === "placed");
  }, [store?.orders]);

  // Real numbers from the store's own orders (no placeholder figures)
  const analyticsData = useMemo(() => computeSalesAnalytics(store?.orders || [], timeRange), [store?.orders, timeRange]);

  const handleCreateDiscount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!store) return;
    if (!dCode.trim() || !dValue) {
      alert("Please provide both a coupon code and discount value.");
      return;
    }

    const cleanCode = dCode.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");
    const val = parseFloat(dValue);
    const minVal = dMinOrder ? Math.round(parseFloat(dMinOrder) * 100) : 0;
    const maxDiscountVal = dMaxDiscount ? Math.round(parseFloat(dMaxDiscount) * 100) : undefined;

    const res = storeService.addDiscount(store.subdomain, {
      code: cleanCode,
      type: dType,
      value: dType === "percentage" ? Math.min(100, Math.max(1, val)) : Math.round(val * 100),
      minOrderValue: minVal,
      maxDiscount: maxDiscountVal,
      isActive: dIsActive,
    });

    if (!res) {
      alert("Failed to create discount code.");
      return;
    }

    refreshStore();
    setIsDiscountModalOpen(false);
    setDCode("");
    setDValue("");
    setDMinOrder("");
    setDMaxDiscount("");
  };

  const handleToggleDiscount = (discountId: string) => {
    if (!store) return;
    storeService.toggleDiscount(store.subdomain, discountId);
    refreshStore();
  };

  const handleDeleteDiscount = (discountId: string, code: string) => {
    if (!store) return;
    if (confirm(`Are you sure you want to delete promo code "${code}"?`)) {
      storeService.deleteDiscount(store.subdomain, discountId);
      refreshStore();
    }
  };

  // Handle Product Save
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!store) return;

    const pricePaise = Math.round(parseFloat(pPrice || "0") * 100);
    const comparePricePaise = pComparePrice ? Math.round(parseFloat(pComparePrice) * 100) : undefined;
    const stockNum = parseInt(pStock || "0", 10);

    if (editingProductId) {
      storeService.updateProduct(store.subdomain, editingProductId, {
        title: pTitle,
        category: pCategory,
        price: pricePaise,
        compareAtPrice: comparePricePaise,
        stock: stockNum,
        description: pDesc,
        images: pImageUrl ? [pImageUrl] : undefined,
      });
    } else {
      const res = storeService.addProduct(store.subdomain, {
        title: pTitle,
        slug: pTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        description: pDesc,
        price: pricePaise,
        compareAtPrice: comparePricePaise,
        stock: stockNum,
        category: pCategory || "General",
        images: [
          pImageUrl ||
            "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80",
        ],
        status: "published",
        rating: 5.0,
        reviewCount: 0,
      });

      if (!res.success) {
        alert(res.error);
        setActiveTab("billing");
        return;
      }
    }

    refreshStore();
    setIsProductModalOpen(false);
    resetProductForm();
  };

  const resetProductForm = () => {
    setEditingProductId(null);
    setPTitle("");
    setPCategory("");
    setPPrice("");
    setPComparePrice("");
    setPStock("10");
    setPDesc("");
    setPImageUrl("");
  };

  const openEditProduct = (prod: ProductData) => {
    setEditingProductId(prod.id);
    setPTitle(prod.title);
    setPCategory(prod.category);
    setPPrice((prod.price / 100).toString());
    setPComparePrice(prod.compareAtPrice ? (prod.compareAtPrice / 100).toString() : "");
    setPStock(prod.stock.toString());
    setPDesc(prod.description);
    setPImageUrl(prod.images[0] || "");
    setIsProductModalOpen(true);
  };

  const resetCategoryForm = () => {
    setEditingCategoryId(null);
    setCName("");
    setCSlug("");
    setCDesc("");
    setCImageUrl("");
    setCIsActive(true);
    setCIsParent(false);
    setCParentId("");
    setCSubtitle("");
    setCCtaText("");
    setCSelectedChildren([]);
  };

  const openAddCategory = () => {
    resetCategoryForm();
    setCIsParent(false);
    setCategoryViewTab("categories");
    setIsCategoryModalOpen(true);
  };

  const openAddParentCollection = () => {
    resetCategoryForm();
    setCIsParent(true);
    setCSubtitle("Modern fits for everyday style.");
    setCCtaText("Shop Collection");
    setCategoryViewTab("collections");
    setIsCategoryModalOpen(true);
  };

  const openEditCategory = (cat: CategoryData) => {
    setEditingCategoryId(cat.id);
    setCName(cat.name);
    setCSlug(cat.slug);
    setCDesc(cat.description || "");
    setCImageUrl(cat.imageUrl || "");
    setCIsActive(cat.isActive ?? true);
    setCIsParent(cat.isParent ?? false);
    setCParentId(cat.parentId || "");
    setCSubtitle(cat.subtitle || "");
    setCCtaText(cat.ctaText || "");
    if (cat.isParent) {
      const assigned = (store?.categories || [])
        .filter((c) => !c.isParent && c.parentId === cat.id)
        .map((c) => c.id);
      setCSelectedChildren(assigned);
    } else {
      setCSelectedChildren([]);
    }
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!store || !cName.trim()) return;

    const finalSlug = (cSlug.trim() || cName.trim())
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    let targetCatId = editingCategoryId;

    if (editingCategoryId) {
      storeService.updateCategory(store.subdomain, editingCategoryId, {
        name: cName.trim(),
        slug: finalSlug,
        description: cDesc.trim(),
        imageUrl: cImageUrl.trim(),
        isActive: cIsActive,
        isParent: cIsParent,
        parentId: cIsParent ? undefined : (cParentId || undefined),
        subtitle: cSubtitle.trim() || undefined,
        ctaText: cCtaText.trim() || undefined,
      });
    } else {
      const newCat = storeService.addCategory(store.subdomain, {
        name: cName.trim(),
        slug: finalSlug,
        description: cDesc.trim(),
        imageUrl: cImageUrl.trim(),
        isActive: cIsActive,
        isParent: cIsParent,
        parentId: cIsParent ? undefined : (cParentId || undefined),
        subtitle: cSubtitle.trim() || undefined,
        ctaText: cCtaText.trim() || undefined,
      });
      if (newCat?.category) targetCatId = newCat.category.id;
    }

    // If this category is a Parent Collection Card, sync its child categories!
    if (cIsParent && targetCatId && store.categories) {
      store.categories.forEach((cat) => {
        if (cat.isParent) return;
        const shouldBeChild = cSelectedChildren.includes(cat.id);
        if (shouldBeChild && cat.parentId !== targetCatId) {
          storeService.updateCategory(store.subdomain, cat.id, { parentId: targetCatId });
        } else if (!shouldBeChild && cat.parentId === targetCatId) {
          storeService.updateCategory(store.subdomain, cat.id, { parentId: undefined });
        }
      });
    }

    refreshStore();
    setIsCategoryModalOpen(false);
    resetCategoryForm();
  };

  const handleDeleteCategory = (catId: string, catName: string) => {
    if (!store) return;
    if (confirm(`Are you sure you want to delete category "${catName}"?`)) {
      storeService.deleteCategory(store.subdomain, catId);
      refreshStore();
    }
  };

  const handleMoveCategory = (index: number, direction: "up" | "down") => {
    if (!store || !store.categories) return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= store.categories.length) return;

    const reordered = [...store.categories];
    const temp = reordered[index];
    reordered[index] = reordered[targetIndex];
    reordered[targetIndex] = temp;

    storeService.reorderCategories(store.subdomain, reordered.map((c) => c.id));
    refreshStore();
  };

  const handleToggleCategoryActive = (cat: CategoryData) => {
    if (!store) return;
    storeService.updateCategory(store.subdomain, cat.id, {
      isActive: !cat.isActive,
    });
    refreshStore();
  };

  const handleSaveBrandLogo = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!store) return;
    storeService.updateStore(store.subdomain, {
      logoUrl: logoUrlInput.trim() || undefined,
    });
    setLogoSavedToast(true);
    refreshStore();
    setTimeout(() => setLogoSavedToast(false), 2500);
  };

  const handleUpgradePlan = (planId: "starter" | "pro") => {
    openSubscriptionModal(planId);
  };

  const handleActivateTheme = (themeSlug: string) => {
    if (!store) return;
    const res = storeService.setStoreTheme(store.subdomain, themeSlug);
    if (!res.success) {
      alert(res.error);
      setActiveTab("billing");
      return;
    }
    const themeName = getTheme(themeSlug).name;
    setThemeAppliedToast(themeName);
    refreshStore();
    setTimeout(() => setThemeAppliedToast(null), 3500);
  };

  const handleUpdateOrderStatus = (
    orderId: string,
    status: OrderData["fulfilmentStatus"]
  ) => {
    if (!store) return;
    storeService.updateOrderStatus(store.subdomain, orderId, {
      fulfilmentStatus: status,
      courierName: courierNameInput || undefined,
      trackingNumber: trackingNumberInput || undefined,
      trackingUrl: courierNameInput ? "https://www.delhivery.com/track" : undefined,
    });
    refreshStore();
    if (selectedOrder && selectedOrder.id === orderId) {
      const updated = storeService.getStore(store.subdomain)?.orders.find((o) => o.id === orderId);
      if (updated) setSelectedOrder(updated);
    }
  };

  const handleVerifyPayment = (orderId: string) => {
    if (!store) return;
    storeService.updateOrderStatus(store.subdomain, orderId, {
      paymentStatus: "paid",
    });
    refreshStore();
    if (selectedOrder && selectedOrder.id === orderId) {
      const updated = storeService.getStore(store.subdomain)?.orders.find((o) => o.id === orderId);
      if (updated) setSelectedOrder(updated);
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!store) return;

    storeService.updateStore(store.subdomain, {
      announcementText: announcementInput,
      upiId: upiIdInput,
      codEnabled: codEnabledInput,
      codFee: Math.round(parseFloat(codFeeInput || "0") * 100),
    });
    alert("Settings saved successfully.");
    refreshStore();
  };

  const handleSaveGmailConfig = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!store) return;
    storeService.updatePluginsConfig(store.subdomain, {
      gmailIntegration: {
        isConnected: gmailConnected,
        connectedEmail: gmailEmailInput,
        autoSendNewDropAlerts: gmailAutoAlerts,
        campaignsSentCount: store.pluginsConfig?.gmailIntegration?.campaignsSentCount || 0,
        lastCampaignSentAt: store.pluginsConfig?.gmailIntegration?.lastCampaignSentAt,
      },
    });
    setGmailSaveToast(true);
    refreshStore();
    setTimeout(() => setGmailSaveToast(false), 2500);
  };

  const handleSendTestEmail = () => {
    setTestEmailToast(true);
    setTimeout(() => setTestEmailToast(false), 3000);
  };

  const handleSendDropAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!store) return;
    if (!dropSubject.trim() || !dropMessage.trim()) {
      alert("Please enter both an email subject and a drop announcement message.");
      return;
    }

    setDropSending(true);
    setTimeout(() => {
      storeService.sendDropAnnouncement(store.subdomain, {
        subject: dropSubject.trim(),
        message: dropMessage.trim(),
        collectionName: dropCollection.trim() || "New Collection Drop",
      });
      setDropSending(false);
      setDropSentSuccess(true);
      setDropSubject("");
      setDropCollection("");
      setDropMessage("");
      refreshStore();
      setTimeout(() => setDropSentSuccess(false), 5000);
    }, 600);
  };

  const handleRemoveSubscriber = (emailToRemove: string) => {
    if (!store) return;
    const currentList = store.subscribers || [];
    const updated = currentList.filter((s) => s.email !== emailToRemove);
    storeService.updateStore(store.subdomain, {
      subscribers: updated,
    });
    refreshStore();
  };

  // Categories and Products search for Banner redirect
  const availableCategories = useMemo(() => {
    if (!store) return [];
    const fromProducts = Array.from(new Set(store.products.map((p) => p.category).filter(Boolean)));
    const defaults = ["T-Shirts", "Shirts", "Hoodies", "Jeans", "Jackets", "Dresses", "Co-ords", "Activewear", "Footwear", "Accessories"];
    return Array.from(new Set([...fromProducts, ...defaults]));
  }, [store]);

  const filteredCategories = useMemo(() => {
    if (!bSearchQuery.trim()) return availableCategories;
    const q = bSearchQuery.toLowerCase();
    return availableCategories.filter((c) => c.toLowerCase().includes(q));
  }, [availableCategories, bSearchQuery]);

  const filteredProducts = useMemo(() => {
    if (!store) return [];
    if (!bSearchQuery.trim()) return store.products;
    const q = bSearchQuery.toLowerCase();
    return store.products.filter(
      (p) => p.title.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
    );
  }, [store, bSearchQuery]);

  const handleSaveBanner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!store || !bImageUrl.trim()) {
      alert("Please upload or provide a banner image URL.");
      return;
    }

    if (!bTargetType) {
      alert("Please select whether this banner redirects to a Category or a Product.");
      return;
    }

    if (bTargetType === "category" && !bSelectedCategory) {
      alert("Please select which category this banner redirects to.");
      return;
    }

    if (bTargetType === "product" && !bSelectedProduct) {
      alert("Please select which product this banner redirects to.");
      return;
    }

    const ctaLink =
      bTargetType === "category"
        ? `/s/${store.subdomain}?category=${encodeURIComponent(bSelectedCategory)}`
        : `/s/${store.subdomain}/products/${bSelectedProduct?.slug}`;

    const newBanner: BannerData = {
      id: `banner-${Date.now().toString(36)}`,
      storeId: store.id,
      title: bTargetType === "category" ? `${bSelectedCategory} Collection` : bSelectedProduct?.title || "Hero Banner",
      imageUrl: bImageUrl.trim(),
      ctaLink,
      targetType: bTargetType,
      targetValue: bTargetType === "category" ? bSelectedCategory : bSelectedProduct?.slug,
      position: store.banners.length,
      isActive: true,
    };

    const bannerQuota = canAddBanner(store.banners.length, store.planId);
    if (!bannerQuota.allowed) {
      alert(`Your plan allows ${bannerQuota.limit} banner${bannerQuota.limit === 1 ? "" : "s"}. Upgrade to add more.`);
      return;
    }

    storeService.saveBanners(store.subdomain, [...store.banners, newBanner]);
    refreshStore();
    setIsBannerModalOpen(false);
    setBImageUrl("");
    setBTargetType("");
    setBSelectedCategory("");
    setBSelectedProduct(null);
    setBSearchQuery("");
  };

  const handleMoveBanner = (index: number, direction: "up" | "down") => {
    if (!store) return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= store.banners.length) return;

    const updated = [...store.banners];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    updated.forEach((b, idx) => {
      b.position = idx;
    });

    storeService.saveBanners(store.subdomain, updated);
    refreshStore();
  };

  const handleToggleBannerActive = (bannerId: string) => {
    if (!store) return;
    const updated = store.banners.map((b) => (b.id === bannerId ? { ...b, isActive: !b.isActive } : b));
    storeService.saveBanners(store.subdomain, updated);
    refreshStore();
  };

  const handleDeleteBanner = (bannerId: string) => {
    if (!store) return;
    const updated = store.banners.filter((b) => b.id !== bannerId);
    storeService.saveBanners(store.subdomain, updated);
    refreshStore();
  };

  // While the session or stores load, or while we're redirecting, show one calm on-brand screen
  if (authLoading) return <DashboardHold text="Opening your dashboard" />;
  if (!user) return <DashboardHold text="Taking you to log in" />;
  if (!store || userStores.length === 0) {
    return <DashboardHold text={storesReady ? "Let's set up your shop" : "Loading your shop"} />;
  }

  const totalRevenue = store.orders.reduce((acc, o) => acc + o.total, 0);
  const deliveredRevenue = store.orders.filter((o) => o.fulfilmentStatus === "delivered").reduce((acc, o) => acc + o.total, 0);
  const totalOrders = store.orders.length;
  const totalProducts = store.products.length;
  const totalCustomers = store.customers?.length || 0;
  const liveStoreUrl = getStoreUrl(store.subdomain);
  // Shown and shared address: storename.shopersite.in once that's live, the working link until then
  const storeWebDomain = getPublicStoreAddress(store.subdomain);
  const storePublicUrl = getPublicStoreUrl(store.subdomain);

  // Sidebar navigation, grouped. `badge` is a count, "dot" (needs attention) or "lock" (paid feature).
  type DashTab = typeof activeTab;
  const navGroups: {
    label: string;
    items: { id: DashTab; label: string; icon: React.ComponentType<{ className?: string }>; badge?: number | "dot" | "lock" | "active" }[];
  }[] = [
    {
      label: "Store",
      items: [
        { id: "overview", label: "Overview", icon: LayoutDashboard },
        { id: "orders", label: "Orders", icon: ShoppingBag, badge: unfulfilledOrders.length > 0 ? "dot" : undefined },
        { id: "products", label: "Products", icon: Package, badge: totalProducts },
        { id: "categories", label: "Categories", icon: FolderTree, badge: store.categories?.length || 0 },
        { id: "customers", label: "Customers", icon: Users },
        { id: "reviews", label: "Reviews", icon: Star, badge: canUseReviews(store.planId) ? undefined : "lock" },
      ],
    },
    {
      label: "Marketing",
      items: [
        { id: "discounts", label: "Discounts", icon: Tag, badge: canUseCoupons(store.planId) ? store.discounts?.length || 0 : "lock" },
        { id: "banners", label: "Banners", icon: ImageIcon },
      ],
    },
    {
      label: "Setup",
      items: [
        { id: "themes", label: "Themes", icon: Palette },
        { id: "billing", label: "Subscription", icon: CreditCard },
        { id: "settings", label: "Settings", icon: Settings },
        { id: "plugins", label: "Plugins", icon: Plug, badge: canUseEmail(store.planId) ? "active" : "lock" },
      ],
    },
  ];

  const pageTitles: Record<DashTab, { title: string; text: string }> = {
    overview: { title: "", text: "" },
    products: { title: "Products", text: "Manage your products, pricing, and stock." },
    categories: { title: "Categories", text: "Organize products into categories and homepage collections." },
    orders: { title: "Orders", text: "Track customer orders and shipments." },
    discounts: { title: "Discounts", text: "Create promo codes and discount coupons." },
    customers: { title: "Customers", text: "View your customers and order history." },
    reviews: { title: "Reviews", text: "Manage customer ratings and reviews." },
    banners: { title: "Banners", text: "Upload storefront hero promotional banners." },
    themes: { title: "Themes", text: "Customize your storefront theme and style." },
    billing: { title: "Subscription", text: "Manage your subscription plan and limits." },
    settings: { title: "Settings", text: "Configure payments, payouts, and store details." },
    plugins: { title: "Plugins", text: "Email alerts and customer notifications." },
    notifications: { title: "Notifications", text: "Orders, stock alerts and updates from your store." },
    profile: { title: "Profile", text: "Your account, store and plan." },
  };

  // Approved / rejected subscription payments, newest first, shown in the bell with the rest
  const planNotices = (store.subscriptionHistory || [])
    .filter((h) => h.status === "verified" || (h.status === "rejected" && h.rejectedAt))
    .slice(0, 5)
    .map((h) => {
      const when = h.status === "verified" ? h.verifiedAt : h.rejectedAt;
      return {
        id: `plan-${h.id}`,
        title: h.status === "verified" ? `${h.planName} plan verified` : "Payment not verified",
        desc:
          h.status === "verified"
            ? `Payment of ${h.amountFormatted} confirmed. All ${h.planName} features are unlocked.`
            : `${h.amountFormatted} for ${h.planName}: ${h.note || "we couldn't confirm it"}. You're still on your current plan.`,
        time: when ? new Date(when).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : "",
        type: "plan",
        unread: h.seenBySeller === false,
      };
    });
  const noticeTime = (iso: string) =>
    new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
  const orderNotices = [...store.orders]
    .filter((o) => Date.now() - new Date(o.createdAt).getTime() < 14 * 24 * 60 * 60 * 1000)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6)
    .map((o) => ({
      id: `order-${o.id}`,
      title: `New order from ${o.customer?.name || "a buyer"}`,
      desc: `${o.items.reduce((n, it) => n + it.quantity, 0)} item(s) · ₹${(o.total / 100).toLocaleString("en-IN")}`,
      short: `New order · ₹${(o.total / 100).toLocaleString("en-IN")}`,
      at: new Date(o.createdAt).getTime(),
      time: noticeTime(o.createdAt),
      type: "order",
    }));
  const stockNotices = store.products
    .filter((p) => p.status !== "draft" && typeof p.stock === "number" && p.stock <= 3)
    .slice(0, 6)
    .map((p) => ({
      id: `stock-${p.id}-${p.stock}`,
      title: p.stock <= 0 ? `${p.title} is out of stock` : `Only ${p.stock} left of ${p.title}`,
      desc: "Restock it so buyers can keep ordering.",
      short: p.stock <= 0 ? `Sold out · ${p.title}` : `Low stock · ${p.title}`,
      time: "",
      type: "stock",
    }));
  const notifications = [
    ...planNotices,
    ...[...orderNotices, ...stockNotices].map((n) => ({ ...n, unread: !readNoticeIds.includes(n.id) })),
  ];
  const hasUnreadNotifications = notifications.some((n) => n.unread);
  const unreadCount = notifications.filter((n) => n.unread).length;
  // Badge on locked features: the cheapest plan that includes it, e.g. "Growth plan"
  const unlockLabel = (feature: "coupons" | "reviews" | "email") => {
    const plan = cheapestPlanWith(feature);
    return plan ? `${plan.name} plan` : "Upgrade";
  };
  // A newly approved or rejected plan payment the seller hasn't seen yet (banner above the dashboard)
  const unseenPlanUpdate = (store.subscriptionHistory || []).find(
    (h) => h.seenBySeller === false && (h.status === "verified" || h.status === "rejected")
  );
  const rememberRead = (ids: string[]) => {
    const next = Array.from(new Set([...readNoticeIds, ...ids])).slice(-200);
    setReadNoticeIds(next);
    try {
      localStorage.setItem(`shopper_read_notices_${store.subdomain}`, JSON.stringify(next));
    } catch {
      // storage unavailable; read state just isn't remembered
    }
  };
  const markAllNotificationsRead = () => {
    rememberRead(notifications.map((n) => n.id));
    storeService.markSubscriptionUpdatesSeen(store.subdomain);
  };
  const openNotification = (n: (typeof notifications)[number]) => {
    rememberRead([n.id]);
    setIsNotificationOpen(false);
    if (n.type === "plan") {
      storeService.markSubscriptionUpdatesSeen(store.subdomain);
      setActiveTab("billing");
      return;
    }
    if (n.type === "order") setActiveTab("orders");
    else if (n.type === "stock") setActiveTab("products");
    else if (n.type === "feature") setActiveTab("discounts");
  };
  const notificationIcon = (type: string) =>
    type === "order"
      ? { icon: ShoppingBag, tone: "bg-emerald-50 text-emerald-600" }
      : type === "stock"
        ? { icon: Package, tone: "bg-amber-50 text-amber-600" }
        : type === "feature"
          ? { icon: Sparkles, tone: "bg-violet-50 text-violet-600" }
          : type === "plan"
            ? { icon: ShieldCheck, tone: "bg-emerald-50 text-emerald-600" }
            : { icon: Bell, tone: "bg-sky-50 text-sky-600" };

  const startAddProduct = () => {
    if (!productQuota.allowed) {
      setActiveTab("billing");
      return;
    }
    resetProductForm();
    setIsProductModalOpen(true);
    setActiveTab("products");
  };
  const copyStoreLink = () => {
    navigator.clipboard.writeText(storePublicUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const activeTheme = getTheme(store.activeThemeSlug);
  const productThumbs = store.products.map((p) => p.images?.[0]).filter(Boolean).slice(0, 4) as string[];
  const reviewAvg = store.reviews.length ? store.reviews.reduce((acc, r) => acc + r.rating, 0) / store.reviews.length : 0;
  const liveBanners = store.banners.filter((b) => b.isActive).length;

  return (
    <div className="dash home-sans min-h-screen w-full bg-[#FAFAFA] md:bg-[#0a0a0a] text-neutral-950">
      {/* Top bar on phones: profile · logo · notifications (desktop has them in the rail) */}
      <header className="md:hidden fixed top-0 inset-x-0 z-40 h-16 bg-white/90 backdrop-blur-md border-b border-neutral-200">
        <div className="h-full px-3 sm:px-5 grid grid-cols-[1fr_auto_1fr] items-center">
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => setActiveTab("profile")}
              aria-label="Your profile"
              className="rounded-full p-0.5 transition-opacity hover:opacity-80"
            >
              <span className="w-8 h-8 rounded-full bg-gradient-to-br from-neutral-800 to-black text-white text-[11px] font-semibold flex items-center justify-center">
                {ownerInitials}
              </span>
            </button>
          </div>

          {/* the logo takes you back to the overview */}
          <button
            type="button"
            aria-label={`${siteConfig.name} overview`}
            onClick={() => {
              setActiveTab("overview");
              setIsNotificationOpen(false);
              scrollDashTop({ top: 0, behavior: "smooth" });
            }}
            className="justify-self-center text-neutral-950 transition-opacity hover:opacity-70"
          >
            <ShopperLogo className="text-[20px]" />
          </button>

          <div className="flex items-center justify-end">
            <div ref={notificationRef} className="relative">
              <button
                type="button"
                onClick={() => setIsNotificationOpen((o) => !o)}
                aria-label="Notifications"
                aria-expanded={isNotificationOpen}
                className={`relative w-10 h-10 rounded-[10px] flex items-center justify-center transition-colors ${
                  isNotificationOpen ? "bg-neutral-100 text-black" : "text-neutral-700 hover:bg-neutral-100 hover:text-black"
                }`}
              >
                <Bell className="w-[18px] h-[18px]" />
                {hasUnreadNotifications && (
                  <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[#ef4444] ring-2 ring-white" />
                )}
              </button>

              {isNotificationOpen && (
                <>
                  <div className="absolute right-0 top-12 z-50 w-[340px] max-w-[calc(100vw-24px)] rounded-[16px] bg-white border border-neutral-200 shadow-[0_24px_60px_-16px_rgba(0,0,0,0.28)] overflow-hidden animate-in zoom-in-95 origin-top-right">
                    <div className="flex items-center justify-between px-4 pt-3.5 pb-2">
                      <span className="flex items-center gap-2 text-sm font-semibold">
                        Notifications
                        {unreadCount > 0 && (
                          <span className="rounded-full bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700">{unreadCount} new</span>
                        )}
                      </span>
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={markAllNotificationsRead}
                          style={{ minHeight: 0 }}
                          className="text-[11px] font-medium text-neutral-500 hover:text-black transition-colors"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>

                    <div className="px-1.5">
                      {notifications.slice(0, 4).map((n) => {
                        const { icon: Icon, tone } = notificationIcon(n.type);
                        return (
                          <button
                            key={n.id}
                            type="button"
                            onClick={() => openNotification(n)}
                            className="w-full flex items-start gap-3 rounded-[10px] px-2.5 py-2.5 text-left hover:bg-neutral-50 transition-colors"
                          >
                            <span className={`w-8 h-8 rounded-[9px] flex items-center justify-center shrink-0 ${tone}`}>
                              <Icon className="w-4 h-4" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className={`block text-[13px] truncate ${n.unread ? "font-semibold text-neutral-950" : "font-medium text-neutral-600"}`}>{n.title}</span>
                              <span className="block text-[11px] text-neutral-500 truncate">{n.desc}</span>
                              <span className="block mt-0.5 text-[10px] text-neutral-400">{n.time}</span>
                            </span>
                            {n.unread && <span className="mt-1.5 w-2 h-2 rounded-full bg-indigo-500 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setIsNotificationOpen(false);
                        setActiveTab("notifications");
                      }}
                      className="mt-1 w-full flex items-center justify-center gap-1.5 border-t border-neutral-100 py-3 text-[13px] font-semibold hover:bg-neutral-50 transition-colors"
                    >
                      View all notifications
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar navigation — fixed to the viewport on desktop (phones use the bottom bar) */}
      <SidebarRail
        store={store}
        stores={userStores}
        onSwitchStore={(sub) => {
          setActiveSubdomain(sub);
          router.push(`/dashboard?store=${sub}`);
        }}
        groups={navGroups}
        active={activeTab}
        onSelect={setActiveTab}
        onHome={() => {
          setActiveTab("overview");
          scrollDashTop({ top: 0, behavior: "smooth" });
        }}
        hasUnread={hasUnreadNotifications}
        onNotifications={() => setActiveTab("notifications")}
        notificationsActive={activeTab === "notifications"}
        onProfile={() => setActiveTab("profile")}
        productsUsed={totalProducts}
        productsMax={currentPlan.maxProducts}
        ownerName={ownerName}
        ownerInitials={ownerInitials}
        email={user?.email}
        onSignOut={async () => {
          await signOut();
          router.push("/login");
        }}
        onUpgrade={() => setActiveTab("billing")}
      />

      {/* Main Content Area: under the top bar on phones; on desktop a rounded panel beside the black rail */}
      <div className="pt-16 md:pt-3 md:pb-3 md:pl-[var(--dash-rail,var(--rail))] md:pr-3 md:transition-[padding-left] md:duration-500 md:ease-[cubic-bezier(0.22,1,0.36,1)] flex flex-col min-h-screen md:h-screen md:min-h-0 overflow-x-clip" style={{ "--rail": `${RAIL_WIDTH}px` } as React.CSSProperties}>
        <div id="dash-scroll" className="flex-1 flex flex-col md:min-h-0 md:overflow-y-auto md:overscroll-contain md:rounded-[28px] md:bg-[#FAFAFA] dash-panel-scroll">
        {/* Main Workspace Area (Scrolls smoothly under the fixed top header) */}
        <main className="flex-1 min-w-0 p-4 sm:p-8 pb-28 md:pb-12 max-w-7xl w-full mx-auto">
          {unseenPlanUpdate && (
            <div
              className={`mb-5 flex items-start gap-3 rounded-2xl p-4 ${
                unseenPlanUpdate.status === "verified" ? "bg-neutral-950 text-white" : "border border-red-200 bg-red-50 text-red-900"
              }`}
            >
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  unseenPlanUpdate.status === "verified" ? "bg-emerald-500 text-white" : "bg-red-100 text-red-600"
                }`}
              >
                {unseenPlanUpdate.status === "verified" ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">
                  {unseenPlanUpdate.status === "verified"
                    ? `Payment verified. You're on ${unseenPlanUpdate.planName} now.`
                    : `Your ${unseenPlanUpdate.planName} payment couldn't be verified`}
                </p>
                <p className={`mt-0.5 text-xs ${unseenPlanUpdate.status === "verified" ? "text-white/60" : "text-red-700"}`}>
                  {unseenPlanUpdate.status === "verified"
                    ? `All ${unseenPlanUpdate.planName} features are unlocked.`
                    : `${unseenPlanUpdate.note || ""} You're still on your current plan.`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => storeService.markSubscriptionUpdatesSeen(store.subdomain)}
                className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold ${
                  unseenPlanUpdate.status === "verified" ? "bg-white text-neutral-950" : "bg-red-600 text-white"
                }`}
                style={{ minHeight: 0 }}
              >
                Got it
              </button>
            </div>
          )}

          {/* Each section slides in when you switch to it (key re-mounts the wrapper per section) */}
          <div key={activeTab} className="tab-enter">
          {/* Page title (overview greets you inside the hero card) */}
          {activeTab !== "overview" && (
            <div className="mb-5 sm:mb-8 hero-rise flex items-center sm:items-start gap-3 sm:gap-4">
              <button
                type="button"
                onClick={goBackTab}
                aria-label="Back"
                className="group sm:mt-1 w-10 h-10 shrink-0 rounded-[12px] border border-neutral-200 bg-white flex items-center justify-center text-neutral-700 hover:border-neutral-900 hover:text-black transition-colors"
              >
                <ArrowLeft className="w-[18px] h-[18px] transition-transform duration-300 group-hover:-translate-x-0.5" />
              </button>
              <div className="min-w-0">
                <h1 className="truncate text-[1.6rem] sm:text-[1.9rem] font-semibold tracking-tight leading-tight">{pageTitles[activeTab].title}</h1>
                <p className="hidden sm:block mt-1 text-sm text-neutral-500">{pageTitles[activeTab].text}</p>
              </div>
            </div>
          )}

          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-6 animate-enter-blur">
              {/* Row 1 — greeting + featured revenue tile and three stat tiles */}
              <div className="hero-rise flex items-end justify-between gap-4">
                <div className="min-w-0">
                  <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                    {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" })}
                  </span>
                  <h1 className="mt-1 text-[1.6rem] sm:text-[1.9rem] font-semibold tracking-tight leading-tight">
                    {greetingTime}, {ownerName.split(" ")[0]}
                  </h1>
                </div>
                <a
                  href={liveStoreUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="hidden sm:inline-flex shrink-0 items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:border-neutral-400 transition-colors"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {storeWebDomain}
                </a>
              </div>

              <section
                style={{ animationDelay: "100ms" }}
                className="hero-rise grid grid-cols-3 lg:grid-cols-[1.5fr_1fr_1fr_1fr] gap-3"
              >
                {/* Revenue — featured tile */}
                <div className="group col-span-3 lg:col-span-1 relative overflow-hidden rounded-2xl bg-neutral-950 text-white px-5 py-5 sm:px-6 transition-transform duration-300 hover:-translate-y-0.5">
                  <IndianRupee
                    aria-hidden
                    className="absolute -right-6 -bottom-8 w-40 h-40 text-white/[0.06] transition-transform duration-700 group-hover:-rotate-12 group-hover:scale-110"
                  />
                  <span aria-hidden className="absolute -top-16 -left-10 w-40 h-40 rounded-full bg-emerald-400/20 blur-3xl" />
                  <span className="relative flex items-center justify-between">
                    <span className="text-xs font-medium text-white/60">Revenue · {analyticsData.label.toLowerCase()}</span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        analyticsData.isPositive ? "bg-emerald-400/15 text-emerald-300" : "bg-rose-400/15 text-rose-300"
                      }`}
                    >
                      {analyticsData.isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {analyticsData.deltaPercent}
                    </span>
                  </span>
                  <span className="relative mt-3 block text-[2.2rem] sm:text-[2.5rem] font-semibold tracking-tight tabular-nums leading-none">
                    <CountUp from={0} to={Math.round(analyticsData.revenue / 100)} prefix="₹" />
                  </span>
                  <span className="relative mt-2 block text-[11px] text-white/45">{analyticsData.periodText}</span>
                </div>

                {[
                  {
                    label: "Orders",
                    icon: ShoppingBag,
                    tab: "orders" as const,
                    value: <CountUp from={0} to={Number(analyticsData.ordersCount) || 0} />,
                    pill: analyticsData.ordersDelta,
                    tone: { chip: "bg-indigo-50 text-indigo-600", pill: "bg-indigo-50 text-indigo-700", line: "bg-indigo-500" },
                  },
                  {
                    label: "Avg. order",
                    icon: ShoppingCart,
                    value: `₹${Math.round(analyticsData.avgOrderValue / 100).toLocaleString("en-IN")}`,
                    pill: `${analyticsData.buyers} ${analyticsData.buyers === 1 ? "buyer" : "buyers"}`,
                    tone: { chip: "bg-amber-50 text-amber-600", pill: "bg-amber-50 text-amber-700", line: "bg-amber-500" },
                  },
                  {
                    label: "Products",
                    icon: Package,
                    tab: "products" as const,
                    value: <CountUp from={0} to={totalProducts} />,
                    pill: currentPlan.maxProducts >= 9999 ? "∞" : `${Math.max(0, currentPlan.maxProducts - totalProducts)} left`,
                    tone: { chip: "bg-violet-50 text-violet-600", pill: "bg-violet-50 text-violet-700", line: "bg-violet-500" },
                  },
                ].map((m) => (
                  <button
                    key={m.label}
                    type="button"
                    onClick={() => m.tab && setActiveTab(m.tab)}
                    className={`group relative overflow-hidden rounded-2xl bg-white border border-neutral-200 text-left p-3.5 sm:px-5 sm:py-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_36px_-22px_rgba(0,0,0,0.3)] ${
                      m.tab ? "cursor-pointer" : "cursor-default"
                    }`}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className={`w-8 h-8 rounded-[10px] flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6 ${m.tone.chip}`}>
                        <m.icon className="w-4 h-4" />
                      </span>
                      <span className={`hidden sm:inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${m.tone.pill}`}>{m.pill}</span>
                    </span>
                    <span className="mt-3 block text-[1.4rem] sm:text-[1.75rem] font-semibold tracking-tight tabular-nums leading-none">{m.value}</span>
                    <span className="mt-1.5 block text-[11px] text-neutral-500 truncate">{m.label}</span>
                    {/* accent line that grows on hover */}
                    <span className={`absolute left-0 bottom-0 h-[3px] w-full origin-left scale-x-[0.18] group-hover:scale-x-100 transition-transform duration-500 ${m.tone.line}`} />
                  </button>
                ))}
              </section>

              {/* Row 2 — main column + side column */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {/* Main column */}
                <div style={{ animationDelay: "320ms" }} className="hero-rise lg:col-span-2 space-y-6">
                  {/* Sales chart */}
                  <div className="rounded-2xl bg-white border border-neutral-200">
                    {/* Shop on/off */}
                    <div className={`m-2 rounded-xl p-3.5 sm:p-4 transition-colors ${store.isClosed ? "bg-neutral-950 text-white" : "bg-neutral-50"}`}>
                      <div className="flex items-center gap-3">
                        <span className="relative flex h-2.5 w-2.5 shrink-0">
                          {!store.isClosed && <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400 opacity-60" />}
                          <span className={`relative h-2.5 w-2.5 rounded-full ${store.isClosed ? "bg-neutral-500" : "bg-emerald-500"}`} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold">{store.isClosed ? "Shop is closed" : "Shop is open"}</p>
                          <p className={`truncate text-xs ${store.isClosed ? "text-white/60" : "text-neutral-500"}`}>
                            {store.isClosed ? "Buyers see an unavailable notice and can't order" : "Buyers can browse and place orders"}
                          </p>
                        </div>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={!store.isClosed}
                          aria-label={store.isClosed ? "Open the shop" : "Close the shop"}
                          onClick={toggleShopOpen}
                          className={`relative h-7 w-12 shrink-0 rounded-full transition-colors !min-h-0 ${store.isClosed ? "bg-white/20" : "bg-emerald-500"}`}
                        >
                          <span
                            className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform duration-300 ${store.isClosed ? "translate-x-0" : "translate-x-5"}`}
                          />
                        </button>
                      </div>
                      <label className="mt-3 block">
                        <span className="sr-only">Message buyers see while the shop is closed</span>
                        <input
                          value={closedMsgDraft}
                          onChange={(e) => setClosedMsgDraft(e.target.value)}
                          onBlur={saveClosedMessage}
                          onKeyDown={(e) => e.key === "Enter" && (e.currentTarget as HTMLInputElement).blur()}
                          maxLength={160}
                          placeholder="Message for buyers while closed (e.g. Back on Monday!)"
                          className={`h-10 w-full rounded-[10px] border px-3 text-sm outline-none transition-colors ${
                            store.isClosed
                              ? "border-white/15 bg-white/10 text-white placeholder:text-white/40 focus:border-white/50"
                              : "border-neutral-200 bg-white placeholder:text-neutral-400 focus:border-neutral-900"
                          }`}
                        />
                      </label>
                    </div>
                    <div className="px-5 sm:px-6 pt-3 sm:pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h2 className="text-sm font-semibold">Sales</h2>
                        <p className="text-xs text-neutral-500 mt-0.5">Revenue {analyticsData.periodText}</p>
                      </div>
                      <div className="inline-flex items-center p-0.5 rounded-[10px] border border-neutral-200 shrink-0 self-start sm:self-auto">
                        {(["today", "yesterday", "7d", "30d"] as const).map((range) => {
                          const isActive = timeRange === range;
                          const labels: Record<string, string> = { today: "Today", yesterday: "Yesterday", "7d": "7D", "30d": "30D" };
                          return (
                            <button
                              key={range}
                              onClick={() => setTimeRange(range)}
                              className={`px-3 h-7 rounded-[8px] text-xs font-medium transition-colors ${
                                isActive ? "bg-black text-white" : "text-neutral-500 hover:text-neutral-950 hover:bg-neutral-100"
                              }`}
                            >
                              {labels[range]}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="px-5 sm:px-6 pt-6 pb-5">
                      <div className="flex items-stretch gap-3">
                        <div className="flex flex-col justify-between text-[11px] text-neutral-400 select-none pb-6 text-right w-10 shrink-0 tabular-nums">
                          {analyticsData.yLabels.map((l, i) => (
                            <span key={i}>{l}</span>
                          ))}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="w-full h-48 sm:h-56 relative">
                            {analyticsData.isEmpty && (
                              <p className="absolute inset-x-0 top-1/3 text-center text-xs font-medium text-neutral-400">
                                No sales {analyticsData.label.toLowerCase()} yet
                              </p>
                            )}
                            <svg className="w-full h-full overflow-visible" viewBox="0 0 500 120" preserveAspectRatio="none">
                              <defs>
                                <linearGradient id="performanceAreaGrad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#6366F1" stopOpacity="0.22" />
                                  <stop offset="100%" stopColor="#6366F1" stopOpacity="0" />
                                </linearGradient>
                                <linearGradient id="performanceLineGrad" x1="0" y1="0" x2="1" y2="0">
                                  <stop offset="0%" stopColor="#6366F1" />
                                  <stop offset="100%" stopColor="#A855F7" />
                                </linearGradient>
                              </defs>
                              <line x1="0" y1="10" x2="500" y2="10" stroke="#EDEDED" strokeWidth="1" strokeDasharray="3 4" vectorEffect="non-scaling-stroke" />
                              <line x1="0" y1="45" x2="500" y2="45" stroke="#EDEDED" strokeWidth="1" strokeDasharray="3 4" vectorEffect="non-scaling-stroke" />
                              <line x1="0" y1="80" x2="500" y2="80" stroke="#EDEDED" strokeWidth="1" strokeDasharray="3 4" vectorEffect="non-scaling-stroke" />
                              <line x1="0" y1="115" x2="500" y2="115" stroke="#E5E5E5" strokeWidth="1" vectorEffect="non-scaling-stroke" />
                              {/* keyed by range so the line redraws when you switch */}
                              <path key={`area-${timeRange}`} className="chart-fade" d={analyticsData.areaPath} fill="url(#performanceAreaGrad)" />
                              <path
                                key={`line-${timeRange}`}
                                className="chart-draw"
                                pathLength={1}
                                d={analyticsData.linePath}
                                fill="none"
                                stroke="url(#performanceLineGrad)"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                            {/* Dots are HTML, not SVG: the chart stretches to fit, which would squash SVG circles into ovals */}
                            <div aria-hidden className="pointer-events-none absolute inset-0">
                              {analyticsData.chartPoints.map((pt, idx) => (
                                <span
                                  key={`${timeRange}-${idx}`}
                                  className="chart-pop absolute -ml-[4px] -mt-[4px] h-2 w-2 rounded-full border-[1.5px] border-[#6366F1] bg-white"
                                  style={{ left: `${(pt.x / 500) * 100}%`, top: `${(pt.y / 120) * 100}%`, animationDelay: `${700 + idx * 70}ms` }}
                                />
                              ))}
                              <span
                                key={`last-${timeRange}`}
                                className="chart-pop absolute -ml-[5px] -mt-[5px] h-2.5 w-2.5 rounded-full bg-[#A855F7] ring-2 ring-white"
                                style={{
                                  left: `${(analyticsData.lastPoint.x / 500) * 100}%`,
                                  top: `${(analyticsData.lastPoint.y / 120) * 100}%`,
                                  animationDelay: `${700 + analyticsData.chartPoints.length * 70}ms`,
                                }}
                              />
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-2 border-t border-neutral-200 tabular-nums">
                            {analyticsData.xLabels.map((lbl, idx) => (
                              <span key={idx}>{lbl}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* More metrics */}
                    <div className="border-t border-neutral-200 px-5 sm:px-6 py-3.5">
                      <button
                        onClick={() => setIsAllMetricsExpanded(!isAllMetricsExpanded)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-neutral-700 hover:text-black transition-colors"
                      >
                        {isAllMetricsExpanded ? "Hide metrics" : "All metrics"}
                        {isAllMetricsExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      {isAllMetricsExpanded && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
                          {[
                            { label: "Items sold", value: analyticsData.itemsSold.toLocaleString("en-IN"), note: analyticsData.label },
                            { label: "Buyers", value: analyticsData.buyers.toLocaleString("en-IN"), note: analyticsData.label },
                            { label: "Avg. order value", value: `₹${Math.round(analyticsData.avgOrderValue / 100).toLocaleString("en-IN")}`, note: analyticsData.label },
                            { label: "Repeat buyers", value: `${analyticsData.repeatBuyerRate}%`, note: "Ordered more than once" },
                            { label: "Orders change", value: analyticsData.ordersDelta, note: analyticsData.periodText },
                            { label: "Delivered revenue", value: `₹${(deliveredRevenue / 100).toLocaleString("en-IN")}`, note: "All time" },
                          ].map((m) => (
                            <div key={m.label} className="p-3.5 rounded-[10px] border border-neutral-200">
                              <span className="text-[11px] text-neutral-500 block">{m.label}</span>
                              <span className="text-base font-semibold mt-1 block tabular-nums">{m.value}</span>
                              <span className="text-[11px] text-neutral-400 mt-0.5 block">{m.note}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Orders to fulfil */}
                  <div className="rounded-2xl bg-white border border-neutral-200 p-5 sm:p-6">
                    {unfulfilledOrders.length > 0 ? (
                      <div>
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div>
                            <h2 className="text-sm font-semibold">
                              {unfulfilledOrders.length} order{unfulfilledOrders.length > 1 ? "s" : ""} to fulfil
                            </h2>
                            <p className="text-xs text-neutral-500 mt-0.5">Add tracking and ship to keep customers updated.</p>
                          </div>
                          <button
                            onClick={() => setActiveTab("orders")}
                            className="h-8 px-3 rounded-[8px] border border-neutral-200 text-xs font-semibold hover:border-black transition-colors shrink-0"
                          >
                            View all
                          </button>
                        </div>
                        <div className="divide-y divide-neutral-200">
                          {unfulfilledOrders.slice(0, 4).map((order) => (
                            <div key={order.id} className="py-3.5 flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-sm font-semibold tabular-nums">{order.number}</span>
                                  <span className="text-sm text-neutral-700 truncate">{order.customer.name}</span>
                                  <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-[6px] border border-neutral-200 text-neutral-600">
                                    {order.paymentMethod === "cashfree" ? "online" : order.paymentMethod}
                                  </span>
                                </div>
                                <p className="text-xs text-neutral-500 mt-0.5">
                                  {order.items.length} item{order.items.length > 1 ? "s" : ""} · ₹{(order.total / 100).toLocaleString("en-IN")} · {order.address.city}
                                </p>
                              </div>
                              <button
                                onClick={() => setSelectedOrder(order)}
                                className="h-8 px-3.5 rounded-[8px] bg-black text-white text-xs font-semibold hover:bg-neutral-800 transition-colors shrink-0"
                              >
                                Fulfil
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-4">
                        <div className="relative w-11 h-11 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                          <Check className="relative w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h2 className="text-sm font-semibold">You&apos;re all caught up</h2>
                          <p className="text-xs text-neutral-500 mt-0.5">No orders waiting to ship. Share your store to bring in the next one.</p>
                        </div>
                        <button
                          onClick={() => setActiveTab("orders")}
                          className="h-8 px-3 rounded-[8px] border border-neutral-200 text-xs font-semibold hover:border-black transition-colors shrink-0"
                        >
                          All orders
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Side column */}
                <div style={{ animationDelay: "420ms" }} className="hero-rise space-y-6">
                  {/* Your store */}
                  <div className="relative overflow-hidden rounded-2xl bg-black text-white p-5">
                    <span aria-hidden className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-indigo-500/40 blur-3xl animate-float-gentle" />
                    <span aria-hidden className="absolute -bottom-20 -left-12 w-44 h-44 rounded-full bg-fuchsia-500/25 blur-3xl animate-float-gentle [animation-delay:1.5s]" />
                    <div className="relative flex items-center justify-between">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/50">Your store</span>
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-white/80">
                        <span className="relative flex w-2 h-2">
                          <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75" />
                          <span className="relative w-2 h-2 rounded-full bg-emerald-400" />
                        </span>
                        Live
                      </span>
                    </div>
                    <p className="relative mt-3 text-lg font-semibold tracking-tight truncate">{store.name}</p>
                    <p className="relative text-xs text-white/60 truncate">{storeWebDomain}</p>
                    <div className="relative mt-4 grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(storePublicUrl);
                          setCopiedLink(true);
                          setTimeout(() => setCopiedLink(false), 2000);
                        }}
                        className="h-9 rounded-[10px] border border-white/20 text-xs font-semibold hover:bg-white/10 inline-flex items-center justify-center gap-1.5 transition-colors"
                      >
                        {copiedLink ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedLink ? "Copied" : "Copy link"}
                      </button>
                      <Link
                        href={liveStoreUrl}
                        target="_blank"
                        className="h-9 rounded-[10px] bg-white text-black text-xs font-semibold hover:bg-neutral-200 inline-flex items-center justify-center gap-1.5 transition-colors"
                      >
                        Open
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>

                  {/* Plan usage */}
                  <div className="rounded-2xl bg-white border border-neutral-200 p-5">
                    <div className="flex items-center justify-between">
                      <h2 className="text-sm font-semibold">Plan</h2>
                      <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-[6px] border border-neutral-200 text-neutral-600">
                        {store.planId}
                      </span>
                    </div>
                    <p className="mt-3 text-xs text-neutral-500">
                      <span className="text-neutral-950 font-semibold tabular-nums">{store.products.length}</span> of{" "}
                      {currentPlan.maxProducts >= 9999 ? "unlimited" : currentPlan.maxProducts} products used
                    </p>
                    <div className="mt-2 w-full h-1.5 rounded-full bg-neutral-100 overflow-hidden">
                      <div
                        className="bar-grow h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                        style={{
                          width: `${Math.min(100, Math.max(4, (store.products.length / (currentPlan.maxProducts >= 9999 ? 100 : currentPlan.maxProducts)) * 100))}%`,
                        }}
                      />
                    </div>
                    <button
                      onClick={() => setActiveTab("billing")}
                      className="mt-4 w-full h-9 rounded-[10px] border border-neutral-300 text-xs font-semibold hover:border-black hover:bg-black hover:text-white inline-flex items-center justify-center gap-1.5 transition-colors"
                    >
                      See plans from ₹499/mo
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Platform banners (uploaded from the admin dashboard) */}
              <div className="hero-rise" style={{ animationDelay: "480ms" }}>
                <AnnouncementBanners onOpenTab={(tab) => setActiveTab(tab as DashTab)} />
              </div>

              {/* Quick actions — bento of six */}
              <section className="hero-rise" style={{ animationDelay: "520ms" }}>
                <h2 className="mb-3 text-sm font-semibold">Quick actions</h2>
                <div className="grid grid-cols-3 grid-rows-[repeat(4,124px)] gap-3">
                  {/* Add product — wide, top */}
                  <button
                    type="button"
                    onClick={startAddProduct}
                    className="group relative overflow-hidden col-span-3 text-left rounded-2xl bg-neutral-950 text-white px-5 sm:px-7 flex items-center justify-between gap-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_48px_-24px_rgba(0,0,0,0.6)]"
                  >
                    <span aria-hidden className="pointer-events-none absolute -left-16 -top-20 w-64 h-64 rounded-full bg-indigo-500/25 blur-3xl transition-opacity duration-500 group-hover:opacity-100 opacity-60" />
                    <span className="relative min-w-0">
                      <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-white/45">Catalogue</span>
                      <span className="mt-1 block text-lg sm:text-xl font-semibold">Add product</span>
                      <span className="hidden sm:block text-xs text-white/55 truncate">
                        {totalProducts} listed · {currentPlan.maxProducts >= 9999 ? "unlimited" : `${Math.max(0, currentPlan.maxProducts - totalProducts)} slots left`}
                      </span>
                    </span>
                    <span className="relative flex items-center shrink-0">
                      <span className="hidden sm:flex -space-x-3 mr-4">
                        {productThumbs.map((src, i) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            key={src + i}
                            src={src}
                            alt=""
                            className="w-12 h-12 rounded-[12px] object-cover ring-2 ring-neutral-950 transition-transform duration-300 group-hover:-translate-y-1"
                            style={{ transitionDelay: `${i * 50}ms` }}
                          />
                        ))}
                      </span>
                      <span className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center transition-transform duration-500 group-hover:rotate-90 group-hover:scale-105">
                        <Plus className="w-5 h-5" />
                      </span>
                    </span>
                  </button>

                  {/* Reviews — small */}
                  <button type="button" onClick={() => setActiveTab("reviews")} className={`group relative overflow-hidden text-left rounded-2xl bg-white border border-neutral-200 transition-all duration-300 hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-[0_20px_44px_-24px_rgba(0,0,0,0.3)] p-3 sm:p-4 flex flex-col justify-between`}>
                    <span className="w-9 h-9 rounded-[10px] bg-amber-50 text-amber-500 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                      <Star className="w-4 h-4 fill-current" />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold">Reviews</span>
                      <span className="hidden sm:block text-[11px] text-neutral-500 truncate">
                        {store.reviews.length ? `${reviewAvg.toFixed(1)} ★ · ${store.reviews.length}` : "None yet"}
                      </span>
                    </span>
                  </button>

                  {/* Categories — wide */}
                  <button type="button" onClick={() => setActiveTab("categories")} className={`group relative overflow-hidden text-left rounded-2xl bg-white border border-neutral-200 transition-all duration-300 hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-[0_20px_44px_-24px_rgba(0,0,0,0.3)] col-span-2 p-4 sm:p-5 flex flex-col justify-between`}>
                    <span className="flex items-center gap-3">
                      <span className="w-9 h-9 rounded-[10px] bg-sky-50 text-sky-600 flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110">
                        <FolderTree className="w-4 h-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold">Categories</span>
                        <span className="hidden sm:block text-[11px] text-neutral-500">{store.categories.length} in your store</span>
                      </span>
                    </span>
                    <span className="flex gap-1.5 overflow-hidden">
                      {store.categories.slice(0, 4).map((c, i) => (
                        <span
                          key={c.id}
                          className={`shrink-0 rounded-full border border-neutral-200 px-2.5 py-1 text-[11px] font-medium text-neutral-600 transition-colors duration-300 group-hover:border-sky-200 group-hover:bg-sky-50 group-hover:text-sky-700 ${i > 0 ? "hidden sm:inline" : ""}`}
                          style={{ transitionDelay: `${i * 40}ms` }}
                        >
                          {c.name}
                        </span>
                      ))}
                      {store.categories.length === 0 && <span className="text-[11px] text-neutral-400">Add your first category</span>}
                    </span>
                  </button>

                  {/* Settings — small */}
                  <button type="button" onClick={() => setActiveTab("settings")} className={`group relative overflow-hidden text-left rounded-2xl bg-white border border-neutral-200 transition-all duration-300 hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-[0_20px_44px_-24px_rgba(0,0,0,0.3)] col-start-1 row-start-3 p-3 sm:p-4 flex flex-col justify-between`}>
                    <span className="w-9 h-9 rounded-[10px] bg-neutral-100 text-neutral-700 flex items-center justify-center">
                      <Settings className="w-4 h-4 transition-transform duration-700 group-hover:rotate-180" />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold">Settings</span>
                      <span className="hidden sm:block text-[11px] text-neutral-500 truncate">Payments &amp; store</span>
                    </span>
                  </button>

                  {/* Themes — big */}
                  <button
                    type="button"
                    onClick={() => setActiveTab("themes")}
                    className={`group relative overflow-hidden text-left rounded-2xl bg-white border border-neutral-200 transition-all duration-300 hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-[0_20px_44px_-24px_rgba(0,0,0,0.3)] col-start-2 col-span-2 row-start-3 row-span-2 p-4 sm:p-5 flex flex-col lg:flex-row gap-4`}
                  >
                    <span className="flex flex-col justify-between lg:w-[42%] shrink-0 min-w-0">
                      <span className="w-9 h-9 rounded-[10px] bg-fuchsia-50 text-fuchsia-600 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                        <Palette className="w-4 h-4" />
                      </span>
                      <span className="hidden lg:block">
                        <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-400">Current theme</span>
                        <span className="mt-1 block text-xl font-semibold tracking-tight">{activeTheme.name}</span>
                        <span className="mt-1 block text-xs text-neutral-500 line-clamp-2">{activeTheme.tagline}</span>
                      </span>
                      <span className="block lg:hidden">
                        <span className="block text-sm font-semibold">Themes</span>
                        <span className="hidden sm:block text-[11px] text-neutral-500 truncate">{activeTheme.name}</span>
                      </span>
                      <span className="hidden lg:inline-flex items-center gap-1.5 text-xs font-semibold">
                        Change theme
                      </span>
                    </span>

                    {/* mini storefront in the theme's own colours */}
                    <span
                      aria-hidden
                      className="relative flex-1 min-h-0 rounded-[12px] border overflow-hidden flex flex-col transition-transform duration-500 group-hover:scale-[1.02]"
                      style={{ background: activeTheme.tokens.background, borderColor: activeTheme.tokens.border, color: activeTheme.tokens.foreground }}
                    >
                      <span className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: activeTheme.tokens.border }}>
                        <span className="text-[10px] font-bold truncate">{store.name}</span>
                        <span className="flex gap-1">
                          <span className="w-4 h-1 rounded-full opacity-40" style={{ background: activeTheme.tokens.foreground }} />
                          <span className="w-4 h-1 rounded-full opacity-40" style={{ background: activeTheme.tokens.foreground }} />
                        </span>
                      </span>
                      <span className="mx-3 mt-2 rounded-[8px] h-10 lg:h-14 flex items-center px-3" style={{ background: activeTheme.tokens.primary, color: activeTheme.tokens.primaryForeground }}>
                        <span className="text-[10px] font-semibold">New arrivals</span>
                      </span>
                      <span className="flex-1 grid grid-cols-3 gap-1.5 p-3">
                        {[0, 1, 2].map((i) => (
                          <span key={i} className="rounded-[6px] overflow-hidden" style={{ background: activeTheme.tokens.muted }}>
                            {productThumbs[i] && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={productThumbs[i]} alt="" className="w-full h-full object-cover" />
                            )}
                          </span>
                        ))}
                      </span>
                    </span>
                  </button>

                  {/* Banners — small */}
                  <button type="button" onClick={() => setActiveTab("banners")} className={`group relative overflow-hidden text-left rounded-2xl bg-white border border-neutral-200 transition-all duration-300 hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-[0_20px_44px_-24px_rgba(0,0,0,0.3)] col-start-1 row-start-4 p-3 sm:p-4 flex flex-col justify-between`}>
                    <span className="w-9 h-9 rounded-[10px] bg-pink-50 text-pink-600 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                      <ImageIcon className="w-4 h-4" />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold">Banners</span>
                      <span className="hidden sm:block text-[11px] text-neutral-500 truncate">{liveBanners} live</span>
                    </span>
                  </button>
                </div>
              </section>

              {/* Setup checklist */}
              {(() => {
                const steps = SETUP_STEPS.map((st, i) => ({
                  label: st.id === "products" ? `${st.title} (${Math.min(totalProducts, 5)}/5)` : st.title,
                  done: isSetupStepDone(store, st.id),
                  run: () => setSetupStart(i),
                }));
                const doneCount = steps.filter((st) => st.done).length;
                const allDone = doneCount === steps.length;
                return (
                  <section className="hero-rise rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6" style={{ animationDelay: "600ms" }}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="text-sm font-semibold">{allDone ? "Your store is fully set up" : "Finish setting up your store"}</h2>
                        <p className="mt-0.5 text-xs text-neutral-500">
                          {allDone ? "Nice work. Keep adding products to grow." : "Stores that finish these steps get more orders."}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-semibold tabular-nums">
                        {doneCount} of {steps.length}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-6 gap-1.5">
                      {steps.map((st, i) => (
                        <span
                          key={st.label}
                          className={`h-1.5 rounded-full transition-colors duration-500 ${i < doneCount ? "bg-emerald-500" : "bg-neutral-200"}`}
                          style={{ transitionDelay: `${i * 60}ms` }}
                        />
                      ))}
                    </div>

                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-x-6">
                      {steps.map((st) => (
                        <button
                          key={st.label}
                          type="button"
                          disabled={st.done}
                          onClick={st.run}
                          className="group flex items-center gap-3 py-2.5 border-b border-neutral-100 md:[&:nth-last-child(-n+2)]:border-b-0 last:border-b-0 text-left disabled:cursor-default"
                        >
                          {st.done ? (
                            <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                              <Check className="w-3 h-3" strokeWidth={3} />
                            </span>
                          ) : (
                            <span className="w-5 h-5 rounded-full border-2 border-neutral-300 shrink-0 transition-colors group-hover:border-neutral-900" />
                          )}
                          <span className={`flex-1 text-sm ${st.done ? "text-neutral-400 line-through decoration-neutral-300" : "font-medium text-neutral-900"}`}>
                            {st.label}
                          </span>
                          {!st.done && (
                            <ChevronRight className="w-4 h-4 text-neutral-300 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-neutral-700" />
                          )}
                        </button>
                      ))}
                    </div>
                  </section>
                );
              })()}

              {/* Help, legal and social links */}
              <div className="hero-rise" style={{ animationDelay: "680ms" }}>
                <HelpAndMore storeName={store.name} />
              </div>
            </div>
          )}

        {/* NOTIFICATIONS PAGE */}
        {activeTab === "notifications" && (
          <div className="space-y-4 animate-enter-blur">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-neutral-500">
                {unreadCount > 0 ? `${unreadCount} unread of ${notifications.length}` : `All ${notifications.length} caught up`}
              </span>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllNotificationsRead}
                  className="h-9 px-3.5 rounded-[10px] border border-neutral-200 bg-white text-xs font-semibold hover:border-neutral-900 transition-colors"
                >
                  Mark all as read
                </button>
              )}
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-white divide-y divide-neutral-100 overflow-hidden">
              {notifications.map((n) => {
                const { icon: Icon, tone } = notificationIcon(n.type);
                return (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => openNotification(n)}
                    className={`w-full flex items-start gap-4 px-4 sm:px-5 py-4 text-left transition-colors hover:bg-neutral-50 ${n.unread ? "bg-indigo-50/30" : ""}`}
                  >
                    <span className={`w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0 ${tone}`}>
                      <Icon className="w-[18px] h-[18px]" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-3">
                        <span className={`text-sm ${n.unread ? "font-semibold text-neutral-950" : "font-medium text-neutral-700"}`}>{n.title}</span>
                        <span className="shrink-0 text-[11px] text-neutral-400">{n.time}</span>
                      </span>
                      <span className="mt-0.5 block text-[13px] text-neutral-500">{n.desc}</span>
                    </span>
                    {n.unread && <span className="mt-2 w-2 h-2 rounded-full bg-indigo-500 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* PROFILE PAGE */}
        {activeTab === "profile" && (
          <div className="space-y-6 animate-enter-blur">
            {/* Hero: cover, avatar, identity, quick actions and lifetime stats */}
            <section className="hero-rise overflow-hidden rounded-[22px] border border-neutral-200 bg-white">
              <div className="relative h-28 sm:h-36 overflow-hidden bg-gradient-to-br from-indigo-200 via-violet-100 to-rose-100">
                <span aria-hidden className="absolute -top-16 -left-10 w-64 h-64 rounded-full bg-indigo-400/40 blur-3xl" />
                <span aria-hidden className="absolute -bottom-20 right-10 w-72 h-72 rounded-full bg-fuchsia-300/40 blur-3xl" />
                <span
                  aria-hidden
                  className="absolute inset-0 opacity-[0.25]"
                  style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.9) 1px, transparent 1px)", backgroundSize: "16px 16px" }}
                />
              </div>

              <div className="relative px-5 sm:px-8 pb-6">
                <div className="flex flex-col gap-4">
                  <span className="relative -mt-12 sm:-mt-14 w-24 h-24 sm:w-28 sm:h-28 shrink-0 rounded-full bg-gradient-to-br from-neutral-800 to-black text-white text-3xl font-semibold flex items-center justify-center ring-4 ring-white shadow-[0_16px_40px_-16px_rgba(0,0,0,0.5)]">
                    {ownerInitials}
                    <span className="absolute bottom-1.5 right-1.5 w-4 h-4 rounded-full bg-emerald-500 ring-[3px] ring-white" title="Store live" />
                  </span>
                  <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">{ownerName}</h2>
                      <span className="rounded-full bg-neutral-950 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
                        {currentPlan.name}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm text-neutral-500 break-all">{user?.email}</p>
                    <a
                      href={liveStoreUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-neutral-200 px-2.5 py-1 text-xs font-medium text-neutral-700 hover:border-neutral-400 transition-colors"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      {store.name} · {storeWebDomain}
                    </a>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={copyStoreLink}
                      className="flex-1 sm:flex-none h-10 px-4 rounded-[10px] border border-neutral-200 bg-white text-sm font-semibold inline-flex items-center justify-center gap-2 hover:border-neutral-900 transition-colors"
                    >
                      {copiedLink ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      {copiedLink ? "Copied" : "Copy link"}
                    </button>
                    <button
                      type="button"
                      onClick={() => window.open(liveStoreUrl, "_blank")}
                      className="flex-1 sm:flex-none h-10 px-4 rounded-[10px] bg-neutral-950 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 hover:bg-black transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View store
                    </button>
                  </div>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-px overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-200">
                  {[
                    { label: "Products", value: <CountUp from={0} to={totalProducts} />, tab: "products" as const },
                    { label: "Orders", value: <CountUp from={0} to={totalOrders} />, tab: "orders" as const },
                    { label: "Customers", value: <CountUp from={0} to={totalCustomers} />, tab: "customers" as const },
                    { label: "Lifetime sales", value: <CountUp from={0} to={Math.round(totalRevenue / 100)} prefix="₹" /> },
                  ].map((st) => (
                    <button
                      key={st.label}
                      type="button"
                      onClick={() => st.tab && setActiveTab(st.tab)}
                      className={`bg-white px-4 py-3.5 text-left transition-colors ${st.tab ? "hover:bg-neutral-50" : "cursor-default"}`}
                    >
                      <span className="block text-xl font-semibold tracking-tight tabular-nums">{st.value}</span>
                      <span className="block text-xs text-neutral-500">{st.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
              {/* Account details */}
              <section style={{ animationDelay: "100ms" }} className="hero-rise lg:col-span-3 rounded-2xl border border-neutral-200 bg-white">
                <div className="flex items-center justify-between px-5 pt-5">
                  <h3 className="text-sm font-semibold">Account details</h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab("settings")}
                    className="text-xs font-semibold text-neutral-500 hover:text-black transition-colors"
                  >
                    Edit in settings
                  </button>
                </div>
                <div className="mt-2 divide-y divide-neutral-100">
                  {[
                    { label: "Full name", value: ownerName, icon: Users },
                    { label: "Email", value: user?.email || "Not added", icon: Mail },
                    { label: "Phone", value: store.contactPhone || "Not added", icon: Phone },
                    { label: "Instagram", value: store.instagramHandle ? `@${store.instagramHandle.replace(/^@/, "")}` : "Not linked", icon: Globe },
                    {
                      label: "Member since",
                      value: store.createdAt ? new Date(store.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "—",
                      icon: Clock,
                    },
                  ].map(({ label, value, icon: Icon }) => (
                    <div key={label} className="flex items-center gap-3 px-5 py-3.5">
                      <span className="w-9 h-9 rounded-[10px] bg-neutral-100 text-neutral-600 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[11px] text-neutral-500">{label}</span>
                        <span className="block text-sm font-medium truncate">{value}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              <div className="lg:col-span-2 space-y-6">
                {/* Plan and usage */}
                <section style={{ animationDelay: "160ms" }} className="hero-rise relative overflow-hidden rounded-2xl bg-neutral-950 text-white p-5">
                  <span aria-hidden className="absolute -top-16 -right-10 w-48 h-48 rounded-full bg-violet-500/30 blur-3xl" />
                  <span className="relative block text-[11px] font-semibold uppercase tracking-[0.16em] text-white/50">Your plan</span>
                  <span className="relative mt-1 block text-lg font-semibold">{currentPlan.name}</span>
                  <span className="relative block text-xs text-white/55">{currentPlan.priceFormatted}</span>
                  <div className="relative mt-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/60">Products used</span>
                      <span className="font-semibold tabular-nums">
                        {totalProducts} / {currentPlan.maxProducts >= 9999 ? "∞" : currentPlan.maxProducts}
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 rounded-full bg-white/15 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-fuchsia-400 origin-left bar-grow"
                        style={{
                          width: `${Math.min(100, Math.max(4, (totalProducts / (currentPlan.maxProducts >= 9999 ? 100 : currentPlan.maxProducts)) * 100))}%`,
                        }}
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab("billing")}
                    className="relative mt-5 w-full h-10 rounded-[10px] bg-white text-black text-sm font-semibold inline-flex items-center justify-center gap-1.5 hover:bg-neutral-100 transition-colors"
                  >
                    {store.planId === "pro" ? "Manage plan" : "Upgrade plan"}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </section>

                {/* Shortcuts */}
                <section style={{ animationDelay: "220ms" }} className="hero-rise grid grid-cols-2 gap-3">
                  {[
                    { label: "Store settings", icon: Settings, tab: "settings" as const, tone: "bg-neutral-100 text-neutral-700" },
                    { label: "Themes", icon: Palette, tab: "themes" as const, tone: "bg-fuchsia-50 text-fuchsia-600" },
                    { label: "Notifications", icon: Bell, tab: "notifications" as const, tone: "bg-indigo-50 text-indigo-600" },
                    { label: "Subscription", icon: CreditCard, tab: "billing" as const, tone: "bg-amber-50 text-amber-600" },
                  ].map(({ label, icon: Icon, tab, tone }) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      className="group rounded-2xl border border-neutral-200 bg-white p-4 text-left transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_36px_-22px_rgba(0,0,0,0.3)]"
                    >
                      <span className={`w-9 h-9 rounded-[10px] flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${tone}`}>
                        <Icon className="w-4 h-4" />
                      </span>
                      <span className="mt-3 block text-sm font-semibold">{label}</span>
                    </button>
                  ))}
                </section>

                {userStores.length > 1 && (
                  <section className="rounded-2xl border border-neutral-200 bg-white p-5">
                    <label className="block text-sm font-semibold">Switch store</label>
                    <select
                      value={store.subdomain}
                      onChange={(e) => {
                        setActiveSubdomain(e.target.value);
                        router.push(`/dashboard?store=${e.target.value}`);
                      }}
                      className="mt-2 w-full h-10 text-sm bg-white border border-neutral-200 rounded-[10px] px-3 font-medium cursor-pointer focus:outline-none focus:border-black"
                    >
                      {userStores.map((st) => (
                        <option key={st.subdomain} value={st.subdomain}>
                          {st.name}
                        </option>
                      ))}
                    </select>
                  </section>
                )}

                <button
                  type="button"
                  onClick={async () => {
                    await signOut();
                    router.push("/login");
                  }}
                  className="w-full h-11 rounded-2xl border border-red-200 bg-white text-red-600 text-sm font-semibold inline-flex items-center justify-center gap-2 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PRODUCTS */}
        {/* TAB 2: PRODUCTS */}
        {activeTab === "products" && (
          isProductModalOpen ? (
            <div className="mt-6 space-y-6 animate-enter-scale">
              {/* Top Navigation & Actions Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-white border border-neutral-200 shadow-xs">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsProductModalOpen(false);
                      resetProductForm();
                    }}
                    className="p-2 rounded-lg border border-neutral-200 hover:bg-neutral-100 text-neutral-700 transition-colors cursor-pointer"
                    title="Back to Catalog"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div>
                    <h2 className="text-base font-bold text-neutral-900">
                      {editingProductId ? "Edit Product" : "Add Product"}
                    </h2>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      {editingProductId
                        ? `Editing "${pTitle}" • Changes update live across your store`
                        : "Add images, pricing, and details for your product."}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs rounded-lg"
                    onClick={() => {
                      setIsProductModalOpen(false);
                      resetProductForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="bg-[#111111] text-white hover:bg-black rounded-lg text-xs font-semibold px-4 cursor-pointer"
                    onClick={handleSaveProduct}
                  >
                    {editingProductId ? "Save Changes" : "Save Product"}
                  </Button>
                </div>
              </div>

              {/* Full Page Product Form Grid */}
              <form onSubmit={handleSaveProduct} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left 7 Columns: Product Information & Pricing */}
                <div className="lg:col-span-7 space-y-6">
                  {/* Card 1: Product Basics */}
                  <div className="p-6 rounded-xl bg-white border border-neutral-200 shadow-xs space-y-4">
                    <h3 className="font-bold text-sm text-neutral-900 border-b border-neutral-100 pb-3">
                      Basic Information
                    </h3>

                    <div>
                      <label className="font-bold block mb-1 text-xs text-neutral-800">Product Title *</label>
                      <Input
                        placeholder="e.g. Vintage Washed Oversized Heavyweight Tee"
                        value={pTitle}
                        onChange={(e) => setPTitle(e.target.value)}
                        className="text-xs rounded-lg"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold block text-xs text-neutral-800">Category *</label>
                      <Input
                        placeholder="e.g. T-Shirts, Hoodies, Accessories"
                        value={pCategory}
                        onChange={(e) => setPCategory(e.target.value)}
                        list="dashboard-categories-datalist-fullpage"
                        className="text-xs rounded-lg"
                        required
                      />
                      <datalist id="dashboard-categories-datalist-fullpage">
                        {(store.categories || []).map((cat) => (
                          <option key={cat.id} value={cat.name} />
                        ))}
                      </datalist>

                      {/* Quick Select Category Chips */}
                      {(store.categories || []).length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap pt-1">
                          <span className="text-[10px] text-neutral-400 font-medium">Quick select:</span>
                          {(store.categories || []).map((cat) => (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => setPCategory(cat.name)}
                              className={`text-[10px] px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                                pCategory.toLowerCase() === cat.name.toLowerCase()
                                  ? "bg-black text-white border-black font-bold"
                                  : "border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-700"
                              }`}
                            >
                              {cat.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="font-bold block mb-1 text-xs text-neutral-800">Description</label>
                      <textarea
                        rows={4}
                        placeholder="Add product details, materials, sizing, or styling notes..."
                        value={pDesc}
                        onChange={(e) => setPDesc(e.target.value)}
                        className="w-full p-3 rounded-lg border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-black leading-relaxed"
                      />
                    </div>
                  </div>

                  {/* Card 2: Pricing & Inventory */}
                  <div className="p-6 rounded-xl bg-white border border-neutral-200 shadow-xs space-y-4">
                    <h3 className="font-bold text-sm text-neutral-900 border-b border-neutral-100 pb-3">
                      Pricing & Stock
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="font-bold block mb-1 text-xs text-neutral-800">Selling Price (₹) *</label>
                        <Input
                          type="number"
                          placeholder="699"
                          value={pPrice}
                          onChange={(e) => setPPrice(e.target.value)}
                          className="text-xs rounded-lg"
                          required
                        />
                        <p className="text-[10px] text-neutral-400 mt-1">Price charged to customer</p>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="font-bold text-xs text-neutral-800">Original MRP (₹)</label>
                          {Number(pComparePrice) > Number(pPrice) && Number(pPrice) > 0 && (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              Save {Math.round(((Number(pComparePrice) - Number(pPrice)) / Number(pComparePrice)) * 100)}%
                            </span>
                          )}
                        </div>
                        <Input
                          type="number"
                          placeholder="999"
                          value={pComparePrice}
                          onChange={(e) => setPComparePrice(e.target.value)}
                          className="text-xs rounded-lg"
                        />
                        <p className="text-[10px] text-neutral-400 mt-1">Crossed-out MRP (optional)</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-neutral-100">
                      <div>
                        <label className="font-bold block mb-1 text-xs text-neutral-800">Stock Quantity *</label>
                        <Input
                          type="number"
                          placeholder="25"
                          value={pStock}
                          onChange={(e) => setPStock(e.target.value)}
                          className="text-xs rounded-lg"
                          required
                        />
                      </div>
                      <div className="flex flex-col justify-end">
                        <div className="p-2.5 rounded-lg bg-neutral-50 border border-neutral-200 flex items-center justify-between">
                          <span className="text-xs font-medium text-neutral-600">Inventory Status:</span>
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                            Number(pStock) > 5 ? "bg-emerald-100 text-emerald-800" : Number(pStock) > 0 ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"
                          }`}>
                            {Number(pStock) > 5 ? "In Stock" : Number(pStock) > 0 ? "Low Stock" : "Sold Out"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right 5 Columns: Photography & Storefront Preview */}
                <div className="lg:col-span-5 space-y-6">
                  {/* Card 3: Media Upload */}
                  <div className="p-6 rounded-xl bg-white border border-neutral-200 shadow-xs space-y-4">
                    <h3 className="font-bold text-sm text-neutral-900 border-b border-neutral-100 pb-3">
                      Product Images
                    </h3>

                    <div className="space-y-2">
                      <label className="font-bold block text-xs text-neutral-800">Product Image URL</label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Paste high-res image URL..."
                          value={pImageUrl}
                          onChange={(e) => setPImageUrl(e.target.value)}
                          className="text-xs rounded-lg"
                        />
                        <label className="shrink-0">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                  if (event.target?.result) {
                                    setPImageUrl(event.target.result as string);
                                  }
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                          <Button type="button" variant="outline" size="md" className="cursor-pointer gap-1.5 text-xs rounded-lg">
                            <UploadCloud className="w-3.5 h-3.5" />
                            <span>Upload</span>
                          </Button>
                        </label>
                      </div>

                      {/* Sample Presets */}
                      <div className="flex items-center gap-1.5 flex-wrap pt-1">
                        <span className="text-[10px] text-neutral-400 font-medium">Quick samples:</span>
                        <button
                          type="button"
                          onClick={() => setPImageUrl("https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80")}
                          className="text-[10px] px-2 py-0.5 rounded border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 cursor-pointer"
                        >
                          T-Shirt
                        </button>
                        <button
                          type="button"
                          onClick={() => setPImageUrl("https://images.unsplash.com/photo-1542272604-780c96856592?auto=format&fit=crop&w=800&q=80")}
                          className="text-[10px] px-2 py-0.5 rounded border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 cursor-pointer"
                        >
                          Jeans
                        </button>
                        <button
                          type="button"
                          onClick={() => setPImageUrl("https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80")}
                          className="text-[10px] px-2 py-0.5 rounded border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 cursor-pointer"
                        >
                          Hoodie
                        </button>
                        <button
                          type="button"
                          onClick={() => setPImageUrl("https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80")}
                          className="text-[10px] px-2 py-0.5 rounded border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 cursor-pointer"
                        >
                          Watch
                        </button>
                      </div>
                    </div>

                    {/* Live Storefront Product Card Preview */}
                    <div className="pt-2">
                      <span className="text-xs font-bold text-neutral-800 block mb-2">Storefront Preview:</span>
                      <div className="max-w-xs mx-auto rounded-xl border border-neutral-200 overflow-hidden bg-white shadow-sm">
                        <div className="relative aspect-[3/4] w-full bg-neutral-100 overflow-hidden">
                          <img
                            src={pImageUrl || "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80"}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                          {Number(pComparePrice) > Number(pPrice) && Number(pPrice) > 0 && (
                            <span className="absolute top-2 left-2 bg-black text-white text-[10px] font-bold px-2 py-0.5 rounded">
                              SAVE {Math.round(((Number(pComparePrice) - Number(pPrice)) / Number(pComparePrice)) * 100)}%
                            </span>
                          )}
                        </div>
                        <div className="p-3 space-y-1">
                          <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">
                            {pCategory || "Category"}
                          </span>
                          <h4 className="text-xs font-bold text-neutral-900 truncate">
                            {pTitle || "Untitled Product"}
                          </h4>
                          <div className="flex items-center gap-2 pt-0.5">
                            <span className="text-xs font-extrabold text-neutral-900">
                              ₹{Number(pPrice || 0).toLocaleString("en-IN")}
                            </span>
                            {Number(pComparePrice) > 0 && (
                              <span className="text-[10px] text-neutral-400 line-through">
                                ₹{Number(pComparePrice).toLocaleString("en-IN")}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Save Action */}
                  <div className="p-5 rounded-xl bg-white border border-neutral-200 shadow-xs flex items-center justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      className="text-xs rounded-lg"
                      onClick={() => {
                        setIsProductModalOpen(false);
                        resetProductForm();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="bg-[#111111] text-white hover:bg-black rounded-lg text-xs font-semibold px-6 py-2.5 cursor-pointer"
                    >
                      {editingProductId ? "Save Changes" : "Publish Product"}
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          ) : (
            <div className="space-y-5 animate-enter-blur">
              {(() => {
                const LOW = 5;
                const counts = {
                  all: store.products.length,
                  in: store.products.filter((p) => p.stock > LOW).length,
                  low: store.products.filter((p) => p.stock > 0 && p.stock <= LOW).length,
                  out: store.products.filter((p) => p.stock <= 0).length,
                };
                const q = productSearch.trim().toLowerCase();
                const list = store.products.filter((p) => {
                  const stockOk =
                    productFilter === "all" ||
                    (productFilter === "in" && p.stock > LOW) ||
                    (productFilter === "low" && p.stock > 0 && p.stock <= LOW) ||
                    (productFilter === "out" && p.stock <= 0);
                  return stockOk && (!q || p.title.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
                });
                const startAdd = () => {
                  if (!productQuota.allowed) {
                    setActiveTab("billing");
                    return;
                  }
                  resetProductForm();
                  setIsProductModalOpen(true);
                };
                return (
                  <>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      {[
                        { id: "all" as const, label: "All products", dot: "bg-neutral-900" },
                        { id: "in" as const, label: "In stock", dot: "bg-emerald-500" },
                        { id: "low" as const, label: "Low stock", dot: "bg-amber-500" },
                        { id: "out" as const, label: "Sold out", dot: "bg-rose-500" },
                      ].map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setProductFilter(f.id)}
                          className={`rounded-2xl border bg-white p-4 text-left transition-all ${
                            productFilter === f.id ? "border-neutral-900 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.5)]" : "border-neutral-200 hover:border-neutral-300"
                          }`}
                        >
                          <span className="flex items-center gap-2 text-xs text-neutral-500">
                            <span className={`w-1.5 h-1.5 rounded-full ${f.dot}`} />
                            {f.label}
                          </span>
                          <span className="mt-1.5 block text-2xl font-semibold tracking-tight tabular-nums">{counts[f.id]}</span>
                        </button>
                      ))}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <label className="flex-1 flex items-center gap-2 h-11 px-3.5 rounded-xl border border-neutral-200 bg-white focus-within:border-neutral-900 transition-colors">
                        <Search className="w-4 h-4 text-neutral-400 shrink-0" />
                        <input
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                          placeholder="Search products or categories"
                          className="w-full bg-transparent text-sm outline-none"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={startAdd}
                        className="h-11 px-5 rounded-xl bg-neutral-950 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 hover:bg-black transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Add product
                      </button>
                    </div>
                    <p className="-mt-2 text-xs text-neutral-500">
                      {currentPlan.maxProducts >= 9999
                        ? `${totalProducts} products · unlimited on your plan`
                        : `${totalProducts} of ${currentPlan.maxProducts} product slots used`}
                    </p>

                    {list.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-neutral-300 bg-white px-6 py-14 text-center">
                        <span className="mx-auto w-12 h-12 rounded-2xl bg-neutral-100 text-neutral-500 flex items-center justify-center">
                          <Package className="w-5 h-5" />
                        </span>
                        <p className="mt-3 text-sm font-semibold">{store.products.length ? "No products match" : "No products yet"}</p>
                        <p className="mt-1 text-xs text-neutral-500">
                          {store.products.length ? "Try a different search or filter." : "Add your first product to start selling."}
                        </p>
                        {!store.products.length && (
                          <button type="button" onClick={startAdd} className="mt-4 h-10 px-5 rounded-xl bg-neutral-950 text-white text-sm font-semibold">
                            Add product
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                        {list.map((prod, idx) => {
                          const stock =
                            prod.stock <= 0
                              ? { text: "Sold out", cls: "bg-rose-50 text-rose-700" }
                              : prod.stock <= LOW
                                ? { text: `Only ${prod.stock} left`, cls: "bg-amber-50 text-amber-700" }
                                : { text: `${prod.stock} in stock`, cls: "bg-emerald-50 text-emerald-700" };
                          return (
                            <div
                              key={prod.id}
                              className={`group flex flex-col rounded-2xl border border-neutral-200 bg-white overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-24px_rgba(0,0,0,0.35)] animate-enter-slide-up stagger-${(idx % 6) + 1}`}
                            >
                              <div className="relative aspect-square bg-neutral-100 overflow-hidden">
                                {prod.images[0] ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={prod.images[0]}
                                    alt={prod.title}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                  />
                                ) : (
                                  <span className="absolute inset-0 flex items-center justify-center text-neutral-300">
                                    <ImageIcon className="w-8 h-8" />
                                  </span>
                                )}
                                <span className={`absolute top-2 left-2 rounded-full px-2 py-0.5 text-[10px] font-semibold ${stock.cls}`}>{stock.text}</span>
                                {prod.status !== "published" && (
                                  <span className="absolute top-2 right-2 rounded-full bg-neutral-900/80 px-2 py-0.5 text-[10px] font-semibold text-white capitalize">
                                    {prod.status}
                                  </span>
                                )}
                              </div>
                              <div className="flex-1 flex flex-col p-3">
                                <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 truncate">{prod.category}</span>
                                <h4 className="mt-0.5 text-sm font-semibold leading-snug line-clamp-2">{prod.title}</h4>
                                <span className="mt-1 flex items-baseline gap-1.5">
                                  <span className="text-sm font-semibold">₹{(prod.price / 100).toLocaleString("en-IN")}</span>
                                  {prod.compareAtPrice && prod.compareAtPrice > prod.price && (
                                    <span className="text-[11px] text-neutral-400 line-through">
                                      ₹{(prod.compareAtPrice / 100).toLocaleString("en-IN")}
                                    </span>
                                  )}
                                </span>
                                <div className="mt-auto pt-3 flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => openEditProduct(prod)}
                                    className="flex-1 h-9 rounded-[10px] bg-neutral-950 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 hover:bg-black transition-colors"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                    Edit
                                  </button>
                                  <Link
                                    href={getStoreUrl(store.subdomain, `/products/${prod.slug}`)}
                                    target="_blank"
                                    aria-label={`View ${prod.title} in your store`}
                                    className="w-9 h-9 shrink-0 rounded-[10px] border border-neutral-200 flex items-center justify-center text-neutral-600 hover:border-neutral-900 hover:text-black transition-colors"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </Link>
                                  <button
                                    type="button"
                                    aria-label={`Delete ${prod.title}`}
                                    onClick={() => {
                                      if (confirm(`Delete "${prod.title}"?`)) {
                                        storeService.deleteProduct(store.subdomain, prod.id);
                                        refreshStore();
                                      }
                                    }}
                                    className="w-9 h-9 shrink-0 rounded-[10px] border border-neutral-200 flex items-center justify-center text-neutral-400 hover:border-red-200 hover:bg-red-50 hover:text-red-600 transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )
        )}

        {/* TAB 2.5: CATEGORIES */}
        {activeTab === "categories" && (
          isCategoryModalOpen ? (
            <div className="mt-6 space-y-6 animate-enter-scale">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-white border border-neutral-200 shadow-xs">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCategoryModalOpen(false);
                      resetCategoryForm();
                    }}
                    className="p-2 rounded-lg border border-neutral-200 hover:bg-neutral-100 text-neutral-700 transition-colors cursor-pointer"
                    title="Back to Categories"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-neutral-900">
                        {cIsParent
                          ? editingCategoryId
                            ? `Edit Collection: ${cName}`
                            : "New Featured Collection"
                          : editingCategoryId
                          ? `Edit Category: ${cName}`
                          : "New Category"}
                      </h2>
                      <Badge
                        variant={cIsParent ? "warning" : "neutral"}
                        className={cIsParent ? "bg-amber-600 text-white text-[10px]" : "text-[10px]"}
                      >
                        {cIsParent ? "Featured Collection" : "Category"}
                      </Badge>
                    </div>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      {cIsParent
                        ? "Homepage showcase card highlighting your key categories"
                        : "Organizes products in your catalog"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs rounded-lg"
                    onClick={() => {
                      setIsCategoryModalOpen(false);
                      resetCategoryForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="bg-[#111111] text-white hover:bg-black rounded-lg text-xs font-semibold px-4 cursor-pointer gap-1.5"
                    onClick={handleSaveCategory}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{editingCategoryId ? "Update Category" : "Save Category"}</span>
                  </Button>
                </div>
              </div>

              {/* Category Studio Form */}
              <form onSubmit={handleSaveCategory} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7 space-y-6">
                  {/* Category Type Switcher */}
                  <div className="p-4 rounded-xl bg-white border border-neutral-200 shadow-xs">
                    <label className="text-xs font-bold text-neutral-900 block mb-2">Item Type</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setCIsParent(false)}
                        className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                          !cIsParent
                            ? "border-neutral-900 bg-neutral-900 text-white shadow-xs"
                            : "border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-bold text-xs">
                          <FolderTree className="w-3.5 h-3.5" />
                          <span>Product Category</span>
                        </div>
                        <p className={`text-[11px] mt-0.5 ${!cIsParent ? "text-neutral-300" : "text-neutral-500"}`}>
                          E.g. T-Shirts, Hoodies, Jeans
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setCIsParent(true);
                          if (!cSubtitle) setCSubtitle("Modern fits for everyday style.");
                          if (!cCtaText) setCCtaText("Shop Collection");
                        }}
                        className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                          cIsParent
                            ? "border-neutral-900 bg-neutral-900 text-white shadow-xs"
                            : "border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-bold text-xs">
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                          <span>Featured Collection</span>
                        </div>
                        <p className={`text-[11px] mt-0.5 ${cIsParent ? "text-neutral-300" : "text-neutral-500"}`}>
                          Homepage card (e.g. Men's or Women's Collection)
                        </p>
                      </button>
                    </div>
                  </div>

                  {/* Core Details */}
                  <div className="p-6 rounded-xl bg-white border border-neutral-200 shadow-xs space-y-4 text-xs">
                    <h3 className="font-bold text-sm text-neutral-900 border-b border-neutral-100 pb-3">
                      {cIsParent ? "Collection Details" : "Category Details"}
                    </h3>

                    <div>
                      <label className="font-bold block mb-1">
                        {cIsParent ? "Collection Title *" : "Category Name *"}
                      </label>
                      <Input
                        placeholder={cIsParent ? "e.g. Men's Collection, Summer Drop" : "e.g. Vintage Denim, Hoodies"}
                        value={cName}
                        onChange={(e) => {
                          setCName(e.target.value);
                          if (!editingCategoryId) {
                            setCSlug(
                              e.target.value
                                .toLowerCase()
                                .replace(/[^a-z0-9]+/g, "-")
                                .replace(/^-|-$/g, "")
                            );
                          }
                        }}
                        className="rounded-lg text-xs"
                        required
                      />
                    </div>

                    {!cIsParent && (
                      <div className="p-3.5 rounded-lg bg-neutral-50 border border-neutral-200 space-y-1.5">
                        <label className="font-bold block text-neutral-900 text-xs">
                          Belongs to Collection (Optional)
                        </label>
                        <select
                          value={cParentId}
                          onChange={(e) => setCParentId(e.target.value)}
                          className="w-full p-2.5 rounded-lg border border-neutral-300 text-xs text-neutral-900 bg-white focus:outline-none focus:ring-1 focus:ring-black"
                        >
                          <option value="">None (Independent Category)</option>
                          {(store.categories || [])
                            .filter((c) => c.isParent && c.id !== editingCategoryId)
                            .map((parent) => (
                              <option key={parent.id} value={parent.id}>
                                {parent.name}
                              </option>
                            ))}
                        </select>
                      </div>
                    )}

                    {cIsParent && (
                      <div className="space-y-4 pt-1">
                        <div>
                          <label className="font-bold block mb-1 text-neutral-800">
                            Tagline (Optional)
                          </label>
                          <Input
                            placeholder="e.g. Modern fits for everyday style."
                            value={cSubtitle}
                            onChange={(e) => setCSubtitle(e.target.value)}
                            className="rounded-lg text-xs"
                          />
                        </div>

                        <div>
                          <label className="font-bold block mb-1 text-neutral-800">
                            Button Text
                          </label>
                          <Input
                            placeholder="e.g. Shop Collection, Explore Styles"
                            value={cCtaText}
                            onChange={(e) => setCCtaText(e.target.value)}
                            className="rounded-lg text-xs"
                          />
                        </div>

                        {/* Included Categories */}
                        <div className="p-4 rounded-lg bg-neutral-50 border border-neutral-200 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <label className="font-bold block text-neutral-900 text-xs">
                              Included Categories
                            </label>
                            <span className="text-[11px] text-neutral-500">
                              {cSelectedChildren.length} selected
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 pt-1 max-h-48 overflow-y-auto pr-1">
                            {(store.categories || [])
                              .filter((c) => !c.isParent)
                              .map((child) => {
                                const isChecked = cSelectedChildren.includes(child.id);
                                return (
                                  <label
                                    key={child.id}
                                    className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                                      isChecked
                                        ? "bg-white border-neutral-900 shadow-2xs font-semibold text-neutral-900"
                                        : "bg-white/60 border-neutral-200 text-neutral-600 hover:bg-white"
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => {
                                        setCSelectedChildren((prev) =>
                                          prev.includes(child.id)
                                            ? prev.filter((id) => id !== child.id)
                                            : [...prev, child.id]
                                        );
                                      }}
                                      className="w-3.5 h-3.5 rounded text-black border-neutral-300 focus:ring-black"
                                    />
                                    <span className="truncate">{child.name}</span>
                                  </label>
                                );
                              })}
                          </div>
                          {(store.categories || []).filter((c) => !c.isParent).length === 0 && (
                            <p className="text-[11px] text-neutral-500 italic">
                              No categories found. Create categories first to include them here.
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="font-bold block mb-1">Store URL</label>
                      <div className="flex items-center">
                        <span className="px-3 py-2 bg-neutral-100 border border-r-0 border-neutral-300 rounded-l-lg text-neutral-500 font-mono text-xs">
                          /category/
                        </span>
                        <Input
                          placeholder="collection-slug"
                          value={cSlug}
                          onChange={(e) => setCSlug(e.target.value)}
                          className="rounded-l-none font-mono text-xs rounded-r-lg"
                          required
                        />
                      </div>
                      <p className="text-[11px] text-neutral-500 mt-1">
                        Live collection URL: <code className="font-mono text-neutral-700">/s/{store.subdomain}/category/{cSlug || "..."}</code>
                      </p>
                    </div>

                    {!cIsParent && (
                      <div>
                        <label className="font-bold block mb-1">Description</label>
                        <textarea
                          rows={2}
                          placeholder="Short summary displayed at top of category collection page..."
                          value={cDesc}
                          onChange={(e) => setCDesc(e.target.value)}
                          className="w-full p-2.5 rounded-lg border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-black"
                        />
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-2 border-t border-neutral-100">
                      <input
                        type="checkbox"
                        id="cat-active-checkbox-fullpage"
                        checked={cIsActive}
                        onChange={(e) => setCIsActive(e.target.checked)}
                        className="w-4 h-4 rounded text-black border-neutral-300 focus:ring-black cursor-pointer"
                      />
                      <label htmlFor="cat-active-checkbox-fullpage" className="font-semibold text-neutral-800 text-xs cursor-pointer">
                        Visible on storefront
                      </label>
                    </div>
                  </div>
                </div>

                {/* Right Column: Picture & Live Storefront Card Preview */}
                <div className="lg:col-span-5 space-y-6">
                  <div className="p-6 rounded-xl bg-white border border-neutral-200 shadow-xs space-y-4 text-xs">
                    <h3 className="font-bold text-sm text-neutral-900 border-b border-neutral-100 pb-3">
                      {cIsParent ? "Card Picture (Required)" : "Cover Photography"}
                    </h3>
                    <div className="space-y-2">
                      <label className="font-bold block text-neutral-800">Picture Image URL *</label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="https://images.unsplash.com/..."
                          value={cImageUrl}
                          onChange={(e) => setCImageUrl(e.target.value)}
                          className="rounded-lg text-xs"
                          required={cIsParent}
                        />
                        <label className="shrink-0">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                  if (event.target?.result) setCImageUrl(event.target.result as string);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                          <Button type="button" variant="outline" size="md" className="cursor-pointer gap-1 text-xs rounded-lg">
                            <UploadCloud className="w-3.5 h-3.5" />
                            <span>Upload</span>
                          </Button>
                        </label>
                      </div>

                      {/* Presets */}
                      <div className="flex items-center gap-1.5 flex-wrap pt-1">
                        <span className="text-[10px] text-neutral-400 font-medium">Presets:</span>
                        <button
                          type="button"
                          onClick={() => setCImageUrl("https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=400&q=80")}
                          className="text-[10px] px-2 py-0.5 rounded border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 cursor-pointer"
                        >
                          Men's Suit
                        </button>
                        <button
                          type="button"
                          onClick={() => setCImageUrl("https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80")}
                          className="text-[10px] px-2 py-0.5 rounded border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 cursor-pointer"
                        >
                          Women's Portrait
                        </button>
                        <button
                          type="button"
                          onClick={() => setCImageUrl("https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=400&q=80")}
                          className="text-[10px] px-2 py-0.5 rounded border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 cursor-pointer"
                        >
                          Editorial Fashion
                        </button>
                      </div>
                    </div>

                    {/* LIVE CARD PREVIEW FOR PARENT COLLECTION */}
                    {cIsParent ? (
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center justify-between text-[11px] text-neutral-500">
                          <span className="font-semibold text-neutral-800">Storefront Homepage Card Preview:</span>
                          <span className="text-[10px] text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded">
                            Live Card Output
                          </span>
                        </div>

                        <div className="rounded-2xl bg-[#EFECE6] p-5 border border-neutral-300/80 shadow-sm flex items-center justify-between group hover-3d-lift shimmer-card transition-all overflow-hidden relative">
                          <div className="flex-1 min-w-0 pr-3">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-500 block mb-0.5">
                              Featured Collection
                            </span>
                            <h4 className="font-serif-title text-xl text-neutral-900 font-normal leading-tight">
                              {cName || "Collection Name"}
                            </h4>
                            <p className="text-[11px] text-neutral-600 mt-1 line-clamp-2">
                              {cSubtitle || "Modern fits for everyday style."}
                            </p>

                            {/* Assigned Children Pills */}
                            {cSelectedChildren.length > 0 && (
                              <div className="mt-2.5 flex flex-wrap gap-1">
                                {cSelectedChildren.map((id) => {
                                  const child = (store.categories || []).find((c) => c.id === id);
                                  return (
                                    <span
                                      key={id}
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-white text-neutral-800 border border-neutral-300/60 shadow-2xs"
                                    >
                                      <span className="w-1 h-1 rounded-full bg-neutral-900"></span>
                                      <span>{child?.name || "Child"}</span>
                                    </span>
                                  );
                                })}
                              </div>
                            )}

                            <div className="inline-flex items-center gap-1 text-[11px] font-bold text-neutral-900 mt-3">
                              <span>{cCtaText || `Shop ${cName || "Collection"}`}</span>
                              <ArrowRight className="w-3 h-3" />
                            </div>
                          </div>

                          {/* Picture Preview */}
                          <div className="w-24 aspect-3/4 rounded-lg overflow-hidden bg-neutral-300 shrink-0 ml-2 shadow-xs border border-neutral-300/50">
                            {cImageUrl ? (
                              <img
                                src={cImageUrl}
                                alt="Preview"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center text-[10px] text-neutral-500">
                                <span>No Photo</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      cImageUrl && (
                        <div className="mt-3 rounded-xl overflow-hidden border border-neutral-200 bg-neutral-100">
                          <div className="relative aspect-[16/9] w-full overflow-hidden">
                            <img src={cImageUrl} alt="Category Cover Preview" className="w-full h-full object-cover" />
                          </div>
                          <div className="p-2 bg-neutral-50 border-t border-neutral-200 text-[11px] text-neutral-600 font-medium text-center">
                            Category Cover Photo
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </form>
            </div>
          ) : (
            <div className="mt-6 space-y-6 animate-enter-blur">
              {/* Sub-navigation & add */}
              <div className="flex items-center gap-2">
                <div className="grid flex-1 grid-cols-2 gap-1 rounded-2xl bg-neutral-100 p-1 sm:max-w-sm">
                  {([
                    { id: "categories", label: "Categories", count: (store.categories || []).filter((c) => !c.isParent).length },
                    { id: "collections", label: "Collections", count: (store.categories || []).filter((c) => c.isParent).length },
                  ] as const).map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setCategoryViewTab(t.id)}
                      style={{ minHeight: 0 }}
                      className={`h-10 rounded-xl text-sm font-semibold inline-flex items-center justify-center gap-1.5 transition-all ${
                        categoryViewTab === t.id ? "bg-white text-neutral-950 shadow-sm" : "text-neutral-500 hover:text-neutral-900"
                      }`}
                    >
                      {t.label}
                      <span className="text-xs font-medium text-neutral-400 tabular-nums">{t.count}</span>
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={categoryViewTab === "categories" ? openAddCategory : openAddParentCollection}
                  aria-label={categoryViewTab === "categories" ? "Add category" : "Add collection"}
                  className="h-12 w-12 sm:w-auto sm:px-5 shrink-0 rounded-2xl bg-neutral-950 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 hover:bg-black"
                >
                  <Plus className="w-5 h-5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">{categoryViewTab === "categories" ? "Add category" : "Add collection"}</span>
                </button>
              </div>

              {/* TAB CONTENT 1: CATEGORIES DIRECTORY */}
              {categoryViewTab === "categories" && (
                <div className="space-y-3">
                  {(store.categories || []).filter((c) => !c.isParent).length > 0 && (
                    <label className="flex items-center gap-2 h-11 px-3.5 rounded-xl border border-neutral-200 bg-white focus-within:border-neutral-900 transition-colors">
                      <Search className="w-4 h-4 text-neutral-400 shrink-0" />
                      <input
                        value={catSearchQuery}
                        onChange={(e) => setCatSearchQuery(e.target.value)}
                        placeholder="Search categories"
                        className="w-full bg-transparent text-sm outline-none"
                      />
                    </label>
                  )}

                  {(store.categories || []).filter((c) => !c.isParent).length === 0 ? (
                    <div className="rounded-2xl border border-neutral-200 bg-white px-6 py-12 text-center">
                      <span className="mx-auto w-14 h-14 rounded-2xl bg-neutral-100 flex items-center justify-center">
                        <FolderTree className="w-6 h-6 text-neutral-500" />
                      </span>
                      <p className="mt-4 text-base font-semibold">No categories yet</p>
                      <p className="mt-1 text-sm text-neutral-500 max-w-xs mx-auto">Group your products so buyers can find them faster.</p>
                      <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={openAddCategory}
                          className="h-11 px-5 rounded-xl bg-neutral-950 text-white text-sm font-semibold inline-flex items-center gap-2 hover:bg-black"
                        >
                          <Plus className="w-4 h-4" />
                          Add category
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-neutral-200 bg-white divide-y divide-neutral-100">
                      {(() => {
                        const visibleCats = (store.categories || [])
                          .filter((cat) => !cat.isParent)
                          .filter((cat) => {
                            if (!catSearchQuery.trim()) return true;
                            const q = catSearchQuery.toLowerCase();
                            return (
                              cat.name.toLowerCase().includes(q) ||
                              cat.slug.toLowerCase().includes(q) ||
                              (cat.description && cat.description.toLowerCase().includes(q))
                            );
                          });
                        if (visibleCats.length === 0) {
                          return <p className="px-4 py-8 text-center text-sm text-neutral-500">No categories match &ldquo;{catSearchQuery}&rdquo;</p>;
                        }
                        const total = (store.categories || []).filter((c) => !c.isParent).length;
                        return visibleCats.map((cat, index) => {
                          const productCount = store.products.filter(
                            (p) =>
                              p.category.toLowerCase() === cat.name.toLowerCase() ||
                              p.category.toLowerCase() === cat.slug.toLowerCase()
                          ).length;
                          const parent = (store.categories || []).find((p) => p.id === cat.parentId);
                          const live = cat.isActive ?? true;
                          const menuOpen = catMenuId === cat.id;

                          return (
                            <div key={cat.id} className="flex items-center gap-3 p-3">
                              <button
                                type="button"
                                onClick={() => openEditCategory(cat)}
                                style={{ minHeight: 0 }}
                                className="flex min-w-0 flex-1 items-center gap-3 text-left"
                              >
                                <span className={`w-12 h-12 rounded-xl overflow-hidden bg-neutral-100 shrink-0 flex items-center justify-center ${live ? "" : "opacity-50"}`}>
                                  {cat.imageUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={cat.imageUrl} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    <FolderTree className="w-5 h-5 text-neutral-400" />
                                  )}
                                </span>
                                <span className="min-w-0">
                                  <span className={`block truncate text-sm font-semibold ${live ? "" : "text-neutral-500"}`}>{cat.name}</span>
                                  <span className="block truncate text-xs text-neutral-500">
                                    {productCount} product{productCount === 1 ? "" : "s"}
                                    {parent ? ` · ${parent.name}` : ""}
                                    {live ? "" : " · Hidden"}
                                  </span>
                                </span>
                              </button>

                              <button
                                type="button"
                                role="switch"
                                aria-checked={live}
                                aria-label={live ? `Hide ${cat.name} from store` : `Show ${cat.name} on store`}
                                onClick={() => handleToggleCategoryActive(cat)}
                                style={{ minHeight: 0, height: 24 }}
                                className={`relative w-11 shrink-0 rounded-full transition-colors ${live ? "bg-emerald-500" : "bg-neutral-300"}`}
                              >
                                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${live ? "left-[22px]" : "left-0.5"}`} />
                              </button>

                              <div className="relative shrink-0">
                                <button
                                  type="button"
                                  onClick={() => setCatMenuId(menuOpen ? null : cat.id)}
                                  aria-label={`More options for ${cat.name}`}
                                  aria-expanded={menuOpen}
                                  style={{ minHeight: 0 }}
                                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 ${menuOpen ? "bg-neutral-100 text-neutral-900" : ""}`}
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </button>
                                {menuOpen && (
                                  <>
                                    <button
                                      type="button"
                                      aria-label="Close menu"
                                      onClick={() => setCatMenuId(null)}
                                      className="fixed inset-0 z-30 cursor-default"
                                    />
                                    <div className="absolute right-0 top-10 z-40 w-48 rounded-2xl border border-neutral-200 bg-white p-1.5 shadow-xl shadow-neutral-950/10 animate-enter-scale">
                                      <button type="button" style={{ minHeight: 0 }} onClick={() => { setCatMenuId(null); openEditCategory(cat); }} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-100 disabled:opacity-40 disabled:hover:bg-transparent">
                                        <Edit className="w-4 h-4" /> Edit
                                      </button>
                                      <Link
                                        href={getStoreUrl(store.subdomain, `/category/${cat.slug}`)}
                                        target="_blank"
                                        onClick={() => setCatMenuId(null)}
                                        style={{ minHeight: 0 }}
                                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-100 disabled:opacity-40 disabled:hover:bg-transparent"
                                      >
                                        <ExternalLink className="w-4 h-4" /> View in store
                                      </Link>
                                      {!catSearchQuery.trim() && (
                                        <>
                                          <button type="button" style={{ minHeight: 0 }} disabled={index === 0} onClick={() => { setCatMenuId(null); handleMoveCategory(index, "up"); }} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-100 disabled:opacity-40 disabled:hover:bg-transparent">
                                            <ChevronUp className="w-4 h-4" /> Move up
                                          </button>
                                          <button type="button" style={{ minHeight: 0 }} disabled={index === total - 1} onClick={() => { setCatMenuId(null); handleMoveCategory(index, "down"); }} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-100 disabled:opacity-40 disabled:hover:bg-transparent">
                                            <ChevronDown className="w-4 h-4" /> Move down
                                          </button>
                                        </>
                                      )}
                                      <div className="my-1 h-px bg-neutral-100" />
                                      <button
                                        type="button"
                                        style={{ minHeight: 0 }}
                                        onClick={() => { setCatMenuId(null); handleDeleteCategory(cat.id, cat.name); }}
                                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                                      >
                                        <Trash2 className="w-4 h-4" /> Delete
                                      </button>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  )}
                </div>
              )}

              {/* TAB CONTENT 2: FEATURED COLLECTIONS */}
              {categoryViewTab === "collections" && (
                <div className="space-y-4">

                  {/* Collections Grid */}
                  {(store.categories || []).filter((c) => c.isParent).length === 0 ? (
                    <div className="p-10 text-center border border-dashed border-neutral-200 rounded-xl bg-neutral-50/50 space-y-3">
                      <Sparkles className="w-8 h-8 text-neutral-300 mx-auto" />
                      <p className="text-xs font-semibold text-neutral-700">No featured collections created yet</p>
                      <p className="text-[11px] text-neutral-500 max-w-sm mx-auto">
                        Create collections (like Men's Collection or Summer Drop) to highlight key categories on your homepage.
                      </p>
                      <Button
                        size="sm"
                        className="bg-[#111111] text-white hover:bg-black rounded-lg text-xs mt-2 cursor-pointer"
                        onClick={openAddParentCollection}
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        <span>Create Collection</span>
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(store.categories || [])
                        .filter((c) => c.isParent)
                        .map((pCat, idx) => {
                          const children = (store.categories || []).filter(
                            (c) => !c.isParent && c.parentId === pCat.id
                          );
                          const bgColors = ["bg-[#EFECE6]", "bg-[#ECE7E1]", "bg-[#F3EFEA]", "bg-[#EAE6DF]"];
                          const cardBg = bgColors[idx % bgColors.length];

                          return (
                            <div
                              key={pCat.id}
                              className={`rounded-2xl ${cardBg} p-5 border border-neutral-200/90 flex flex-col justify-between hover-3d-lift shimmer-card transition-all group overflow-hidden relative shadow-2xs`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0 pr-2">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span
                                      className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${
                                        pCat.isActive ?? true
                                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                          : "bg-neutral-100 text-neutral-500 border border-neutral-200"
                                      }`}
                                    >
                                      {pCat.isActive ?? true ? "Live on Storefront" : "Hidden"}
                                    </span>
                                  </div>

                                  <h4 className="font-serif-title text-xl sm:text-2xl text-neutral-900 font-normal">
                                    {pCat.name}
                                  </h4>
                                  <p className="text-xs text-neutral-600 mt-1 line-clamp-2">
                                    {pCat.subtitle || pCat.description || "Curated collection"}
                                  </p>

                                  {/* Included Category Pills */}
                                  <div className="mt-3 flex flex-wrap gap-1.5 items-center">
                                    {children.length > 0 ? (
                                      children.map((child) => (
                                        <span
                                          key={child.id}
                                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/90 text-neutral-800 border border-neutral-300/60 shadow-2xs"
                                        >
                                          <span className="w-1 h-1 rounded-full bg-neutral-900"></span>
                                          <span>{child.name}</span>
                                        </span>
                                      ))
                                    ) : (
                                      <span className="text-[10px] text-neutral-400 italic">No categories assigned</span>
                                    )}
                                  </div>

                                  <div className="text-[11px] font-bold text-neutral-900 mt-3 inline-flex items-center gap-1">
                                    <span>{pCat.ctaText || `Shop ${pCat.name}`}</span>
                                    <ArrowRight className="w-3 h-3" />
                                  </div>
                                </div>

                                {/* Picture on right */}
                                {pCat.imageUrl && (
                                  <div className="w-24 sm:w-28 aspect-3/4 rounded-xl overflow-hidden bg-neutral-200 shrink-0 ml-2 shadow-sm border border-neutral-300/40">
                                    <img
                                      src={pCat.imageUrl}
                                      alt={pCat.name}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                  </div>
                                )}
                              </div>

                              {/* Card Footer Actions */}
                              <div className="mt-4 pt-3 border-t border-neutral-300/40 flex items-center justify-between">
                                <code className="text-[10px] font-mono text-neutral-600">
                                  /category/{pCat.slug}
                                </code>
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs bg-white/80 hover:bg-white rounded-md gap-1 cursor-pointer"
                                    onClick={() => openEditCategory(pCat)}
                                  >
                                    <Edit className="w-3 h-3" />
                                    <span>Edit</span>
                                  </Button>
                                  <button
                                    onClick={() => handleDeleteCategory(pCat.id, pCat.name)}
                                    className="p-1.5 text-neutral-500 hover:text-red-600 rounded-md hover:bg-white/80 transition-colors cursor-pointer"
                                    title="Delete Collection"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        )}

        {/* TAB 3: ORDERS */}
        {activeTab === "orders" && (() => {
          const rupees = (paise: number) => `₹${(paise / 100).toLocaleString("en-IN")}`;
          const STATUS: Record<string, { label: string; tone: string }> = {
            placed: { label: "New", tone: "bg-indigo-50 text-indigo-700" },
            confirmed: { label: "Confirmed", tone: "bg-sky-50 text-sky-700" },
            packed: { label: "Packed", tone: "bg-violet-50 text-violet-700" },
            shipped: { label: "Shipped", tone: "bg-amber-50 text-amber-800" },
            delivered: { label: "Delivered", tone: "bg-emerald-50 text-emerald-700" },
            cancelled: { label: "Cancelled", tone: "bg-rose-50 text-rose-700" },
          };
          const PAYMENT: Record<string, { label: string; tone: string }> = {
            awaiting_verification: { label: "Verify payment", tone: "bg-amber-50 text-amber-800" },
            verified: { label: "Paid", tone: "bg-emerald-50 text-emerald-700" },
            paid: { label: "Paid", tone: "bg-emerald-50 text-emerald-700" },
            cod_pending: { label: "Cash on delivery", tone: "bg-neutral-100 text-neutral-700" },
            rejected: { label: "Payment rejected", tone: "bg-rose-50 text-rose-700" },
          };
          const pill = (s?: { label: string; tone: string }) =>
            s ? <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${s.tone}`}>{s.label}</span> : null;
          const phoneDigits = (p: string) => p.replace(/[^0-9]/g, "");
          const itemCount = (x: OrderData) => x.items.reduce((n, i) => n + i.quantity, 0);
          // Saving tracking for an order that hasn't left yet also marks it shipped
          const toShipStatus = (s: OrderData["fulfilmentStatus"]): OrderData["fulfilmentStatus"] =>
            s === "placed" || s === "confirmed" || s === "packed" ? "shipped" : s;

          if (selectedOrder) {
            const o = selectedOrder;
            const steps = [
              { id: "confirmed" as const, label: "Confirmed", icon: Check },
              { id: "packed" as const, label: "Packed", icon: Package },
              { id: "shipped" as const, label: "Shipped", icon: Truck },
              { id: "delivered" as const, label: "Delivered", icon: CheckCircle2 },
            ];
            const reached = steps.findIndex((s) => s.id === o.fulfilmentStatus);
            const itemsTotal = o.items.reduce((acc, it) => acc + it.price * it.quantity, 0);
            const breakdown = [
              { label: "Items", value: o.subtotal || itemsTotal },
              ...(o.discount ? [{ label: "Discount", value: -o.discount }] : []),
              ...(o.delivery ? [{ label: "Delivery", value: o.delivery }] : []),
              ...(o.codFee ? [{ label: "COD fee", value: o.codFee }] : []),
            ];
            const card = "rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5";
            return (
              <div className="w-full min-w-0 space-y-4">
                {/* Header */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedOrder(null)}
                    aria-label="Back to orders"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-800 hover:border-neutral-900"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-lg font-semibold tracking-tight">Order {o.number}</h2>
                    <p className="truncate text-xs text-neutral-500">
                      {new Date(o.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}
                    </p>
                  </div>
                  <span className="shrink-0 text-lg font-semibold tabular-nums">{rupees(o.total)}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {pill(STATUS[o.fulfilmentStatus])}
                  {pill(PAYMENT[o.paymentStatus])}
                  <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-neutral-600">{o.paymentMethod === "cashfree" ? "online" : o.paymentMethod}</span>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                  <div className="min-w-0 space-y-4 lg:col-span-7">
                    {/* Progress */}
                    <div className={card}>
                      <h3 className="text-sm font-semibold">Progress</h3>
                      <p className="mt-0.5 text-xs text-neutral-500">Tap a step to update the buyer&apos;s tracking page.</p>
                      <div className="mt-4 grid grid-cols-4 gap-1">
                        {steps.map((s, i) => {
                          const done = o.fulfilmentStatus !== "cancelled" && i <= reached;
                          const lineDone = o.fulfilmentStatus !== "cancelled" && i <= reached;
                          return (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => handleUpdateOrderStatus(o.id, s.id)}
                              aria-pressed={o.fulfilmentStatus === s.id}
                              className="group relative flex min-w-0 flex-col items-center gap-1.5 !min-h-0"
                            >
                              {i > 0 && (
                                <span
                                  aria-hidden
                                  className={`absolute right-1/2 top-[17px] h-0.5 w-full ${lineDone ? "bg-neutral-900" : "bg-neutral-200"}`}
                                />
                              )}
                              <span
                                className={`relative z-10 flex h-9 w-9 items-center justify-center rounded-full border-2 transition-colors ${
                                  done ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-200 bg-white text-neutral-400 group-hover:border-neutral-400"
                                }`}
                              >
                                <s.icon className="h-4 w-4" />
                              </span>
                              <span className={`w-full truncate text-center text-[11px] ${done ? "font-semibold text-neutral-900" : "text-neutral-500"}`}>{s.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Items */}
                    <div className={card}>
                      <h3 className="text-sm font-semibold">Items ({itemCount(o)})</h3>
                      <ul className="mt-2 divide-y divide-neutral-100">
                        {o.items.map((item, idx) => (
                          <li key={idx} className="flex items-center gap-3 py-3">
                            {item.image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={item.image} alt="" className="h-14 w-12 shrink-0 rounded-lg border border-neutral-200 object-cover" />
                            ) : (
                              <span className="flex h-14 w-12 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-400">
                                <Package className="h-4 w-4" />
                              </span>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium">{item.title}</p>
                              <p className="truncate text-xs text-neutral-500">
                                {item.variantName ? `${item.variantName} · ` : ""}
                                {item.quantity} × {rupees(item.price)}
                              </p>
                            </div>
                            <span className="shrink-0 text-sm font-semibold tabular-nums">{rupees(item.price * item.quantity)}</span>
                          </li>
                        ))}
                      </ul>
                      <dl className="mt-1 space-y-1.5 border-t border-neutral-100 pt-3 text-sm">
                        {breakdown.map((r) => (
                          <div key={r.label} className="flex justify-between gap-3 text-neutral-600">
                            <dt>{r.label}</dt>
                            <dd className="tabular-nums">{r.value < 0 ? `−${rupees(-r.value)}` : rupees(r.value)}</dd>
                          </div>
                        ))}
                        <div className="flex justify-between gap-3 border-t border-neutral-100 pt-2 font-semibold">
                          <dt>Total</dt>
                          <dd className="tabular-nums">{rupees(o.total)}</dd>
                        </div>
                      </dl>
                    </div>
                  </div>

                  <div className="min-w-0 space-y-4 lg:col-span-5">
                    {/* Customer */}
                    <div className={card}>
                      <h3 className="text-sm font-semibold">Customer</h3>
                      <div className="mt-3 flex items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-sm font-semibold uppercase text-neutral-700">
                          {o.customer.name.charAt(0) || "?"}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{o.customer.name}</p>
                          <p className="truncate text-xs text-neutral-500">{o.customer.phone}</p>
                          {o.customer.email && <p className="truncate text-xs text-neutral-500">{o.customer.email}</p>}
                        </div>
                      </div>
                      <div className="mt-3 flex gap-2 rounded-xl bg-neutral-50 p-3 text-xs text-neutral-700">
                        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-400" />
                        <span className="min-w-0 break-words">
                          {[o.address.street, o.address.city, o.address.state, o.address.pincode].filter(Boolean).join(", ")}
                        </span>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <a
                          href={`tel:${o.customer.phone}`}
                          className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-neutral-200 text-xs font-semibold hover:border-neutral-900"
                        >
                          <Phone className="h-3.5 w-3.5" /> Call
                        </a>
                        <a
                          href={`https://wa.me/${phoneDigits(o.customer.phone)}?text=${encodeURIComponent(`Hello ${o.customer.name}, about your order ${o.number} from ${store.name}: `)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-[#25D366] text-xs font-semibold text-white hover:bg-[#20ba5a]"
                        >
                          <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                        </a>
                      </div>
                    </div>

                    {/* Payment */}
                    <div className={card}>
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-semibold">Payment</h3>
                        {pill(PAYMENT[o.paymentStatus])}
                      </div>
                      <dl className="mt-3 space-y-1.5 text-sm">
                        <div className="flex justify-between gap-3">
                          <dt className="text-neutral-500">Method</dt>
                          <dd className="font-medium">{o.paymentMethod === "cashfree" ? "Online (Cashfree)" : o.paymentMethod === "upi" ? "UPI" : o.paymentMethod === "cod" ? "Cash on delivery" : "Bank transfer"}</dd>
                        </div>
                        {o.paymentMethod !== "cod" && (
                          <div className="flex justify-between gap-3">
                            <dt className="shrink-0 text-neutral-500">{o.paymentMethod === "cashfree" ? "Cashfree payment ID" : "UTR / Ref"}</dt>
                            <dd className="min-w-0 truncate font-mono text-xs leading-5">{o.paymentUtr || "Not shared yet"}</dd>
                          </div>
                        )}
                      </dl>
                      {o.paymentMethod !== "cod" && o.paymentMethod !== "cashfree" && o.paymentStatus !== "paid" && o.paymentStatus !== "verified" && (
                        <button
                          type="button"
                          onClick={() => handleVerifyPayment(o.id)}
                          className="mt-3 h-10 w-full rounded-xl bg-neutral-950 text-sm font-semibold text-white hover:bg-black"
                        >
                          Mark as paid
                        </button>
                      )}
                    </div>

                    {/* Tracking */}
                    <div className={card}>
                      <h3 className="text-sm font-semibold">Courier & tracking</h3>
                      <div className="mt-3 space-y-2">
                        <Input
                          placeholder="Courier (e.g. Delhivery)"
                          value={courierNameInput}
                          onChange={(e) => setCourierNameInput(e.target.value)}
                          className="h-10 rounded-xl text-sm"
                        />
                        <Input
                          placeholder="Tracking (AWB) number"
                          value={trackingNumberInput}
                          onChange={(e) => setTrackingNumberInput(e.target.value)}
                          className="h-10 rounded-xl font-mono text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => handleUpdateOrderStatus(o.id, toShipStatus(o.fulfilmentStatus))}
                          className="h-10 w-full rounded-xl border border-neutral-200 text-sm font-semibold hover:border-neutral-900"
                        >
                          {toShipStatus(o.fulfilmentStatus) === "shipped" && o.fulfilmentStatus !== "shipped" ? "Save and mark shipped" : "Save tracking"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          }

          const toShip = (x: OrderData) => ["placed", "confirmed", "packed"].includes(x.fulfilmentStatus);
          const filters = [
            { id: "all" as const, label: "All", count: store.orders.length },
            { id: "toship" as const, label: "To ship", count: store.orders.filter(toShip).length },
            { id: "shipped" as const, label: "Shipped", count: store.orders.filter((x) => x.fulfilmentStatus === "shipped").length },
            { id: "delivered" as const, label: "Delivered", count: store.orders.filter((x) => x.fulfilmentStatus === "delivered").length },
          ];
          const list = [...store.orders]
            .filter(
              (x) =>
                orderFilter === "all" ||
                (orderFilter === "toship" && toShip(x)) ||
                (orderFilter === "shipped" && x.fulfilmentStatus === "shipped") ||
                (orderFilter === "delivered" && x.fulfilmentStatus === "delivered")
            )
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

          return (
            <div className="w-full min-w-0 space-y-4">
              <div>
                <h2 className="text-xl font-semibold tracking-tight">Orders</h2>
                <p className="text-xs text-neutral-500">
                  {filters[1].count > 0 ? `${filters[1].count} waiting to ship` : store.orders.length ? "Everything is shipped" : "Your orders will appear here"}
                </p>
              </div>

              {/* Filter: four equal segments, always fits the screen */}
              <div className="grid grid-cols-4 gap-1 rounded-2xl bg-neutral-100 p-1">
                {filters.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setOrderFilter(f.id)}
                    aria-pressed={orderFilter === f.id}
                    className={`flex min-w-0 flex-col items-center rounded-xl px-1 py-2 transition-all !min-h-0 ${
                      orderFilter === f.id ? "bg-white text-neutral-950 shadow-sm" : "text-neutral-500 hover:text-neutral-800"
                    }`}
                  >
                    <span className="text-base font-semibold tabular-nums leading-tight">{f.count}</span>
                    <span className="w-full truncate text-center text-[11px]">{f.label}</span>
                  </button>
                ))}
              </div>

              {store.orders.length === 0 ? (
                <div className="rounded-2xl border border-neutral-200 bg-white px-5 py-12 text-center">
                  <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-700">
                    <ShoppingBag className="h-6 w-6" />
                  </span>
                  <p className="mt-4 text-base font-semibold">No orders yet</p>
                  <p className="mx-auto mt-1 max-w-sm text-sm text-neutral-500">
                    Share your store link with buyers. New orders show up here the moment they&apos;re placed.
                  </p>
                  <div className="mt-5 grid grid-cols-1 gap-2 sm:mx-auto sm:max-w-sm sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={copyStoreLink}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-neutral-200 text-sm font-semibold hover:border-neutral-900"
                    >
                      {copiedLink ? <CheckCircle className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                      {copiedLink ? "Link copied" : "Copy store link"}
                    </button>
                    <button
                      type="button"
                      onClick={() => window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(`Shop our collection on ${store.name} 👉 ${storePublicUrl}`)}`, "_blank")}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-neutral-950 text-sm font-semibold text-white hover:bg-black"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Share on WhatsApp
                    </button>
                  </div>
                </div>
              ) : list.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-neutral-300 bg-white px-5 py-12 text-center text-sm text-neutral-500">
                  No orders in this view.
                </div>
              ) : (
                <ul className="overflow-hidden rounded-2xl border border-neutral-200 bg-white divide-y divide-neutral-100">
                  {list.map((order) => (
                    <li key={order.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setCourierNameInput(order.courierName || "");
                          setTrackingNumberInput(order.trackingNumber || "");
                          setSelectedOrder(order);
                        }}
                        className="flex w-full min-w-0 items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-neutral-50 active:bg-neutral-100 !min-h-0"
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-sm font-semibold uppercase text-neutral-700">
                          {order.customer.name.charAt(0) || "?"}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex min-w-0 items-center gap-2">
                            <span className="truncate text-sm font-semibold">{order.customer.name}</span>
                            {pill(STATUS[order.fulfilmentStatus])}
                          </span>
                          <span className="block truncate text-xs text-neutral-500">
                            {order.number} · {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} · {itemCount(order)} item{itemCount(order) === 1 ? "" : "s"}
                          </span>
                        </span>
                        <span className="flex shrink-0 flex-col items-end">
                          <span className="text-sm font-semibold tabular-nums">{rupees(order.total)}</span>
                          <span className="text-[10px] font-semibold uppercase text-neutral-400">{order.paymentMethod === "cashfree" ? "online" : order.paymentMethod}</span>
                        </span>
                        <ChevronRight className="h-4 w-4 shrink-0 text-neutral-300" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })()}

        {/* TAB 3.5: DISCOUNTS & COUPONS */}
        {activeTab === "discounts" && !canUseCoupons(store.planId) && (
          <div className="mt-6 animate-enter-blur">
            <LockedFeature
              title="Discount coupons"
              text="Create codes like WELCOME10 that buyers type at checkout to get money off."
              planLabel={unlockLabel("coupons")}
              ctaLabel={`Unlock with ${cheapestPlanWith("coupons")?.name ?? "an upgrade"}`}
              onUpgrade={() => { setActiveTab("billing"); scrollDashTop({ top: 0 }); }}
              perks={[
                { icon: Percent, title: "Percent or flat off", text: "10% off or ₹100 off, your choice" },
                { icon: ShoppingCart, title: "Minimum order rules", text: "Only works above an amount you set" },
                { icon: TrendingUp, title: "Bring buyers back", text: "Share codes on Instagram and WhatsApp" },
              ]}
              preview={
                <div className="mx-auto max-w-xs space-y-2.5">
                  {["10%", "₹100"].map((v) => (
                    <div key={v} className="flex overflow-hidden rounded-2xl bg-white/10">
                      <span className="flex w-20 items-center justify-center bg-amber-400/80 py-4 text-lg font-bold text-neutral-950">{v}</span>
                      <span className="flex-1 space-y-1.5 p-3">
                        <span className="block h-2 w-24 rounded bg-white/50" />
                        <span className="block h-2 w-32 rounded bg-white/25" />
                      </span>
                    </div>
                  ))}
                </div>
              }
            />
          </div>
        )}
        {activeTab === "discounts" && canUseCoupons(store.planId) && (
          isDiscountModalOpen ? (
            <div className="mt-6 space-y-6 animate-enter-scale">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-white border border-neutral-200 shadow-xs">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsDiscountModalOpen(false)}
                    className="p-2 rounded-lg border border-neutral-200 hover:bg-neutral-100 text-neutral-700 transition-colors cursor-pointer"
                    title="Back to Discounts"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div>
                    <h2 className="text-base font-bold text-neutral-900">
                      Create Discount Coupon
                    </h2>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Promotional codes entered by buyers at checkout to deduct percentage or flat discounts
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs rounded-lg cursor-pointer"
                    onClick={() => setIsDiscountModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="bg-[#111111] text-white hover:bg-black rounded-lg text-xs font-semibold px-4 cursor-pointer"
                    onClick={handleCreateDiscount}
                  >
                    Create Coupon
                  </Button>
                </div>
              </div>

              {/* Form Grid */}
              <form onSubmit={handleCreateDiscount} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7 space-y-6">
                  <div className="p-6 rounded-xl bg-white border border-neutral-200 shadow-xs space-y-4 text-xs">
                    <h3 className="font-bold text-sm text-neutral-900 border-b border-neutral-100 pb-3">Coupon Parameters</h3>

                    <div>
                      <label className="font-bold block mb-1">Coupon Code *</label>
                      <Input
                        placeholder="e.g. WELCOME10, FESTIVE50, SUMMER20"
                        value={dCode}
                        onChange={(e) => setDCode(e.target.value.toUpperCase())}
                        className="font-mono uppercase font-bold tracking-wider rounded-lg text-xs"
                        required
                      />
                      <p className="text-[11px] text-neutral-500 mt-1">
                        Code typed by buyers at checkout to unlock savings.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="font-bold block mb-1">Discount Type *</label>
                        <select
                          value={dType}
                          onChange={(e) => setDType(e.target.value as "percentage" | "flat")}
                          className="w-full p-2.5 rounded-lg border border-neutral-300 text-xs bg-white text-neutral-900 font-medium"
                        >
                          <option value="percentage">Percentage (%) Off</option>
                          <option value="flat">Flat Amount (₹) Off</option>
                        </select>
                      </div>

                      <div>
                        <label className="font-bold block mb-1">
                          {dType === "percentage" ? "Percentage (%):" : "Flat Value (₹):"} *
                        </label>
                        <Input
                          type="number"
                          placeholder={dType === "percentage" ? "10" : "100"}
                          value={dValue}
                          onChange={(e) => setDValue(e.target.value)}
                          className="rounded-lg text-xs"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-neutral-100">
                      <div>
                        <label className="font-bold block mb-1">Minimum Cart Total (₹)</label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={dMinOrder}
                          onChange={(e) => setDMinOrder(e.target.value)}
                          className="rounded-lg text-xs"
                        />
                        <p className="text-[10px] text-neutral-400 mt-0.5">Leave 0 for no minimum</p>
                      </div>

                      {dType === "percentage" && (
                        <div>
                          <label className="font-bold block mb-1">Max Discount Cap (₹)</label>
                          <Input
                            type="number"
                            placeholder="Optional cap"
                            value={dMaxDiscount}
                            onChange={(e) => setDMaxDiscount(e.target.value)}
                            className="rounded-lg text-xs"
                          />
                          <p className="text-[10px] text-neutral-400 mt-0.5">Ceiling on percentage savings</p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-neutral-100">
                      <input
                        type="checkbox"
                        id="d-active-checkbox-fullpage"
                        checked={dIsActive}
                        onChange={(e) => setDIsActive(e.target.checked)}
                        className="w-4 h-4 rounded text-black border-neutral-300 focus:ring-black"
                      />
                      <label htmlFor="d-active-checkbox-fullpage" className="font-semibold text-neutral-800 text-xs cursor-pointer">
                        Active immediately on storefront checkout
                      </label>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-5 space-y-6">
                  {/* Live Coupon Badge Preview */}
                  <div className="p-6 rounded-xl bg-white border border-neutral-200 shadow-xs space-y-4 text-xs">
                    <h3 className="font-bold text-sm text-neutral-900 border-b border-neutral-100 pb-3">Checkout Badge Preview</h3>
                    <p className="text-neutral-500 text-[11px]">How buyers will see this discount tag at checkout:</p>

                    <div className="p-5 rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50/50 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-black text-sm px-3 py-1 bg-neutral-950 text-white rounded-md tracking-wider">
                          {dCode || "PROMOCODE"}
                        </span>
                        <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                          {dType === "percentage" ? `${dValue || "10"}% OFF` : `₹${dValue || "100"} FLAT OFF`}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-600">
                        {dMinOrder && Number(dMinOrder) > 0 ? `Valid on orders above ₹${dMinOrder}.` : "Valid on all orders."}{" "}
                        {dMaxDiscount && Number(dMaxDiscount) > 0 ? `Maximum discount capped at ₹${dMaxDiscount}.` : ""}
                      </p>
                    </div>

                    <div className="pt-2">
                      <Button
                        type="submit"
                        className="w-full bg-[#111111] text-white hover:bg-black rounded-lg text-xs font-bold py-3 cursor-pointer"
                      >
                        Create Discount Coupon
                      </Button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          ) : (
            <div className="space-y-5 animate-enter-blur">
              {(() => {
                const all = store.discounts || [];
                const openNew = (preset?: { code: string; type: "percentage" | "flat"; value: string; min: string }) => {
                  setDCode(preset?.code || "");
                  setDType(preset?.type || "percentage");
                  setDValue(preset?.value || "");
                  setDMinOrder(preset?.min || "");
                  setDMaxDiscount("");
                  setDIsActive(true);
                  setIsDiscountModalOpen(true);
                };
                return (
                  <>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: "Active", value: all.filter((d) => d.isActive).length, dot: "bg-emerald-500" },
                        { label: "Paused", value: all.filter((d) => !d.isActive).length, dot: "bg-neutral-400" },
                        { label: "Times used", value: all.reduce((n, d) => n + (d.timesUsed || 0), 0), dot: "bg-amber-500" },
                      ].map((t) => (
                        <div key={t.label} className="rounded-2xl border border-neutral-200 bg-white p-4">
                          <span className="flex items-center gap-2 text-xs text-neutral-500">
                            <span className={`w-1.5 h-1.5 rounded-full ${t.dot}`} />
                            {t.label}
                          </span>
                          <span className="mt-1.5 block text-2xl font-semibold tracking-tight tabular-nums">{t.value}</span>
                        </div>
                      ))}
                    </div>

                    {all.length === 0 ? (
                      <div className="rounded-2xl border border-neutral-200 bg-white px-6 py-12 text-center">
                        <span className="mx-auto w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                          <Percent className="w-6 h-6" />
                        </span>
                        <p className="mt-4 text-base font-semibold">Create your first coupon</p>
                        <p className="mt-1 text-sm text-neutral-500 max-w-sm mx-auto">Pick a ready-made one or make your own. Buyers enter the code at checkout.</p>
                        <div className="mt-6 grid gap-3 sm:grid-cols-2 max-w-lg mx-auto text-left">
                          {[
                            { code: "WELCOME10", line: "10% off orders over ₹500", type: "percentage" as const, value: "10", min: "500" },
                            { code: "FLAT100", line: "₹100 off orders over ₹999", type: "flat" as const, value: "100", min: "999" },
                          ].map((p) => (
                            <button
                              key={p.code}
                              type="button"
                              onClick={() => openNew(p)}
                              className="group flex items-center gap-3 rounded-2xl border border-dashed border-amber-300 bg-amber-50/50 p-3 hover:bg-amber-50 transition-colors"
                            >
                              <span className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
                                <Tag className="w-4 h-4" />
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block font-mono text-sm font-bold tracking-wider">{p.code}</span>
                                <span className="block text-xs text-neutral-600">{p.line}</span>
                              </span>
                              <Plus className="w-4 h-4 text-amber-700 transition-transform group-hover:rotate-90" />
                            </button>
                          ))}
                        </div>
                        <button type="button" onClick={() => openNew()} className="mt-4 text-sm font-semibold underline underline-offset-4">
                          Create a custom code
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => openNew()}
                            className="h-11 px-5 rounded-xl bg-neutral-950 text-white text-sm font-semibold inline-flex items-center gap-2 hover:bg-black"
                          >
                            <Plus className="w-4 h-4" />
                            New coupon
                          </button>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                          {all.map((discount) => (
                            <div
                              key={discount.id}
                              className={`relative flex overflow-hidden rounded-2xl border bg-white transition-opacity ${discount.isActive ? "border-neutral-200" : "border-neutral-200 opacity-70"}`}
                            >
                              {/* value stub */}
                              <div className={`w-28 shrink-0 flex flex-col items-center justify-center text-center px-2 py-4 ${discount.isActive ? "bg-amber-500 text-white" : "bg-neutral-200 text-neutral-600"}`}>
                                <span className="text-2xl font-bold leading-none">
                                  {discount.type === "percentage" ? `${discount.value}%` : `₹${(discount.value / 100).toLocaleString("en-IN")}`}
                                </span>
                                <span className="mt-1 text-[10px] font-semibold uppercase tracking-wider opacity-90">off</span>
                              </div>
                              {/* perforation */}
                              <span aria-hidden className="relative w-0 border-l-2 border-dashed border-neutral-200">
                                <span className="absolute -top-2 -left-[9px] w-4 h-4 rounded-full bg-[#FAFAFA] border border-neutral-200" />
                                <span className="absolute -bottom-2 -left-[9px] w-4 h-4 rounded-full bg-[#FAFAFA] border border-neutral-200" />
                              </span>
                              <div className="min-w-0 flex-1 p-4">
                                <div className="flex items-start justify-between gap-2">
                                  <span className="font-mono text-sm font-bold tracking-wider truncate">{discount.code}</span>
                                  <button
                                    type="button"
                                    role="switch"
                                    aria-checked={discount.isActive}
                                    aria-label={discount.isActive ? "Pause coupon" : "Activate coupon"}
                                    onClick={() => handleToggleDiscount(discount.id)}
                                    style={{ minHeight: 0, height: 20 }}
                                    className={`relative w-9 shrink-0 rounded-full transition-colors ${discount.isActive ? "bg-emerald-500" : "bg-neutral-300"}`}
                                  >
                                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${discount.isActive ? "left-[18px]" : "left-0.5"}`} />
                                  </button>
                                </div>
                                <p className="mt-1 text-xs text-neutral-500">
                                  {discount.minOrderValue && discount.minOrderValue > 0
                                    ? `On orders over ₹${(discount.minOrderValue / 100).toLocaleString("en-IN")}`
                                    : "No minimum order"}
                                  {discount.maxDiscount ? ` · up to ₹${(discount.maxDiscount / 100).toLocaleString("en-IN")}` : ""}
                                </p>
                                <div className="mt-3 flex items-center justify-between">
                                  <span className="text-[11px] text-neutral-500">
                                    Used {discount.timesUsed || 0} time{(discount.timesUsed || 0) === 1 ? "" : "s"} · {discount.isActive ? "Active" : "Paused"}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteDiscount(discount.id, discount.code)}
                                    aria-label={`Delete ${discount.code}`}
                                    className="w-8 h-8 rounded-[10px] flex items-center justify-center text-neutral-400 hover:bg-red-50 hover:text-red-600"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </>
                );
              })()}
            </div>
        )
      )}

        {/* TAB 4: CUSTOMERS */}
        {activeTab === "customers" && (
          <div className="space-y-5 animate-enter-blur">
            {(() => {
              const all = store.customers || [];
              const q = customerSearch.trim().toLowerCase();
              const list = all.filter((c) => !q || c.name.toLowerCase().includes(q) || c.phone.includes(q) || (c.email || "").toLowerCase().includes(q));
              const tones = ["bg-indigo-100 text-indigo-700", "bg-emerald-100 text-emerald-700", "bg-amber-100 text-amber-800", "bg-rose-100 text-rose-700", "bg-sky-100 text-sky-700", "bg-violet-100 text-violet-700"];
              const initials = (n: string) => n.split(" ").map((w) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() || "?";
              return (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Customers", value: all.length.toLocaleString("en-IN"), dot: "bg-indigo-500" },
                      { label: "Repeat", value: all.filter((c) => c.totalOrders > 1).length.toLocaleString("en-IN"), dot: "bg-emerald-500" },
                      { label: "Total spent", value: `₹${Math.round(all.reduce((n, c) => n + c.totalSpent, 0) / 100).toLocaleString("en-IN")}`, dot: "bg-amber-500" },
                    ].map((t) => (
                      <div key={t.label} className="rounded-2xl border border-neutral-200 bg-white p-4 min-w-0">
                        <span className="flex items-center gap-2 text-xs text-neutral-500">
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${t.dot}`} />
                          <span className="truncate">{t.label}</span>
                        </span>
                        <span className="mt-1.5 block text-xl sm:text-2xl font-semibold tracking-tight tabular-nums truncate">{t.value}</span>
                      </div>
                    ))}
                  </div>

                  {all.length === 0 ? (
                    <div className="rounded-2xl border border-neutral-200 bg-white px-6 py-14 text-center">
                      <span className="mx-auto w-14 h-14 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center">
                        <Users className="w-6 h-6" />
                      </span>
                      <p className="mt-4 text-base font-semibold">No customers yet</p>
                      <p className="mt-1 text-sm text-neutral-500 max-w-sm mx-auto">
                        Everyone who orders from your store is added here, with their contact details and what they&apos;ve spent.
                      </p>
                      <button
                        type="button"
                        onClick={copyStoreLink}
                        className="mt-5 h-10 px-4 rounded-xl bg-neutral-950 text-white text-sm font-semibold inline-flex items-center gap-2 hover:bg-black"
                      >
                        {copiedLink ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {copiedLink ? "Link copied" : "Copy store link"}
                      </button>
                    </div>
                  ) : (
                    <>
                      <label className="flex items-center gap-2 h-11 px-3.5 rounded-xl border border-neutral-200 bg-white focus-within:border-neutral-900 transition-colors">
                        <Search className="w-4 h-4 text-neutral-400 shrink-0" />
                        <input
                          value={customerSearch}
                          onChange={(e) => setCustomerSearch(e.target.value)}
                          placeholder="Search by name, phone or email"
                          className="w-full bg-transparent text-sm outline-none"
                        />
                      </label>
                      {list.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-neutral-300 bg-white px-6 py-12 text-center text-sm text-neutral-500">
                          No customers match &ldquo;{customerSearch}&rdquo;.
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-neutral-200 bg-white divide-y divide-neutral-100 overflow-hidden">
                          {list.map((cust, i) => (
                            <div key={cust.id} className="p-4 sm:px-5 flex items-center gap-3 hover:bg-neutral-50/70 transition-colors">
                              <span className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 ${tones[i % tones.length]}`}>
                                {initials(cust.name)}
                              </span>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold truncate">{cust.name}</span>
                                  {cust.totalOrders > 1 && (
                                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 shrink-0">Repeat</span>
                                  )}
                                </div>
                                <p className="text-xs text-neutral-500 truncate">
                                  {cust.phone}
                                  {cust.email ? ` · ${cust.email}` : ""}
                                </p>
                                <p className="text-[11px] text-neutral-400">
                                  {cust.totalOrders} order{cust.totalOrders === 1 ? "" : "s"}
                                  {cust.lastOrderAt ? ` · last on ${new Date(cust.lastOrderAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}` : ""}
                                </p>
                              </div>
                              <span className="text-sm font-semibold tabular-nums shrink-0">₹{(cust.totalSpent / 100).toLocaleString("en-IN")}</span>
                              <div className="hidden sm:flex items-center gap-1.5">
                                <a
                                  href={`https://wa.me/${cust.phone.replace(/[^0-9]/g, "")}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  aria-label={`WhatsApp ${cust.name}`}
                                  className="w-9 h-9 rounded-[10px] border border-neutral-200 flex items-center justify-center text-emerald-600 hover:border-emerald-300 hover:bg-emerald-50"
                                >
                                  <MessageCircle className="w-4 h-4" />
                                </a>
                                <a
                                  href={`tel:${cust.phone}`}
                                  aria-label={`Call ${cust.name}`}
                                  className="w-9 h-9 rounded-[10px] border border-neutral-200 flex items-center justify-center text-neutral-600 hover:border-neutral-900"
                                >
                                  <Phone className="w-4 h-4" />
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </>
              );
            })()}
          </div>
        )}

        {/* TAB 5: REVIEWS */}
        {activeTab === "reviews" && (
          <div className="mt-6 space-y-6 animate-enter-blur">
            {!canUseReviews(store.planId) ? (
              <LockedFeature
                title="Customer reviews"
                text="Let buyers rate what they bought. Star ratings build trust and help new visitors decide."
                planLabel={unlockLabel("reviews")}
                ctaLabel={`Unlock with ${cheapestPlanWith("reviews")?.name ?? "an upgrade"}`}
                onUpgrade={() => { setActiveTab("billing"); scrollDashTop({ top: 0 }); }}
                perks={[
                  { icon: Star, title: "Stars on every product", text: "Ratings show right on your product cards" },
                  { icon: ShieldCheck, title: "You approve first", text: "Hide or delete a review before it goes live" },
                  { icon: TrendingUp, title: "More sales", text: "Shoppers buy more from stores with reviews" },
                ]}
                preview={
                  <div className="mx-auto max-w-sm space-y-2.5">
                    {[0, 1, 2].map((k) => (
                      <div key={k} className="flex items-center gap-3 rounded-2xl bg-white/10 p-3">
                        <span className="h-9 w-9 shrink-0 rounded-full bg-white/25" />
                        <span className="flex-1 space-y-1.5">
                          <span className="block h-2 w-20 rounded bg-white/50" />
                          <span className="block h-2 w-36 rounded bg-white/25" />
                        </span>
                        <span className="flex gap-0.5 text-amber-400">
                          {[0, 1, 2, 3, 4].map((x) => (
                            <Star key={x} className="h-3 w-3 fill-current" />
                          ))}
                        </span>
                      </div>
                    ))}
                  </div>
                }
              />
            ) : (
              <div className="p-6 rounded-lg bg-white border border-neutral-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-neutral-900">
                      Customer Reviews Moderation ({store.reviews.length})
                    </h3>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Verified reviews and ratings displayed on product detail pages and product cards.
                    </p>
                  </div>
                  <Badge variant="success" className="text-[10px]">
                    Paid Plan Active
                  </Badge>
                </div>

                {store.reviews.length === 0 ? (
                  <div className="p-8 text-center text-xs text-neutral-500">
                    No customer reviews yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {store.reviews.map((rev) => (
                      <div
                        key={rev.id}
                        className="p-4 rounded-md bg-neutral-50 border border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-neutral-900">{rev.customerName}</span>
                            <div className="flex text-amber-500">
                              {Array.from({ length: rev.rating }).map((_, i) => (
                                <Star key={i} className="w-3 h-3 fill-amber-500" />
                              ))}
                            </div>
                            <Badge variant="neutral" className="text-[10px] uppercase">
                              {rev.status}
                            </Badge>
                          </div>
                          {rev.title && <p className="text-xs font-semibold text-neutral-900 mt-1">{rev.title}</p>}
                          <p className="text-xs text-neutral-600 mt-0.5">{rev.comment}</p>
                        </div>

                        <div className="flex items-center gap-2">
                          {rev.status !== "approved" ? (
                            <Button
                              size="sm"
                              className="text-xs h-7 bg-[#111111] text-white hover:bg-black rounded-md"
                              onClick={() => {
                                storeService.updateReviewStatus(store.subdomain, rev.id, "approved");
                                refreshStore();
                              }}
                            >
                              Approve
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs h-7 rounded-md"
                              onClick={() => {
                                storeService.updateReviewStatus(store.subdomain, rev.id, "pending");
                                refreshStore();
                              }}
                            >
                              Hide
                            </Button>
                          )}
                          <button
                            onClick={() => {
                              storeService.deleteReview(store.subdomain, rev.id);
                              refreshStore();
                            }}
                            className="p-1.5 text-neutral-400 hover:text-red-600 rounded-md"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 6: BANNERS */}
        {activeTab === "banners" && (
          isBannerModalOpen ? (
            <div className="mt-6 space-y-6 animate-enter-scale">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-white border border-neutral-200 shadow-xs">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsBannerModalOpen(false)}
                    className="p-2 rounded-lg border border-neutral-200 hover:bg-neutral-100 text-neutral-700 transition-colors cursor-pointer"
                    title="Back to Banners"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div>
                    <h2 className="text-base font-bold text-neutral-900">
                      Add Banner
                    </h2>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Promotional banner displayed at the top of your storefront homepage.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs rounded-lg cursor-pointer"
                    onClick={() => setIsBannerModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="bg-[#111111] text-white hover:bg-black rounded-lg text-xs font-semibold px-4 cursor-pointer"
                    onClick={handleSaveBanner}
                  >
                    Save Banner
                  </Button>
                </div>
              </div>

              {/* Form Grid */}
              <form onSubmit={handleSaveBanner} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7 space-y-6">
                  {/* Image input card */}
                  <div className="p-6 rounded-xl bg-white border border-neutral-200 shadow-xs space-y-4 text-xs">
                    <h3 className="font-bold text-sm text-neutral-900 border-b border-neutral-100 pb-3">
                      Banner Image *
                    </h3>
                    <p className="text-[11px] text-neutral-500">
                      Recommended size: 1800×600 px (wide landscape).
                    </p>

                    <div className="flex gap-2">
                      <Input
                        placeholder="Paste banner image URL (or upload from device)..."
                        value={bImageUrl}
                        onChange={(e) => setBImageUrl(e.target.value)}
                        required
                        className="text-xs rounded-lg"
                      />
                      <label className="shrink-0">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                if (event.target?.result) setBImageUrl(event.target.result as string);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                        <Button type="button" variant="outline" size="md" className="cursor-pointer gap-1.5 text-xs rounded-lg">
                          <UploadCloud className="w-3.5 h-3.5" />
                          <span>Upload</span>
                        </Button>
                      </label>
                    </div>

                    {/* Quick Presets */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      <span className="text-[10px] text-neutral-400 font-medium">Quick presets:</span>
                      <button
                        type="button"
                        onClick={() => setBImageUrl("https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1800&q=80")}
                        className="text-[10px] px-2 py-0.5 rounded border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 cursor-pointer"
                      >
                        Editorial Lifestyle
                      </button>
                      <button
                        type="button"
                        onClick={() => setBImageUrl("https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1800&q=80")}
                        className="text-[10px] px-2 py-0.5 rounded border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 cursor-pointer"
                      >
                        Streetwear & Hoodies
                      </button>
                      <button
                        type="button"
                        onClick={() => setBImageUrl("https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=1800&q=80")}
                        className="text-[10px] px-2 py-0.5 rounded border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 cursor-pointer"
                      >
                        Denim & Trousers
                      </button>
                    </div>

                    {/* Live Banner Panoramic Preview */}
                    {bImageUrl && (
                      <div className="mt-4 rounded-xl overflow-hidden border border-neutral-200 bg-neutral-100">
                        <div className="relative aspect-[2.8/1] w-full overflow-hidden">
                          <img src={bImageUrl} alt="Banner Preview" className="w-full h-full object-cover" />
                        </div>
                        <div className="p-3 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between text-xs text-neutral-600">
                          <span className="font-semibold">Storefront Hero Banner Preview</span>
                          <span className="text-emerald-700 font-bold">Edge-to-Edge Display</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="lg:col-span-5 space-y-6">
                  {/* Destination Card */}
                  <div className="p-6 rounded-xl bg-white border border-neutral-200 shadow-xs space-y-4 text-xs">
                    <h3 className="font-bold text-sm text-neutral-900 border-b border-neutral-100 pb-3">
                      Destination Link *
                    </h3>
                    <p className="text-[11px] text-neutral-500">
                      Where shoppers go when clicking this banner.
                    </p>

                    <select
                      value={bTargetType}
                      onChange={(e) => {
                        setBTargetType(e.target.value as any);
                        setBSearchQuery("");
                      }}
                      className="w-full p-2.5 rounded-lg border border-neutral-300 text-xs text-neutral-900 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-black"
                      required
                    >
                      <option value="">-- Choose Destination --</option>
                      <option value="category">Category Page</option>
                      <option value="product">Product Page</option>
                    </select>

                    {bTargetType === "category" && (
                      <div className="p-3.5 rounded-lg border border-neutral-200 bg-neutral-50/70 space-y-2.5">
                        <span className="font-bold text-neutral-800 text-xs block">
                          Select Category: {bSelectedCategory && <Badge variant="success" className="ml-1">{bSelectedCategory}</Badge>}
                        </span>
                        <div className="max-h-40 overflow-y-auto space-y-1 border border-neutral-200 rounded-lg bg-white p-1">
                          {filteredCategories.map((cat) => (
                            <div
                              key={cat}
                              onClick={() => setBSelectedCategory(cat)}
                              className={`flex items-center justify-between px-3 py-2 rounded-md cursor-pointer text-xs ${
                                bSelectedCategory.toLowerCase() === cat.toLowerCase()
                                  ? "bg-black text-white font-bold"
                                  : "hover:bg-neutral-100 text-neutral-800"
                              }`}
                            >
                              <span>{cat}</span>
                              <span className="text-[10px] text-neutral-400">
                                {store.products.filter((p) => p.category.toLowerCase() === cat.toLowerCase()).length} items
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {bTargetType === "product" && (
                      <div className="p-3.5 rounded-lg border border-neutral-200 bg-neutral-50/70 space-y-2.5">
                        <span className="font-bold text-neutral-800 text-xs block">
                          Select Product: {bSelectedProduct && <Badge variant="success" className="ml-1">{bSelectedProduct.title}</Badge>}
                        </span>
                        <div className="max-h-48 overflow-y-auto space-y-1 border border-neutral-200 rounded-lg bg-white p-1">
                          {filteredProducts.map((p) => {
                            const isSelected = bSelectedProduct?.id === p.id;
                            return (
                              <div
                                key={p.id}
                                onClick={() => setBSelectedProduct(p)}
                                className={`flex items-center justify-between p-2 rounded-md cursor-pointer text-xs ${
                                  isSelected ? "bg-black text-white" : "hover:bg-neutral-100 text-neutral-800"
                                }`}
                              >
                                <div className="flex items-center gap-2 truncate">
                                  <img src={p.images[0]} alt={p.title} className="w-7 h-7 rounded object-cover shrink-0" />
                                  <span className="truncate">{p.title}</span>
                                </div>
                                {isSelected && <Check className="w-3.5 h-3.5 text-white shrink-0 ml-1" />}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="pt-2">
                      <Button
                        type="submit"
                        className="w-full bg-[#111111] text-white hover:bg-black rounded-lg text-xs font-bold py-3 cursor-pointer"
                      >
                        Save Carousel Banner
                      </Button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          ) : (
            <div className="mt-6 space-y-4 animate-enter-blur">
              {(() => {
                const banners = store.banners;
                const live = banners.filter((b) => b.isActive).length;
                const openNewBanner = () => {
                  setBImageUrl("");
                  setBTargetType("");
                  setBSelectedCategory("");
                  setBSelectedProduct(null);
                  setBSearchQuery("");
                  setIsBannerModalOpen(true);
                };
                return banners.length === 0 ? (
                  <button
                    type="button"
                    onClick={openNewBanner}
                    className="group w-full aspect-[2/1] sm:aspect-[3.2/1] rounded-2xl border-2 border-dashed border-neutral-300 bg-white flex flex-col items-center justify-center gap-2 px-6 text-center hover:border-neutral-400 hover:bg-neutral-50 transition-colors"
                  >
                    <span className="w-12 h-12 rounded-2xl bg-neutral-100 flex items-center justify-center transition-transform group-hover:scale-105">
                      <ImageIcon className="w-5 h-5 text-neutral-500" />
                    </span>
                    <span className="text-sm font-semibold">Add your first banner</span>
                    <span className="text-xs text-neutral-500">It slides at the top of your store&apos;s homepage</span>
                  </button>
                ) : (
                  <>
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm text-neutral-500">
                        <span className="font-semibold text-neutral-900">{live} live</span> · {banners.length} total
                      </p>
                      <button
                        type="button"
                        onClick={openNewBanner}
                        className="h-11 px-5 rounded-xl bg-neutral-950 text-white text-sm font-semibold inline-flex items-center gap-2 hover:bg-black"
                      >
                        <Plus className="w-4 h-4" />
                        Add banner
                      </button>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {banners.map((b, idx) => {
                        const dest =
                          b.targetType === "category" ? `Category · ${b.targetValue}`
                          : b.targetType === "product" ? `Product · ${b.targetValue}`
                          : b.ctaLink || "No link";
                        return (
                          <div
                            key={b.id}
                            className={`overflow-hidden rounded-2xl border border-neutral-200 bg-white transition-opacity ${b.isActive ? "" : "opacity-75"}`}
                          >
                            <div className="relative aspect-[2.4/1] bg-neutral-100">
                              <img
                                src={b.imageUrl}
                                alt={b.title || "Banner"}
                                className={`w-full h-full object-cover transition-[filter] ${b.isActive ? "" : "grayscale"}`}
                              />
                              <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/90 backdrop-blur px-2.5 py-1 text-[11px] font-semibold">
                                <span className={`w-1.5 h-1.5 rounded-full ${b.isActive ? "bg-emerald-500" : "bg-neutral-400"}`} />
                                {b.isActive ? "Live" : "Paused"}
                              </span>
                              <span className="absolute right-3 top-3 rounded-full bg-neutral-950/70 text-white px-2 py-1 text-[11px] font-semibold tabular-nums">
                                {idx + 1}/{banners.length}
                              </span>
                            </div>
                            <div className="p-4">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold truncate">{b.title || "Storefront banner"}</p>
                                  <p className="mt-1 flex items-center gap-1.5 text-xs text-neutral-500">
                                    <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                                    <span className="truncate">{dest}</span>
                                  </p>
                                </div>
                                <button
                    type="button"
                    role="switch"
                    aria-checked={b.isActive}
                    aria-label="Show banner on store"
                    onClick={() => handleToggleBannerActive(b.id)}
                    style={{ minHeight: 0, height: 24 }}
                    className={`relative w-11 shrink-0 rounded-full transition-colors ${b.isActive ? "bg-emerald-500" : "bg-neutral-300"}`}
                  >
                    <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${b.isActive ? "left-[22px]" : "left-0.5"}`} />
                  </button>
                              </div>
                              <div className="mt-4 flex items-center gap-1 border-t border-neutral-100 pt-3">
                                <button
                                  type="button"
                                  disabled={idx === 0}
                                  onClick={() => handleMoveBanner(idx, "up")}
                                  style={{ minHeight: 0 }}
                                  className="w-9 h-9 rounded-lg flex items-center justify-center text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 disabled:opacity-30 disabled:hover:bg-transparent"
                                  aria-label="Move banner earlier"
                                >
                                  <ChevronUp className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  disabled={idx === banners.length - 1}
                                  onClick={() => handleMoveBanner(idx, "down")}
                                  style={{ minHeight: 0 }}
                                  className="w-9 h-9 rounded-lg flex items-center justify-center text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 disabled:opacity-30 disabled:hover:bg-transparent"
                                  aria-label="Move banner later"
                                >
                                  <ChevronDown className="w-4 h-4" />
                                </button>
                                <span className="flex-1" />
                                {b.ctaLink && (
                                  <Link
                                    href={b.ctaLink}
                                    target="_blank"
                                    style={{ minHeight: 0 }}
                                    className="h-9 px-3 rounded-lg inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-100"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    Test link
                                  </Link>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleDeleteBanner(b.id)}
                                  style={{ minHeight: 0 }}
                                  className="w-9 h-9 rounded-lg flex items-center justify-center text-neutral-400 hover:bg-red-50 hover:text-red-600"
                                  aria-label="Delete banner"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                );
              })()}
          </div>
        )
      )}

        {/* TAB 7: THEMES & STOREFRONT DESIGN */}
        {activeTab === "themes" && (() => {
          const editorOn = canUseThemeEditor(store.planId);
          const editorPlan = cheapestPlanWith("themeEditor");
          const activeSlug = getTheme(store.activeThemeSlug).slug;
          // the live theme came with a plan that has lapsed: the shop shows the free default until renewed or bought
          const lapsed = !canUseTheme(store, activeSlug);
          return (
            <div className="mt-6 space-y-6 animate-enter-blur">
              {lapsed && (
                <div className="p-4 rounded-2xl border border-neutral-900 bg-white flex flex-col sm:flex-row sm:items-center gap-3">
                  <Lock className="w-5 h-5 shrink-0" />
                  <p className="text-sm text-neutral-700 flex-1">
                    <b className="text-neutral-950">{getTheme(activeSlug).name}</b> came with your plan
                    {store.planPaidUntil ? `, which ended on ${new Date(store.planPaidUntil).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}` : ""}. Your shop
                    shows Mono Studio until you renew or buy it.
                  </p>
                  <div className="flex gap-2 shrink-0">
                    <button type="button" onClick={() => setActiveTab("billing")} className="h-9 px-3.5 rounded-xl border border-neutral-300 text-xs font-semibold hover:border-black">
                      Renew plan
                    </button>
                    {getThemePrice(activeSlug) > 0 && (
                      <button type="button" onClick={() => setThemeToBuy(activeSlug)} className="h-9 px-3.5 rounded-xl bg-black text-white text-xs font-semibold hover:bg-neutral-800">
                        Buy for {formatThemePrice(getThemePrice(activeSlug))}
                      </button>
                    )}
                  </div>
                </div>
              )}
              {themeAppliedToast && (
                <div className="p-4 rounded-2xl bg-neutral-900 text-white text-sm flex items-center justify-between gap-4 shadow-lg animate-in fade-in slide-in-from-top-2">
                  <span className="flex items-center gap-2.5 font-semibold">
                    <Check className="w-4 h-4 text-emerald-400" /> {themeAppliedToast} is now your live theme
                  </span>
                  <Link href={liveStoreUrl} target="_blank" className="shrink-0 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold flex items-center gap-1.5">
                    View shop <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              )}

              <div>
                <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-neutral-950">Themes</h2>
                <p className="text-sm text-neutral-500 mt-1">
                  Pick the look of your shop. Buy a theme once to keep and edit it on any plan{editorOn ? ", and edit every theme you use in the editor." : ", or upgrade for more themes and the editor."}
                </p>
              </div>

              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {allThemes.map((theme) => {
                  const isCurrent = activeSlug === theme.slug;
                  const price = getThemePrice(theme.slug);
                  const owned = ownsTheme(store, theme.slug);
                  const usable = canUseTheme(store, theme.slug);
                  const editable = canEditTheme(store, theme.slug);
                  const latest = store.themePurchases?.find((p) => p.themeSlug === theme.slug);
                  const checking = latest?.status === "pending_verification";
                  const refused = latest?.status === "rejected" && latest.note !== "Cancelled by seller" ? latest : null;
                  const tag = owned ? "Owned" : price === 0 ? "Free" : planIncludesTheme(store, theme.slug) ? "With your plan" : formatThemePrice(price);
                  return (
                    <div
                      key={theme.slug}
                      className={`rounded-3xl overflow-hidden bg-white border flex flex-col ${isCurrent ? "border-black ring-2 ring-black" : "border-neutral-200"}`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          window.location.href = getStoreUrl(store.subdomain, `?preview_theme=${theme.slug}`);
                        }}
                        className="relative aspect-[16/10] w-full overflow-hidden bg-neutral-100 group"
                        aria-label={`Preview ${theme.name}`}
                      >
                        <img src={theme.previewImage} alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                        {isCurrent && (
                          <span className="absolute top-3 left-3 inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white text-black shadow-sm">
                            <Check className="w-3 h-3" /> Live
                          </span>
                        )}
                        <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-full bg-black/75 text-white backdrop-blur">
                          <Eye className="w-3.5 h-3.5" /> Preview
                        </span>
                        <span className="absolute top-3 right-3 inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white text-black shadow-sm">
                          {!usable && <Lock className="w-3 h-3" />}
                          {tag}
                        </span>
                      </button>
                      <div className="p-5 flex-1 flex flex-col">
                        <div className="flex items-center justify-between gap-3">
                          <h3 className="text-base font-semibold text-neutral-950">{theme.name}</h3>
                          <span className="flex gap-1">
                            {theme.previewColors.map((c) => (
                              <span key={c} className="w-3.5 h-3.5 rounded-full border border-neutral-200" style={{ backgroundColor: c }} />
                            ))}
                          </span>
                        </div>
                        <p className="text-[13px] text-neutral-500 mt-1.5 leading-relaxed flex-1">{theme.description}</p>
                        {refused && <p className="mt-2 text-[12px] text-red-600">Payment not verified: {refused.note}</p>}
                        <div className="mt-4 flex gap-2">
                          {!usable ? (
                            checking ? (
                              <button type="button" onClick={() => setThemeToBuy(theme.slug)} className="h-10 px-4 rounded-xl bg-neutral-100 text-[13px] font-semibold text-neutral-700 flex items-center gap-1.5">
                                <Clock className="w-4 h-4" /> Checking payment
                              </button>
                            ) : (
                              <button type="button" onClick={() => setThemeToBuy(theme.slug)} className="h-10 px-4 rounded-xl bg-black text-white text-[13px] font-semibold hover:bg-neutral-800">
                                Buy for {formatThemePrice(price)}
                              </button>
                            )
                          ) : isCurrent ? (
                            <span className="h-10 px-4 rounded-xl bg-neutral-100 text-[13px] font-semibold text-neutral-700 flex items-center gap-1.5">
                              <CheckCircle className="w-4 h-4 text-emerald-600" /> Live theme
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleActivateTheme(theme.slug)}
                              className="h-10 px-4 rounded-xl bg-black text-white text-[13px] font-semibold hover:bg-neutral-800"
                            >
                              Make live
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => router.push(`/dashboard/editor?store=${store.subdomain}&theme=${theme.slug}`)}
                            className="h-10 px-4 rounded-xl border border-neutral-300 text-[13px] font-semibold text-neutral-900 hover:border-black flex items-center gap-1.5"
                          >
                            {editable ? <SlidersHorizontal className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                            Edit website
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {!editorOn && (
                <div className="p-5 rounded-2xl bg-white border border-neutral-200 flex flex-col sm:flex-row sm:items-center gap-4">
                  <span className="w-11 h-11 rounded-xl bg-neutral-100 flex items-center justify-center shrink-0">
                    <Lock className="w-5 h-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-neutral-950">Make the website your own</h3>
                    <p className="text-[13px] text-neutral-500 mt-0.5">
                      Change every heading, photo, section, colour and page with the website editor on {editorPlan?.name || "Growth"} and Pro.
                    </p>
                  </div>
                  <Button size="sm" className="bg-[#111111] text-white hover:bg-black rounded-xl text-xs font-semibold h-9 px-4 shrink-0" onClick={() => setActiveTab("billing")}>
                    Upgrade
                  </Button>
                </div>
              )}
            </div>
          );
        })()}

        {/* TAB 8: BILLING */}
        {activeTab === "billing" && (() => {
          const used = store.products?.length || 0;
          const limit = currentPlan.maxProducts;
          const unlimited = limit >= 999999;
          const pct = unlimited ? 0 : Math.min(100, Math.round((used / limit) * 100));
          const history = store.subscriptionHistory || [];
          return (
            <div className="mt-6 space-y-4 animate-enter-blur">
              {upgradeSuccess && (
                <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>You&apos;re now on <b>{currentPlan.name}</b>. Your new limits are active.</span>
                </div>
              )}

              {/* Subscription Invoices & Billing History */}
              <div className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-base font-bold text-neutral-900">Billing History & Invoices</h4>
                    <p className="text-xs text-neutral-500">
                      Your platform subscription transactions, receipts and verification statuses.
                    </p>
                  </div>
                </div>

                {history.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-neutral-200 p-6 text-center text-xs text-neutral-500">
                    No payment transactions yet. When you upgrade your plan via UPI, your payment receipts and status will show here.
                  </div>
                ) : (
                  <div className="divide-y divide-neutral-100 rounded-xl border border-neutral-200 overflow-hidden">
                    {history.map((item) => (
                      <div
                        key={item.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white hover:bg-neutral-50/50 transition-colors"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-neutral-900">{item.planName}</span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                item.status === "verified"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : item.status === "pending_verification"
                                  ? "bg-amber-100 text-amber-800 animate-pulse"
                                  : "bg-neutral-100 text-neutral-600"
                              }`}
                            >
                              {item.status === "verified"
                                ? "Active / Verified"
                                : item.status === "pending_verification"
                                ? "Verifying (1–2 hrs)"
                                : item.rejectedAt
                                ? "Rejected"
                                : "Cancelled"}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-neutral-500 font-mono">
                            <span>Ref: {item.referenceId}</span>
                            {item.paymentUtr && <span>UTR: {item.paymentUtr}</span>}
                            <span>{new Date(item.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                          <span className="font-bold text-sm text-neutral-900 font-mono">{item.amountFormatted}</span>
                          {item.status === "pending_verification" && (
                            <button
                              type="button"
                              onClick={() => {
                                setSubscriptionModalPlanId(item.planId);
                                setIsSubscriptionModalOpen(true);
                              }}
                              className="text-xs font-semibold text-neutral-700 hover:text-black underline cursor-pointer"
                            >
                              Check Status
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4 rounded-2xl border border-neutral-200 bg-white px-4 py-3">
                <div className="min-w-0">
                  <span className="block text-[11px] text-neutral-500">Your plan</span>
                  <span className="block truncate text-sm font-semibold">{currentPlan.name}</span>
                </div>
                <div className="ml-auto w-32 sm:w-48 shrink-0">
                  <div className="flex items-center justify-between text-[11px] text-neutral-500">
                    <span>Products</span>
                    <span className="font-semibold text-neutral-900 tabular-nums">{unlimited ? `${used} · Unlimited` : `${used}/${limit}`}</span>
                  </div>
                  {!unlimited && (
                    <div className="mt-1.5 h-1.5 rounded-full bg-neutral-100 overflow-hidden">
                      <div className={`h-full rounded-full ${pct >= 90 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${pct}%` }} />
                    </div>
                  )}
                </div>
              </div>

              <h3 className="pt-2 text-base font-semibold">Choose your plan</h3>
              <div className="grid gap-3 md:grid-cols-3">
                {Object.values(PLATFORM_PLANS).sort((a, b) => b.priceMonthly - a.priceMonthly).map((plan) => {
                  const isCurrent = store.planId === plan.id;
                  const dark = plan.id === "pro";
                  const isFree = plan.priceMonthly === 0;
                  const isUpgrade = plan.priceMonthly > currentPlan.priceMonthly;
                  return (
                    <div
                      key={plan.id}
                      className={`flex flex-col rounded-2xl border p-5 ${
                        dark
                          ? "bg-neutral-950 text-white border-neutral-950 shadow-xl shadow-neutral-950/15"
                          : isFree
                            ? "bg-neutral-50 border-neutral-200"
                            : "bg-white border-amber-300 ring-1 ring-amber-300"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold">{plan.name}</span>
                        {isCurrent ? (
                          <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600">Current</span>
                        ) : dark ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-0.5 text-[11px] font-semibold text-neutral-950">
                            <Sparkles className="w-3 h-3" />
                            Best value
                          </span>
                        ) : plan.highlight ? (
                          <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-amber-600">Popular</span>
                        ) : null}
                      </div>
                      <p className="mt-3 flex flex-wrap items-baseline gap-x-1.5 gap-y-1">
                        <span className="text-3xl font-semibold tracking-tight">{plan.priceFormatted.split(" ")[0]}</span>
                        {plan.originalPriceFormatted && (
                          <span className={`text-base line-through ${dark ? "text-neutral-500" : "text-neutral-400"}`}>
                            {plan.originalPriceFormatted.split(" ")[0]}
                          </span>
                        )}
                        <span className={`text-sm ${dark ? "text-neutral-400" : "text-neutral-500"}`}>/month</span>
                        {planDiscountPercent(plan) > 0 && (
                          <span className="ml-auto self-center rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-600">
                            Save {planDiscountPercent(plan)}%
                          </span>
                        )}
                      </p>
                      <p className={`mt-2 text-sm ${dark ? "text-neutral-400" : "text-neutral-500"}`}>{plan.description}</p>
                      <ul className={`mt-4 space-y-2.5 border-t pt-4 text-sm ${dark ? "border-white/10 text-neutral-300" : "border-neutral-100 text-neutral-700"}`}>
                        {plan.features.map((feat, i) => (
                          <li key={i} className="flex gap-2.5">
                            <span className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${dark ? "bg-white/10 text-white" : "bg-neutral-100 text-neutral-900"}`}>
                              <Check className="w-2.5 h-2.5" />
                            </span>
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="mt-auto pt-5">
                        {isCurrent ? (
                          <div className={`h-11 rounded-xl flex items-center justify-center text-sm font-semibold ${dark ? "bg-white/10 text-neutral-300" : "bg-neutral-100 text-neutral-500"}`}>
                            Your current plan
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleUpgradePlan(plan.id as any)}
                            className={`w-full h-11 rounded-xl text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors ${
                              dark ? "bg-white text-neutral-950 hover:bg-neutral-100" : isUpgrade ? "bg-neutral-950 text-white hover:bg-black" : "border border-neutral-200 text-neutral-700 hover:bg-neutral-50"
                            }`}
                          >
                            {isUpgrade ? `Upgrade to ${plan.name}` : `Switch to ${plan.name}`}
                            {isUpgrade && <ArrowRight className="w-4 h-4" />}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          );
        })()}

        {/* TAB 9: SETTINGS */}
        {activeTab === "settings" && (
          <div className="mt-6 space-y-4 animate-enter-blur">
            {/* Store address */}
            <div className="relative overflow-hidden rounded-2xl bg-neutral-950 text-white p-5 sm:p-6">
              <div aria-hidden className="pointer-events-none absolute -right-14 -top-14 w-44 h-44 rounded-full bg-white/[0.04]" />
              <span className="relative flex items-center gap-2 text-xs text-neutral-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Your store is live at
              </span>
              <p className="relative mt-2 text-xl sm:text-2xl font-semibold tracking-tight break-all">
                <span className="text-neutral-500">https://</span>
                {storeWebDomain}
              </p>
              <div className="relative mt-5 grid grid-cols-2 gap-2 sm:flex">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(storePublicUrl);
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2000);
                  }}
                  className="h-11 px-5 rounded-xl bg-white text-neutral-950 text-sm font-semibold inline-flex items-center justify-center gap-2 hover:bg-neutral-100"
                >
                  {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copiedLink ? "Copied" : "Copy link"}
                </button>
                <Link
                  href={liveStoreUrl}
                  target="_blank"
                  className="h-11 px-5 rounded-xl border border-white/15 text-sm font-semibold inline-flex items-center justify-center gap-2 hover:bg-white/10"
                >
                  Open store
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Logo */}
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold">Store logo</h3>
                  <p className="mt-0.5 text-sm text-neutral-500">Shown in your store&apos;s header. Without one, your store name is used.</p>
                </div>
                {logoSavedToast && (
                  <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                    <Check className="w-3.5 h-3.5" />
                    Saved
                  </span>
                )}
              </div>

              {/* how it looks in the header */}
              <div className="mt-4 overflow-hidden rounded-xl border border-neutral-200">
                <div className="flex items-center gap-1.5 border-b border-neutral-200 bg-neutral-50 px-3 py-2">
                  <span className="w-2 h-2 rounded-full bg-neutral-300" />
                  <span className="w-2 h-2 rounded-full bg-neutral-300" />
                  <span className="w-2 h-2 rounded-full bg-neutral-300" />
                  <span className="ml-2 min-w-0 flex-1 truncate rounded-md border border-neutral-200 bg-white px-2 py-0.5 text-[11px] text-neutral-500">
                    {storeWebDomain}
                  </span>
                </div>
                <div className="flex h-16 items-center justify-between gap-3 bg-white px-4">
                  {logoUrlInput ? (
                    <img src={logoUrlInput} alt="Logo preview" className="max-h-10 max-w-[170px] object-contain" />
                  ) : (
                    <span className="truncate text-lg font-bold tracking-tight">{store.name}</span>
                  )}
                  <span className="flex items-center gap-3 text-neutral-400">
                    <Search className="w-4 h-4" />
                    <ShoppingBag className="w-4 h-4" />
                  </span>
                </div>
              </div>

              <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-neutral-300 p-4 transition-colors hover:border-neutral-400 hover:bg-neutral-50">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        if (event.target?.result) {
                          setLogoUrlInput(event.target.result as string);
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                <span className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center shrink-0">
                  <UploadCloud className="w-5 h-5 text-neutral-600" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">Upload a logo</span>
                  <span className="block text-xs text-neutral-500">PNG or SVG, about 240×60px</span>
                </span>
              </label>

              <div className="mt-4 flex items-center gap-3 text-xs text-neutral-400">
                <span className="h-px flex-1 bg-neutral-200" />
                or paste an image link
                <span className="h-px flex-1 bg-neutral-200" />
              </div>
              <label className="mt-3 flex items-center gap-2 h-11 px-3.5 rounded-xl border border-neutral-200 bg-white focus-within:border-neutral-900 transition-colors">
                <Globe className="w-4 h-4 text-neutral-400 shrink-0" />
                <input
                  value={logoUrlInput.startsWith("data:") ? "" : logoUrlInput}
                  onChange={(e) => setLogoUrlInput(e.target.value)}
                  placeholder="https://example.com/logo.png"
                  className="w-full bg-transparent text-sm outline-none"
                />
              </label>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-xs text-neutral-400">Try:</span>
                <button
                  type="button"
                  onClick={() => setLogoUrlInput("https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?auto=format&fit=crop&w=400&q=80")}
                  style={{ minHeight: 0 }} className="h-8 px-3 rounded-full border border-neutral-200 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                >
                  Minimal geometric
                </button>
                <button
                  type="button"
                  onClick={() => setLogoUrlInput("https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80")}
                  style={{ minHeight: 0 }} className="h-8 px-3 rounded-full border border-neutral-200 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                >
                  Modern monogram
                </button>
                {logoUrlInput && (
                  <button
                    type="button"
                    onClick={() => setLogoUrlInput("")}
                    style={{ minHeight: 0 }}
                    className="ml-auto h-8 px-3 rounded-full text-xs font-medium text-red-600 hover:bg-red-50"
                  >
                    Remove logo
                  </button>
                )}
              </div>

              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveBrandLogo}
                  className="h-11 px-5 rounded-xl bg-neutral-950 text-white text-sm font-semibold hover:bg-black"
                >
                  Save logo
                </button>
              </div>
            </div>

            {/* Online payments through the seller's own Cashfree account */}
            <CashfreePaymentsCard store={store} />

            {/* Payments & announcement */}
            <form onSubmit={handleSaveSettings} className="rounded-2xl border border-neutral-200 bg-white">
              <div className="p-5 sm:p-6">
                <h3 className="text-base font-semibold">Payments</h3>
                <p className="mt-0.5 text-sm text-neutral-500">Money goes straight to you, with no middleman fees.</p>

                <label htmlFor="settings-upi" className="mt-5 block text-sm font-medium">UPI ID</label>
                <label className="mt-1.5 flex items-center gap-2 h-11 px-3.5 rounded-xl border border-neutral-200 bg-white focus-within:border-neutral-900 transition-colors">
                  <IndianRupee className="w-4 h-4 text-neutral-400 shrink-0" />
                  <input
                    id="settings-upi"
                    value={upiIdInput}
                    onChange={(e) => setUpiIdInput(e.target.value)}
                    placeholder="yourstore@upi"
                    required
                    className="w-full bg-transparent text-sm outline-none"
                  />
                </label>

                <div className="mt-4 flex items-center justify-between gap-4 rounded-xl bg-neutral-50 p-4">
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="w-10 h-10 rounded-xl border border-neutral-200 bg-white flex items-center justify-center shrink-0">
                      <Truck className="w-4 h-4 text-neutral-700" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold">Cash on delivery</span>
                      <span className="block text-xs text-neutral-500">
                        {codEnabledInput ? "Buyers can pay when the order arrives" : "Prepaid orders only"}
                      </span>
                    </span>
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={codEnabledInput}
                    aria-label="Cash on delivery"
                    onClick={() => setCodEnabledInput(!codEnabledInput)}
                    style={{ minHeight: 0, height: 24 }}
                    className={`relative w-11 shrink-0 rounded-full transition-colors ${codEnabledInput ? "bg-emerald-500" : "bg-neutral-300"}`}
                  >
                    <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${codEnabledInput ? "left-[22px]" : "left-0.5"}`} />
                  </button>
                </div>

                {codEnabledInput && (
                  <div className="mt-4">
                    <label htmlFor="settings-cod-fee" className="block text-sm font-medium">COD handling fee</label>
                    <label className="mt-1.5 flex items-center gap-2 h-11 px-3.5 rounded-xl border border-neutral-200 bg-white focus-within:border-neutral-900 transition-colors sm:max-w-[200px]">
                      <span className="text-sm text-neutral-400">₹</span>
                      <input
                        id="settings-cod-fee"
                        inputMode="numeric"
                        value={codFeeInput}
                        onChange={(e) => setCodFeeInput(e.target.value)}
                        placeholder="0"
                        className="w-full bg-transparent text-sm outline-none"
                      />
                    </label>
                  </div>
                )}
              </div>

              <div className="border-t border-neutral-100 p-5 sm:p-6">
                <h3 className="text-base font-semibold">Announcement bar</h3>
                <p className="mt-0.5 text-sm text-neutral-500">A short line shown at the very top of your store.</p>
                <label className="mt-4 flex items-center gap-2 h-11 px-3.5 rounded-xl border border-neutral-200 bg-white focus-within:border-neutral-900 transition-colors">
                  <Bell className="w-4 h-4 text-neutral-400 shrink-0" />
                  <input
                    value={announcementInput}
                    onChange={(e) => setAnnouncementInput(e.target.value)}
                    placeholder="Free shipping over ₹999 · Use code SAVE10"
                    className="w-full bg-transparent text-sm outline-none"
                  />
                </label>
                {announcementInput && (
                  <div className="mt-3 truncate rounded-xl bg-neutral-950 px-3 py-2 text-center text-xs font-medium text-white">
                    {announcementInput}
                  </div>
                )}
              </div>

              <div className="flex justify-end border-t border-neutral-100 p-5 sm:p-6">
                <button type="submit" className="h-11 px-5 rounded-xl bg-neutral-950 text-white text-sm font-semibold hover:bg-black">
                  Save changes
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 11: PLUGINS & GMAIL AUTOMATION */}
        {activeTab === "plugins" && (
          <div className="mt-6 space-y-6 animate-enter-blur">
            {!canUseEmail(store.planId) ? (
              /* Email integration is a Pro feature */
              <LockedFeature
                title="Email notifications"
                text="Connect your Gmail and tell subscribers the moment you add something new."
                planLabel={unlockLabel("email")}
                ctaLabel={`Unlock with ${cheapestPlanWith("email")?.name ?? "an upgrade"}`}
                onUpgrade={() => { setActiveTab("billing"); scrollDashTop({ top: 0 }); }}
                perks={[
                  { icon: Mail, title: "Sent from your Gmail", text: "Emails come from you, not a no-reply address" },
                  { icon: Send, title: "New drop alerts", text: "Email every subscriber about new products" },
                  { icon: Bell, title: "Newsletter sign-up", text: "Adds a subscribe box to your store's footer" },
                ]}
                preview={
                  <div className="mx-auto max-w-xs rounded-2xl bg-white/10 p-4">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span className="h-2 w-28 rounded bg-white/50" />
                    </div>
                    <div className="mt-3 h-16 rounded-xl bg-gradient-to-br from-amber-300/70 to-rose-300/50" />
                    <span className="mt-3 block h-2 w-40 rounded bg-white/35" />
                    <span className="mt-2 block h-2 w-28 rounded bg-white/20" />
                    <span className="mt-3 block h-7 w-24 rounded-lg bg-white/60" />
                  </div>
                }
              />
            ) : (
              /* Email: Gmail settings, compose, subscribers */
              (() => {
                const subs = store.subscribers || [];
                const sent = store.pluginsConfig?.gmailIntegration?.campaignsSentCount || 0;
                const templates = [
                  {
                    label: "New drop",
                    subject: "New collection just dropped",
                    tag: "New Arrivals",
                    message: "Our newest pieces are live on the store. Take a look before your size sells out.",
                  },
                  {
                    label: "Restock",
                    subject: "Back in stock",
                    tag: "Bestsellers",
                    message: "Your favourites are back. They went fast last time, so don't wait too long.",
                  },
                  {
                    label: "Weekend offer",
                    subject: "A little something for the weekend",
                    tag: "Full Store",
                    message: "Thanks for being on our list. Use code WEEKEND10 at checkout for 10% off this weekend.",
                  },
                ];
                return (
                  <div className="space-y-4">
                    {/* Summary */}
                    <div className="relative overflow-hidden rounded-2xl bg-neutral-950 p-5 text-white sm:p-6">
                      <div aria-hidden className="pointer-events-none absolute -right-14 -top-14 h-44 w-44 rounded-full bg-white/[0.04]" />
                      <div className="relative flex items-start justify-between gap-3">
                        <div>
                          <span className="text-xs text-neutral-400">Email</span>
                          <p className="mt-1 text-lg font-semibold">Tell subscribers what's new</p>
                        </div>
                        <span
                          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                            gmailConnected ? "bg-emerald-500/15 text-emerald-300" : "bg-white/10 text-neutral-300"
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${gmailConnected ? "bg-emerald-400" : "bg-neutral-400"}`} />
                          {gmailConnected ? "Gmail connected" : "Gmail not set up"}
                        </span>
                      </div>
                      <div className="relative mt-5 grid grid-cols-2 gap-3">
                        <div className="rounded-xl bg-white/[0.06] p-3">
                          <span className="block text-2xl font-semibold tabular-nums">{subs.length}</span>
                          <span className="block text-xs text-neutral-400">Subscribers</span>
                        </div>
                        <div className="rounded-xl bg-white/[0.06] p-3">
                          <span className="block text-2xl font-semibold tabular-nums">{sent}</span>
                          <span className="block text-xs text-neutral-400">Emails sent</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                      {/* Gmail settings */}
                      <form onSubmit={handleSaveGmailConfig} className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6">
                        <h3 className="text-base font-semibold">Send from</h3>
                        <p className="mt-0.5 text-sm text-neutral-500">Emails go out from your Gmail address.</p>

                        <label className={`mt-4 flex items-center gap-2 h-11 px-3.5 rounded-xl border border-neutral-200 bg-white focus-within:border-neutral-900 transition-colors`}>
                          <Mail className="h-4 w-4 shrink-0 text-neutral-400" />
                          <input
                            type="email"
                            required
                            value={gmailEmailInput}
                            onChange={(e) => setGmailEmailInput(e.target.value)}
                            placeholder="yourstore@gmail.com"
                            className="w-full bg-transparent text-sm outline-none"
                          />
                        </label>

                        <div className="mt-4 flex items-center justify-between gap-4 rounded-xl bg-neutral-50 p-4">
                          <span className="min-w-0">
                            <span className="block text-sm font-semibold">New product alerts</span>
                            <span className="block text-xs text-neutral-500">Email subscribers automatically when you add products</span>
                          </span>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={gmailAutoAlerts}
                            aria-label="New product alerts"
                            onClick={() => setGmailAutoAlerts(!gmailAutoAlerts)}
                            style={{ minHeight: 0, height: 24 }}
                            className={`relative w-11 shrink-0 rounded-full transition-colors ${gmailAutoAlerts ? "bg-emerald-500" : "bg-neutral-300"}`}
                          >
                            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${gmailAutoAlerts ? "left-[22px]" : "left-0.5"}`} />
                          </button>
                        </div>

                        <div className="mt-5 grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={handleSendTestEmail}
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-neutral-200 text-sm font-semibold text-neutral-800 hover:border-neutral-900"
                          >
                            <Send className="h-4 w-4" />
                            Send test
                          </button>
                          <button type="submit" className="h-11 rounded-xl bg-neutral-950 text-sm font-semibold text-white hover:bg-black">
                            Save
                          </button>
                        </div>
                        {(gmailSaveToast || testEmailToast) && (
                          <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                            <CheckCircle2 className="h-4 w-4" />
                            {gmailSaveToast ? "Saved." : `Test email sent to ${gmailEmailInput}.`}
                          </p>
                        )}
                      </form>

                      {/* Compose */}
                      <form onSubmit={handleSendDropAnnouncement} className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6">
                        <h3 className="text-base font-semibold">New email</h3>
                        <p className="mt-0.5 text-sm text-neutral-500">Goes to all {subs.length} subscriber{subs.length === 1 ? "" : "s"}.</p>

                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          <span className="text-xs text-neutral-400">Start from:</span>
                          {templates.map((t) => (
                            <button
                              key={t.label}
                              type="button"
                              onClick={() => {
                                setDropSubject(t.subject);
                                setDropCollection(t.tag);
                                setDropMessage(t.message);
                              }}
                              style={{ minHeight: 0 }} className="h-8 rounded-full border border-neutral-200 bg-white px-3 text-xs font-medium text-neutral-700 hover:border-neutral-900"
                            >
                              {t.label}
                            </button>
                          ))}
                        </div>

                        <label className="mt-4 block text-sm font-medium" htmlFor="email-subject">Subject</label>
                        <div className={`mt-1.5 flex items-center gap-2 h-11 px-3.5 rounded-xl border border-neutral-200 bg-white focus-within:border-neutral-900 transition-colors`}>
                          <input
                            id="email-subject"
                            required
                            value={dropSubject}
                            onChange={(e) => setDropSubject(e.target.value)}
                            placeholder="New collection just dropped"
                            className="w-full bg-transparent text-sm outline-none"
                          />
                        </div>

                        <label className="mt-3 block text-sm font-medium" htmlFor="email-tag">
                          Collection <span className="font-normal text-neutral-400">(optional)</span>
                        </label>
                        <div className={`mt-1.5 flex items-center gap-2 h-11 px-3.5 rounded-xl border border-neutral-200 bg-white focus-within:border-neutral-900 transition-colors`}>
                          <input
                            id="email-tag"
                            value={dropCollection}
                            onChange={(e) => setDropCollection(e.target.value)}
                            placeholder="New Arrivals"
                            className="w-full bg-transparent text-sm outline-none"
                          />
                        </div>

                        <label className="mt-3 block text-sm font-medium" htmlFor="email-message">Message</label>
                        <textarea
                          id="email-message"
                          rows={4}
                          required
                          value={dropMessage}
                          onChange={(e) => setDropMessage(e.target.value)}
                          placeholder="Tell subscribers about your newest pieces or an offer…"
                          className="mt-1.5 w-full rounded-xl border border-neutral-200 bg-white p-3.5 text-sm leading-relaxed outline-none transition-colors focus:border-neutral-900"
                        />

                        <button
                          type="submit"
                          disabled={dropSending || subs.length === 0}
                          className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-neutral-950 text-sm font-semibold text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {dropSending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                          {dropSending ? "Sending…" : `Send to ${subs.length} subscriber${subs.length === 1 ? "" : "s"}`}
                        </button>
                        {subs.length === 0 && (
                          <p className="mt-2 text-center text-xs text-neutral-500">You can send once someone subscribes on your store.</p>
                        )}
                        {dropSentSuccess && (
                          <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                            <CheckCircle2 className="h-4 w-4" />
                            Sent to all subscribers.
                          </p>
                        )}
                      </form>
                    </div>

                    {/* Subscribers */}
                    <div className="rounded-2xl border border-neutral-200 bg-white">
                      <div className="flex items-center justify-between gap-3 p-5 sm:px-6">
                        <div>
                          <h3 className="text-base font-semibold">Subscribers</h3>
                          <p className="mt-0.5 text-sm text-neutral-500">People who signed up in your store&apos;s footer.</p>
                        </div>
                        <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold tabular-nums text-neutral-700">{subs.length}</span>
                      </div>
                      {subs.length === 0 ? (
                        <div className="border-t border-neutral-100 px-6 py-10 text-center">
                          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-100">
                            <Mail className="h-5 w-5 text-neutral-500" />
                          </span>
                          <p className="mt-3 text-sm font-semibold">No subscribers yet</p>
                          <p className="mx-auto mt-1 max-w-xs text-xs text-neutral-500">
                            Shoppers can sign up in the footer of {storeWebDomain}. They&apos;ll show up here.
                          </p>
                        </div>
                      ) : (
                        <ul className="divide-y divide-neutral-100 border-t border-neutral-100">
                          {subs.map((sub) => (
                            <li key={sub.id} className="flex items-center gap-3 px-5 py-3 sm:px-6">
                              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-xs font-semibold uppercase text-neutral-700">
                                {sub.email.charAt(0)}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-medium">{sub.email}</span>
                                <span className="block text-xs text-neutral-500">
                                  Joined {new Date(sub.subscribedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                </span>
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveSubscriber(sub.email)}
                                aria-label={`Remove ${sub.email}`}
                                style={{ minHeight: 0 }}
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-neutral-400 hover:bg-red-50 hover:text-red-600"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                );
              })()
            )}
          </div>
        )}

        {/* App footer — overview only; links point at real homepage sections, dashboard tabs or support */}
        {activeTab === "overview" && (
        <footer className="mt-14 rounded-[20px] bg-neutral-950 text-white px-6 py-6 sm:px-8">
          <div className="flex flex-col items-center gap-4 text-center md:flex-row md:justify-between md:text-left">
            <div className="flex flex-col items-center gap-1 md:items-start">
              <ShopperLogo className="text-[20px] text-white" />
              <span className="text-[12px] text-white/50">{siteConfig.description}</span>
            </div>
            <nav aria-label={siteConfig.name} className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-[12px] text-white/70 md:justify-end md:max-w-xl">
              {[
                { label: "Online store builder", href: "/#storefront" },
                { label: "Store themes", href: "/#themes" },
                { label: "UPI payments", href: "/#platform" },
                { label: "Pricing", href: "/#pricing" },
                { label: "FAQs", href: "/#faq" },
                { label: "Contact support", href: `mailto:${siteConfig.supportEmail}` },
              ].map((l) => (
                <a key={l.label} href={l.href} style={{ minHeight: 0 }} className="hover:text-white transition-colors">
                  {l.label}
                </a>
              ))}
            </nav>
          </div>

          <div className="mt-5 pt-4 border-t border-white/10 flex flex-col-reverse items-center gap-2 text-[11px] text-white/45 md:flex-row md:justify-between">
            <span>© {new Date().getFullYear()} Roxten Studios Pvt Ltd · v{siteConfig.version}</span>
            <span className="flex flex-wrap justify-center gap-x-4 gap-y-1">
              {[
                { label: "Plans", onClick: () => setActiveTab("billing") },
                { label: "Settings", onClick: () => setActiveTab("settings") },
                { label: "View store", onClick: () => window.open(liveStoreUrl, "_blank") },
              ].map((l) => (
                <button key={l.label} type="button" onClick={l.onClick} style={{ minHeight: 0 }} className="hover:text-white transition-colors">
                  {l.label}
                </button>
              ))}
              {[
                { label: "Terms", href: siteConfig.legal.terms },
                { label: "Privacy", href: siteConfig.legal.privacy },
              ]
                .filter((l) => l.href)
                .map((l) => (
                  <a key={l.label} href={l.href} target="_blank" rel="noreferrer" style={{ minHeight: 0 }} className="hover:text-white transition-colors">
                    {l.label}
                  </a>
                ))}
            </span>
          </div>
        </footer>
        )}
          </div>
      </main>
        </div>
      </div>

      {/* Phone bottom bar: red dots on sections with something unseen, and a chip that springs up for new events */}
      <MobileDock
        storeKey={store.subdomain}
        active={activeTab}
        onSelect={(tab) => {
          setIsMobileMenuOpen(false);
          setActiveTab(tab);
        }}
        menuOpen={isMobileMenuOpen}
        onToggleMenu={() => setIsMobileMenuOpen((o) => !o)}
        notices={notifications}
        onSeen={rememberRead}
      />

      {/* Setup checklist: one step at a time, in a card in the middle of the screen */}
      {setupStart !== null && (
        <SetupWizard store={store} startAt={setupStart} onClose={() => setSetupStart(null)} onChanged={refreshStore} />
      )}

      {/* Mobile menu: floating card that pops up above the bottom bar */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] animate-backdrop-in" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="absolute bottom-[88px] inset-x-0 mx-auto w-[92%] max-w-sm rounded-[22px] bg-white p-3 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.45)] animate-sheet-up origin-bottom">
            {/* account */}
            <div className="flex items-center gap-3 px-2 pt-1 pb-3">
              <span className="w-9 h-9 rounded-full bg-black text-white text-[11px] font-semibold flex items-center justify-center shrink-0">
                {ownerInitials}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold truncate">{ownerName}</span>
                <span className="block text-[11px] text-neutral-500 truncate">{storeWebDomain}</span>
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-[6px] border border-neutral-200 text-neutral-600">
                {store.planId}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              {(
                [
                  { id: "overview", label: "Overview", icon: LayoutDashboard },
                  { id: "products", label: "Products", icon: Package, dot: notifications.some((n) => n.unread && n.type === "stock") },
                  { id: "categories", label: "Categories", icon: FolderTree },
                  { id: "orders", label: "Orders", icon: ShoppingBag, dot: notifications.some((n) => n.unread && n.type === "order") },
                  { id: "discounts", label: "Discounts", icon: Tag, locked: !canUseCoupons(store.planId) },
                  { id: "customers", label: "Customers", icon: Users },
                  { id: "reviews", label: "Reviews", icon: Star, locked: !canUseReviews(store.planId) },
                  { id: "banners", label: "Banners", icon: ImageIcon },
                  { id: "themes", label: "Themes", icon: Palette },
                  { id: "billing", label: "Plan", icon: CreditCard, dot: notifications.some((n) => n.unread && n.type === "plan") },
                  { id: "settings", label: "Settings", icon: Settings },
                  { id: "plugins", label: "Plugins", icon: Plug, locked: !canUseEmail(store.planId) },
                ] as { id: DashTab; label: string; icon: React.ElementType; dot?: boolean; locked?: boolean }[]
              ).map((item, i) => {
                const Icon = item.icon;
                const isCurrent = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className="group flex flex-col items-center gap-1.5 rounded-[14px] py-2.5 hero-rise active:scale-95 transition-transform"
                    style={{ animationDelay: `${60 + i * 22}ms` }}
                  >
                    {item.locked ? (
                      // sealed tile: gold foil, dashed seal edge, dimmed icon and a lock badge
                      <span
                        className={`seal-shine relative w-11 h-11 rounded-[13px] flex items-center justify-center border border-dashed ${
                          isCurrent ? "border-amber-500 bg-amber-100" : "border-amber-300 bg-gradient-to-br from-amber-50 via-white to-amber-100"
                        }`}
                        style={{ backgroundImage: "repeating-linear-gradient(135deg, rgba(245,158,11,0.10) 0 3px, transparent 3px 7px)" }}
                      >
                        <Icon className="w-[18px] h-[18px] text-amber-800/35" />
                        <span className="absolute -top-1.5 -right-1.5 w-[18px] h-[18px] rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white ring-2 ring-white flex items-center justify-center shadow-sm">
                          <Lock className="w-2.5 h-2.5" strokeWidth={2.75} />
                        </span>
                      </span>
                    ) : (
                      <span
                        className={`relative w-11 h-11 rounded-[13px] flex items-center justify-center transition-colors ${
                          isCurrent ? "bg-black text-white" : "bg-neutral-100 text-neutral-700 group-hover:bg-neutral-200"
                        }`}
                      >
                        <Icon className="w-[18px] h-[18px]" />
                        {item.dot && <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#ef4444] ring-2 ring-white" />}
                      </span>
                    )}
                    <span
                      className={`text-[10.5px] ${
                        item.locked ? "font-medium text-amber-700" : isCurrent ? "font-semibold text-neutral-950" : "text-neutral-600"
                      }`}
                    >
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-2 pt-2 border-t border-neutral-100 grid grid-cols-2 gap-2">
              <Link
                href={liveStoreUrl}
                target="_blank"
                onClick={() => setIsMobileMenuOpen(false)}
                className="h-10 rounded-[12px] bg-neutral-100 text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                View store
              </Link>
              <button
                type="button"
                onClick={async () => {
                  setIsMobileMenuOpen(false);
                  await signOut();
                  router.push("/login");
                }}
                className="h-10 rounded-[12px] bg-red-50 text-red-600 text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Buying a theme once */}
      {store && themeToBuy && (
        <ThemePurchaseModal
          store={store}
          theme={getTheme(themeToBuy)}
          onClose={() => setThemeToBuy(null)}
          onUpgrade={() => {
            setThemeToBuy(null);
            setActiveTab("billing");
          }}
        />
      )}
      {/* Subscription Payment & Verification Modal */}
      {store && (
        <SubscriptionPaymentModal
          isOpen={isSubscriptionModalOpen}
          onClose={() => setIsSubscriptionModalOpen(false)}
          store={store}
          initialPlanId={subscriptionModalPlanId}
          initialBillingCycle={subscriptionModalBillingCycle}
          onSuccess={() => {
            refreshStore();
          }}
          onNavigateTab={(tab) => {
            setActiveTab(tab as any);
            scrollDashTop({ top: 0 });
          }}
          onOpenSetupWizard={() => {
            setActiveTab("settings");
            scrollDashTop({ top: 0 });
          }}
        />
      )}

    </div>
  );
}

/** Full-screen holding state for the dashboard (loading, or about to redirect), in the app's style. */
function DashboardHold({ text }: { text: string }) {
  return (
    <div className="home-sans fixed inset-0 flex flex-col items-center justify-center gap-5 bg-white px-6 font-[Inter,sans-serif]">
      <ShopperMark className="h-12 w-auto text-black animate-pulse" />
      <p className="text-[15px] font-medium text-neutral-500" role="status" aria-live="polite">
        {text}
      </p>
    </div>
  );
}
