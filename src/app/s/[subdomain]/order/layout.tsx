import type { Metadata } from "next";

// A buyer's order page (private token): kept out of search engines.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function NoIndexLayout({ children }: { children: React.ReactNode }) {
  return children;
}
