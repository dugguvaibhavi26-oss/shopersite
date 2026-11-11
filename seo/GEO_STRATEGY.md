# Shopersite and AI search (GEO strategy)

Goal: when someone asks ChatGPT, Gemini, Claude, Perplexity or Copilot about free online store builders in India, the assistant can find Shopersite, describe it correctly and link to it. Nobody can guarantee a recommendation. What we control is whether the facts are easy to find, consistent and true.

## How these assistants find a product

1. **Live search.** They run a web search (Bing for ChatGPT and Copilot, Google for Gemini, their own index for Perplexity and Claude) and read the top pages. Ordinary SEO is therefore most of the work.
2. **Their own crawlers** fetch pages to quote from.
3. **What other sites say.** Assistants lean heavily on independent mentions: directories, reviews, comparisons, Reddit and Quora threads, news. A product that only describes itself is rarely recommended.

## Crawler access today

All of these get the full page (checked live, status 200):

| Crawler | Used for | Today |
| --- | --- | --- |
| Googlebot, Bingbot | Google Search, AI Overviews, Bing, Copilot | Allowed |
| OAI-SearchBot, ChatGPT-User | ChatGPT search and browsing | Allowed |
| PerplexityBot, Perplexity-User | Perplexity answers | Allowed |
| Claude-SearchBot, Claude-User | Claude search and browsing | Allowed |
| GPTBot, ClaudeBot, Google-Extended, CCBot, Bytespider, Applebot-Extended, meta-externalagent | **Training** AI models | Allowed (by the general rule) |

### Decision needed: training crawlers

Search crawlers should stay allowed. Training crawlers are a separate choice:

- **Allow (today's behaviour):** the public marketing pages may end up in future models' memory, which can help the brand be known even without a live search. Nothing private is exposed either way, because private areas are already blocked.
- **Block:** the content is used only for live answers and citations, not for training.

Recommendation: keep allowing them for the marketing site, since the pages are promotional and public. Write the rule out explicitly in robots.txt so the choice is visible. This is your call; nothing changes until you say so.

## What to improve on the site

| # | Change | Why |
| --- | --- | --- |
| 1 | Fix the two outdated payment statements on the homepage (see SEO_AUDIT.md, item 3). | Assistants repeat what the page says. A wrong claim becomes a wrong answer. |
| 2 | Add an **About** page: what Shopersite is, who it is for, where it is based, how to contact it, and the company details from Admin → Company & legal. | The single most-read page when an assistant checks if a product is real. |
| 3 | Add one sentence that defines the product, the same everywhere (homepage, About, Organization data, directory listings): "Shopersite is an online store builder for Indian sellers: a free plan, 0% commission, cash on delivery and Razorpay payments, on your own shopersite.in address." | Consistent wording is how an entity gets recognised. |
| 4 | Make `/pricing` state every plan in plain text: Free (₹0, 75 products, 1 theme, cash on delivery), Growth (₹199 a month, 10-day trial, 200 products, 7 themes), Pro (₹299 a month for 2 months, then ₹599; unlimited products, every theme, own domain). Prices include GST. All of it read from `src/lib/plans.ts`. | Pricing questions are the most common follow-up; assistants need text, not a toggle. |
| 5 | Add an honest comparison page (Shopersite, Shopify, Dukaan, Instamojo, Wix) with a plain table: price in rupees, commission, COD, free plan, who each suits. Include where the others are better. | Matches "Shopify alternative India" questions. One-sided pages are ignored or distrusted. |
| 6 | Add FAQPage data to the homepage FAQ (the questions are already on the page). | Clean question-and-answer pairs are easy to quote. |
| 7 | Add `sameAs` links in the Organization data once real profiles exist (Instagram, LinkedIn, X, YouTube, Play Store). | Ties the brand to its profiles. |

## What not to do

- **No `llms.txt` for now.** No major assistant has confirmed it reads the file, and the sitemap already lists every page. Revisit if that changes.
- No AI-only pages, hidden text or keyword-stuffed blocks.
- No invented ratings, review counts, customer numbers or awards, in text or in structured data.
- No "best in India" claims that cannot be backed up.

## Off-site (the larger half)

See IMPLEMENTATION_PLAN.md, phase 5. In short: real listings, real reviews, real seller stories. Drafts are prepared for approval; nothing is sent or published without it.

## Measuring it

Run the same fixed questions once a month and record the answers. The question list and the recording sheet are in IMPLEMENTATION_PLAN.md, phase 6.
