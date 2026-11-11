"use client";

import { trackEvent } from "@/components/seo/site-analytics";
import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { storeService } from "@/lib/store-service";
import { siteConfig, getStoreUrl, getPublicStoreUrl, getPublicStoreAddress } from "@/lib/config/site";
import { cn } from "@/lib/utils";
import { isReservedSubdomain } from "@/lib/reserved-names";
import { introOfferText, PLATFORM_PLANS, type BillingCycle } from "@/lib/plans";
import { usePlatformSettings } from "@/lib/use-platform-settings";
import { getTheme } from "@/lib/themes";
import {
  AuthShell,
  AuthHeading,
  AuthInput,
  AuthButton,
  PasswordToggle,
  AuthFallback,
  CollageShowcase,
  GoogleButton,
  AuthDivider,
} from "@/components/auth/auth-shell";
import { MOCK_PRODUCTS, unsplash } from "@/components/home/mockups";
import {
  Store,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  ExternalLink,
  MessageCircle,
  Lock,
  Mail,
  User,
  Phone,
  QrCode,
  Check,
  Search,
  ShoppingBag,
  Shirt,
  Footprints,
  Gem,
  Sparkles,
  Sofa,
  Cookie,
  Loader2,
  Plus,
} from "lucide-react";
import { checkEmail, checkPassword, checkPersonName, checkPhone, cleanPhone, phoneInput } from "@/lib/validation";

const CATEGORIES = [
  { value: "Fashion & Apparel", label: "Fashion & Apparel", icon: Shirt },
  { value: "Footwear & Accessories", label: "Footwear & Accessories", icon: Footprints },
  { value: "Handicrafts & Jewellery", label: "Handicrafts & Jewellery", icon: Gem },
  { value: "Beauty & Skincare", label: "Beauty & Skincare", icon: Sparkles },
  { value: "Home & Living", label: "Home Decor & Living", icon: Sofa },
  { value: "Gourmet & Organic Foods", label: "Food & Organic", icon: Cookie },
  { value: "Others", label: "Others", icon: Plus },
];

type QuestionId = "name" | "address" | "category" | "tagline" | "owner" | "phone" | "email" | "password" | "plan";

export default function RegisterStorePage() {
  return (
    <Suspense fallback={<AuthFallback />}>
      <RegisterStoreContent />
    </Suspense>
  );
}

function RegisterStoreContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, signUp, signInWithGoogle, loading: authLoading } = useAuth();
  const [googleLoading, setGoogleLoading] = useState(false);

  // Account step: sign up with Google instead of email/password. Once signed in, the account step
  // drops out of the list and the wizard carries on with the next question.
  const handleGoogleAccount = async () => {
    setGoogleLoading(true);
    setQError("");
    try {
      await signInWithGoogle();
    } catch (err: any) {
      if (err?.code !== "auth/popup-closed-by-user" && err?.code !== "auth/cancelled-popup-request") {
        setQError(err?.message || "Couldn't sign in with Google. Try again or use your email.");
      }
    } finally {
      setGoogleLoading(false);
    }
  };
  usePlatformSettings();

  const [step, setStep] = useState<1 | 2 | 3>(1); // 3 = launched
  const [qIndex, setQIndex] = useState(0);
  const [qError, setQError] = useState("");
  const [storeName, setStoreName] = useState("");
  // Prefill from the home page "claim your shop" form (?subdomain=)
  const [subdomain, setSubdomain] = useState(
    () => (searchParams.get("subdomain") || "").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 30)
  );
  const [category, setCategory] = useState("Fashion & Apparel");
  const [tagline, setTagline] = useState("");
  // "Others": the seller says what they sell in their own words
  const [otherCategory, setOtherCategory] = useState("");
  const [agreed, setAgreed] = useState(false);

  const [ownerName, setOwnerName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [accountPassword, setAccountPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Plan picked on the homepage pricing (?plan=starter|pro&cycle=...), switchable on the last step.
  // A paid plan only switches on after payment, so the store launches on Free and payment follows.
  const [planId, setPlanId] = useState<"free" | "starter" | "pro">(() => {
    const p = searchParams.get("plan");
    return p === "starter" || p === "pro" ? p : "free";
  });
  const [billingCycle] = useState<BillingCycle>(() => {
    const c = searchParams.get("cycle");
    return c === "quarterly" || c === "yearly" ? c : "monthly";
  });
  const chosenPlan = PLATFORM_PLANS[planId];
  // theme picked in the theme marketplace (?theme=slug); new shops start on it when their plan includes it
  const pickedTheme = searchParams.get("theme") || "";
  const [appliedTheme, setAppliedTheme] = useState(() => getTheme("classic-bloom").name);
  // a priced theme picked in the marketplace that the new shop still has to buy
  const [themeToBuy, setThemeToBuy] = useState("");

  // A seller who already has a store and picked a paid plan goes straight to that store's
  // upgrade page instead of the sign-up steps. Without a plan, sign-up still makes a new store.
  const wantsUpgrade = searchParams.get("plan") === "starter" || searchParams.get("plan") === "pro";
  const [upgradeTarget, setUpgradeTarget] = useState("");
  useEffect(() => {
    if (!wantsUpgrade || !user) return;
    const owned = storeService.getUserStores(user.uid, user.email || undefined);
    if (owned.length === 0) return;
    let active = "";
    try {
      active = localStorage.getItem("shopper_active_store") || "";
    } catch {
      // storage unavailable; fall back to the first store
    }
    const target = owned.find((s) => s.subdomain === active) || owned[0];
    setUpgradeTarget(target.subdomain);
    router.replace(`/dashboard?store=${target.subdomain}&checkout=${planId}&cycle=${billingCycle}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wantsUpgrade, user]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdSubdomain, setCreatedSubdomain] = useState("");

  // Autofill user credentials if logged in
  useEffect(() => {
    if (user) {
      if (!ownerName && user.displayName) setOwnerName(user.displayName);
      if (!contactEmail && user.email) setContactEmail(user.email);
    }
  }, [user, ownerName, contactEmail]);

  // Auto-generate subdomain from store name
  const handleStoreNameChange = (val: string) => {
    setStoreName(val);
    if (!subdomain || subdomain === storeName.toLowerCase().replace(/[^a-z0-9]/g, "")) {
      const slug = val
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")
        .slice(0, 30);
      setSubdomain(slug);
    }
  };

  const handleCreateStore = async () => {
    setIsSubmitting(true);
    try {
      let activeUser = user;
      if (!activeUser) {
        activeUser = await signUp(contactEmail, accountPassword, ownerName);
      }

      const cleanSub = subdomain.toLowerCase().trim();
      const newStore = await storeService.registerStore({
        name: storeName,
        subdomain: cleanSub,
        category: category === "Others" ? otherCategory.trim().replace(/\s+/g, " ") : category,
        ownerName: ownerName.trim(),
        contactPhone: cleanPhone(contactPhone),
        contactEmail: contactEmail || activeUser.email || undefined,
        upiId: "",
        tagline: tagline || `Welcome to ${storeName}`,
        ownerId: activeUser.uid,
        ownerEmail: activeUser.email || contactEmail || undefined,
      });

      if (pickedTheme && storeService.setStoreTheme(newStore.subdomain, pickedTheme).success) {
        setAppliedTheme(getTheme(pickedTheme).name);
      } else if (pickedTheme && getTheme(pickedTheme).slug === pickedTheme) {
        setThemeToBuy(pickedTheme);
      }

      if (typeof window !== "undefined") {
        localStorage.setItem("shopper_active_store", newStore.subdomain);
      }

      // GA4 conversion: a new store was created (no personal details are sent)
      trackEvent("sign_up", { method: user ? "existing_account" : "email", plan: planId });
      setCreatedSubdomain(newStore.subdomain);
      setStep(3);
    } catch (err: any) {
      console.error("Store registration error:", err);
      setQError(err.message || "Couldn't create your store. Try a different web address, or check your email and password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // One question per screen. Email and password are only asked when not signed in.
  // Six short steps (five when already signed in); some hold two related fields
  const steps: { key: string; fields: QuestionId[]; title: string; text: string }[] = [
    { key: "shop", fields: ["name", "address"], title: "Name your shop.", text: "Pick a name and your free web address. You can change both later." },
    { key: "category", fields: ["category"], title: "What do you sell?", text: "We'll set up starter collections to match." },
    { key: "tagline", fields: ["tagline"], title: "Add a tagline.", text: "A short line under your shop name. Optional." },
    { key: "contact", fields: ["owner", "phone"], title: "How can buyers reach you?", text: "Order alerts and buyer messages come to this WhatsApp number." },
    ...(user
      ? []
      : [{ key: "account", fields: ["email", "password"] as QuestionId[], title: "Create your login.", text: "You'll use these to sign in to your seller dashboard." }]),
    { key: "plan", fields: ["plan"], title: "Choose your plan.", text: "Start free, or try Growth free for 10 days. You can change any time." },
  ];
  const current = steps[Math.min(qIndex, steps.length - 1)];
  const fields = current.fields;
  const isLast = qIndex >= steps.length - 1;

  const validate = (id: QuestionId): string => {
    switch (id) {
      case "name":
        return storeName.trim() ? "" : "Give your shop a name.";
      case "address": {
        if (subdomain.length < 3) return "Use at least 3 letters or numbers.";
        if (isReservedSubdomain(subdomain)) return `${subdomain}.${siteConfig.domain} can't be used. Try another.`;
        const taken = storeService.getStore(subdomain);
        return taken ? `${subdomain}.${siteConfig.domain} is taken. Try another.` : "";
      }
      case "category":
        if (category !== "Others") return "";
        if (otherCategory.trim().length < 3) return "Tell us what you sell (e.g. Stationery, Toys, Plants).";
        if (!/^[\p{L}\p{N} &,'.-]{3,40}$/u.test(otherCategory.trim())) return "Use letters only, up to 40 characters.";
        return "";
      case "owner":
        return checkPersonName(ownerName);
      case "phone":
        return checkPhone(contactPhone, "WhatsApp number");
      case "email":
        return checkEmail(contactEmail);
      case "password":
        return checkPassword(accountPassword);
      case "plan":
        return agreed ? "" : "Please agree to the Terms and Privacy Policy to launch your store.";
      default:
        return "";
    }
  };

  const goNext = () => {
    const err = fields.map(validate).find(Boolean);
    if (err) return setQError(err);
    setQError("");
    if (isLast) handleCreateStore();
    else setQIndex(qIndex + 1);
  };
  const goBack = () => {
    setQError("");
    setQIndex(Math.max(0, qIndex - 1));
  };

  // While we check for (or move to) an existing store, don't flash the sign-up steps
  if (wantsUpgrade && (authLoading || upgradeTarget)) return <AuthFallback />;

  return (
    <AuthShell
      topLink={{ text: "Already have a store?", label: "Log in", href: "/login" }}
      aside={<StorePreview storeName={storeName} subdomain={subdomain} tagline={tagline} category={category} live={step === 3} />}
    >
      {step < 3 && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            goNext();
          }}
          noValidate
        >
          <StepIndicator current={qIndex + 1} total={steps.length} />

          <div key={current.key} className="animate-enter-blur space-y-4">
            <AuthHeading title={current.title} text={current.text} />

            {fields.includes("name") && (
              <AuthInput
                label="Shop name"
                icon={Store}
                placeholder="e.g. Lume Apparel"
                value={storeName}
                onChange={(e) => (handleStoreNameChange(e.target.value), setQError(""))}
                autoFocus
              />
            )}

            {fields.includes("address") && (
              <AuthInput
                label="Web address"
                placeholder="yourstore"
                value={subdomain}
                onChange={(e) => (setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 30)), setQError(""))}
                suffix={`.${siteConfig.domain}`}
                hint={
                  <>
                    Your store will be live at{" "}
                    <span className="font-semibold text-black">
                      {getPublicStoreAddress(subdomain || "yourshop")}
                    </span>
                  </>
                }
              />
            )}

            {fields.includes("category") && (
              <div className="grid grid-cols-2 gap-2.5">
                {CATEGORIES.map((c) => {
                  const on = category === c.value;
                  return (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setCategory(c.value)}
                      className={cn(
                        "flex flex-col items-start gap-3 rounded-[14px] border p-3.5 text-left text-sm font-medium transition-all",
                        on ? "border-black bg-black text-white" : "border-neutral-200 hover:border-neutral-400"
                      )}
                    >
                      <c.icon className="w-5 h-5" />
                      {c.label}
                    </button>
                  );
                })}
                {category === "Others" && (
                  <div className="col-span-2 mt-1">
                    <AuthInput
                      label="What do you sell?"
                      placeholder="e.g. Stationery, Toys, Plants"
                      value={otherCategory}
                      maxLength={40}
                      onChange={(e) => (setOtherCategory(e.target.value), setQError(""))}
                      autoFocus
                    />
                  </div>
                )}
              </div>
            )}

            {fields.includes("tagline") && (
              <AuthInput
                label="Tagline"
                placeholder="e.g. Style that moves with you"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                autoFocus
              />
            )}

            {fields.includes("owner") && (
              <AuthInput
                label="Your name"
                icon={User}
                autoComplete="name"
                placeholder="e.g. Ramesh Chandra"
                value={ownerName}
                onChange={(e) => (setOwnerName(e.target.value), setQError(""))}
                autoFocus
              />
            )}

            {fields.includes("phone") && (
              <AuthInput
                label="WhatsApp number"
                icon={Phone}
                type="tel"
                autoComplete="tel"
                inputMode="tel"
                placeholder="10-digit number, e.g. 9876543210"
                value={contactPhone}
                onChange={(e) => (setContactPhone(phoneInput(e.target.value)), setQError(""))}
              />
            )}

            {current.key === "account" && (
              <>
                <GoogleButton label="Continue with Google" onClick={handleGoogleAccount} disabled={googleLoading || isSubmitting} />
                <AuthDivider label="or use your email" />
              </>
            )}

            {fields.includes("email") && (
              <AuthInput
                label="Email"
                icon={Mail}
                type="email"
                autoComplete="email"
                placeholder="you@yourbrand.com"
                value={contactEmail}
                onChange={(e) => (setContactEmail(e.target.value), setQError(""))}
                autoFocus
              />
            )}

            {fields.includes("password") && (
              <AuthInput
                label="Password"
                icon={Lock}
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="At least 8 characters, with a number"
                value={accountPassword}
                onChange={(e) => (setAccountPassword(e.target.value), setQError(""))}
                trailing={<PasswordToggle shown={showPassword} onToggle={() => setShowPassword(!showPassword)} />}
              />
            )}

            {fields.includes("plan") && (
              <>
                {/* Plan: pre-selected from the pricing page, switchable here */}
                <div>
                  <div role="radiogroup" aria-label="Choose your plan" className="mt-2 grid grid-cols-3 gap-2">
                    {(["free", "starter", "pro"] as const).map((id) => {
                      const p = PLATFORM_PLANS[id];
                      const on = planId === id;
                      return (
                        <button
                          key={id}
                          type="button"
                          role="radio"
                          aria-checked={on}
                          onClick={() => setPlanId(id)}
                          className={cn(
                            "rounded-[12px] border p-3 text-left transition-colors",
                            on ? "border-black bg-black text-white" : "border-neutral-200 hover:border-neutral-400"
                          )}
                        >
                          <span className="block text-sm font-semibold">{p.name}</span>
                          <span className="mt-1 block text-[15px] font-semibold">
                            {p.priceFormatted.split(" ")[0]}
                            {id !== "free" && <span className={cn("text-xs font-normal", on ? "text-white/60" : "text-neutral-500")}>/mo</span>}
                          </span>
                          <span className={cn("block h-4 text-[11px]", on ? "text-white/60" : "text-neutral-500")}>
                            {p.trialDays ? `${p.trialDays} days free` : p.introPriceMonthly ? `₹${p.introPriceMonthly / 100} first ${p.introMonths} mo` : ""}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-3 rounded-[12px] border border-neutral-200 p-4">
                    <span className="text-sm font-semibold">{planId === "free" ? "Included free" : `Included in ${chosenPlan.name}`}</span>
                    <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm text-neutral-600">
                      {chosenPlan.features.map((t) => (
                        <li key={t} className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-black shrink-0 mt-[3px]" />
                          {t}
                        </li>
                      ))}
                    </ul>
                    {planId !== "free" && (
                      <p className="mt-3 border-t border-neutral-100 pt-3 text-xs text-neutral-500">
                        {chosenPlan.trialDays
                          ? `Your store goes live right away. Next you'll set up payment to start your ${chosenPlan.trialDays}-day free trial; your first ${chosenPlan.priceFormatted.split(" ")[0]} charge is on day ${chosenPlan.trialDays + 1}. Cancel any time before that and you won't be charged.`
                          : chosenPlan.introPriceMonthly
                            ? `Your store goes live right away. Next you'll subscribe: ${introOfferText(chosenPlan)}.`
                            : `Your store goes live right away. Next you'll subscribe to ${chosenPlan.name}.`}
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}

            {isLast && (
              <label className="mt-5 flex items-start gap-3 text-sm text-neutral-700">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => (setAgreed(e.target.checked), setQError(""))}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-black"
                  style={{ minHeight: 0, minWidth: 0 }}
                />
                <span>
                  I agree to the{" "}
                  <Link href="/legal/terms" target="_blank" className="font-semibold underline underline-offset-2">Terms of Service</Link>,{" "}
                  <Link href="/legal/privacy" target="_blank" className="font-semibold underline underline-offset-2">Privacy Policy</Link>,{" "}
                  <Link href="/legal/payments" target="_blank" className="font-semibold underline underline-offset-2">Payments Policy</Link> and{" "}
                  <Link href="/legal/acceptable-use" target="_blank" className="font-semibold underline underline-offset-2">what can&apos;t be sold</Link>.
                  I&apos;ll add my shop&apos;s own policies (my shop stays closed until I add at least one).
                </span>
              </label>
            )}
            {qError && <p className="mt-3 text-sm font-medium text-red-600">{qError}</p>}
          </div>

          <div className="mt-7 flex items-center gap-3">
            {qIndex > 0 && (
              <AuthButton type="button" variant="outline" className="!w-auto px-4" onClick={goBack} aria-label="Back">
                <ArrowLeft className="w-4 h-4" />
              </AuthButton>
            )}
            {current.key === "tagline" && !tagline && (
              <button type="button" onClick={goNext} className="px-3 h-12 text-sm font-semibold text-neutral-500 hover:text-black transition-colors">
                Skip
              </button>
            )}
            <AuthButton type="submit" loading={isSubmitting} loadingText="Launching your shop…" className="flex-1">
              {isLast ? (planId === "free" ? "Launch my store" : `Launch & get ${chosenPlan.name}`) : "Continue"}
              <ArrowRight className="w-4 h-4" />
            </AuthButton>
          </div>
          {user && qIndex === 0 && (
            <p className="mt-4 text-xs text-neutral-500">
              Signed in as <span className="font-semibold text-neutral-800">{user.email}</span>
            </p>
          )}
        </form>
      )}

      {/* STEP 3: Celebration & Instant Links */}
      {step === 3 && (
        <div>
          <div className="relative w-16 h-16">
            <span className="absolute inset-0 rounded-full bg-emerald-400/30 animate-ping [animation-iteration-count:2]" />
            <span className="relative w-16 h-16 rounded-full bg-black text-white flex items-center justify-center animate-pill-pop">
              <CheckCircle className="w-8 h-8" />
            </span>
          </div>
          <AuthHeading title={`${storeName} is live!`} text="Your store is set up and ready for its first order." />

          <ul className="mb-5 space-y-2">
            {["Store address claimed", "Cash on delivery ready", `${appliedTheme} theme applied`, "Starter collections added"].map((t, i) => (
              <li
                key={t}
                className="flex items-center gap-2.5 text-sm text-neutral-700 animate-enter-blur"
                style={{ animationDelay: `${200 + i * 120}ms` }}
              >
                <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3" strokeWidth={3} />
                </span>
                {t}
              </li>
            ))}
          </ul>

          <div className="rounded-[12px] border border-neutral-200 p-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="block text-xs text-neutral-500">Your store address</span>
              <span className="block text-sm font-semibold truncate">
                {getPublicStoreAddress(createdSubdomain)}
              </span>
            </div>
            <Link
              href={getStoreUrl(createdSubdomain)}
              target="_blank"
              className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] border border-neutral-300 text-sm font-semibold hover:border-black transition-colors"
            >
              Open
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          {planId !== "free" && (
            <div className="mt-4 rounded-[12px] bg-black text-white p-4">
              <span className="block text-sm font-semibold">One more step: switch on {chosenPlan.name}</span>
              <span className="mt-1 block text-xs text-white/60">
                Your store runs on Free until your {chosenPlan.priceFormatted.split(" ")[0]}/mo payment is confirmed.
              </span>
            </div>
          )}

          <div className="mt-6 space-y-3">
            {planId !== "free" ? (
              <AuthButton
                type="button"
                onClick={() => router.push(`/dashboard?store=${createdSubdomain}&checkout=${planId}&cycle=${billingCycle}`)}
              >
                Pay & activate {chosenPlan.name}
                <ArrowRight className="w-4 h-4" />
              </AuthButton>
            ) : (
              <AuthButton
                type="button"
                onClick={() => router.push(`/dashboard?store=${createdSubdomain}${themeToBuy ? `&tab=themes&use=${themeToBuy}` : ""}`)}
              >
                {themeToBuy ? `See how to get ${getTheme(themeToBuy).name}` : "Go to my dashboard"}
                <ArrowRight className="w-4 h-4" />
              </AuthButton>
            )}
            {planId !== "free" && (
              <button
                type="button"
                onClick={() => router.push(`/dashboard?store=${createdSubdomain}`)}
                className="w-full h-11 text-sm font-semibold text-neutral-500 hover:text-black transition-colors"
              >
                Stay on Free for now
              </button>
            )}
            <a
              href={`https://wa.me/?text=${encodeURIComponent(
                `We just launched our online store! Browse our catalog here: ${getPublicStoreUrl(createdSubdomain)}`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="w-full h-12 rounded-[14px] border border-neutral-300 text-[15px] font-semibold inline-flex items-center justify-center gap-2 hover:border-black transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              Share on WhatsApp
            </a>
          </div>
        </div>
      )}
    </AuthShell>
  );
}

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="mb-6 flex items-center gap-3 text-xs font-semibold">
      <span className="text-neutral-500 tabular-nums">
        {current} of {total}
      </span>
      <div className="flex-1 flex gap-1">
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className={cn("h-1 flex-1 rounded-full transition-colors duration-300", i < current ? "bg-black" : "bg-neutral-200")} />
        ))}
      </div>
    </div>
  );
}

/** Live storefront preview that updates as the seller types. */
function StorePreview({
  storeName,
  subdomain,
  tagline,
  category,
  live,
}: {
  storeName: string;
  subdomain: string;
  tagline: string;
  category: string;
  live: boolean;
}) {
  const name = storeName.trim() || "Your Store";
  return (
    <CollageShowcase
      intro={
        <>
          <h2 className="text-4xl xl:text-5xl [@media(max-height:760px)]:text-3xl font-semibold leading-[1.05]">
            {live ? "Your shop is open." : "See your shop take shape."}
          </h2>
          {/* quick facts, styled like the grid boxes behind them */}
          <div className="mt-7 grid grid-cols-3 gap-3 max-w-md [@media(max-height:700px)]:hidden">
            {[
              { value: "60s", label: "to go live" },
              { value: "0%", label: "commission" },
              { value: "₹0", label: "to start" },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-[12px] border border-white/15 bg-white/[0.05] backdrop-blur-sm px-4 py-3.5 transition-colors duration-300 hover:bg-white/10 hover:border-white/30"
              >
                <div className="text-2xl font-semibold tracking-tight">{s.value}</div>
                <div className="mt-0.5 text-xs text-white/55">{s.label}</div>
              </div>
            ))}
          </div>
        </>
      }
    >
      <div className="relative h-full max-h-[440px] w-full max-w-[460px] mx-auto flex flex-col">
        {/* floating cards overlapping the preview's corners */}
        <div className="absolute -top-6 -right-6 sm:-right-10 z-10 animate-float-gentle rounded-[12px] bg-white text-black shadow-[0_18px_40px_-14px_rgba(0,0,0,0.6)] px-3.5 py-2.5 flex items-center gap-2.5" style={{ rotate: "4deg" }}>
          <span className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center">
            <Check className="w-3.5 h-3.5" />
          </span>
          <span>
            <span className="block text-[10px] text-neutral-500">New order</span>
            <span className="block text-sm font-semibold">₹4,999</span>
          </span>
        </div>
        <div
          className="absolute -bottom-9 -left-8 sm:-left-14 z-10 animate-float-gentle rounded-[12px] bg-black text-white border border-white/20 shadow-[0_18px_40px_-14px_rgba(0,0,0,0.8)] px-3.5 py-2.5 flex items-center gap-2.5"
          style={{ rotate: "-4deg", animationDelay: "1.4s" }}
        >
          <img src={unsplash(MOCK_PRODUCTS[1].img, 80)} alt="" className="w-7 h-7 rounded-[6px] object-cover" />
          <span>
            <span className="block text-[10px] text-white/55">New order</span>
            <span className="block text-sm font-semibold">{MOCK_PRODUCTS[1].price}</span>
          </span>
        </div>

        <div className="flex-1 min-h-0 flex flex-col rounded-[14px] bg-white text-black overflow-hidden shadow-[0_30px_80px_-20px_rgba(0,0,0,0.4)] transition-transform duration-500 hover:-translate-y-1 hover:rotate-[-0.5deg]">
          <div className="shrink-0 flex items-center gap-2 px-4 h-10 border-b border-neutral-200 bg-neutral-50">
            <span className="w-2 h-2 rounded-full bg-neutral-300" />
            <span className="w-2 h-2 rounded-full bg-neutral-300" />
            <span className="w-2 h-2 rounded-full bg-neutral-300" />
            <span className="ml-2 text-[11px] text-neutral-500 truncate">
              {getPublicStoreAddress(subdomain || "yourshop")}
            </span>
          </div>
          <div className="shrink-0 flex items-center justify-between px-6 h-12 border-b border-neutral-100">
            <span className="font-bold tracking-tight text-sm uppercase truncate max-w-[60%]">{name}</span>
            <div className="flex items-center gap-3 text-neutral-700">
              <Search className="w-3.5 h-3.5" />
              <ShoppingBag className="w-3.5 h-3.5" />
            </div>
          </div>
          {/* the banner takes whatever height is left, so the preview always fits the panel */}
          <div className="relative flex-1 min-h-28 overflow-hidden">
            <img src={unsplash("photo-1441986300917-64674bd600d8", 900)} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/10" />
            <div className="relative h-full flex flex-col justify-center px-5 text-white">
              <span className="text-[11px] uppercase tracking-[0.2em] opacity-80">{category}</span>
              <span key={tagline + name} className="animate-in fade-in text-2xl font-bold tracking-tight mt-1 line-clamp-2">
                {tagline.trim() || `Welcome to ${name}`}
              </span>
            </div>
          </div>
          <div className="shrink-0 grid grid-cols-3 gap-3 p-4 [@media(max-height:700px)]:hidden">
            {MOCK_PRODUCTS.slice(0, 3).map((p) => (
              <div key={p.name} className="group/p">
                <div className="aspect-[4/3] rounded-[8px] overflow-hidden bg-neutral-100">
                  <img src={unsplash(p.img, 300)} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover/p:scale-110" />
                </div>
                <div className="mt-1.5 text-[11px] font-medium truncate">{p.name}</div>
                <div className="text-[11px] text-neutral-500">{p.price}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </CollageShowcase>
  );
}
