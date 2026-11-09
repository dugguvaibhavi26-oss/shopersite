import { describe, it, expect } from "vitest";
import { buyerUpdateText, DEFAULT_TEMPLATES, fillTemplate } from "@/lib/whatsapp-messages";
import type { OrderData } from "@/lib/store-service";

const order = {
  number: "#1004",
  customer: { name: "Asha Rao", phone: "9876543210" },
  items: [{ productId: "x", title: "Linen shirt", price: 89900, quantity: 2, image: "" }],
  total: 179800,
} as unknown as OrderData;

describe("WhatsApp buyer templates", () => {
  it("fills placeholders from the order", () => {
    expect(fillTemplate("Hi {name}, {order} from {store}: {items} = {total} {link}", { name: "Lume" }, order, "https://x/o")).toBe(
      "Hi Asha, #1004 from Lume: 2 × Linen shirt = ₹1,798 https://x/o"
    );
  });

  it("drops a line whose only placeholder is empty", () => {
    const text = buyerUpdateText({ name: "Lume" }, order, "shipped", "https://x/o");
    expect(text).not.toContain("Courier:");
    expect(text).not.toContain("Tracking no.:");
    expect(text).toContain("Order page: https://x/o");
  });

  it("uses the seller's own wording when saved, and the default when blank", () => {
    expect(buyerUpdateText({ name: "Lume", whatsappTemplates: { confirmed: "Thanks {name}!" } }, order, "confirmed", "l")).toBe("Thanks Asha!");
    expect(buyerUpdateText({ name: "Lume", whatsappTemplates: { confirmed: "  " } }, order, "confirmed", "l")).toBe(fillTemplate(DEFAULT_TEMPLATES.confirmed, { name: "Lume" }, order, "l"));
  });

  it("leaves unknown placeholders as they are", () => {
    expect(fillTemplate("Hi {nickname}", { name: "Lume" }, order, "l")).toBe("Hi {nickname}");
  });
});
