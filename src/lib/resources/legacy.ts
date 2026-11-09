/**
 * Addresses from the first version of the Help Center and Explore, which used query strings.
 * Kept small on purpose: the middleware imports it to redirect old links to the new pages.
 */

/** /docs?article=<old id> → /docs/<new slug> */
export const LEGACY_DOC_IDS: Record<string, string> = {
  "create-account": "create-your-shop",
  "choose-subdomain": "choose-your-web-address",
  "add-first-product": "add-a-product",
  "publish-store": "open-your-shop",
  "manage-orders": "manage-orders",
  "manage-discounts": "create-coupons",
  "setup-upi": "online-payments-razorpay",
  "cod-configuration": "cash-on-delivery",
  "delivery-rates": "delivery-fees",
  "shiprocket-integration": "ship-with-shiprocket",
  "theme-selection": "choose-a-theme",
  "custom-domain": "connect-your-own-domain",
  "plans-pricing": "plans-compared",
  "gst-settings": "gst-and-taxes",
  "api-overview": "dashboard-tour",
};

/** /explore?section=<old id> → new page */
export const LEGACY_EXPLORE_SECTIONS: Record<string, string> = {
  trending: "/explore/trending-products-to-sell-online-india",
  calendar: "/explore/festival-calendar",
  creative: "/explore/write-product-descriptions-that-sell",
  tools: "/explore/tools",
  checklist: "/explore/how-to-start-an-online-store-in-india",
  academy: "/explore",
  playbooks: "/explore",
  news: "/explore",
  themes: "/themes",
};
