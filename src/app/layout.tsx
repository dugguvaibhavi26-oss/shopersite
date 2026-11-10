import { AppDialogHost } from "@/components/ui/app-dialog";
import { ImageCropperHost } from "@/components/ui/image-cropper";
import type { Metadata, Viewport } from "next";
import { siteConfig } from "@/lib/config/site";
import "./globals.css";

/**
 * Defaults for every page. Marketing pages set their own title, description and canonical; seller
 * stores set theirs in app/s/[subdomain]/layout.tsx. No site-wide canonical here on purpose — it
 * would point every store and page at the homepage.
 */
export const metadata: Metadata = {
  // relative canonical and Open Graph links on marketing pages resolve against the main site
  metadataBase: new URL(`https://www.${siteConfig.domain}`),
  applicationName: "Shopersite",
  title: "Shopersite – Free Online Store Builder for Indian Sellers",
  description:
    "Build your online store for free with Shopersite. Create a professional ecommerce website, manage products, receive orders and start selling online. No credit card required.",
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
  openGraph: {
    type: "website",
    siteName: "Shopersite",
    locale: "en_IN",
    images: [{ url: "/og", width: 1200, height: 630, alt: "Shopersite – free online store builder for Indian sellers" }],
  },
  twitter: { card: "summary_large_image", images: ["/og"] },
  // set NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION in Vercel to verify the site in Google Search Console
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION } : undefined,
  formatDetection: { telephone: false, email: false, address: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

import { AuthProvider } from "@/lib/auth-context";
import { NativeBridge } from "@/components/native/native-bridge";
import { NavProgress } from "@/components/nav-progress";
import { SaveFailedNotice } from "@/components/save-failed-notice";
import { SiteAnalytics } from "@/components/seo/site-analytics";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // suppressHydrationWarning: the Android app shell adds safe-area CSS variables to <html> before React loads
    <html lang="en-IN" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Inter:wght@300;400;500;600;700&family=Manrope:wght@300;400;500;600;700;800&family=Outfit:wght@300;400;500;600;700;800&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&family=Anton&family=Bebas+Neue&family=Big+Shoulders+Display:wght@600..900&family=Oswald:wght@500..700&family=Onest:wght@400..800&family=Inter+Tight:wght@400..800&family=Schibsted+Grotesk:wght@400..800&family=Bricolage+Grotesque:opsz,wght@12..96,400..800&family=Instrument+Serif:ital@0;1&family=Syne:wght@500;600;700;800&family=Great+Vibes&family=Unbounded:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased min-h-screen bg-[var(--background)] text-[var(--foreground)]">
        <AuthProvider>
          {children}
          <SaveFailedNotice />
          <AppDialogHost />
          <ImageCropperHost />
        </AuthProvider>
        <NativeBridge />
        <NavProgress />
        <SiteAnalytics />
      </body>
    </html>
  );
}
