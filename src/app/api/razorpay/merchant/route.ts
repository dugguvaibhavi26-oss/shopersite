import { z } from "zod";
import { ApiError, handle } from "@/lib/server/api-error";
import { requireStoreOwner } from "@/lib/server/firebase-admin";
import { getRazorpayAccount, connectRazorpayAccount, disconnectRazorpayAccount } from "@/lib/server/razorpay-service";

/** GET ?store=<subdomain>: seller's Razorpay connection status. */
export async function GET(req: Request) {
  return handle(async () => {
    const subdomain = new URL(req.url).searchParams.get("store") || "";
    await requireStoreOwner(req, subdomain);
    const account = await getRazorpayAccount(subdomain);
    if (!account) return Response.json({ connected: false });
    const auth = account.auth || "keys";
    return Response.json({
      connected: true,
      auth,
      ...(auth === "keys" ? { keyId: account.keyId } : {}),
      mode: account.mode,
      connectedAt: account.connectedAt,
    });
  });
}

const ConnectBody = z.object({
  store: z.string().min(1).max(63),
  keyId: z.string().min(10).max(100),
  keySecret: z.string().min(10).max(200),
});

/** POST: connect or update Razorpay API keys. */
export async function POST(req: Request) {
  return handle(async () => {
    const parsed = ConnectBody.safeParse(await req.json().catch(() => null));
    if (!parsed.success) throw new ApiError(400, "Enter your Razorpay Key ID and Key Secret.");
    const { store: subdomain, keyId, keySecret } = parsed.data;
    const { store, uid } = await requireStoreOwner(req, subdomain);
    const account = await connectRazorpayAccount(store, uid, keyId, keySecret);
    return Response.json({ connected: true, keyId: account.keyId, mode: account.mode, connectedAt: account.connectedAt });
  });
}

/** DELETE ?store=<subdomain>: disconnect Razorpay. */
export async function DELETE(req: Request) {
  return handle(async () => {
    const subdomain = new URL(req.url).searchParams.get("store") || "";
    await requireStoreOwner(req, subdomain);
    await disconnectRazorpayAccount(subdomain);
    return Response.json({ connected: false });
  });
}
