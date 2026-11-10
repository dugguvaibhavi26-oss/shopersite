"use client";

import * as React from "react";
import Link from "next/link";
import {
  Trash2,
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Mail,
  Store,
  Shield,
  ArrowRight,
  HelpCircle,
  Copy,
  Check,
  Building2,
  Users,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { LegalShell } from "@/components/legal/legal-shell";
import { siteConfig } from "@/lib/config/site";
import { cn } from "@/lib/utils";

type AccountType = "seller" | "admin" | "collaborator";

interface SubmissionResult {
  referenceId: string;
  email: string;
  accountType: string;
  createdAt: string;
  scheduledPurgeDate: string;
  gracePeriodDays: number;
}

const REASONS = [
  "Select a reason (optional)",
  "Closing my business / store",
  "Switching to an alternative platform",
  "Temporary break / Will restart later",
  "High costs / Subscription pricing",
  "Missing specific features or integrations",
  "Low sales velocity or traffic challenges",
  "Privacy, security, or data erasure request",
  "Created account only for testing / demo",
  "Other reason",
];

export default function DeleteAccountPage() {
  const { user } = useAuth();

  // Form State
  const [email, setEmail] = React.useState("");
  const [accountType, setAccountType] = React.useState<AccountType>("seller");
  const [storeSubdomain, setStoreSubdomain] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [reasonDetails, setReasonDetails] = React.useState("");
  const [confirmPermanent, setConfirmPermanent] = React.useState(false);
  const [confirmOrders, setConfirmOrders] = React.useState(false);

  // Submission State
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [submissionResult, setSubmissionResult] = React.useState<SubmissionResult | null>(null);
  const [copied, setCopied] = React.useState(false);

  // Pre-fill email from auth if logged in
  React.useEffect(() => {
    if (user?.email && !email) {
      setEmail(user.email);
    }
  }, [user?.email, email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !trimmedEmail.includes("@") || !trimmedEmail.includes(".")) {
      setErrorMsg("Please enter a valid registered email address.");
      return;
    }

    if (!confirmPermanent || !confirmOrders) {
      setErrorMsg("Please accept the confirmation acknowledgements before submitting.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/account/delete-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmedEmail,
          accountType,
          storeSubdomain: storeSubdomain.trim() || undefined,
          reason: reason && reason !== REASONS[0] ? reason : undefined,
          reasonDetails: reasonDetails.trim() || undefined,
          confirmed: true,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to submit deletion request. Please try again.");
      }

      setSubmissionResult(data);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyReference = () => {
    if (!submissionResult) return;
    navigator.clipboard.writeText(submissionResult.referenceId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <LegalShell>
      {/* Header Banner */}
      <section className="border-b border-neutral-200 bg-neutral-50/70">
        <div className="mx-auto max-w-7xl px-4 pb-12 pt-10 sm:px-6 sm:pb-16 sm:pt-14">
          <nav className="flex items-center gap-2 text-[13px] text-neutral-500 mb-6" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-neutral-950">
              Home
            </Link>
            <span aria-hidden>/</span>
            <Link href="/legal" className="hover:text-neutral-950">
              Legal
            </Link>
            <span aria-hidden>/</span>
            <span className="text-neutral-950 font-medium">Delete Account</span>
          </nav>

          <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-950 text-white shadow-sm mb-5">
              <Trash2 className="h-6 w-6 text-red-400" />
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl text-neutral-950">
              Delete Your Account
            </h1>
            <p className="mt-4 text-base sm:text-lg leading-relaxed text-neutral-600 max-w-2xl">
              Submit an official request to permanently close and erase your {siteConfig.name} seller or administrator
              account. Every request is backed by a 30-day grace period.
            </p>

            {/* Quick feature tags */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5 text-xs font-semibold text-neutral-600">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-neutral-200/90 shadow-2xs">
                <Shield className="w-3.5 h-3.5 text-emerald-600" />
                Verified Data Erasure
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-neutral-200/90 shadow-2xs">
                <Clock className="w-3.5 h-3.5 text-neutral-800" />
                30-Day Cooling-Off Window
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-neutral-200/90 shadow-2xs">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                Statutory Tax Compliance
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Column: Form or Success Card */}
          <div className="lg:col-span-7">
            {submissionResult ? (
              /* Success Confirmation Card */
              <div className="rounded-3xl border border-neutral-200 bg-white p-6 sm:p-10 shadow-sm space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      Request Registered
                    </span>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-neutral-950 mt-1">
                      Account Deletion Scheduled
                    </h2>
                  </div>
                </div>

                <p className="text-sm text-neutral-600 leading-relaxed">
                  Your deletion request has been officially recorded. A confirmation receipt has been sent to{" "}
                  <strong className="text-neutral-950 font-semibold">{submissionResult.email}</strong>.
                </p>

                {/* Reference ID Pill */}
                <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                      Tracking Reference ID
                    </span>
                    <p className="text-lg font-mono font-bold text-neutral-950">
                      {submissionResult.referenceId}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={copyReference}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-neutral-300 text-xs font-semibold text-neutral-800 hover:bg-neutral-100 transition-colors cursor-pointer self-start sm:self-center"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Timeline Snapshot */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl border border-neutral-200 bg-white">
                    <span className="text-neutral-500 font-medium block">Requested On</span>
                    <span className="font-bold text-neutral-900 mt-0.5 block">
                      {new Date(submissionResult.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl border border-neutral-200 bg-white">
                    <span className="text-neutral-500 font-medium block">Permanent Purge Date</span>
                    <span className="font-bold text-red-600 mt-0.5 block">
                      {new Date(submissionResult.scheduledPurgeDate).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}{" "}
                      (30 days)
                    </span>
                  </div>
                </div>

                {/* Cancel or Restore Info */}
                <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-xs text-amber-900 leading-relaxed">
                  <h4 className="font-bold text-amber-950 mb-1 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-700" />
                    Changed your mind?
                  </h4>
                  <p>
                    You have a <strong>30-day grace period</strong>. If you submitted this request by mistake or wish to
                    reactivate your store, simply email{" "}
                    <a
                      href={`mailto:${siteConfig.supportEmail}?subject=Cancel Deletion Request ${submissionResult.referenceId}`}
                      className="font-bold underline text-amber-950 hover:text-black"
                    >
                      {siteConfig.supportEmail}
                    </a>{" "}
                    from your registered email address quoting reference{" "}
                    <span className="font-mono font-bold">{submissionResult.referenceId}</span>.
                  </p>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <Link
                    href="/"
                    className="inline-flex justify-center items-center px-6 py-3 rounded-xl bg-black text-white text-sm font-semibold hover:bg-neutral-800 transition-colors shadow-2xs"
                  >
                    Return to Homepage
                  </Link>
                  <Link
                    href="/dashboard"
                    className="inline-flex justify-center items-center px-6 py-3 rounded-xl border border-neutral-300 bg-white text-neutral-900 text-sm font-semibold hover:bg-neutral-100 transition-colors"
                  >
                    Open Seller Dashboard
                  </Link>
                </div>
              </div>
            ) : (
              /* The Deletion Request Form */
              <div className="rounded-3xl border border-neutral-200 bg-white p-6 sm:p-10 shadow-sm">
                <div className="mb-8">
                  <span className="text-xs font-bold uppercase tracking-wider text-red-600">
                    Account Closure Form
                  </span>
                  <h2 className="text-2xl font-bold text-neutral-950 mt-1">
                    Submit Deletion Request
                  </h2>
                  <p className="text-sm text-neutral-500 mt-1">
                    Please provide your account details so we can verify your identity and safely schedule data erasure.
                  </p>
                </div>

                {errorMsg && (
                  <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-xs sm:text-sm text-red-800 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <strong className="font-bold block text-red-900">Submission Error</strong>
                      <span>{errorMsg}</span>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Field 1: Registered Email */}
                  <div>
                    <label htmlFor="delete-email" className="block text-xs font-bold text-neutral-900 uppercase tracking-wider mb-1.5">
                      Registered Email Address <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        id="delete-email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@yourbrand.com"
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-neutral-300 bg-white text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                      />
                    </div>
                    <p className="mt-1.5 text-[11px] text-neutral-500">
                      We will send an identity confirmation notice to this email address.
                    </p>
                  </div>

                  {/* Field 2: Account Type */}
                  <div>
                    <label className="block text-xs font-bold text-neutral-900 uppercase tracking-wider mb-2">
                      Account Type <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {[
                        {
                          id: "seller",
                          label: "Seller / Store Owner",
                          desc: "Storefront & Catalog Owner",
                          icon: Store,
                        },
                        {
                          id: "collaborator",
                          label: "Staff / Collaborator",
                          desc: "Store Team Member",
                          icon: Users,
                        },
                        {
                          id: "admin",
                          label: "Admin / Partner",
                          desc: "Platform / Tech Account",
                          icon: Building2,
                        },
                      ].map((item) => {
                        const Icon = item.icon;
                        const isSelected = accountType === item.id;
                        return (
                          <div
                            key={item.id}
                            onClick={() => setAccountType(item.id as AccountType)}
                            className={cn(
                              "p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between",
                              isSelected
                                ? "border-neutral-950 bg-neutral-950 text-white shadow-xs"
                                : "border-neutral-200 bg-neutral-50/50 hover:bg-neutral-100/70 text-neutral-800"
                            )}
                          >
                            <div className="flex items-center justify-between gap-1 mb-2">
                              <Icon className={cn("w-4 h-4", isSelected ? "text-white" : "text-neutral-600")} />
                              <span
                                className={cn(
                                  "w-3.5 h-3.5 rounded-full border flex items-center justify-center",
                                  isSelected ? "border-white bg-white" : "border-neutral-300 bg-transparent"
                                )}
                              >
                                {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-black" />}
                              </span>
                            </div>
                            <div>
                              <p className="text-xs font-bold leading-tight">{item.label}</p>
                              <p className={cn("text-[10px] mt-0.5", isSelected ? "text-neutral-400" : "text-neutral-500")}>
                                {item.desc}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Field 2b: Store Subdomain (Optional for Sellers) */}
                  {(accountType === "seller" || accountType === "collaborator") && (
                    <div className="animate-in fade-in duration-200">
                      <label htmlFor="store-subdomain" className="block text-xs font-bold text-neutral-900 uppercase tracking-wider mb-1.5">
                        Store Address / Subdomain <span className="text-neutral-400 font-normal">(Optional)</span>
                      </label>
                      <div className="flex items-center rounded-xl border border-neutral-300 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-black">
                        <input
                          id="store-subdomain"
                          type="text"
                          value={storeSubdomain}
                          onChange={(e) => setStoreSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                          placeholder="yourstore"
                          className="flex-1 px-3.5 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
                        />
                        <span className="px-3 text-xs font-mono text-neutral-500 bg-neutral-100 border-l border-neutral-200 py-3 select-none">
                          .{siteConfig.domain}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-neutral-500">
                        Helps us pinpoint your store instantly if you operate multiple storefronts.
                      </p>
                    </div>
                  )}

                  {/* Field 3: Reason for Deletion (Optional) */}
                  <div>
                    <label htmlFor="delete-reason" className="block text-xs font-bold text-neutral-900 uppercase tracking-wider mb-1.5">
                      Reason for Deletion <span className="text-neutral-400 font-normal">(Optional)</span>
                    </label>
                    <div className="relative">
                      <select
                        id="delete-reason"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="w-full appearance-none px-3.5 py-3 rounded-xl border border-neutral-300 bg-white text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-black transition-all cursor-pointer pr-10"
                      >
                        {REASONS.map((r, i) => (
                          <option key={r + i} value={i === 0 ? "" : r}>
                            {r}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Field 4: Additional Notes (Optional) */}
                  <div>
                    <label htmlFor="reason-details" className="block text-xs font-bold text-neutral-900 uppercase tracking-wider mb-1.5">
                      Feedback / Notes <span className="text-neutral-400 font-normal">(Optional)</span>
                    </label>
                    <textarea
                      id="reason-details"
                      rows={3}
                      value={reasonDetails}
                      onChange={(e) => setReasonDetails(e.target.value)}
                      placeholder="Help us improve: tell us what didn't work for you or what we could have done better..."
                      className="w-full px-3.5 py-3 rounded-xl border border-neutral-300 bg-white text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-black transition-all resize-y"
                    />
                  </div>

                  {/* Field 5: Confirmation Checkboxes */}
                  <div className="pt-2 border-t border-neutral-100 space-y-3">
                    <label className="flex items-start gap-3 text-xs text-neutral-700 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={confirmPermanent}
                        onChange={(e) => setConfirmPermanent(e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-neutral-300 text-black focus:ring-black accent-black cursor-pointer"
                      />
                      <span>
                        <strong className="text-neutral-950 font-semibold">
                          I understand that deletion is permanent after 30 days.
                        </strong>{" "}
                        All products, themes, custom domains, catalogs, and store access will be permanently destroyed.
                      </span>
                    </label>

                    <label className="flex items-start gap-3 text-xs text-neutral-700 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={confirmOrders}
                        onChange={(e) => setConfirmOrders(e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-neutral-300 text-black focus:ring-black accent-black cursor-pointer"
                      />
                      <span>
                        <strong className="text-neutral-950 font-semibold">
                          I have resolved pending orders and settlements.
                        </strong>{" "}
                        Any pending customer shipments have been fulfilled and payments settled with your payment gateway.
                      </span>
                    </label>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting || !confirmPermanent || !confirmOrders || !email}
                      className={cn(
                        "w-full py-3.5 px-6 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs",
                        isSubmitting || !confirmPermanent || !confirmOrders || !email
                          ? "bg-neutral-200 text-neutral-400 cursor-not-allowed"
                          : "bg-red-600 hover:bg-red-700 text-white hover:shadow-md"
                      )}
                    >
                      {isSubmitting ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Submitting Request...</span>
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4" />
                          <span>Submit Account Deletion Request</span>
                        </>
                      )}
                    </button>
                    <p className="mt-2 text-center text-[11px] text-neutral-500">
                      Protected by Shopersite Data Privacy Safeguards. You can cancel anytime within 30 days.
                    </p>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Right Column: Timeframe, Policies & Regulatory Notices */}
          <div className="lg:col-span-5 space-y-6">
            {/* Timeframe Card */}
            <div className="rounded-3xl border border-neutral-200 bg-white p-6 sm:p-8 shadow-sm">
              <div className="flex items-center gap-2 text-neutral-950 font-bold text-base mb-6">
                <Clock className="w-5 h-5 text-neutral-700" />
                <h3>Account Deletion Timeframe</h3>
              </div>

              {/* Vertical Stepper */}
              <div className="space-y-6 relative before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-0.5 before:bg-neutral-200">
                {/* Step 1 */}
                <div className="relative flex items-start gap-4">
                  <span className="w-9 h-9 rounded-full bg-neutral-950 text-white flex items-center justify-center text-xs font-bold shrink-0 z-10 shadow-2xs">
                    1
                  </span>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                      Day 0–1: Receipt & Deactivation
                    </h4>
                    <p className="text-xs text-neutral-600 leading-relaxed mt-1">
                      A confirmation email with a unique tracking reference is dispatched. The storefront and catalog are
                      placed into deactivation mode to prevent new orders.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="relative flex items-start gap-4">
                  <span className="w-9 h-9 rounded-full bg-neutral-100 border border-neutral-300 text-neutral-900 flex items-center justify-center text-xs font-bold shrink-0 z-10 shadow-2xs">
                    2
                  </span>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                      Day 1–30: Reversible Grace Period
                    </h4>
                    <p className="text-xs text-neutral-600 leading-relaxed mt-1">
                      A 30-day cooling-off window. If you change your mind or submitted accidentally, email support with
                      your reference code to instantly restore full access.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="relative flex items-start gap-4">
                  <span className="w-9 h-9 rounded-full bg-red-100 border border-red-300 text-red-700 flex items-center justify-center text-xs font-bold shrink-0 z-10 shadow-2xs">
                    3
                  </span>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-red-700">
                      Day 31–45: Permanent Data Erasure
                    </h4>
                    <p className="text-xs text-neutral-600 leading-relaxed mt-1">
                      All store configurations, draft products, customer PII, API tokens, and uploaded media are permanently
                      and irreversibly shredded across production and backup nodes.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* What Gets Deleted vs Retained */}
            <div className="rounded-3xl border border-neutral-200 bg-neutral-50/70 p-6 sm:p-8 space-y-4">
              <h3 className="text-sm font-bold text-neutral-950 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-neutral-700" />
                Data Purge & Retention Summary
              </h3>

              <div className="space-y-3 text-xs">
                {/* Permanently Wiped */}
                <div className="p-3.5 rounded-2xl bg-white border border-neutral-200">
                  <span className="font-bold text-red-600 block mb-1">
                    ✕ Permanently Deleted:
                  </span>
                  <ul className="space-y-1 text-neutral-600 list-disc list-inside">
                    <li>Storefront design, layout, and theme presets</li>
                    <li>Product listings, descriptions, and media photos</li>
                    <li>Account credentials, login tokens, and API keys</li>
                    <li>Custom domain mappings and SSL certificates</li>
                    <li>Marketing contacts and WhatsApp automation flows</li>
                  </ul>
                </div>

                {/* Retained for Legal Compliance */}
                <div className="p-3.5 rounded-2xl bg-white border border-neutral-200">
                  <span className="font-bold text-neutral-900 block mb-1">
                    ⚖️ Retained for Statutory Legal Compliance:
                  </span>
                  <p className="text-neutral-600 leading-relaxed">
                    Under Indian tax regulations (Section 44AA of Income Tax Act 1961, Rule 56 of CGST Rules 2017), completed
                    tax invoices, payment transaction IDs, and GST summaries are securely retained for up to 7 years in an
                    encrypted compliance archive solely for statutory auditing.
                  </p>
                </div>
              </div>
            </div>

            {/* Pause Store Alternative */}
            <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center shrink-0 text-neutral-700">
                <Store className="w-5 h-5" />
              </div>
              <div className="text-xs">
                <h4 className="font-bold text-neutral-950 text-sm">Just want to take a break?</h4>
                <p className="text-neutral-600 mt-1 leading-relaxed">
                  You don't need to delete your catalog! You can temporarily turn off your store in Dashboard → Settings →
                  Close Shop to stop receiving orders without losing your design.
                </p>
                <Link
                  href="/dashboard"
                  className="mt-2.5 inline-flex items-center gap-1 font-bold text-neutral-900 hover:underline"
                >
                  <span>Go to Store Settings</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Direct Support Contact */}
            <div className="p-5 rounded-2xl bg-neutral-950 text-white flex items-center justify-between gap-4">
              <div className="text-xs">
                <p className="font-bold text-white text-sm">Need help or advice?</p>
                <p className="text-neutral-400 mt-0.5">Our compliance team is here for you.</p>
              </div>
              <a
                href={`mailto:${siteConfig.supportEmail}?subject=Account Deletion Query`}
                className="px-4 py-2 rounded-xl bg-white text-neutral-950 text-xs font-bold hover:bg-neutral-100 transition-colors shrink-0"
              >
                Email Support
              </a>
            </div>
          </div>
        </div>
      </div>
    </LegalShell>
  );
}

