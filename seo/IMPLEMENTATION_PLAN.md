# Implementation plan

Phases run in order. Each ends with the type check, unit tests and a production build. Nothing goes live without your go-ahead, and no outside account is changed without it.

## Phase 0: done in the working copy, waiting to go live

Shop SEO (canonicals, per-page titles, Product data, shop robots.txt and sitemap.xml), favicon set and manifest, pricing and themes metadata, theme demos set to noindex, font loading split. Details and files in SEO_AUDIT.md.

After it is live:
1. Open `https://<a shop>.shopersite.in/robots.txt` and `/sitemap.xml` and confirm they are the shop's own.
2. Run one product page through Google's Rich Results Test.
3. Run the homepage through PageSpeed Insights (phone) and note LCP, INP and CLS as the baseline.

## Phase 1: accuracy and small technical fixes (about an hour)

| Task | File |
| --- | --- |
| Replace "Direct UPI to your bank" and the "GPay, PhonePe, Paytm ... straight to your bank" line with what is true: cash on delivery on every plan; online payments through the seller's own Razorpay account on Growth and Pro. | `src/app/(home)/page.tsx` |
| Search the landing pages, guides and help articles for the same outdated claims and fix each. | `src/lib/landings.ts`, `src/lib/resources/` |
| Add `noindex` to `/orders/...`, `/invoice/...`, `/cashfree/return`. Give `/delete-account` a title and canonical (it must stay public for the Play Store). | those folders |
| Remove the `Host:` line from robots.txt. Write the AI crawler rules out explicitly once you have decided on training crawlers. | `src/app/robots.ts` |
| Add last-changed dates to help articles and legal pages in the sitemap. | `src/app/sitemap.ts` |
| Add FAQPage data for the homepage FAQ, built from the same list the page shows. | `src/app/(home)/layout.tsx` |

## Phase 2: content (two to three sessions)

1. `/about` page. Needs from you: company or proprietor name, city, contact email, and a short founder note if you want one. The legal details already entered in Admin → Company & legal can be reused.
2. `/pricing`: add a plain-text plan table under the toggle, generated from `src/lib/plans.ts`.
3. `/explore/shopify-alternatives-india`. Competitor prices must be checked on each competitor's own pricing page on the day of writing, with the date shown on the page.
4. `/explore/ecommerce-website-without-coding`.
5. Internal links: each landing page links to pricing, themes and one guide; the footer links to About and the comparison page.

## Phase 3: speed

1. Baseline from PageSpeed Insights (phase 0).
2. Homepage hero collage: 181 Unsplash photos. Options, in order of preference: serve the first screen's photos from our own domain at the size shown and mark one as the priority image; load the rest only when scrolled to. The look does not change.
3. Check the JavaScript sent to the homepage (the page is a large client component) and move anything not needed at first paint behind a lazy load.
4. Re-measure and record.

## Phase 4: accessibility and markup pass

Alt text on meaningful images (decorative collage photos correctly stay empty), button labels, colour contrast on grey text, one `h1` per page on every landing page and guide.

## Phase 5: off-site authority (drafts only; you approve and send)

| Channel | Action |
| --- | --- |
| Product directories | Listings on Product Hunt, G2, Capterra, SaaSworthy, AlternativeTo, Indie Hackers. Same one-sentence description everywhere. |
| Indian startup listings | Startup India registration and profile, YourStory and Inc42 startup submissions, F6S. |
| Reviews | Ask real sellers for a review on G2 or Google after their first orders. Never write or pay for one. |
| Seller stories | Two or three short case studies with the seller's permission: what they sell, how the shop is doing. Published on `/explore`. |
| Communities | Useful answers (not adverts) on Reddit r/IndianStartups and r/ecommerce, Quora, and seller Facebook groups, disclosing that you are the founder. |
| Press and partners | Short founder pitch to ecommerce newsletters and podcasts; listing as a Razorpay and Shiprocket partner where those programmes exist. |
| Profiles | Instagram, LinkedIn company page, X, YouTube with the same name, logo and description; then add them as `sameAs` in the Organization data. |

Drafts to prepare when you say go: the directory description (short and long), a founder pitch email, a review request message for sellers.

## Phase 6: monitoring

**Search Console and Bing.** Google Search Console is already set up with the sitemap submitted. Add the site to Bing Webmaster Tools (it can import from Search Console in one step); Bing's index feeds ChatGPT search and Copilot. You do this; it needs your sign-in.

**AI visibility sheet.** Once a month, ask each assistant (ChatGPT with search, Gemini, Claude with search, Perplexity, Copilot) these exact questions in a fresh chat:

1. What is the best free online store builder in India?
2. How can I create an ecommerce website for free?
3. What are affordable Shopify alternatives in India?
4. Which ecommerce platform is best for a small business in India?
5. How do I start selling products online without coding?
6. What is the best online store builder for Instagram sellers?
7. What is Shopersite?
8. How much does Shopersite cost?

Record in a spreadsheet, one row per question per assistant per month:

| Date | Assistant | Question | Shopersite mentioned? | Description accurate? | shopersite.in cited? | Competitors named | Sources cited |
| --- | --- | --- | --- | --- | --- | --- | --- |

Questions 7 and 8 test accuracy; 1 to 6 test discovery. Expect "not mentioned" on 1 to 6 at first. That changes mainly through phase 5, not through code.

## Decisions needed from you

1. Go live with phase 0?
2. Training crawlers: keep allowing (recommended) or block?
3. Approve phase 1 as written?
4. Details for the About page.
