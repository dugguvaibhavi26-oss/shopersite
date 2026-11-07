import { ApiError, handle } from "@/lib/server/api-error";
import { requireUser } from "@/lib/server/firebase-admin";
import { planQuote, themeQuote } from "@/lib/server/billing-service";

/** GET ?kind=plan&plan=&cycle= | ?kind=theme&theme= : the amount and payee for a seller payment. */
export async function GET(req: Request) {
  return handle(async () => {
    await requireUser(req);
    const p = new URL(req.url).searchParams;
    if (p.get("kind") === "plan") {
      const q = await planQuote(p.get("plan") || "", p.get("cycle") || "monthly");
      return Response.json({ amount: q.pricing.totalPaise, label: `${q.planName} · ${q.pricing.cycleLabel}`, payee: q.payee });
    }
    if (p.get("kind") === "theme") {
      const q = await themeQuote(p.get("theme") || "");
      return Response.json({ amount: q.amount, label: `${q.theme.name} theme`, payee: q.payee });
    }
    throw new ApiError(400, "Invalid request.");
  });
}
