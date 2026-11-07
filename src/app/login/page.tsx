"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { storeService } from "@/lib/store-service";
import {
  AuthShell,
  AuthHeading,
  AuthInput,
  AuthButton,
  AuthError,
  AuthDivider,
  GoogleButton,
  PasswordToggle,
  AuthFallback,
  CollageShowcase,
} from "@/components/auth/auth-shell";
import { PaymentCard, SalesChart, OrdersMockup } from "@/components/home/mockups";
import { Lock, Mail, ArrowRight, ShoppingBag, IndianRupee, Users } from "lucide-react";

export default function LoginPage() {
  return (
    <Suspense fallback={<AuthFallback />}>
      <LoginFormContent />
    </Suspense>
  );
}

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // only pages on this site (never another website, which would be a phishing trick)
  const rawRedirect = searchParams.get("redirect") || "";
  const redirectParam = /^\/(?![/\\])/.test(rawRedirect) ? rawRedirect : "/dashboard";

  const { signIn, signInWithGoogle, user } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already logged in, redirect
  React.useEffect(() => {
    if (user) {
      const userStores = storeService.getUserStores(user.uid, user.email || undefined);
      if (userStores.length > 0) {
        router.push(`/dashboard?store=${userStores[0].subdomain}`);
      } else {
        router.push(redirectParam);
      }
    }
  }, [user, router, redirectParam]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const loggedUser = await signIn(email, password);
      const userStores = storeService.getUserStores(loggedUser.uid, loggedUser.email || undefined);
      if (userStores.length > 0) {
        router.push(`/dashboard?store=${userStores[0].subdomain}`);
      } else {
        router.push(redirectParam === "/dashboard" ? "/register" : redirectParam);
      }
    } catch (err: any) {
      console.error("Login error:", err);
      let msg = "Invalid email or password. Please check your credentials.";
      if (err.code === "auth/user-not-found" || err.code === "auth/invalid-credential") {
        msg = "No account found with these credentials. Please check your email or register.";
      } else if (err.code === "auth/wrong-password") {
        msg = "Incorrect password. Please try again.";
      } else if (err.code === "auth/too-many-requests") {
        msg = "Too many failed attempts. Please reset your password or try again later.";
      } else if (err.message) {
        msg = err.message;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const loggedUser = await signInWithGoogle();
      const userStores = storeService.getUserStores(loggedUser.uid, loggedUser.email || undefined);
      if (userStores.length > 0) {
        router.push(`/dashboard?store=${userStores[0].subdomain}`);
      } else {
        router.push(redirectParam === "/dashboard" ? "/register" : redirectParam);
      }
    } catch (err: any) {
      console.error("Google login error:", err);
      if (err.code !== "auth/popup-closed-by-user") {
        setError(err.message || "Failed to sign in with Google.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell topLink={{ text: "New here?", label: "Start for free", href: "/register" }} aside={<LoginShowcase />}>
      <AuthHeading
        eyebrow="Seller login"
        title="Welcome back."
        text="Log in to manage your store, products and orders."
      />

      <AuthError message={error} />

      <GoogleButton label="Continue with Google" onClick={handleGoogleSignIn} disabled={loading} />

      <AuthDivider label="or log in with email" />

      <form onSubmit={handleLogin} className="space-y-5">
        <AuthInput
          label="Email"
          icon={Mail}
          type="email"
          autoComplete="email"
          placeholder="you@yourbrand.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <AuthInput
          label="Password"
          icon={Lock}
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          trailing={<PasswordToggle shown={showPassword} onToggle={() => setShowPassword(!showPassword)} />}
          required
        />

        <AuthButton type="submit" loading={loading} loadingText="Logging in…" className="!mt-7">
          Log in
          <ArrowRight className="w-4 h-4" />
        </AuthButton>
      </form>

      <p className="mt-8 text-sm text-neutral-600 text-center">
        Don&apos;t have a store yet?{" "}
        <Link href="/register" className="font-semibold text-black underline underline-offset-4 hover:no-underline">
          Create one free
        </Link>
      </p>
    </AuthShell>
  );
}

function LoginShowcase() {
  const stats = [
    { icon: ShoppingBag, value: "12", label: "new orders" },
    { icon: IndianRupee, value: "₹18,450", label: "revenue" },
    { icon: Users, value: "1,204", label: "visitors" },
  ];
  return (
    <CollageShowcase
      intro={
        <>
          <h2 className="text-4xl xl:text-5xl [@media(max-height:760px)]:text-3xl font-semibold leading-[1.05]">
            Your shop never sleeps.
          </h2>
          {/* today's numbers, styled like the grid boxes behind them */}
          <div className="mt-7 grid grid-cols-3 gap-3 max-w-md [@media(max-height:700px)]:hidden">
            {stats.map(({ icon: Icon, value, label }) => (
              <div
                key={label}
                className="rounded-[12px] border border-white/15 bg-white/[0.05] backdrop-blur-sm px-4 py-3.5 transition-colors duration-300 hover:bg-white/10 hover:border-white/30"
              >
                <Icon className="w-4 h-4 text-white/50" />
                <div className="mt-2 text-xl font-semibold tracking-tight">{value}</div>
                <div className="mt-0.5 text-xs text-white/55">{label} today</div>
              </div>
            ))}
          </div>
        </>
      }
    >
      <div className="relative w-full max-w-[460px] mx-auto mb-16 [@media(max-height:700px)]:mb-0">
        {/* dark sales chart floating off the top-right corner */}
        <div className="absolute -top-24 -right-4 sm:-right-24 z-10 w-48 animate-float-gentle" style={{ rotate: "3deg" }}>
          <SalesChart dark className="border border-white/15 shadow-[0_24px_50px_-16px_rgba(0,0,0,0.9)] !p-4" />
        </div>

        <OrdersMockup className="shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)]" />

        {/* payment notification floating off the bottom-left corner */}
        <div className="absolute -bottom-24 -left-4 sm:-left-24 z-10 animate-float-gentle" style={{ rotate: "-3deg", animationDelay: "1.4s" }}>
          <PaymentCard className="w-52 shadow-[0_24px_50px_-16px_rgba(0,0,0,0.9)] [@media(max-height:700px)]:hidden" />
        </div>
      </div>
    </CollageShowcase>
  );
}
