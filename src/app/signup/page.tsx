"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
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
  GlassCard,
} from "@/components/auth/auth-shell";
import { OrderCard } from "@/components/home/mockups";
import { Lock, Mail, User, ArrowRight, Check } from "lucide-react";

export default function SignUpPage() {
  return (
    <Suspense fallback={<AuthFallback />}>
      <SignUpFormContent />
    </Suspense>
  );
}

function SignUpFormContent() {
  const router = useRouter();
  const { signUp, signInWithGoogle, user } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already logged in, take them to store creation
  React.useEffect(() => {
    if (user) {
      router.push("/register");
    }
  }, [user, router]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await signUp(email, password, name);
      router.push("/register");
    } catch (err: any) {
      console.error("Sign up error:", err);
      let msg = "Failed to create account. Please try again.";
      if (err.code === "auth/email-already-in-use") {
        msg = "An account with this email already exists. Please sign in instead.";
      } else if (err.code === "auth/weak-password") {
        msg = "Password is too weak. Please use at least 6 characters.";
      } else if (err.code === "auth/invalid-email") {
        msg = "Please enter a valid email address.";
      } else if (err.message) {
        msg = err.message;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
      router.push("/register");
    } catch (err: any) {
      console.error("Google sign up error:", err);
      if (err.code !== "auth/popup-closed-by-user") {
        setError(err.message || "Failed to sign up with Google.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell topLink={{ text: "Already have an account?", label: "Log in", href: "/login" }} aside={<SignUpShowcase />}>
      <AuthHeading
        eyebrow="Create account"
        title="Start selling today."
        text="Free forever plan. No credit card required."
      />

      <AuthError message={error} />

      <GoogleButton label="Sign up with Google" onClick={handleGoogleSignUp} disabled={loading} />

      <AuthDivider label="or sign up with email" />

      <form onSubmit={handleSignUp} className="space-y-5">
        <AuthInput
          label="Full name"
          icon={User}
          type="text"
          autoComplete="name"
          placeholder="e.g. Ramesh Chandra"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

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
          autoComplete="new-password"
          placeholder="At least 6 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          trailing={<PasswordToggle shown={showPassword} onToggle={() => setShowPassword(!showPassword)} />}
          hint="Must be at least 6 characters long."
          required
        />

        <AuthButton type="submit" loading={loading} loadingText="Creating account…" className="!mt-7">
          Create account
          <ArrowRight className="w-4 h-4" />
        </AuthButton>
      </form>

      <p className="mt-8 text-sm text-neutral-600 text-center">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-black underline underline-offset-4 hover:no-underline">
          Log in
        </Link>
      </p>
    </AuthShell>
  );
}

function SignUpShowcase() {
  return (
    <CollageShowcase>
      <div className="relative">
        <GlassCard>
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">Free forever plan</span>
          <h2 className="mt-2 text-3xl font-semibold leading-[1.05]">Everything you need to sell online.</h2>
          <ul className="mt-6 space-y-3.5 text-sm text-neutral-700">
            {["Your own store on a free subdomain", "UPI payments direct to your bank", "0% commission on every sale", "Designer themes, ready to go"].map((t) => (
              <li key={t} className="group/li flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center shrink-0 transition-transform duration-300 group-hover/li:scale-110">
                  <Check className="w-3.5 h-3.5" />
                </span>
                <span className="transition-transform duration-300 group-hover/li:translate-x-1">{t}</span>
              </li>
            ))}
          </ul>
        </GlassCard>
        <OrderCard className="absolute -top-12 -right-4 sm:-right-10 animate-float-gentle" />
      </div>
    </CollageShowcase>
  );
}
