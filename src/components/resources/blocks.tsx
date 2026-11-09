import * as React from "react";
import Link from "next/link";
import { AlertTriangle, Info, Lightbulb } from "lucide-react";
import type { Block, Faq } from "@/lib/resources/types";

/**
 * Renders article content on the server. Text supports **bold** and [links](/path) so writers can
 * stay in plain data.
 */

export function Rich({ text }: { text: string }) {
  const parts: React.ReactNode[] = [];
  const re = /\*\*(.+?)\*\*|\[(.+?)\]\((.+?)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    if (m[1]) parts.push(<strong key={k++} className="font-semibold text-neutral-950">{m[1]}</strong>);
    else {
      const href = m[3];
      parts.push(
        href.startsWith("/") ? (
          <Link key={k++} href={href} className="font-medium text-neutral-950 underline decoration-neutral-300 underline-offset-[3px] hover:decoration-neutral-950">
            {m[2]}
          </Link>
        ) : (
          <a key={k++} href={href} target="_blank" rel="noreferrer" className="font-medium text-neutral-950 underline decoration-neutral-300 underline-offset-[3px] hover:decoration-neutral-950">
            {m[2]}
          </a>
        )
      );
    }
    last = re.lastIndex;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}

const CALLOUT = {
  tip: { icon: Lightbulb, box: "border-emerald-200 bg-emerald-50/70", text: "text-emerald-950", label: "Tip", iconCls: "text-emerald-600" },
  note: { icon: Info, box: "border-sky-200 bg-sky-50/70", text: "text-sky-950", label: "Good to know", iconCls: "text-sky-600" },
  warn: { icon: AlertTriangle, box: "border-amber-200 bg-amber-50/70", text: "text-amber-950", label: "Heads up", iconCls: "text-amber-600" },
};

export function Blocks({ body }: { body: Block[] }) {
  return (
    <div className="space-y-6 text-[16px] leading-[1.75] text-neutral-700">
      {body.map((b, i) => {
        switch (b.type) {
          case "p":
            return (
              <p key={i}>
                <Rich text={b.text} />
              </p>
            );
          case "h":
            return (
              <h2 key={i} id={b.id} className="scroll-mt-28 pt-4 text-[22px] font-semibold leading-snug tracking-[-0.015em] text-neutral-950 sm:text-[24px]">
                {b.text}
              </h2>
            );
          case "steps":
            return (
              <ol key={i} className="space-y-0">
                {b.items.map((s, n) => (
                  <li key={n} className="relative flex gap-4 pb-6 last:pb-0">
                    {n < b.items.length - 1 && <span aria-hidden className="absolute left-[15px] top-9 bottom-1 w-px bg-neutral-200" />}
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-950 text-[13px] font-semibold text-white tabular-nums">{n + 1}</span>
                    <div className="min-w-0 pt-0.5">
                      <p className="font-semibold text-neutral-950">{s.title}</p>
                      <p className="mt-1">
                        <Rich text={s.text} />
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            );
          case "list":
            return (
              <ul key={i} className="space-y-2.5">
                {b.items.map((t, n) => (
                  <li key={n} className="flex gap-3">
                    <span aria-hidden className="mt-[11px] h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-400" />
                    <span>
                      <Rich text={t} />
                    </span>
                  </li>
                ))}
              </ul>
            );
          case "callout": {
            const c = CALLOUT[b.tone];
            return (
              <div key={i} className={`flex gap-3 rounded-2xl border p-4 sm:p-5 ${c.box}`}>
                <c.icon className={`mt-1 h-[18px] w-[18px] shrink-0 ${c.iconCls}`} />
                <p className={`text-[15px] leading-relaxed ${c.text}`}>
                  <span className="font-semibold">{c.label}: </span>
                  <Rich text={b.text} />
                </p>
              </div>
            );
          }
          case "table":
            return (
              <div key={i} className="overflow-x-auto rounded-2xl border border-neutral-200">
                <table className="w-full min-w-[480px] border-collapse text-left text-[14px]">
                  <thead className="bg-neutral-50">
                    <tr>
                      {b.head.map((h) => (
                        <th key={h} className="border-b border-neutral-200 px-4 py-3 font-semibold text-neutral-950">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {b.rows.map((r, n) => (
                      <tr key={n} className="border-b border-neutral-100 last:border-0">
                        {r.map((c, m) => (
                          <td key={m} className={`px-4 py-3 align-top ${m === 0 ? "font-medium text-neutral-950" : ""}`}>
                            <Rich text={c} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          case "quote":
            return (
              <blockquote key={i} className="border-l-2 border-neutral-950 pl-5 text-[18px] font-medium leading-relaxed text-neutral-950">
                “{b.text}”{b.by && <span className="mt-2 block text-[14px] font-normal text-neutral-500">— {b.by}</span>}
              </blockquote>
            );
        }
      })}
    </div>
  );
}

export function Faqs({ faqs }: { faqs: Faq[] }) {
  return (
    <div className="divide-y divide-neutral-200 rounded-2xl border border-neutral-200 bg-white">
      {faqs.map((f) => (
        <details key={f.q} className="group px-5 py-4 sm:px-6">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-semibold text-neutral-950 [&::-webkit-details-marker]:hidden">
            {f.q}
            <span aria-hidden className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-neutral-200 text-neutral-500 transition-transform group-open:rotate-45">
              +
            </span>
          </summary>
          <p className="mt-3 text-[15px] leading-relaxed text-neutral-600">
            <Rich text={f.a} />
          </p>
        </details>
      ))}
    </div>
  );
}

/** JSON-LD for search engines. */
export function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
