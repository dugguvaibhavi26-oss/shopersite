import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/resources";

/** Search engines may read the marketing site; private areas (dashboard, admin, APIs) stay out. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/dashboard", "/admin", "/api/", "/app/", "/orders/", "/invoice/", "/login", "/signup", "/cashfree/", "/gallery", "/s/"] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
