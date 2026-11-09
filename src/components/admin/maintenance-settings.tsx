"use client";

import * as React from "react";
import { Loader2, Wrench } from "lucide-react";
import { MAINTAINABLE, saveMaintenance, useMaintenance } from "@/lib/maintenance";

/** Admin → System status: mark seller Settings sections as "In maintenance". */
export function MaintenanceSettings() {
  const live = useMaintenance();
  const [picked, setPicked] = React.useState<string[] | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState("");
  const current = picked ?? live;
  const dirty = picked !== null && [...picked].sort().join() !== [...live].sort().join();

  const toggle = (id: string) => setPicked((p) => ((p ?? live).includes(id) ? (p ?? live).filter((x) => x !== id) : [...(p ?? live), id]));
  const save = async () => {
    setBusy(true);
    setMsg("");
    try {
      await saveMaintenance(current);
      setPicked(null);
      setMsg("Saved. Sellers see it right away.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Couldn't save.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-6">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
          <Wrench className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-neutral-900">Settings in maintenance</h3>
          <p className="mt-0.5 text-sm text-neutral-500">Ticked sections show an &ldquo;In maintenance&rdquo; tag in every seller&apos;s Settings menu, with a notice on the page.</p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {MAINTAINABLE.map((m) => {
          const on = current.includes(m.id);
          return (
            <label key={m.id} className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${on ? "border-amber-300 bg-amber-50 text-amber-900" : "border-neutral-200 text-neutral-700 hover:border-neutral-400"}`}>
              <input type="checkbox" checked={on} onChange={() => toggle(m.id)} className="accent-amber-600" />
              {m.label}
            </label>
          );
        })}
      </div>
      <div className="mt-4 flex items-center justify-end gap-3">
        {msg && <span className="text-sm text-neutral-600">{msg}</span>}
        <button type="button" onClick={save} disabled={!dirty || busy} className="inline-flex h-9 items-center gap-2 rounded-lg bg-neutral-950 px-4 text-sm font-semibold text-white hover:bg-black disabled:opacity-40">
          {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Save
        </button>
      </div>
    </div>
  );
}
