import * as React from "react";
import Link from "next/link";
import { LEGAL_DOCS, type Block } from "@/lib/legal/docs";

/**
 * Turns names of other policies and email addresses in a paragraph into links, so readers can jump
 * between related documents ("see our Acceptable Use Policy").
 */
const LINKS: [string, string][] = [
  ...LEGAL_DOCS.map((d) => [d.title, `/legal/${d.slug}`] as [string, string]),
  ["Acceptable Use Policy", "/legal/acceptable-use"],
  ["Grievance Redressal page", "/legal/grievance"],
  ["Contact page", "/legal/contact"],
  ["Data Processing Terms", "/legal/data-processing"],
];
// longest first, so "Refund & Cancellation Policy" wins over shorter overlaps
const ORDERED = [...new Map(LINKS).entries()].sort((a, b) => b[0].length - a[0].length);
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const PATTERN = new RegExp(`(${[...ORDERED.map(([t]) => escape(t)), "[\\w.+-]+@[\\w-]+\\.[\\w.]+[a-z]"].join("|")})`, "g");

export function RichText({ text, self }: { text: string; self?: string }) {
  const parts = text.split(PATTERN);
  return (
    <>
      {parts.map((part, i) => {
        if (i % 2 === 0) return part;
        if (part.includes("@"))
          return (
            <a key={i} href={`mailto:${part}`} className="font-medium text-neutral-950 underline decoration-neutral-300 underline-offset-[3px] hover:decoration-neutral-950">
              {part}
            </a>
          );
        const href = ORDERED.find(([t]) => t === part)?.[1];
        if (!href || href === `/legal/${self}`) return part;
        return (
          <Link key={i} href={href} className="font-medium text-neutral-950 underline decoration-neutral-300 underline-offset-[3px] hover:decoration-neutral-950">
            {part}
          </Link>
        );
      })}
    </>
  );
}

export function LegalBlock({ block, self }: { block: Block; self: string }) {
  if (typeof block === "string")
    return (
      <p className="text-[15px] leading-[1.75] text-neutral-700">
        <RichText text={block} self={self} />
      </p>
    );
  return (
    <ul className="space-y-2.5">
      {block.list.map((item) => (
        <li key={item} className="relative pl-5 text-[15px] leading-[1.7] text-neutral-700">
          <span className="absolute left-0 top-[0.7em] h-1.5 w-1.5 rounded-full bg-neutral-400" aria-hidden />
          <RichText text={item} self={self} />
        </li>
      ))}
    </ul>
  );
}
