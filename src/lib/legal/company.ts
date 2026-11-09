import { siteConfig } from "../config/site";

/**
 * The company details printed on the legal pages. They are edited in Admin → Company & legal and
 * saved in platform_settings/company; these are only the starting values until something is saved.
 * A blank value is simply left out of the pages (nothing placeholder-looking is shown to visitors).
 */
export interface Company {
  brand: string;
  legalName: string;
  domain: string;
  /** general support email */
  email: string;
  /** where complaints go; falls back to the support email */
  grievanceEmail: string;
  grievanceOfficer: string;
  /** registered office address, one line */
  address: string;
  /** city whose courts / arbitration seat apply, e.g. "Hyderabad, Telangana" */
  city: string;
  phone: string;
  whatsapp: string;
  cin: string;
  gstin: string;
}

/** The fields an admin can edit. */
export const EDITABLE_COMPANY_FIELDS = [
  "legalName",
  "email",
  "grievanceOfficer",
  "grievanceEmail",
  "phone",
  "whatsapp",
  "address",
  "city",
  "cin",
  "gstin",
] as const;
export type EditableCompanyField = (typeof EDITABLE_COMPANY_FIELDS)[number];

export const defaultCompany: Company = {
  brand: "ShoperSite",
  legalName: process.env.NEXT_PUBLIC_LEGAL_NAME || "Roxten Studios Pvt Ltd",
  domain: siteConfig.domain,
  email: siteConfig.supportEmail,
  grievanceEmail: "",
  grievanceOfficer: process.env.NEXT_PUBLIC_GRIEVANCE_OFFICER || "",
  address: process.env.NEXT_PUBLIC_LEGAL_ADDRESS || "",
  city: process.env.NEXT_PUBLIC_LEGAL_CITY || "",
  phone: process.env.NEXT_PUBLIC_SUPPORT_PHONE || "",
  whatsapp: siteConfig.supportWhatsApp,
  cin: process.env.NEXT_PUBLIC_LEGAL_CIN || "",
  gstin: process.env.NEXT_PUBLIC_LEGAL_GSTIN || "",
};

/** Saved values win; blank saved values fall back to the defaults only for the must-have fields. */
export function mergeCompany(saved: Partial<Record<EditableCompanyField, unknown>> | null | undefined): Company {
  const c = { ...defaultCompany };
  for (const k of EDITABLE_COMPANY_FIELDS) {
    const v = saved?.[k];
    if (typeof v === "string") c[k] = v.trim();
  }
  if (!c.legalName) c.legalName = defaultCompany.legalName;
  if (!c.email) c.email = defaultCompany.email;
  return c;
}

/** "the courts at Hyderabad, Telangana" or a neutral fallback while the city isn't set. */
export const courts = (c: Company) => (c.city ? `the courts at ${c.city}` : "the courts having jurisdiction over our registered office");
export const seat = (c: Company) => (c.city ? c.city : "the city of our registered office");
