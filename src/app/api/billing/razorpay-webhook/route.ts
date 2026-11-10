import { handle } from "@/lib/server/api-error";
import { verifyRazorpayWebhook } from "@/lib/payments/razorpay-core";
import { cleanSubdomain } from "@/lib/server/store-data";
import { platformRazorpay, syncSubscription } from "@/lib/server/platform-subscriptions";
import type { RzSubPayment, RzSubscription } from "@/lib/billing/subscription-core";

/**
 * POST: Razorpay tells us about Shopersite's own plan subscriptions (trial started, charged,
 * payment failed, cancelled…). Set this URL in Razorpay Dashboard > Account & Settings > Webhooks
 * with the secret saved in Vercel as RAZORPAY_PLATFORM_WEBHOOK_SECRET, and tick every
 * "subscription.*" event.
 *
 * An error answer makes Razorpay send the event again later, so nothing is lost.
 */
export async function POST(req: Request) {
  return handle(async () => {
    const rawBody = await req.text();
    const secret = (process.env.RAZORPAY_PLATFORM_WEBHOOK_SECRET || "").trim();
    if (!secret || !platformRazorpay()) return new Response("Not set up", { status: 503 });
    if (!verifyRazorpayWebhook(rawBody, req.headers.get("x-razorpay-signature"), secret)) {
      return new Response("Bad signature", { status: 400 });
    }

    let event: { event?: string; payload?: { subscription?: { entity?: RzSubscription }; payment?: { entity?: RzSubPayment } } };
    try {
      event = JSON.parse(rawBody);
    } catch {
      return new Response("Bad JSON", { status: 400 });
    }

    const name = String(event.event || "");
    const entity = event.payload?.subscription?.entity;
    if (!name.startsWith("subscription.") || !entity?.id) return Response.json({ received: true, action: "ignored" });

    const notes = entity.notes && !Array.isArray(entity.notes) ? entity.notes : {};
    const subdomain = notes.kind === "shopersite_plan" ? cleanSubdomain(notes.store) : null;
    if (!subdomain) return Response.json({ received: true, action: "not a plan subscription" });

    // only a successful charge carries a payment worth recording
    const payment = name === "subscription.charged" ? event.payload?.payment?.entity : null;
    const store = await syncSubscription(subdomain, entity, payment || null);
    return Response.json({ received: true, action: store ? "applied" : "skipped" });
  });
}
