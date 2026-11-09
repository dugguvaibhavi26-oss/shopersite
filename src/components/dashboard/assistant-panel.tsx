"use client";

import * as React from "react";
import { ArrowLeft, ArrowUp, ArrowUpRight, Check, Info, Loader2, SquarePen, X } from "lucide-react";
import { IDiscounts, IOrders, IPlugins, IProducts, ITrend } from "@/components/icons";
import { RoxyLogo } from "@/components/roxy-logo";
import { auth } from "@/lib/firebase";
import type { StoreData } from "@/lib/store-service";
import { PAGE_LABELS, parseCommand, type Command, type DashPage } from "@/lib/assistant/commands";
import type { UsageView } from "@/lib/assistant/budget";

/**
 * The dashboard assistant, laid out like ChatGPT / Claude: plain replies, a clean input at the bottom.
 *
 * - Desktop with room to spare: a panel beside the page, so you can chat while you work.
 * - Desktop without enough room: a full page inside the dashboard frame (nothing gets squeezed).
 * - Phones: its own full page.
 *
 * Simple commands ("show orders", "mark 1043 shipped") are understood right here, free and unlimited;
 * anything else goes to the AI and uses the daily allowance. Every change shows a Confirm card, and
 * replies can carry buttons that take you to the right place in the dashboard.
 */

export const ASSISTANT_WIDTH = 380;
/** The page card must stay at least this wide beside the assistant, or the assistant goes full screen. */
export const MIN_PAGE_WIDTH = 880;

/** True when the assistant can sit beside the page without squeezing it (desktop only). */
export function assistantFitsBeside(): boolean {
  if (typeof window === "undefined" || window.innerWidth < 768) return false;
  const rail = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--dash-rail")) || 88;
  // rail + page card + gaps (12px each side and between) + assistant
  return window.innerWidth - rail - 36 - ASSISTANT_WIDTH >= MIN_PAGE_WIDTH;
}

export interface DashLink {
  page: DashPage;
  label: string;
  orderId?: string;
}
export type NavigateOpts = { action?: "add-product"; orderId?: string };

interface Proposal {
  id: string;
  title: string;
  lines: string[];
  token: string;
  link?: DashLink;
  state?: "pending" | "saving" | "done" | "cancelled" | "error";
  note?: string;
}
interface Msg {
  id: string;
  role: "user" | "assistant";
  text: string;
  proposals?: Proposal[];
  links?: DashLink[];
  /** a notice (limit reached, AI busy…) shown as a soft note, not a reply */
  notice?: boolean;
  /** answered by a free command, no AI */
  instant?: boolean;
}

async function call<T>(url: string, init: RequestInit = {}): Promise<T> {
  const user = auth.currentUser;
  if (!user) throw new Error("Please sign in again.");
  const r = await fetch(url, { ...init, headers: { "Content-Type": "application/json", Authorization: `Bearer ${await user.getIdToken()}` }, cache: "no-store" });
  const body = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(body.error || "Something went wrong."), { code: body.code as string | undefined });
  return body as T;
}

const uid = () => Math.random().toString(36).slice(2, 10);
const rupees = (p: number) => `₹${Math.round(p / 100).toLocaleString("en-IN")}`;
type Metric = Extract<Command, { kind: "stat" }>["metric"];

/** Answers for the quick-number commands, from the data the dashboard already has. */
function answerStat(store: StoreData, metric: Metric): string {
  const IST = 5.5 * 3600_000;
  const today = Math.floor((Date.now() + IST) / 86400_000) * 86400_000 - IST;
  const ok = (store.orders || []).filter((o) => o.fulfilmentStatus !== "cancelled" && o.paymentStatus !== "rejected");
  const since = (t: number) => ok.filter((o) => Date.parse(o.createdAt) >= t);
  const sales = (list: typeof ok) => rupees(list.reduce((n, o) => n + o.total, 0));
  switch (metric) {
    case "orders_today": {
      const l = since(today);
      return l.length ? `${l.length} order${l.length === 1 ? "" : "s"} today, worth ${sales(l)}.` : "No orders yet today.";
    }
    case "orders_week": {
      const l = since(today - 6 * 86400_000);
      return `${l.length} order${l.length === 1 ? "" : "s"} in the last 7 days, worth ${sales(l)}.`;
    }
    case "sales_today":
      return `Sales today: ${sales(since(today))}.`;
    case "sales_week":
      return `Sales in the last 7 days: ${sales(since(today - 6 * 86400_000))}.`;
    case "sales_month":
      return `Sales in the last 30 days: ${sales(since(today - 29 * 86400_000))}.`;
    case "pending_orders": {
      const l = ok.filter((o) => ["placed", "confirmed", "packed"].includes(o.fulfilmentStatus));
      return l.length ? `${l.length} order${l.length === 1 ? "" : "s"} waiting to ship: ${l.slice(0, 6).map((o) => o.number).join(", ")}${l.length > 6 ? "…" : ""}.` : "Nothing waiting to ship. All caught up!";
    }
    case "low_stock": {
      const l = (store.products || []).filter((p) => p.status === "published" && p.stock <= 3);
      return l.length ? `Low on stock: ${l.slice(0, 8).map((p) => `${p.title} (${p.stock})`).join(", ")}${l.length > 8 ? "…" : ""}.` : "Every published product has more than 3 in stock.";
    }
    case "product_count":
      return `You have ${store.products?.length || 0} products (${(store.products || []).filter((p) => p.status === "published").length} visible).`;
    case "customer_count":
      return `You have ${store.customers?.length || 0} customers.`;
  }
}

/** Where a quick answer's button goes. */
function statLinks(store: StoreData, metric: Metric): DashLink[] {
  if (metric === "pending_orders") {
    const waiting = (store.orders || []).filter((o) => ["placed", "confirmed", "packed"].includes(o.fulfilmentStatus) && o.fulfilmentStatus !== "cancelled");
    return [
      ...(waiting.length === 1 ? [{ page: "orders" as const, label: `View order ${waiting[0].number}`, orderId: waiting[0].id }] : []),
      { page: "orders", label: "Open Orders" },
    ];
  }
  if (metric === "orders_today" || metric === "orders_week") return [{ page: "orders", label: "Open Orders" }];
  if (metric === "low_stock" || metric === "product_count") return [{ page: "products", label: "Open Products" }];
  if (metric === "customer_count") return [{ page: "customers", label: "Open Customers" }];
  return [{ page: "overview", label: "See sales on Home" }];
}

const SUGGESTIONS: { icon: React.ElementType; title: string; prompt: string }[] = [
  { icon: ITrend, title: "How did my shop do this week?", prompt: "How did my shop do this week? Anything I should do?" },
  { icon: IOrders, title: "Which orders are waiting to ship?", prompt: "pending orders" },
  { icon: IProducts, title: "Write a description for my newest product", prompt: "Write a short description for my newest product" },
  { icon: IDiscounts, title: "Create a 10% festival coupon", prompt: "Create a 10% coupon called DIWALI10 for 7 days" },
  { icon: IPlugins, title: "How do I set up Shiprocket?", prompt: "How do I connect Shiprocket?" },
];

function greeting() {
  // the device's own clock, same as the dashboard's greeting
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

/** A small ring for today's AI usage. */
function UsageRing({ percent }: { percent: number }) {
  const r = 7;
  const c = 2 * Math.PI * r;
  const tone = percent >= 100 ? "#e11d48" : percent >= 80 ? "#d97706" : "#171717";
  return (
    <svg viewBox="0 0 18 18" className="h-4 w-4 -rotate-90" aria-hidden>
      <circle cx="9" cy="9" r={r} fill="none" stroke="#e5e5e5" strokeWidth="2.5" />
      <circle cx="9" cy="9" r={r} fill="none" stroke={tone} strokeWidth="2.5" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(100, percent) / 100)} className="transition-[stroke-dashoffset] duration-500" />
    </svg>
  );
}

/** Bold (**text**) and simple bullet / numbered lists in replies; everything else is plain text. */
function inline(text: string): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    /^\*\*[^*]+\*\*$/.test(part) ? (
      <strong key={i} className="font-semibold">
        {part.slice(2, -2)}
      </strong>
    ) : (
      part.replace(/\*\*/g, "")
    )
  );
}

export function RichText({ text }: { text: string }) {
  const blocks: React.ReactNode[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  const flush = () => {
    if (!list) return;
    const Tag = list.ordered ? "ol" : "ul";
    blocks.push(
      <Tag key={blocks.length} className={`space-y-1 pl-5 ${list.ordered ? "list-decimal" : "list-disc"} marker:text-neutral-400`}>
        {list.items.map((it, i) => (
          <li key={i}>{inline(it)}</li>
        ))}
      </Tag>
    );
    list = null;
  };
  for (const raw of text.split("\n")) {
    const line = raw.trimEnd();
    const bullet = line.match(/^\s*[-*•]\s+(.*)$/);
    const num = line.match(/^\s*\d+[.)]\s+(.*)$/);
    if (bullet || num) {
      const ordered = !!num;
      if (list && list.ordered !== ordered) flush();
      if (!list) list = { ordered, items: [] };
      list.items.push((bullet || num)![1]);
      continue;
    }
    flush();
    if (line.trim()) blocks.push(<p key={blocks.length}>{inline(line)}</p>);
  }
  flush();
  return <div className="space-y-2 pt-0.5 text-[15px] leading-relaxed text-neutral-900">{blocks}</div>;
}

function LinkButtons({ links, onGo }: { links: DashLink[]; onGo: (l: DashLink) => void }) {
  if (!links.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {links.map((l, i) => (
        <button
          key={`${l.page}-${l.orderId || ""}-${i}`}
          type="button"
          onClick={() => onGo(l)}
          style={{ minHeight: 0 }}
          className="group inline-flex h-8 items-center gap-1.5 rounded-full border border-neutral-200 bg-white pl-3 pr-2.5 text-xs font-semibold text-neutral-900 transition-colors hover:border-neutral-900"
        >
          {l.label}
          <ArrowUpRight className="h-3.5 w-3.5 text-neutral-400 transition-transform group-hover:-translate-y-px group-hover:translate-x-px group-hover:text-neutral-900" />
        </button>
      ))}
    </div>
  );
}

export function AssistantPanel({
  store,
  ownerName,
  open,
  side,
  prompt,
  onClose,
  onNavigate,
}: {
  store: StoreData;
  ownerName?: string;
  open: boolean;
  /** desktop: beside the page (true) or full page (false) */
  side: boolean;
  /** a question asked somewhere else (Home's box): sent as soon as the assistant opens */
  prompt?: { id: number; text: string } | null;
  onClose: () => void;
  onNavigate: (page: DashPage, opts?: NavigateOpts) => void;
}) {
  const storageKey = `assistant:${store.subdomain}`;
  const [msgs, setMsgs] = React.useState<Msg[]>([]);
  const [text, setText] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [usage, setUsage] = React.useState<UsageView | null>(null);
  const [aiReady, setAiReady] = React.useState(true);
  const listRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);

  // keep the conversation while the dashboard is open (this tab only)
  React.useEffect(() => {
    try {
      const saved = sessionStorage.getItem(storageKey);
      setMsgs(saved ? (JSON.parse(saved) as Msg[]) : []);
    } catch {
      setMsgs([]);
    }
  }, [storageKey]);
  React.useEffect(() => {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(msgs.slice(-40)));
    } catch {
      // storage full or blocked: the chat still works
    }
  }, [msgs, storageKey]);

  React.useEffect(() => {
    if (!open) return;
    call<{ usage: UsageView; ai: boolean }>(`/api/assistant?store=${encodeURIComponent(store.subdomain)}`)
      .then((r) => {
        setUsage(r.usage);
        setAiReady(r.ai);
      })
      .catch(() => null);
    const t = setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 400);
    return () => clearTimeout(t);
  }, [open, store.subdomain]);

  React.useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, busy]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // grow the input with the text, up to a few lines
  React.useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(160, el.scrollHeight)}px`;
  }, [text]);

  const say = (m: Omit<Msg, "id">) => setMsgs((l) => [...l, { ...m, id: uid() }]);
  const patchProposal = (msgId: string, pid: string, patch: Partial<Proposal>) =>
    setMsgs((l) => l.map((m) => (m.id === msgId ? { ...m, proposals: m.proposals?.map((p) => (p.id === pid ? { ...p, ...patch } : p)) } : m)));
  const go = (l: DashLink) => onNavigate(l.page, l.orderId ? { orderId: l.orderId } : undefined);

  const send = async (raw?: string) => {
    const q = (raw ?? text).trim();
    if (!q || busy) return;
    setText("");
    const history = [...msgs, { id: uid(), role: "user" as const, text: q }];
    setMsgs(history);

    // 1) free commands, no AI
    const cmd = parseCommand(q);
    if (cmd?.kind === "navigate") {
      onNavigate(cmd.page, cmd.action ? { action: cmd.action } : undefined);
      say({ role: "assistant", text: cmd.action === "add-product" ? "Opened a new product form for you." : `Opened ${PAGE_LABELS[cmd.page]}.`, instant: true, links: [{ page: cmd.page, label: `Back to ${PAGE_LABELS[cmd.page]}` }] });
      return;
    }
    if (cmd?.kind === "stat") {
      say({ role: "assistant", text: answerStat(store, cmd.metric), instant: true, links: statLinks(store, cmd.metric) });
      return;
    }

    setBusy(true);
    try {
      if (cmd?.kind === "order_status") {
        const r = await call<{ reply: string; proposals: Proposal[] }>("/api/assistant", { method: "POST", body: JSON.stringify({ mode: "command", store: store.subdomain, command: cmd }) });
        say({ role: "assistant", text: r.reply, proposals: r.proposals.map((p) => ({ ...p, state: "pending" })), instant: true });
        return;
      }
      // 2) the AI
      const r = await call<{ reply: string; proposals: Proposal[]; links?: DashLink[]; actions: { type: "navigate"; page: DashPage }[]; usage?: UsageView }>("/api/assistant", {
        method: "POST",
        body: JSON.stringify({
          mode: "chat",
          store: store.subdomain,
          messages: history
            .filter((m) => !m.notice && m.text)
            .slice(-12)
            .map((m) => ({ role: m.role, content: m.text.slice(0, 3500) })),
        }),
      });
      if (r.usage) setUsage(r.usage);
      r.actions?.forEach((a) => a.type === "navigate" && onNavigate(a.page));
      say({
        role: "assistant",
        text: r.reply,
        proposals: r.proposals?.length ? r.proposals.map((p) => ({ ...p, state: "pending" })) : undefined,
        links: r.links?.length ? r.links : undefined,
      });
    } catch (e) {
      const err = e as Error & { code?: string };
      if (err.code === "ai_used_up") setUsage((u) => (u ? { ...u, percent: 100, available: false } : u));
      if (err.code === "ai_off") setAiReady(false);
      say({ role: "assistant", text: err.message, notice: true });
    } finally {
      setBusy(false);
    }
  };

  // send a question asked from Home once, when it arrives
  const sendRef = React.useRef(send);
  sendRef.current = send;
  const lastPrompt = React.useRef(0);
  React.useEffect(() => {
    if (!open || !prompt || prompt.id === lastPrompt.current) return;
    lastPrompt.current = prompt.id;
    const t = setTimeout(() => sendRef.current(prompt.text), 250);
    return () => clearTimeout(t);
  }, [open, prompt]);

  const confirm = async (msgId: string, p: Proposal) => {
    patchProposal(msgId, p.id, { state: "saving" });
    try {
      const r = await call<{ message: string }>("/api/assistant/confirm", { method: "POST", body: JSON.stringify({ store: store.subdomain, token: p.token }) });
      patchProposal(msgId, p.id, { state: "done", note: r.message });
    } catch (e) {
      patchProposal(msgId, p.id, { state: "error", note: (e as Error).message });
    }
  };

  const pct = usage?.percent ?? 0;
  const resets = usage ? new Date(usage.resetsAt).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" }) : "12:00 am";
  const first = (ownerName || "").trim().split(/\s+/)[0];
  const empty = msgs.length === 0;

  return (
    <aside
      role="dialog"
      aria-label="Roxy, your assistant"
      aria-hidden={!open}
      style={{ "--aw": `${ASSISTANT_WIDTH}px` } as React.CSSProperties}
      className={`fixed inset-0 z-[71] flex flex-col overflow-hidden bg-white transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] md:inset-auto md:bottom-3 md:right-3 md:top-3 md:rounded-[28px] ${
        side ? "md:w-[var(--aw)]" : "md:left-[var(--dash-rail,88px)]"
      } ${open ? "translate-x-0 opacity-100" : `pointer-events-none translate-x-full opacity-0 ${side ? "md:translate-x-[calc(100%+1.5rem)]" : "md:translate-x-0 md:translate-y-3"}`}`}
    >
      {/* header: back when it's a page, close when it's beside the page */}
      <div className="flex h-14 shrink-0 items-center gap-1 px-2 pt-[env(safe-area-inset-top)] sm:px-3">
        <button type="button" onClick={onClose} aria-label="Back" style={{ minHeight: 0 }} className={`flex h-10 w-10 items-center justify-center rounded-full text-neutral-700 hover:bg-neutral-100 ${side ? "md:hidden" : ""}`}>
          <ArrowLeft className="h-5 w-5" />
        </button>
        <p className={`flex flex-1 items-center gap-1.5 pl-1 text-[15px] font-semibold ${side ? "md:pl-2" : ""}`}>
          <RoxyLogo size={22} /> Roxy
        </p>
        {!empty && (
          <button type="button" onClick={() => setMsgs([])} aria-label="New chat" title="New chat" style={{ minHeight: 0 }} className="flex h-10 w-10 items-center justify-center rounded-full text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900">
            <SquarePen className="h-[18px] w-[18px]" />
          </button>
        )}
        <button type="button" onClick={onClose} aria-label="Close assistant" style={{ minHeight: 0 }} className={`hidden h-10 w-10 items-center justify-center rounded-full text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 ${side ? "md:flex" : ""}`}>
          <X className="h-[18px] w-[18px]" />
        </button>
      </div>

      {/* conversation */}
      <div ref={listRef} className="flex-1 overflow-y-auto overscroll-contain">
        <div className="mx-auto flex min-h-full w-full max-w-[720px] flex-col px-4 sm:px-6">
          {empty ? (
            <div className="swap-enter flex flex-1 flex-col justify-center py-8">
              <RoxyLogo size={56} className="mb-4" />
              <p className="text-[26px] font-semibold leading-tight tracking-tight">
                {greeting()}
                {first ? `, ${first}` : ""}
              </p>
              <p className="mt-1 text-[15px] text-neutral-500">I&apos;m Roxy. How can I help with {store.name} today?</p>
              <div className="mt-7 -mx-2 flex flex-col">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s.title}
                    type="button"
                    onClick={() => send(s.prompt)}
                    style={{ minHeight: 0 }}
                    className="group flex items-center gap-3 rounded-xl px-2 py-2.5 text-left text-[15px] text-neutral-700 transition-colors hover:bg-neutral-50 hover:text-neutral-950"
                  >
                    <s.icon className="h-[18px] w-[18px] shrink-0 text-neutral-400 transition-colors group-hover:text-neutral-900" />
                    <span className="flex-1">{s.title}</span>
                  </button>
                ))}
              </div>
              {!aiReady && (
                <p className="mt-5 flex items-start gap-2 text-xs text-neutral-500">
                  <Info className="mt-px h-3.5 w-3.5 shrink-0" /> AI replies aren&apos;t switched on here yet. Quick commands like &ldquo;pending orders&rdquo; or &ldquo;open customers&rdquo; work.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-6 py-4">
              {msgs.map((m) =>
                m.role === "user" ? (
                  <div key={m.id} className="swap-enter flex justify-end">
                    <p className="max-w-[85%] whitespace-pre-wrap rounded-3xl bg-neutral-100 px-4 py-2.5 text-[15px] leading-relaxed text-neutral-900">{m.text}</p>
                  </div>
                ) : m.notice ? (
                  <div key={m.id} className="swap-enter flex items-start gap-2 text-sm leading-relaxed text-amber-800">
                    <Info className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{m.text}</span>
                  </div>
                ) : (
                  <div key={m.id} className="swap-enter flex gap-3">
                    <RoxyLogo size={28} alive={false} className="mt-0.5" />
                    <div className="min-w-0 flex-1 space-y-3">
                      <RichText text={m.text} />

                      {m.proposals?.map((p) => (
                        <div key={p.id} className="border-l-2 border-neutral-900 pl-3.5">
                          <p className="text-[11px] font-medium text-neutral-400">Change to confirm</p>
                          <p className="text-sm font-semibold">{p.title}</p>
                          {p.lines.length > 0 && (
                            <ul className="mt-1 space-y-0.5 text-[13px] text-neutral-600">
                              {p.lines.map((l, i) => (
                                <li key={i}>{l}</li>
                              ))}
                            </ul>
                          )}
                          {p.state === "pending" || p.state === "saving" ? (
                            <div className="mt-2.5 flex gap-2">
                              <button
                                type="button"
                                disabled={p.state === "saving"}
                                onClick={() => confirm(m.id, p)}
                                style={{ minHeight: 0 }}
                                className="inline-flex h-8 items-center gap-1.5 rounded-full bg-neutral-950 px-3.5 text-xs font-semibold text-white hover:bg-black disabled:opacity-70"
                              >
                                {p.state === "saving" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Confirm
                              </button>
                              <button
                                type="button"
                                disabled={p.state === "saving"}
                                onClick={() => patchProposal(m.id, p.id, { state: "cancelled" })}
                                style={{ minHeight: 0 }}
                                className="h-8 rounded-full px-3 text-xs font-medium text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="mt-2 space-y-2">
                              <p className={`text-xs font-medium ${p.state === "done" ? "text-emerald-700" : p.state === "error" ? "text-amber-700" : "text-neutral-400"}`}>
                                {p.state === "done" ? `✓ ${p.note || "Saved."}` : p.state === "error" ? p.note : "Cancelled"}
                              </p>
                              {p.state === "done" && p.link && <LinkButtons links={[p.link]} onGo={go} />}
                            </div>
                          )}
                        </div>
                      ))}
                      {(m.proposals?.filter((p) => p.state === "pending").length || 0) > 1 && (
                        <button
                          type="button"
                          onClick={() => m.proposals?.filter((p) => p.state === "pending").forEach((p) => confirm(m.id, p))}
                          style={{ minHeight: 0 }}
                          className="inline-flex h-8 items-center gap-1.5 rounded-full border border-neutral-200 px-3 text-xs font-semibold hover:border-neutral-900"
                        >
                          <Check className="h-3.5 w-3.5" /> Confirm all
                        </button>
                      )}

                      {m.links && <LinkButtons links={m.links} onGo={go} />}
                      {m.instant && <p className="text-[11px] text-neutral-400">Quick answer · didn&apos;t use AI</p>}
                    </div>
                  </div>
                )
              )}
              {busy && (
                <div className="flex gap-3">
                  <RoxyLogo size={28} className="mt-0.5" />
                  <div className="flex items-center gap-1 pt-1">
                    {[0, 1, 2].map((i) => (
                      <span key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-400" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="shrink-0 pb-[max(env(safe-area-inset-bottom),12px)]"
      >
        <div className="mx-auto w-full max-w-[720px] px-3 sm:px-5">
          <div className="rounded-[26px] bg-neutral-100 p-2 transition-shadow focus-within:shadow-[0_0_0_1px_#d4d4d4]">
            <textarea
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              rows={1}
              maxLength={2000}
              placeholder="Ask Roxy anything about your shop"
              className="block max-h-40 w-full resize-none bg-transparent px-2.5 py-1.5 text-[15px] outline-none placeholder:text-neutral-500"
            />
            <div className="mt-1 flex items-center justify-between pl-2">
              <span title={`AI used today: ${pct}%. Resets at ${resets}. Quick commands are free.`} className="inline-flex items-center gap-1.5 text-[11px] text-neutral-500">
                <UsageRing percent={pct} />
                {usage && !usage.available ? (usage.busy ? "AI busy" : `Used up · resets ${resets}`) : `${pct}% used today`}
              </span>
              <button
                type="submit"
                disabled={!text.trim() || busy}
                aria-label="Send"
                style={{ minHeight: 0 }}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-950 text-white transition-all hover:bg-black disabled:bg-neutral-300"
              >
                <ArrowUp className="h-[18px] w-[18px]" />
              </button>
            </div>
          </div>
          <p className="mt-2 text-center text-[11px] text-neutral-400">AI can make mistakes. Check each change before you confirm.</p>
        </div>
      </form>
    </aside>
  );
}

/** The round button that opens the assistant. */
export function AssistantButton({ onClick, raised }: { onClick: () => void; raised?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Ask Roxy"
      style={{ minHeight: 0 }}
      className={`fixed right-4 z-[60] flex h-12 items-center gap-2 rounded-full border border-white/80 bg-white/85 py-1.5 pl-1.5 pr-1.5 text-sm font-semibold text-neutral-950 shadow-[0_16px_36px_-14px_rgba(0,0,0,0.45)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 sm:pr-4 md:right-8 ${raised ? "bottom-24 md:bottom-8" : "bottom-5 md:bottom-8"}`}
    >
      <RoxyLogo size={36} />
      <span className="hidden sm:inline">Ask Roxy</span>
    </button>
  );
}
