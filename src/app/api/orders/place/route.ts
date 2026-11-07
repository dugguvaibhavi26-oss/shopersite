import { z } from "zod";
import { isEmail, isIndianMobile } from "@/lib/payments/cashfree-core";
import { INDIA_STATES } from "@/lib/india-states";
import { checkEmail, checkPersonName, checkPhone, checkPincode, checkPlace, checkStreet, cleanPhone } from "@/lib/validation";
import { ApiError, handle, rateLimit } from "@/lib/server/api-error";
import { placeOrder } from "@/lib/server/order-service";
import { cleanSubdomain } from "@/lib/server/store-data";
import { optionalUser } from "@/lib/server/firebase-admin";

const Body = z.object({
  store: z.string().min(1).max(63),
  method: z.enum(["upi", "cod"]),
  items: z
    .array(z.object({ productId: z.string().min(1).max(200), quantity: z.number().int().min(1).max(99), variantName: z.string().max(120).optional() }))
    .min(1)
    .max(50),
  couponCode: z.string().max(40).optional(),
  customer: z.object({ name: z.string().trim().min(2).max(80), phone: z.string().max(20), email: z.string().trim().max(200).optional() }),
  address: z.object({
    street: z.string().trim().min(5).max(200),
    city: z.string().trim().min(2).max(60),
    state: z.string().trim().min(2).max(60),
    pincode: z.string().trim().regex(/^[1-9][0-9]{5}$/),
  }),
  notes: z.string().trim().max(200).optional(),
  utr: z.string().trim().max(30).optional(),
});

/** POST: places a UPI or cash-on-delivery order. Public (buyers); prices are set by the server. */
export async function POST(req: Request) {
  return handle(async () => {
    rateLimit(req, "place", 10, 60_000);
    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) throw new ApiError(400, "Please check your delivery details and try again.");
    const b = parsed.data;
    const store = cleanSubdomain(b.store);
    if (!store) throw new ApiError(404, "Store not found.");
    const phone = cleanPhone(b.customer.phone);
    const wrong =
      checkPersonName(b.customer.name, "full name") ||
      checkPhone(phone) ||
      checkEmail(b.customer.email || "", { required: false }) ||
      checkStreet(b.address.street) ||
      checkPlace(b.address.city, "city") ||
      checkPincode(b.address.pincode) ||
      (INDIA_STATES.includes(b.address.state) ? "" : "Choose your state.");
    if (wrong || !isIndianMobile(phone)) throw new ApiError(400, wrong || "Enter a 10-digit mobile number.");
    const email = b.customer.email?.trim().toLowerCase() || undefined;
    if (email && !isEmail(email)) throw new ApiError(400, "Check your email address.");
    const buyer = await optionalUser(req);
    const order = await placeOrder({
      subdomain: store,
      ...(buyer ? { customerUid: buyer.uid } : {}),
      method: b.method,
      items: b.items,
      couponCode: b.couponCode || undefined,
      customer: { name: b.customer.name, phone, ...(email ? { email } : {}) },
      address: b.address,
      notes: b.notes || undefined,
      utr: b.utr ? b.utr.replace(/\s/g, "") : undefined,
    });
    return Response.json({ order });
  });
}
