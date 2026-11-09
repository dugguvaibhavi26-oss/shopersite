import { describe, expect, it } from "vitest";
import { defaultCompany, mergeCompany } from "@/lib/legal/company";
import { buildLegalDocs } from "@/lib/legal/docs";

const text = (slug: string, c = mergeCompany(null)) => JSON.stringify(buildLegalDocs(c).find((d) => d.slug === slug));

describe("company details on the legal pages", () => {
  it("leaves out details that haven't been added", () => {
    const g = text("grievance");
    expect(g).not.toContain("Name:");
    expect(g).not.toContain("Address:");
    expect(text("terms")).toContain("the courts having jurisdiction over our registered office");
  });

  it("shows what the admin saved", () => {
    const c = mergeCompany({ grievanceOfficer: "Asha Rao", grievanceEmail: "grievance@shop.in", address: "1 MG Road, Hyderabad", city: "Hyderabad, Telangana" });
    const g = text("grievance", c);
    expect(g).toContain("Name: Asha Rao");
    expect(g).toContain("Email: grievance@shop.in");
    expect(g).toContain("Address: 1 MG Road, Hyderabad");
    expect(text("terms", c)).toContain("the courts at Hyderabad, Telangana");
    expect(text("privacy", c)).toContain("Asha Rao");
  });

  it("never blanks the company name or support email", () => {
    const c = mergeCompany({ legalName: "  ", email: "" });
    expect(c.legalName).toBe(defaultCompany.legalName);
    expect(c.email).toBe(defaultCompany.email);
  });
});
