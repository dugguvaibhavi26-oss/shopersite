import { rateLimit } from "@/lib/server/api-error";
import { matchState, stateFromPin } from "@/lib/india-states";

type Result = { pincode: string; city: string; state: string; areas: string[] };
const cache = new Map<string, Result>();

/**
 * GET ?pin=500081 → the city (district), state and post office areas for a PIN code, from India
 * Post. If India Post is slow or down, the state still comes from the PIN's first digits.
 */
export async function GET(req: Request) {
  try {
    rateLimit(req, "pincode", 40, 60_000);
  } catch {
    return Response.json({ error: "Too many tries." }, { status: 429 });
  }
  const pin = new URL(req.url).searchParams.get("pin") || "";
  if (!/^[1-9][0-9]{5}$/.test(pin)) return Response.json({ error: "PIN code must be 6 digits." }, { status: 400 });
  const hit = cache.get(pin);
  if (hit) return Response.json(hit, { headers: { "cache-control": "public, max-age=86400" } });

  let result: Result = { pincode: pin, city: "", state: stateFromPin(pin), areas: [] };
  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`, { signal: AbortSignal.timeout(4000) });
    const data = (await res.json()) as { Status?: string; PostOffice?: { Name: string; District: string; State: string }[] | null }[];
    const offices = data?.[0]?.Status === "Success" ? data[0].PostOffice || [] : null;
    if (offices === null && data?.[0]?.Status === "Error") {
      return Response.json({ error: "We couldn't find this PIN code. Check it and try again." }, { status: 404 });
    }
    if (offices && offices.length) {
      result = {
        pincode: pin,
        city: offices[0].District || "",
        state: matchState(offices[0].State || "") || result.state,
        areas: [...new Set(offices.map((o) => o.Name))].slice(0, 20),
      };
    }
  } catch {
    // India Post didn't answer: keep the state from the PIN prefix
  }
  if (result.city) {
    cache.set(pin, result);
    if (cache.size > 20000) cache.clear();
  }
  return Response.json(result, { headers: { "cache-control": result.city ? "public, max-age=86400" : "no-store" } });
}
