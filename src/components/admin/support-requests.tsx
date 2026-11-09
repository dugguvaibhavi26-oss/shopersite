"use client";

import * as React from "react";
import { CheckCircle2, Loader2, Mail, Phone, RefreshCw, RotateCcw } from "lucide-react";
import { auth } from "@/lib/firebase";

interface SupportRequest {
  id: string;
  topic: "razorpay_setup" | "plugin_request";
  subject?: string;
  note?: string;
  status: "open" | "resolved";
  storeSubdomain: string;
  storeName: string;
  ownerName: string;
  phone: string;
  email: string;
  createdAt: string;
  resolvedAt?: string;
}

const TOPIC: Record<SupportRequest["topic"], string> = { razorpay_setup: "Razorpay setup", plugin_request: "Plugin request" };

async function call(init?: RequestInit) {
  const user = auth.currentUser;
  if (!user) throw new Error("Please sign in again.");
  const r = await fetch("/api/admin/support-requests", {
    ...init,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${await user.getIdToken()}` },
    cache: "no-store",
  });
  const body = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(body.error || "Something went wrong.");
  return body;
}

export async function fetchOpenSupportCount(): Promise<number> {
  try {
    const { requests } = await call();
    return (requests as SupportRequest[]).filter((r) => r.status === "open").length;
  } catch {
    return 0;
  }
}

function ago(iso: string) {
  const mins = Math.round((Date.now() - Date.parse(iso)) / 60000);
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 48) return `${hrs} h ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function SupportRequests({ onOpenCount }: { onOpenCount?: (n: number) => void }) {
  const [list, setList] = React.useState<SupportRequest[] | null>(null);
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [busyId, setBusyId] = React.useState("");
  const [showResolved, setShowResolved] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { requests } = await call();
      setList(requests);
      onOpenCount?.(requests.filter((r: SupportRequest) => r.status === "open").length);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't load requests.");
    } finally {
      setLoading(false);
    }
  }, [onOpenCount]);

  React.useEffect(() => {
    load();
  }, [load]);

  const setStatus = async (id: string, status: SupportRequest["status"]) => {
    setBusyId(id);
    try {
      await call({ method: "PATCH", body: JSON.stringify({ id, status }) });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't update.");
    } finally {
      setBusyId("");
    }
  };

  const open = (list || []).filter((r) => r.status === "open");
  const resolved = (list || []).filter((r) => r.status === "resolved");
  const shown = showResolved ? resolved : open;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Help requests</h2>
          <p className="text-sm text-neutral-500">Setup help (reply within 2–3 hours) and plugin requests from sellers.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-xl border border-neutral-200 bg-white p-1 text-sm">
            {[false, true].map((r) => (
              <button
                key={String(r)}
                type="button"
                onClick={() => setShowResolved(r)}
                style={{ minHeight: 0 }}
                className={`h-8 rounded-lg px-3 font-medium ${showResolved === r ? "bg-neutral-950 text-white" : "text-neutral-600"}`}
              >
                {r ? `Resolved (${resolved.length})` : `Open (${open.length})`}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={load}
            disabled={loading}
            aria-label="Refresh"
            style={{ minHeight: 0 }}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-600 hover:border-neutral-900 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {error && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

      {loading && !list ? (
        <p className="flex items-center gap-2 text-sm text-neutral-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </p>
      ) : shown.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-200 bg-white p-8 text-center text-sm text-neutral-500">
          {showResolved ? "Nothing resolved yet." : "No open requests. You're all caught up."}
        </div>
      ) : (
        <ul className="space-y-3">
          {shown.map((r) => {
            const overdue = r.status === "open" && r.topic !== "plugin_request" && Date.now() - Date.parse(r.createdAt) > 3 * 3600 * 1000;
            return (
              <li key={r.id} className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 font-semibold">
                      {r.storeName}
                      <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-600">{TOPIC[r.topic]}</span>
                      {overdue && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">Over 3 h</span>}
                    </p>
                    <p className="mt-0.5 text-sm text-neutral-500">
                      {r.ownerName ? `${r.ownerName} · ` : ""}
                      {r.storeSubdomain} · {ago(r.createdAt)}
                    </p>
                    {r.subject && <p className="mt-2 text-sm font-semibold text-neutral-900">Wants: {r.subject}</p>}
                    {r.note && <p className="mt-0.5 whitespace-pre-line text-sm text-neutral-600">{r.note}</p>}
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                      {r.phone && (
                        <a href={`tel:${r.phone}`} className="inline-flex items-center gap-1.5 text-neutral-800 hover:underline">
                          <Phone className="h-3.5 w-3.5" /> {r.phone}
                        </a>
                      )}
                      {r.email && (
                        <a href={`mailto:${r.email}`} className="inline-flex items-center gap-1.5 text-neutral-800 hover:underline">
                          <Mail className="h-3.5 w-3.5" /> {r.email}
                        </a>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStatus(r.id, r.status === "open" ? "resolved" : "open")}
                    disabled={busyId === r.id}
                    style={{ minHeight: 0 }}
                    className={`inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold disabled:opacity-60 ${
                      r.status === "open" ? "bg-neutral-950 text-white hover:bg-black" : "border border-neutral-200 text-neutral-700 hover:border-neutral-900"
                    }`}
                  >
                    {busyId === r.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : r.status === "open" ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                      <RotateCcw className="h-3.5 w-3.5" />
                    )}
                    {r.status === "open" ? "Mark resolved" : "Reopen"}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
