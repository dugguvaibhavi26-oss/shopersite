import type { Metadata } from "next";
import { LandingPage } from "@/components/seo/landing-page";
import { LANDING_BY_SLUG } from "@/lib/landings";
import { pageMeta } from "@/lib/seo";

const page = LANDING_BY_SLUG["website-builder-for-small-business"];

export const metadata: Metadata = pageMeta({
  title: page.metaTitle,
  description: page.metaDescription,
  path: "/website-builder-for-small-business",
  keywords: [page.keyword, ...page.secondary],
  kicker: page.kicker,
});

export default function Page() {
  return <LandingPage page={page} />;
}
