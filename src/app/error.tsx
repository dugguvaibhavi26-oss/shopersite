"use client";

import * as React from "react";
import { AlertCircle } from "lucide-react";
import { logger } from "@/lib/monitoring/logger";
import { siteConfig } from "@/lib/config/site";
import { StatusScreen } from "@/components/ui/status-screen";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    logger.error("Client caught application error", error);
  }, [error]);

  const support = siteConfig.supportWhatsApp ? `https://wa.me/${siteConfig.supportWhatsApp}` : `mailto:${siteConfig.supportEmail}`;

  return (
    <StatusScreen
      icon={AlertCircle}
      title="Something went wrong"
      text="An unexpected problem stopped this page from loading. Your shop and its data are safe."
      actions={[
        { label: "Try again", onClick: () => reset() },
        { label: "Contact support", href: support, variant: "outline", external: true },
      ]}
    />
  );
}
