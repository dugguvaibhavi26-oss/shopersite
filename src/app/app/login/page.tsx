"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Lock, Mail } from "lucide-react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { storeService } from "@/lib/store-service";
import { decideStartPath, markOnboarded } from "@/lib/native/app-start";
import { PhotoHero, AppSheet } from "@/components/app/photo-hero";
import { startNavProgress } from "@/components/nav-progress";
import { AuthButton, AuthDivider, AuthError, AuthInput, GoogleButton, PasswordToggle } from "@/components/auth/auth-shell";

function loginErrorMessage(err: { code?: string; message?: string }): string {
  switch (err.code) {
    case "auth/user-not-found":
    case "auth/invalid-credential":
      return "No account matches that email and password. Check them, or create a shop.";
    case "auth/wrong-password":
      return "That password isn't right. Try again.";
    case "auth/too-many-requests":
      return "Too many attempts. Reset your password or try again later.";
    case "auth/network-request-failed":
      return "You're offline. Connect to the internet and try again.";
    default:
      return err.message || "Couldn't log in. Try again.";
  }
}

/** App login: photo header, white sheet, then straight to the dashboard. */
export default function AppLoginPage() {
  const router = useRouter();
  const { user, signIn, signInWithGoogle } = useAuth();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);

  const enterApp = React.useCallback(
    (uid: string, userEmail?: string | null) => {
      markOnboarded();
      startNavProgress();
      const stores = storeService.getUserStores(uid, userEmail || undefined);
      router.replace(decideStartPath({ loading: false, signedIn: true, storeSubdomain: stores[0]?.subdomain, onboarded: true })!);
    },
    [router]
  );

  // Already signed in (e.g. opened this screen by mistake): go straight in
  React.useEffect(() => {
    if (user) enterApp(user.uid, user.email);
  }, [user, enterApp]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotice(null);
    if (!email || !password) {
      setError("Enter your email and password.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const u = await signIn(email, password);
      enterApp(u.uid, u.email);
    } catch (err: any) {
      setError(loginErrorMessage(err));
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setNotice(null);
    setLoading(true);
    setError(null);
    try {
      const u = await signInWithGoogle();
      enterApp(u.uid, u.email);
    } catch (err: any) {
      if (err?.code !== "auth/popup-closed-by-user") setError(loginErrorMessage(err));
      setLoading(false);
    }
  };

  const handleForgot = async () => {
    setError(null);
    setNotice(null);
    if (!email) {
      setError("Enter your email first, then tap Forgot password.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setNotice(`We've sent a reset link to ${email.trim()}.`);
    } catch (err: any) {
      setError(err?.code === "auth/invalid-email" ? "That email doesn't look right." : loginErrorMessage(err));
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-white">
      <PhotoHero className="h-[30vh] min-h-[190px] shrink-0" />

      <AppSheet className="flex-1">
        <h1 className="text-[2rem] font-semibold leading-[1.05] tracking-[-0.02em]">Welcome back</h1>
        <p className="mt-2 text-[15px] text-neutral-600">Log in to manage your shop, products and orders.</p>

        <div className="mt-6">
          <AuthError message={error} />
          {notice && (
            <p role="status" className="mb-6 rounded-[12px] border border-emerald-200 bg-emerald-50 p-3.5 text-sm text-emerald-800">
              {notice}
            </p>
          )}

          <GoogleButton label="Continue with Google" onClick={handleGoogle} disabled={loading} className="!h-[52px] !rounded-[16px]" />
          <AuthDivider label="or with email" />

          <form onSubmit={handleLogin} className="space-y-4" noValidate>
            <AuthInput
              label="Email"
              icon={Mail}
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              placeholder="you@yourbrand.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <AuthInput
              label="Password"
              icon={Lock}
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              trailing={<PasswordToggle shown={showPassword} onToggle={() => setShowPassword(!showPassword)} />}
            />
            <div className="flex justify-end">
              <button type="button" onClick={handleForgot} className="text-sm font-semibold underline underline-offset-4 !min-h-0">
                Forgot password?
              </button>
            </div>
            <AuthButton type="submit" loading={loading} loadingText="Logging in…" className="!h-[52px] !rounded-[16px]">
              Log in
              <ArrowRight className="h-4 w-4" />
            </AuthButton>
          </form>

          <p className="mt-6 text-center text-sm text-neutral-600">
            New here?{" "}
            <Link href="/register" className="font-semibold text-black underline underline-offset-4">
              Create a shop
            </Link>
          </p>
        </div>
      </AppSheet>
    </div>
  );
}
