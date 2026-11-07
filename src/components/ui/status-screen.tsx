import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Action = { label: string; href?: string; onClick?: () => void; variant?: "primary" | "outline"; external?: boolean };

const btn = {
  primary: "bg-black text-white hover:bg-neutral-800",
  outline: "border border-neutral-300 bg-white text-black hover:border-black",
};

/**
 * Full-screen message in the app's style (white, sans, black rounded buttons). Used for 404s,
 * errors and "not found" states so every hidden page looks like the rest of the product.
 */
export function StatusScreen({
  icon: Icon,
  eyebrow,
  title,
  text,
  actions = [],
  className,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  eyebrow?: string;
  title: string;
  text?: React.ReactNode;
  actions?: Action[];
  className?: string;
}) {
  return (
    <div className={cn("home-sans min-h-screen flex items-center justify-center bg-white px-6 py-12 font-[Inter,sans-serif] text-neutral-950", className)}>
      <div className="w-full max-w-sm text-center hero-rise">
        {Icon && (
          <span className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100 text-black">
            <Icon className="h-6 w-6" />
          </span>
        )}
        {eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">{eyebrow}</p>}
        <h1 className="mt-2 text-[1.75rem] font-semibold leading-[1.1] tracking-[-0.02em]">{title}</h1>
        {text && <p className="mt-3 text-[15px] leading-relaxed text-neutral-600">{text}</p>}
        {actions.length > 0 && (
          <div className="mt-8 flex flex-col gap-3">
            {actions.map((a) => {
              const cls = cn(
                "inline-flex h-[52px] w-full items-center justify-center rounded-[16px] text-[15px] font-semibold transition-colors",
                btn[a.variant || "primary"]
              );
              if (a.href) {
                return a.external ? (
                  <a key={a.label} href={a.href} target="_blank" rel="noreferrer" className={cls}>
                    {a.label}
                  </a>
                ) : (
                  <Link key={a.label} href={a.href} className={cls}>
                    {a.label}
                  </Link>
                );
              }
              return (
                <button key={a.label} type="button" onClick={a.onClick} className={cls}>
                  {a.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
