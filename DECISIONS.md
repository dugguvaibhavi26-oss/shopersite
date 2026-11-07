# Architectural Decisions Log (DECISIONS.md)

This log records every key technical decision, architectural assumption, trade-off, and security rule adopted in the Social Seller Store Builder (`shopper.site`).

---

## 0. Brand & Domain Placeholders (Section 1 & User Instructions)
- **Decision:** The platform brand and domain are centralized in `src/lib/config/site.ts` using configurable defaults (`PRODUCT_NAME = 'Shopper'`, `DOMAIN = 'shopper.site'`) that can be overridden via environment variables (`NEXT_PUBLIC_APP_NAME`, `NEXT_PUBLIC_APP_DOMAIN`).
- **Rationale:** Ensures zero hardcoded brand names across the codebase; enables 1-click white-labeling or rebranding before production launch.

---

## 1. Framework & Dependency Versions (Section 3 & User Changes)
Recorded at install time (October 2026):
- **Next.js:** `16.4.2` (App Router, Server Components, React Server Actions)
- **React & React DOM:** `19.3.1`
- **Tailwind CSS:** `4.3.3` with `@tailwindcss/postcss` for zero-bloat CSS variable theming
- **Drizzle ORM:** `0.45.4` & `drizzle-kit 0.31.4` (Lightweight SQL, native Postgres RLS compatibility, zero cold-start bloat)
- **Postgres Driver:** `postgres 3.4.5` (Native connection pooling and low-memory overhead)
- **Vitest:** `3.0.8` (Fast ESM unit and integration testing)
- **TypeScript:** `5.8.2` (Strict mode enabled)
- **Zod:** `3.24.2` (Server-side schema validation on all inputs)
- **Lucide React:** `1.16.0` (Consistent line icon set)

---

## 2. Multi-Tenancy & Database Security (Section 3, Section 4 & User Changes)
- **Tenant Isolation Policy:** Every table containing seller/store data is provisioned with a `store_id UUID NOT NULL` foreign key.
- **Strict Row Level Security (RLS):**
  - PostgreSQL tables enforce `ENABLE ROW LEVEL SECURITY` and `FORCE ROW LEVEL SECURITY`.
  - The application connects using a dedicated non-owner, non-superuser database role (`shopper_app_user`). Superuser or table-owner bypass is strictly prohibited.
  - Policy enforcement rule:
    ```sql
    CREATE POLICY tenant_isolation_policy ON <table>
    FOR ALL
    USING (store_id = NULLIF(current_setting('app.current_store_id', true), '')::uuid)
    WITH CHECK (store_id = NULLIF(current_setting('app.current_store_id', true), '')::uuid);
    ```
  - Without setting `app.current_store_id` in the database transaction context, all tenant queries return zero rows.
  - Cross-tenant reads and writes trigger PostgreSQL RLS policy violations.

---

## 3. Payments & Legal Compliance (Section 4 - Non-Negotiables)
- **RBI Compliance (Zero Money Handling):** Under Reserve Bank of India payment aggregator guidelines, the platform never collects, holds, pools, or settles buyer money.
- **Buyer Payment Methods:**
  1. Cash on Delivery (COD) with optional seller-set COD fee.
  2. Direct UPI to seller (displays seller's UPI QR, opens `upi://pay` deep link, collects buyer UTR or screenshot for seller's manual verification).
  3. Seller-supplied payment link (external URL created in seller's own gateway/app).
  4. Seller bank account transfer details.
- **Platform Billing:** The only money collected by the platform is its own SaaS subscription fee from sellers, processed through the owner's dedicated Razorpay account.

---

## 4. Dev OTP Guard (User Changes)
- **Rule:** A fixed or mock OTP for development is strictly prohibited in production.
- **Implementation:** `src/lib/config/site.ts` and `src/lib/providers/sms/` check at startup: if `ALLOW_DEV_MOCK_OTP === 'true'` and `NODE_ENV === 'production'`, the application crashes immediately with a fatal configuration error.

---

## 5. Storefront Routing & SEO (User Changes)
- **Route Structure:**
  - Public storefront products: `/products/[slug]`
  - Public storefront collections: `/collections/[slug]`
  - Search: `/search`
  - Cart drawer / checkout: `/cart`, `/checkout`
  - Secure un-guessable order tracking: `/orders/[token]`
- **Performance Budget:** First-load storefront JavaScript must remain strictly under 150 KB gzipped. Thin client components; all themes dynamically styled via CSS variables without client-side CSS-in-JS runtimes.

---

## 6. Design System & Accessibility (Section 12 & 13)
- **Color Palette & Contrast:** Curated HSL/Hex color tokens with automated WCAG 2.2 AA contrast evaluation (minimum 4.5:1 for standard text, 3:1 for large text).
- **Mobile-First Layout:** Designed for 360 px width first (bottom navigation bar on mobile; expandable sidebar on desktop).
- **Touch Targets:** Minimum 44x44 px touch targets for all interactive elements.

---

## 7. Multi-Tenant Subdomain Provisioning & Routing
- **Subdomain Mapping:** Store URLs map to `{subdomain}.shopper.site` via Next.js Middleware/Proxy rewriting requests to `/s/[subdomain]`.
- **Zero-Latency Tenant Resolution:** Storefront loads dynamically tailored CSS variables (`--primary`, `--accent`, etc.) based on store's active theme without client-side CSS-in-JS overhead.

---

## 8. Subscription Tiers & Product Quota Enforcement
- **Free Plan:** 10 products catalog limit, default "Classic Bloom" theme, direct UPI QR & COD.
- **Growth Plan (₹299/mo):** 50 products catalog limit, 3 designer themes (Classic, Vibrant Bazaar, Pastel Luxe), promotional hero banners, discount coupons, customer reviews moderation.
- **Pro Plan (₹799/mo):** Unlimited products catalog, all 5 premium themes (including Midnight Noir & Artisan Craft), custom domain support, VIP WhatsApp support.
- **Enforcement:** Dashboard enforces limits on product creation via `canAddProduct()` and theme activation via `isThemeAllowed()`, prompting an upgrade modal with instant plan activation.


---

## 9. Android & iOS Apps (Capacitor)
- **Decision:** The mobile apps are Capacitor 8 native shells (`android/`, `ios/`) that load the deployed Next.js site (`server.url` in `capacitor.config.ts`). They are not a static export.
- **Rationale:** The site needs a server: subdomain middleware (`src/middleware.ts`) and dynamic routes (`/s/[subdomain]/…`, `/orders/[token]`). A static export would drop them. Loading the live site keeps one codebase, the same Firebase auth and data, and the same business logic on web, Android and iOS. Web deploys update the apps without a store release.
- **App-only behaviour** lives in `src/components/native/native-bridge.tsx` and `src/lib/native/*`. It is switched on only when `window.Capacitor` reports a native platform, so the website in a browser is unchanged. It covers the back button, external/UPI/WhatsApp links, the offline banner, the splash screen and native Google sign-in.
- **Google sign-in in the apps** uses the native Google account picker (`@capgo/capacitor-social-login`) and `signInWithCredential`, because Google blocks OAuth popups inside WebViews.
- **App start flow:** the apps open at `/app` (launch screen), not the marketing home page. Signed-in sellers go straight to the dashboard. First launch shows three photo-led onboarding slides (`/app/welcome`), and returning signed-out users see the app login (`/app/login`). Onboarding is remembered in localStorage and is also marked done whenever someone signs in. Inside the app, `/` and `/login` are replaced by these screens.
- **Setup and build steps:** `MOBILE_APP_SETUP.md`.
