import type { Metadata } from "next";
import { THEME_FONTS_URL } from "@/lib/font-links";

// Sample shops that show a theme: kept out of search engines (they are demos, not real pages).
export const metadata: Metadata = {
  title: "Theme preview | Shopersite",
  robots: { index: false, follow: true },
};

export default function ThemePreviewLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link rel="stylesheet" href={THEME_FONTS_URL} precedence="default" />
      {children}
    </>
  );
}
