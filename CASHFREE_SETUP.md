# Cashfree setup (sellers get their own merchant accounts)

Shopersite uses Cashfree's **Embedded Partner** program:

1. Each seller gets their **own Cashfree merchant account**, which Shopersite creates through its partner account.
   The shop's built-in policy pages are sent along with it, so the seller doesn't have to type them on the website step: Contact, Terms, Privacy, Returns/Refund and Shipping (`/s/<store>/pages/...`). If Cashfree refuses them, the account is created without them.
2. The seller completes **KYC on Cashfree's hosted form**, opened from Dashboard › Settings › Online payments. They enter their PAN, ID, business proof and bank account there. Shopersite never sees or stores these documents.
3. Buyer payments are created **on the seller's merchant account**. Cashfree settles them **directly to the seller's verified bank account**. Shopersite never receives, holds or forwards buyer money.
4. Cash on delivery stays available. When online payment is live, it replaces the old "scan UPI QR + type UTR" option.

---

## Step 1: Get your partner account approved (you, on partner.cashfree.com)

You have already created the partner account. Next:

1. Log in at **https://partner.cashfree.com** and finish **your own partner KYC**:
   - website URL, official email and contact details
   - business PAN, the authorised signatory's PAN and address proof
   - bank account
   - for a company: certificate of incorporation, MOA and AOA
2. Cashfree says it activates partner accounts within about 48 hours of the documents being sent. If it's slow, write to **partnership.support@cashfree.com** and ask them to enable the **Embedded Partner / Platform (merchant onboarding) APIs** for your account.
3. Your test (sandbox) partner dashboard is at https://test.cashfree.com/partner-ui. Use it for testing until production is approved.

## Step 2: Get the API key

Partner Dashboard › **Developers › API Keys › Generate API Key**.
The sandbox and production keys are different. Use the sandbox key first.

## Step 3: Get a Firebase service account

The payment routes save payments and paid orders from the server, so they need admin access to Firestore.

Firebase console (project **rox-shoppersite**) › ⚙ Project settings › **Service accounts** › **Generate new private key**. This downloads a JSON file.
Keep it secret. Never commit it and never put it in a `NEXT_PUBLIC_` variable.

## Step 4: Set the environment variables

Set these locally in `.env.local`, and on Vercel under Project › Settings › Environment Variables:

```
CASHFREE_ENV=sandbox
CASHFREE_PARTNER_API_KEY=<sandbox partner API key>
FIREBASE_SERVICE_ACCOUNT=<the whole service-account JSON on one line, or its base64>
NEXT_PUBLIC_APP_URL=https://<your domain>
```

To make the base64 version in PowerShell:

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("C:\path\to\service-account.json"))
```

Redeploy after changing them.

## Step 5: Firestore security rules

The rules live in `firestore.rules` (they already keep `cashfree_merchants` and `payments`
server-only). Publish them as described in `LAUNCH.md` (`npm run rules:deploy`).

## Step 6: Webhook

Partner Dashboard › **Developers › Webhooks** › add:

```
https://<your domain>/api/cashfree/webhook
```

Turn on the merchant onboarding status events and the payment events. Each payment also sends its own `notify_url` to this same address automatically, as long as the site is on https.

Webhooks are only used as a **signal to re-check**. The server always asks Cashfree's API for the real payment or KYC status before saving anything, so a forged webhook can't mark an order paid. If a webhook is missed, the status is still updated when:

- the buyer returns to the order page,
- the seller opens the dashboard, or
- the checkout checks whether online payment is available.

## Step 7: Test the whole flow in sandbox

1. Sign in as a seller › **Dashboard › Settings › Online payments** › **Start KYC with Cashfree**.
2. On Cashfree's form, use their sandbox test data:
   - PAN `ABCPV1234D`
   - Aadhaar `655675523712`, Aadhaar OTP `111000`
   - Bank account `026291800001191`, IFSC `YESB0000262`
3. The card should move to **"Cashfree is reviewing"**, then **"Online payments are live"**. In sandbox, approval may happen in the test partner dashboard.
4. Open the shop and add a product. At checkout, choose **Pay online** and pay with a Cashfree sandbox test UPI ID or card.
5. You should land on the order page showing **"Payment received"**. The order appears in the seller's Orders tab as **Paid · ONLINE**, with the Cashfree payment ID.

Things to confirm during this sandbox run, because Cashfree's docs are ambiguous about them:

- The `merchant_id` we create, `shs_<store>`, is accepted in the `x-partner-merchantid` header when creating payments. Partner Dashboard › Merchants shows the ID.
- Server logs show `[cashfree webhook] … (signed)`. If they say `(unsigned)`, payments still work, because webhooks are only a re-check signal. Tell your developer so the signature check can be adjusted.

## Step 8: Go live

1. Make sure Cashfree has approved your **production** partner account.
2. Set `CASHFREE_ENV=production` and the **production** `CASHFREE_PARTNER_API_KEY`, then redeploy.
3. The site must be on **https** (Cashfree rejects http return addresses in production).
4. Sellers who did KYC in sandbox must do it again in production. The dashboard says so, and the Shopersite team needs to delete that seller's `cashfree_merchants/<store>` document first.

## Your earnings as a platform

Cashfree's partner program lets you add a **commission markup** on top of Cashfree's fee, configured on your partner account. Cashfree collects it and pays it to you monthly against an invoice (Partner Dashboard › Commission). No code is involved, and Shopersite still never touches the sellers' money.

## Where the code is

| What | File |
|---|---|
| Pricing, KYC status rules, paid-order recording, webhook signature (pure, tested) | `src/lib/payments/cashfree-core.ts` |
| Cashfree API calls | `src/lib/server/cashfree.ts` |
| Onboarding, payments and verification logic | `src/lib/server/payment-service.ts` |
| Firebase admin and seller sign-in check | `src/lib/server/firebase-admin.ts` |
| API routes | `src/app/api/cashfree/*`, `src/app/api/payments/*` |
| Seller card (Settings) | `src/components/dashboard/cashfree-payments.tsx` |
| Checkout "Pay online" | `src/components/storefront/site/checkout.tsx` |
| Payment confirmation on the order page | `src/components/storefront/site/account.tsx` |
| Tests | `tests/unit/cashfree.test.ts` |
