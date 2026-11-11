"use client";

import * as React from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { getFeature, searchFeatures } from "@/lib/dashboard-features";

/**
 * A dropdown of every dashboard feature, with a search box. `value` is a feature id, or "" for
 * `noneLabel` (when given, the first row lets the admin clear the choice).
 */
export function FeaturePicker({ value, onChange, noneLabel }: { value: string; onChange: (id: string) => void; noneLabel?: string }) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const box = React.useRef<HTMLDivElement>(null);
  const input = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!open) return;
    input.current?.focus();
    const away = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  const current = getFeature(value);
  const found = searchFeatures(query);
  const groups = [...new Set(found.map((f) => f.group))];
  const pick = (id: string) => {
    onChange(id);
    setOpen(false);
    setQuery("");
  };

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-haspopup="listbox"
        aria-expanded={open}
        style={{ minHeight: 0 }}
        className="flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-neutral-200 bg-white px-3 text-left text-sm outline-none hover:border-neutral-400 focus:border-neutral-900"
      >
        <span className={`truncate ${current ? "text-neutral-900" : "text-neutral-400"}`}>{current ? current.label : noneLabel || "Choose a feature"}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-neutral-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-[0_18px_40px_-18px_rgba(0,0,0,0.35)]">
          <label className="flex items-center gap-2 border-b border-neutral-100 px-3">
            <Search className="h-4 w-4 shrink-0 text-neutral-400" />
            <input
              ref={input}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (found[0]) pick(found[0].id);
                }
              }}
              placeholder="Search features, e.g. payments"
              aria-label="Search features"
              className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-neutral-400"
            />
          </label>
          <ul role="listbox" className="max-h-64 overflow-y-auto py-1">
            {noneLabel && !query && (
              <li>
                <button type="button" role="option" aria-selected={!value} onClick={() => pick("")} style={{ minHeight: 0 }} className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm text-neutral-600 hover:bg-neutral-50">
                  {noneLabel}
                  {!value && <Check className="h-4 w-4 text-neutral-900" />}
                </button>
              </li>
            )}
            {groups.map((g) => (
              <li key={g}>
                <p className="px-3 pb-1 pt-2.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">{g}</p>
                {found
                  .filter((f) => f.group === g)
                  .map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      role="option"
                      aria-selected={f.id === value}
                      onClick={() => pick(f.id)}
                      style={{ minHeight: 0 }}
                      className="flex w-full items-center justify-between gap-3 px-3 py-1.5 text-left hover:bg-neutral-50"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-neutral-900">{f.label}</span>
                        <span className="block truncate text-xs text-neutral-500">{f.hint}</span>
                      </span>
                      {f.id === value && <Check className="h-4 w-4 shrink-0 text-neutral-900" />}
                    </button>
                  ))}
              </li>
            ))}
            {!found.length && <li className="px-3 py-6 text-center text-sm text-neutral-500">No feature matches &ldquo;{query}&rdquo;.</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
