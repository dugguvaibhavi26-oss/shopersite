"use client";

import * as React from "react";
import { Check, SlidersHorizontal } from "lucide-react";

/**
 * One "Filters" button that sits beside a search bar and opens every filter and sort option in a
 * single dropdown, like most shopping sites. A badge shows how many filters are on.
 */

export interface FilterSection {
  id: string;
  title: string;
  /** "chips" for short choices, "list" for longer ones (e.g. categories, sort) */
  kind?: "chips" | "list";
  value: string;
  options: { value: string; label: string; count?: number }[];
  onChange: (value: string) => void;
}

export function FilterMenu({ sections, activeCount, onClear }: { sections: FilterSection[]; activeCount: number; onClear: () => void }) {
  const [open, setOpen] = React.useState(false);
  const box = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => box.current && !box.current.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  return (
    <div ref={box} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="dialog"
        className={`inline-flex h-11 items-center gap-2 rounded-xl border px-3.5 text-sm font-semibold transition-colors ${
          open || activeCount ? "border-neutral-950 bg-neutral-950 text-white" : "border-neutral-200 bg-white text-neutral-800 hover:border-neutral-900"
        }`}
      >
        <SlidersHorizontal className="h-4 w-4" />
        <span className="hidden sm:inline">Filters</span>
        {activeCount > 0 && (
          <span className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-bold ${open || activeCount ? "bg-white text-neutral-950" : "bg-neutral-950 text-white"}`}>{activeCount}</span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Filters"
          className="reveal-in absolute right-0 top-[calc(100%+8px)] z-30 w-[min(340px,calc(100vw-32px))] overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-[0_24px_60px_-20px_rgba(0,0,0,0.35)]"
        >
          <div className="max-h-[min(70vh,520px)] space-y-4 overflow-y-auto p-4">
            {sections.map((s) => (
              <div key={s.id}>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">{s.title}</p>
                {s.kind === "list" ? (
                  <div className="-mx-1 space-y-0.5">
                    {s.options.map((o) => {
                      const on = s.value === o.value;
                      return (
                        <button
                          key={o.value}
                          type="button"
                          onClick={() => s.onChange(o.value)}
                          className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm ${on ? "bg-neutral-100 font-semibold text-neutral-950" : "text-neutral-700 hover:bg-neutral-50"}`}
                        >
                          <span className="min-w-0 flex-1 truncate">{o.label}</span>
                          {typeof o.count === "number" && <span className="text-xs tabular-nums text-neutral-400">{o.count}</span>}
                          {on && <Check className="h-4 w-4 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {s.options.map((o) => {
                      const on = s.value === o.value;
                      return (
                        <button
                          key={o.value}
                          type="button"
                          onClick={() => s.onChange(o.value)}
                          className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium ${on ? "border-neutral-950 bg-neutral-950 text-white" : "border-neutral-200 text-neutral-700 hover:border-neutral-400"}`}
                        >
                          {o.label}
                          {typeof o.count === "number" && <span className={`tabular-nums ${on ? "text-white/70" : "text-neutral-400"}`}>{o.count}</span>}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between gap-2 border-t border-neutral-100 px-4 py-3">
            <button type="button" onClick={onClear} disabled={!activeCount} className="text-sm font-medium text-neutral-500 hover:text-neutral-950 disabled:opacity-40">
              Clear all
            </button>
            <button type="button" onClick={() => setOpen(false)} className="h-9 rounded-lg bg-neutral-950 px-4 text-sm font-semibold text-white hover:bg-black">
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
