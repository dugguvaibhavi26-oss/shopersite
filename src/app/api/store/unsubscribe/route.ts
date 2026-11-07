import { rateLimit } from "@/lib/server/api-error";
import { unsubscribe } from "@/lib/server/email-service";

const page = (title: string, text: string, status = 200) =>
  new Response(
    `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="margin:0;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:#f5f5f5;color:#171717">
<div style="max-width:420px;margin:15vh auto;padding:28px;background:#fff;border:1px solid #e5e5e5;border-radius:12px;text-align:center">
<h1 style="font-size:20px;margin:0 0 8px">${title}</h1><p style="margin:0;color:#525252;line-height:1.5">${text}</p></div></body></html>`,
    { status, headers: { "content-type": "text/html; charset=utf-8" } }
  );

const esc = (s: string) => s.replace(/[&<>"']/g, "");

async function run(req: Request) {
  try {
    rateLimit(req, "unsubscribe", 30, 60_000);
  } catch {
    return page("Too many tries", "Please wait a minute and try again.", 429);
  }
  const u = new URL(req.url);
  const name = await unsubscribe(u.searchParams.get("store") || "", u.searchParams.get("e") || "", u.searchParams.get("t") || "").catch(() => null);
  if (!name) return page("Link not valid", "This unsubscribe link isn't valid. Use the link from the latest email.", 400);
  return page("You're unsubscribed", `You won't get emails from ${esc(name)} anymore.`);
}

/** GET: the link in the email. POST: one-click unsubscribe from the email app (List-Unsubscribe-Post). */
export const GET = run;
export const POST = run;
