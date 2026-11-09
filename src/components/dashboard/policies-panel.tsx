"use client";

import * as React from "react";
import { AlertTriangle, CheckCircle2, ExternalLink, FileText, RotateCcw, Save, ShieldCheck, Wand2 } from "lucide-react";
import { storeService, type StoreData } from "@/lib/store-service";
import { getStoreUrl } from "@/lib/config/site";
import { MAX_POLICY_LENGTH, MIN_POLICY_LENGTH, POLICY_IDS, POLICY_INFO, missingPolicies, orderPolicyOf, policyTemplate, type PolicyId } from "@/lib/policies";
import { appAlert, appConfirm } from "@/components/ui/app-dialog";

/** Plain text only: tags are dropped (pages show text, never HTML). */
const plain = (v: string) => v.replace(/<[^>]*>/g, "").replace(/\r\n/g, "\n").slice(0, MAX_POLICY_LENGTH);

export function PoliciesPanel({ store, onSaved }: { store: StoreData; onSaved: () => void }) {
  const [drafts, setDrafts] = React.useState<Record<PolicyId, string>>(() =>
    Object.fromEntries(POLICY_IDS.map((id) => [id, store.policies?.[id]?.body || ""])) as Record<PolicyId, string>
  );
  const [open, setOpen] = React.useState<PolicyId | null>(() => missingPolicies(store)[0] || null);
  const op = orderPolicyOf(store);
  const missing = missingPolicies(store);
  const done = POLICY_IDS.length - missing.length;

  const saveOrderPolicy = (next: Partial<typeof op>) => {
    storeService.updateStore(store.subdomain, { orderPolicy: { ...op, ...next } });
    onSaved();
  };

  const save = (id: PolicyId) => {
    const body = plain(drafts[id]).trim();
    if (body.length < MIN_POLICY_LENGTH) {
      appAlert(`Write at least ${MIN_POLICY_LENGTH} characters so buyers know where they stand. Start from the template if you like.`, { title: "A bit too short", danger: true });
      return;
    }
    storeService.updateStore(store.subdomain, {
      policies: { ...(store.policies || {}), [id]: { body, updatedAt: new Date().toISOString() } },
    });
    onSaved();
    const next = POLICY_IDS.find((p) => p !== id && (store.policies?.[p]?.body || "").trim().length < MIN_POLICY_LENGTH);
    setOpen(next || null);
  };

  const fillTemplate = async (id: PolicyId) => {
    if (drafts[id].trim() && !(await appConfirm("This replaces what you've written with the starter text.", { title: "Use the template?", okLabel: "Replace" }))) return;
    setDrafts((d) => ({ ...d, [id]: policyTemplate(id, store) }));
  };

  return (
    <div className="space-y-5">
      <div className={`flex items-start gap-3 rounded-2xl border p-4 sm:p-5 ${missing.length ? "border-amber-200 bg-amber-50" : "border-emerald-200 bg-emerald-50"}`}>
        {missing.length ? <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" /> : <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-neutral-900">
            {missing.length ? `${done} of ${POLICY_IDS.length} policy pages done` : "All policy pages are live"}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-neutral-600">
            Indian consumer and data protection law expects every online shop to show its terms, return &amp; refund, shipping and privacy policies.
          </p>
        </div>
      </div>

      {/* what buyers can do themselves */}
      <section className="rounded-2xl border border-neutral-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-neutral-900">Cancellations &amp; returns</h3>
        <p className="mt-1 text-xs text-neutral-500">Let buyers send requests from their order page.</p>
        <div className="mt-4 space-y-3">
          <Toggle
            on={op.cancelEnabled}
            onChange={(v) => saveOrderPolicy({ cancelEnabled: v })}
            title="Buyers can cancel before shipping"
            text="They can cancel until you mark the order as shipped."
          />
          <Toggle
            on={op.returnEnabled}
            onChange={(v) => saveOrderPolicy({ returnEnabled: v })}
            title="Buyers can ask for a return after delivery"
            text={`Within ${op.returnDays} days of delivery. You decide if it's accepted and refund them yourself.`}
          />
          {op.returnEnabled && (
            <label className="flex items-center gap-3 pl-1 text-sm">
              <span className="text-neutral-600">Return window</span>
              <select
                value={op.returnDays}
                onChange={(e) => saveOrderPolicy({ returnDays: Number(e.target.value) })}
                className="h-9 rounded-lg border border-neutral-300 bg-white px-2 text-sm"
              >
                {[2, 3, 5, 7, 10, 14, 15, 30].map((d) => (
                  <option key={d} value={d}>
                    {d} days
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
      </section>

      <div className="space-y-3">
        {POLICY_IDS.map((id) => {
          const saved = store.policies?.[id];
          const ok = (saved?.body || "").trim().length >= MIN_POLICY_LENGTH;
          const isOpen = open === id;
          const changed = plain(drafts[id]).trim() !== (saved?.body || "").trim();
          return (
            <section key={id} className="rounded-2xl border border-neutral-200 bg-white">
              <button type="button" onClick={() => setOpen(isOpen ? null : id)} className="flex w-full items-center gap-3 p-4 text-left sm:p-5">
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${ok ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
                  {ok ? <CheckCircle2 className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-neutral-900">{POLICY_INFO[id].title}</span>
                  <span className="block truncate text-xs text-neutral-500">
                    {ok ? `Live · updated ${new Date(saved!.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}` : POLICY_INFO[id].why}
                  </span>
                </span>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${ok ? "bg-emerald-50 text-emerald-700" : "bg-amber-100 text-amber-800"}`}>{ok ? "Done" : "To do"}</span>
              </button>
              {isOpen && (
                <div className="border-t border-neutral-100 p-4 sm:p-5">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <button type="button" onClick={() => fillTemplate(id)} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-neutral-300 px-3 text-xs font-semibold hover:border-black">
                      <Wand2 className="h-3.5 w-3.5" /> Start from a template
                    </button>
                    {changed && saved && (
                      <button type="button" onClick={() => setDrafts((d) => ({ ...d, [id]: saved.body }))} className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-neutral-500 hover:text-black">
                        <RotateCcw className="h-3.5 w-3.5" /> Undo changes
                      </button>
                    )}
                    {ok && (
                      <a href={getStoreUrl(store.subdomain, `/pages/${id}`)} target="_blank" rel="noopener noreferrer" className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-neutral-600 hover:text-black">
                        View on shop <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                  <textarea
                    value={drafts[id]}
                    onChange={(e) => setDrafts((d) => ({ ...d, [id]: plain(e.target.value) }))}
                    rows={14}
                    placeholder={`Write your ${POLICY_INFO[id].title.toLowerCase()}. Leave a blank line between paragraphs.`}
                    className="w-full rounded-xl border border-neutral-300 p-3 text-sm leading-relaxed text-neutral-900 focus:border-black focus:outline-none focus:ring-2 focus:ring-black/5"
                  />
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <span className={`text-xs ${plain(drafts[id]).trim().length < MIN_POLICY_LENGTH ? "text-amber-700" : "text-neutral-400"}`}>
                      {plain(drafts[id]).trim().length.toLocaleString("en-IN")} characters{plain(drafts[id]).trim().length < MIN_POLICY_LENGTH ? ` · at least ${MIN_POLICY_LENGTH}` : ""}
                    </span>
                    <button
                      type="button"
                      disabled={!changed}
                      onClick={() => save(id)}
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-black px-4 text-xs font-semibold text-white hover:bg-neutral-800 disabled:opacity-40"
                    >
                      <Save className="h-3.5 w-3.5" /> Save &amp; publish
                    </button>
                  </div>
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}

function Toggle({ on, onChange, title, text }: { on: boolean; onChange: (v: boolean) => void; title: string; text: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} onClick={() => onChange(!on)} className="flex w-full items-start gap-3 rounded-xl border border-neutral-200 p-3 text-left hover:border-neutral-300">
      <span className={`mt-0.5 flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors ${on ? "bg-black" : "bg-neutral-300"}`}>
        <span className={`h-4 w-4 rounded-full bg-white shadow transition-transform ${on ? "translate-x-4" : ""}`} />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium text-neutral-900">{title}</span>
        <span className="block text-xs text-neutral-500">{text}</span>
      </span>
    </button>
  );
}
