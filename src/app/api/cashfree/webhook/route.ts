import { verifyCashfreeSignature } from "@/lib/payments/cashfree-core";
import { cashfreeConfig } from "@/lib/server/cashfree";
import { handleWebhookEvent } from "@/lib/server/payment-service";

/**
 * Cashfree webhooks (payments and merchant KYC status). Set this address in the Cashfree Partner
 * Dashboard › Developers › Webhooks: https://<your domain>/api/cashfree/webhook
 *
 * A webhook is only a hint: whatever it says, the payment or KYC state is re-read from Cashfree's
 * API before anything is saved, so a forged webhook can't mark an order paid.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  const signed = verifyCashfreeSignature(
    raw,
    req.headers.get("x-webhook-timestamp") || req.headers.get("x-cashfree-timestamp"),
    req.headers.get("x-webhook-signature") || req.headers.get("x-cashfree-signature"),
    [cashfreeConfig().partnerKey]
  );
  let event: { type?: string; data?: Record<string, unknown> };
  try {
    event = JSON.parse(raw);
  } catch {
    return Response.json({ ok: false, error: "invalid json" }, { status: 400 });
  }
  if (!signed) console.warn("[cashfree webhook] signature did not verify; treating as a hint only", event?.type);
  try {
    const result = await handleWebhookEvent(event);
    console.info("[cashfree webhook]", event?.type, result, signed ? "(signed)" : "(unsigned)");
    return Response.json({ ok: true });
  } catch (err) {
    console.error("[cashfree webhook] failed", err);
    // a 5xx makes Cashfree retry later
    return Response.json({ ok: false }, { status: 500 });
  }
}
