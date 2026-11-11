"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, Loader2, Send } from "lucide-react";
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

function when(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const today = new Date().toDateString() === d.toDateString();
  const time = d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
  return today ? time : `${d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}, ${time}`;
}

/**
 * WorkPlace: the team chat every role and the store owner share.
 * Staff are known by their sign-in cookie. The owner passes `store` and `authHeaders` (their sign-in token).
 */
export function WorkplaceChat({ store, authHeaders, className }: { store?: string; authHeaders?: () => Promise<Record<string, string>>; className?: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [me, setMe] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [text, setText] = useState("");
  const [urgent, setUrgent] = useState(false);
  const [sending, setSending] = useState(false);
  const lastAt = useRef("");
  const listRef = useRef<HTMLDivElement>(null);
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

  return (
    <div className={`flex min-h-0 flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white ${className || "h-[min(70vh,640px)]"}`}>
      <div className="border-b border-neutral-100 px-5 py-4">
        <h3 className="text-base font-semibold">WorkPlace</h3>
        <p className="text-sm text-neutral-500">The whole team sees this chat. Ask for details, flag a problem, or say what you need.</p>
      </div>

      <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto overscroll-contain bg-neutral-50/60 px-4 py-4 sm:px-5">
        {!loaded ? (
          <p className="flex items-center gap-2 text-sm text-neutral-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </p>
        ) : messages.length === 0 ? (
          <p className="py-10 text-center text-sm text-neutral-500">No messages yet. Say hello to the team.</p>
        ) : (
          messages.map((m) => {
            if (m.note) {
              return (
                <p key={m.id} className="mx-auto w-fit max-w-full rounded-full bg-neutral-200/70 px-3 py-1 text-center text-xs text-neutral-600">
                  {m.text} · {when(m.at)}
                </p>
              );
            }
            const mine = m.by.id === me;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className="max-w-[85%] sm:max-w-[70%]">
                  <p className={`mb-1 text-xs text-neutral-500 ${mine ? "text-right" : ""}`}>
                    <span className="font-semibold text-neutral-800">{mine ? "You" : m.by.name}</span> · {roleLabel(m.by.role)} · {when(m.at)}
                  </p>
                  <div
                    className={`whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2.5 text-sm ${
                      m.urgent ? "border border-rose-200 bg-rose-50 text-rose-900" : mine ? "bg-neutral-950 text-white" : "border border-neutral-200 bg-white text-neutral-900"
                    }`}
                  >
                    {m.urgent && (
                      <span className="mb-1 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-rose-700">
                        <AlertTriangle className="h-3.5 w-3.5" /> Urgent
                      </span>
                    )}
                    {m.text}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {error && <p className="border-t border-rose-100 bg-rose-50 px-5 py-2 text-sm text-rose-700">{error}</p>}

      <form onSubmit={send} className="border-t border-neutral-100 p-3 sm:p-4">
        <div className="flex items-end gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, 1000))}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                e.currentTarget.form?.requestSubmit();
              }
            }}
            rows={1}
            placeholder="Write a message"
            aria-label="Message"
            className="max-h-32 min-h-11 flex-1 resize-y rounded-xl border border-neutral-200 px-3.5 py-2.5 text-sm outline-none focus:border-neutral-900"
          />
          <button
            type="submit"
            disabled={sending || !text.trim()}
            style={{ minHeight: 0 }}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-neutral-950 px-4 text-sm font-semibold text-white hover:bg-black disabled:opacity-50"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send
          </button>
        </div>
        <label className="mt-2 inline-flex cursor-pointer items-center gap-2 text-sm text-neutral-600">
          <input type="checkbox" checked={urgent} onChange={(e) => setUrgent(e.target.checked)} className="h-4 w-4 accent-rose-600" />
          Mark as urgent
        </label>
      </form>
    </div>
  );
}
