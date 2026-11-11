"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthShell, AuthHeading, AuthInput, AuthButton, AuthError, PasswordToggle, CollageShowcase } from "@/components/auth/auth-shell";
import { OrdersMockup } from "@/components/home/mockups";
import { isStoreCode, STAFF_ROLES, STAFF_ROLE_IDS } from "@/lib/staff/roles";
import { ArrowRight, Hash, Lock, Mail } from "lucide-react";

/** Sign-in for a store's team members: the store's 5-digit ID, their email and their password. */
export default function StaffLoginPage() {
  const router = useRouter();
  const [storeCode, setStoreCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!isStoreCode(storeCode)) return setError("The store ID is 5 digits. Ask the store owner for it.");
    setLoading(true);
    try {
      const res = await fetch("/api/staff/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeCode, email: email.trim().toLowerCase(), password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not sign in. Try again.");
      router.replace("/staff");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in. Try again.");
      setLoading(false);
    }
  };

  return (
    <AuthShell topLink={{ text: "Own the store?", label: "Seller login", href: "/login" }} aside={<StaffShowcase />}>
      <AuthHeading eyebrow="Staff login" title="Sign in to your store." text="Use the store ID, email and password the store owner gave you." />

      <AuthError message={error} />

      <form onSubmit={submit} className="space-y-5">
        <AuthInput
          label="Store ID"
          icon={Hash}
          inputMode="numeric"
          autoComplete="off"
          placeholder="5 digits, like 48213"
          maxLength={5}
          value={storeCode}
          onChange={(e) => setStoreCode(e.target.value.replace(/\D/g, "").slice(0, 5))}
          required
        />
        <AuthInput
          label="Email"
          icon={Mail}
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <AuthInput
          label="Password"
          icon={Lock}
          type={show ? "text" : "password"}
          autoComplete="current-password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          trailing={<PasswordToggle shown={show} onToggle={() => setShow(!show)} />}
          required
        />
        <AuthButton type="submit" loading={loading} loadingText="Signing in…" className="!mt-7">
          Sign in
          <ArrowRight className="w-4 h-4" />
        </AuthButton>
      </form>

      <p className="mt-8 text-center text-sm text-neutral-600">
        Forgot your password? Ask the store owner to set a new one.{" "}
        <Link href="/login" className="font-semibold text-black underline underline-offset-4 hover:no-underline">
          I own the store
        </Link>
      </p>
    </AuthShell>
  );
}

function StaffShowcase() {
  return (
    <CollageShowcase
      intro={
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-white/60">One store, one team</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">Everyone sees only their own work.</h2>
          <ul className="mt-5 space-y-2 text-sm text-white/75">
            {STAFF_ROLE_IDS.map((r) => (
              <li key={r}>
                <span className="font-semibold text-white">{STAFF_ROLES[r].label}</span>
              </li>
            ))}
          </ul>
        </div>
      }
    >
      <OrdersMockup />
    </CollageShowcase>
  );
}
