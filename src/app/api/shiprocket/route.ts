import { z } from "zod";
import { ApiError, handle, rateLimit } from "@/lib/server/api-error";
import { requireStoreOwner } from "@/lib/server/firebase-admin";
import { connectShiprocket, disconnectShiprocket, saveShiprocketPrefs, shiprocketStatus } from "@/lib/server/shiprocket-service";

/** GET ?store=: is Shiprocket connected, pickup addresses and package defaults. Owner only. */
export async function GET(req: Request) {
  return handle(async () => {
    const { store } = await requireStoreOwner(req, new URL(req.url).searchParams.get("store") || "");
    return Response.json(await shiprocketStatus(store));
  });
}

const Connect = z.object({ store: z.string().min(1).max(63), email: z.string().trim().email().max(200), password: z.string().min(1).max(200) });

/** POST {store, email, password}: connect the seller's Shiprocket API user. Owner only. */
export async function POST(req: Request) {
  return handle(async () => {
    rateLimit(req, "shiprocket-connect", 10, 30 * 60_000);
    const parsed = Connect.safeParse(await req.json().catch(() => null));
    if (!parsed.success) throw new ApiError(400, "Enter the Shiprocket API user's email and password.");
    const { store } = await requireStoreOwner(req, parsed.data.store);
    return Response.json(await connectShiprocket(store, parsed.data.email, parsed.data.password));
  });
}

const Prefs = z.object({
  store: z.string().min(1).max(63),
  pickupLocation: z.string().max(80),
  defaults: z.object({ weight: z.number(), length: z.number(), breadth: z.number(), height: z.number() }),
});

/** PATCH {store, pickupLocation, defaults}: which pickup address and the usual package size. Owner only. */
export async function PATCH(req: Request) {
  return handle(async () => {
    const parsed = Prefs.safeParse(await req.json().catch(() => null));
    if (!parsed.success) throw new ApiError(400, "Check the package size and weight.");
    const { store } = await requireStoreOwner(req, parsed.data.store);
    return Response.json(await saveShiprocketPrefs(store, parsed.data));
  });
}

/** DELETE ?store=: disconnect Shiprocket. Owner only. */
export async function DELETE(req: Request) {
  return handle(async () => {
    const { store } = await requireStoreOwner(req, new URL(req.url).searchParams.get("store") || "");
    await disconnectShiprocket(store);
    return Response.json({ ok: true });
  });
}
