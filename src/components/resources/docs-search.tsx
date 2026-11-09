"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CornerDownLeft, FileText, Search } from "lucide-react";

export interface SearchEntry {
  href: string;
  title: string;
  summary: string;
  group: string;
  /** lower-case text searched (title, summary, keywords, body) */
  text: string;
}

/** Instant search across the Help Center and guides. The index is built on the server and passed in. */
export function DocsSearch({ entries, size = "lg", placeholder = "Search help articles and guides" }: { entries: SearchEntry[]; size?: "lg" | "sm"; placeholder?: string }) {
  const router = useRouter();
  const [q, setQ] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState(0);
  const box = React.useRef<HTMLDivElement>(null);

  const results = React.useMemo(() => {
    const words = q.toLowerCase().split(/\s+/).filter((w) => w.length > 1);
    if (!words.length) return [];
    return entries
      .map((e) => {
        let score = 0;
        const title = e.title.toLowerCase();
        for (const w of words) {
          if (!e.text.includes(w)) return { e, score: -1 };
          if (title.includes(w)) score += 5;
          if (e.summary.toLowerCase().includes(w)) score += 2;
          score += 1;
        }
        return { e, score };
      })
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 7)
      .map((r) => r.e);
  }, [q, entries]);

  React.useEffect(() => {
    const away = (ev: PointerEvent) => box.current && !box.current.contains(ev.target as Node) && setOpen(false);
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, []);

  const lg = size === "lg";
  return (
    <div ref={box} className="relative w-full">
      <label className={`flex items-center gap-3 border bg-white transition-shadow focus-within:border-neutral-950 focus-within:shadow-[0_0_0_4px_rgba(0,0,0,0.06)] ${lg ? "h-14 rounded-2xl border-neutral-200 px-5 shadow-[0_18px_40px_-28px_rgba(0,0,0,0.35)]" : "h-10 rounded-xl border-neutral-200 px-3"}`}>
        <Search className={`shrink-0 text-neutral-400 ${lg ? "h-5 w-5" : "h-4 w-4"}`} />
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
            setActive(0);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((a) => Math.min(results.length - 1, a + 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(0, a - 1));
            } else if (e.key === "Enter" && results[active]) {
              router.push(results[active].href);
              setOpen(false);
            } else if (e.key === "Escape") setOpen(false);
          }}
          placeholder={placeholder}
          aria-label="Search"
          className={`w-full bg-transparent outline-none placeholder:text-neutral-400 ${lg ? "text-[16px]" : "text-[14px]"}`}
        />
        {lg && <kbd className="hidden rounded-md border border-neutral-200 px-1.5 py-0.5 text-[11px] text-neutral-400 sm:block">Enter</kbd>}
      </label>
      {open && q.trim().length > 1 && (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 overflow-hidden rounded-2xl border border-neutral-200 bg-white text-left shadow-[0_30px_60px_-24px_rgba(0,0,0,0.35)]">
          {results.length ? (
            <ul className="max-h-[60vh] overflow-y-auto p-1.5">
              {results.map((r, i) => (
                <li key={r.href}>
                  <Link
                    href={r.href}
                    onClick={() => setOpen(false)}
                    onMouseEnter={() => setActive(i)}
                    className={`flex items-start gap-3 rounded-xl px-3 py-2.5 ${i === active ? "bg-neutral-100" : ""}`}
                  >
                    <FileText className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] font-semibold text-neutral-950">{r.title}</span>
                      <span className="block truncate text-[12.5px] text-neutral-500">{r.summary}</span>
                    </span>
                    <span className="hidden shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-500 sm:block">{r.group}</span>
                    {i === active && <CornerDownLeft className="mt-1 hidden h-3.5 w-3.5 shrink-0 text-neutral-400 sm:block" />}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-6 text-[14px] text-neutral-500">No results for “{q.trim()}”. Try a simpler word, like “payments” or “shipping”.</p>
          )}
        </div>
      )}
    </div>
  );
}
