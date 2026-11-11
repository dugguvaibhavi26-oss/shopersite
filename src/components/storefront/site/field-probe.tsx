"use client";

import * as React from "react";
import { SITE_SECTION_TYPES, type SiteContent } from "@/lib/site-content";
import { SiteContext, useSite } from "./context";
import { SiteFooter, SiteHeader } from "./shell";
import { SectionBody } from "./home";

/**
 * Theme editor only. Draws a hidden copy of the page with a unique marker in every editable field,
 * then reports which markers actually end up on the page. The editor offers exactly those fields:
 * if this theme never shows a field, it isn't offered, whatever the code happens to read.
 */

// letters only: some fields are parsed (digits count up, "label: value" lines, "·" lists)
const letters = (n: number) => {
  let s = "";
  do {
    s = String.fromCharCode(97 + (n % 26)) + s;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return s;
};
const marker = (n: number) => `qzx${letters(n)}xzq`;
// a 1×1 image; the marker rides in the fragment so it shows up in src / srcset / background-image
const PIXEL = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

type Probe = { content: SiteContent; marks: { area: string; key: string; mark: string }[] };

function buildProbe(content: SiteContent): Probe {
  let n = 0;
  const marks: Probe["marks"] = [];
  const next = (area: string, key: string) => {
    const mark = marker(n++);
    marks.push({ area, key, mark });
    return mark;
  };
  const sections = content.sections.map((sec) => {
    const settings = { ...sec.settings };
    for (const f of SITE_SECTION_TYPES[sec.type].fields) {
      if (f.design || f.kind === "select" || f.kind === "source") continue;
      const m = next(`s:${sec.id}`, f.key);
      settings[f.key] = f.kind === "image" ? `${PIXEL}#${m}` : f.kind === "link" ? `/${m}` : f.kind === "textarea" ? `${m}: ${m}\n${m} · ${m}` : m;
    }
    return { ...sec, settings };
  });
  const header = { ...content.header };
  for (const k of ["catalogLabel", "aboutLabel", "contactLabel", "homeLabel", "saleLabel", "shopAllLabel", "searchLabel", "bagLabel", "accountLabel", "wishlistLabel", "ordersLabel", "searchPlaceholder", "ctaLabel"] as const) header[k] = next("header", k);
  header.ctaLink = `/${next("header", "ctaLink")}`;
  const footer = { ...content.footer };
  for (const k of ["about", "newsletterHeading", "copyright"] as const) footer[k] = next("footer", k);
  return { content: { ...content, sections, header, footer, announcement: next("header", "announcement") }, marks };
}

export type ProbeReport = { sections: Record<string, string[]>; header: string[]; footer: string[] };

export function FieldProbe({ overHero }: { overHero: boolean }) {
  const site = useSite();
  const probe = React.useMemo(() => buildProbe(site.content), [site.content]);
  const box = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    let live = true;
    const found = new Set<string>(); // "area|key"
    const scan = () => {
      const root = box.current;
      if (!root) return;
      const html: Record<string, string> = {};
      root.querySelectorAll<HTMLElement>("[data-probe]").forEach((el) => (html[el.dataset.probe!] = el.innerHTML.toLowerCase()));
      for (const { area, key, mark } of probe.marks) {
        if ((html[area] || "").includes(mark)) found.add(`${area}|${key}`);
        // the search box text shows once the search opens, in headers that have a search button
        else if (key === "searchPlaceholder" && /aria-label="search/.test(html.header || "")) found.add(`${area}|${key}`);
      }
    };
    const wait = (ms: number) => new Promise((r) => window.setTimeout(r, ms));
    const run = async () => {
      await wait(400);
      if (!live) return;
      scan();
      // what shows after a tap: open every tab and accordion in the hidden copy (never buy buttons)
      const toggles = Array.from(box.current?.querySelectorAll<HTMLElement>('[data-probe^="s:"] [role="tab"], [data-probe^="s:"] [aria-expanded="false"], [data-probe^="s:"] summary') || []).slice(0, 120);
      for (const el of toggles) {
        if (!live) return;
        el.click();
        await wait(60);
        scan();
      }
      await wait(900);
      if (!live) return;
      scan();
      send();
    };
    const send = () => {
      // numbered groups (slide 1, slide 2…): if item 1 shows its photo and item 2 is on the page, item 2's photo shows too
      const keysBy = new Map<string, Set<string>>();
      for (const id of found) {
        const [area, key] = id.split("|");
        (keysBy.get(area) || keysBy.set(area, new Set()).get(area)!).add(key);
      }
      const out: ProbeReport = { sections: {}, header: [], footer: [] };
      for (const { area, key } of probe.marks) {
        const have = keysBy.get(area) || new Set<string>();
        let seen = have.has(key);
        const m = key.match(/^([a-z]+)(\d+)([A-Z]\w*)$/);
        if (!seen && m) {
          const [, pre, num, suffix] = m;
          const itemShown = [...have].some((k) => k.startsWith(`${pre}${num}`) && /^[A-Z]/.test(k.slice(pre.length + num.length)));
          const suffixShown = [...have].some((k) => k.startsWith(pre) && k.endsWith(suffix) && /^\d+$/.test(k.slice(pre.length, k.length - suffix.length)));
          seen = itemShown && suffixShown;
        }
        if (!seen) continue;
        if (area === "header") out.header.push(key);
        else if (area === "footer") out.footer.push(key);
        else (out.sections[area.slice(2)] ||= []).push(key);
      }
      window.parent.postMessage({ source: "shopersite-preview", type: "probe", report: out }, window.location.origin);
    };
    run();
    return () => {
      live = false;
    };
  }, [probe]);

  return (
    <SiteContext.Provider value={{ ...site, content: probe.content, editing: false }}>
      <div
        ref={box}
        aria-hidden
        inert
        className="pointer-events-none fixed left-[-20000px] top-0 w-[1280px] overflow-hidden"
        style={{ visibility: "hidden", height: 1 }}
      >
        <div data-probe="header">
          <SiteHeader overHero={overHero} />
        </div>
        {/* hidden sections too: the seller may show them again */}
        {probe.content.sections
          .map((s) => (
            <div key={s.id} data-probe={`s:${s.id}`}>
              <SectionBody section={s} />
            </div>
          ))}
        <div data-probe="footer">
          <SiteFooter />
        </div>
      </div>
    </SiteContext.Provider>
  );
}
