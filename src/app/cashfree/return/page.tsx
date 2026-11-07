"use client";

import * as React from "react";
import { CheckCircle2 } from "lucide-react";

/**
 * Cashfree sends the seller here after the hosted KYC form. Inside the dashboard's KYC window it
 * tells the dashboard to re-check the status; opened on its own it links back to the dashboard.
 */
export default function CashfreeReturnPage() {
  const [store, setStore] = React.useState("");
  const [embedded, setEmbedded] = React.useState(true);

  React.useEffect(() => {
    const s = new URLSearchParams(window.location.search).get("store") || "";
    setStore(s);
    const inFrame = window.parent && window.parent !== window;
    setEmbedded(inFrame);
    if (inFrame) {
      window.parent.postMessage({ type: "shopersite:cashfree-kyc-return", store: s }, window.location.origin);
    } else if (window.opener) {
      try {
        window.opener.postMessage({ type: "shopersite:cashfree-kyc-return", store: s }, window.location.origin);
      } catch {
        // the dashboard tab was closed
      }
    }
  }, []);

  return (
    <main className="flex min-h-[60vh] items-center justify-center bg-white px-6 py-16 text-neutral-900">
      <div className="max-w-sm text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
        <h1 className="mt-4 text-xl font-semibold">KYC details sent to Cashfree</h1>
        <p className="mt-2 text-sm text-neutral-500">
          Cashfree is checking your details. You can start taking online payments as soon as they approve your account.
        </p>
        {!embedded && (
          <a
            href={`/dashboard?${store ? `store=${encodeURIComponent(store)}&` : ""}tab=settings`}
            className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-neutral-950 px-5 text-sm font-semibold text-white"
          >
            Back to dashboard
          </a>
        )}
      </div>
    </main>
  );
}
