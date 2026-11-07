# Launch checklist (security + payments)

This release moves every sensitive action to the server and locks the database. **Follow the steps
in this order.** Turning on the new database rules before the new code is live would stop the
current site taking orders.

## What changed

| Before | Now |
|---|---|
| Database and file storage open to anyone (test mode, **expires 25 Nov 2026**, then the whole app stops) | Locked by `firestore.rules` / `storage.rules`, attack-tested (63 cases, `npm run test:rules`) |
| Admin panel "password" `admin2026`, shown on screen | Sign in with an admin account (verified email in `NEXT_PUBLIC_ADMIN_EMAILS`), enforced by the database rules |
| Sellers could give themselves any plan / theme | Plan, plan expiry, owned themes, suspension: only an admin can change them |
| Buyers' browsers wrote orders (could mark them paid, change totals, wipe orders) | Orders are placed by the server: prices from the saved products, stock checked, coupons checked |
| Fake UPI references accepted | UTR must be 12 digits and can be used **once** (per shop for orders, platform-wide for plans/themes); orders stay "payment being checked" until the seller confirms |
| Plan / theme payments approved in the seller's browser ("Simulate approval") | Server records the request with its own amount, payee and reference; only an admin approves |
| Buyers' names, phones and addresses readable by anyone | Moved to `stores/{shop}/private/data`, readable only by the shop owner and admins |
| Login page followed any `?redirect=` (phishing) | Only pages on this site |

Online card / net-banking payments (Cashfree) stay **off** at launch: buyers pay by UPI or COD.

## Step 1: Environment variables on Vercel (Project › Settings › Environment Variables, Production)

| Name | Value |
|---|---|
| `FIREBASE_SERVICE_ACCOUNT` | **Required.** The same base64 text as in `.env.local`. Without it buyers can't place orders. |
| `NEXT_PUBLIC_ADMIN_EMAILS` | `tejaswithreddy0101@gmail.com` (comma-separate more admins) |
| `NEXT_PUBLIC_APP_URL` | `https://shopersite.in` |
| `ALLOW_DEV_MOCK_OTP` | `false` |

Do **not** set `CASHFREE_PARTNER_API_KEY` on production until Cashfree gives you **live** keys
(a test key on the live site would show "Pay online" with test money).

## Step 2: Deploy the new code to production

## Step 3: Move buyers' details to the private documents

```
node scripts/migrate-private.mjs            # dry run: lists what will move
node scripts/migrate-private.mjs --apply    # does it (writes a local backup to backups/ first)
```

## Step 4: Publish the security rules

```
npm run test:rules        # 63 attack tests in the local emulator, must all pass
npm run rules:deploy      # publishes firestore.rules + storage.rules
```

If `rules:deploy` says permission denied: `node scripts/deploy-rules.mjs --print`, then paste
`rules-out/firestore.rules` into Firebase console › Firestore › Rules and `rules-out/storage.rules`
into Storage › Rules, and click **Publish** on each.

## Step 5: Check on the live site (5 minutes)

1. Open a shop › add to bag › checkout › **UPI**: the payment page shows the QR; enter a 12-digit UTR, tick, place order › order page says "payment being checked".
2. Same with **Cash on delivery**.
3. Seller dashboard › Orders: both orders show; open the UPI one › **Mark as paid** works.
4. Seller › Billing › upgrade: the payment page shows Shopersite's UPI ID and amount; submit a UTR › "under review".
5. `/admin` signed in as the admin email › Plans & payments › approve it › the seller's plan changes.
6. `/admin` signed in as a non-admin › "isn't an admin".

## Every day after launch

- Approve plan / theme payments in `/admin` only after you see the money (and the UTR) in your bank app.
- Sellers: confirm a UPI order ("Mark as paid") only after seeing the money in your bank app.
