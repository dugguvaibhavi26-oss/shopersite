"use client";
import { appAlert, appConfirm, appPrompt } from "@/components/ui/app-dialog";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { siteConfig } from "@/lib/config/site";
import { getTheme, PLATFORM_THEMES } from "@/lib/themes";
import {
  storeService,
  StoreData,
  PlatformBroadcast,
  OrderData,
  ProductData,
} from "@/lib/store-service";
import { PLATFORM_PLANS } from "@/lib/plans";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { ShopperLogo } from "@/components/brand/shopper-logo";
import { getStoreDomain, getStoreUrl } from "@/lib/config/site";
import { PlatformBannersManager } from "@/components/admin/platform-banners-manager";
import { PlansManager } from "@/components/admin/plans-manager";
import { PlatformPaymentSettings } from "@/components/admin/platform-payment-settings";
import { ThemesManager } from "@/components/admin/themes-manager";
import {
  ShieldAlert,
  Users,
  Store,
  DollarSign,
  TrendingUp,
  Package,
  ShoppingBag,
  Send,
  Mail,
  MessageCircle,
  ExternalLink,
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Lock,
  Unlock,
  Image as ImageIcon,
  RefreshCw,
  Eye,
  Trash2,
  Edit,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  CreditCard,
  Sparkles,
  Bell,
  Activity,
  Layers,
  Radio,
  Server,
  Zap,
  Download,
  Copy,
  Check,
  BarChart3,
  FileSpreadsheet,
  Clock,
  Phone,
  MapPin,
  Calendar,
  Filter,
  ChevronRight,
  X,
  Truck,
  QrCode,
  Tag,
  ShoppingBasket,
  ChevronDown,
} from "lucide-react";

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div className="dash home-sans admin min-h-screen flex items-center justify-center bg-[#FAFAFA] text-neutral-950">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-neutral-500 font-mono">Authenticating Lead Dashboard...</p>
          </div>
        </div>
      }
    >
      <AdminDashboardContent />
    </Suspense>
  );
}

function AdminDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading, signOut } = useAuth();

  const urlSellerParam = searchParams.get("seller") || searchParams.get("store");

  // Admin access: signed in with a verified email on the admin list. The database rules enforce the
  // same list, so this screen only decides what to show; nobody else can change anything.
  const isAuthenticated =
    !!user && !!user.email && user.emailVerified && siteConfig.adminEmails.includes(user.email.toLowerCase());
  useEffect(() => {
    storeService.setAdminMode(isAuthenticated);
  }, [isAuthenticated]);

  // Active Tab: overview | users | subscriptions | broadcasts | banners | health
  const [activeTab, setActiveTab] = useState<
    "overview" | "users" | "subscriptions" | "broadcasts" | "banners" | "themes" | "health"
  >("overview");
  // Plans & payments is split into sections
  const [plansSection, setPlansSection] = useState<"payments" | "plans" | "stores" | "settings">("payments");

  // Detailed Seller Profile View State (when inspecting a single store's full history)
  const [viewingSellerSubdomain, setViewingSellerSubdomain] = useState<string | null>(
    urlSellerParam || null
  );
  const [sellerProfileTab, setSellerProfileTab] = useState<
    "orders" | "products" | "customers" | "settings"
  >("orders");
  const [orderSearchQuery, setOrderSearchQuery] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>("all");
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [expandedOrderIds, setExpandedOrderIds] = useState<Record<string, boolean>>({});

  const toggleOrderExpanded = (orderId: string) => {
    setExpandedOrderIds((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  // Stores & Platform Data State
  const [stores, setStores] = useState<StoreData[]>([]);
  const [broadcasts, setBroadcasts] = useState<PlatformBroadcast[]>([]);
  const [stats, setStats] = useState({
    totalStores: 0,
    activeStores: 0,
    suspendedStores: 0,
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalCustomers: 0,
    totalSubscribers: 0,
    freeStores: 0,
    starterStores: 0,
    proStores: 0,
    mrr: 0,
  });

  // Filter & Search State for Directory
  const [searchQuery, setSearchQuery] = useState("");
  const [planFilter, setPlanFilter] = useState<"all" | "free" | "starter" | "pro">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "suspended">("all");

  // Store Management Modals
  const [selectedStore, setSelectedStore] = useState<StoreData | null>(null);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [targetPlan, setTargetPlan] = useState<"free" | "starter" | "pro">("starter");

  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Broadcast Form State
  const [broadcastTarget, setBroadcastTarget] = useState<"all" | "free" | "starter" | "pro">("all");
  const [broadcastSubject, setBroadcastSubject] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastCtaText, setBroadcastCtaText] = useState("");
  const [broadcastCtaLink, setBroadcastCtaLink] = useState("");
  const [broadcastSending, setBroadcastSending] = useState(false);
  const [broadcastSuccessToast, setBroadcastSuccessToast] = useState(false);

  const [copiedEmailsToast, setCopiedEmailsToast] = useState(false);
  const [copiedAllEmailsToast, setCopiedAllEmailsToast] = useState(false);


  // Update viewingSellerSubdomain if URL param changes
  useEffect(() => {
    if (urlSellerParam) {
      setViewingSellerSubdomain(urlSellerParam);
    }
  }, [urlSellerParam]);

  // Refresh platform data
  const refreshData = () => {
    const all = storeService.getAllStores();
    setStores(all);
    setStats(storeService.getPlatformStats());
    setBroadcasts(storeService.getPlatformBroadcasts());
  };

  useEffect(() => {
    refreshData();
    const unsubscribe = storeService.subscribe(() => {
      refreshData();
    });
    return () => unsubscribe();
  }, []);

  const handleLockDashboard = () => {
    signOut().catch(() => {});
  };

  // Broadcast Message Templates
  const BROADCAST_TEMPLATES = [
    {
      label: "🎉 New Themes",
      subject: "[shopersite] 6 New Designer Themes & Font Controls Released!",
      message:
        "Hello Store Owners,\n\nWe have just unlocked 6 brand-new boutique store themes (Brutalist, Editorial, Minimalist, Pastel Luxe) and Google Typography controls in your Seller Dashboard. Upgrade your storefront visual aesthetic today!",
      ctaText: "Customize Storefront",
      ctaLink: "/dashboard",
    },
    {
      label: "⚠️ Maintenance",
      subject: "🛠️ [Advisory] Scheduled Infrastructure Upgrade on shopersite Cloud",
      message:
        "Dear Merchant,\n\nWe will be conducting a 15-minute scheduled cloud synchronization upgrade at 2:00 AM IST tonight. Your storefronts and checkout forms will remain completely accessible without downtime.",
      ctaText: "Check Cloud Status",
      ctaLink: "/admin",
    },
    {
      label: "⚡ 50% Pro Discount",
      subject: "🚀 Special Offer: Get 50% Off shopersite Pro with Unlimited Products & Gmail Drops",
      message:
        "Dear Merchant,\n\nGrow your store with unlimited catalog listings, custom designer fonts, buyer testimonials, and automated Gmail new-collection notifications. Use promo code PROGROWTH50 today!",
      ctaText: "Upgrade Subscription",
      ctaLink: "/dashboard",
    },
    {
      label: "💳 UPI Active",
      subject: "💳 [Important] Zero-Fee Direct UPI QR Settlements are now Active",
      message:
        "Hi there,\n\nDirect UPI payments now route 100% of customer funds straight to your designated UPI VPA with 0% platform transaction fee. Verify your UPI VPA in Settings.",
      ctaText: "Review UPI Settings",
      ctaLink: "/dashboard",
    },
  ];

  // Target emails for broadcast or direct Gmail compose
  const targetEmails = useMemo(() => {
    return stores
      .filter((s) => broadcastTarget === "all" || s.planId === broadcastTarget)
      .map((s) => s.ownerEmail || s.contactEmail)
      .filter((em): em is string => Boolean(em && em.includes("@")));
  }, [stores, broadcastTarget]);

  // All merchant contactable emails
  const allMerchantEmails = useMemo(() => {
    return stores
      .map((s) => s.ownerEmail || s.contactEmail)
      .filter((em): em is string => Boolean(em && em.includes("@")));
  }, [stores]);

  // Category Aggregation
  const categoryStats = useMemo(() => {
    const counts: Record<string, number> = {};
    stores.forEach((s) => {
      const cat = s.category || "General";
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [stores]);

  // Top Stores Leaderboard (ranked by product and order count)
  const topStores = useMemo(() => {
    return [...stores]
      .map((s) => {
        const orderCount = s.orders?.length || 0;
        const productCount = s.products?.length || 0;
        return { ...s, orderCount, productCount };
      })
      .sort((a, b) => b.orderCount - a.orderCount || b.productCount - a.productCount)
      .slice(0, 5);
  }, [stores]);

  // Feature adoption metrics across registered boutique tenants
  const featureAdoption = useMemo(() => {
    const total = stores.length || 1;
    const upiCount = stores.filter((s) => Boolean(s.upiId)).length;
    const codCount = stores.filter((s) => Boolean(s.codEnabled)).length;
    const customThemeCount = stores.filter(
      (s) => Boolean(s.activeThemeSlug && s.activeThemeSlug !== "minimal")
    ).length;
    const subscriberCount = stores.filter(
      (s) => (s.subscribers?.length || 0) > 0
    ).length;

    return {
      upi: { count: upiCount, pct: Math.round((upiCount / total) * 100) },
      cod: { count: codCount, pct: Math.round((codCount / total) * 100) },
      customTheme: {
        count: customThemeCount,
        pct: Math.round((customThemeCount / total) * 100),
      },
      subscribers: {
        count: subscriberCount,
        pct: Math.round((subscriberCount / total) * 100),
      },
    };
  }, [stores]);

  // Filtered stores for Directory
  const filteredStores = useMemo(() => {
    return stores.filter((s) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.subdomain.toLowerCase().includes(q) ||
        s.ownerName.toLowerCase().includes(q) ||
        (s.ownerEmail && s.ownerEmail.toLowerCase().includes(q)) ||
        (s.contactEmail && s.contactEmail.toLowerCase().includes(q)) ||
        s.category.toLowerCase().includes(q);

      const matchesPlan = planFilter === "all" || s.planId === planFilter;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "published" && s.status === "published" && !s.isPaused) ||
        (statusFilter === "suspended" && (s.status === "suspended" || s.isPaused));

      return matchesQuery && matchesPlan && matchesStatus;
    });
  }, [stores, searchQuery, planFilter, statusFilter]);

  // Currently inspected store for detailed profile
  const viewingStore = useMemo(() => {
    if (!viewingSellerSubdomain) return null;
    return stores.find((s) => s.subdomain === viewingSellerSubdomain) || null;
  }, [stores, viewingSellerSubdomain]);

  // Filtered orders for viewingStore
  const viewingStoreFilteredOrders = useMemo(() => {
    if (!viewingStore || !viewingStore.orders) return [];
    return viewingStore.orders.filter((o) => {
      const q = orderSearchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        o.id.toLowerCase().includes(q) ||
        o.number.toLowerCase().includes(q) ||
        o.customer.name.toLowerCase().includes(q) ||
        o.customer.phone.toLowerCase().includes(q) ||
        (o.customer.email && o.customer.email.toLowerCase().includes(q));

      const matchesStatus =
        orderStatusFilter === "all" || o.fulfilmentStatus === orderStatusFilter;

      return matchesQuery && matchesStatus;
    });
  }, [viewingStore, orderSearchQuery, orderStatusFilter]);

  // Filtered products for viewingStore
  const viewingStoreFilteredProducts = useMemo(() => {
    if (!viewingStore || !viewingStore.products) return [];
    return viewingStore.products.filter((p) => {
      const q = productSearchQuery.toLowerCase().trim();
      return (
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    });
  }, [viewingStore, productSearchQuery]);

  // Actions
  const handleUpdatePlan = (subdomain: string, newPlan: "free" | "starter" | "pro") => {
    storeService.setStorePlan(subdomain, newPlan);
    setIsPlanModalOpen(false);
    refreshData();
  };

  const handleToggleStatus = (subdomain: string, currentStatus: string, isPaused?: boolean) => {
    const isCurrentlySuspended = currentStatus === "suspended" || isPaused;
    const nextStatus = isCurrentlySuspended ? "published" : "suspended";
    storeService.setStoreStatus(
      subdomain,
      nextStatus,
      nextStatus === "suspended" ? suspensionReason || "Suspended by platform lead" : undefined
    );
    setIsStatusModalOpen(false);
    setSuspensionReason("");
    refreshData();
  };

  const handleDeleteStore = (subdomain: string) => {
    storeService.deleteStore(subdomain);
    setIsDeleteModalOpen(false);
    setSelectedStore(null);
    if (viewingSellerSubdomain === subdomain) {
      setViewingSellerSubdomain(null);
    }
    refreshData();
  };

  const handleApplyTemplate = (tpl: (typeof BROADCAST_TEMPLATES)[0]) => {
    setBroadcastSubject(tpl.subject);
    setBroadcastMessage(tpl.message);
    setBroadcastCtaText(tpl.ctaText);
    setBroadcastCtaLink(tpl.ctaLink);
  };

  const handleCopyTargetEmails = () => {
    if (targetEmails.length === 0) {
      appAlert("No email addresses found for the selected merchant target.");
      return;
    }
    navigator.clipboard.writeText(targetEmails.join(", "));
    setCopiedEmailsToast(true);
    setTimeout(() => setCopiedEmailsToast(false), 3000);
  };

  const handleCopyAllEmails = () => {
    if (allMerchantEmails.length === 0) {
      appAlert("No merchant emails available.");
      return;
    }
    navigator.clipboard.writeText(allMerchantEmails.join(", "));
    setCopiedAllEmailsToast(true);
    setTimeout(() => setCopiedAllEmailsToast(false), 3000);
  };

  const handleOpenGmailWeb = () => {
    if (!broadcastSubject.trim() || !broadcastMessage.trim()) {
      appAlert("Please provide both a subject and message before launching Gmail.");
      return;
    }
    const bccList = targetEmails.join(",");
    let body = broadcastMessage;
    if (broadcastCtaText && broadcastCtaLink) {
      body += `\n\n${broadcastCtaText}: ${broadcastCtaLink}`;
    }
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&bcc=${encodeURIComponent(
      bccList
    )}&su=${encodeURIComponent(broadcastSubject)}&body=${encodeURIComponent(body)}`;
    window.open(gmailUrl, "_blank");
  };

  const handleExportCSV = () => {
    const headers = [
      "Store Name",
      "Subdomain",
      "Owner Name",
      "Email",
      "Phone",
      "Plan",
      "Status",
      "Products Count",
      "Orders Count",
    ];
    const rows = stores.map((s) => [
      `"${s.name.replace(/"/g, '""')}"`,
      `"${s.subdomain}"`,
      `"${s.ownerName.replace(/"/g, '""')}"`,
      `"${s.ownerEmail || s.contactEmail || ""}"`,
      `"${s.contactPhone || ""}"`,
      `"${s.planId}"`,
      `"${s.status}"`,
      s.products?.length || 0,
      s.orders?.length || 0,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `shopper_merchants_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastSubject || !broadcastMessage) {
      appAlert("Please provide both subject and message.");
      return;
    }

    setBroadcastSending(true);
    setTimeout(() => {
      storeService.sendPlatformBroadcast({
        target: broadcastTarget,
        subject: broadcastSubject,
        message: broadcastMessage,
        ctaText: broadcastCtaText || undefined,
        ctaLink: broadcastCtaLink || undefined,
      });

      setBroadcastSending(false);
      setBroadcastSuccessToast(true);
      setBroadcastSubject("");
      setBroadcastMessage("");
      setBroadcastCtaText("");
      setBroadcastCtaLink("");
      refreshData();
      setTimeout(() => setBroadcastSuccessToast(false), 5000);
    }, 600);
  };

  // Format currency in INR
  const formatINR = (paise: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(paise / 100);
  };

  // ADMIN SIGN-IN SCREEN
  if (!isAuthenticated) {
    return (
      <div className="dash home-sans admin min-h-screen bg-[#FAFAFA] text-neutral-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white border border-neutral-200 rounded-2xl p-8 shadow-xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-xl bg-neutral-100 border border-neutral-200 text-neutral-900 flex items-center justify-center mx-auto shadow-xs">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h1 className="text-[1.6rem] font-semibold tracking-[-0.02em] text-neutral-900">Platform admin</h1>
            <p className="text-xs text-neutral-500">Only the Shopersite team can open this page.</p>
          </div>

          {authLoading ? (
            <p className="text-center text-sm text-neutral-500">Checking your account…</p>
          ) : user ? (
            <div className="space-y-4">
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>
                  {user.email || "This account"} isn&apos;t an admin{user.email && !user.emailVerified ? " (email not verified)" : ""}.
                </span>
              </div>
              <Button onClick={handleLockDashboard} className="w-full bg-neutral-900 hover:bg-black text-white font-bold text-xs py-2.5">
                Sign out and use another account
              </Button>
            </div>
          ) : (
            <Link
              href="/login?redirect=/admin"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-neutral-900 py-2.5 text-xs font-bold text-white hover:bg-black"
            >
              <Unlock className="w-4 h-4" /> Sign in with your admin account
            </Link>
          )}

          <div className="pt-4 border-t border-neutral-200 text-center">
            <Link href="/" className="text-xs text-neutral-500 hover:text-neutral-900 transition-colors">
              ← Back to shopersite
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // TOP LEVEL: INDIVIDUAL SELLER PROFILE & COMPLETE STORE HISTORY VIEW
  if (viewingStore) {
    const storeOrders = viewingStore.orders || [];
    const storeProducts = viewingStore.products || [];
    const storeCustomers = viewingStore.customers || [];
    const storeSubscribers = viewingStore.subscribers || [];
    const storeGMV = storeOrders.reduce((acc, o) => acc + o.total, 0);

    return (
      <div className="dash home-sans admin min-h-screen bg-[#FAFAFA] text-neutral-950 flex flex-col">
        {/* Top Header */}
        <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/90 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
            <button
              type="button"
              onClick={() => {
                setViewingSellerSubdomain(null);
                router.push("/admin");
              }}
              aria-label="Back to merchants"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-700 hover:border-neutral-900 hover:text-black"
            >
              <ArrowLeft className="h-[18px] w-[18px]" />
            </button>
            <div className="min-w-0 flex-1">
              <span className="block truncate text-base font-semibold leading-tight">{viewingStore.name}</span>
              <span className="block truncate text-xs text-neutral-500">{getStoreDomain(viewingStore.subdomain)}</span>
            </div>
            <Link
              href={getStoreUrl(viewingStore.subdomain)}
              target="_blank"
              className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3.5 text-sm font-semibold text-neutral-800 hover:border-neutral-900"
            >
              <span className="hidden sm:inline">Storefront</span>
              <ExternalLink className="h-4 w-4" />
            </Link>
          </div>
        </header>

        {/* Seller Profile Content Body */}
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-8 w-full space-y-6">
          {/* Store Profile Card Header */}
          <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-xs space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-neutral-100">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-neutral-900 text-white flex items-center justify-center font-black text-xl shadow-xs shrink-0">
                  {viewingStore.name.slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl font-black text-neutral-900 tracking-tight">
                      {viewingStore.name}
                    </h1>
                    {viewingStore.status === "published" && !viewingStore.isPaused ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                        <CheckCircle className="w-3 h-3 text-emerald-600" />
                        <span>Store Published & Live</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-700 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-full">
                        <XCircle className="w-3 h-3 text-red-600" />
                        <span>Store Suspended / Paused</span>
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-neutral-500 mt-1">
                    Owned by <strong className="text-neutral-800">{viewingStore.ownerName}</strong> • Category:{" "}
                    <span className="capitalize font-semibold text-neutral-700">{viewingStore.category}</span>
                  </p>

                  <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-neutral-600">
                    <span className="flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-neutral-400" />
                      <span>{viewingStore.ownerEmail || viewingStore.contactEmail || "No email"}</span>
                    </span>
                    {viewingStore.contactPhone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-neutral-400" />
                        <span>{viewingStore.contactPhone}</span>
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-neutral-400">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Created: {new Date(viewingStore.createdAt).toLocaleDateString()}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Lead Admin Direct Controls */}
              <div className="flex flex-wrap items-center gap-2">
                {(viewingStore.ownerEmail || viewingStore.contactEmail) && (
                  <a
                    href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
                      viewingStore.ownerEmail || viewingStore.contactEmail || ""
                    )}&su=${encodeURIComponent("Platform Notice for " + viewingStore.name)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Email via Gmail</span>
                  </a>
                )}

                {viewingStore.contactPhone && (
                  <a
                    href={`https://wa.me/${viewingStore.contactPhone.replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                )}

                <button
                  onClick={() => {
                    setSelectedStore(viewingStore);
                    setTargetPlan(viewingStore.planId);
                    setIsPlanModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md bg-neutral-100 text-neutral-800 border border-neutral-200 hover:bg-neutral-200 transition-colors"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>Change Plan</span>
                </button>

                <button
                  onClick={() => {
                    setSelectedStore(viewingStore);
                    setIsStatusModalOpen(true);
                  }}
                  className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md border transition-colors ${
                    viewingStore.status === "suspended" || viewingStore.isPaused
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                      : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>
                    {viewingStore.status === "suspended" || viewingStore.isPaused
                      ? "Reactivate Store"
                      : "Pause Store"}
                  </span>
                </button>

                <button
                  onClick={() => {
                    setSelectedStore(viewingStore);
                    setIsDeleteModalOpen(true);
                  }}
                  className="p-1.5 rounded-md text-neutral-400 hover:text-red-600 hover:bg-red-50 border border-neutral-200 transition-colors"
                  title="Delete Store Permanently"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Individual Seller Store Metrics Row (Detailed History & Values) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-neutral-950 text-white">
                <span className="text-xs text-neutral-400">Sales</span>
                <div className="text-xl sm:text-2xl font-semibold mt-1 tabular-nums">
                  {formatINR(storeGMV)}
                </div>
                <span className="text-[11px] text-neutral-400 mt-0.5 block">
                  {storeOrders.length} order{storeOrders.length === 1 ? "" : "s"}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-neutral-200">
                <span className="text-xs text-neutral-500">Products</span>
                <div className="text-xl sm:text-2xl font-black text-neutral-900 mt-1">
                  {storeProducts.length}
                </div>
                <span className="text-[11px] text-neutral-500 mt-0.5 block">
                  of {PLATFORM_PLANS[viewingStore.planId]?.maxProducts >= 9999 ? "unlimited" : PLATFORM_PLANS[viewingStore.planId]?.maxProducts} on {PLATFORM_PLANS[viewingStore.planId]?.name || "Free"}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-neutral-200">
                <span className="text-xs text-neutral-500">Customers</span>
                <div className="text-xl sm:text-2xl font-black text-neutral-900 mt-1">
                  {storeCustomers.length}
                </div>
                <span className="text-[11px] text-neutral-500 mt-0.5 block">
                  People who ordered
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-neutral-200">
                <span className="text-xs text-neutral-500">Subscribers</span>
                <div className="text-xl sm:text-2xl font-black text-neutral-900 mt-1">
                  {storeSubscribers.length}
                </div>
                <span className="text-[11px] text-neutral-500 mt-0.5 block">
                  Newsletter sign-ups
                </span>
              </div>
            </div>
          </div>

          {/* Seller Profile Navigation Tabs */}
          <div className="no-scrollbar flex gap-5 overflow-x-auto border-b border-neutral-200 text-sm font-medium">
            <button
              onClick={() => setSellerProfileTab("orders")}
              className={`pb-3 px-1 border-b-2 transition-all flex shrink-0 items-center gap-1.5 whitespace-nowrap ${
                sellerProfileTab === "orders"
                  ? "border-neutral-900 text-neutral-900 font-bold"
                  : "border-transparent text-neutral-500 hover:text-neutral-800"
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Orders ({storeOrders.length})</span>
            </button>

            <button
              onClick={() => setSellerProfileTab("products")}
              className={`pb-3 px-1 border-b-2 transition-all flex shrink-0 items-center gap-1.5 whitespace-nowrap ${
                sellerProfileTab === "products"
                  ? "border-neutral-900 text-neutral-900 font-bold"
                  : "border-transparent text-neutral-500 hover:text-neutral-800"
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Products ({storeProducts.length})</span>
            </button>

            <button
              onClick={() => setSellerProfileTab("customers")}
              className={`pb-3 px-1 border-b-2 transition-all flex shrink-0 items-center gap-1.5 whitespace-nowrap ${
                sellerProfileTab === "customers"
                  ? "border-neutral-900 text-neutral-900 font-bold"
                  : "border-transparent text-neutral-500 hover:text-neutral-800"
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Customers ({storeCustomers.length + storeSubscribers.length})</span>
            </button>

            <button
              onClick={() => setSellerProfileTab("settings")}
              className={`pb-3 px-1 border-b-2 transition-all flex shrink-0 items-center gap-1.5 whitespace-nowrap ${
                sellerProfileTab === "settings"
                  ? "border-neutral-900 text-neutral-900 font-bold"
                  : "border-transparent text-neutral-500 hover:text-neutral-800"
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Settings</span>
            </button>
          </div>

          {/* TAB 1: FULL ORDER HISTORY */}
          {sellerProfileTab === "orders" && (
            <div className="space-y-4">
              {/* Order Search & Status Filter + Expand All */}
              <div className="p-4 bg-white border border-neutral-200 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
                <div className="relative w-full sm:w-80">
                  <Input
                    placeholder="Search by customer name, order ID, phone..."
                    value={orderSearchQuery}
                    onChange={(e) => setOrderSearchQuery(e.target.value)}
                    className="text-xs bg-neutral-50 border-neutral-300 pl-8 py-2"
                  />
                  <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-3" />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <select
                    value={orderStatusFilter}
                    onChange={(e) => setOrderStatusFilter(e.target.value)}
                    className="text-xs bg-neutral-50 border border-neutral-300 rounded-md px-3 py-2 text-neutral-800 cursor-pointer"
                  >
                    <option value="all">All Order Statuses</option>
                    <option value="placed">Placed / New</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => {
                      const allOpen =
                        viewingStoreFilteredOrders.length > 0 &&
                        viewingStoreFilteredOrders.every((o) => expandedOrderIds[o.id]);
                      const next: Record<string, boolean> = {};
                      if (!allOpen) {
                        viewingStoreFilteredOrders.forEach((o) => (next[o.id] = true));
                      }
                      setExpandedOrderIds(next);
                    }}
                    className="text-xs font-semibold text-neutral-700 hover:text-neutral-900 px-3 py-2 rounded-md border border-neutral-300 bg-neutral-50 hover:bg-neutral-100 transition-colors whitespace-nowrap"
                  >
                    {viewingStoreFilteredOrders.length > 0 &&
                    viewingStoreFilteredOrders.every((o) => expandedOrderIds[o.id])
                      ? "Collapse All"
                      : "Expand All"}
                  </button>
                </div>
              </div>

              {viewingStoreFilteredOrders.length === 0 ? (
                <div className="p-12 text-center bg-white border border-neutral-200 rounded-xl text-neutral-500">
                  <ShoppingBag className="w-10 h-10 mx-auto text-neutral-300 mb-2" />
                  <p className="text-sm font-bold text-neutral-800">No orders found for this store</p>
                  <p className="text-xs text-neutral-500 mt-1">
                    Customer orders placed on {getStoreDomain(viewingStore.subdomain)} will appear chronologically here.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {viewingStoreFilteredOrders.map((o) => {
                    const isExpanded = Boolean(expandedOrderIds[o.id]);
                    return (
                      <div
                        key={o.id}
                        className={`bg-white border rounded-xl overflow-hidden shadow-2xs transition-all ${
                          isExpanded
                            ? "border-neutral-400 ring-1 ring-neutral-400/20"
                            : "border-neutral-200/90 hover:border-neutral-300"
                        }`}
                      >
                        {/* Compact Single-Line Card / Trigger */}
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() => toggleOrderExpanded(o.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              toggleOrderExpanded(o.id);
                            }
                          }}
                          className="w-full text-left px-4 py-3 flex items-center justify-between gap-3 hover:bg-neutral-50/70 transition-colors cursor-pointer select-none"
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <div
                              className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-transform ${
                                isExpanded
                                  ? "bg-neutral-900 text-white rotate-90"
                                  : "bg-neutral-100 text-neutral-600"
                              }`}
                            >
                              <ChevronRight className="w-3 h-3" />
                            </div>

                            <span className="font-mono font-bold text-xs text-neutral-900 shrink-0">
                              {o.number || o.id}
                            </span>

                            <span className="text-neutral-300 hidden sm:inline">•</span>

                            <span className="text-[11px] text-neutral-500 hidden sm:inline whitespace-nowrap shrink-0">
                              {new Date(o.createdAt).toLocaleDateString()}
                            </span>

                            <span className="text-neutral-300 hidden md:inline">•</span>

                            <span className="font-semibold text-xs text-neutral-900 truncate max-w-[140px] sm:max-w-[180px]">
                              {o.customer.name}
                            </span>

                            <span className="text-neutral-300 hidden lg:inline">•</span>

                            <span className="text-[11px] text-neutral-500 truncate hidden lg:inline flex-1">
                              {o.items.map((i) => `${i.quantity}x ${i.title}`).join(", ")}
                            </span>
                          </div>

                          {/* Right side: Status, Method, and Total */}
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge
                              variant="neutral"
                              className={`text-[10px] uppercase font-bold shrink-0 ${
                                o.fulfilmentStatus === "delivered"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : o.fulfilmentStatus === "shipped"
                                  ? "bg-blue-50 text-blue-700 border-blue-200"
                                  : o.fulfilmentStatus === "cancelled"
                                  ? "bg-red-50 text-red-700 border-red-200"
                                  : "bg-amber-50 text-amber-700 border-amber-200"
                              }`}
                            >
                              {o.fulfilmentStatus}
                            </Badge>

                            <Badge
                              variant="neutral"
                              className="text-[10px] uppercase font-bold bg-neutral-100 shrink-0 hidden sm:inline-flex"
                            >
                              {o.paymentMethod.toUpperCase()}
                            </Badge>

                            <span className="font-black text-xs sm:text-sm text-neutral-900 font-mono shrink-0 ml-1">
                              {formatINR(o.total)}
                            </span>
                          </div>
                        </div>

                        {/* Expanded Drawer Details (only visible when expanded) */}
                        {isExpanded && (
                          <div className="p-4 bg-neutral-50/80 border-t border-neutral-100 text-xs space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Customer Info */}
                              <div className="p-3.5 rounded-lg bg-white border border-neutral-200 space-y-2">
                                <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
                                  <span className="font-bold text-neutral-800 text-xs">Customer Information</span>
                                  <span className="text-[10px] text-neutral-400 font-mono">
                                    Placed: {new Date(o.createdAt).toLocaleString()}
                                  </span>
                                </div>
                                <p className="font-bold text-neutral-900 text-sm">{o.customer.name}</p>
                                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                                  <a
                                    href={`https://wa.me/${o.customer.phone.replace(/[^0-9]/g, "")}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded hover:bg-emerald-100 transition-colors"
                                  >
                                    <Phone className="w-3 h-3" />
                                    <span>{o.customer.phone}</span>
                                  </a>
                                  {o.customer.email && (
                                    <a
                                      href={`mailto:${o.customer.email}`}
                                      className="inline-flex items-center gap-1 text-[11px] text-neutral-600 bg-neutral-100 border border-neutral-200 px-2.5 py-1 rounded hover:bg-neutral-200 transition-colors"
                                    >
                                      <Mail className="w-3 h-3" />
                                      <span>{o.customer.email}</span>
                                    </a>
                                  )}
                                </div>
                                <div className="text-neutral-600 flex items-start gap-1.5 pt-1 text-[11px]">
                                  <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5" />
                                  <span>
                                    {o.address?.street}, {o.address?.city}, {o.address?.pincode}
                                  </span>
                                </div>
                              </div>

                              {/* Items Purchased Breakdown */}
                              <div className="p-3.5 rounded-lg bg-white border border-neutral-200 space-y-2">
                                <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
                                  <span className="font-bold text-neutral-800 text-xs">
                                    Ordered Items ({o.items.length})
                                  </span>
                                  <span className="text-[10px] font-mono text-neutral-500 uppercase">
                                    Paid via {o.paymentMethod}
                                  </span>
                                </div>

                                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                                  {o.items.map((item, idx) => (
                                    <div
                                      key={idx}
                                      className="flex items-center justify-between text-xs py-1 border-b border-neutral-100 last:border-0"
                                    >
                                      <span className="text-neutral-800">
                                        <strong className="text-neutral-900">{item.quantity}x</strong> {item.title}
                                      </span>
                                      <span className="font-mono font-medium text-neutral-900">
                                        {formatINR(item.price * item.quantity)}
                                      </span>
                                    </div>
                                  ))}
                                </div>

                                {o.trackingNumber && (
                                  <div className="pt-2 border-t border-neutral-100 text-[11px] text-neutral-600 flex items-center justify-between">
                                    <span className="flex items-center gap-1">
                                      <Truck className="w-3 h-3 text-blue-500" />
                                      <span>{o.courierName || "Courier Dispatch"}:</span>
                                    </span>
                                    <strong className="font-mono text-neutral-800">{o.trackingNumber}</strong>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: STORE PRODUCT CATALOG */}
          {sellerProfileTab === "products" && (
            <div className="space-y-4">
              <div className="p-4 bg-white border border-neutral-200 rounded-xl flex items-center justify-between gap-3 shadow-xs">
                <div className="relative w-full sm:w-80">
                  <Input
                    placeholder="Search store products by title or category..."
                    value={productSearchQuery}
                    onChange={(e) => setProductSearchQuery(e.target.value)}
                    className="text-xs bg-neutral-50 border-neutral-300 pl-8 py-2"
                  />
                  <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-3" />
                </div>
                <span className="text-xs text-neutral-500 font-medium">
                  {viewingStoreFilteredProducts.length} Items Listed
                </span>
              </div>

              {viewingStoreFilteredProducts.length === 0 ? (
                <div className="p-12 text-center bg-white border border-neutral-200 rounded-xl text-neutral-500">
                  <Package className="w-10 h-10 mx-auto text-neutral-300 mb-2" />
                  <p className="text-sm font-bold text-neutral-800">No products in catalog</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {viewingStoreFilteredProducts.map((p) => (
                    <div
                      key={p.id}
                      className="bg-white border border-neutral-200 rounded-xl p-4 shadow-xs flex gap-3 text-xs"
                    >
                      <div className="w-16 h-16 rounded-lg bg-neutral-100 overflow-hidden shrink-0 border border-neutral-200 flex items-center justify-center">
                        {p.images && p.images.length > 0 ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={p.images[0]}
                            alt={p.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package className="w-6 h-6 text-neutral-400" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1 space-y-1">
                        <span className="font-bold text-neutral-900 block truncate">{p.title}</span>
                        <span className="text-[10px] text-neutral-500 uppercase font-semibold block">
                          {p.category}
                        </span>
                        <div className="flex items-center gap-2 pt-0.5">
                          <span className="font-bold text-neutral-900 font-mono">
                            {formatINR(p.price)}
                          </span>
                          {p.compareAtPrice && p.compareAtPrice > p.price && (
                            <span className="text-[11px] text-neutral-400 line-through font-mono">
                              {formatINR(p.compareAtPrice)}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-neutral-500 block">
                          Stock: <strong className="text-neutral-800">{p.stock}</strong> units
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CUSTOMERS & SUBSCRIBERS */}
          {sellerProfileTab === "customers" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Customer Contacts */}
              <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-neutral-900 flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span>Customers</span>
                  </h3>
                  <span className="text-xs text-neutral-500">{storeCustomers.length} Buyers</span>
                </div>

                {storeCustomers.length === 0 ? (
                  <p className="text-xs text-neutral-500 py-6 text-center">No customer buyers recorded yet.</p>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                    {storeCustomers.map((c) => (
                      <div
                        key={c.id}
                        className="p-3 rounded-lg bg-neutral-50 border border-neutral-200 text-xs flex items-center justify-between"
                      >
                        <div>
                          <p className="font-bold text-neutral-900">{c.name}</p>
                          <p className="text-[11px] text-neutral-500">{c.phone || c.email}</p>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-neutral-900 block">{c.totalOrders} Orders</span>
                          <span className="text-[10px] text-neutral-500 font-mono">
                            Total spent: {formatINR(c.totalSpent)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Newsletter / Drop Subscribers */}
              <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-neutral-900 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-emerald-600" />
                    <span>Newsletter subscribers</span>
                  </h3>
                  <span className="text-xs text-neutral-500">{storeSubscribers.length} Subscribers</span>
                </div>

                {storeSubscribers.length === 0 ? (
                  <p className="text-xs text-neutral-500 py-6 text-center">No email subscribers joined yet.</p>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                    {storeSubscribers.map((sub) => (
                      <div
                        key={sub.id}
                        className="p-3 rounded-lg bg-neutral-50 border border-neutral-200 text-xs flex items-center justify-between"
                      >
                        <span className="font-semibold text-neutral-900">{sub.email}</span>
                        <span className="text-[10px] text-neutral-400">
                          {new Date(sub.subscribedAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: STORE SETTINGS & BRAND SETUP */}
          {sellerProfileTab === "settings" && (
            <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-xs space-y-6">
              <h3 className="font-bold text-sm text-neutral-900">Store settings</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-lg bg-neutral-50 border border-neutral-200 space-y-2">
                  <span className="font-bold text-neutral-800 block text-xs">Payment & Checkout Settings</span>
                  <p className="text-neutral-600">
                    UPI ID / VPA: <strong className="text-neutral-900 font-mono">{viewingStore.upiId || "Not configured"}</strong>
                  </p>
                  <p className="text-neutral-600">
                    Cash on Delivery:{" "}
                    <strong className="text-neutral-900">
                      {viewingStore.codEnabled ? "Enabled" : "Disabled"} (Fee: ₹{Math.round((viewingStore.codFee || 0) / 100)})
                    </strong>
                  </p>
                  <p className="text-neutral-600">
                    Instagram Handle: <strong className="text-neutral-900">{viewingStore.instagramHandle || "None"}</strong>
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-neutral-50 border border-neutral-200 space-y-2">
                  <span className="font-bold text-neutral-800 block text-xs">Theme & Brand Styling</span>
                  <p className="text-neutral-600">
                    Active Theme: <strong className="text-neutral-900">{getTheme(viewingStore.activeThemeSlug).name}</strong>
                  </p>
                  <p className="text-neutral-600">
                    Typography Font: <strong className="text-neutral-900 capitalize">{viewingStore.fontFamily || "Inter"}</strong>
                  </p>
                  {viewingStore.customBrandTheme && (
                    <div className="flex items-center gap-2 pt-1">
                      <span>Brand Colors:</span>
                      <div
                        className="w-4 h-4 rounded-full border border-neutral-300"
                        style={{ backgroundColor: viewingStore.customBrandTheme.primary }}
                        title="Primary"
                      />
                      <div
                        className="w-4 h-4 rounded-full border border-neutral-300"
                        style={{ backgroundColor: viewingStore.customBrandTheme.background }}
                        title="Background"
                      />
                    </div>
                  )}
                </div>
              </div>

              {viewingStore.banners && viewingStore.banners.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-neutral-100">
                  <span className="font-bold text-xs text-neutral-800 block">
                    Active Hero Banners ({viewingStore.banners.length})
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {viewingStore.banners.map((b) => (
                      <div
                        key={b.id}
                        className="p-3 rounded-lg bg-neutral-50 border border-neutral-200 flex items-center gap-3 text-xs"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={b.imageUrl}
                          alt={b.title}
                          className="w-14 h-10 object-cover rounded border"
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-neutral-900 truncate">{b.title}</p>
                          <p className="text-[10px] text-neutral-500 font-mono truncate">{b.ctaLink}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    );
  }

  // MAIN PARENT DASHBOARD VIEW
  const pendingPaymentCount =
    stores.filter((s) => s.pendingSubscription).length +
    stores.reduce((n, s) => n + (s.themePurchases || []).filter((p) => p.status === "pending_verification").length, 0);
  const adminNav: {
    id: "overview" | "users" | "subscriptions" | "broadcasts" | "banners" | "themes" | "health";
    label: string;
    /** shorter name for the phone grid */
    short?: string;
    icon: React.ElementType;
    badge?: number;
    alert?: boolean;
  }[] = [
    { id: "overview", label: "Overview", icon: TrendingUp },
    { id: "users", label: "Merchants", icon: Store, badge: stats.totalStores },
    { id: "subscriptions", label: "Plans & payments", short: "Plans", icon: CreditCard, badge: pendingPaymentCount || undefined, alert: pendingPaymentCount > 0 },
    { id: "broadcasts", label: "Announcements", short: "Announce", icon: Send },
    { id: "banners", label: "App banners", icon: ImageIcon },
    { id: "themes", label: "Themes", icon: Layers, badge: Object.keys(PLATFORM_THEMES).length + storeService.getPlatformThemes().length },
    { id: "health", label: "System status", short: "Status", icon: Activity },
  ];

  return (
    <div className="dash home-sans admin min-h-screen bg-[#FAFAFA] text-neutral-950">
      {/* Top bar */}
      <header className="fixed top-0 inset-x-0 z-40 h-16 border-b border-neutral-200 bg-white/90 backdrop-blur-md">
        <div className="flex h-full items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <ShopperLogo className="text-[19px] text-neutral-950" />
            <span className="rounded-full bg-neutral-950 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">Admin</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Live
            </span>
            <Link
              href="/"
              target="_blank"
              className="hidden sm:inline-flex h-10 items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3.5 text-sm font-semibold text-neutral-800 hover:border-neutral-900"
            >
              View site
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
            <button
              type="button"
              onClick={handleLockDashboard}
              aria-label="Lock admin"
              title="Lock admin"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-700 hover:border-neutral-900 hover:text-black"
            >
              <Lock className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Sidebar (desktop) */}
      <aside className="hidden lg:flex fixed top-16 bottom-0 left-0 z-30 w-64 flex-col border-r border-neutral-200 bg-white px-3 py-5">
        <nav className="space-y-1">
          {adminNav.map((item) => {
            const Icon = item.icon;
            const on = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  on ? "bg-neutral-950 text-white" : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950"
                }`}
              >
                <Icon className="h-[18px] w-[18px] shrink-0" />
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge ? (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums ${
                      item.alert ? "bg-amber-400 text-neutral-950" : on ? "bg-white/15 text-white" : "bg-neutral-100 text-neutral-600"
                    }`}
                  >
                    {item.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>
        <div className="mt-auto rounded-2xl bg-neutral-50 p-4 text-xs text-neutral-500">
          <span className="block font-semibold text-neutral-900">{stats.totalStores} stores</span>
          {stats.proStores + stats.starterStores} on paid plans · ₹{stats.mrr.toLocaleString("en-IN")}/mo
        </div>
      </aside>

      <div className="pt-16 lg:pl-64">
        {/* Section tabs (phones and tablets): a grid, three per row */}
        <div className="lg:hidden border-b border-neutral-200 bg-[#FAFAFA]">
          <div className="grid grid-cols-3 gap-2 px-4 py-3 sm:grid-cols-4">
            {adminNav.map((item) => {
              const on = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  style={{ minHeight: 0 }}
                  className={`inline-flex h-10 min-w-0 items-center justify-center gap-1.5 rounded-full px-2 text-[13px] font-medium transition-colors ${
                    on ? "bg-neutral-950 text-white" : "border border-neutral-200 bg-white text-neutral-700"
                  }`}
                >
                  <span className="truncate">{item.short || item.label}</span>
                  {item.badge && item.alert ? (
                    <span className="rounded-full bg-amber-400 px-1.5 text-[11px] font-semibold text-neutral-950">{item.badge}</span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

      <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-8 sm:py-8">
        {/* 1. OVERVIEW (CLEAN LIGHT THEME - EXECUTIVE PLATFORM OPERATIONS & ANALYTICS) */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Executive Operations Header & Quick Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-neutral-950">Overview</h2>
                <p className="mt-1 text-sm text-neutral-500">How the platform is doing today.</p>
              </div>

              {/* Quick Admin Action Toolbar */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setActiveTab("broadcasts")}
                  className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-neutral-950 px-4 text-sm font-semibold text-white hover:bg-black whitespace-nowrap"
                >
                  <Send className="w-4 h-4" />
                  <span>Announce</span>
                </button>
                <button
                  onClick={handleExportCSV}
                  className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-4 text-sm font-semibold text-neutral-800 hover:border-neutral-900 whitespace-nowrap"
                >
                  <Download className="w-4 h-4" />
                  <span>Export CSV</span>
                </button>
                <button
                  onClick={refreshData}
                  title="Refresh"
                  aria-label="Refresh"
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-700 hover:border-neutral-900"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {pendingPaymentCount > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab("subscriptions")}
                className="flex w-full items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-left hover:border-amber-300"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-400 text-neutral-950">
                  <Clock className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-neutral-950">
                    {pendingPaymentCount} payment{pendingPaymentCount === 1 ? "" : "s"} waiting for approval
                  </span>
                  <span className="block text-xs text-neutral-600">Check the UTR, then approve to unlock the plan.</span>
                </span>
                <ArrowRight className="h-4 w-4 text-neutral-700" />
              </button>
            )}

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="col-span-2 lg:col-span-1 relative overflow-hidden rounded-2xl bg-neutral-950 p-5 text-white">
                <span className="text-xs text-neutral-400">Monthly revenue</span>
                <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">₹{stats.mrr.toLocaleString("en-IN")}</p>
                <p className="mt-3 text-xs text-neutral-400">
                  {stats.proStores + stats.starterStores} paid stores · ₹{(stats.mrr * 12).toLocaleString("en-IN")} a year
                </p>
              </div>
              {[
                { label: "Stores", value: stats.totalStores, note: `${stats.activeStores} live · ${stats.suspendedStores} paused`, icon: Store },
                { label: "Products", value: stats.totalProducts, note: `~${stats.totalStores ? (stats.totalProducts / stats.totalStores).toFixed(1) : 0} per store`, icon: Package },
                { label: "Buyers", value: stats.totalCustomers + stats.totalSubscribers, note: `${stats.totalCustomers} customers · ${stats.totalSubscribers} subscribers`, icon: Users },
              ].map((t, i) => (
                <div key={t.label} className={`rounded-2xl border border-neutral-200 bg-white p-5 ${i === 2 ? "col-span-2 lg:col-span-1" : ""}`}>
                  <div className="flex items-center justify-between text-neutral-500">
                    <span className="text-xs">{t.label}</span>
                    <t.icon className="h-4 w-4" />
                  </div>
                  <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums text-neutral-950">{t.value}</p>
                  <p className="mt-3 truncate text-xs text-neutral-500">{t.note}</p>
                </div>
              ))}
            </div>

            {/* 2x2 Balanced Executive Analytics Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Card 1: Subscription Tier Distribution & MRR Contribution */}
              <div className="p-6 rounded-2xl bg-white border border-neutral-200/80 shadow-xs space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-neutral-900">Plans</h3>
                    <p className="text-[11px] text-neutral-500 mt-0.5">How stores are spread across plans</p>
                  </div>
                  <Badge variant="neutral" className="text-[10px] bg-emerald-50 text-emerald-800 border-emerald-200 font-bold">
                    {stats.totalStores ? Math.round(((stats.starterStores + stats.proStores) / stats.totalStores) * 100) : 0}% Paid
                  </Badge>
                </div>

                {/* Stacked Plan Progress Bar */}
                <div className="space-y-1.5">
                  <div className="w-full h-3 rounded-full bg-neutral-100 overflow-hidden flex">
                    <div
                      title={`Free: ${stats.freeStores} stores`}
                      className="h-full bg-neutral-400 transition-all"
                      style={{
                        width: `${stats.totalStores ? (stats.freeStores / stats.totalStores) * 100 : 0}%`,
                      }}
                    />
                    <div
                      title={`Starter: ${stats.starterStores} stores`}
                      className="h-full bg-amber-500 transition-all"
                      style={{
                        width: `${stats.totalStores ? (stats.starterStores / stats.totalStores) * 100 : 0}%`,
                      }}
                    />
                    <div
                      title={`Pro: ${stats.proStores} stores`}
                      className="h-full bg-emerald-500 transition-all"
                      style={{
                        width: `${stats.totalStores ? (stats.proStores / stats.totalStores) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-neutral-500 font-mono">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-neutral-400 inline-block" /> Free ({stats.freeStores})
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> Starter ({stats.starterStores})
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Pro ({stats.proStores})
                    </span>
                  </div>
                </div>

                {/* Plan Breakdown Items */}
                <div className="space-y-2 text-xs">
                  <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200/70 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-neutral-900">Free ({PLATFORM_PLANS.free.maxProducts} products)</p>
                      <p className="text-[11px] text-neutral-500 mt-0.5">2 themes, COD, direct UPI</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-neutral-800">{stats.freeStores} stores</p>
                      <p className="text-[10px] text-neutral-400 font-mono">
                        {stats.totalStores ? Math.round((stats.freeStores / stats.totalStores) * 100) : 0}% share
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/70 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-neutral-900">Growth ({PLATFORM_PLANS.starter.priceFormatted.split(" ")[0]} / mo)</p>
                      <p className="text-[11px] text-neutral-500 mt-0.5">Up to {PLATFORM_PLANS.starter.maxProducts} products, coupons, reviews</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-amber-800">{stats.starterStores} stores</p>
                      <p className="text-[10px] text-amber-700 font-mono">
                        ₹{(stats.starterStores * (PLATFORM_PLANS.starter.priceMonthly / 100)).toLocaleString("en-IN")}/mo MRR
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200/70 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-neutral-900">Pro ({PLATFORM_PLANS.pro.priceFormatted.split(" ")[0]} / mo)</p>
                      <p className="text-[11px] text-neutral-500 mt-0.5">Unlimited products, own domain, email</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-emerald-800">{stats.proStores} stores</p>
                      <p className="text-[10px] text-emerald-700 font-mono">
                        ₹{(stats.proStores * (PLATFORM_PLANS.pro.priceMonthly / 100)).toLocaleString("en-IN")}/mo MRR
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between text-xs">
                  <span className="text-neutral-500">Need to modify platform plans or pricing?</span>
                  <button
                    onClick={() => setActiveTab("subscriptions")}
                    className="font-bold text-neutral-900 hover:underline flex items-center gap-1"
                  >
                    <span>Manage Plans</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Card 2: Merchant Industry & Sector Footprint */}
              <div className="p-6 rounded-2xl bg-white border border-neutral-200/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-neutral-700" />
                    <div>
                      <h3 className="text-sm font-bold text-neutral-900">What stores sell</h3>
                      <p className="text-[11px] text-neutral-500 mt-0.5">Stores by category</p>
                    </div>
                  </div>
                  <span className="text-[11px] text-neutral-600 bg-neutral-100 font-mono px-2 py-0.5 rounded font-bold">
                    {categoryStats.length} Sectors
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  {categoryStats.length === 0 ? (
                    <p className="text-neutral-500 py-6 text-center">No categories indexed yet.</p>
                  ) : (
                    categoryStats.map(([category, count]) => {
                      const pct = stats.totalStores ? Math.round((count / stats.totalStores) * 100) : 0;
                      return (
                        <div key={category} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-neutral-800 capitalize">{category}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-neutral-500 font-mono">
                                {count} {count === 1 ? "store" : "stores"}
                              </span>
                              <span className="text-[10px] font-mono text-neutral-800 bg-neutral-100 px-1.5 py-0.5 rounded font-bold">
                                {pct}%
                              </span>
                            </div>
                          </div>
                          <div className="w-full h-2 rounded-full bg-neutral-100 overflow-hidden">
                            <div
                              className="h-full bg-neutral-800 rounded-full transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-500">
                  <span>Fastest Growing Sector:</span>
                  <span className="font-bold text-neutral-900 capitalize">
                    {categoryStats[0]?.[0] || "General"} ({categoryStats[0]?.[1] || 0} stores)
                  </span>
                </div>
              </div>

              {/* Card 3: Platform Feature Adoption & Tenant Readiness */}
              <div className="p-6 rounded-2xl bg-white border border-neutral-200/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-600" />
                    <div>
                      <h3 className="text-sm font-bold text-neutral-900">Feature use</h3>
                      <p className="text-[11px] text-neutral-500 mt-0.5">How many stores have set up each feature</p>
                    </div>
                  </div>
                  <Badge variant="neutral" className="text-[10px] bg-neutral-100 text-neutral-700">
                    Live Readiness
                  </Badge>
                </div>

                <div className="space-y-3.5 text-xs">
                  {/* Direct UPI */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <QrCode className="w-3.5 h-3.5 text-amber-600" />
                        <span className="font-semibold text-neutral-800">Direct UPI QR Payments</span>
                      </div>
                      <span className="font-mono text-neutral-600">
                        {featureAdoption.upi.count}/{stats.totalStores} ({featureAdoption.upi.pct}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-neutral-100 overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full transition-all"
                        style={{ width: `${featureAdoption.upi.pct}%` }}
                      />
                    </div>
                  </div>

                  {/* Cash on Delivery */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5 text-blue-600" />
                        <span className="font-semibold text-neutral-800">Cash on Delivery (COD) Enabled</span>
                      </div>
                      <span className="font-mono text-neutral-600">
                        {featureAdoption.cod.count}/{stats.totalStores} ({featureAdoption.cod.pct}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-neutral-100 overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all"
                        style={{ width: `${featureAdoption.cod.pct}%` }}
                      />
                    </div>
                  </div>

                  {/* Custom Theme */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                        <span className="font-semibold text-neutral-800">Designer Brand Theme Applied</span>
                      </div>
                      <span className="font-mono text-neutral-600">
                        {featureAdoption.customTheme.count}/{stats.totalStores} ({featureAdoption.customTheme.pct}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-neutral-100 overflow-hidden">
                      <div
                        className="h-full bg-purple-500 rounded-full transition-all"
                        style={{ width: `${featureAdoption.customTheme.pct}%` }}
                      />
                    </div>
                  </div>

                  {/* Gmail Subscribers */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="font-semibold text-neutral-800">Buyer Newsletter & Drops Active</span>
                      </div>
                      <span className="font-mono text-neutral-600">
                        {featureAdoption.subscribers.count}/{stats.totalStores} ({featureAdoption.subscribers.pct}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-neutral-100 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{ width: `${featureAdoption.subscribers.pct}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-500">
                  <span>Merchant Onboarding Status:</span>
                  <span className="font-bold text-emerald-700">100% Core Ready</span>
                </div>
              </div>

              {/* Card 4: Registered Merchant Boutiques Fast Drill-Down */}
              <div className="p-6 rounded-2xl bg-white border border-neutral-200/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-neutral-900">Recent stores</h3>
                    <p className="text-[11px] text-neutral-500 mt-0.5">Open a store's profile</p>
                  </div>
                  <button
                    onClick={() => setActiveTab("users")}
                    className="text-xs text-neutral-900 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <span>View all {stats.totalStores} merchants</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
                  {stores.slice(0, 5).map((s) => (
                    <div
                      key={s.subdomain}
                      className="p-3 rounded-xl bg-neutral-50 border border-neutral-200/70 flex items-center justify-between gap-3 text-xs hover:border-neutral-300 transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-neutral-900 truncate">{s.name}</span>
                          <span className="text-[10px] text-neutral-500 font-mono truncate">
                            {getStoreDomain(s.subdomain)}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-500 truncate mt-0.5">
                          Owner: {s.ownerName} • <span className="capitalize">{s.category}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Badge
                          variant="neutral"
                          className={`text-[10px] uppercase font-bold shrink-0 ${
                            s.planId === "pro"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : s.planId === "starter"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-neutral-100 text-neutral-700"
                          }`}
                        >
                          {s.planId}
                        </Badge>

                        <button
                          onClick={() => {
                            setViewingSellerSubdomain(s.subdomain);
                            setSellerProfileTab("orders");
                          }}
                          className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-neutral-900 text-white hover:bg-black transition-colors shadow-2xs whitespace-nowrap"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View Profile</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-500">
                  <span>Need deep merchant history?</span>
                  <span className="font-semibold text-neutral-800">
                    Click "View Profile" for full ledger & orders
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. MERCHANTS DIRECTORY (CLEAN LIGHT THEME WITH DIRECT PROFILE BUTTON) */}
        {activeTab === "users" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-neutral-950">Merchants</h2>
                <p className="mt-1 text-sm text-neutral-500">Every store on the platform. Open one to see its orders, products and settings.</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyAllEmails}
                  className="h-8 text-xs bg-white border-neutral-300 text-neutral-700 hover:text-neutral-900 shadow-2xs"
                  title="Copy all merchant emails to clipboard"
                >
                  {copiedAllEmailsToast ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-neutral-500" />
                  )}
                  <span>{copiedAllEmailsToast ? "Copied All" : "Copy Emails"}</span>
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleExportCSV}
                  className="h-8 text-xs bg-white border-neutral-300 text-neutral-700 hover:text-neutral-900 shadow-2xs"
                  title="Export merchant database to CSV"
                >
                  <Download className="w-3.5 h-3.5 text-neutral-600" />
                  <span>Export CSV</span>
                </Button>

                <Link href="/register">
                  <Button size="sm" className="h-8 bg-neutral-900 hover:bg-black text-white font-bold text-xs gap-1.5 shadow-xs">
                    <Store className="w-3.5 h-3.5" />
                    <span>Provision Store</span>
                  </Button>
                </Link>
              </div>
            </div>

            {/* Search & Filter Toolbar */}
            <div className="p-4 rounded-xl bg-white border border-neutral-200 flex flex-col md:flex-row items-center justify-between gap-3 shadow-xs">
              <div className="relative w-full md:w-80">
                <Input
                  placeholder="Search store, owner, email, subdomain..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-neutral-50 border-neutral-300 text-neutral-900 placeholder:text-neutral-400 text-xs pl-8 py-2"
                />
                <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-3" />
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <select
                  value={planFilter}
                  onChange={(e) => setPlanFilter(e.target.value as any)}
                  className="bg-neutral-50 border border-neutral-300 text-neutral-800 text-xs rounded-md px-3 py-2 cursor-pointer"
                >
                  <option value="all">All Plans</option>
                  <option value="free">Free Tier</option>
                  <option value="starter">Starter Plan</option>
                  <option value="pro">Pro Plan</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="bg-neutral-50 border border-neutral-300 text-neutral-800 text-xs rounded-md px-3 py-2 cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="published">Published / Active</option>
                  <option value="suspended">Suspended / Paused</option>
                </select>
              </div>
            </div>

            {/* Phones: one card per store */}
            <div className="md:hidden space-y-3">
              {filteredStores.length === 0 && (
                <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-8 text-center text-sm text-neutral-500">
                  No stores match these filters.
                </div>
              )}
              {filteredStores.map((s) => {
                const live = s.status === "published" && !s.isPaused;
                const openProfile = () => {
                  setViewingSellerSubdomain(s.subdomain);
                  setSellerProfileTab("orders");
                };
                return (
                  <div key={s.subdomain} className="rounded-2xl border border-neutral-200 bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <button type="button" onClick={openProfile} className="min-w-0 text-left" style={{ minHeight: 0 }}>
                        <span className="block truncate text-sm font-semibold text-neutral-950">{s.name}</span>
                        <span className="block truncate text-xs text-neutral-500">{getStoreDomain(s.subdomain)}</span>
                      </button>
                      <span
                        className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                          live ? "bg-emerald-50 text-emerald-700" : "bg-neutral-100 text-neutral-600"
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${live ? "bg-emerald-500" : "bg-neutral-400"}`} />
                        {live ? "Live" : "Paused"}
                      </span>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                      <div className="min-w-0">
                        <span className="block text-neutral-500">Owner</span>
                        <span className="block truncate font-medium text-neutral-900">{s.ownerName || "—"}</span>
                      </div>
                      <div>
                        <span className="block text-neutral-500">Plan</span>
                        <span className="block font-medium text-neutral-900">{PLATFORM_PLANS[s.planId]?.name || s.planId}</span>
                      </div>
                      <div>
                        <span className="block text-neutral-500">Products</span>
                        <span className="block font-medium tabular-nums text-neutral-900">{s.products?.length || 0}</span>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2 border-t border-neutral-100 pt-3">
                      <button
                        type="button"
                        onClick={openProfile}
                        style={{ minHeight: 0 }}
                        className="h-9 flex-1 rounded-xl bg-neutral-950 text-xs font-semibold text-white hover:bg-black"
                      >
                        View profile
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedStore(s);
                          setTargetPlan(s.planId);
                          setIsPlanModalOpen(true);
                        }}
                        style={{ minHeight: 0 }}
                        className="h-9 rounded-xl border border-neutral-200 px-3 text-xs font-semibold text-neutral-800 hover:border-neutral-900"
                      >
                        Plan
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedStore(s);
                          setIsStatusModalOpen(true);
                        }}
                        style={{ minHeight: 0 }}
                        className="h-9 rounded-xl border border-neutral-200 px-3 text-xs font-semibold text-neutral-800 hover:border-neutral-900"
                      >
                        {live ? "Pause" : "Activate"}
                      </button>
                      <button
                        type="button"
                        aria-label={`Delete ${s.name}`}
                        onClick={() => {
                          setSelectedStore(s);
                          setIsDeleteModalOpen(true);
                        }}
                        style={{ minHeight: 0 }}
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-200 text-neutral-400 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Tablets and desktop: table */}
            <div className="hidden md:block rounded-2xl bg-white border border-neutral-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-50 text-neutral-500 border-b border-neutral-200 font-semibold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Store</th>
                      <th className="py-3 px-4">Owner</th>
                      <th className="py-3 px-4">Plan</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Products</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {filteredStores.map((s) => (
                      <tr key={s.subdomain} className="hover:bg-neutral-50/70 transition-colors">
                        {/* Store & Subdomain */}
                        <td className="py-3 px-4">
                          <button
                            onClick={() => {
                              setViewingSellerSubdomain(s.subdomain);
                              setSellerProfileTab("orders");
                            }}
                            className="font-bold text-neutral-900 text-sm hover:underline text-left block"
                          >
                            {s.name}
                          </button>
                          <a
                            href={getStoreUrl(s.subdomain)}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] font-mono text-neutral-500 hover:text-neutral-900 hover:underline inline-flex items-center gap-1"
                          >
                            <span>{getStoreDomain(s.subdomain)}</span>
                            <ExternalLink className="w-2.5 h-2.5 text-neutral-400" />
                          </a>
                        </td>

                        {/* Owner Info */}
                        <td className="py-3 px-4">
                          <div className="font-semibold text-neutral-800">{s.ownerName}</div>
                          <div className="text-[11px] text-neutral-500 font-mono">
                            {s.contactEmail || s.ownerEmail || "No email"}
                          </div>
                          <div className="text-[11px] text-neutral-500">{s.contactPhone}</div>
                        </td>

                        {/* Plan */}
                        <td className="py-3 px-4">
                          <button
                            onClick={() => {
                              setSelectedStore(s);
                              setTargetPlan(s.planId);
                              setIsPlanModalOpen(true);
                            }}
                            title="Click to override plan"
                            className="cursor-pointer"
                          >
                            <Badge
                              variant="neutral"
                              className={`text-[10px] uppercase font-bold cursor-pointer ${
                                s.planId === "pro"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                  : s.planId === "starter"
                                  ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                                  : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                              }`}
                            >
                              {s.planId} ✎
                            </Badge>
                          </button>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4">
                          <button
                            onClick={() => {
                              setSelectedStore(s);
                              setIsStatusModalOpen(true);
                            }}
                            title="Click to change status"
                          >
                            {s.status === "published" && !s.isPaused ? (
                              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium cursor-pointer">
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Published</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] text-red-700 font-medium cursor-pointer">
                                <XCircle className="w-3.5 h-3.5 text-red-600" />
                                <span>Suspended</span>
                              </span>
                            )}
                          </button>
                        </td>

                        {/* Catalog */}
                        <td className="py-3 px-4 text-neutral-700">
                          <div>{s.products?.length || 0} Products</div>
                          <div className="text-[11px] text-neutral-400 capitalize">
                            Sector: {s.category || "General"}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Primary: View Full Seller Profile & History */}
                            <Button
                              size="sm"
                              onClick={() => {
                                setViewingSellerSubdomain(s.subdomain);
                                setSellerProfileTab("orders");
                              }}
                              className="h-7 text-[11px] bg-neutral-900 hover:bg-black text-white shadow-2xs"
                              title="View Full Seller Profile & Store History"
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              <span>View Profile</span>
                            </Button>

                            {/* WhatsApp Direct Contact */}
                            {s.contactPhone && (
                              <a
                                href={`https://wa.me/${s.contactPhone.replace(/[^0-9]/g, "")}`}
                                target="_blank"
                                rel="noreferrer"
                                title={`Contact via WhatsApp (${s.contactPhone})`}
                                className="p-1.5 rounded bg-white border border-neutral-300 text-emerald-700 hover:bg-emerald-50 transition-colors"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                              </a>
                            )}

                            {/* Gmail Direct Contact */}
                            {(s.ownerEmail || s.contactEmail) && (
                              <a
                                href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
                                  s.ownerEmail || s.contactEmail || ""
                                )}&su=${encodeURIComponent("shopersite Platform Notice: " + s.name)}`}
                                target="_blank"
                                rel="noreferrer"
                                title={`Email merchant via Gmail (${s.ownerEmail || s.contactEmail})`}
                                className="p-1.5 rounded bg-white border border-neutral-300 text-blue-700 hover:bg-blue-50 transition-colors"
                              >
                                <Mail className="w-3.5 h-3.5" />
                              </a>
                            )}

                            {/* Delete Button */}
                            <button
                              onClick={() => {
                                setSelectedStore(s);
                                setIsDeleteModalOpen(true);
                              }}
                              title="Delete Tenant"
                              className="p-1.5 rounded bg-white border border-neutral-300 text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 3. SUBSCRIPTIONS & PLANS (LIGHT THEME) */}
        {activeTab === "subscriptions" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-neutral-950">Plans & payments</h2>
              <p className="mt-1 text-sm text-neutral-500">Approve payments, edit each plan, and see which store is on which plan.</p>
            </div>

            {/* Sections */}
            <div className="grid grid-cols-4 gap-1 rounded-2xl bg-neutral-100 p-1 sm:max-w-lg">
              {([
                { id: "payments", label: "Payments", badge: pendingPaymentCount },
                { id: "plans", label: "Plans", badge: 0 },
                { id: "stores", label: "Stores", badge: 0 },
                { id: "settings", label: "Settings", badge: 0 },
              ] as const).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setPlansSection(t.id)}
                  style={{ minHeight: 0 }}
                  className={`inline-flex h-10 min-w-0 items-center justify-center gap-1 rounded-xl px-1 text-[13px] font-semibold transition-all sm:text-sm ${
                    plansSection === t.id ? "bg-white text-neutral-950 shadow-sm" : "text-neutral-500 hover:text-neutral-900"
                  }`}
                >
                  {t.label}
                  {t.badge > 0 && <span className="rounded-full bg-amber-400 px-1.5 text-[11px] font-semibold text-neutral-950">{t.badge}</span>}
                </button>
              ))}
            </div>

            {plansSection === "payments" && (
            <>
            {/* Theme payments: a shop owns the theme once approved here */}
            {(() => {
              const waiting = stores.flatMap((s) => (s.themePurchases || []).filter((p) => p.status === "pending_verification").map((p) => ({ s, p })));
              if (waiting.length === 0) return null;
              return (
                <div className="p-6 rounded-xl bg-white border border-amber-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-600" />
                        <span>Theme payments</span>
                      </h3>
                      <p className="text-xs text-neutral-500 mt-0.5">Check the UTR in your bank or UPI app, then approve to give the shop that theme for good.</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">{waiting.length} waiting</span>
                  </div>
                  <div className="divide-y divide-neutral-100">
                    {waiting.map(({ s, p }) => (
                      <div key={p.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="min-w-0 space-y-0.5 text-xs text-neutral-700">
                          <p className="text-sm font-bold text-neutral-900">
                            {s.name} <span className="font-mono text-[11px] font-normal text-neutral-400">{s.subdomain}</span>
                          </p>
                          <p>
                            Theme {p.themeName} · <span className="font-bold">{p.amountFormatted}</span> once
                          </p>
                          <p className="font-mono text-[11px] text-neutral-500">
                            Ref {p.referenceId} · UTR {p.paymentUtr || "not given"}
                          </p>
                          <p className="text-[11px] text-neutral-400">Submitted {new Date(p.createdAt).toLocaleString("en-IN")}</p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs"
                            onClick={async () => {
                              const reason = await appPrompt("The seller will see this.", { title: "Why is it rejected?", defaultValue: "We couldn't find this payment in our account.", okLabel: "Reject", danger: true });
                              if (reason === null) return;
                              storeService.rejectThemePurchase(s.subdomain, p.id, reason);
                              refreshData();
                            }}
                          >
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            className="text-xs bg-emerald-600 text-white hover:bg-emerald-700"
                            onClick={async () => {
                              if (!(await appConfirm(`${p.amountFormatted} from ${s.name} for ${p.themeName}.`, { title: "Approve this payment?", okLabel: "Approve" }))) return;
                              storeService.verifyThemePurchase(s.subdomain, p.id);
                              refreshData();
                            }}
                          >
                            Approve
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
            {/* Payment approvals: a seller's paid plan switches on only when approved here */}
            {(() => {
              const pending = stores.filter((s) => s.pendingSubscription).map((s) => ({ s, req: s.pendingSubscription! }));
              return (
                <div className="p-6 rounded-xl bg-white border border-amber-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-600" />
                        <span>Payment approvals</span>
                      </h3>
                      <p className="text-xs text-neutral-500 mt-0.5">Check the UTR in your bank or UPI app, then approve to unlock the plan.</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">{pending.length} waiting</span>
                  </div>
                  {pending.length === 0 ? (
                    <p className="text-xs text-neutral-500">No payments waiting for approval.</p>
                  ) : (
                    <div className="divide-y divide-neutral-100">
                      {pending.map(({ s, req }) => (
                        <div key={req.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="min-w-0 space-y-0.5 text-xs text-neutral-700">
                            <p className="text-sm font-bold text-neutral-900">
                              {s.name} <span className="font-mono text-[11px] font-normal text-neutral-400">{s.subdomain}</span>
                            </p>
                            <p>
                              {req.planName} · {req.billingCycle} · <span className="font-bold">{req.amountFormatted}</span>
                            </p>
                            <p className="font-mono text-[11px] text-neutral-500">
                              Ref {req.referenceId} · UTR {req.paymentUtr || "not given"}
                            </p>
                            <p className="text-[11px] text-neutral-400">Submitted {new Date(req.createdAt).toLocaleString("en-IN")}</p>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs"
                              onClick={async () => {
                                const reason = await appPrompt("The seller will see this.", { title: "Why is it rejected?", defaultValue: "We couldn't find this payment in our account.", okLabel: "Reject", danger: true });
                                if (reason === null) return;
                                storeService.rejectSubscriptionPayment(s.subdomain, reason);
                                refreshData();
                              }}
                            >
                              Reject
                            </Button>
                            <Button
                              size="sm"
                              className="text-xs bg-emerald-600 text-white hover:bg-emerald-700"
                              onClick={async () => {
                                if (!(await appConfirm(`${req.amountFormatted} from ${s.name}. Their store switches to ${req.planName}.`, { title: "Approve this payment?", okLabel: "Approve" }))) return;
                                storeService.verifySubscriptionPayment(s.subdomain, req.id);
                                refreshData();
                              }}
                            >
                              Approve
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            </>
            )}

            {/* Settings: where sellers pay */}
            {plansSection === "settings" && <PlatformPaymentSettings />}

            {/* Each plan with its own editor: name, price, text, features, limits and what it unlocks */}
            {plansSection === "plans" && (
              <PlansManager
                storesByPlan={{
                free: stores.filter((s) => (s.planId || "free") === "free").length,
                starter: stores.filter((s) => s.planId === "starter").length,
                pro: stores.filter((s) => s.planId === "pro").length,
              }}
              />
            )}

            {plansSection === "stores" && (
            <>
            {/* Stores and revenue per plan */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {(["free", "starter", "pro"] as const).map((id) => {
                const plan = PLATFORM_PLANS[id];
                const count = id === "free" ? stats.freeStores : id === "starter" ? stats.starterStores : stats.proStores;
                const revenue = count * (plan.priceMonthly / 100);
                return (
                  <div key={id} className={`rounded-2xl p-5 ${id === "pro" ? "bg-neutral-950 text-white" : "border border-neutral-200 bg-white"}`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold">{plan.name}</span>
                      <span className={`text-xs ${id === "pro" ? "text-neutral-400" : "text-neutral-500"}`}>{plan.priceFormatted.split(" ")[0]}/mo</span>
                    </div>
                    <p className="mt-3 text-3xl font-semibold tracking-tight tabular-nums">{count}</p>
                    <p className={`mt-1 text-xs ${id === "pro" ? "text-neutral-400" : "text-neutral-500"}`}>
                      store{count === 1 ? "" : "s"}
                      {id !== "free" && ` · ₹${revenue.toLocaleString("en-IN")}/mo`}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Quick Plan Override Tool */}
            <div className="p-6 rounded-xl bg-white border border-neutral-200 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>Change a store's plan manually</span>
              </h3>
              <p className="text-xs text-neutral-500">
                Move any store to another plan without a payment, for example to give a seller a free upgrade.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                {stores.map((s) => (
                  <div
                    key={s.subdomain}
                    className="p-3.5 rounded-lg bg-neutral-50 border border-neutral-200 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-neutral-900 truncate">{s.name}</div>
                      <div className="text-[10px] text-neutral-500 font-mono truncate">{s.subdomain}</div>
                    </div>

                    <select
                      value={s.planId}
                      onChange={(e) => handleUpdatePlan(s.subdomain, e.target.value as any)}
                      className="bg-white border border-neutral-300 text-xs rounded px-2.5 py-1 text-neutral-800 cursor-pointer"
                    >
                      <option value="free">{PLATFORM_PLANS.free.name}</option>
                      <option value="starter">{PLATFORM_PLANS.starter.name}</option>
                      <option value="pro">{PLATFORM_PLANS.pro.name}</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>
            </>
            )}
          </div>
        )}

        {/* 4. BROADCAST ALERTS & GMAIL (LIGHT THEME) */}
        {activeTab === "broadcasts" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-neutral-950">Announcements</h2>
              <p className="mt-1 text-sm text-neutral-500">Send updates to every seller's dashboard and inbox.</p>
            </div>

            {broadcastSuccessToast && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Platform broadcast successfully delivered and recorded in cloud.</span>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Broadcast Form */}
              <form
                onSubmit={handleSendBroadcast}
                className="p-6 rounded-xl bg-white border border-neutral-200 shadow-xs space-y-4"
              >
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                    <Send className="w-4 h-4 text-emerald-600" />
                    <span>Send Announcement</span>
                  </h3>
                </div>

                {/* Pre-set Templates */}
                <div>
                  <label className="text-[11px] font-semibold text-neutral-600 block mb-1.5">
                    Quick templates
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {BROADCAST_TEMPLATES.map((tpl) => (
                      <button
                        key={tpl.label}
                        type="button"
                        onClick={() => handleApplyTemplate(tpl)}
                        className="text-[10px] px-2.5 py-1 rounded-md bg-neutral-100 border border-neutral-200 text-neutral-800 hover:bg-neutral-200 hover:border-neutral-300 transition-colors font-medium"
                      >
                        {tpl.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-neutral-700 block mb-1">
                    Send to
                  </label>
                  <select
                    value={broadcastTarget}
                    onChange={(e) => setBroadcastTarget(e.target.value as any)}
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-md px-3 py-2 text-xs text-neutral-900 cursor-pointer"
                  >
                    <option value="all">All Merchants ({stats.totalStores} stores)</option>
                    <option value="pro">Pro Plan Merchants Only ({stats.proStores} stores)</option>
                    <option value="starter">Starter Plan Merchants Only ({stats.starterStores} stores)</option>
                    <option value="free">Free Tier Merchants Only ({stats.freeStores} stores)</option>
                  </select>
                </div>

                <div className="flex items-center justify-between text-[11px] px-1 text-neutral-500">
                  <span>
                    Stores with an email:{" "}
                    <strong className="text-neutral-900 font-mono">{targetEmails.length}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyTargetEmails}
                    className="text-neutral-900 hover:underline flex items-center gap-1 font-semibold"
                  >
                    {copiedEmailsToast ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedEmailsToast ? "Copied" : "Copy emails"}</span>
                  </button>
                </div>

                <div>
                  <label className="text-xs font-semibold text-neutral-700 block mb-1">
                    Subject *
                  </label>
                  <Input
                    placeholder="e.g. [Important] New Direct UPI Payments & Theme Update"
                    value={broadcastSubject}
                    onChange={(e) => setBroadcastSubject(e.target.value)}
                    className="bg-neutral-50 border-neutral-300 text-neutral-900 text-xs py-2"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-neutral-700 block mb-1">
                    Message *
                  </label>
                  <textarea
                    rows={5}
                    placeholder="Write your platform announcement message to merchants..."
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-md p-3 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900 font-sans"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-neutral-700 block mb-1">
                      Button text (optional)
                    </label>
                    <Input
                      placeholder="e.g. View New Features"
                      value={broadcastCtaText}
                      onChange={(e) => setBroadcastCtaText(e.target.value)}
                      className="bg-neutral-50 border-neutral-300 text-neutral-900 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-neutral-700 block mb-1">
                      Button link
                    </label>
                    <Input
                      placeholder="e.g. /dashboard or https://..."
                      value={broadcastCtaLink}
                      onChange={(e) => setBroadcastCtaLink(e.target.value)}
                      className="bg-neutral-50 border-neutral-300 text-neutral-900 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <Button
                    type="submit"
                    disabled={broadcastSending}
                    className="w-full bg-neutral-900 hover:bg-black text-white font-bold text-xs py-2.5 shadow-sm"
                  >
                    {broadcastSending ? (
                      <div className="flex items-center gap-2">
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Sending…</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-1.5">
                        <Send className="w-3.5 h-3.5" />
                        <span>Send announcement</span>
                      </div>
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleOpenGmailWeb}
                    className="w-full bg-white border-neutral-300 text-blue-700 hover:bg-blue-50 text-xs py-2.5 font-bold flex items-center justify-center gap-1.5 shadow-2xs"
                    title="Open Gmail with all target merchant emails in BCC"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Send via Gmail Web (BCC)</span>
                  </Button>
                </div>
              </form>

              {/* Broadcast History & Logs */}
              <div className="p-6 rounded-xl bg-white border border-neutral-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-purple-600" />
                    <span>Sent announcements</span>
                  </h3>
                  <span className="text-[11px] text-neutral-500 font-medium">
                    {broadcasts.length} Sent
                  </span>
                </div>

                {broadcasts.length === 0 ? (
                  <div className="p-8 text-center bg-neutral-50 rounded-lg border border-neutral-200 text-xs text-neutral-500">
                    <p>No broadcasts transmitted yet.</p>
                    <p className="mt-1 text-[11px]">Use the transmission form to dispatch alerts to store owners.</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                    {broadcasts.map((b) => (
                      <div
                        key={b.id}
                        className="p-3.5 rounded-lg bg-neutral-50 border border-neutral-200 space-y-1.5 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-neutral-900 truncate">{b.subject}</span>
                          <span className="text-[10px] text-emerald-700 font-mono bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            {b.recipientCount} Recipients
                          </span>
                        </div>
                        <p className="text-neutral-600 text-[11px] line-clamp-2">
                          {b.message}
                        </p>
                        <div className="pt-1 flex items-center justify-between text-[10px] text-neutral-400">
                          <span>
                            Target: <strong className="text-neutral-700 uppercase">{b.target}</strong>
                          </span>
                          <span>{new Date(b.sentAt).toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 5. CLOUD SYNC & INFRASTRUCTURE (LIGHT THEME) */}
        {activeTab === "banners" && <PlatformBannersManager />}

        {activeTab === "themes" && <ThemesManager stores={stores} />}


        {activeTab === "health" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-neutral-950">System status</h2>
              <p className="mt-1 text-sm text-neutral-500">Connection to the database and recent activity.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-xl bg-white border border-neutral-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Server className="w-5 h-5 text-emerald-600" />
                    <h3 className="font-bold text-neutral-900 text-sm">Database connection</h3>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-mono bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    CONNECTED
                  </span>
                </div>

                <div className="space-y-2 text-xs font-mono bg-neutral-50 p-4 rounded-lg border border-neutral-200 text-neutral-800">
                  <p><span className="text-neutral-400">Project ID:</span> rox-shoppersite</p>
                  <p><span className="text-neutral-400">Auth Domain:</span> rox-shoppersite.firebaseapp.com</p>
                  <p><span className="text-neutral-400">Storage Bucket:</span> rox-shoppersite.firebasestorage.app</p>
                  <p><span className="text-neutral-400">Collections Synced:</span> stores, orders, subscribers, platform_broadcasts</p>
                  <p><span className="text-neutral-400">Latency:</span> ~24ms (Turbopack Local Node)</p>
                </div>
              </div>

              <div className="p-6 rounded-xl bg-white border border-neutral-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Radio className="w-5 h-5 text-blue-600" />
                    <h3 className="font-bold text-neutral-900 text-sm">Live updates</h3>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={refreshData}
                    className="h-8 text-xs bg-white border-neutral-200 text-neutral-800"
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    <span>Ping Cloud</span>
                  </Button>
                </div>

                <p className="text-xs text-neutral-500 leading-relaxed">
                  Every merchant action, new customer order, catalog change, or status update connects via Firestore's <code className="text-emerald-700">onSnapshot</code> pipeline and syncs immediately to all devices without manual page reloads.
                </p>

                <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-lg text-xs space-y-1">
                  <div className="flex justify-between text-neutral-700">
                    <span>Active Stores in Cache:</span>
                    <span className="font-bold text-neutral-900">{stores.length}</span>
                  </div>
                  <div className="flex justify-between text-neutral-700">
                    <span>Total Database Orders:</span>
                    <span className="font-bold text-neutral-900">{stats.totalOrders}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      </div>

      {/* PLAN OVERRIDE MODAL (LIGHT THEME) */}
      <Modal
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        title={`Change Plan for ${selectedStore?.name}`}
        description="Select the subscription tier to assign directly to this merchant."
      >
        <div className="space-y-4 text-left">
          <div className="space-y-2">
            <label className="text-xs font-bold text-neutral-800 block">
              Assign Subscription Tier
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTargetPlan("free")}
                className={`p-3 rounded-lg border text-left text-xs transition-all ${
                  targetPlan === "free"
                    ? "border-neutral-900 bg-neutral-900 text-white font-bold"
                    : "border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-50"
                }`}
              >
                <div className="font-bold">FREE</div>
                <div className="text-[10px] opacity-75">10 Products</div>
              </button>

              <button
                type="button"
                onClick={() => setTargetPlan("starter")}
                className={`p-3 rounded-lg border text-left text-xs transition-all ${
                  targetPlan === "starter"
                    ? "border-amber-600 bg-amber-600 text-white font-bold"
                    : "border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-50"
                }`}
              >
                <div className="font-bold">STARTER</div>
                <div className="text-[10px] opacity-75">100 Products</div>
              </button>

              <button
                type="button"
                onClick={() => setTargetPlan("pro")}
                className={`p-3 rounded-lg border text-left text-xs transition-all ${
                  targetPlan === "pro"
                    ? "border-emerald-600 bg-emerald-600 text-white font-bold"
                    : "border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-50"
                }`}
              >
                <div className="font-bold">PRO</div>
                <div className="text-[10px] opacity-75">Unlimited</div>
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPlanModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-neutral-900 text-white hover:bg-black"
              onClick={() => {
                if (selectedStore) {
                  handleUpdatePlan(selectedStore.subdomain, targetPlan);
                }
              }}
            >
              Change plan
            </Button>
          </div>
        </div>
      </Modal>

      {/* SUSPEND / UNSUSPEND MODAL (LIGHT THEME) */}
      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        title={
          selectedStore?.status === "suspended" || selectedStore?.isPaused
            ? `Reactivate Store: ${selectedStore?.name}`
            : `Suspend Store: ${selectedStore?.name}`
        }
        description={
          selectedStore?.status === "suspended" || selectedStore?.isPaused
            ? "Reactivating this store will restore full public access to the storefront and catalog."
            : "Suspension will temporarily take down this storefront and display a pause notice to visitors."
        }
      >
        <div className="space-y-4 text-left">
          {selectedStore?.status !== "suspended" && !selectedStore?.isPaused && (
            <div>
              <label className="text-xs font-bold text-neutral-800 block mb-1">
                Suspension Reason (Visible to visitors)
              </label>
              <Input
                placeholder="e.g. Under scheduled maintenance or policy review."
                value={suspensionReason}
                onChange={(e) => setSuspensionReason(e.target.value)}
                className="text-xs"
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsStatusModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className={
                selectedStore?.status === "suspended" || selectedStore?.isPaused
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "bg-red-600 hover:bg-red-700 text-white"
              }
              onClick={() => {
                if (selectedStore) {
                  handleToggleStatus(selectedStore.subdomain, selectedStore.status, selectedStore.isPaused);
                }
              }}
            >
              {selectedStore?.status === "suspended" || selectedStore?.isPaused
                ? "Reactivate Store"
                : "Suspend Store"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* DELETE TENANT MODAL (LIGHT THEME) */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title={`Permanently Delete ${selectedStore?.name}?`}
        description="This will permanently erase the store, products, orders, and configuration from the cloud database. This action cannot be undone."
      >
        <div className="space-y-4 text-left">
          <div className="p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-700">
            <strong>Warning:</strong> The custom subdomain <code>{getStoreDomain(selectedStore?.subdomain || "")}</code> will be permanently released.
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => {
                if (selectedStore) {
                  handleDeleteStore(selectedStore.subdomain);
                }
              }}
            >
              Delete Store Permanently
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
