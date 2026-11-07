"use client";

import React, { useEffect, useState } from "react";
import { Check, Plus, QrCode, Trash2 } from "lucide-react";
import { storeService, isValidUpiId, type PlatformPaymentSettings as Settings } from "@/lib/store-service";

/** Admin: UPI IDs sellers can pay their subscription to. Add several and choose which one is in use. */
export function PlatformPaymentSettings() {
  const [settings, setSettings] = useState<Settings>(() => storeService.getPlatformPaymentSettings());
  const [adding, setAdding] = useState(false);
  const [newUpi, setNewUpi] = useState("");
  const [newName, setNewName] = useState("shopersite");
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  // Follow changes saved here or on another device
  useEffect(() => storeService.subscribe(() => setSettings(storeService.getPlatformPaymentSettings())), []);

  const flash = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  const save = (next: Settings, msg: string) => {
    const res = storeService.savePlatformPaymentSettings(next);
    if (!res.success) {
      setError(res.error || "Couldn't save.");
      return false;
    }
    setError("");
    setSettings(storeService.getPlatformPaymentSettings());
    flash(msg);
    return true;
  };

  const addUpi = (e: React.FormEvent) => {
    e.preventDefault();
    const upiId = newUpi.trim();
    if (!isValidUpiId(upiId)) return setError("Enter a UPI ID like name@okaxis.");
    if (settings.accounts.some((a) => a.upiId.toLowerCase() === upiId.toLowerCase())) return setError("That UPI ID is already added.");
    const ok = save(
      { ...settings, accounts: [...settings.accounts, { upiId, payeeName: newName.trim() || "shopersite" }] },
      "UPI ID added"
    );
    if (ok) {
      setNewUpi("");
      setAdding(false);
    }
  };

  const useForPayments = (upiId: string) => {
    if (!window.confirm(`Sellers will pay their subscriptions to ${upiId} from now on. Continue?`)) return;
    save({ ...settings, activeUpiId: upiId }, "Now in use");
  };

  const remove = (upiId: string) => {
    if (!window.confirm(`Remove ${upiId}?`)) return;
    save({ ...settings, accounts: settings.accounts.filter((a) => a.upiId !== upiId) }, "Removed");
  };

  const field = "w-full h-11 px-3.5 rounded-xl border border-neutral-200 bg-white text-sm outline-none focus:border-neutral-900 transition-colors";

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-base font-semibold text-neutral-950">
            <QrCode className="h-4 w-4" />
            Payment UPI IDs
          </h3>
          <p className="mt-0.5 text-sm text-neutral-500">Where sellers pay for paid plans. Add more and switch any time.</p>
        </div>
        {toast && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
            <Check className="h-3.5 w-3.5" />
            {toast}
          </span>
        )}
      </div>

      <ul className="mt-4 divide-y divide-neutral-100 rounded-xl border border-neutral-200">
        {settings.accounts.map((a) => {
          const inUse = a.upiId === settings.activeUpiId;
          return (
            <li key={a.upiId} className="flex flex-wrap items-center gap-3 p-3.5">
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="truncate text-sm font-semibold text-neutral-950">{a.upiId}</span>
                  {inUse && (
                    <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">In use</span>
                  )}
                </span>
                <span className="block truncate text-xs text-neutral-500">Shows as &ldquo;{a.payeeName}&rdquo; in UPI apps</span>
              </span>
              {!inUse && (
                <span className="flex shrink-0 items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => useForPayments(a.upiId)}
                    style={{ minHeight: 0 }}
                    className="h-9 rounded-xl border border-neutral-200 px-3 text-xs font-semibold text-neutral-800 hover:border-neutral-900"
                  >
                    Use for payments
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(a.upiId)}
                    aria-label={`Remove ${a.upiId}`}
                    style={{ minHeight: 0 }}
                    className="flex h-9 w-9 items-center justify-center rounded-xl text-neutral-400 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </span>
              )}
            </li>
          );
        })}
      </ul>

      {adding ? (
        <form onSubmit={addUpi} className="mt-3 rounded-xl bg-neutral-50 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-semibold text-neutral-700">UPI ID</span>
              <input
                value={newUpi}
                onChange={(e) => {
                  setNewUpi(e.target.value);
                  setError("");
                }}
                placeholder="name@okaxis"
                autoCapitalize="none"
                spellCheck={false}
                autoFocus
                className={`mt-1.5 ${field}`}
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-neutral-700">Name shown in UPI apps</span>
              <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="shopersite" className={`mt-1.5 ${field}`} />
            </label>
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setAdding(false);
                setNewUpi("");
                setError("");
              }}
              className="h-10 rounded-xl border border-neutral-200 bg-white px-4 text-sm font-semibold text-neutral-800 hover:border-neutral-900"
            >
              Cancel
            </button>
            <button type="submit" className="h-10 rounded-xl bg-neutral-950 px-4 text-sm font-semibold text-white hover:bg-black">
              Add UPI ID
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-neutral-300 text-sm font-semibold text-neutral-800 hover:border-neutral-900"
        >
          <Plus className="h-4 w-4" />
          Add UPI ID
        </button>
      )}

      {error && <p className="mt-3 text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}
