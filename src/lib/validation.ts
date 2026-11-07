/**
 * One set of field rules used by every form (sign-up, checkout, settings, products) and by the
 * server, so a value the browser accepts is never refused later and fakes are caught early.
 * Each check returns "" when the value is fine, or the message to show.
 */

/** Digits only, without +91 / 0 in front. */
export const digitsOnly = (v: string) => v.replace(/\D/g, "");

export function cleanPhone(v: string): string {
  let d = digitsOnly(v);
  if (d.length === 12 && d.startsWith("91")) d = d.slice(2);
  else if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
  return d;
}

/** Indian mobile: exactly 10 digits, starts with 6-9, not all the same digit (9999999999). */
export function checkPhone(v: string, label = "mobile number"): string {
  const d = cleanPhone(v);
  if (!d) return `Enter your ${label}.`;
  if (d.length !== 10) return `Your ${label} must be exactly 10 digits.`;
  if (!/^[6-9]/.test(d)) return `Enter a valid Indian ${label} (it starts with 6, 7, 8 or 9).`;
  if (/^(\d)\1{9}$/.test(d)) return `Enter your real ${label}.`;
  return "";
}

/** Indian PIN code: exactly 6 digits, doesn't start with 0. */
export function checkPincode(v: string): string {
  const d = v.trim();
  if (!d) return "Enter your PIN code.";
  if (!/^\d+$/.test(d)) return "PIN code has numbers only.";
  if (d.length !== 6) return "PIN code must be exactly 6 digits.";
  if (d.startsWith("0")) return "Enter a valid PIN code.";
  return "";
}

const EMAIL_RE = /^[a-zA-Z0-9._%+-]{1,64}@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,24}$/;
/** Throwaway inbox services: fine for spam, not for a shop or an order. */
const THROWAWAY = new Set([
  "mailinator.com", "guerrillamail.com", "10minutemail.com", "tempmail.com", "temp-mail.org", "yopmail.com",
  "trashmail.com", "sharklasers.com", "getnada.com", "dispostable.com", "maildrop.cc", "throwawaymail.com",
]);

export function checkEmail(v: string, { required = true } = {}): string {
  const e = v.trim().toLowerCase();
  if (!e) return required ? "Enter your email address." : "";
  if (e.length > 200 || !EMAIL_RE.test(e) || e.includes("..")) return "Enter a valid email address.";
  if (THROWAWAY.has(e.split("@")[1])) return "Use your regular email address, not a temporary one.";
  return "";
}

/** A person's name: 2-60 characters, letters (any script), spaces, . ' - only. */
export function checkPersonName(v: string, label = "name"): string {
  const n = v.trim();
  if (n.length < 2) return `Enter your ${label}.`;
  if (n.length > 60) return `Keep your ${label} under 60 characters.`;
  if (!/^[\p{L}\p{M}][\p{L}\p{M} .'-]*$/u.test(n)) return `Your ${label} can have letters and spaces only.`;
  return "";
}

/** Street address: at least 10 characters with a letter in it. */
export function checkStreet(v: string): string {
  const s = v.trim();
  if (s.length < 10) return "Enter your full address (house no., street, area).";
  if (s.length > 200) return "Keep the address under 200 characters.";
  if (!/\p{L}/u.test(s)) return "Enter your full address.";
  return "";
}

export function checkPlace(v: string, label: "city" | "state"): string {
  const s = v.trim();
  if (s.length < 2) return `Enter your ${label}.`;
  if (s.length > 60 || !/^[\p{L}\p{M} .'-]+$/u.test(s)) return `Enter a valid ${label}.`;
  return "";
}

export function checkUpiId(v: string): string {
  const u = v.trim();
  if (!u) return "Enter your UPI ID.";
  return /^[\w.\-]{2,256}@[a-zA-Z][a-zA-Z0-9]{1,64}$/.test(u) ? "" : "Enter a UPI ID like yourname@okaxis.";
}

export function checkPassword(v: string): string {
  if (v.length < 8) return "Use at least 8 characters.";
  if (v.length > 128) return "Keep your password under 128 characters.";
  if (!/[A-Za-z]/.test(v) || !/\d/.test(v)) return "Use letters and at least one number.";
  return "";
}

/** 12-digit UPI reference number (UTR). */
export function checkUtr(v: string): string {
  const d = digitsOnly(v);
  if (d.length !== 12) return "The UPI reference number (UTR) is 12 digits.";
  if (/^(\d)\1{11}$/.test(d)) return "Enter the real 12-digit UPI reference number.";
  return "";
}

export const MAX_PRICE_RUPEES = 1000000; // ₹10,00,000

/**
 * Selling price and MRP, in rupees as typed. Price must be above 0, MRP (if given) higher than
 * the price.
 */
export function checkPrices(price: string | number, mrp?: string | number): { price?: string; mrp?: string } {
  const out: { price?: string; mrp?: string } = {};
  const p = typeof price === "number" ? price : Number(String(price).trim());
  if (String(price).trim() === "" || !Number.isFinite(p)) out.price = "Enter the selling price.";
  else if (p <= 0) out.price = "Price must be more than ₹0.";
  else if (p > MAX_PRICE_RUPEES) out.price = "Price can't be more than ₹10,00,000.";
  else if (Math.round(p * 100) !== p * 100 && Math.abs(Math.round(p * 100) - p * 100) > 1e-6) out.price = "Use at most 2 decimals (paise).";
  const mrpText = mrp === undefined ? "" : String(mrp).trim();
  if (mrpText !== "") {
    const m = Number(mrpText);
    if (!Number.isFinite(m) || m < 0) out.mrp = "MRP can't be negative.";
    else if (m > MAX_PRICE_RUPEES) out.mrp = "MRP can't be more than ₹10,00,000.";
    else if (!out.price && m <= p) out.mrp = "MRP must be higher than the selling price.";
  }
  return out;
}

export function checkStock(v: string | number): string {
  const s = String(v).trim();
  if (s === "") return "Enter how many you have.";
  const n = Number(s);
  if (!Number.isInteger(n) || n < 0) return "Stock is a whole number, 0 or more.";
  if (n > 100000) return "Stock can't be more than 1,00,000.";
  return "";
}

/** Keeps only digits as the user types, up to `max`. */
export const onlyDigits = (v: string, max: number) => digitsOnly(v).slice(0, max);

/** A phone number as typed or pasted: "+91 98765 43210" or "098765 43210" become "9876543210". */
export function phoneInput(v: string): string {
  const d = digitsOnly(v);
  return (d.length > 10 ? cleanPhone(d) : d).slice(0, 10);
}
