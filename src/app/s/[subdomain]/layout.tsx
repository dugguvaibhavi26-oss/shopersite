import { Suspense } from "react";
import { StoreClosedGate } from "@/components/storefront/store-closed-gate";
import { StorefrontThemeSwitch } from "@/components/storefront/site/theme-switch";

/**
 * Every storefront page is drawn by the theme switch; the page files under /s/[subdomain] only
 * exist so their addresses resolve (they render nothing themselves).
 */
export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense>
        <StorefrontThemeSwitch />
      </Suspense>
      {children}
      <StoreClosedGate />
    </>
  );
}
