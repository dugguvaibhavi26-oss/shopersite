import type { Metadata } from "next";

// Order tracking (the address holds a private token): kept out of search engines.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function NoIndexLayout({ children }: { children: React.ReactNode }) {
  return children;
}
