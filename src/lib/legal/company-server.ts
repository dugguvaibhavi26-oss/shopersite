import "server-only";
import { adminDb } from "../server/firebase-admin";
import { ApiError } from "../server/api-error";
import { EDITABLE_COMPANY_FIELDS, mergeCompany, type Company, type EditableCompanyField } from "./company";

const ref = () => adminDb().collection("platform_settings").doc("company");

/** The company details for the legal pages: what the admin saved, over the defaults. */
export async function getCompany(): Promise<Company> {
  try {
    const snap = await ref().get();
    return mergeCompany(snap.exists ? snap.data() : null);
  } catch {
    // no database access (e.g. a build without credentials): the defaults still make complete pages
    return mergeCompany(null);
  }
}

const LIMITS: Record<EditableCompanyField, number> = {
  legalName: 120,
  email: 120,
  grievanceOfficer: 80,
  grievanceEmail: 120,
  phone: 20,
  whatsapp: 15,
  address: 300,
  city: 80,
  cin: 25,
  gstin: 15,
};
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function saveCompany(input: Record<string, unknown>) {
  const out: Partial<Record<EditableCompanyField, string>> = {};
  for (const k of EDITABLE_COMPANY_FIELDS) {
    const v = typeof input[k] === "string" ? (input[k] as string).replace(/\s+/g, " ").trim() : "";
    if (v.length > LIMITS[k]) throw new ApiError(400, `That ${k} is too long.`);
    out[k] = v;
  }
  if (!out.legalName) throw new ApiError(400, "Enter the company's legal name.");
  if (!out.email || !EMAIL.test(out.email)) throw new ApiError(400, "Enter a valid support email.");
  if (out.grievanceEmail && !EMAIL.test(out.grievanceEmail)) throw new ApiError(400, "Enter a valid grievance email, or leave it blank.");
  if (out.whatsapp && !/^\d{10,15}$/.test(out.whatsapp)) throw new ApiError(400, "WhatsApp: digits with country code, e.g. 919876543210.");
  if (out.gstin && !/^[0-9A-Z]{15}$/i.test(out.gstin)) throw new ApiError(400, "A GSTIN has 15 letters and digits.");
  // platform_settings is publicly readable, so only the public details (and a date) are stored here
  await ref().set({ ...out, updatedAt: new Date().toISOString() });
  return mergeCompany(out);
}
