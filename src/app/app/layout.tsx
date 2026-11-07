import type { Metadata } from "next";

// App-only screens (launch, onboarding, login) used by the Android/iOS app. Kept out of search.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AppScreensLayout({ children }: { children: React.ReactNode }) {
  return <div className="home-sans font-[Inter,sans-serif] text-neutral-950 bg-white">{children}</div>;
}
