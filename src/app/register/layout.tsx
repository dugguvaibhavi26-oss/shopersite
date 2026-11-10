import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";

// Sign-up page: indexable so people searching for "Shopersite sign up" land here.
export const metadata: Metadata = pageMeta({
  title: "Create your free online store",
  description: "Sign up for Shopersite and create your online store for free. Name your shop, add products and start taking orders. No credit card needed for the Free plan.",
  path: "/register",
  kicker: "Start free",
});

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
