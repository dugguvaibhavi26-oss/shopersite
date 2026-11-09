"use client";

import * as React from "react";
import { useAuth } from "@/lib/auth-context";
import { SiteFooter, SiteHeader } from "@/components/home/site-chrome";

/** The marketing site's header and footer around the legal pages (same chrome as the theme marketplace). */
export function LegalShell({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  return (
    <div className="home-sans flex min-h-screen flex-col overflow-x-clip bg-white font-[Inter,sans-serif] text-neutral-950">
      <SiteHeader user={!!user} onSignOut={() => signOut()} />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}

/** Highlights the section being read in the "On this page" list. */
export function LegalToc({ items }: { items: { id: string; title: string }[] }) {
  const [active, setActive] = React.useState(items[0]?.id || "");
  React.useEffect(() => {
    const els = items.map((i) => document.getElementById(i.id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-96px 0px -65% 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [items]);
  return (
    <ol className="space-y-1 border-l border-neutral-200 text-[13px]">
      {items.map((i, n) => (
        <li key={i.id}>
          <a
            href={`#${i.id}`}
            className={`-ml-px block border-l-2 py-1 pl-3 leading-snug transition-colors ${
              active === i.id ? "border-neutral-950 font-semibold text-neutral-950" : "border-transparent text-neutral-500 hover:text-neutral-950"
            }`}
          >
            <span className="tabular-nums text-neutral-400">{n + 1}.</span> {i.title}
          </a>
        </li>
      ))}
    </ol>
  );
}

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex h-9 items-center rounded-[10px] border border-neutral-200 px-3 text-[13px] font-medium text-neutral-700 transition-colors hover:border-neutral-950 hover:text-neutral-950 print:hidden"
    >
      Print or save as PDF
    </button>
  );
}
