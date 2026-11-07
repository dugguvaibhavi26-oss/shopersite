import type { Metadata, Viewport } from "next";
import { siteConfig } from "@/lib/config/site";
import "./globals.css";

export const metadata: Metadata = {
  title: `${siteConfig.name} - Store Builder for Social Sellers`,
  description: siteConfig.description,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

import { AuthProvider } from "@/lib/auth-context";
import { NativeBridge } from "@/components/native/native-bridge";
import { NavProgress } from "@/components/nav-progress";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // suppressHydrationWarning: the Android app shell adds safe-area CSS variables to <html> before React loads
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Inter:wght@300;400;500;600;700&family=Manrope:wght@300;400;500;600;700;800&family=Outfit:wght@300;400;500;600;700;800&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&family=Anton&family=Bebas+Neue&family=Big+Shoulders+Display:wght@600..900&family=Oswald:wght@500..700&family=Onest:wght@400..800&family=Inter+Tight:wght@400..800&family=Schibsted+Grotesk:wght@400..800&family=Bricolage+Grotesque:opsz,wght@12..96,400..800&family=Instrument+Serif:ital@0;1&family=Syne:wght@500;600;700;800&family=Great+Vibes&family=Unbounded:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased min-h-screen bg-[var(--background)] text-[var(--foreground)]">
        <AuthProvider>{children}</AuthProvider>
        <NativeBridge />
        <NavProgress />
      </body>
    </html>
  );
}
