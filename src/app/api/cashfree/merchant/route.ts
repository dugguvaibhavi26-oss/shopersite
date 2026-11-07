import { z } from "zod";
import { ApiError, handle } from "@/lib/server/api-error";
import { requireStoreOwner } from "@/lib/server/firebase-admin";
import { merchantStatusFor, startOnboarding } from "@/lib/server/payment-service";
import { requireCashfreeKey } from "@/lib/server/cashfree";

/** GET ?store=<subdomain>: the seller's Cashfree account state (checked live with Cashfree). */
export async function GET(req: Request) {
  return handle(async () => {
    const subdomain = new URL(req.url).searchParams.get("store") || "";
    const { store } = await requireStoreOwner(req, subdomain);
    requireCashfreeKey(); // not switched on for the platform yet: the card shows "coming soon"
    return Response.json(await merchantStatusFor(store));
  });
}

const StartBody = z.object({
  store: z.string().min(1).max(63),
  email: z.string().max(200),
  phone: z.string().max(20),
  businessName: z.string().max(100),
});

/** POST: create the seller's Cashfree account if needed and return a link to the hosted KYC form. */
export async function POST(req: Request) {
  return handle(async () => {
    const parsed = StartBody.safeParse(await req.json().catch(() => null));
    if (!parsed.success) throw new ApiError(400, "Please fill in all the details.");
    const { store, uid } = await requireStoreOwner(req, parsed.data.store);
    const origin = new URL(req.url).origin;
    return Response.json(await startOnboarding(store, uid, parsed.data, origin));
  });
}
