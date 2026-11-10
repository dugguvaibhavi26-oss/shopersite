"use client";
import { appAlert, appConfirm, appPrompt } from "@/components/ui/app-dialog";

import { RAIL_WIDTH, SidebarRail } from "./sidebar-rail";
import { MobileDock } from "./mobile-dock";
import { EmailPanel, sendNewProductAlert } from "@/components/dashboard/email-panel";
import { SITE_THEME_STYLE, toSiteTheme } from "@/lib/site-content";
import { cropImage } from "@/components/ui/image-cropper";
import { Tour, type TourStep } from "@/components/ui/tour";
import { LiveShopFrame } from "@/components/dashboard/live-shop-frame";
import { OrderActions } from "@/components/dashboard/order-actions";
import { PoliciesPanel } from "@/components/dashboard/policies-panel";
import { hasAnyPolicy, isShopClosed, missingPolicies } from "@/lib/policies";
import { BulkUploadPanel } from "@/components/dashboard/bulk-upload";
import { ProductCategoryField, moneyInput, uniqueSlug } from "@/components/dashboard/product-fields";
import { checkPrices, checkStock } from "@/lib/validation";
import { planMove, rankOf, REMIND_DAYS, subscriptionState } from "@/lib/subscription";
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
import { planHas, PLATFORM_PLANS, canAddProduct, canUseReviews, canUseCoupons, canUseEmail, planDiscountPercent, cheapestPlanWith, canAddBanner, canUseThemeEditor, isPaidPlan, calculatePlanPrice, BILLING_CYCLES, type BillingCycle } from "@/lib/plans";
import { CountUp } from "@/components/home/reveal";
import { ShopperLogo, ShopperMark } from "@/components/brand/shopper-logo";
import { AnnouncementBanners } from "@/components/dashboard/announcement-banners";
import { HelpAndMore } from "@/components/dashboard/help-and-more";
import { SetupWizard, SETUP_STEPS, isSetupStepDone } from "@/components/dashboard/setup-wizard";
import { LockedFeature } from "@/components/dashboard/locked-feature";
import { SubscriptionPaymentModal } from "@/components/dashboard/subscription-payment-modal";
import { RazorpayPaymentsCard } from "@/components/dashboard/razorpay-payments";
import { GeneralSettings } from "@/components/dashboard/general-settings";
import { DomainSettings } from "@/components/dashboard/domain-settings";
import { PluginsHub, type PluginId } from "@/components/dashboard/plugins-hub";
import { InvoiceButton, ShiprocketShip, WhatsAppUpdates } from "@/components/dashboard/order-tools";
import { GST_RATES } from "@/lib/invoice";
import { AbandonedCheckouts } from "@/components/dashboard/abandoned-checkouts";
import { ReviewsPanel } from "@/components/dashboard/reviews-panel";
import { IAnalytics, IHome, IOrders, IProducts, ICategories, ICustomers, IReviews, IDiscounts, IThemes, IPlugins, ISettings, INotifications, IProfile, IRupee, IRepeat, IStar, ITrend, ISparkle, IPercent, ITruck, ICard, ICollections, ICheck, IWarning, ISoldOut, IStore, IImage, IGlobe, ICart, IActivity, ILock, IPolicies, IMail, IEye } from "@/components/icons";
import { EmptyState, Illustration, PageHero, SectionIcon, StatChips, StatStrip, dailyCounts, type Section } from "@/components/dashboard/ui-kit";
import {
  AccountSettings,
  CheckoutSettings,
  NotificationSettings,
  PrivacySettings,
  TaxSettings,
  TrackingSettings,
} from "@/components/dashboard/store-settings-sections";
import { fetchPaidOnlineOrders } from "@/lib/payments/client";
import { BILLING_DISMISSED, BILLING_NOT_CONFIGURED, BillingError, cancelPlanSubscription, startPlanSubscription } from "@/lib/billing/client";
import { HomeFeed } from "@/components/dashboard/home-feed";
import { PlansSection } from "@/components/dashboard/plans-page";
import { FilterMenu } from "@/components/dashboard/filter-menu";
import { useMaintenance } from "@/lib/maintenance";
import { TutorialRunner, type Tutorial } from "@/components/dashboard/tutorials";
import { AnalyticsPage } from "@/components/dashboard/analytics-page";
import { ASSISTANT_WIDTH, AssistantButton, AssistantPanel, assistantFitsBeside } from "@/components/dashboard/assistant-panel";
import { ThemePurchaseModal } from "@/components/dashboard/theme-purchase-modal";
import { canEditTheme, canUseTheme, formatThemePrice, getThemePrice, ownsTheme, planIncludesTheme } from "@/lib/theme-pricing";
import { getTheme, getAllThemes, themeThumb } from "@/lib/themes";
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
  XCircle,
  X,
  Scale,
  HelpCircle,
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
  Layers,
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
  Wrench,
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
  const rawTabParam = searchParams.get("tab");
  // the Banners page moved into the theme editor (Banner slider section)
  const urlTabParam = rawTabParam === "banners" ? "overview" : rawTabParam;
  const { user, loading: authLoading, signOut } = useAuth();

  const [activeSubdomain, setActiveSubdomain] = useState<string>(urlStoreParam || "");
  const [store, setStore] = useState<StoreData | null>(null);
  const [userStores, setUserStores] = useState<StoreData[]>([]);
  const [activeTab, setActiveTab] = useState<
    "overview" | "analytics" | "products" | "categories" | "orders" | "discounts" | "customers" | "reviews" | "banners" | "policies" | "themes" | "billing" | "settings" | "plugins" | "notifications" | "profile"
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
    // settings pages are a branch of their own: back never steps into one you visited earlier
    const isSettingsTab = (t: string) => t === "settings" || t === "billing" || t === "policies";
    let previous = tabHistory.current.pop();
    while (previous && (isSettingsTab(previous) || previous === activeTab)) previous = tabHistory.current.pop();
    goingBack.current = true;
    setActiveTab(previous || "overview");
    scrollDashTop({ top: 0 });
  };

  // One "back" for the page's arrow, the Android back button and the browser's back button.
  // Returns false when there's nothing left to go back to (Home).
  const goBackRef = React.useRef<() => boolean>(() => false);
  useEffect(() => {
    const onAppBack = (e: Event) => {
      if (goBackRef.current()) e.preventDefault();
    };
    window.addEventListener("app:back", onAppBack);
    return () => window.removeEventListener("app:back", onAppBack);
  }, []);

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
    // monthly is paid automatically through Razorpay; longer periods are still paid by UPI
    if (cycle === "monthly") handleUpgradePlan(checkoutParam);
    else openSubscriptionModal(checkoutParam, cycle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store?.subdomain, checkoutParam]);

  // list filters for the products, orders and customers pages
  const [productSearch, setProductSearch] = useState("");
  const [productFilter, setProductFilter] = useState<"all" | "in" | "low" | "out">("all");
  const [productCategory, setProductCategory] = useState("");
  const [productSort, setProductSort] = useState<"new" | "az" | "price-low" | "price-high" | "stock-low">("new");
  const [orderFilter, setOrderFilter] = useState<"all" | "toship" | "shipped" | "delivered" | "abandoned">("all");
  // unfinished checkouts (Orders → Abandoned); counted once the list has loaded
  const [abandonedCount, setAbandonedCount] = useState<number | undefined>(undefined);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerFilter, setCustomerFilter] = useState<"all" | "repeat" | "new">("all");
  const [customerSort, setCustomerSort] = useState<"recent" | "orders" | "spent">("recent");
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [pTitle, setPTitle] = useState("");
  const [pCategory, setPCategory] = useState("");
  const [pPrice, setPPrice] = useState("");
  const [pComparePrice, setPComparePrice] = useState("");
  const [pGst, setPGst] = useState("");
  const [pErrors, setPErrors] = useState<{ title?: string; category?: string; price?: string; mrp?: string; stock?: string; form?: string }>({});
  // "+ New category" inside the product form: created when the product is saved
  const [pNewCategory, setPNewCategory] = useState("");
  const [bulkOpen, setBulkOpen] = useState(false);
  const dashTour = React.useRef<(() => void) | null>(null);
  const [bulkNote, setBulkNote] = useState("");
  const [pAddingCategory, setPAddingCategory] = useState(false);
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
  const [cBannerUrl, setCBannerUrl] = useState("");
  const [cIsActive, setCIsActive] = useState(true);
  const [cIsParent, setCIsParent] = useState(false);
  const [cParentId, setCParentId] = useState("");
  const [cSubtitle, setCSubtitle] = useState("");
  const [cCtaText, setCCtaText] = useState("");
  const [cSelectedChildren, setCSelectedChildren] = useState<string[]>([]);
  const [catSearchQuery, setCatSearchQuery] = useState("");
  const [cError, setCError] = useState("");
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
  const [codEnabledInput, setCodEnabledInput] = useState(true);
  const [codFeeInput, setCodFeeInput] = useState("0");
  const [deliveryMode, setDeliveryMode] = useState<"free" | "flat" | "free_above">("free_above");
  const [deliveryFeeInput, setDeliveryFeeInput] = useState("");
  const [freeAboveInput, setFreeAboveInput] = useState("");

  // Brand Theme State (3 Fields: Primary, Background, Surface)
  const [themeAppliedToast, setThemeAppliedToast] = useState<string | null>(null);
  // the theme the seller is buying, in the purchase window
  const [themeToBuy, setThemeToBuy] = useState<string | null>(() => searchParams.get("buy"));

  const [copiedLink, setCopiedLink] = useState(false);
  // Settings is split into three short pages; coming back from Razorpay opens Payments
  const [settingsSection, setSettingsSection] = useState<SettingsSection>(() => {
    if (typeof window === "undefined") return "general";
    const p = new URLSearchParams(window.location.search);
    const s = p.get("section") as SettingsSection | null;
    if (s && (SETTINGS_SECTIONS as readonly string[]).includes(s)) return s;
    return p.has("razorpay") ? "payments" : "general";
  });
  // Phones show the settings list first; tapping a row opens that page (with a back arrow)
  const [settingsListOpen, setSettingsListOpen] = useState(() => {
    if (typeof window === "undefined") return true;
    const p = new URLSearchParams(window.location.search);
    return !(p.has("section") || p.has("razorpay"));
  });
  // Plugins opens on the list of plugins; leaving the tab goes back to it
  const [pluginView, setPluginView] = useState<PluginId | null>(null);
  useEffect(() => {
    if (activeTab !== "plugins") setPluginView(null);
  }, [activeTab]);
  // the settings menu slides out of the main sidebar when you enter Settings (not when moving inside it)
  const enteredSettings = activeTab === "settings" || activeTab === "billing" || activeTab === "policies";
  const [settingsNavIntro, setSettingsNavIntro] = useState(false);
  // Settings sections the Shopersite team marked "In maintenance" (Admin → System status)
  const maintenance = useMaintenance();
  useEffect(() => {
    if (!enteredSettings) return;
    setSettingsNavIntro(true);
    const t = window.setTimeout(() => setSettingsNavIntro(false), 700);
    return () => window.clearTimeout(t);
  }, [enteredSettings]);
  useEffect(() => {
    // leaving Settings resets it to the list; links straight to Plan, Policies or Emails open that page
    if (activeTab === "billing" || activeTab === "policies") setSettingsListOpen(false);
    else if (activeTab !== "settings") setSettingsListOpen(true);
    // computers show the menu beside the page, so a settings page is always open there
    else if (window.matchMedia("(min-width: 1024px)").matches) setSettingsListOpen(false);
  }, [activeTab]);
  useEffect(() => {
    // phones get the numbers on Home itself, so the separate Analytics page is for computers only
    if (activeTab !== "analytics") return;
    const phone = window.matchMedia("(max-width: 767px)");
    const check = () => phone.matches && setActiveTab("overview");
    check();
    phone.addEventListener("change", check);
    return () => phone.removeEventListener("change", check);
  }, [activeTab]);

  // Browser / phone back button: while you're away from Home, one extra history entry sits on top.
  // Pressing back pops it and we step back inside the dashboard instead of leaving it; reaching
  // Home with the in-app arrow removes that entry so the next back press leaves as expected.
  const atDashRoot = activeTab === "overview";
  const [backTick, setBackTick] = useState(0);
  const skipPop = React.useRef(false);
  useEffect(() => {
    const guarded = !!(window.history.state && window.history.state.dashGuard);
    if (!atDashRoot && !guarded) {
      // the entry underneath always points at Home, so stepping back onto it never reopens a page
      const home = new URL(window.location.href);
      home.searchParams.delete("tab");
      home.searchParams.delete("section");
      const hereUrl = new URL(window.location.href);
      hereUrl.searchParams.set("tab", activeTab);
      const here = hereUrl.href;
      window.history.replaceState(window.history.state, "", home.href);
      window.history.pushState({ ...(window.history.state || {}), dashGuard: true }, "", here);
    }
    else if (atDashRoot && guarded) {
      skipPop.current = true;
      window.history.back();
    }
  }, [atDashRoot, backTick]);
  useEffect(() => {
    const onPop = () => {
      if (skipPop.current) {
        skipPop.current = false;
        return;
      }
      goBackRef.current();
      setBackTick((n) => n + 1);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

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
      setCodEnabledInput(s.codEnabled);
      setCodFeeInput((s.codFee / 100).toString());
      setDeliveryMode(!(s.standardDeliveryFee > 0) ? "free" : s.freeDeliveryThreshold > 0 ? "free_above" : "flat");
      setDeliveryFeeInput(s.standardDeliveryFee > 0 ? (s.standardDeliveryFee / 100).toString() : "");
      setFreeAboveInput(s.freeDeliveryThreshold > 0 ? (s.freeDeliveryThreshold / 100).toString() : "");
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
    if (!hasAnyPolicy(store)) {
      appAlert("Online shops in India must show their policies. Add at least one policy page (templates are ready to edit), then you can open your shop.", {
        title: "Add a policy page first",
        okLabel: "Add policies",
      }).then(() => setActiveTab("policies"));
      return;
    }
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
      appAlert("Please provide both a coupon code and discount value.");
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
      appAlert("Failed to create discount code.");
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

  const handleDeleteDiscount = async (discountId: string, code: string) => {
    if (!store) return;
    if (await appConfirm(`Promo code "${code}" will stop working for buyers.`, { title: "Delete this promo code?", danger: true })) {
      storeService.deleteDiscount(store.subdomain, discountId);
      refreshStore();
    }
  };

  // Handle Product Save
  /** Crop, then upload to storage (never kept inside the store record), then use its link. */
  const [photoUploading, setPhotoUploading] = useState(false);
  const uploadPhoto = async (file: File, aspect: number | undefined, use: (url: string) => void) => {
    if (!store) return;
    if (file.size > 12 * 1024 * 1024) return appAlert("Choose a photo under 12 MB.", { danger: true });
    const cropped = await cropImage(file, { aspect });
    if (!cropped) return;
    setPhotoUploading(true);
    try {
      use(await storeService.uploadStoreImage(store.subdomain, cropped));
    } catch {
      appAlert("Couldn't upload this photo. Check your internet and try again.", { danger: true });
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!store) return;

    // check every field first: nothing is saved until all of it is right
    const errs: typeof pErrors = {};
    const title = pTitle.trim().replace(/\s+/g, " ");
    if (title.length < 2) errs.title = "Give your product a name.";
    else if (title.length > 120) errs.title = "Keep the name under 120 characters.";
    else if (store.products.some((p) => p.id !== editingProductId && p.title.trim().toLowerCase() === title.toLowerCase()))
      errs.title = "You already have a product with this name.";
    const priceCheck = checkPrices(pPrice, pComparePrice);
    if (priceCheck.price) errs.price = priceCheck.price;
    if (priceCheck.mrp) errs.mrp = priceCheck.mrp;
    const stockErr = checkStock(pStock);
    if (stockErr) errs.stock = stockErr;
    const typedCategory = pAddingCategory ? pNewCategory.trim().replace(/\s+/g, " ") : pCategory;
    if (!typedCategory) errs.category = pAddingCategory ? "Name the new category." : "Choose a category.";
    else if (typedCategory.length > 40) errs.category = "Keep the category name under 40 characters.";
    setPErrors(errs);
    if (Object.keys(errs).length) {
      scrollDashTop({ top: 0, behavior: "smooth" });
      return;
    }

    // a category typed in here is created first, so the product always sits in a real category
    let categoryName = typedCategory;
    if (pAddingCategory) {
      const existing = (store.categories || []).find((c) => !c.isParent && c.name.toLowerCase() === typedCategory.toLowerCase());
      if (existing) categoryName = existing.name;
      else {
        const made = storeService.addCategory(store.subdomain, { name: typedCategory });
        if (!made.success || !made.category) return setPErrors({ category: made.error || "Couldn't create the category." });
        categoryName = made.category.name;
      }
    }

    const pricePaise = Math.round(parseFloat(pPrice || "0") * 100);
    const comparePricePaise = pComparePrice ? Math.round(parseFloat(pComparePrice) * 100) : undefined;
    const stockNum = parseInt(pStock || "0", 10);

    if (editingProductId) {
      storeService.updateProduct(store.subdomain, editingProductId, {
        title,
        category: categoryName,
        price: pricePaise,
        compareAtPrice: comparePricePaise,
        gstRate: pGst ? Number(pGst) : undefined,
        stock: stockNum,
        description: pDesc,
        images: pImageUrl ? [pImageUrl] : undefined,
      });
    } else {
      const res = storeService.addProduct(store.subdomain, {
        title,
        slug: uniqueSlug(title, store.products.map((p) => p.slug)),
        description: pDesc,
        price: pricePaise,
        compareAtPrice: comparePricePaise,
        ...(pGst ? { gstRate: Number(pGst) } : {}),
        stock: stockNum,
        category: categoryName,
        images: [
          pImageUrl ||
            "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80",
        ],
        status: "published",
        rating: 5.0,
        reviewCount: 0,
      });

      if (!res.success) {
        setPErrors({ form: res.error });
        return;
      }
      // new product alert to subscribers (if switched on); wait a moment so the product is saved first
      if (res.product && canUseEmail(store.planId) && store.pluginsConfig?.gmailIntegration?.autoSendNewDropAlerts) {
        const added = res.product;
        const snapshot = store;
        window.setTimeout(() => sendNewProductAlert(snapshot, added), 4000);
      }
    }

    refreshStore();
    setIsProductModalOpen(false);
    resetProductForm();
  };

  const resetProductForm = () => {
    setPErrors({});
    setPNewCategory("");
    setPAddingCategory(false);
    setEditingProductId(null);
    setPTitle("");
    setPCategory("");
    setPPrice("");
    setPComparePrice("");
    setPGst("");
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
    setPGst(typeof prod.gstRate === "number" ? String(prod.gstRate) : "");
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
    setCBannerUrl("");
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

  const closeCategoryEditor = () => {
    setIsCategoryModalOpen(false);
    resetCategoryForm();
    setCError("");
  };

  const openAddParentCollection = () => {
    resetCategoryForm();
    setCIsParent(true);
    setCategoryViewTab("collections");
    setIsCategoryModalOpen(true);
  };

  const openEditCategory = (cat: CategoryData) => {
    setEditingCategoryId(cat.id);
    setCName(cat.name);
    setCSlug(cat.slug);
    setCDesc(cat.description || "");
    setCImageUrl(cat.imageUrl || "");
    setCBannerUrl(cat.bannerUrl || "");
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
    if (!store) return;
    if (!cName.trim()) return setCError(`Give your ${cIsParent ? "collection" : "category"} a name.`);
    if (cIsParent && !cImageUrl.trim()) return setCError("Add a picture for the collection. It's shown on your home page.");
    setCError("");

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
        bannerUrl: cBannerUrl.trim() || undefined,
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
        bannerUrl: cBannerUrl.trim() || undefined,
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

  const handleDeleteCategory = async (catId: string, catName: string) => {
    if (!store) return;
    if (await appConfirm(`"${catName}" will be removed from your store. Its products stay, without this category.`, { title: "Delete this category?", danger: true })) {
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

  // Choosing a plan sets up automatic payments (Razorpay: card or UPI AutoPay). Until Razorpay is
  // switched on for the platform, it falls back to paying by UPI and waiting for approval.
  const [planBusy, setPlanBusy] = useState(false);
  const handleUpgradePlan = async (planId: "starter" | "pro", upiCycle: BillingCycle = "monthly") => {
    if (!store || planBusy) return;
    setPlanBusy(true);
    setUpgradeSuccess(false);
    try {
      await startPlanSubscription(store.subdomain, planId, { name: user?.displayName || undefined, email: user?.email || undefined, contact: store.contactPhone || undefined });
      refreshStore();
      setUpgradeSuccess(true);
      setActiveTab("billing");
      scrollDashTop({ top: 0 });
    } catch (err) {
      const code = err instanceof BillingError ? err.code : undefined;
      if (code === BILLING_NOT_CONFIGURED) openSubscriptionModal(planId, upiCycle);
      else if (code !== BILLING_DISMISSED) appAlert(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setPlanBusy(false);
    }
  };

  const handleActivateTheme = (themeSlug: string) => {
    if (!store) return;
    const res = storeService.setStoreTheme(store.subdomain, themeSlug);
    if (!res.success) {
      appAlert(res.error);
      setActiveTab("billing");
      return;
    }
    const themeName = getTheme(themeSlug).name;
    setThemeAppliedToast(themeName);
    refreshStore();
    setTimeout(() => setThemeAppliedToast(null), 3500);
  };

  // "Use this theme" in the marketplace comes back here with ?use=<theme>
  const useParam = searchParams.get("use");
  useEffect(() => {
    if (!useParam || !store) return;
    const url = new URL(window.location.href);
    url.searchParams.delete("use");
    window.history.replaceState(null, "", url.toString());
    const theme = getTheme(useParam);
    if (theme.slug !== useParam) return;
    if (theme.slug === getTheme(store.activeThemeSlug).slug) return;
    if (canUseTheme(store, theme.slug)) {
      appConfirm(`${theme.name} becomes the look of your shop. Your products and settings stay the same.`, { title: `Make ${theme.name} live?`, okLabel: "Make live" }).then(
        (ok) => ok && handleActivateTheme(theme.slug)
      );
    } else setThemeToBuy(theme.slug);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useParam, store?.subdomain]);

  const handleUpdateOrderStatus = (
    orderId: string,
    status: OrderData["fulfilmentStatus"]
  ) => {
    if (!store) return;
    const current = store.orders.find((x) => x.id === orderId);
    storeService.updateOrderStatus(store.subdomain, orderId, {
      fulfilmentStatus: status,
      // the return window starts when the order is delivered
      ...(status === "delivered" && !current?.deliveredAt ? { deliveredAt: new Date().toISOString() } : {}),
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

    const toPaise = (v: string) => Math.round((parseFloat(v) || 0) * 100);
    const fee = deliveryMode === "free" ? 0 : toPaise(deliveryFeeInput);
    const freeAbove = deliveryMode === "free_above" ? toPaise(freeAboveInput) : 0;
    if (deliveryMode !== "free" && (fee <= 0 || fee > 10_000_00)) {
      appAlert("Enter a delivery charge between ₹1 and ₹10,000.", { title: "Check delivery charge", tone: "danger" });
      return;
    }
    if (deliveryMode === "free_above" && freeAbove <= 0) {
      appAlert("Enter the order amount above which delivery is free.", { title: "Check delivery charge", tone: "danger" });
      return;
    }

    storeService.updateStore(store.subdomain, {
      announcementText: announcementInput,
      // without online payments, Cash on Delivery is the only way to pay, so it stays on
      codEnabled: planHas(store.planId, "paymentGateway") ? codEnabledInput : true,
      codFee: Math.round(parseFloat(codFeeInput || "0") * 100),
      standardDeliveryFee: fee,
      freeDeliveryThreshold: freeAbove,
    });
    appAlert("Your settings are saved.", { title: "Saved", tone: "success" });
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
      appAlert("Please enter both an email subject and a drop announcement message.");
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
      appAlert("Please upload or provide a banner image URL.");
      return;
    }

    if (!bTargetType) {
      appAlert("Please select whether this banner redirects to a Category or a Product.");
      return;
    }

    if (bTargetType === "category" && !bSelectedCategory) {
      appAlert("Please select which category this banner redirects to.");
      return;
    }

    if (bTargetType === "product" && !bSelectedProduct) {
      appAlert("Please select which product this banner redirects to.");
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
      appAlert(`Your plan allows ${bannerQuota.limit} banner${bannerQuota.limit === 1 ? "" : "s"}. Upgrade to add more.`);
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
  const [assistantOpen, setAssistantOpen] = useState(false);
  // beside the page when there's room for both, otherwise full screen (re-checked on resize and when the rail opens)
  const [assistantSide, setAssistantSide] = useState(false);
  const [assistantPrompt, setAssistantPrompt] = useState<{ id: number; text: string } | null>(null);
  const [tutorial, setTutorial] = useState<Tutorial | null>(null);
  const askAssistant = (text: string) => {
    setAssistantPrompt({ id: Date.now(), text });
    setAssistantOpen(true);
  };
  useEffect(() => {
    const check = () => setAssistantSide(assistantFitsBeside());
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [assistantOpen]);
  useEffect(() => {
    // Ctrl/Cmd + K opens the assistant
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setAssistantOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

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
  const subNow = subscriptionState(store);
  // the Subscription page gets a red dot while the plan is ending or has ended
  const planNeedsAttention = (subNow.kind === "active" && (subNow.endingSoon || subNow.autoPay?.stage === "retrying")) || (subNow.kind === "free" && !!subNow.endedPlanId);
  const policiesMissing = missingPolicies(store);
  const needsPolicy = !hasAnyPolicy(store);
  const shopClosed = isShopClosed(store);
  type DashTab = typeof activeTab;
  const navGroups: {
    label: string;
    items: { id: DashTab; label: string; icon: React.ComponentType<{ className?: string }>; badge?: number | "dot" | "lock" | "active" }[];
  }[] = [
    {
      label: "Sell",
      items: [
        { id: "overview", label: "Home", icon: IHome },
        { id: "analytics", label: "Analytics", icon: IAnalytics },
        { id: "orders", label: "Orders", icon: IOrders, badge: unfulfilledOrders.length > 0 ? "dot" : undefined },
        { id: "products", label: "Products", icon: IProducts, badge: totalProducts },
        { id: "categories", label: "Categories", icon: ICategories, badge: store.categories?.length || 0 },
        { id: "customers", label: "Customers", icon: ICustomers },
        { id: "reviews", label: "Reviews", icon: IReviews, badge: canUseReviews(store.planId) ? undefined : "lock" },
      ],
    },
    {
      label: "Promote",
      items: [
        { id: "discounts", label: "Discounts", icon: IDiscounts, badge: canUseCoupons(store.planId) ? store.discounts?.length || 0 : "lock" },
      ],
    },
    {
      label: "Your store",
      items: [
        { id: "themes", label: "Themes", icon: IThemes },
        { id: "plugins", label: "Plugins", icon: IPlugins },
        { id: "settings", label: "Settings", icon: ISettings, badge: policiesMissing.length || planNeedsAttention ? "dot" : undefined },
      ],
    },
  ];

  const pageTitles: Record<DashTab, { title: string; text: string }> = {
    overview: { title: "", text: "" },
    products: { title: "Products", text: "Add and edit what you sell: photos, prices and stock." },
    categories: { title: "Categories", text: "Group your products so buyers find things faster." },
    orders: { title: "Orders", text: "New orders, payments and deliveries." },
    discounts: { title: "Discounts", text: "Coupon codes buyers can use at checkout." },
    customers: { title: "Customers", text: "People who have ordered from you." },
    analytics: { title: "Analytics", text: "Every number about your shop, for any period." },
    reviews: { title: "Reviews", text: "Ratings buyers left on your products." },
    banners: { title: "Banners", text: "Big promo images at the top of your store." },
    policies: { title: "Settings", text: "Everything about how your store runs, in one place." },
    themes: { title: "Themes", text: "Choose how your store looks, then edit its text and photos." },
    billing: { title: "Settings", text: "Everything about how your store runs, in one place." },
    settings: { title: "Settings", text: "Everything about how your store runs, in one place." },
    plugins: { title: "Plugins", text: "Extra tools for your store: shipping, WhatsApp and email. More are coming." },
    notifications: { title: "Notifications", text: "Orders, stock alerts and updates from your store." },
    profile: { title: "Profile", text: "Your account, store and plan." },
  };

  // ---- Settings: one menu for everything about how the store runs (like Shopify's) ----
  type SettingsId = SettingsSection | "billing" | "plugins" | "policies";
  const SETTINGS_TABS = ["billing", "policies"] as const;
  const inSettings = activeTab === "settings" || (SETTINGS_TABS as readonly string[]).includes(activeTab);
  const settingsCurrent: SettingsId = activeTab === "settings" ? settingsSection : (activeTab as SettingsId);
  const SETTINGS_MENU_BASE: { id: SettingsId; label: string; icon: React.ComponentType<{ className?: string }>; dot?: boolean; tag?: string; maint?: boolean }[] = [
    { id: "general", label: "General", icon: IStore },
    { id: "billing", label: "Plan & billing", icon: ICard, dot: planNeedsAttention },
    { id: "store", label: "Store link & logo", icon: IImage },
    { id: "domain", label: "Domain", icon: IGlobe, tag: store.planId === "pro" ? undefined : "Pro" },
    { id: "payments", label: "Payments", icon: IRupee },
    { id: "checkout", label: "Checkout", icon: IOrders },
    { id: "accounts", label: "Customer accounts", icon: ICustomers },
    { id: "delivery", label: "Shipping & delivery", icon: ITruck },
    { id: "taxes", label: "Taxes", icon: IPercent },
    { id: "notifications", label: "Notifications", icon: INotifications },
   { id: "events", label: "Tracking & ads", icon: IActivity },
    { id: "privacy", label: "Customer privacy", icon: ILock },
    { id: "policies", label: "Policies", icon: IPolicies, dot: policiesMissing.length > 0 },
  ];
  const SETTINGS_MENU = SETTINGS_MENU_BASE.map((s) => ({ ...s, maint: maintenance.includes(s.id) }));
  const maintTag = (dark: boolean) => (
    <span className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${dark ? "bg-amber-400/15 text-amber-300" : "bg-amber-50 text-amber-700"}`}>
      <Wrench className="h-2.5 w-2.5" /> Maintenance
    </span>
  );
  const SETTINGS_HEAD: Record<SettingsId, { title: string; text: string }> = {
    general: { title: "General", text: "Your store's name, how buyers reach you, and whether you're open." },
    billing: { title: "Plan & billing", text: "Your ShoperSite plan, its limits and your past payments." },
    store: { title: "Store link & logo", text: "Your web address, logo and the message at the top of your store." },
    domain: { title: "Domain", text: "Use your own web address, like www.yourbrand.com, for your store." },
    payments: { title: "Payments", text: "Choose how buyers can pay. Money always goes straight to you." },
    checkout: { title: "Checkout", text: "Rules for placing an order: minimum amount, cash-on-delivery limit and what buyers fill in." },
    accounts: { title: "Customer accounts", text: "Whether buyers can order as guests or must sign in first." },
    delivery: { title: "Shipping & delivery", text: "What buyers pay for delivery." },
    taxes: { title: "Taxes", text: "Your GST number and how prices are shown." },
    notifications: { title: "Notifications", text: "Emails ShoperSite sends you about your store." },
    plugins: { title: "Emails to buyers", text: "Email your buyers about their orders and new products, from your own Gmail." },
    events: { title: "Tracking & ads", text: "Connect Meta (Facebook & Instagram) and Google to measure visits and ads." },
    privacy: { title: "Customer privacy", text: "Cookie notice and how buyers can ask about their data." },
    policies: { title: "Policies", text: "Terms, returns, shipping and privacy pages for your buyers. Your store needs at least one to open." },
  };
  const openSettings = (id: SettingsId) => {
    if ((SETTINGS_TABS as readonly string[]).includes(id)) setActiveTab(id as "billing" | "policies");
    else {
      setActiveTab("settings");
      setSettingsSection(id as SettingsSection);
    }
    setSettingsListOpen(false);
    scrollDashTop({ top: 0 });
  };
  const backToSettingsList = () => {
    if (activeTab !== "settings") setActiveTab("settings");
    setSettingsListOpen(true);
    scrollDashTop({ top: 0 });
  };
  goBackRef.current = () => {
    if (inEditor) return false;
    if (activeTab === "orders" && selectedOrder) return setSelectedOrder(null), true;
    if (activeTab === "products" && isProductModalOpen) return setIsProductModalOpen(false), true;
    if (activeTab === "categories" && isCategoryModalOpen) return setIsCategoryModalOpen(false), true;
    if (activeTab === "discounts" && isDiscountModalOpen) return setIsDiscountModalOpen(false), true;
    if (activeTab === "plugins" && pluginView) return setPluginView(null), true;
    if (activeTab === "overview") return false;
    if (inSettings) {
      // a settings page goes back to Settings, and Settings goes Home (phones: the list; computers: General)
      const phone = window.matchMedia("(max-width: 1023px)").matches;
      if (phone && !settingsListOpen) backToSettingsList();
      else if (!phone && settingsCurrent !== "general") openSettings("general");
      else {
        goingBack.current = true;
        setActiveTab("overview");
        scrollDashTop({ top: 0 });
      }
      return true;
    }
    goBackTab();
    return true;
  };
  /**
   * Computers: the settings menu on the left with the chosen page on the right.
   * Phones: the full list of settings first; tapping one opens that page on its own, with a back arrow.
   */
  const settingsFrame = (content: React.ReactNode) => (
    <div className="mt-4 grid items-start gap-6 sm:mt-6">
      <nav aria-label="Settings" className={`${settingsListOpen ? "block swap-enter" : "hidden"} lg:hidden`}>
        <div className="divide-y divide-neutral-100 overflow-hidden rounded-2xl border border-neutral-200 bg-white lg:flex lg:flex-col lg:gap-0.5 lg:divide-y-0 lg:overflow-visible lg:rounded-none lg:border-0 lg:bg-transparent">
          {SETTINGS_MENU.map((s) => {
            const on = settingsCurrent === s.id;
            return (
              <button
                key={s.id}
                type="button"
                data-tour={`set-${s.id}`}
                aria-current={on ? "page" : undefined}
                onClick={() => openSettings(s.id)}
                style={{ minHeight: 0 }}
                className={`relative flex w-full items-center gap-3 px-4 py-3.5 text-left text-[15px] transition-colors lg:rounded-xl lg:px-3 lg:py-2 lg:text-sm ${
                  on
                    ? "text-neutral-950 lg:bg-neutral-950 lg:font-semibold lg:text-white"
                    : "text-neutral-800 active:bg-neutral-50 lg:text-neutral-600 lg:hover:bg-white lg:hover:text-neutral-950"
                }`}
              >
                <s.icon className="h-[18px] w-[18px] shrink-0 lg:h-4 lg:w-4" />
                <span className="flex-1 font-medium lg:font-[inherit]">{s.label}</span>
                {s.maint && maintTag(false)}
                {s.tag && (
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${on ? "lg:bg-white/15 lg:text-white bg-neutral-100 text-neutral-500" : "bg-neutral-100 text-neutral-500"}`}>{s.tag}</span>
                )}
                {s.dot && <span className="h-2 w-2 rounded-full bg-amber-500" />}
                <ChevronRight className="h-4 w-4 shrink-0 text-neutral-400 lg:hidden" />
              </button>
            );
          })}
        </div>
      </nav>
      <div key={settingsCurrent} className={`${settingsListOpen ? "hidden" : "block"} swap-enter min-w-0 max-w-3xl space-y-4 sm:space-y-6 lg:block`}>
        {maintenance.includes(settingsCurrent) && (
          <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <Wrench className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <span>
              <b className="font-semibold">In maintenance.</b> We&apos;re working on this section, so some options may not work yet. Your saved settings are safe.
            </span>
          </div>
        )}
        {content}
      </div>
    </div>
  );

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
  const expiryNotices: { id: string; title: string; desc: string; time: string; type: string }[] = [];
  if (subNow.kind === "active" && subNow.autoPay?.stage === "retrying") {
    const name = PLATFORM_PLANS[subNow.planId]?.name || "paid";
    expiryNotices.push({
      id: `plan-retry-${new Date().toISOString().slice(0, 10)}`,
      title: `Your ${name} payment didn't go through`,
      desc: "We'll try again over the next few days. Keep enough balance in your account, or your shop moves to Free.",
      time: "Today",
      type: "plan",
    });
  } else if (subNow.kind === "active" && subNow.endingSoon && subNow.renewing && subNow.endsAt) {
    const name = PLATFORM_PLANS[subNow.planId]?.name || "paid";
    const day = new Date().toISOString().slice(0, 10);
    const n = subNow.daysLeft ?? 0;
    expiryNotices.push({
      id: `plan-expiry-${subNow.endsAt.toISOString().slice(0, 10)}-${day}`,
      title: n <= 0 ? `Your ${name} plan expires today` : `Your ${name} plan expires in ${n} day${n === 1 ? "" : "s"}`,
      desc: `Renew by ${subNow.endsAt.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} to keep your ${name} features.`,
      time: "Today",
      type: "plan",
    });
  } else if (subNow.kind === "free" && subNow.endedPlanId && subNow.endedAt) {
    const name = PLATFORM_PLANS[subNow.endedPlanId]?.name || "paid";
    expiryNotices.push({
      id: `plan-ended-${subNow.endedAt.toISOString().slice(0, 10)}`,
      title: `Your ${name} plan has ended`,
      desc: "Your store is on Free limits now. Renew to get your features back.",
      time: subNow.endedAt.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      type: "plan",
    });
  }
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
    ...expiryNotices.map((n) => ({ ...n, unread: !readNoticeIds.includes(n.id) })),
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
  const notificationIcon = (type: string, id = "") =>
    id.startsWith("plan-expiry") || id.startsWith("plan-ended")
      ? { icon: AlertTriangle, tone: "bg-red-50 text-red-600" }
      : type === "order"
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

  // a form or detail page inside a section (it has its own back button)
  const inEditor =
    (activeTab === "products" && isProductModalOpen) ||
    (activeTab === "categories" && isCategoryModalOpen) ||
    (activeTab === "discounts" && isDiscountModalOpen) ||
    (activeTab === "banners" && isBannerModalOpen) ||
    (activeTab === "orders" && !!selectedOrder);
  // phones: the top bar and bottom bar only show on the main pages; everything else is a sub page with a back button
  const showPhoneChrome = !inEditor && activeTab === "overview";
  // the phone's bottom bar is only on the two main screens, Home and the Orders list; inner pages
  // (an order's details, settings pages, products…) use their back arrow instead
  const showDock = !inEditor && (activeTab === "overview" || (activeTab === "orders" && !selectedOrder));

  const activeTheme = getTheme(store.activeThemeSlug);
  const productThumbs = store.products.map((p) => p.images?.[0]).filter(Boolean).slice(0, 4) as string[];
  const reviewAvg = store.reviews.length ? store.reviews.reduce((acc, r) => acc + r.rating, 0) / store.reviews.length : 0;
  const liveBanners = store.banners.filter((b) => b.isActive).length;

  return (
    <div className="dash home-sans min-h-screen w-full bg-[#F0F0F0] md:bg-[#0a0a0a] text-neutral-950">
      {/* Top bar on phones: profile · logo · notifications (desktop has them in the rail) */}
      <header className={`${showPhoneChrome ? "" : "hidden "}md:hidden fixed top-0 inset-x-0 z-40 h-16 bg-white/90 backdrop-blur-md border-b border-neutral-200`}>
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
                        const { icon: Icon, tone } = notificationIcon(n.type, n.id);
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
        active={inSettings ? "settings" : activeTab}
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

      {/* Settings menu on computers: slides out of the black sidebar like a branch of it */}
      <aside
        aria-label="Settings"
        aria-hidden={!inSettings}
        style={{ "--rail": `${RAIL_WIDTH}px` } as React.CSSProperties}
        className={`fixed bottom-3 top-3 z-30 hidden w-[232px] flex-col rounded-[24px] border border-white/[0.08] bg-[#171717] px-3 pb-5 pt-6 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-[transform,opacity,left] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] lg:flex left-[var(--dash-rail,var(--rail))] ${
          inSettings && !inEditor ? "translate-x-0 opacity-100" : "pointer-events-none -translate-x-full opacity-0"
        }`}
      >
        <div className="mb-3 flex items-center gap-2 border-b border-white/[0.08] px-3 pb-4">
          <ISettings className="h-4 w-4 text-white/70" />
          <p className="text-sm font-semibold">Settings</p>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto overscroll-contain pr-1 [scrollbar-width:thin]">
          {SETTINGS_MENU.map((s) => {
            const on = settingsCurrent === s.id;
            return (
              <button
                key={s.id}
                type="button"
                data-tour={`set-${s.id}`}
                aria-current={on ? "page" : undefined}
                onClick={() => openSettings(s.id)}
                style={{ minHeight: 0 }}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${on ? "bg-white font-semibold text-neutral-950" : "text-white/60 hover:bg-white/[0.08] hover:text-white"}`}
              >
                <s.icon className="h-4 w-4 shrink-0" />
                <span className="flex-1 truncate">{s.label}</span>
                {s.maint && maintTag(!on)}
                {s.tag && <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${on ? "bg-neutral-100 text-neutral-600" : "bg-white/10 text-white/70"}`}>{s.tag}</span>}
                {s.dot && <span className="h-2 w-2 rounded-full bg-amber-400" />}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area: under the top bar on phones; on desktop a rounded panel beside the black rail */}
      <div className={`${showPhoneChrome ? "pt-16" : "pt-[env(safe-area-inset-top)]"} md:pt-3 md:pb-3 md:pl-[var(--dash-rail,var(--rail))] ${inSettings && !inEditor ? "lg:pl-[calc(var(--dash-rail,var(--rail))+244px)]" : ""} md:pr-3 ${assistantOpen && assistantSide ? "md:pr-[calc(var(--aw)+1.5rem)]" : ""} md:transition-[padding] md:duration-500 md:ease-[cubic-bezier(0.22,1,0.36,1)] flex flex-col min-h-screen md:h-screen md:min-h-0 overflow-x-clip`} style={{ "--rail": `${RAIL_WIDTH}px`, "--aw": `${ASSISTANT_WIDTH}px` } as React.CSSProperties}>
        <div id="dash-scroll" className="flex-1 flex flex-col md:min-h-0 md:overflow-y-auto md:overscroll-contain md:rounded-[28px] md:bg-[#F0F0F0] dash-panel-scroll">
        {/* Main Workspace Area (Scrolls smoothly under the fixed top header) */}
        <main className={`flex-1 min-w-0 px-5 pt-5 sm:px-10 sm:pt-8 lg:px-16 lg:pt-10 ${showDock ? "pb-28" : "pb-10"} md:pb-14 max-w-6xl w-full mx-auto`}>
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
          {/* moving between settings pages keeps the frame still; only the page inside changes */}
          <div key={inSettings ? "settings" : activeTab} className="tab-enter">
          {/* Page title (overview greets you inside the hero card): a soft band in the section's own colour */}
          {activeTab !== "overview" && !inEditor && (() => {
            const look: Record<string, { section: Section; icon: React.ElementType }> = {
              products: { section: "products", icon: IProducts },
              categories: { section: "categories", icon: ICategories },
              orders: { section: "orders", icon: IOrders },
              discounts: { section: "discounts", icon: IDiscounts },
              customers: { section: "customers", icon: ICustomers },
              analytics: { section: "overview", icon: IAnalytics },
              reviews: { section: "reviews", icon: IStar },
              banners: { section: "themes", icon: IImage },
              themes: { section: "themes", icon: IThemes },
              plugins: { section: "plugins", icon: IPlugins },
              notifications: { section: "notifications", icon: INotifications },
              profile: { section: "profile", icon: IProfile },
            };
            const l = look[activeTab] || { section: "settings" as Section, icon: ISettings };
            // Settings: one header naming the page you're on; its back arrow returns to the settings list on phones
            const settingsPage = inSettings && !settingsListOpen;
            return (
              <PageHero
                section={l.section}
                icon={l.icon}
                title={settingsPage ? SETTINGS_HEAD[settingsCurrent].title : pageTitles[activeTab].title}
                onBack={() => goBackRef.current()}
                actions={
                  activeTab === "orders" && !selectedOrder ? (
                    <button
                      type="button"
                      onClick={() => setOrderFilter(orderFilter === "abandoned" ? "all" : "abandoned")}
                      aria-pressed={orderFilter === "abandoned"}
                      className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[12px] font-semibold md:hidden ${
                        orderFilter === "abandoned" ? "border-neutral-950 bg-neutral-950 text-white" : "border-neutral-200 bg-white text-neutral-700"
                      }`}
                    >
                      Abandoned{abandonedCount ? ` ${abandonedCount}` : ""}
                    </button>
                  ) : undefined
                }
              />
            );
          })()}

          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <>
            {/* Phones and the Android app: the analytics Home sellers know */}
            <div className="space-y-6 md:hidden">
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
                <span className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => dashTour.current?.()}
                  className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:border-neutral-400 transition-colors"
                >
                  <HelpCircle className="w-3.5 h-3.5" /> Show me around
                </button>
                <a
                  data-tour="store-link"
                  href={liveStoreUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="hidden sm:inline-flex shrink-0 items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:border-neutral-400 transition-colors"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {storeWebDomain}
                </a>
                </span>
              </div>

              <section
                data-tour="stats"
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
                    tone: { chip: "text-neutral-900", pill: "bg-neutral-100 text-neutral-700", line: "bg-neutral-900" },
                  },
                  {
                    label: "Avg. order",
                    icon: ShoppingCart,
                    value: `₹${Math.round(analyticsData.avgOrderValue / 100).toLocaleString("en-IN")}`,
                    pill: `${analyticsData.buyers} ${analyticsData.buyers === 1 ? "buyer" : "buyers"}`,
                    tone: { chip: "text-neutral-900", pill: "bg-neutral-100 text-neutral-700", line: "bg-neutral-900" },
                  },
                  {
                    label: "Products",
                    icon: Package,
                    tab: "products" as const,
                    value: <CountUp from={0} to={totalProducts} />,
                    pill: currentPlan.maxProducts >= 9999 ? "∞" : `${Math.max(0, currentPlan.maxProducts - totalProducts)} left`,
                    tone: { chip: "text-neutral-900", pill: "bg-neutral-100 text-neutral-700", line: "bg-neutral-900" },
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
                      <span className={`flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6 ${m.tone.chip}`}>
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
                        <div className="relative flex shrink-0 items-center justify-center text-neutral-900">
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
                    <span aria-hidden className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-white/10 blur-3xl animate-float-gentle" />
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
                    {currentPlan.maxProducts >= 9999 ? (
                      <p className="mt-3 text-xs text-neutral-500">
                        <span className="text-neutral-950 font-semibold tabular-nums">{store.products.length}</span> product{store.products.length === 1 ? "" : "s"} · no product limit on your plan
                      </p>
                    ) : (
                    <>
                    <p className="mt-3 text-xs text-neutral-500">
                      <span className="text-neutral-950 font-semibold tabular-nums">{store.products.length}</span> of {currentPlan.maxProducts} products used
                    </p>
                    <div className="mt-2 w-full h-1.5 rounded-full bg-neutral-100 overflow-hidden">
                      <div
                        className="bar-grow h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                        style={{
                          width: `${Math.min(100, Math.max(4, (store.products.length / currentPlan.maxProducts) * 100))}%`,
                        }}
                      />
                    </div>
                    <button
                      onClick={() => setActiveTab("billing")}
                      className="mt-4 w-full h-9 rounded-[10px] border border-neutral-300 text-xs font-semibold hover:border-black hover:bg-black hover:text-white inline-flex items-center justify-center gap-1.5 transition-colors"
                    >
                      {store.planId === "free" ? `See plans from ₹${(PLATFORM_PLANS.starter.priceMonthly / 100).toLocaleString("en-IN")}/mo` : "Compare plans"}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    </>
                    )}
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
                    <span aria-hidden className="pointer-events-none absolute -left-16 -top-20 w-64 h-64 rounded-full bg-white/10 blur-3xl transition-opacity duration-500 group-hover:opacity-100 opacity-60" />
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
                    <span className="flex items-center justify-center text-neutral-900 transition-transform duration-300 group-hover:scale-110">
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
                      <span className="flex shrink-0 items-center justify-center text-neutral-900 transition-transform duration-300 group-hover:scale-110">
                        <FolderTree className="w-4 h-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold">Categories</span>
                        <span className="block text-[11px] text-neutral-500">{store.categories.length ? `${store.categories.length} in your store` : "Add your first category"}</span>
                      </span>
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

                  {/* Policies — small */}
                  <button type="button" data-tour="policies" onClick={() => setActiveTab("policies")} className={`group relative overflow-hidden text-left rounded-2xl bg-white border border-neutral-200 transition-all duration-300 hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-[0_20px_44px_-24px_rgba(0,0,0,0.3)] col-start-1 row-start-4 p-3 sm:p-4 flex flex-col justify-between`}>
                    <span className={`flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${policiesMissing.length ? "text-amber-600" : "text-neutral-900"}`}>
                      <Scale className="w-4 h-4" />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold">Policies</span>
                      <span className="hidden sm:block text-[11px] text-neutral-500 truncate">{policiesMissing.length ? `${policiesMissing.length} to add` : "All live"}</span>
                    </span>
                  </button>
                </div>
              </section>

              {policiesMissing.length > 0 && (
                <section className="hero-rise flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:p-5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                    <AlertTriangle className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-neutral-900">Add your policy pages to protect your store</span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-neutral-600">
                      Online shops in India must show their terms, refund, shipping and privacy policies. {policiesMissing.length} of 4 still to add; templates are ready to edit.
                    </span>
                  </span>
                  <button type="button" onClick={() => setActiveTab("policies")} className="h-10 shrink-0 rounded-xl bg-neutral-950 px-4 text-sm font-semibold text-white hover:bg-black">
                    Add policies
                  </button>
                </section>
              )}

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
            {/* Tablets and computers: the new Home */}
            <div className="hidden space-y-10 sm:space-y-12 md:block">
              {/* Home: start work here (numbers line, greeting, ask the assistant, what needs doing), then ideas */}
              <HomeFeed
                store={store}
                storeLink={liveStoreUrl}
                ownerName={ownerName}
                greeting={greetingTime}
                shopClosed={shopClosed}
                closedMessage={closedMsgDraft}
                onClosedMessage={setClosedMsgDraft}
                onSaveClosedMessage={saveClosedMessage}
                onToggleShop={toggleShopOpen}
                onAsk={askAssistant}
                onNavigate={(page) => {
                  setActiveTab(page);
                  scrollDashTop({ top: 0 });
                }}
                onTour={() => dashTour.current?.()}
                onStartTutorial={(t) => {
                  setAssistantOpen(false);
                  setTutorial(t);
                }}
              />
              <Tour id="dashboard-overview" startRef={dashTour} steps={DASHBOARD_TOUR} />

              {/* Platform banners (uploaded from the admin dashboard) */}
              <div className="hero-rise" style={{ animationDelay: "480ms" }}>
                <AnnouncementBanners onOpenTab={(tab) => setActiveTab(tab as DashTab)} />
              </div>

              {/* Setup checklist */}
              {(() => {
                const steps = SETUP_STEPS.map((st, i) => ({
                  label: st.id === "products" ? `${st.title} (${Math.min(totalProducts, 5)}/5)` : st.title,
                  done: isSetupStepDone(store, st.id),
                  run: () => setSetupStart(i),
                }));
                const doneCount = steps.filter((st) => st.done).length;
                const allDone = doneCount === steps.length;
                if (allDone) return null;
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
            </>
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
                const { icon: Icon, tone } = notificationIcon(n.type, n.id);
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
                      <h2 className="text-lg font-semibold tracking-tight">{ownerName}</h2>
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
                    { label: "Store settings", icon: ISettings, tab: "settings" as const, tone: "bg-neutral-100 text-neutral-700" },
                    { label: "Themes", icon: IThemes, tab: "themes" as const, tone: "bg-fuchsia-50 text-fuchsia-600" },
                    { label: "Notifications", icon: INotifications, tab: "notifications" as const, tone: "bg-indigo-50 text-indigo-600" },
                    { label: "Plan & billing", icon: ICard, tab: "billing" as const, tone: "bg-amber-50 text-amber-600" },
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
                    className="-ml-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900 transition-colors cursor-pointer"
                    title="Back to Catalog"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div>
                    <h2 className="text-base font-semibold tracking-tight text-neutral-900">
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

              {(pErrors.form || Object.keys(pErrors).length > 0) && (
                <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    {pErrors.form || "Some details need fixing before this product can be saved."}
                    {pErrors.form && /limit/i.test(pErrors.form) && (
                      <button type="button" onClick={() => setActiveTab("billing")} className="ml-2 font-semibold underline underline-offset-2">
                        See plans
                      </button>
                    )}
                  </span>
                </div>
              )}
              {/* Full Page Product Form Grid */}
              <form onSubmit={handleSaveProduct} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left 7 Columns: Product Information & Pricing */}
                <div className="lg:col-span-7 space-y-6">
                  {/* Card 1: Product Basics */}
                  <div className="p-6 rounded-xl bg-white border border-neutral-200 shadow-xs space-y-4">
                    <h3 className="flex items-center gap-2 border-b border-neutral-100 pb-3 text-sm font-semibold text-neutral-900">
                      <SectionIcon section="products" icon={IProducts} size="sm" />
                      Basic information
                    </h3>

                    <div>
                      <label className="font-bold block mb-1 text-xs text-neutral-800">Product Title *</label>
                      <Input
                        data-tour="p-title"
                        placeholder="e.g. Vintage Washed Oversized Heavyweight Tee"
                        value={pTitle}
                        maxLength={120}
                        onChange={(e) => (setPTitle(e.target.value), setPErrors((x) => ({ ...x, title: undefined })))}
                        className={`text-xs rounded-lg ${pErrors.title ? "!border-red-500" : ""}`}
                        required
                      />
                      {pErrors.title && <p className="mt-1 text-[11px] font-medium text-red-600">{pErrors.title}</p>}
                    </div>

                    <ProductCategoryField
                      categories={(store.categories || []).filter((c) => !c.isParent)}
                      value={pCategory}
                      onChange={(v) => (setPCategory(v), setPErrors((x) => ({ ...x, category: undefined })))}
                      adding={pAddingCategory || !(store.categories || []).some((c) => !c.isParent)}
                      onAdding={(on) => (setPAddingCategory(on), setPErrors((x) => ({ ...x, category: undefined })))}
                      newName={pNewCategory}
                      onNewName={(v) => (setPNewCategory(v), setPErrors((x) => ({ ...x, category: undefined })))}
                      error={pErrors.category}
                    />

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
                    <h3 className="flex items-center gap-2 border-b border-neutral-100 pb-3 text-sm font-semibold text-neutral-900">
                      <SectionIcon section="reviews" icon={IRupee} size="sm" />
                      Price & stock
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="font-bold block mb-1 text-xs text-neutral-800">Selling Price (₹) *</label>
                        <Input
                          data-tour="p-price"
                          type="text"
                          inputMode="decimal"
                          placeholder="699"
                          value={pPrice}
                          onChange={(e) => (setPPrice(moneyInput(e.target.value)), setPErrors((x) => ({ ...x, price: undefined, mrp: undefined })))}
                          className={`text-xs rounded-lg ${pErrors.price ? "!border-red-500" : ""}`}
                          required
                        />
                        {pErrors.price ? (
                          <p className="mt-1 text-[11px] font-medium text-red-600">{pErrors.price}</p>
                        ) : (
                          <p className="text-[10px] text-neutral-400 mt-1">Price charged to customer</p>
                        )}
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
                          type="text"
                          inputMode="decimal"
                          placeholder="999"
                          value={pComparePrice}
                          onChange={(e) => (setPComparePrice(moneyInput(e.target.value)), setPErrors((x) => ({ ...x, mrp: undefined })))}
                          className={`text-xs rounded-lg ${pErrors.mrp ? "!border-red-500" : ""}`}
                        />
                        {pErrors.mrp ? (
                          <p className="mt-1 text-[11px] font-medium text-red-600">{pErrors.mrp}</p>
                        ) : (
                          <p className="text-[10px] text-neutral-400 mt-1">Crossed-out MRP, higher than the price (optional)</p>
                        )}
                      </div>
                    </div>

                    {store.gstin && (
                      <div className="pt-2 border-t border-neutral-100">
                        <label className="font-bold block mb-1 text-xs text-neutral-800">GST rate (for invoices)</label>
                        <select
                          value={pGst}
                          onChange={(e) => setPGst(e.target.value)}
                          className="h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-xs outline-none focus:border-neutral-900 sm:max-w-xs"
                        >
                          <option value="">Use my default ({store.defaultGstRate ?? 18}%)</option>
                          {GST_RATES.map((r) => (
                            <option key={r} value={String(r)}>
                              {r}%
                            </option>
                          ))}
                        </select>
                        <p className="text-[10px] text-neutral-400 mt-1">Your price already includes this GST; the invoice shows the split.</p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-neutral-100">
                      <div>
                        <label className="font-bold block mb-1 text-xs text-neutral-800">Stock Quantity *</label>
                        <Input
                          data-tour="p-stock"
                          type="text"
                          inputMode="numeric"
                          placeholder="25"
                          value={pStock}
                          onChange={(e) => (setPStock(e.target.value.replace(/\D/g, "").slice(0, 6)), setPErrors((x) => ({ ...x, stock: undefined })))}
                          className={`text-xs rounded-lg ${pErrors.stock ? "!border-red-500" : ""}`}
                          required
                        />
                        {pErrors.stock && <p className="mt-1 text-[11px] font-medium text-red-600">{pErrors.stock}</p>}
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
                    <h3 className="flex items-center gap-2 border-b border-neutral-100 pb-3 text-sm font-semibold text-neutral-900">
                      <SectionIcon section="themes" icon={IImage} size="sm" />
                      Photos
                    </h3>

                    <div className="space-y-2">
                      <label className="font-bold block text-xs text-neutral-800">Product Image URL</label>
                      <div data-tour="p-photo" className="flex gap-2">
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
                              e.target.value = "";
                              if (file) uploadPhoto(file, 4 / 5, setPImageUrl);
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
                      data-tour="p-save"
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
                const words = productSearch.trim().toLowerCase().split(/\s+/).filter(Boolean);
                const productCats = Array.from(new Set(store.products.map((p) => p.category).filter(Boolean))).sort((a, b) => a.localeCompare(b));
                const list = store.products
                  .filter((p) => {
                    const stockOk =
                      productFilter === "all" ||
                      (productFilter === "in" && p.stock > LOW) ||
                      (productFilter === "low" && p.stock > 0 && p.stock <= LOW) ||
                      (productFilter === "out" && p.stock <= 0);
                    if (!stockOk || (productCategory && p.category !== productCategory)) return false;
                    // keywords: every word must appear in the name, category or description
                    const hay = `${p.title} ${p.category} ${p.description || ""}`.toLowerCase();
                    return words.every((w) => hay.includes(w));
                  })
                  .sort((a, b) =>
                    productSort === "az"
                      ? a.title.localeCompare(b.title)
                      : productSort === "price-low"
                        ? a.price - b.price
                        : productSort === "price-high"
                          ? b.price - a.price
                          : productSort === "stock-low"
                            ? a.stock - b.stock
                            : String(b.createdAt || "").localeCompare(String(a.createdAt || ""))
                  );
                const filtersOn = !!(productCategory || words.length || productFilter !== "all");
                const startAdd = () => {
                  if (!productQuota.allowed) {
                    setActiveTab("billing");
                    return;
                  }
                  resetProductForm();
                  setIsProductModalOpen(true);
                };
                const chips = [
                  { id: "all" as const, label: "All" },
                  { id: "in" as const, label: "In stock" },
                  { id: "low" as const, label: "Low" },
                  { id: "out" as const, label: "Sold out" },
                ];
                return (
                  <>
                    <div className="m-stagger hidden grid-cols-2 gap-3 md:grid lg:grid-cols-4">
                      {[
                        { id: "all" as const, label: "All products", icon: IProducts, tile: "bg-neutral-100 text-neutral-900", on: "border-neutral-900 ring-2 ring-neutral-100", hint: `₹${Math.round(store.products.reduce((n, p) => n + p.price * Math.max(0, p.stock), 0) / 100).toLocaleString("en-IN")} in stock value` },
                        { id: "in" as const, label: "In stock", icon: ICheck, tile: "bg-neutral-100 text-neutral-900", on: "border-neutral-900 ring-2 ring-neutral-100", hint: "Ready to sell" },
                        { id: "low" as const, label: "Low stock", icon: IWarning, tile: "bg-neutral-100 text-neutral-900", on: "border-neutral-900 ring-2 ring-neutral-100", hint: counts.low ? "Restock soon" : "Nothing running low" },
                        { id: "out" as const, label: "Sold out", icon: ISoldOut, tile: "bg-neutral-100 text-neutral-900", on: "border-neutral-900 ring-2 ring-neutral-100", hint: counts.out ? "Buyers can't order these" : "None sold out" },
                      ].map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setProductFilter(f.id)}
                          className={`group rounded-2xl border bg-white p-4 text-left transition-all duration-300 hover:-translate-y-0.5 ${
                            productFilter === f.id ? f.on : "border-neutral-200 hover:border-neutral-300"
                          }`}
                        >
                          <f.icon className="h-5 w-5 text-neutral-900" />
                          <span className="mt-3 block text-xs font-medium text-neutral-500">{f.label}</span>
                          <span className="mt-0.5 block text-[1.45rem] font-semibold leading-tight tracking-tight tabular-nums">{counts[f.id]}</span>
                          <span className="mt-0.5 block truncate text-xs text-neutral-500">{f.hint}</span>
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-row sm:gap-3">
                      {/* search with one Filters button beside it */}
                      <div className="col-span-2 flex min-w-0 flex-1 gap-2">
                      <label className="flex min-w-0 flex-1 items-center gap-2 h-11 px-3.5 rounded-xl border border-neutral-200 bg-white focus-within:border-neutral-900 transition-colors">
                        <Search className="w-4 h-4 text-neutral-400 shrink-0" />
                        <input
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                          placeholder="Search by name or keyword"
                          className="w-full bg-transparent text-sm outline-none"
                        />
                        {productSearch && (
                          <button type="button" onClick={() => setProductSearch("")} aria-label="Clear search" className="text-neutral-400 hover:text-neutral-900">
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </label>
                      <FilterMenu
                        activeCount={(productFilter !== "all" ? 1 : 0) + (productCategory ? 1 : 0) + (productSort !== "new" ? 1 : 0)}
                        onClear={() => {
                          setProductFilter("all");
                          setProductCategory("");
                          setProductSort("new");
                        }}
                        sections={[
                          {
                            id: "stock",
                            title: "Stock",
                            value: productFilter,
                            onChange: (v) => setProductFilter(v as typeof productFilter),
                            options: [
                              { value: "all", label: "All", count: counts.all },
                              { value: "in", label: "In stock", count: counts.in },
                              { value: "low", label: "Low stock", count: counts.low },
                              { value: "out", label: "Sold out", count: counts.out },
                            ],
                          },
                          ...(productCats.length
                            ? [
                                {
                                  id: "category",
                                  title: "Category",
                                  kind: (productCats.length > 6 ? "list" : "chips") as "list" | "chips",
                                  value: productCategory,
                                  onChange: setProductCategory,
                                  options: [
                                    { value: "", label: "All" },
                                    ...productCats.map((c) => ({ value: c, label: c, count: store.products.filter((p) => p.category === c).length })),
                                  ],
                                },
                              ]
                            : []),
                          {
                            id: "sort",
                            title: "Sort by",
                            kind: "list",
                            value: productSort,
                            onChange: (v) => setProductSort(v as typeof productSort),
                            options: [
                              { value: "new", label: "Newest first" },
                              { value: "az", label: "Name A–Z" },
                              { value: "price-low", label: "Price: low to high" },
                              { value: "price-high", label: "Price: high to low" },
                              { value: "stock-low", label: "Stock: lowest first" },
                            ],
                          },
                        ]}
                      />
                      </div>
                      <button
                        type="button"
                        onClick={startAdd}
                        className="h-11 px-4 sm:px-5 rounded-xl bg-neutral-950 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 hover:bg-black transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Add product
                      </button>
                      <button
                        type="button"
                        onClick={() => (!planHas(store.planId, "bulkUpload") ? openSettings("billing") : productQuota.allowed ? setBulkOpen(true) : setActiveTab("billing"))}
                        title={planHas(store.planId, "bulkUpload") ? undefined : "Bulk upload is part of Growth"}
                        className="h-11 px-4 sm:px-5 rounded-xl border border-neutral-300 bg-white text-sm font-semibold inline-flex items-center justify-center gap-2 hover:border-neutral-900 transition-colors"
                      >
                        <Upload className="w-4 h-4" />
                        Bulk upload
                        {!planHas(store.planId, "bulkUpload") && <span className="rounded-full bg-neutral-100 px-1.5 py-0.5 text-[10px] font-semibold text-neutral-500">Growth</span>}
                      </button>
                    </div>
                    {bulkOpen && (
                      <BulkUploadPanel
                        store={store}
                        onClose={() => setBulkOpen(false)}
                        onDone={(n) => {
                          setBulkOpen(false);
                          refreshStore();
                          setBulkNote(`${n} product${n === 1 ? "" : "s"} added.`);
                        }}
                      />
                    )}
                    {bulkNote && (
                      <p className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-800">
                        <CheckCircle2 className="w-4 h-4" /> {bulkNote}
                        <button type="button" onClick={() => setBulkNote("")} className="ml-auto text-emerald-700" aria-label="Dismiss"><X className="w-4 h-4" /></button>
                      </p>
                    )}
                    <p className="-mt-2 flex flex-wrap items-center gap-x-2 text-xs text-neutral-500">
                      {filtersOn && <span className="font-medium text-neutral-800">Showing {list.length} of {store.products.length}</span>}
                      {filtersOn && <span>·</span>}
                      <span>
                        {currentPlan.maxProducts >= 9999
                          ? `${totalProducts} products · unlimited on your plan`
                          : `${totalProducts} of ${currentPlan.maxProducts} product slots used`}
                      </span>
                      {filtersOn && (
                        <button
                          type="button"
                          onClick={() => {
                            setProductSearch("");
                            setProductCategory("");
                            setProductFilter("all");
                            setProductSort("new");
                          }}
                          className="font-semibold text-neutral-900 underline underline-offset-2"
                        >
                          Clear filters
                        </button>
                      )}
                    </p>

                    {list.length === 0 ? (
                      store.products.length ? (
                        <div className="rounded-2xl border border-dashed border-neutral-300 bg-white px-6 py-10 text-center text-sm text-neutral-500">
                          No products match. Try a different search or filter.
                        </div>
                      ) : (
                        <EmptyState
                          section="products"
                          icon={IProducts}
                          title="Add your first product"
                          text="A good photo, a clear name and a price is all it takes. You can add sizes, MRP and stock too, or upload many products at once from a spreadsheet."
                          action={{ label: "Add product", onClick: startAdd, icon: Plus }}
                          secondary={{ label: "Bulk upload", onClick: () => (productQuota.allowed ? setBulkOpen(true) : setActiveTab("billing")) }}
                        />
                      )
                    ) : (
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
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
                              className={`group flex flex-col rounded-xl border border-neutral-200 bg-white overflow-hidden transition-all duration-300 hover:border-neutral-300 hover:shadow-[0_14px_30px_-22px_rgba(0,0,0,0.35)] animate-enter-slide-up stagger-${(idx % 6) + 1}`}
                            >
                              <div className="relative aspect-[4/3] bg-neutral-100 overflow-hidden">
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
                              <div className="flex-1 flex flex-col p-2.5">
                                <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 truncate">{prod.category}</span>
                                <h4 className="mt-0.5 text-[13px] font-semibold leading-snug truncate" title={prod.title}>{prod.title}</h4>
                                <span className="mt-0.5 flex items-baseline gap-1.5">
                                  <span className="text-[13px] font-semibold">₹{(prod.price / 100).toLocaleString("en-IN")}</span>
                                  {prod.compareAtPrice && prod.compareAtPrice > prod.price && (
                                    <span className="text-[11px] text-neutral-400 line-through">
                                      ₹{(prod.compareAtPrice / 100).toLocaleString("en-IN")}
                                    </span>
                                  )}
                                </span>
                                <div className="mt-auto pt-2.5 flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => openEditProduct(prod)}
                                    className="flex-1 h-8 rounded-[9px] bg-neutral-950 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 hover:bg-black transition-colors"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                    Edit
                                  </button>
                                  <Link
                                    href={getStoreUrl(store.subdomain, `/products/${prod.slug}`)}
                                    target="_blank"
                                    aria-label={`View ${prod.title} in your store`}
                                    className="w-8 h-8 shrink-0 rounded-[9px] border border-neutral-200 flex items-center justify-center text-neutral-600 hover:border-neutral-900 hover:text-black transition-colors"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </Link>
                                  <button
                                    type="button"
                                    aria-label={`Delete ${prod.title}`}
                                    onClick={async () => {
                                      if (await appConfirm(`"${prod.title}" will be removed from your store. This can't be undone.`, { title: "Delete this product?", danger: true })) {
                                        storeService.deleteProduct(store.subdomain, prod.id);
                                        refreshStore();
                                      }
                                    }}
                                    className="w-8 h-8 shrink-0 rounded-[9px] border border-neutral-200 flex items-center justify-center text-neutral-400 hover:border-red-200 hover:bg-red-50 hover:text-red-600 transition-colors"
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
            <form onSubmit={handleSaveCategory} noValidate className="mx-auto max-w-2xl pb-24 sm:pb-4 animate-enter-scale">
              {/* header */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={closeCategoryEditor}
                  aria-label="Back"
                  className="-ml-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <div className="min-w-0 flex-1">
                  <h1 className="truncate text-base sm:text-lg font-semibold tracking-tight leading-tight">
                    {editingCategoryId ? (cIsParent ? "Edit collection" : "Edit category") : cIsParent ? "New collection" : "New category"}
                  </h1>
                  <p className="truncate text-xs sm:text-sm text-neutral-500">
                    {cIsParent ? "Groups categories on your store's home page" : "Groups products, like T-shirts or Jeans"}
                  </p>
                </div>
                <div className="hidden sm:flex items-center gap-2">
                  <button type="button" onClick={closeCategoryEditor} className="h-10 px-4 rounded-xl border border-neutral-200 bg-white text-sm font-medium hover:border-neutral-900">
                    Cancel
                  </button>
                  <button type="submit" className="h-10 px-5 rounded-xl bg-neutral-950 text-white text-sm font-semibold hover:bg-black">
                    {editingCategoryId ? "Save changes" : "Save"}
                  </button>
                </div>
              </div>

              {/* type (only when creating) */}
              {!editingCategoryId && (
                <div role="radiogroup" aria-label="Type" className="mt-6 grid grid-cols-2 gap-1 rounded-xl bg-neutral-100 p-1">
                  {([
                    { parent: false, label: "Category" },
                    { parent: true, label: "Collection" },
                  ] as const).map((t) => (
                    <button
                      key={t.label}
                      type="button"
                      role="radio"
                      aria-checked={cIsParent === t.parent}
                      onClick={() => {
                        setCIsParent(t.parent);
                        setCError("");
                      }}
                      style={{ minHeight: 0 }}
                      className={`h-10 rounded-lg text-sm font-medium transition-colors ${cIsParent === t.parent ? "bg-white text-neutral-950 shadow-sm" : "text-neutral-500 hover:text-neutral-900"}`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              )}

              {/* details */}
              <section className="mt-5 rounded-2xl border border-neutral-200 bg-white p-5 space-y-4">
                <div>
                  <label htmlFor="cat-name" className="block text-sm font-medium">Name</label>
                  <input
                    id="cat-name"
                    value={cName}
                    onChange={(e) => {
                      setCName(e.target.value);
                      setCError("");
                      if (!editingCategoryId) {
                        setCSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
                      }
                    }}
                    placeholder={cIsParent ? "e.g. Men, Summer edit" : "e.g. T-shirts, Jeans"}
                    className="mt-1.5 h-11 w-full rounded-xl border border-neutral-300 bg-white px-3.5 text-sm outline-none focus:border-neutral-900"
                  />
                </div>

                {cIsParent ? (
                  <>
                    <div>
                      <label htmlFor="cat-tagline" className="block text-sm font-medium">
                        Short line <span className="font-normal text-neutral-400">(optional)</span>
                      </label>
                      <input
                        id="cat-tagline"
                        value={cSubtitle}
                        onChange={(e) => setCSubtitle(e.target.value)}
                        placeholder="e.g. Everyday fits"
                        className="mt-1.5 h-11 w-full rounded-xl border border-neutral-300 bg-white px-3.5 text-sm outline-none focus:border-neutral-900"
                      />
                    </div>
                    <div>
                      <label htmlFor="cat-cta" className="block text-sm font-medium">
                        Button text <span className="font-normal text-neutral-400">(optional)</span>
                      </label>
                      <input
                        id="cat-cta"
                        value={cCtaText}
                        onChange={(e) => setCCtaText(e.target.value)}
                        placeholder={`Shop ${cName.trim() || "now"}`}
                        className="mt-1.5 h-11 w-full rounded-xl border border-neutral-300 bg-white px-3.5 text-sm outline-none focus:border-neutral-900"
                      />
                    </div>
                    <div>
                      <div className="flex items-baseline justify-between">
                        <span className="block text-sm font-medium">Categories in this collection</span>
                        <span className="text-xs text-neutral-500 tabular-nums">{cSelectedChildren.length} selected</span>
                      </div>
                      {(store.categories || []).filter((c) => !c.isParent).length === 0 ? (
                        <p className="mt-1.5 text-sm text-neutral-500">Add categories first, then pick them here.</p>
                      ) : (
                        <div className="mt-2 max-h-60 overflow-y-auto rounded-xl border border-neutral-200 divide-y divide-neutral-100">
                          {(store.categories || [])
                            .filter((c) => !c.isParent)
                            .map((child) => {
                              const on = cSelectedChildren.includes(child.id);
                              return (
                                <label key={child.id} className="flex cursor-pointer items-center gap-3 px-3.5 py-3 text-sm hover:bg-neutral-50">
                                  <input
                                    type="checkbox"
                                    checked={on}
                                    onChange={() => setCSelectedChildren((prev) => (prev.includes(child.id) ? prev.filter((id) => id !== child.id) : [...prev, child.id]))}
                                    style={{ minHeight: 0, minWidth: 0 }}
                                    className="h-4 w-4 shrink-0 rounded accent-neutral-900"
                                  />
                                  <span className="truncate">{child.name}</span>
                                </label>
                              );
                            })}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label htmlFor="cat-parent" className="block text-sm font-medium">
                        Collection <span className="font-normal text-neutral-400">(optional)</span>
                      </label>
                      <select
                        id="cat-parent"
                        value={cParentId}
                        onChange={(e) => setCParentId(e.target.value)}
                        className="mt-1.5 h-11 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:border-neutral-900"
                      >
                        <option value="">None</option>
                        {(store.categories || [])
                          .filter((c) => c.isParent && c.id !== editingCategoryId)
                          .map((parent) => (
                            <option key={parent.id} value={parent.id}>
                              {parent.name}
                            </option>
                          ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="cat-desc" className="block text-sm font-medium">
                        Description <span className="font-normal text-neutral-400">(optional)</span>
                      </label>
                      <textarea
                        id="cat-desc"
                        rows={3}
                        value={cDesc}
                        onChange={(e) => setCDesc(e.target.value)}
                        placeholder="Shown at the top of this category's page"
                        className="mt-1.5 w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-neutral-900"
                      />
                    </div>
                  </>
                )}
              </section>

              {/* picture */}
              <section className="mt-4 rounded-2xl border border-neutral-200 bg-white p-5">
                <span className="block text-sm font-medium">
                  Picture {cIsParent ? null : <span className="font-normal text-neutral-400">(optional)</span>}
                </span>
                <div className="mt-3 flex items-center gap-4">
                  <span className="w-20 h-20 shrink-0 overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50 flex items-center justify-center">
                    {cImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={cImageUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-5 h-5 text-neutral-300" />
                    )}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <label className="h-10 px-4 rounded-xl border border-neutral-300 bg-white text-sm font-medium inline-flex items-center gap-2 cursor-pointer hover:border-neutral-900">
                      <UploadCloud className="w-4 h-4" />
                      {cImageUrl ? "Change" : "Upload"}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          e.target.value = "";
                          if (file) uploadPhoto(file, 4 / 5, (url) => (setCImageUrl(url), setCError("")));
                        }}
                      />
                    </label>
                    {cImageUrl && (
                      <button type="button" onClick={() => setCImageUrl("")} className="h-10 px-3 rounded-xl text-sm text-neutral-500 hover:text-red-600">
                        Remove
                      </button>
                    )}
                  </div>
                </div>
                {!cImageUrl.startsWith("data:") && (
                  <input
                    value={cImageUrl}
                    onChange={(e) => {
                      setCImageUrl(e.target.value);
                      setCError("");
                    }}
                    placeholder="Or paste an image link"
                    aria-label="Image link"
                    className="mt-3 h-10 w-full rounded-xl border border-neutral-200 bg-white px-3.5 text-sm outline-none focus:border-neutral-900"
                  />
                )}
              </section>

              {/* wide banner: only for themes that put a photo across the top of the category page */}
              {!cIsParent && (SITE_THEME_STYLE[toSiteTheme(store.activeThemeSlug)]?.catalogLayout || "chips") !== "banner" && (
                <section className="mt-4 rounded-2xl border border-neutral-200 bg-white p-5">
                  <span className="block text-sm font-medium">
                    Banner for the category page <span className="font-normal text-neutral-400">(optional)</span>
                  </span>
                  <p className="mt-1 text-xs text-neutral-500">
             Your theme shows a wide photo across the top of this category&apos;s page.</p>
                  <div className="mt-3 aspect-[3/1] w-full overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50 flex items-center justify-center">
                    {cBannerUrl || cImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={cBannerUrl || cImageUrl} alt="" className={`w-full h-full object-cover ${cBannerUrl ? "" : "opacity-50"}`} />
                    ) : (
                      <ImageIcon className="w-5 h-5 text-neutral-300" />
                    )}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <label className="h-10 px-4 rounded-xl border border-neutral-300 bg-white text-sm font-medium inline-flex items-center gap-2 cursor-pointer hover:border-neutral-900">
                      <UploadCloud className="w-4 h-4" />
                      {cBannerUrl ? "Change banner" : "Upload banner"}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          e.target.value = "";
                          if (file) uploadPhoto(file, 3, setCBannerUrl);
                        }}
                      />
                    </label>
                    {cBannerUrl && (
                      <button type="button" onClick={() => setCBannerUrl("")} className="h-10 px-3 rounded-xl text-sm text-neutral-500 hover:text-red-600">
                        Remove
                      </button>
                    )}
                  </div>
                </section>
              )}

              {/* link + visibility */}
              <section className="mt-4 rounded-2xl border border-neutral-200 bg-white divide-y divide-neutral-100">
                <div className="p-5">
                  <label htmlFor="cat-slug" className="block text-sm font-medium">Page link</label>
                  <div className="mt-1.5 flex h-11 items-center rounded-xl border border-neutral-300 bg-white focus-within:border-neutral-900 overflow-hidden">
                    <span className="shrink-0 pl-3.5 text-sm text-neutral-400">/category/</span>
                    <input
                      id="cat-slug"
                      value={cSlug}
                      onChange={(e) => setCSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                      placeholder="t-shirts"
                      className="h-full min-w-0 flex-1 bg-transparent pr-3.5 text-sm outline-none"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between gap-4 p-5">
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">Show on store</span>
                    <span className="block text-xs text-neutral-500">Turn off to hide it without deleting.</span>
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={cIsActive}
                    aria-label="Show on store"
                    onClick={() => setCIsActive((v) => !v)}
                    style={{ minHeight: 0, height: 24 }}
                    className={`relative w-11 shrink-0 rounded-full transition-colors ${cIsActive ? "bg-emerald-500" : "bg-neutral-300"}`}
                  >
                    <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${cIsActive ? "left-[22px]" : "left-0.5"}`} />
                  </button>
                </div>
              </section>

              {cError && (
                <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {cError}
                </p>
              )}

              {/* phone: actions pinned at the bottom */}
              <div className="sm:hidden fixed inset-x-0 bottom-0 z-40 grid grid-cols-2 gap-2 border-t border-neutral-200 bg-white px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
                <button type="button" onClick={closeCategoryEditor} className="h-11 rounded-xl border border-neutral-300 bg-white text-sm font-medium">
                  Cancel
                </button>
                <button type="submit" className="h-11 rounded-xl bg-neutral-950 text-white text-sm font-semibold">
                  {editingCategoryId ? "Save changes" : "Save"}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6 animate-enter-blur">
              {(() => {
                const cats = (store.categories || []).filter((c) => !c.isParent);
                const counted = (name: string) => store.products.filter((p) => p.category === name).length;
                const empty = cats.filter((c) => counted(c.name) === 0).length;
                const biggest = [...cats].sort((x, y) => counted(y.name) - counted(x.name))[0];
                const sorted = store.products.filter((p) => cats.some((c) => c.name === p.category)).length;
                return (
                  <StatStrip
                    stats={[
                      { label: "Categories", value: cats.length, icon: ICategories, section: "categories", hint: `${cats.filter((c) => c.isActive).length} showing on your store` },
                      { label: "Collections", value: (store.categories || []).filter((c) => c.isParent).length, icon: ICollections, section: "themes", hint: "Groups on your home page" },
                      { label: "Products sorted", value: `${store.products.length ? Math.round((sorted / store.products.length) * 100) : 0}%`, icon: IProducts, section: "products", progress: store.products.length ? sorted / store.products.length : 0 },
                      { label: "Biggest category", value: biggest ? biggest.name : "—", icon: IStar, section: "reviews", hint: biggest ? `${counted(biggest.name)} products · ${empty} empty` : "Add one to start" },
                    ]}
                  />
                );
              })()}

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
                    <EmptyState
                      section="categories"
                      icon={ICategories}
                      title="Sort your products into categories"
                      text="Categories like Sarees, Kurtis or Earrings help buyers find things fast, and each one gets its own page on your store."
                      action={{ label: "Add category", onClick: openAddCategory, icon: Plus }}
                    />
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

                  {(() => {
                    const cols = (store.categories || []).filter((c) => c.isParent);
                    if (cols.length === 0) {
                      return (
                        <EmptyState
                          section="themes"
                          icon={ICollections}
                          title="Group categories into collections"
                          text="A collection, like Men or Festive wear, shows several categories together on your home page, so buyers browse the way they think."
                          action={{ label: "Add collection", onClick: openAddParentCollection, icon: Plus }}
                        />
                      );
                    }
                    return (
                      <div className="rounded-2xl border border-neutral-200 bg-white divide-y divide-neutral-100">
                        {cols.map((pCat) => {
                          const childCount = (store.categories || []).filter((c) => !c.isParent && c.parentId === pCat.id).length;
                          const live = pCat.isActive ?? true;
                          const menuOpen = catMenuId === pCat.id;
                          return (
                            <div key={pCat.id} className="flex items-center gap-3 p-3">
                              <button type="button" onClick={() => openEditCategory(pCat)} style={{ minHeight: 0 }} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                                <span className={`w-12 h-12 rounded-xl overflow-hidden bg-neutral-100 shrink-0 flex items-center justify-center ${live ? "" : "opacity-50"}`}>
                                  {pCat.imageUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={pCat.imageUrl} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    <Layers className="w-5 h-5 text-neutral-400" />
                                  )}
                                </span>
                                <span className="min-w-0">
                                  <span className={`block truncate text-sm font-semibold ${live ? "" : "text-neutral-500"}`}>{pCat.name}</span>
                                  <span className="block truncate text-xs text-neutral-500">
                                    {childCount} {childCount === 1 ? "category" : "categories"}
                                    {live ? "" : " · Hidden"}
                                  </span>
                                </span>
                              </button>
                              <button
                                type="button"
                                role="switch"
                                aria-checked={live}
                                aria-label={live ? `Hide ${pCat.name} from store` : `Show ${pCat.name} on store`}
                                onClick={() => handleToggleCategoryActive(pCat)}
                                style={{ minHeight: 0, height: 24 }}
                                className={`relative w-11 shrink-0 rounded-full transition-colors ${live ? "bg-emerald-500" : "bg-neutral-300"}`}
                              >
                                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${live ? "left-[22px]" : "left-0.5"}`} />
                              </button>
                              <div className="relative shrink-0">
                                <button
                                  type="button"
                                  onClick={() => setCatMenuId(menuOpen ? null : pCat.id)}
                                  aria-label={`More options for ${pCat.name}`}
                                  aria-expanded={menuOpen}
                                  style={{ minHeight: 0 }}
                                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 ${menuOpen ? "bg-neutral-100 text-neutral-900" : ""}`}
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </button>
                                {menuOpen && (
                                  <>
                                    <button type="button" aria-label="Close menu" onClick={() => setCatMenuId(null)} className="fixed inset-0 z-30 cursor-default" />
                                    <div className="absolute right-0 top-10 z-40 w-48 rounded-2xl border border-neutral-200 bg-white p-1.5 shadow-xl shadow-neutral-950/10 animate-enter-scale">
                                      <button
                                        type="button"
                                        style={{ minHeight: 0 }}
                                        onClick={() => {
                                          setCatMenuId(null);
                                          openEditCategory(pCat);
                                        }}
                                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-100"
                                      >
                                        <Edit className="w-4 h-4" /> Edit
                                      </button>
                                      <Link
                                        href={getStoreUrl(store.subdomain, `/category/${pCat.slug}`)}
                                        target="_blank"
                                        onClick={() => setCatMenuId(null)}
                                        style={{ minHeight: 0 }}
                                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-100"
                                      >
                                        <ExternalLink className="w-4 h-4" /> View in store
                                      </Link>
                                      <div className="my-1 h-px bg-neutral-100" />
                                      <button
                                        type="button"
                                        style={{ minHeight: 0 }}
                                        onClick={() => {
                                          setCatMenuId(null);
                                          handleDeleteCategory(pCat.id, pCat.name);
                                        }}
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
                        })}
                      </div>
                    );
                  })()}
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
                    className="-ml-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900 transition-colors cursor-pointer"
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
                  <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-neutral-600">{o.paymentMethod === "cashfree" || o.paymentMethod === "razorpay" ? "online" : o.paymentMethod}</span>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                  <div className="min-w-0 space-y-4 lg:col-span-7">
                    {/* Progress */}
                    <div className={card}>
                      <h3 className="flex items-center gap-2 text-sm font-semibold"><SectionIcon section="orders" icon={IActivity} size="sm" />Progress</h3>
                      <p className="mt-0.5 text-xs text-neutral-500">Tap a step to update the buyer&apos;s tracking page.</p>
                      <div className="mt-4 grid grid-cols-4 gap-1">
                        {steps.map((s, i) => {
                          const done = o.fulfilmentStatus !== "cancelled" && i <= reached;
                          const lineDone = o.fulfilmentStatus !== "cancelled" && i <= reached;
                          return (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => o.fulfilmentStatus !== "cancelled" && handleUpdateOrderStatus(o.id, s.id)}
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
                      <h3 className="flex items-center gap-2 text-sm font-semibold"><SectionIcon section="themes" icon={IProducts} size="sm" />Items ({itemCount(o)})</h3>
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

                    {/* Shipping: courier, Shiprocket, WhatsApp updates and invoice sit in the wide column */}
                    {/* Tracking */}
                    <div className={card}>
                      <h3 className="flex items-center gap-2 text-sm font-semibold"><SectionIcon section="products" icon={ITruck} size="sm" />Courier & tracking</h3>
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

                    {/* Plugins on the order: Shiprocket, WhatsApp updates, invoice */}
                    <ShiprocketShip
                      store={store}
                      order={o}
                      onUpdated={(next) => {
                        setSelectedOrder(next);
                        setCourierNameInput(next.courierName || "");
                        setTrackingNumberInput(next.trackingNumber || "");
                      }}
                      onOpenPlugin={() => {
                        setActiveTab("plugins");
                        setPluginView("shiprocket");
                        scrollDashTop({ top: 0 });
                      }}
                    />
                    <WhatsAppUpdates store={store} order={o} />
                    <InvoiceButton store={store} order={o} />
                  </div>

                  <div className="min-w-0 space-y-4 lg:col-span-5">
                    <OrderActions store={store} order={o} onChange={(next) => (setSelectedOrder(next), refreshStore())} />
                    {/* Customer */}
                    <div className={card}>
                      <h3 className="flex items-center gap-2 text-sm font-semibold"><SectionIcon section="customers" icon={ICustomers} size="sm" />Customer</h3>
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
                        <h3 className="flex items-center gap-2 text-sm font-semibold"><SectionIcon section="reviews" icon={ICard} size="sm" />Payment</h3>
                        {pill(PAYMENT[o.paymentStatus])}
                      </div>
                      <dl className="mt-3 space-y-1.5 text-sm">
                        <div className="flex justify-between gap-3">
                          <dt className="text-neutral-500">Method</dt>
                          <dd className="font-medium">{o.paymentMethod === "cashfree" ? "Online (Cashfree)" : o.paymentMethod === "razorpay" ? "Online (Razorpay)" : o.paymentMethod === "upi" ? "UPI" : o.paymentMethod === "cod" ? "Cash on delivery" : "Bank transfer"}</dd>
                        </div>
                        {o.paymentMethod !== "cod" && (
                          <div className="flex justify-between gap-3">
                            <dt className="shrink-0 text-neutral-500">{o.paymentMethod === "cashfree" ? "Cashfree payment ID" : o.paymentMethod === "razorpay" ? "Razorpay payment ID" : "UTR / Ref"}</dt>
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
            { id: "abandoned" as const, label: "Abandoned", count: abandonedCount },
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

              {store.orders.length > 0 && (() => {
                const os = store.orders.filter((x) => x.fulfilmentStatus !== "cancelled");
                const sales = os.reduce((n, x) => n + x.total, 0);
                const online = os.filter((x) => x.paymentMethod === "razorpay" || x.paymentMethod === "cashfree").length;
                return (
                  <StatStrip
                    phone={0}
                    stats={[
                      { label: "Sales", value: `₹${Math.round(sales / 100).toLocaleString("en-IN")}`, icon: IRupee, section: "orders", spark: dailyCounts(os, (x) => x.createdAt, 14, (x) => x.total), hint: "last 14 days in the chart" },
                      { label: "To ship", value: filters[1].count ?? 0, icon: ITruck, section: "reviews", hint: (filters[1].count ?? 0) ? "Pack these next" : "All caught up" },
                      { label: "Average order", value: `₹${os.length ? Math.round(sales / os.length / 100).toLocaleString("en-IN") : 0}`, icon: IOrders, section: "products" },
                      { label: "Paid online", value: `${os.length ? Math.round((online / os.length) * 100) : 0}%`, icon: ICard, section: "customers", progress: os.length ? online / os.length : 0 },
                    ]}
                  />
                );
              })()}

              {/* phones: four tabs on one line (label and count side by side); abandoned checkouts sit in the page header */}
              <div className="grid grid-cols-4 gap-1 rounded-xl bg-neutral-100 p-1 md:hidden">
                {filters.slice(0, 4).map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setOrderFilter(f.id)}
                    aria-pressed={orderFilter === f.id}
                    className={`flex h-9 min-w-0 items-center justify-center gap-1 rounded-lg px-1 text-[12.5px] font-medium transition-all !min-h-0 ${
                      orderFilter === f.id ? "bg-white text-neutral-950 shadow-sm" : "text-neutral-500"
                    }`}
                  >
                    <span className="truncate">{f.label}</span>
                    <span className={`shrink-0 tabular-nums ${orderFilter === f.id ? "text-neutral-400" : "text-neutral-400"}`}>{f.count ?? ""}</span>
                  </button>
                ))}
              </div>

              {/* Filter: equal segments, always fits the screen */}
              <div className="hidden grid-cols-5 gap-1 rounded-2xl bg-neutral-100 p-1 md:grid">
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
                    <span className="text-base font-semibold tabular-nums leading-tight">{f.count ?? "–"}</span>
                    <span className="w-full truncate text-center text-[11px]">{f.label}</span>
                  </button>
                ))}
              </div>

              {orderFilter === "abandoned" ? (
                <div key="abandoned" className="swap-enter">
                  {planHas(store.planId, "abandonedCart") ? (
                    <AbandonedCheckouts store={store} onCount={setAbandonedCount} />
                  ) : (
                    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6">
                      <div className="min-w-0">
                        <p className="text-base font-semibold">Win back unfinished checkouts</p>
                        <p className="mt-0.5 text-sm text-neutral-500">See who left before paying and remind them on WhatsApp. Part of Growth.</p>
                      </div>
                      <button type="button" onClick={() => openSettings("billing")} className="h-10 shrink-0 rounded-xl bg-neutral-950 px-4 text-sm font-semibold text-white hover:bg-black">
                        Try Growth free
                      </button>
                    </div>
                  )}
                </div>
              ) : store.orders.length === 0 ? (
                <div className="rounded-2xl border border-neutral-200 bg-white px-5 py-12 text-center">
                  <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-700">
                    <ShoppingBag className="h-6 w-6" />
                  </span>
                  <p className="mt-4 text-base font-semibold">No orders yet</p>
                  <p className="mx-auto mt-1 max-w-sm text-sm text-neutral-500">
                    Share your store link with buyers.
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
                          <span className="text-[10px] font-semibold uppercase text-neutral-400">{order.paymentMethod === "cashfree" || order.paymentMethod === "razorpay" ? "online" : order.paymentMethod}</span>
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
                    className="-ml-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900 transition-colors cursor-pointer"
                    title="Back to Discounts"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div>
                    <h2 className="text-base font-semibold tracking-tight text-neutral-900">
                      Create Discount Coupon
                    </h2>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Promotional codes entered by buyers at checkout to deduct percentage or flat discounts       </p>
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
                    <h3 className="flex items-center gap-2 border-b border-neutral-100 pb-3 text-sm font-semibold text-neutral-900"><SectionIcon section="discounts" icon={IDiscounts} size="sm" /> Coupon details</h3>

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
        Code typed by buyers at checkout to unlock savings.</p>
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
                    <h3 className="flex items-center gap-2 border-b border-neutral-100 pb-3 text-sm font-semibold text-neutral-900"><SectionIcon section="customers" icon={IEye} size="sm" /> What buyers will see</h3>
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
                    <StatStrip
                      stats={[
                        { label: "Active coupons", value: all.filter((d) => d.isActive).length, icon: IDiscounts, section: "discounts", hint: `${all.filter((d) => !d.isActive).length} paused` },
                        { label: "Times used", value: all.reduce((n, d) => n + (d.timesUsed || 0), 0), icon: ITrend, section: "orders" },
                        {
                          label: "Most used",
                          value: [...all].sort((x, y) => (y.timesUsed || 0) - (x.timesUsed || 0))[0]?.code || "—",
                          icon: Sparkles,
                          section: "reviews",
                          hint: all.length ? `${[...all].sort((x, y) => (y.timesUsed || 0) - (x.timesUsed || 0))[0]?.timesUsed || 0} uses` : "No coupons yet",
                        },
                        { label: "Orders with a coupon", value: `${store.orders.length ? Math.round((store.orders.filter((o) => (o.discount || 0) > 0).length / store.orders.length) * 100) : 0}%`, icon: IPercent, section: "customers", progress: store.orders.length ? store.orders.filter((o) => (o.discount || 0) > 0).length / store.orders.length : 0 },
                      ]}
                    />

                    {all.length === 0 ? (
                      <div className="hero-rise rounded-[24px] border border-dashed border-neutral-200 bg-white px-6 py-10 text-center">
                        <Illustration section="discounts" icon={IPercent} />
                        <p className="mt-4 text-lg font-semibold tracking-tight">Turn visitors into buyers with a coupon</p>
                        <p className="mt-1 text-sm text-neutral-500 max-w-md mx-auto">A small discount is often the nudge someone needs.</p>
                        <div className="mt-6 grid gap-3 sm:grid-cols-2 max-w-lg mx-auto text-left">
                          {[
                            { code: "WELCOME10", line: "10% off orders over ₹500", type: "percentage" as const, value: "10", min: "500" },
                            { code: "FLAT100", line: "₹100 off orders over ₹999", type: "flat" as const, value: "100", min: "999" },
                          ].map((p) => (
                            <button
                              key={p.code}
                              type="button"
                              onClick={() => openNew(p)}
                              className="group flex items-center gap-3 rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-3 hover:bg-neutral-100 transition-colors"
                            >
                              <span className="w-10 h-10 rounded-xl bg-neutral-950 text-white flex items-center justify-center shrink-0">
                                <Tag className="w-4 h-4" />
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block font-mono text-sm font-bold tracking-wider">{p.code}</span>
                                <span className="block text-xs text-neutral-600">{p.line}</span>
                              </span>
                              <Plus className="w-4 h-4 text-neutral-700 transition-transform group-hover:rotate-90" />
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
                            data-tour="add-coupon"
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
                              <div className={`w-28 shrink-0 flex flex-col items-center justify-center text-center px-2 py-4 ${discount.isActive ? "bg-neutral-950 text-white" : "bg-neutral-200 text-neutral-600"}`}>
                                <span className="text-2xl font-bold leading-none">
                                  {discount.type === "percentage" ? `${discount.value}%` : `₹${(discount.value / 100).toLocaleString("en-IN")}`}
                                </span>
                                <span className="mt-1 text-[10px] font-semibold uppercase tracking-wider opacity-90">off</span>
                              </div>
                              {/* perforation */}
                              <span aria-hidden className="relative w-0 border-l-2 border-dashed border-neutral-200">
                                <span className="absolute -top-2 -left-[9px] w-4 h-4 rounded-full bg-[#F0F0F0] border border-neutral-200" />
                                <span className="absolute -bottom-2 -left-[9px] w-4 h-4 rounded-full bg-[#F0F0F0] border border-neutral-200" />
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

        {/* ANALYTICS */}
        {activeTab === "analytics" && (
          <div className="animate-enter-blur">
            <AnalyticsPage store={store} />
          </div>
        )}

        {/* TAB 4: CUSTOMERS */}
        {activeTab === "customers" && (
          <div className="space-y-4 animate-enter-blur">
            {(() => {
              const all = store.customers || [];
              const q = customerSearch.trim().toLowerCase();
              const monthAgo = Date.now() - 30 * 86400000;
              const isNew = (c: (typeof all)[number]) => c.totalOrders <= 1;
              const repeatCount = all.filter((c) => !isNew(c)).length;
              const recentCount = all.filter((c) => new Date(c.lastOrderAt).getTime() > monthAgo).length;
              const list = all
                .filter((c) => customerFilter === "all" || (customerFilter === "repeat" ? !isNew(c) : isNew(c)))
                .filter((c) => !q || c.name.toLowerCase().includes(q) || c.phone.includes(q) || (c.email || "").toLowerCase().includes(q))
                .sort((x, y) => (customerSort === "orders" ? y.totalOrders - x.totalOrders : customerSort === "spent" ? (y.totalSpent || 0) - (x.totalSpent || 0) : (y.lastOrderAt || "").localeCompare(x.lastOrderAt || "")));
              const initials = (n: string) => n.split(" ").map((w) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() || "?";
              const when = (iso?: string) => {
                if (!iso) return "";
                const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
                return d <= 0 ? "today" : d === 1 ? "yesterday" : d < 7 ? `${d} days ago` : new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
              };
              if (all.length === 0)
                return (
                  <EmptyState
                    section="customers"
                    icon={ICustomers}
                    title="Your first customer is one share away"
                    text="Everyone who orders from your store shows up here with their contact details and orders. Share your store link on WhatsApp or Instagram to get started."
                    action={{ label: copiedLink ? "Link copied" : "Copy store link", onClick: copyStoreLink, icon: copiedLink ? CheckCircle : Copy }}
                  />
                );
              return (
                <>
                  {/* phones: a slim row of chips; tablets and computers: three numbers in one card */}
                  <StatChips
                    items={[
                      { label: "Customers", value: all.length },
                      { label: "Came back", value: repeatCount, tone: "text-violet-700" },
                      { label: "This month", value: recentCount, tone: "text-emerald-700" },
                    ]}
                  />
                  <div className="hidden grid-cols-3 divide-x divide-neutral-100 overflow-hidden rounded-2xl border border-neutral-200 bg-white md:grid">
                    {[
                      { label: "Customers", value: all.length, tone: "text-neutral-950" },
                      { label: "Came back", value: repeatCount, tone: "text-violet-700" },
                      { label: "This month", value: recentCount, tone: "text-emerald-700" },
                    ].map((s) => (
                      <div key={s.label} className="min-w-0 px-3 py-3 sm:px-5 sm:py-4">
                        <p className="truncate text-[11px] font-medium text-neutral-500 sm:text-xs">{s.label}</p>
                        <p className={`mt-0.5 text-lg font-semibold tabular-nums sm:text-xl ${s.tone}`}>{s.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <label className="flex h-11 flex-1 items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3.5 transition-colors focus-within:border-neutral-900">
                      <Search className="h-4 w-4 shrink-0 text-neutral-400" />
                      <input value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)} placeholder="Search name, phone or email" className="w-full bg-transparent text-sm outline-none" />
                      {customerSearch && (
                        <button type="button" onClick={() => setCustomerSearch("")} aria-label="Clear search" className="text-neutral-400 hover:text-neutral-900">
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="grid flex-1 grid-cols-3 rounded-xl bg-neutral-100 p-1 text-sm sm:inline-flex sm:flex-none">
                        {(
                          [
                            ["all", "All"],
                            ["repeat", "Repeat"],
                            ["new", "New"],
                          ] as const
                        ).map(([id, label]) => (
                          <button
                            key={id}
                            type="button"
                            onClick={() => setCustomerFilter(id)}
                            style={{ minHeight: 0 }}
                            className={`h-9 rounded-lg px-3 font-medium transition-colors ${customerFilter === id ? "bg-white text-neutral-950 shadow-sm" : "text-neutral-500 hover:text-neutral-900"}`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                      <select
                        value={customerSort}
                        onChange={(e) => setCustomerSort(e.target.value as "recent" | "orders" | "spent")}
                        aria-label="Sort customers"
                        className="h-11 w-36 shrink-0 rounded-xl border border-neutral-200 bg-white px-3 text-sm font-medium outline-none focus:border-neutral-900"
                      >
                        <option value="recent">Latest first</option>
                        <option value="orders">Most orders</option>
                        <option value="spent">Most spent</option>
                      </select>
                    </div>
                  </div>

                  {list.length === 0 ? (
                    <p className="rounded-2xl border border-dashed border-neutral-200 bg-white px-6 py-12 text-center text-sm text-neutral-500">No customers here{customerSearch ? ` for “${customerSearch}”` : ""}.</p>
                  ) : (
                    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
                      {/* column titles (computers) */}
                      <div className="hidden grid-cols-[minmax(0,2fr)_minmax(0,1.6fr)_90px_110px_110px_76px] items-center gap-4 border-b border-neutral-100 bg-neutral-50/70 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-neutral-500 md:grid">
                        <span>Customer</span>
                        <span>Contact</span>
                        <span className="text-right">Orders</span>
                        <span className="text-right">Spent</span>
                        <span>Last order</span>
                        <span />
                      </div>
                      <ul className="divide-y divide-neutral-100">
                        {list.map((cust) => {
                          const digits = cust.phone.replace(/[^0-9]/g, "");
                          const wa = digits.length === 10 ? `91${digits}` : digits;
                          return (
                            <li
                              key={cust.id}
                              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-0.5 px-4 py-3 transition-colors hover:bg-neutral-50/70 md:grid-cols-[minmax(0,2fr)_minmax(0,1.6fr)_90px_110px_110px_76px] md:gap-4 md:px-5"
                            >
                              <div className="flex min-w-0 items-center gap-3">
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-950 text-[12px] font-semibold text-white">{initials(cust.name)}</span>
                                <span className="min-w-0">
                                  <span className="flex items-center gap-1.5">
                                    <span className="truncate text-sm font-semibold">{cust.name}</span>
                                    {!isNew(cust) && <span className="shrink-0 rounded-full bg-violet-50 px-1.5 py-px text-[10px] font-semibold text-violet-700">Repeat</span>}
                                  </span>
                                  {/* phones: one quiet line under the name */}
                                  <span className="mt-0.5 block truncate text-xs text-neutral-500 md:hidden">
                                    {cust.phone} · {cust.totalOrders} order{cust.totalOrders === 1 ? "" : "s"}
                                    {cust.lastOrderAt ? ` · ${when(cust.lastOrderAt)}` : ""}
                                  </span>
                                </span>
                              </div>
                              <span className="hidden min-w-0 md:block">
                                <span className="block truncate text-[13px] text-neutral-800">{cust.phone}</span>
                                <span className={`block truncate text-[11px] ${cust.email ? "text-neutral-500" : "text-neutral-300"}`}>{cust.email || "No email"}</span>
                              </span>
                              <span className="hidden text-right text-[13px] font-semibold tabular-nums md:block">{cust.totalOrders}</span>
                              <span className="hidden text-right text-[13px] tabular-nums text-neutral-800 md:block">₹{Math.round((cust.totalSpent || 0) / 100).toLocaleString("en-IN")}</span>
                              <span className="hidden text-[13px] text-neutral-500 md:block">{when(cust.lastOrderAt) || "—"}</span>
                              <span className="flex items-center justify-end gap-1.5">
                                <a href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer" aria-label={`WhatsApp ${cust.name}`} className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100">
                                  <MessageCircle className="h-4 w-4" />
                                </a>
                                <a href={`tel:${cust.phone}`} aria-label={`Call ${cust.name}`} className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-neutral-700 hover:bg-neutral-200">
                                  <Phone className="h-4 w-4" />
                                </a>
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}

        {/* TAB 5: REVIEWS */}
        {activeTab === "reviews" && (
          <div className="space-y-6 animate-enter-blur">
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
              <ReviewsPanel store={store} onChanged={refreshStore} onShare={copyStoreLink} shareLabel={copiedLink ? "Link copied" : "Copy store link"} />
            )}
          </div>
        )}

        {/* TAB 6: BANNERS */}
        {activeTab === "policies" && settingsFrame(<PoliciesPanel store={store} onSaved={refreshStore} />)}

        {/* TAB 7: THEMES & STOREFRONT DESIGN */}
        {activeTab === "themes" && (() => {
          const editorOn = canUseThemeEditor(store.planId);
          const editorPlan = cheapestPlanWith("themeEditor");
          const activeSlug = getTheme(store.activeThemeSlug).slug;
          const live = getTheme(activeSlug);
          // the live theme came with a plan that has lapsed: the shop shows the free default until renewed or bought
          const lapsed = !canUseTheme(store, activeSlug);
          const onFree = !isPaidPlan(store.planId);
          const editHref = (slug: string) => `/dashboard/editor?store=${store.subdomain}&theme=${slug}`;
          const previewHref = (slug: string) => getStoreUrl(store.subdomain, `?preview_theme=${slug}`);
          // themes this shop has worked on: edited, bought, or switched to through its plan
          const mine = allThemes.filter(
            (t) => t.slug !== activeSlug && (store.themeContent?.[t.slug] !== undefined || ownsTheme(store, t.slug) || (store.planThemes || []).includes(t.slug))
          );
          // a few picks the shop can use now (free ones on the Free plan); the rest live in the marketplace
          const picks = allThemes
            .filter((t) => t.slug !== activeSlug && !mine.includes(t) && canUseTheme(store, t.slug) && (!onFree || getThemePrice(t.slug) === 0))
            .slice(0, 3);
          const moreCount = allThemes.length - 1 - mine.length - picks.length;
          const moreThumbs = allThemes.filter((t) => t.slug !== activeSlug && !mine.includes(t) && !picks.includes(t)).slice(0, 3);
          return (
            <div className="mt-6 space-y-8 animate-enter-blur">
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


              {/* live theme */}
              <section className="overflow-hidden rounded-3xl border border-neutral-200 bg-white">
                <div className="grid md:grid-cols-[1.35fr_1fr]">
                  <a href={liveStoreUrl} target="_blank" rel="noreferrer" className="group relative block aspect-[16/10] overflow-hidden bg-neutral-100 md:aspect-auto md:min-h-[300px]" aria-label="Open your live shop">
                    {/* your real shop, as buyers see it right now */}
                    <LiveShopFrame src={`/s/${store.subdomain}`} fallback={themeThumb(live)} />
                    <span className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
                    <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-neutral-900 shadow-sm">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Live now
                    </span>
                    <span className="absolute bottom-4 left-4 right-4 truncate text-sm font-semibold text-white">{storeWebDomain}</span>
                  </a>
                  <div className="flex flex-col p-5 sm:p-7">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-400">Your live theme</span>
                    <h2 className="mt-2 text-2xl font-semibold tracking-tight text-neutral-950">{live.name}</h2>
                    <p className="mt-2 text-sm leading-relaxed text-neutral-500">{live.description}</p>
                    <span className="mt-4 flex gap-1.5">
                      {live.previewColors.map((c) => (
                        <span key={c} className="h-5 w-5 rounded-full border border-neutral-200" style={{ backgroundColor: c }} />
                      ))}
                    </span>
                    <div className="mt-auto flex flex-wrap gap-2 pt-6">
                      <button
                        type="button"
                        onClick={() => router.push(editHref(activeSlug))}
                        className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-neutral-950 px-4 text-[13px] font-semibold text-white hover:bg-black"
                      >
                        {canEditTheme(store, activeSlug) ? (
                          <>
                            <SlidersHorizontal className="h-4 w-4" /> Edit website
                          </>
                        ) : (
                          <>
                            <ImageIcon className="h-4 w-4" /> Edit photos
                          </>
                        )}
                      </button>
                      <a href={liveStoreUrl} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-neutral-300 px-4 text-[13px] font-semibold hover:border-black">
                        View shop <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </div>
                </div>
              </section>

              {/* themes this shop has worked on */}
              {mine.length > 0 && (
                <section>
                  <h3 className="text-sm font-semibold text-neutral-950">Your other themes</h3>
                  <p className="mt-0.5 text-xs text-neutral-500">Themes you&apos;ve edited or own. Buyers only see your live theme.</p>
                  <div className="mt-3 divide-y divide-neutral-100 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
                    {mine.map((t) => {
                      const usable = canUseTheme(store, t.slug);
                      const status = ownsTheme(store, t.slug) ? "Owned" : store.themeContent?.[t.slug] !== undefined ? "Edited" : "With your plan";
                      return (
                        <div key={t.slug} className="flex items-center gap-3 p-3 sm:gap-4 sm:p-4">
                          <a href={previewHref(t.slug)} className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-neutral-100 sm:h-16 sm:w-24" aria-label={`Preview ${t.name}`}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={themeThumb(t)} alt="" className="absolute inset-0 h-full w-full object-cover object-top" />
                          </a>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-neutral-950">{t.name}</p>
                            <p className="truncate text-xs text-neutral-500">
                              {status}
                              {!usable && " · locked until you renew or buy"}
                            </p>
                          </div>
                          {usable ? (
                            <button type="button" onClick={() => handleActivateTheme(t.slug)} className="hidden h-9 rounded-xl border border-neutral-300 px-3 text-xs font-semibold hover:border-black sm:block">
                              Make live
                            </button>
                          ) : getThemePrice(t.slug) > 0 ? (
                            <button type="button" onClick={() => setThemeToBuy(t.slug)} className="h-9 rounded-xl bg-neutral-950 px-3 text-xs font-semibold text-white">
                              Buy
                            </button>
                          ) : null}
                          <button type="button" onClick={() => router.push(editHref(t.slug))} className="h-9 rounded-xl bg-neutral-100 px-3 text-xs font-semibold hover:bg-neutral-200">
                            Edit
                          </button>
                          {usable && (
                            <button type="button" onClick={() => handleActivateTheme(t.slug)} className="h-9 rounded-xl border border-neutral-300 px-3 text-xs font-semibold sm:hidden">
                              Use
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* a few picks, then the marketplace */}
              <section>
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-950">{onFree ? "Free themes for your shop" : "Included in your plan"}</h3>
                    <p className="mt-0.5 text-xs text-neutral-500">Preview any of them with your products. Your shop only changes when you make one live.</p>
                  </div>
                  <Link href="/themes" className="hidden shrink-0 text-xs font-semibold text-neutral-600 underline-offset-4 hover:text-black hover:underline sm:block">
                    All themes
                  </Link>
                </div>
                {/* one theme per row: a wide landscape preview, then name, description and actions */}
                <div className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {picks.map((t) => (
                    <div key={t.slug} className="group flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white">
                      <a href={previewHref(t.slug)} className="relative block aspect-[16/9] overflow-hidden bg-neutral-100" aria-label={`Preview ${t.name}`}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={themeThumb(t)} alt="" className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]" />
                        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-neutral-800 backdrop-blur">
                          {getThemePrice(t.slug) === 0 ? "Free" : "With your plan"}
                        </span>
                      </a>
                      <div className="flex flex-1 flex-col p-4">
                        <p className="text-[15px] font-semibold text-neutral-950">{t.name}</p>
                        <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-neutral-500">{t.description}</p>
                        <div className="mt-4 grid grid-cols-2 gap-2">
                          <a href={previewHref(t.slug)} className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-neutral-200 text-[13px] font-semibold text-neutral-800 hover:border-neutral-900">
                            <Eye className="h-4 w-4" /> Preview
                          </a>
                          <button type="button" onClick={() => handleActivateTheme(t.slug)} className="h-10 rounded-xl bg-neutral-950 text-[13px] font-semibold text-white hover:bg-black">
                            Use this theme
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {/* marketplace */}
                  <Link href="/themes" className="group relative flex min-h-[180px] flex-col justify-between overflow-hidden rounded-2xl bg-neutral-950 p-5 text-white">
                    <span className="relative flex -space-x-6">
                      {moreThumbs.map((t, i) => (
                        <span key={t.slug} className="relative h-16 w-14 overflow-hidden rounded-lg border-2 border-neutral-950 bg-neutral-800 transition-transform duration-500 group-hover:-translate-y-1" style={{ rotate: `${(i - 1) * 6}deg`, transitionDelay: `${i * 60}ms` }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={themeThumb(t)} alt="" className="absolute inset-0 h-full w-full object-cover object-top" />
                        </span>
                      ))}
                    </span>
                    <span className="relative">
                      <span className="block text-base font-semibold">Theme marketplace</span>
                      <span className="mt-1 block text-xs leading-relaxed text-white/60">
                        {moreCount > 0 ? `${moreCount} more themes, free and paid. ` : ""}Browse, preview and buy.
                      </span>
                      <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold">
                        Open marketplace <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </span>
                  </Link>
                </div>
              </section>

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
          const sub = subscriptionState(store);
          const fmtDate = (d?: Date | string) =>
            d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "";
          const activePlan = sub.kind === "active" ? PLATFORM_PLANS[sub.planId] : undefined;
          const endedPlan = sub.kind === "free" && sub.endedPlanId ? PLATFORM_PLANS[sub.endedPlanId] : undefined;
          const pending = store.pendingSubscription;
          const cycleName = (c?: string) => (c === "yearly" ? "Yearly" : c === "quarterly" ? "Every 3 months" : "Monthly");
          const lastPaid = history.find((h) => h.status === "verified" && h.planId === (sub.kind === "active" ? sub.planId : sub.endedPlanId));
          const daysText = (n: number) => (n <= 0 ? "today" : n === 1 ? "in 1 day" : `in ${n} days`);
          const renew = (planId: string) => handleUpgradePlan(planId as "starter" | "pro", (lastPaid?.billingCycle as BillingCycle) || "monthly");
          const autoPay = sub.kind === "active" ? sub.autoPay : undefined;
          const price = (paise: number) => `₹${Math.round(paise / 100).toLocaleString("en-IN")}`;
          // what the next automatic charge will be: Pro's first months are at the introductory price
          const autoCharge = (() => {
            if (!autoPay || !activePlan) return "";
            const b = store.planBilling?.current;
            const intro = !!b?.intro && !!activePlan.introPriceMonthly && (b.paidCount || 0) < (activePlan.introMonths || 0);
            return price(intro ? activePlan.introPriceMonthly! : activePlan.priceMonthly);
          })();
          const stopAutoPay = async () => {
            const until = fmtDate(sub.kind === "active" ? sub.endsAt : undefined);
            const text =
              autoPay?.stage === "trial"
                ? `Nothing will be charged. Your free trial stays until ${until}, then your store moves to Free.`
                : `No more payments will be taken. ${activePlan?.name || "Your plan"} stays active until ${until}, then your store moves to Free.`;
            if (!(await appConfirm(text, { title: "Cancel your subscription?", okLabel: "Cancel subscription", cancelLabel: "Keep it", danger: true }))) return;
            setPlanBusy(true);
            try {
              await cancelPlanSubscription(store.subdomain);
              refreshStore();
            } catch (err) {
              appAlert(err instanceof Error ? err.message : "Something went wrong. Please try again.");
            } finally {
              setPlanBusy(false);
            }
          };
          const setRenewal = async (value: "on" | "off") => {
            if (value === "off" && autoPay) return stopAutoPay();
            // automatic payments that were cancelled can't be switched back on: start them again
            if (value === "on" && store.planBilling?.current && sub.kind === "active") return renew(sub.planId);
            if (value === "off" && !(await appConfirm(`${activePlan?.name || "Your plan"} stays active until ${fmtDate(sub.kind === "active" ? sub.endsAt : undefined)}, then your store moves to Free. Nothing is charged automatically.`, { title: "Cancel your subscription?", okLabel: "Cancel subscription", cancelLabel: "Keep it", danger: true }))) return;
            storeService.updateStore(store.subdomain, { planRenewal: value });
            refreshStore();
          };
          const statusOf = (h: (typeof history)[number]) =>
            h.status === "verified"
              ? { label: "Paid", dot: "bg-emerald-500", text: "text-emerald-700" }
              : h.status === "pending_verification"
                ? { label: "Awaiting confirmation", dot: "bg-amber-500", text: "text-amber-800" }
                : h.rejectedAt
                  ? { label: "Not verified", dot: "bg-red-500", text: "text-red-700" }
                  : { label: "Cancelled", dot: "bg-neutral-300", text: "text-neutral-500" };
          return settingsFrame(
            <div className="space-y-4">
              {upgradeSuccess && (
                <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>
                    You&apos;re now on <b>{currentPlan.name}</b>. Your new limits are active.
                    {autoPay?.stage === "trial" && autoPay.nextChargeAt ? ` Your free trial runs until ${fmtDate(autoPay.nextChargeAt)}; cancel before then and you pay nothing.` : ""}
                  </span>
                </div>
              )}

              {/* amber card: an automatic payment failed and is being retried */}
              {autoPay?.stage === "retrying" && activePlan && (
                <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:p-5">
                  <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-amber-900">Your {activePlan.name} payment didn&apos;t go through</p>
                    <p className="mt-0.5 text-[13px] text-amber-800">
                      We&apos;ll try again over the next few days. Keep enough balance in your account. If it keeps failing, your store moves to Free.
                    </p>
                  </div>
                </div>
              )}

              {/* red card: the plan is about to end, or has ended */}
              {sub.kind === "active" && sub.endingSoon && activePlan && (
                <div className="flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:p-5">
                  <AlertTriangle className="h-5 w-5 shrink-0 text-red-600" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-red-900">
                      Your {activePlan.name} plan {sub.renewing ? "expires" : "ends"} {daysText(sub.daysLeft ?? 0)}
                    </p>
                    <p className="mt-0.5 text-[13px] text-red-800">
                      {sub.renewing
                        ? `Renew by ${fmtDate(sub.endsAt)} to keep your ${activePlan.name} features. After that your store moves to Free.`
                        : `You cancelled your subscription. On ${fmtDate(sub.endsAt)} your store moves to Free.`}
                    </p>
                  </div>
                  {!pending && (
                    <button type="button" onClick={() => renew(sub.planId)} className="h-10 shrink-0 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700">
                      Renew {activePlan.name}
                    </button>
                  )}
                </div>
              )}
              {endedPlan && sub.kind === "free" && (
                <div className="flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:p-5">
                  <AlertTriangle className="h-5 w-5 shrink-0 text-red-600" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-red-900">Your {endedPlan.name} plan ended on {fmtDate(sub.endedAt)}</p>
                    <p className="mt-0.5 text-[13px] text-red-800">Your store is on Free limits now. Renew to get your {endedPlan.name} features back.</p>
                  </div>
                  {!pending && (
                    <button type="button" onClick={() => renew(endedPlan.id)} className="h-10 shrink-0 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700">
                      Renew {endedPlan.name}
                    </button>
                  )}
                </div>
              )}

              {/* your subscription */}
              <div className="rounded-2xl border border-neutral-200 bg-white">
                <div className="flex items-start justify-between gap-4 p-5 sm:p-6">
                  <div className="min-w-0">
                    <p className="text-xs text-neutral-500">Current plan</p>
                    <p className={`mt-0.5 text-xl font-semibold tracking-tight ${currentPlan.id === "pro" ? "text-violet-700" : currentPlan.id === "starter" ? "text-indigo-700" : ""}`}>{currentPlan.name}</p>
                  </div>
                  {sub.kind === "active" ? (
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${sub.renewing ? "bg-emerald-50 text-emerald-700" : "bg-neutral-100 text-neutral-600"}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${sub.renewing ? "bg-emerald-500" : "bg-neutral-400"}`} />
                      {sub.renewing ? "Active" : "Cancelled"}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-600">Free</span>
                  )}
                </div>
                <dl className={`grid grid-cols-1 divide-y divide-neutral-100 border-t border-neutral-100 text-sm sm:divide-x sm:divide-y-0 ${sub.kind === "active" ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
                  <div className="px-5 py-3.5 sm:px-6">
                    <dt className="text-xs text-neutral-500">
                      {sub.kind === "active" ? (autoPay ? (autoPay.stage === "trial" ? "Free trial until" : autoPay.stage === "retrying" ? "Payment" : "Next payment") : sub.renewing ? "Renews on" : "Ends on") : "Price"}
                    </dt>
                    <dd className="mt-0.5 font-medium">
                      {sub.kind === "active"
                        ? autoPay
                          ? autoPay.stage === "retrying"
                            ? "Retrying"
                            : fmtDate(autoPay.nextChargeAt || sub.endsAt)
                          : sub.endsAt
                            ? fmtDate(sub.endsAt)
                            : "No end date"
                        : "₹0"}
                    </dd>
                  </div>
                  {sub.kind === "active" && (
                    <div className="px-5 py-3.5 sm:px-6">
                      <dt className="text-xs text-neutral-500">Billing</dt>
                      <dd className="mt-0.5 font-medium">
                        {autoPay ? `Monthly · ${autoCharge} · automatic` : lastPaid ? `${cycleName(lastPaid.billingCycle)} · ${lastPaid.amountFormatted.replace(/\.00$/, "")}` : "Paid by UPI"}
                      </dd>
                    </div>
                  )}
                  <div className="px-5 py-3.5 sm:px-6">
                    <dt className="text-xs text-neutral-500">Products</dt>
                    <dd className="mt-0.5 font-medium tabular-nums">{unlimited ? `${used} · no limit` : `${used} of ${limit}`}</dd>
                    {!unlimited && (
                      <div className="mt-1.5 h-1 rounded-full bg-neutral-100 overflow-hidden">
                        <div className={`h-full rounded-full ${pct >= 90 ? "bg-amber-500" : "bg-indigo-500"}`} style={{ width: `${Math.max(2, pct)}%` }} />
                      </div>
                    )}
                  </div>
                </dl>
                {sub.kind === "active" && sub.endsAt && (
                  <div className="flex flex-col gap-2 border-t border-neutral-100 px-5 py-4 text-[13px] sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <p className="text-neutral-500">
                      {autoPay
                        ? autoPay.stage === "trial"
                          ? `Your free trial is on. ${autoCharge} is taken automatically on ${fmtDate(autoPay.nextChargeAt)}, then every month. Cancel before then and you pay nothing.`
                          : autoPay.stage === "retrying"
                            ? "Your last payment failed. We're trying again automatically."
                            : `${autoCharge} is taken automatically${autoPay.nextChargeAt ? ` on ${fmtDate(autoPay.nextChargeAt)}` : ""}, then every month. Cancel any time.`
                        : sub.renewing
                          ? `You pay by UPI each period. We'll remind you daily from ${REMIND_DAYS} days before ${fmtDate(sub.endsAt)}.`
                          : store.planBilling?.current
                            ? `No more payments will be taken. Your plan stays active until ${fmtDate(sub.endsAt)}.`
                            : `No more reminders. Your plan stays active until ${fmtDate(sub.endsAt)}.`}
                    </p>
                    <div className="flex shrink-0 items-center gap-2">
                      {!pending && !sub.endingSoon && !autoPay && sub.renewing && (
                        <button type="button" onClick={() => renew(sub.planId)} className="h-9 rounded-xl border border-neutral-300 px-3.5 text-[13px] font-medium hover:border-neutral-900">
                          Renew early
                        </button>
                      )}
                      {sub.renewing ? (
                        <button type="button" disabled={planBusy} onClick={() => setRenewal("off")} className="h-9 rounded-xl px-3 text-[13px] font-medium text-neutral-500 hover:text-red-600 disabled:opacity-50">
                          Cancel subscription
                        </button>
                      ) : (
                        <button type="button" disabled={planBusy || !!pending} onClick={() => setRenewal("on")} className="h-9 rounded-xl border border-neutral-300 px-3.5 text-[13px] font-medium hover:border-neutral-900 disabled:opacity-50">
                          Resume subscription
                        </button>
                      )}
                    </div>
                  </div>
                )}
                {pending && (
                  <button
                    type="button"
                    onClick={() => {
                      setSubscriptionModalPlanId(pending.planId);
                      setIsSubscriptionModalOpen(true);
                    }}
                    className="flex w-full items-center gap-3 border-t border-neutral-100 px-5 py-3.5 text-left text-[13px] hover:bg-neutral-50 sm:px-6"
                  >
                    <Clock className="h-4 w-4 shrink-0 text-amber-600" />
                    <span className="min-w-0 flex-1">
                      <span className="font-medium">{pending.amountFormatted.replace(/\.00$/, "")} for {pending.planName}</span>
                      <span className="text-neutral-500"> is awaiting confirmation</span>
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-neutral-400" />
                  </button>
                )}
              </div>

              {/* plans: cards, full comparison and connected-app note */}
              <PlansSection
                currentPlanId={store.planId || "free"}
                moveFor={(id) => planMove(store.planId, id, sub)}
                pending={!!pending || planBusy}
                trialUsed={!!store.planBilling?.trialUsed || history.some((h) => h.status === "verified") || (store.planId || "free") !== "free" || !!store.expiredPlanId}
                introUsed={!!store.planBilling?.introUsed}
                onUpgrade={(id) => handleUpgradePlan(id)}
                onRenew={renew}
                lowerNote={sub.kind === "active" && rankOf(store.planId) > 0 ? `Lower plans can be chosen after your ${currentPlan.name} plan ends${sub.endsAt ? ` on ${fmtDate(sub.endsAt)}` : ""}.` : undefined}
              />

              {/* payment history */}
              <div className="rounded-2xl border border-neutral-200 bg-white">
                <div className="px-5 pt-5 sm:px-6">
                  <h3 className="text-base font-semibold">Payment history</h3>
                </div>
                {history.length === 0 ? (
                  <p className="px-5 pb-6 pt-2 text-sm text-neutral-500 sm:px-6">No payments yet.</p>
                ) : (
                  <ul className="mt-3 divide-y divide-neutral-100 border-t border-neutral-100">
                    {history.map((item) => {
                      const st = statusOf(item);
                      return (
                        <li key={item.id} className="flex items-start gap-4 px-5 py-4 sm:px-6">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium">
                              {item.planName} · {cycleName(item.billingCycle)}
                            </p>
                            <p className="mt-0.5 text-xs text-neutral-500">
                              {fmtDate(item.createdAt)}
                              {item.paymentUtr ? ` · UTR ${item.paymentUtr}` : ""}
                            </p>
                            <p className="mt-0.5 truncate text-xs text-neutral-400">Ref {item.referenceId}</p>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="text-sm font-semibold tabular-nums">{item.amountFormatted.replace(/\.00$/, "")}</p>
                            <p className={`mt-1 inline-flex items-center gap-1.5 text-xs font-medium ${st.text}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                              {st.label}
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          );
        })()}

        {/* TAB 9: SETTINGS */}
        {activeTab === "settings" && settingsFrame(
            <>
            {settingsSection === "general" && (
              <GeneralSettings store={store} onChanged={refreshStore} onOpenPolicies={() => setActiveTab("policies")} />
            )}
            {settingsSection === "domain" && <DomainSettings store={store} onUpgrade={() => openSettings("billing")} />}
            {settingsSection === "checkout" && <CheckoutSettings store={store} onChanged={refreshStore} />}
            {settingsSection === "accounts" && <AccountSettings store={store} onChanged={refreshStore} />}
            {settingsSection === "taxes" && <TaxSettings store={store} onChanged={refreshStore} />}
            {settingsSection === "notifications" && <NotificationSettings store={store} onChanged={refreshStore} onOpenEmails={() => { setActiveTab("plugins"); setPluginView("gmail"); scrollDashTop({ top: 0 }); }} />}
            {settingsSection === "events" && <TrackingSettings store={store} onChanged={refreshStore} />}
            {settingsSection === "privacy" && <PrivacySettings store={store} onChanged={refreshStore} onOpenPolicies={() => openSettings("policies")} />}

            {settingsSection === "store" && (
            <>
            {/* Store address */}
            <div className="relative overflow-hidden rounded-2xl bg-neutral-950 text-white p-5 sm:p-6">
              <div aria-hidden className="pointer-events-none absolute -right-14 -top-14 w-44 h-44 rounded-full bg-white/[0.04]" />
              <span className="relative flex items-center gap-2 text-xs text-neutral-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Your store&apos;s web address
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
                  <p className="mt-0.5 text-sm text-neutral-500">Shown at the top of your store. No logo? Your store name is shown instead.</p>
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
                    e.target.value = "";
                    if (file) uploadPhoto(file, undefined, setLogoUrlInput);
                  }}
                />
                <span className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center shrink-0">
                  <UploadCloud className="w-5 h-5 text-neutral-600" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">Upload a logo</span>
                  <span className="block text-xs text-neutral-500">A wide image works best (PNG or JPG)</span>
                </span>
              </label>

              <div className="mt-4 flex items-center gap-3 text-xs text-neutral-400">
                <span className="h-px flex-1 bg-neutral-200" />
                or use an image link
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

              <div className="mt-5 flex items-center justify-between gap-3">
                {logoUrlInput ? (
                  <button
                    type="button"
                    onClick={() => setLogoUrlInput("")}
                    style={{ minHeight: 0 }}
                    className="h-9 px-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50"
                  >
                    Remove logo
                  </button>
                ) : (
                  <span />
                )}
                <button
                  type="button"
                  onClick={handleSaveBrandLogo}
                  className="h-11 px-5 rounded-xl bg-neutral-950 text-white text-sm font-semibold hover:bg-black"
                >
                  Save logo
                </button>
              </div>
            </div>

            {/* Announcement bar */}
            <form onSubmit={handleSaveSettings} className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6">
              <h3 className="text-base font-semibold">Top bar message</h3>
              <p className="mt-0.5 text-sm text-neutral-500">One short line shown above your store, like an offer. Leave empty to hide it.</p>
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
                <div className="mt-3 truncate rounded-xl bg-neutral-950 px-3 py-2 text-center text-xs font-medium text-white reveal-in">{announcementInput}</div>
              )}
              <div className="mt-5 flex justify-end">
                <button type="submit" className="h-11 px-5 rounded-xl bg-neutral-950 text-white text-sm font-semibold hover:bg-black">
                  Save
                </button>
              </div>
            </form>
            </>
            )}

            {settingsSection === "payments" && (
            <>
            {/* Online payments: Growth and Pro connect their own payment gateway */}
            {planHas(store.planId, "paymentGateway") ? (
              <RazorpayPaymentsCard store={store} />
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-neutral-950 p-5 text-white sm:p-6">
                <div className="min-w-0">
                  <p className="text-base font-semibold">Take online payments</p>
                  <p className="mt-0.5 text-sm text-white/60">Cards, UPI and net banking with your own payment gateway. Part of Growth.</p>
                </div>
                <button type="button" onClick={() => openSettings("billing")} className="h-10 shrink-0 rounded-xl bg-white px-4 text-sm font-semibold text-neutral-950 hover:bg-neutral-100">
                  Try Growth free for 10 days
                </button>
              </div>
            )}

            {/* Cash on delivery */}
            <form onSubmit={handleSaveSettings} className="rounded-2xl border border-neutral-200 bg-white">
              <div className="p-5 sm:p-6">
                <h3 className="text-base font-semibold">Cash on delivery</h3>

                <div className="mt-4 flex items-center justify-between gap-4 rounded-xl bg-neutral-50 p-4">
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="w-10 h-10 rounded-xl border border-neutral-200 bg-white flex items-center justify-center shrink-0">
                      <Truck className="w-4 h-4 text-neutral-700" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold">Cash on delivery</span>
                      <span className="block text-xs text-neutral-500">
                        {!planHas(store.planId, "paymentGateway") ? "Your payment option on Free" : codEnabledInput ? "Buyers can pay when the order arrives" : "Online payments only"}
                      </span>
                    </span>
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={codEnabledInput}
                    aria-label="Cash on delivery"
                    disabled={!planHas(store.planId, "paymentGateway")}
                    onClick={() => setCodEnabledInput(!codEnabledInput)}
                    style={{ minHeight: 0, height: 24 }}
                    className={`relative w-11 shrink-0 rounded-full transition-colors ${codEnabledInput ? "bg-emerald-500" : "bg-neutral-300"}`}
                  >
                    <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${codEnabledInput ? "left-[22px]" : "left-0.5"}`} />
                  </button>
                </div>

                {codEnabledInput && (
                  <div className="mt-4 reveal-in">
                    <label htmlFor="settings-cod-fee" className="block text-sm font-medium">Extra charge for cash on delivery</label>
                    <span className="mt-0.5 block text-xs text-neutral-500">Optional. Leave 0 for no extra charge.</span>
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
              <div className="flex justify-end border-t border-neutral-100 p-5 sm:p-6">
                <button type="submit" className="h-11 px-5 rounded-xl bg-neutral-950 text-white text-sm font-semibold hover:bg-black">
                  Save
                </button>
              </div>
            </form>
            </>
            )}

            {settingsSection === "delivery" && (
            <form onSubmit={handleSaveSettings} className="rounded-2xl border border-neutral-200 bg-white">
              <div className="p-5 sm:p-6">
                <h3 className="text-base font-semibold">Delivery charges</h3>
                <p className="mt-0.5 text-sm text-neutral-500">How much buyers pay for delivery. It&apos;s added at checkout.</p>

                <div role="radiogroup" aria-label="Delivery charges" className="mt-4 grid gap-2 sm:grid-cols-3">
                  {(
                    [
                      { id: "free", title: "Always free", text: "Buyers never pay for delivery" },
                      { id: "flat", title: "Same charge", text: "One fixed charge on every order" },
                      { id: "free_above", title: "Free on big orders", text: "Charge only on smaller orders" },
                    ] as const
                  ).map((o) => {
                    const on = deliveryMode === o.id;
                    return (
                      <button
                        key={o.id}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        onClick={() => setDeliveryMode(o.id)}
                        style={{ minHeight: 0 }}
                        className={`rounded-xl border p-3.5 text-left transition-colors ${
                          on ? "border-neutral-950 bg-neutral-950 text-white" : "border-neutral-200 bg-white hover:border-neutral-400"
                        }`}
                      >
                        <span className="block text-sm font-semibold">{o.title}</span>
                        <span className={`block text-xs ${on ? "text-white/70" : "text-neutral-500"}`}>{o.text}</span>
                      </button>
                    );
                  })}
                </div>

                {deliveryMode !== "free" && (
                  <div className="mt-4 grid gap-4 sm:grid-cols-2 reveal-in">
                    <div>
                      <label htmlFor="settings-delivery-fee" className="block text-sm font-medium">Delivery charge</label>
                      <label className="mt-1.5 flex items-center gap-2 h-11 px-3.5 rounded-xl border border-neutral-200 bg-white focus-within:border-neutral-900 transition-colors">
                        <span className="text-sm text-neutral-400">₹</span>
                        <input
                          id="settings-delivery-fee"
                          inputMode="decimal"
                          value={deliveryFeeInput}
                          onChange={(e) => setDeliveryFeeInput(e.target.value.replace(/[^\d.]/g, ""))}
                          placeholder="50"
                          className="w-full bg-transparent text-sm outline-none"
                        />
                      </label>
                    </div>
                    {deliveryMode === "free_above" && (
                      <div className="reveal-in">
                        <label htmlFor="settings-free-above" className="block text-sm font-medium">Free when the order is</label>
                        <label className="mt-1.5 flex items-center gap-2 h-11 px-3.5 rounded-xl border border-neutral-200 bg-white focus-within:border-neutral-900 transition-colors">
                          <span className="text-sm text-neutral-400">₹</span>
                          <input
                            id="settings-free-above"
                            inputMode="decimal"
                            value={freeAboveInput}
                            onChange={(e) => setFreeAboveInput(e.target.value.replace(/[^\d.]/g, ""))}
                            placeholder="500"
                            className="w-full bg-transparent text-sm outline-none"
                          />
                          <span className="shrink-0 text-xs text-neutral-400">or more</span>
                        </label>
                      </div>
                    )}
                  </div>
                )}

                <p className="mt-4 flex items-center gap-2 rounded-xl bg-neutral-50 px-3.5 py-3 text-sm text-neutral-700">
                  <Truck className="h-4 w-4 shrink-0 text-neutral-500" />
                  {deliveryMode === "free"
                    ? "Buyers see: Free delivery on every order"
                    : deliveryMode === "flat"
                      ? `Buyers see: Delivery ₹${deliveryFeeInput || "0"} on every order`
                      : `Buyers see: Free delivery on orders of ₹${freeAboveInput || "0"} or more, otherwise ₹${deliveryFeeInput || "0"}`}
                </p>
              </div>

              <div className="flex justify-end border-t border-neutral-100 p-5 sm:p-6">
                <button type="submit" className="h-11 px-5 rounded-xl bg-neutral-950 text-white text-sm font-semibold hover:bg-black">
                  Save
                </button>
              </div>
            </form>
            )}
            </>
        )}

        {/* TAB 11: PLUGINS (Shiprocket, WhatsApp, Gmail) */}
        {activeTab === "plugins" && (
          <div className="mt-6">
          <PluginsHub
            store={store}
            view={pluginView}
            onOpen={(v) => {
              setPluginView(v);
              scrollDashTop({ top: 0 });
            }}
            onUpgrade={() => openSettings("billing")}
            onChanged={refreshStore}
            gmail={
          <div className="space-y-6">
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
              <EmailPanel store={store} storeWebDomain={storeWebDomain} onRemoveSubscriber={handleRemoveSubscriber} />
            )}
          </div>
            }
          />
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
                { label: "Payments", href: "/#platform" },
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
        hidden={!showDock && !isMobileMenuOpen}
        storeKey={store.subdomain}
        active={inSettings ? "settings" : activeTab}
        onSelect={(tab) => {
          setIsMobileMenuOpen(false);
          setActiveTab(tab);
        }}
        menuOpen={isMobileMenuOpen}
        onToggleMenu={() => setIsMobileMenuOpen((o) => !o)}
        notices={notifications}
        onSeen={rememberRead}
      />

      {/* Assistant: ask or command, every change confirmed first */}
      {!inEditor && !assistantOpen && <AssistantButton onClick={() => setAssistantOpen(true)} raised={showDock} />}
      <AssistantPanel
        store={store}
        ownerName={ownerName}
        open={assistantOpen}
        side={assistantSide}
        prompt={assistantPrompt}
        onClose={() => setAssistantOpen(false)}
        onNavigate={(page, opts) => {
          setIsMobileMenuOpen(false);
          if (opts?.action === "add-product") startAddProduct();
          else setActiveTab(page);
          const order = opts?.orderId ? (store.orders || []).find((o) => o.id === opts.orderId) : null;
          setSelectedOrder(order || null);
          scrollDashTop({ top: 0 });
          // full screen covers the page, so step aside to show where we went
          if (!assistantFitsBeside()) setAssistantOpen(false);
        }}
      />

      {/* Interactive tutorial: opens the right page and points at each step */}
      {tutorial && (
        <TutorialRunner
          tutorial={tutorial}
          onClose={() => setTutorial(null)}
          onPrepare={(step) => {
            setIsMobileMenuOpen(false);
            if (step.action === "add-product") {
              if (!isProductModalOpen) startAddProduct();
              return;
            }
            if (isProductModalOpen) setIsProductModalOpen(false);
            if (step.settings) openSettings(step.settings);
            else if (step.tab) setActiveTab(step.tab);
          }}
        />
      )}

      {/* Setup checklist: one step at a time, in a card in the middle of the screen */}
      {setupStart !== null && (
        <SetupWizard store={store} startAt={setupStart} onClose={() => setSetupStart(null)} onChanged={refreshStore} onOpenPolicies={() => setActiveTab("policies")} />
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

            <div className="grid grid-cols-4 gap-x-1.5 gap-y-3">
              {(
                [
                  // Home, Orders and Settings live in the bottom bar, so the menu holds the rest (two even rows)
                  { id: "products", label: "Products", icon: IProducts, dot: notifications.some((n) => n.unread && n.type === "stock") },
                  { id: "categories", label: "Categories", icon: ICategories },
                  { id: "customers", label: "Customers", icon: ICustomers },
                  { id: "reviews", label: "Reviews", icon: IReviews, locked: !canUseReviews(store.planId) },
                  { id: "discounts", label: "Discounts", icon: IDiscounts, locked: !canUseCoupons(store.planId) },
                  { id: "themes", label: "Themes", icon: IThemes },
                  { id: "plugins", label: "Plugins", icon: IPlugins },
                  { id: "notifications", label: "Alerts", icon: INotifications, dot: notifications.some((n) => n.unread) },
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

/** Settings pages that live inside the Settings tab (Policies, Plan & billing and Emails to buyers are their own tabs, shown in the same frame). */
const SETTINGS_SECTIONS = ["general", "store", "domain", "payments", "checkout", "accounts", "delivery", "taxes", "notifications", "events", "privacy"] as const;
type SettingsSection = (typeof SETTINGS_SECTIONS)[number];

/** Full-screen holding state for the dashboard (loading, or about to redirect), in the app's style. */
const DASHBOARD_TOUR: TourStep[] = [
  { title: "Welcome to your shop's dashboard", text: "A quick look around. You can replay this any time from Show me around." },
  { target: '[data-tour="stats"]', title: "Your numbers", text: "Sales, orders and visitors at a glance. They update as orders come in." },
  { target: '[data-tour="store-link"]', title: "Your live shop", text: "Open your shop the way buyers see it. Share this link on Instagram and WhatsApp." },
  { target: '[data-tour="nav-categories"]', title: "1. Add categories", text: "Start here: make categories like T-Shirts or Earrings. Every product goes into one." },
  { target: '[data-tour="nav-products"]', title: "2. Add products", text: "Add products one by one, or upload a spreadsheet of many at once with Bulk upload." },
  { target: '[data-tour="nav-themes"]', title: "3. Make it yours", text: "Pick a theme and edit its words, photos and colours. Double-click text in the preview to type over it." },
  { target: '[data-tour="nav-policies"]', title: "4. Add your policies", text: "Terms, returns, shipping and privacy pages protect you and are required for online shops. Templates are ready to edit." },
  { target: '[data-tour="nav-orders"]', title: "Orders", text: "New orders show up here. Confirm payment, add tracking, cancel or handle returns, and message the buyer." },
  { target: '[data-tour="dock-orders"]', title: "Orders", text: "New orders show up here. Confirm payment, add tracking, and message the buyer." },
  { target: '[data-tour="dock-menu"]', title: "Everything else", text: "Products, categories, themes, policies and more are in this menu." },
];

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
