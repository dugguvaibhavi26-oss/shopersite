import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge class names safely with Tailwind conflict resolution
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Format monetary amount stored in paise to Indian Rupee (₹) format
 * Example: 79900 paise -> ₹799.00
 */
export function formatPaise(paise: number, options?: { hideDecimalsIfZero?: boolean }): string {
  const rupees = paise / 100;
  if (options?.hideDecimalsIfZero && rupees % 1 === 0) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(rupees);
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(rupees);
}

/**
 * Format 10-digit Indian mobile number with +91 prefix
 */
export function formatIndianPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const last10 = digits.slice(-10);
  if (last10.length === 10) {
    return `+91 ${last10.slice(0, 5)} ${last10.slice(5)}`;
  }
  return phone;
}
