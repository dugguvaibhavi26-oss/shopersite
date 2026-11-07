import { Compass } from "lucide-react";
import { StatusScreen } from "@/components/ui/status-screen";

export default function NotFoundPage() {
  return (
    <StatusScreen
      icon={Compass}
      eyebrow="Error 404"
      title="We can't find that page"
      text="The page or store you're looking for doesn't exist, or it has moved."
      actions={[{ label: "Go to the home page", href: "/" }]}
    />
  );
}
