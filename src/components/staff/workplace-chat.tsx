"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, ArrowLeft, ArrowUp, Bell, Loader2, MessagesSquare } from "lucide-react";
import { roleLabel, type TeamRole } from "@/lib/staff/roles";

interface Message {
  id: string;
  text: string;
  at: string;
  by: { id: string; name: string; role: TeamRole };
  urgent?: boolean;
  note?: boolean;
}

const POLL_MS = 8000;

type View = "all" | "urgent" | "updates";

/** each role keeps one colour everywhere in the chat, so you can tell who is talking at a glance */
const ROLE_TINT: Record<TeamRole, { avatar: string; name: string }> = {
  owner: { avatar: "bg-neutral-950 text-white", name: "text-neutral-950" },
  order_manager: { avatar: "bg-amber-100 text-amber-800", name: "text-amber-700" },
  product_manager: { avatar: "bg-violet-100 text-violet-800", name: "text-violet-700" },
  fulfilment: { avatar: "bg-sky-100 text-sky-800", name: "text-sky-700" },
  support: { avatar: "bg-emerald-100 text-emerald-800", name: "text-emerald-700" },
  finance: { avatar: "bg-rose-100 text-rose-800", name: "text-rose-700" },
};
const tint = (role: TeamRole) => ROLE_TINT[role] || ROLE_TINT.owner;

const STARTERS = ["Good morning team", "Stock is running low", "I need an order's details", "Please call me when free"];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] || "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase() || "?";
}

function clock(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
}

function dayLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return "Today";
  const y = new Date(now);
  y.setDate(now.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: d.getFullYear() === now.getFullYear() ? undefined : "numeric" });
}

/**
 * WorkPlace: the team chat every role and the store owner share.
 * Staff are known by their sign-in cookie. The owner passes `store` and `authHeaders` (their sign-in token).
 */
export function WorkplaceChat({
  store,
  authHeaders,
  className,
  full,
  onBack,
}: {
  store?: string;
  authHeaders?: () => Promise<Record<string, string>>;
  className?: string;
  /** fills the page edge to edge instead of sitting in a card */
  full?: boolean;
  /** phones: a back arrow in the header, for pages with no other way out */
  onBack?: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [me, setMe] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [text, setText] = useState("");
  const [urgent, setUrgent] = useState(false);
  const [sending, setSending] = useState(false);
  const [view, setView] = useState<View>("all");
  const lastAt = useRef("");
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const headersRef = useRef(authHeaders);
  headersRef.current = authHeaders;

  const add = useCallback((incoming: Message[]) => {
    if (!incoming.length) return;
    setMessages((old) => {
      const seen = new Set(old.map((m) => m.id));
      const fresh = incoming.filter((m) => !seen.has(m.id));
      if (!fresh.length) return old;
      const all = [...old, ...fresh].sort((a, b) => a.at.localeCompare(b.at));
      lastAt.current = all[all.length - 1].at;
      return all;
    });
  }, []);

  const load = useCallback(async () => {
    try {
      const q = new URLSearchParams();
      if (store) q.set("store", store);
      if (lastAt.current) q.set("after", lastAt.current);
      const res = await fetch(`/api/workplace?${q}`, { headers: (await headersRef.current?.()) || {}, cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not load WorkPlace.");
      setMe(data.me || "");
      add(data.messages || []);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load WorkPlace.");
    } finally {
      setLoaded(true);
    }
  }, [store, add]);

  useEffect(() => {
    load();
    const t = setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, POLL_MS);
    return () => clearInterval(t);
  }, [load]);

  // keep the newest message in view
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/workplace", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...((await headersRef.current?.()) || {}) },
        body: JSON.stringify({ ...(store ? { store } : {}), text: body, ...(urgent ? { urgent: true } : {}) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not send. Try again.");
      add([data.message]);
      setText("");
      setUrgent(false);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send. Try again.");
    } finally {
      setSending(false);
    }
  };

  /** the people who have written here, newest first, for the faces in the header */
  const people = useMemo(() => {
    const seen = new Map<string, Message["by"]>();
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (!m.note && !seen.has(m.by.id)) seen.set(m.by.id, m.by);
    }
    return [...seen.values()];
  }, [messages]);

  const counts = useMemo(() => {
    const today = new Date().toDateString();
    return {
      all: messages.length,
      urgent: messages.filter((m) => m.urgent).length,
      updates: messages.filter((m) => m.note).length,
      today: messages.filter((m) => !m.note && new Date(m.at).toDateString() === today).length,
    };
  }, [messages]);

  const views: { id: View; label: string; icon: React.ComponentType<{ className?: string }>; short: string; n: number; empty: string }[] = [
    { id: "all", label: "Everything", short: "All", icon: MessagesSquare, n: counts.all, empty: "" },
    { id: "urgent", label: "Urgent", short: "Urgent", icon: AlertTriangle, n: counts.urgent, empty: "Nothing urgent. Good." },
    { id: "updates", label: "Order updates", short: "Updates", icon: Bell, n: counts.updates, empty: "No order updates yet." },
  ];
  const current = views.find((v) => v.id === view) || views[0];
  const shown = view === "urgent" ? messages.filter((m) => m.urgent) : view === "updates" ? messages.filter((m) => m.note) : messages;

  // jump to the newest message when the view changes
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [view]);

  const live = (
    <span className="relative flex h-2 w-2 shrink-0">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
    </span>
  );

  return (
    <div className={`flex min-h-0 overflow-hidden bg-white ${full ? "" : "rounded-3xl border border-neutral-200"} ${className || "h-[min(78vh,720px)]"}`}>
      {/* left column (computers): what this place is, the views, and who is here */}
      <aside className="hidden w-[300px] shrink-0 flex-col gap-4 border-r border-neutral-200 bg-neutral-50 p-4 lg:flex">
        <div
          className="rounded-3xl bg-neutral-950 p-5 text-white"
          style={{ backgroundImage: "radial-gradient(110% 100% at 100% 0%, rgba(99,102,241,0.4), transparent 60%), radial-gradient(90% 90% at 0% 100%, rgba(16,185,129,0.25), transparent 60%)" }}
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
            <MessagesSquare className="h-5 w-5" />
          </span>
          <h3 className="mt-3 text-lg font-semibold leading-tight">WorkPlace</h3>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-white/65">{live} Live · the whole team sees this</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-2xl bg-white/[0.08] p-3 ring-1 ring-white/10">
              <p className="text-2xl font-semibold tabular-nums leading-none">{counts.today}</p>
              <p className="mt-1 text-xs text-white/60">messages today</p>
            </div>
            <div className="rounded-2xl bg-white/[0.08] p-3 ring-1 ring-white/10">
              <p className={`text-2xl font-semibold tabular-nums leading-none ${counts.urgent ? "text-rose-300" : ""}`}>{counts.urgent}</p>
              <p className="mt-1 text-xs text-white/60">marked urgent</p>
            </div>
          </div>
        </div>

        <nav aria-label="WorkPlace views" className="flex flex-col gap-0.5">
          {views.map((v) => {
            const on = v.id === view;
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => setView(v.id)}
                aria-current={on ? "page" : undefined}
                className={`flex h-11 w-full items-center gap-3 rounded-2xl px-3 text-left text-sm transition-colors ${on ? "bg-neutral-950 font-semibold text-white" : "font-medium text-neutral-600 hover:bg-neutral-200/60 hover:text-neutral-950"}`}
              >
                <v.icon className="h-4 w-4 shrink-0" />
                <span className="flex-1 truncate">{v.label}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs tabular-nums ${on ? "bg-white/15 text-white" : v.id === "urgent" && v.n ? "bg-rose-100 text-rose-700" : "bg-neutral-200/70 text-neutral-600"}`}>{v.n}</span>
              </button>
            );
          })}
        </nav>

        <div className="flex min-h-0 flex-1 flex-col border-t border-neutral-200 px-3 pt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">In this chat</p>
          <ul className="mt-3 min-h-0 flex-1 space-y-3 overflow-y-auto">
            {people.length === 0 ? (
              <li className="text-sm text-neutral-500">Nobody has written yet.</li>
            ) : (
              people.map((p) => (
                <li key={p.id} className="flex items-center gap-3">
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${tint(p.role).avatar}`}>{initials(p.name)}</span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{p.id === me ? `${p.name} (you)` : p.name}</span>
                    <span className={`block truncate text-xs ${tint(p.role).name}`}>{roleLabel(p.role)}</span>
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>
      </aside>

      {/* the conversation */}
      <section className="flex min-w-0 flex-1 flex-col">
        {/* phones and small screens: a black header, then the three views as one switch */}
        <div className="bg-neutral-950 px-3 pb-3 pt-3 text-white lg:hidden">
          <div className="flex items-center gap-2.5">
            {onBack ? (
              <button type="button" onClick={onBack} aria-label="Back" style={{ minHeight: 0 }} className="-ml-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white/90 active:bg-white/10">
                <ArrowLeft className="h-5 w-5" />
              </button>
            ) : (
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/10">
                <MessagesSquare className="h-5 w-5" />
              </span>
            )}
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-[17px] font-semibold leading-tight">WorkPlace</h3>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-white/60">
                {live} <span className="truncate">Live with your team</span>
              </p>
            </div>
            <Faces people={people} ring="ring-neutral-950" dark />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-1 rounded-2xl bg-white/[0.08] p-1" role="tablist" aria-label="WorkPlace views">
            {views.map((v) => {
              const on = v.id === view;
              return (
                <button
                  key={v.id}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  onClick={() => setView(v.id)}
                  style={{ minHeight: 0 }}
                  className={`flex h-9 min-w-0 items-center justify-center gap-1.5 rounded-xl px-1 text-[13px] font-semibold transition-colors ${on ? "bg-white text-neutral-950" : "text-white/70"}`}
                >
                  <span className="truncate">{v.short}</span>
                  <span className={`shrink-0 rounded-full px-1.5 text-[11px] tabular-nums leading-[18px] ${on ? "bg-neutral-950/10" : v.id === "urgent" && v.n ? "bg-rose-500 text-white" : "bg-white/10"}`}>{v.n}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* computers: a quiet title row, the left column carries the rest */}
        <div className="hidden items-center gap-3 border-b border-neutral-200 px-8 py-4 lg:flex">
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${view === "urgent" ? "bg-rose-100 text-rose-700" : "bg-neutral-100 text-neutral-800"}`}>
            <current.icon className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold leading-tight">{current.label}</h3>
            <p className="text-xs text-neutral-500">{shown.length === 1 ? "1 message" : `${shown.length} messages`}</p>
          </div>
          <Faces people={people} ring="ring-white" />
        </div>

        {/* messages */}
        <div
          ref={listRef}
          className="flex-1 overflow-y-auto overscroll-contain bg-neutral-50 px-3 py-4 sm:px-6"
          style={{ backgroundImage: "radial-gradient(rgba(0,0,0,0.045) 1px, transparent 1px)", backgroundSize: "18px 18px" }}
        >
          {!loaded ? (
            <div className="space-y-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className={`flex items-end gap-2 ${i === 1 ? "flex-row-reverse" : ""}`}>
                  <span className="h-8 w-8 animate-pulse rounded-full bg-neutral-200" />
                  <span className={`h-12 animate-pulse rounded-2xl bg-neutral-200 ${i === 1 ? "w-40" : "w-56"}`} />
                </div>
              ))}
            </div>
          ) : shown.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center px-4 text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-neutral-900 shadow-sm ring-1 ring-neutral-200">
                <current.icon className="h-7 w-7" />
              </span>
              <p className="mt-4 text-base font-semibold">{view === "all" ? "Start the conversation" : current.empty}</p>
              {view === "all" && <p className="mt-1 max-w-xs text-sm text-neutral-500">Ask for details, flag a problem, or say what you need. Everyone on the team sees it.</p>}
            </div>
          ) : (
            <div className="mx-auto w-full max-w-4xl">
              {shown.map((m, i) => {
                const prev = shown[i - 1];
                const next = shown[i + 1];
                const newDay = !prev || new Date(prev.at).toDateString() !== new Date(m.at).toDateString();
                const day = newDay && (
                  <div className="my-3 flex items-center gap-3">
                    <span className="h-px flex-1 bg-neutral-200" />
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-neutral-500 shadow-sm ring-1 ring-neutral-200">{dayLabel(m.at)}</span>
                    <span className="h-px flex-1 bg-neutral-200" />
                  </div>
                );
                if (m.note) {
                  return (
                    <React.Fragment key={m.id}>
                      {day}
                      <p className="mx-auto my-3 flex w-fit max-w-full items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-center text-xs text-neutral-600 shadow-sm ring-1 ring-neutral-200">
                        <Bell className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
                        <span>
                          {m.text} · {clock(m.at)}
                        </span>
                      </p>
                    </React.Fragment>
                  );
                }
                const mine = m.by.id === me;
                // messages from one person in a row sit together: the name shows once, the face on the last one
                const first = newDay || !prev || prev.note || prev.by.id !== m.by.id;
                const last = !next || next.note || next.by.id !== m.by.id || new Date(next.at).toDateString() !== new Date(m.at).toDateString();
                const t = tint(m.by.role);
                return (
                  <React.Fragment key={m.id}>
                    {day}
                    <div className={`flex items-end gap-2 ${mine ? "flex-row-reverse" : ""} ${first ? "mt-3" : "mt-1"}`}>
                      {!mine && (last ? <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${t.avatar}`}>{initials(m.by.name)}</span> : <span className="w-8 shrink-0" />)}
                      <div className={`flex max-w-[82%] flex-col sm:max-w-[68%] ${mine ? "items-end" : "items-start"}`}>
                        {first && !mine && (
                          <p className="mb-1 px-1 text-xs text-neutral-500">
                            <span className={`font-semibold ${t.name}`}>{m.by.name}</span> · {roleLabel(m.by.role)}
                          </p>
                        )}
                        <div
                          className={`whitespace-pre-wrap break-words px-3.5 py-2 text-sm shadow-sm ${
                            m.urgent
                              ? "rounded-2xl border border-rose-200 bg-rose-50 text-rose-950"
                              : mine
                                ? `rounded-2xl bg-neutral-950 text-white ${last ? "rounded-br-md" : ""}`
                                : `rounded-2xl bg-white text-neutral-900 ring-1 ring-neutral-200 ${last ? "rounded-bl-md" : ""}`
                          }`}
                        >
                          {m.urgent && (
                            <span className="mb-1 flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-rose-700">
                              <AlertTriangle className="h-3.5 w-3.5" /> Urgent
                            </span>
                          )}
                          {m.text}
                          <span className={`ml-2 inline-block translate-y-0.5 text-[10px] ${m.urgent ? "text-rose-700/70" : mine ? "text-white/55" : "text-neutral-400"}`}>{clock(m.at)}</span>
                        </div>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          )}
        </div>

        {error && <p className="border-t border-rose-100 bg-rose-50 px-5 py-2 text-sm text-rose-700">{error}</p>}

        {/* composer */}
        <form onSubmit={send} className="border-t border-neutral-100 bg-white p-3 sm:px-6 sm:py-4">
          <div className="mx-auto w-full max-w-4xl">
            {loaded && !text && (
              <div className="-mx-1 mb-2.5 flex gap-1.5 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {STARTERS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setText(s);
                      inputRef.current?.focus();
                    }}
                    style={{ minHeight: 0 }}
                    className="h-8 shrink-0 rounded-full border border-neutral-200 bg-white px-3 text-xs font-medium text-neutral-700 hover:border-neutral-900 hover:text-neutral-950"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
            <div className={`flex items-end gap-2 rounded-2xl border bg-neutral-50 p-1.5 transition-colors focus-within:bg-white ${urgent ? "border-rose-300 focus-within:border-rose-500" : "border-neutral-200 focus-within:border-neutral-900"}`}>
              <button
                type="button"
                role="switch"
                aria-checked={urgent}
                aria-label="Mark as urgent"
                title="Mark as urgent"
                onClick={() => setUrgent((u) => !u)}
                style={{ minHeight: 0 }}
                className={`inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl px-2.5 text-xs font-semibold transition-colors ${urgent ? "bg-rose-600 text-white" : "text-neutral-500 hover:bg-neutral-200/70 hover:text-neutral-900"}`}
              >
                <AlertTriangle className="h-4 w-4" />
                <span className={urgent ? "" : "hidden sm:inline"}>Urgent</span>
              </button>
              <textarea
                ref={inputRef}
                value={text}
                onChange={(e) => setText(e.target.value.slice(0, 1000))}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    e.currentTarget.form?.requestSubmit();
                  }
                }}
                rows={1}
                placeholder={urgent ? "Write an urgent message" : "Write a message"}
                aria-label="Message"
                className="max-h-32 min-h-10 flex-1 resize-none bg-transparent px-1.5 py-2.5 text-sm outline-none placeholder:text-neutral-400"
              />
              <button
                type="submit"
                disabled={sending || !text.trim()}
                aria-label="Send"
                style={{ minHeight: 0 }}
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white transition disabled:bg-neutral-300 ${urgent ? "bg-rose-600 hover:bg-rose-700" : "bg-neutral-950 hover:bg-black"}`}
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-5 w-5" />}
              </button>
            </div>
            <p className="mt-1.5 hidden px-1 text-[11px] text-neutral-400 sm:block">Enter to send · Shift + Enter for a new line</p>
          </div>
        </form>
      </section>
    </div>
  );
}

/** the last few people who wrote, as overlapping initials */
function Faces({ people, ring, dark }: { people: Message["by"][]; ring: string; dark?: boolean }) {
  if (!people.length) return null;
  return (
    <div className="flex shrink-0 items-center -space-x-2" aria-label={`${people.length} people have written here`}>
      {people.slice(0, 4).map((p) => (
        <span key={p.id} title={`${p.name} · ${roleLabel(p.role)}`} className={`flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold ring-2 ${ring} ${dark && p.role === "owner" ? "bg-white text-neutral-950" : tint(p.role).avatar}`}>
          {initials(p.name)}
        </span>
      ))}
      {people.length > 4 && <span className={`flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold ring-2 ${ring} ${dark ? "bg-white/15 text-white" : "bg-neutral-200 text-neutral-700"}`}>+{people.length - 4}</span>}
    </div>
  );
}
