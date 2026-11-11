# Shopersite SEO audit

Audited 11 November 2026 against the code in this repository and the live site (www.shopersite.in).
Nothing here promises rankings or AI recommendations; it lists what is true today and what to fix.

## How the site is built

- Next.js 16 App Router on Vercel. Marketing pages are server-rendered and mostly static (169 static pages in the production build).
- Seller shops run on their own addresses (`name.shopersite.in`, or a Pro shop's own domain). `src/middleware.ts` maps those addresses to `/s/<name>`. Shop pages are drawn in the browser by the theme code.
- SEO helpers live in `src/lib/seo.ts` (page metadata, Organization, WebSite and SoftwareApplication data) and `src/lib/resources/index.ts` (breadcrumb and FAQ data).

## What is already right

| Area | Finding |
| --- | --- |
| Redirects | `http://` goes to `https://`, the bare domain goes to `www`, trailing slashes are removed (all 308). |
| Crawler access | Googlebot, Bingbot, OAI-SearchBot, ChatGPT-User, PerplexityBot and Claude-SearchBot all get a 200 with the full page. No CDN or firewall block. |
| Private areas | `/dashboard`, `/admin`, `/api/`, `/app/`, `/orders/`, `/invoice/`, `/login`, `/signup`, `/gallery` are disallowed in robots.txt. Login, signup, gallery and app pages also carry `noindex`. |
| Sitemap | 93 addresses: homepage, 8 landing pages, themes, 15 guides, tools, festival calendar, 42 help articles, 13 legal pages. |
| Titles and canonicals | Every landing page, guide, help article and legal page has its own title, description, canonical, Open Graph and X card. |
| Structured data | Homepage carries Organization, WebSite and SoftwareApplication with the three real plan prices. No ratings or reviews are claimed. Guides and help articles carry breadcrumbs. |
| Headings | Homepage has one `h1` and seven `h2`. |
| HTTPS | HSTS is on for two years, including subdomains. |

## Problems found

Severity: **High** hurts indexing or accuracy now. **Medium** is a missed opportunity. **Low** is tidy-up.

| # | Severity | Problem | Where | Status |
| --- | --- | --- | --- | --- |
| 1 | High | Shop pages had no canonical address, and every page of a shop shared one title and description (the shop name). | `src/app/s/[subdomain]/` | **Fixed in this change** |
| 2 | High | Shops served the main site's robots.txt and sitemap.xml, so search engines never got a list of a shop's products. | `src/middleware.ts` | **Fixed in this change** |
| 3 | High | Homepage states things the product no longer does: "Direct UPI to your bank" and "Buyers pay with GPay, PhonePe, Paytm or COD. Money goes straight to your bank". Seller UPI was removed; the Free plan is cash on delivery only and paid plans use the seller's own Razorpay account. | `src/app/(home)/page.tsx` lines 701 and 1202 | Proposed |
| 4 | Medium | Theme demo shops (`/themes/preview/...`) were open to indexing: about 30 sample shops with made-up products. | `src/app/themes/preview/` | **Fixed in this change** (noindex) |
| 5 | Medium | `/pricing` had no title, description or canonical of its own and was missing from the sitemap. | `src/app/pricing/` | **Fixed in this change** |
| 6 | Medium | `/themes` had no canonical or share image. | `src/app/themes/layout.tsx` | **Fixed in this change** |
| 7 | Medium | Shop product pages had no Product data (price, stock, image) for rich results. | shop pages | **Fixed in this change** |
| 8 | Medium | One stylesheet for 21 font families held up the first paint of every page, although the main site uses four. | `src/app/layout.tsx` | **Fixed in this change** |
| 9 | Medium | Homepage loads 181 photos from Unsplash for the hero collage. 178 are lazy, but none is marked as the priority image and all come from another server. | `src/app/(home)/page.tsx` | Proposed |
| 10 | Medium | No About page. AI assistants and Google look for one to confirm who runs a product. | new page | Proposed |
| 11 | Medium | No page that honestly compares Shopersite with Shopify and similar tools, although "Shopify alternative India" is a target question. | new page | Proposed |
| 12 | Medium | The homepage FAQ has no FAQPage data. Landing pages already have it. | `src/app/(home)/layout.tsx` | Proposed |
| 13 | Low | Only an SVG icon existed: no `favicon.ico`, no phone home-screen icon, no web manifest. | `src/app/`, `public/` | **Fixed in this change** |
| 14 | Low | `/delete-account`, `/orders/...`, `/invoice/...` and `/cashfree/return` have no `noindex` tag. robots.txt blocks most of them, but a blocked page that is linked from elsewhere can still appear as a bare address. | those folders | Proposed |
| 15 | Low | robots.txt has a `Host:` line, which only Yandex ever read. Harmless. | `src/app/robots.ts` | Proposed (remove) |
| 16 | Low | robots.txt makes no difference between AI search crawlers and AI training crawlers; everything is allowed. That is a business decision, not a bug. See GEO_STRATEGY.md. | `src/app/robots.ts` | Needs your decision |
| 17 | Low | Most sitemap entries have no last-changed date. | `src/app/sitemap.ts` | Proposed |

## What was changed already (not yet live)

- `src/lib/server/shop-seo.tsx` (new): shop titles, descriptions, canonicals, Product, Breadcrumb, ItemList and OnlineStore data, shop robots.txt and sitemap.xml. Uses only what buyers already see. Ratings appear only when the shop has real approved reviews.
- `src/app/s/[subdomain]/` pages and two new routes (`robots.txt`, `sitemap.xml`); `src/middleware.ts` sends those two addresses to the shop's own versions.
- Paused, draft and suspended shops are `noindex`, get `Disallow: /` and an empty sitemap. Cart, checkout, account, order, wishlist and search pages stay out of search.
- `src/app/favicon.ico`, `public/apple-touch-icon.png`, `public/icon-192.png`, `public/icon-512.png`, `public/maskable-512.png`, `public/site.webmanifest`.
- `src/app/pricing/layout.tsx` (new), `src/app/themes/layout.tsx`, `src/app/themes/preview/layout.tsx` (new), `src/app/sitemap.ts`.
- `src/lib/font-links.ts` (new) and `src/app/layout.tsx`: four core fonts load with the page; theme fonts load in the background on the main site and up front on shops.

Checks run: type check clean, 373 unit tests pass, production build passes. Tested on the local server with a real shop (`roxten`): robots.txt, sitemap.xml, canonicals and Product data all correct.

## Not tested

- Google's Rich Results Test and PageSpeed Insights need the change to be live first.
- Search Console coverage after the change.
