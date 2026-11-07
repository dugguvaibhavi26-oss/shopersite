"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NewProductRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard?tab=products&action=new-product");
  }, [router]);

  return null;
}
