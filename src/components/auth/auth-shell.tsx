"use client";

import * as React from "react";
import Link from "next/link";
import { siteConfig } from "@/lib/config/site";
import { cn } from "@/lib/utils";
import { ShopperLogo } from "@/components/brand/shopper-logo";
import { useNativeApp } from "@/lib/native/use-native-app";
import { AlertCircle, Loader2 } from "lucide-react";

/**
 * Split-screen layout shared by login, signup and store registration:
 * an animated showcase on the left (hidden on phones), form on the right.
 */
export function AuthShell({
  topLink,
  aside,
  children,
}: {
  topLink: { text: string; label: string; href: string };
  aside: React.ReactNode;
  children: React.ReactNode;
}) {
  // In the Android/iOS app: form starts near the top (like an app screen), no website footer
  const nativeApp = useNativeApp();
  return (
    <div className="home-sans min-h-screen bg-white text-neutral-950 font-[Inter,sans-serif] grid md:grid-cols-2">
      <div className="flex flex-col md:min-h-screen">
        <header className="h-16 sm:h-20 px-5 sm:px-10 flex items-center justify-between gap-4">
          <Link href="/" className="group/logo flex items-center">
            <ShopperLogo
              className="text-[20px]"
              markClassName="origin-bottom transition-transform duration-500 group-hover/logo:-rotate-12 group-hover/logo:scale-110"
            />
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-neutral-500 hidden sm:inline">{topLink.text}</span>
            <Link
              href={topLink.href}
              className="inline-flex items-center px-4 py-2 rounded-[14px] border border-neutral-300 font-semibold hover:border-black hover:bg-black hover:text-white transition-all duration-300"
            >
              {topLink.label}
            </Link>
          </div>
        </header>

        <main
          className={cn(
            "flex-1 flex justify-center px-5 sm:px-10",
            nativeApp ? "items-start pt-4 pb-[calc(2rem+env(safe-area-inset-bottom))]" : "items-center py-10"
          )}
        >
          <div className="hero-rise w-full max-w-[420px]">{children}</div>
        </main>

        <footer className={cn(nativeApp && "hidden", "px-5 sm:px-10 py-6 flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-500")}>
          <span>© {new Date().getFullYear()} {siteConfig.name}</span>
          <span>Secure sign-in · Payments go direct to your bank</span>
        </footer>
      </div>

      {/* flush to the screen edges — no white frame. Decorative, so hidden on phones
          where it would only push the form around. */}
      <aside className="hidden md:block md:order-first">
        <div className="sticky top-0 h-screen bg-black overflow-hidden">
          {aside}
        </div>
      </aside>
    </div>
  );
}

// Box grid behind the showcase. Deterministic pseudo-random picks keep server and
// client renders identical (no hydration mismatch).
const GRID_CELLS = 26 * 22;
const rand = (i: number) => ((i * 9301 + 49297) % 233280) / 233280;

/**
 * Black showcase panel: a grid of thin-outlined boxes where some glow on and off,
 * boxes light up under the mouse, plus a soft spotlight. Page-specific cards sit on top.
 *
 * With `intro`, the intro text sits at the top-left and `children` at the bottom;
 * without it, `children` is centred.
 */
export function CollageShowcase({ children, intro }: { children: React.ReactNode; intro?: React.ReactNode }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || e.pointerType !== "mouse") return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  };

  return (
    <div ref={ref} onPointerMove={onMove} className="absolute inset-0 bg-black">
      <div aria-hidden className="absolute inset-0 overflow-hidden">
        {/* box grid */}
        <div className="absolute inset-0 flex flex-wrap content-start">
          {Array.from({ length: GRID_CELLS }, (_, i) => {
            const r = rand(i);
            return (
              <div
                key={i}
                className={cn(
                  "w-14 h-14 shrink-0 border-r border-b border-white/[0.11] transition-colors duration-1000 hover:bg-white/20 hover:duration-0",
                  r < 0.11 && "fx-cell-glow",
                  r > 0.96 && "bg-white/[0.06]"
                )}
                style={r < 0.11 ? { animationDelay: `${(r * 90).toFixed(2)}s`, animationDuration: `${6 + rand(i + 7) * 6}s` } : undefined}
              />
            );
          })}
        </div>

        {/* mouse spotlight */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(380px_circle_at_var(--mx,50%)_var(--my,40%),rgba(255,255,255,0.08),transparent_60%)]" />
      </div>

      {intro ? (
        <div className="pointer-events-none absolute inset-0 flex flex-col gap-8 p-8 sm:p-12 xl:p-16">
          <div className="pointer-events-auto w-full max-w-2xl text-white">{intro}</div>
          {/* fills the rest of the panel; children decide how tall to grow */}
          <div className="pointer-events-auto w-full max-w-2xl flex-1 min-h-0 flex flex-col justify-end">{children}</div>
        </div>
      ) : (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6 sm:p-10">
          <div className="pointer-events-auto w-full max-w-md">{children}</div>
        </div>
      )}
    </div>
  );
}

/** White floating card used on top of the black showcase panel. */
export function GlassCard({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "rounded-[17px] bg-white shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)] p-6 sm:p-7 transition-transform duration-500 hover:-translate-y-1",
        className
      )}
    >
      {children}
    </div>
  );
}

export function AuthHeading({ eyebrow, title, text }: { eyebrow?: string; title: string; text?: string }) {
  return (
    <div className="mb-8">
      {eyebrow && (
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">{eyebrow}</span>
      )}
      <h1 className="mt-2 text-4xl sm:text-[2.75rem] font-semibold leading-[1.05]">{title}</h1>
      {text && <p className="mt-3 text-neutral-600 leading-relaxed">{text}</p>}
    </div>
  );
}

export interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  hint?: React.ReactNode;
  trailing?: React.ReactNode;
  suffix?: React.ReactNode;
}

export const AuthInput = React.forwardRef<HTMLInputElement, AuthInputProps>(
  ({ label, icon: Icon, hint, trailing, suffix, className, id, disabled, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;
    return (
      <div>
        <label htmlFor={inputId} className="block text-sm font-semibold mb-2">
          {label}
        </label>
        <div
          className={cn(
            "flex items-center h-12 rounded-[12px] border border-neutral-300 bg-white transition-colors",
            "focus-within:border-black focus-within:ring-4 focus-within:ring-black/5",
            disabled && "bg-neutral-50 text-neutral-500"
          )}
        >
          {Icon && <Icon className="w-4 h-4 text-neutral-400 ml-4 shrink-0" />}
          <input
            id={inputId}
            ref={ref}
            disabled={disabled}
            className={cn(
              "flex-1 min-w-0 h-full bg-transparent px-4 text-[15px] placeholder:text-neutral-400 focus:outline-none !min-h-0",
              Icon && "pl-3",
              className
            )}
            {...props}
          />
          {suffix && (
            <span className="h-full flex items-center px-4 border-l border-neutral-200 bg-neutral-50 rounded-r-[12px] text-sm text-neutral-500 shrink-0">
              {suffix}
            </span>
          )}
          {trailing && <span className="pr-3 flex items-center shrink-0">{trailing}</span>}
        </div>
        {hint && <p className="mt-1.5 text-xs text-neutral-500">{hint}</p>}
      </div>
    );
  }
);
AuthInput.displayName = "AuthInput";

export function AuthButton({
  loading,
  loadingText,
  variant = "primary",
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  loadingText?: string;
  variant?: "primary" | "outline";
}) {
  return (
    <button
      disabled={loading || props.disabled}
      className={cn(
        "w-full h-12 rounded-[14px] text-[15px] font-semibold inline-flex items-center justify-center gap-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed",
        variant === "primary"
          ? "bg-black text-white hover:bg-neutral-800"
          : "border border-neutral-300 bg-white text-black hover:border-black",
        className
      )}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </button>
  );
}

export function AuthError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div role="alert" className="mb-6 p-3.5 rounded-[12px] bg-red-50 border border-red-200 flex items-start gap-2.5 text-sm text-red-700">
      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
      <span>{message}</span>
    </div>
  );
}

export function AuthDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-4 my-6 text-xs text-neutral-500">
      <span className="flex-1 h-px bg-neutral-200" />
      {label}
      <span className="flex-1 h-px bg-neutral-200" />
    </div>
  );
}

export function GoogleButton({ label, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <AuthButton type="button" variant="outline" {...props}>
      <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden>
        <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z" />
        <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.33 24 12 24z" />
        <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.15 0 9.99 0 12s.45 3.85 1.24 5.42l4.04-3.15z" />
        <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
      </svg>
      {label}
    </AuthButton>
  );
}

export function PasswordToggle({ shown, onToggle }: { shown: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={shown ? "Hide password" : "Show password"}
      className="text-xs font-semibold text-neutral-500 hover:text-black px-2 py-1 !min-h-0"
    >
      {shown ? "Hide" : "Show"}
    </button>
  );
}

export function AuthFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <Loader2 className="w-6 h-6 animate-spin" />
    </div>
  );
}
