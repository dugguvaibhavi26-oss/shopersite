import { exchangeOAuthCode } from "@/lib/server/razorpay";
import { connectRazorpayOAuth } from "@/lib/server/razorpay-service";
import { getStoreDoc } from "@/lib/server/firebase-admin";
import { oauthRedirectUri, readOAuthState } from "@/lib/server/razorpay-oauth-state";

/** Razorpay sends the seller back here (?code=&state=) after they approve or decline. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const back = (result: "connected" | "error") => Response.redirect(new URL(`/dashboard?razorpay=${result}`, url.origin).toString(), 302);

  const code = url.searchParams.get("code") || "";
  const state = readOAuthState(url.searchParams.get("state") || "");
  if (url.searchParams.get("error") || !code || !state) return back("error");

  try {
    const store = await getStoreDoc(state.subdomain);
    if (!store) return back("error");
    const tokens = await exchangeOAuthCode(code, oauthRedirectUri(req));
    await connectRazorpayOAuth(store, state.uid, tokens);
    return back("connected");
  } catch (err) {
    console.error("[razorpay oauth] callback failed", err);
    return back("error");
  }
}
