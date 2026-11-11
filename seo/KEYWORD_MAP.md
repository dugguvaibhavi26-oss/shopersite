# Keyword and search-intent map

One page per intent. A new page is proposed only where no existing page answers the question.
Search volumes are not listed: they need Google Keyword Planner or Search Console data, which this audit did not have.

## Existing pages

| Topic | What the searcher wants | Page | State |
| --- | --- | --- | --- |
| free online store builder | Find a tool and start | `/free-online-store-builder` | Live |
| free ecommerce website builder | Find a tool and start | `/free-ecommerce-website-builder` | Live |
| create / build online store for free | Step-by-step how-to | `/build-online-store-for-free` | Live |
| online store builder India | A tool that handles COD, UPI, GST, Indian couriers | `/online-store-builder-india` | Live |
| ecommerce platform / website builder for small business | Is it affordable and simple | `/website-builder-for-small-business` | Live |
| free website for small business | Free option | `/free-website-for-small-business` | Live |
| Instagram store builder | Turn Instagram followers into orders | `/instagram-store-builder` | Live |
| WhatsApp selling website | Take orders from WhatsApp properly | `/whatsapp-selling-website` | Live |
| Shopersite pricing / plans | Cost | `/pricing` | Live; now has its own title and is in the sitemap |
| online store themes / designs | Browse designs | `/themes` | Live |
| Instagram shop vs own website | Decide | `/explore/instagram-shop-vs-own-website` | Live |
| marketplace vs own website | Decide | `/explore/marketplace-vs-own-website` | Live |
| COD vs prepaid, reduce RTO | Learn | `/explore/cod-vs-prepaid-reduce-rto` | Live |
| how-to and setup questions | Fix a specific thing | `/docs/...` (42 articles) | Live |

## Overlap to watch

These three pages target close phrases. They are fine as long as each keeps a different angle; do not add a fourth.

- `/free-online-store-builder`: the product (what you get on the free plan).
- `/free-ecommerce-website-builder`: the features (cart, checkout, orders, stock).
- `/build-online-store-for-free`: the steps (how to do it).

Same for `/website-builder-for-small-business` (who it suits) and `/free-website-for-small-business` (what is free). If Search Console later shows two of them competing for the same queries, merge the weaker into the stronger with a redirect.

## Gaps: pages worth adding

| Topic | Intent | Proposed page | Why it is distinct |
| --- | --- | --- | --- |
| Shopify alternatives in India | Compare before choosing | `/explore/shopify-alternatives-india` | Honest table of Shopify, Dukaan, Instamojo, Wix and Shopersite: rupee price, commission, COD, free plan, best for. |
| ecommerce website without coding | Reassurance for non-technical sellers | `/explore/ecommerce-website-without-coding` | A walk-through with real screens: sign up, pick a theme, add a product, share the link. |
| how to start selling online in India | Beginner's full path | `/explore/how-to-start-selling-online-india` | Covers what the tool does not: GST basics, courier choice, pricing, first customers. Check the 15 existing guides first; extend one if it already covers most of this. |
| what is Shopersite | Brand check | `/about` | Who runs it, what it is, contact, company details. |

## Not worth a page

- City pages ("online store builder Hyderabad"): identical content with a city name swapped is thin content.
- One page per competitor ("Shopersite vs X") before the single comparison page has proved itself.
- Anything about features that do not exist yet (staff roles, store app).

## Rules for every page

- One `h1` that states the topic in plain words; the first paragraph answers the question directly.
- Prices and limits come from `src/lib/plans.ts`, never typed by hand.
- Each new page links to two or three related pages and is linked from the footer or the Explore index.
- No ratings, user counts or testimonials unless they are real and can be shown.
