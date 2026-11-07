"use client";

import * as React from "react";

/** Shows a message when the database refuses a change (it used to fail silently). */
export function SaveFailedNotice() {
  const [msg, setMsg] = React.useState("");
  React.useEffect(() => {
    let t: number | undefined;
    const on = (e: Event) => {
      const code = (e as CustomEvent<{ code?: string }>).detail?.code || "";
      setMsg(
        code === "permission-denied"
          ? "That change wasn't saved: you don't have permission to change it."
          : code === "not-found"
            ? "That change wasn't saved: this store no longer exists."
            : "That change wasn't saved. Check your internet connection and try again."
      );
      window.clearTimeout(t);
      t = window.setTimeout(() => setMsg(""), 6000);
    };
    window.addEventListener("shopersite:save-failed", on);
    return () => {
      window.removeEventListener("shopersite:save-failed", on);
      window.clearTimeout(t);
    };
  }, []);
  if (!msg) return null;
  return (
    <div role="alert" className="fixed inset-x-0 top-4 z-[200] mx-auto w-[92%] max-w-md rounded-xl bg-red-600 px-4 py-3 text-sm font-medium text-white shadow-lg">
      {msg}
    </div>
  );
}
