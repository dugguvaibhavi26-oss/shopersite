"use client";

import * as React from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { LogOut, Mail } from "lucide-react";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import type { OrderData } from "@/lib/store-service";
import { checkEmail, checkPassword, checkPersonName } from "@/lib/validation";
import { cn } from "@/lib/utils";
import { useSite } from "./context";

const authMessage = (code: string): string =>
  ({
    "auth/invalid-credential": "Wrong email or password.",
    "auth/wrong-password": "Wrong email or password.",
    "auth/user-not-found": "Wrong email or password.",
    "auth/email-already-in-use": "There's already an account with this email. Sign in instead.",
    "auth/too-many-requests": "Too many tries. Please wait a few minutes, or reset your password.",
    "auth/network-request-failed": "No internet connection. Check it and try again.",
    "auth/popup-blocked": "Your browser blocked the Google window. Allow pop-ups and try again.",
    "auth/weak-password": "Choose a stronger password.",
  })[code] || "Couldn't sign you in. Please try again.";

/** The signed-in buyer's orders at this shop, from any device. */
export function useAccountOrders(): OrderData[] | null {
  const { store, demo, editing } = useSite();
  const { user } = useAuth();
  const [orders, setOrders] = React.useState<OrderData[] | null>(null);
  React.useEffect(() => {
    if (!user || demo || editing) {
      setOrders(null);
      return;
    }
    let live = true;
    user
      .getIdToken()
      .then((t) =>
        fetch("/api/orders/mine", { method: "POST", headers: { "content-type": "application/json", Authorization: `Bearer ${t}` }, body: JSON.stringify({ store: store.subdomain }), cache: "no-store" })
      )
      .then((r) => (r.ok ? r.json() : { orders: [] }))
      .then((b) => live && setOrders(b.orders || []))
      .catch(() => live && setOrders([]));
    return () => {
      live = false;
    };
  }, [user, store.subdomain, demo, editing]);
  return orders;
}

/** Sign in / create an account on the shop: Google, or email and password (with a reset link). */
export function BuyerAuth() {
  const { store, demo, editing } = useSite();
  const { user, signIn, signUp, signInWithGoogle, signOut } = useAuth();
  const [mode, setMode] = React.useState<"in" | "up">("in");
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [agree, setAgree] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");
  const [note, setNote] = React.useState("");

  if (demo || editing) return null;

  if (user) {
    return (
      <div className="m-soft flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4 text-[length:calc(14px*var(--m-scale))]">
        <span className="min-w-0">
          <span className="block font-semibold">Signed in{user.displayName ? ` as ${user.displayName}` : ""}</span>
          <span className="m-muted block truncate">
            {user.email}
            {user.email && !user.emailVerified && user.providerData.every((p) => p.providerId === "password") ? " · confirm your email to see older orders" : ""}
          </span>
        </span>
        <button type="button" onClick={() => signOut()} className="m-btn m-btn-outline h-10 px-4">
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>
    );
  }

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setError("");
    setNote("");
    try {
      await fn();
    } catch (e) {
      const code = (e as { code?: string })?.code || "";
      if (code !== "auth/popup-closed-by-user" && code !== "auth/cancelled-popup-request") setError(authMessage(code));
    } finally {
      setBusy(false);
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const wrong =
      (mode === "up" ? checkPersonName(name) : "") || checkEmail(email) || (mode === "up" ? checkPassword(password) : password ? "" : "Enter your password.") || (mode === "up" && !agree ? "Please agree to the shop's terms and privacy policy." : "");
    if (wrong) return setError(wrong);
    run(() => (mode === "in" ? signIn(email.trim().toLowerCase(), password) : signUp(email.trim().toLowerCase(), password, name.trim())));
  };

  const forgot = () => {
    const wrong = checkEmail(email);
    if (wrong) return setError(email ? wrong : "Enter your email above, then tap Forgot password.");
    run(async () => {
      try {
        await sendPasswordResetEmail(auth, email.trim().toLowerCase(), { url: window.location.href });
      } catch (e) {
        if ((e as { code?: string })?.code === "auth/too-many-requests") throw e;
      }
      // same answer whether or not the email has an account
      setNote(`If ${email.trim()} has an account, a reset link is on its way. Check your inbox and spam.`);
    });
  };

  return (
    <div className="m-line rounded-3xl border p-5 sm:p-6 text-[length:calc(14px*var(--m-scale))]">
      <div className="flex items-center justify-between gap-3">
        <h2 className="m-h text-[length:calc(18px*var(--m-scale))]">{mode === "in" ? "Sign in" : "Create an account"}</h2>
        <button type="button" onClick={() => (setMode(mode === "in" ? "up" : "in"), setError(""), setNote(""))} className="font-medium underline underline-offset-4">
          {mode === "in" ? "New here? Create account" : "Have an account? Sign in"}
        </button>
      </div>
      <p className="m-muted mt-1">See your orders from {store.name} on any device.</p>
      <button type="button" disabled={busy} onClick={() => run(signInWithGoogle)} className="m-btn m-btn-outline mt-4 h-11 w-full">
        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
          <path fill="#EA4335" d="M12 10.2v3.9h5.4c-.2 1.3-1.6 3.9-5.4 3.9-3.3 0-5.9-2.7-5.9-6s2.7-6 5.9-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.4 14.6 2.4 12 2.4 6.7 2.4 2.4 6.7 2.4 12s4.3 9.6 9.6 9.6c5.5 0 9.2-3.9 9.2-9.4 0-.6-.1-1.1-.2-1.6H12z" />
        </svg>
        Continue with Google
      </button>
      <div className="m-faint my-4 flex items-center gap-3 text-[length:calc(12px*var(--m-scale))]">
        <span className="m-line h-px flex-1 border-t" /> or with email <span className="m-line h-px flex-1 border-t" />
      </div>
      <form onSubmit={submit} noValidate className="grid gap-3">
        {mode === "up" && <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" autoComplete="name" maxLength={60} className="m-field" aria-label="Full name" />}
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email" autoComplete="email" maxLength={200} className="m-field" aria-label="Email" />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          placeholder={mode === "up" ? "Password (8+ characters, with a number)" : "Password"}
          autoComplete={mode === "up" ? "new-password" : "current-password"}
          maxLength={128}
          className="m-field"
          aria-label="Password"
        />
        {mode === "up" && (
          <label className="flex items-start gap-2.5 text-[length:calc(13px*var(--m-scale))]">
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--m-text)]" style={{ minHeight: 0, minWidth: 0 }} />
            <span className="m-muted">I agree to the shop&apos;s terms and privacy policy.</span>
          </label>
        )}
        {error && <p className="text-[length:calc(13px*var(--m-scale))] text-red-600">{error}</p>}
        {note && (
          <p className="flex items-start gap-2 rounded-xl bg-[color-mix(in_srgb,var(--m-text)_6%,transparent)] p-3 text-[length:calc(13px*var(--m-scale))]">
            <Mail className="mt-0.5 h-4 w-4 shrink-0" /> {note}
          </p>
        )}
        <button type="submit" disabled={busy} className={cn("m-btn h-11", busy && "opacity-60")}>
          {busy ? "Please wait…" : mode === "in" ? "Sign in" : "Create account"}
        </button>
        {mode === "in" && (
          <button type="button" onClick={forgot} className="m-muted justify-self-start text-[length:calc(13px*var(--m-scale))] underline underline-offset-4">
            Forgot password?
          </button>
        )}
      </form>
    </div>
  );
}
