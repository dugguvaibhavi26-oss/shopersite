import { exchangeOAuthCode } from "@/lib/server/razorpay";
import { connectRazorpayOAuth } from "@/lib/server/razorpay-service";
import { getStoreDoc } from "@/lib/server/firebase-admin";
import { oauthRedirectUri, readOAuthState } from "@/lib/server/razorpay-oauth-state";

/**
 * Razorpay sends the seller back here (?code=&state=) after they approve or decline. They land on
 * Plugins → Razorpay (the page they started from), which shows whether it worked.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const state = readOAuthState(url.searchParams.get("state") || "");
  const back = (result: "connected" | "error") => {
    const to = new URL("/dashboard", url.origin);
    if (state) to.searchParams.set("store", state.subdomain);
    to.searchParams.set("tab", "plugins");
    to.searchParams.set("plugin", "razorpay");
    to.searchParams.set("razorpay", result);
    return Response.redirect(to.toString(), 302);
  };

  const code = url.searchParams.get("code") || "";
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
