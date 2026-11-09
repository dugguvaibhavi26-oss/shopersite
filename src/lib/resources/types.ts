/**
 * Content building blocks for the Help Center (/docs) and the Explore guides (/explore).
 * Pages are written as data so every article renders on the server (good for search engines) with
 * the same clean layout, and so the sitemap, breadcrumbs and structured data come from one place.
 */

export type Block =
  | { type: "p"; text: string }
  | { type: "h"; id: string; text: string }
  | { type: "steps"; items: { title: string; text: string }[] }
  | { type: "list"; items: string[] }
  | { type: "callout"; tone: "tip" | "note" | "warn"; text: string }
  | { type: "table"; head: string[]; rows: string[][] }
  | { type: "quote"; text: string; by?: string };

export interface Faq {
  q: string;
  a: string;
}

export interface DocArticle {
  slug: string;
  category: string;
  title: string;
  /** one line for cards, search results and the meta description */
  summary: string;
  /** search words that aren't already in the title */
  keywords?: string[];
  /** plan needed, if the feature isn't on every plan */
  plan?: "Growth" | "Pro";
  minutes: number;
  body: Block[];
  faqs?: Faq[];
  related?: string[];
}

export interface DocCategory {
  id: string;
  title: string;
  text: string;
  icon: string;
}

export interface Guide {
  slug: string;
  category: "Start" | "Sell more" | "Marketing" | "Operations" | "Trends" | "Compare";
  title: string;
  /** meta description and card text (about 150 characters) */
  summary: string;
  keywords: string[];
  minutes: number;
  /** published date, ISO */
  date: string;
  /** soft tint for the card art */
  tint: "rose" | "amber" | "emerald" | "sky" | "violet" | "stone";
  featured?: boolean;
  body: Block[];
  faqs?: Faq[];
  related?: string[];
}

/** Section headings inside an article, for "On this page". */
export function headingsOf(body: Block[]): { id: string; title: string }[] {
  return body.filter((b): b is Extract<Block, { type: "h" }> => b.type === "h").map((b) => ({ id: b.id, title: b.text }));
}

/** Plain text of an article, for search. */
export function plainText(body: Block[]): string {
  return body
    .map((b) =>
      b.type === "p" || b.type === "h" || b.type === "callout" || b.type === "quote"
        ? b.text
        : b.type === "steps"
          ? b.items.map((i) => `${i.title} ${i.text}`).join(" ")
          : b.type === "list"
            ? b.items.join(" ")
            : b.rows.flat().join(" ")
    )
    .join(" ");
}
