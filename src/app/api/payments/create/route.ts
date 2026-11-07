import { z } from "zod";
import { isEmail, isIndianMobile } from "@/lib/payments/cashfree-core";
import { ApiError, handle } from "@/lib/server/api-error";
import { createPayment } from "@/lib/server/payment-service";

const Body = z.object({
  store: z.string().min(1).max(63),
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
  returnBase: z.string().url().max(300),
});

/** POST: starts an online payment on the seller's own Cashfree account. Public (buyers). */
export async function POST(req: Request) {
  return handle(async () => {
    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) throw new ApiError(400, "Please check your delivery details and try again.");
    const b = parsed.data;
    const phone = b.customer.phone.replace(/[^0-9]/g, "").slice(-10);
    if (!isIndianMobile(phone)) throw new ApiError(400, "Enter a 10-digit mobile number.");
    const email = b.customer.email || undefined;
    if (email && !isEmail(email)) throw new ApiError(400, "Check your email address.");
    const result = await createPayment(
      {
        subdomain: b.store.toLowerCase(),
        items: b.items,
        couponCode: b.couponCode || undefined,
        customer: { name: b.customer.name, phone, ...(email ? { email } : {}) },
        address: b.address,
        notes: b.notes || undefined,
        returnBase: b.returnBase,
      },
      req.headers.get("origin")
    );
    return Response.json(result);
  });
}
