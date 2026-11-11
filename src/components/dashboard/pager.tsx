"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

/** how many rows a dashboard list shows before it moves to the next page */
export const PAGE_SIZE = 50;

/** the slice of `items` that belongs on `page` (1-based), with the page kept inside its bounds */
export function pageOf<T>(items: T[], page: number, size = PAGE_SIZE) {
  const pages = Math.max(1, Math.ceil(items.length / size));
  const current = Math.min(Math.max(1, page), pages);
  const start = (current - 1) * size;
  return { rows: items.slice(start, start + size), current, pages };
}

/** "1 to 50 of 132" with Previous and Next. Shows nothing when everything fits on one page. */
export function Pager({ total, page, onPage, noun, size = PAGE_SIZE }: { total: number; page: number; onPage: (page: number) => void; noun: string; size?: number }) {
  const pages = Math.max(1, Math.ceil(total / size));
  if (pages <= 1) return null;
  const current = Math.min(Math.max(1, page), pages);
  const from = (current - 1) * size + 1;
  const to = Math.min(current * size, total);
  const btn =
    "inline-flex h-9 items-center gap-1 rounded-xl border border-neutral-200 bg-white px-3 text-sm font-semibold text-neutral-800 transition-colors hover:border-neutral-900 disabled:cursor-not-allowed disabled:border-neutral-200 disabled:text-neutral-300";
  return (
    <nav aria-label={`${noun} pages`} className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-100 px-4 py-3 md:px-5">
      <p className="text-xs text-neutral-500">
        <span className="font-semibold tabular-nums text-neutral-900">
          {from} to {to}
        </span>{" "}
        of <span className="tabular-nums">{total}</span> {noun}
      </p>
      <div className="flex items-center gap-2">
        <button type="button" className={btn} style={{ minHeight: 0 }} disabled={current <= 1} onClick={() => onPage(current - 1)}>
          <ChevronLeft className="h-4 w-4" /> <span className="max-sm:sr-only">Previous</span>
        </button>
        <span className="text-xs font-medium tabular-nums text-neutral-500">
          Page {current} of {pages}
        </span>
        <button type="button" className={btn} style={{ minHeight: 0 }} disabled={current >= pages} onClick={() => onPage(current + 1)}>
          <span className="max-sm:sr-only">Next</span> <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </nav>
  );
}
