/** An error whose message is safe to show the user, with the HTTP status to send. */
export class ApiError extends Error {
  constructor(public status: number, message: string, public code?: string) {
    super(message);
  }
}

/** Runs a route body and turns errors into JSON responses without leaking internals. */
export async function handle(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof ApiError) {
      return Response.json({ error: err.message, ...(err.code ? { code: err.code } : {}) }, { status: err.status });
    }
    console.error("[payments] unexpected error", err);
    return Response.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}

const hits = new Map<string, number[]>();

/**
 * A simple per-visitor limit for public routes (per server instance). It stops bots hammering a
 * route; the real protections are the checks in each route.
 */
export function rateLimit(req: Request, name: string, max: number, windowMs: number) {
  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || req.headers.get("x-real-ip") || "local";
  const key = `${name}:${ip}`;
  const now = Date.now();
  const list = (hits.get(key) || []).filter((t) => now - t < windowMs);
  if (list.length >= max) throw new ApiError(429, "Too many tries. Please wait a minute and try again.");
  list.push(now);
  hits.set(key, list);
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.some((t) => now - t < windowMs)) hits.delete(k);
}
