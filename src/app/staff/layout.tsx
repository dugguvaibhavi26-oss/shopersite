import type { Metadata } from "next";

// Staff dashboard: kept out of search engines.
export const metadata: Metadata = {
  title: "Staff · ShoperSite",
  robots: { index: false, follow: false },
};

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return children;
}
