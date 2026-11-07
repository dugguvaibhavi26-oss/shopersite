import { describe, it, expect } from "vitest";
import { checkEmail, checkPassword, checkPersonName, checkPhone, checkPincode, checkPrices, checkStock, cleanPhone } from "@/lib/validation";
import { productProblem } from "@/lib/store-service";
import { checkRows, parseCsv } from "@/components/dashboard/bulk-upload";
import { missingPolicies, policyTemplate, MIN_POLICY_LENGTH } from "@/lib/policies";
import { isReservedSubdomain } from "@/lib/reserved-names";
import { stateFromPin, matchState } from "@/lib/india-states";

describe("field rules", () => {
  it("phone: exactly 10 digits starting 6-9, +91 / 0 allowed in front, no fakes", () => {
    expect(checkPhone("9876543210")).toBe("");
    expect(cleanPhone("+91 98765 43210")).toBe("9876543210");
    expect(cleanPhone("09876543210")).toBe("9876543210");
    expect(checkPhone("987654321")).toMatch(/exactly 10/);
    expect(checkPhone("98765432101")).toMatch(/exactly 10/);
    expect(checkPhone("5876543210")).toMatch(/6, 7, 8 or 9/);
    expect(checkPhone("9999999999")).toMatch(/real/);
  });

  it("PIN code: exactly 6 digits, not starting with 0", () => {
    expect(checkPincode("500081")).toBe("");
    expect(checkPincode("50008")).toMatch(/6 digits/);
    expect(checkPincode("050008")).toMatch(/valid/);
    expect(checkPincode("5000a1")).toMatch(/numbers only/);
  });

  it("email, name and password", () => {
    expect(checkEmail("asha@example.com")).toBe("");
    expect(checkEmail("asha@example")).not.toBe("");
    expect(checkEmail("a..b@example.com")).not.toBe("");
    expect(checkEmail("x@mailinator.com")).toMatch(/temporary/);
    expect(checkEmail("", { required: false })).toBe("");
    expect(checkPersonName("Asha K.")).toBe("");
    expect(checkPersonName("आशा")).toBe("");
    expect(checkPersonName("<script>")).not.toBe("");
    expect(checkPassword("abcdefgh")).toMatch(/number/);
    expect(checkPassword("abcd1234")).toBe("");
  });

  it("price above 0, MRP higher than the price, stock a whole number", () => {
    expect(checkPrices("699", "999")).toEqual({});
    expect(checkPrices("-5").price).toMatch(/more than ₹0/);
    expect(checkPrices("0").price).toMatch(/more than ₹0/);
    expect(checkPrices("699", "699").mrp).toMatch(/higher/);
    expect(checkPrices("699", "500").mrp).toMatch(/higher/);
    expect(checkPrices("699", "-1").mrp).toMatch(/negative/);
    expect(checkStock("-1")).not.toBe("");
    expect(checkStock("2.5")).not.toBe("");
    expect(checkStock("0")).toBe("");
    expect(productProblem({ price: 69900, compareAtPrice: 50000, stock: 1 })).toMatch(/higher/);
    expect(productProblem({ price: -1, stock: 1 })).toMatch(/more than/);
    expect(productProblem({ price: 69900, compareAtPrice: 99900, stock: 3 })).toBe("");
  });

  it("reserved web addresses and PIN → state", () => {
    expect(isReservedSubdomain("admin")).toBe(true);
    expect(isReservedSubdomain("lume")).toBe(false);
    expect(stateFromPin("500081")).toBe("Telangana");
    expect(stateFromPin("110001")).toBe("Delhi");
    expect(stateFromPin("400001")).toBe("Maharashtra");
    expect(matchState("Jammu & Kashmir")).toBe("Jammu and Kashmir");
  });
});

describe("bulk upload", () => {
  it("reads quoted CSV and checks every row", () => {
    const csv = 'title,category,price,mrp,stock,description,image_url\n"Tee, white",T-Shirts,699,999,5,"Soft ""cotton""",https://x/i.jpg\nBad,T-Shirts,-10,,2,,\nCheap,Mugs,"₹1,299",999,3,,ftp://x\n';
    const cells = parseCsv(csv);
    expect(cells[1][0]).toBe("Tee, white");
    expect(cells[1][5]).toBe('Soft "cotton"');
    const { rows } = checkRows(cells, { products: [] });
    expect(rows[0].data).toMatchObject({ title: "Tee, white", price: 69900, compareAtPrice: 99900, stock: 5, images: ["https://x/i.jpg"] });
    expect(rows[1].data).toBeNull();
    expect(rows[2].errors.join(" ")).toMatch(/higher/);
    expect(rows[2].errors.join(" ")).toMatch(/https/);
  });

  it("needs the column names and refuses duplicates of existing products", () => {
    expect(checkRows(parseCsv("name,price\nx,1"), { products: [] }).headerError).toMatch(/title/);
    const { rows } = checkRows(parseCsv("title,category,price,stock\nTee,T,100,1"), { products: [{ title: "tee", slug: "tee" } as never] });
    expect(rows[0].errors[0]).toMatch(/already exists/);
  });
});

describe("policies", () => {
  it("counts a policy as done only when it's long enough", () => {
    expect(missingPolicies({})).toHaveLength(4);
    expect(missingPolicies({ policies: { terms: { body: "x".repeat(MIN_POLICY_LENGTH), updatedAt: "" } } })).toHaveLength(3);
    const t = policyTemplate("returns", { name: "Lume", contactEmail: "a@b.co", contactPhone: "9876543210", ownerName: "A", orderPolicy: { cancelEnabled: true, returnEnabled: true, returnDays: 10 }, freeDeliveryThreshold: 0, standardDeliveryFee: 0, codEnabled: true });
    expect(t).toMatch(/10 days/);
    expect(t.length).toBeGreaterThan(MIN_POLICY_LENGTH);
  });
});
