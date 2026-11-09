import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";

const sub = `closedshop-${Date.now().toString(36)}`;
vi.mock("next/navigation", () => ({ useParams: () => ({ subdomain: sub }) }));

import { storeService } from "@/lib/store-service";
import { StoreClosedGate, DEFAULT_CLOSED_MESSAGE } from "@/components/storefront/store-closed-gate";

const order = {
  customer: { name: "Priya", phone: "9000000001" },
  address: { street: "1 MG Road", city: "Pune", state: "MH", pincode: "411001" },
  items: [{ productId: "p1", title: "Tee", price: 50000, quantity: 1, image: "" }],
  paymentMethod: "cod" as const,
};

describe("seller switches the shop off", () => {
  beforeEach(() => {
    if (!storeService.getStore(sub)) {
      storeService.registerStoreOffline({
        name: "Closed Shop",
        subdomain: sub,
        category: "Fashion",
        ownerName: "Asha",
        contactPhone: "9876543210",
        upiId: "asha@upi",
        tagline: "",
      } as any);
    }
    storeService.updateStore(sub, { isClosed: false, closedMessage: "", policies: { terms: { body: "t".repeat(200), updatedAt: "2026-11-08" } } });
  });

  it("shows nothing while the shop is open", () => {
    render(<StoreClosedGate />);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("shows the unavailable card with the seller's message, live", () => {
    render(<StoreClosedGate />);
    act(() => {
      storeService.updateStore(sub, { isClosed: true, closedMessage: "Back on Monday!" });
    });
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getByText("Closed Shop is currently unavailable")).toBeTruthy();
    expect(screen.getByText("Back on Monday!")).toBeTruthy();
    expect(screen.getByText("Message the shop").closest("a")?.getAttribute("href")).toBe("https://wa.me/919876543210");
    act(() => {
      storeService.updateStore(sub, { isClosed: false });
    });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("falls back to a default message", () => {
    storeService.updateStore(sub, { isClosed: true });
    render(<StoreClosedGate />);
    expect(screen.getByText(DEFAULT_CLOSED_MESSAGE)).toBeTruthy();
  });

  it("stays closed until the shop has a policy page", () => {
    storeService.updateStore(sub, { isClosed: false, policies: {} });
    render(<StoreClosedGate />);
    expect(screen.getByText("Closed Shop isn't open yet")).toBeTruthy();
    act(() => {
      storeService.updateStore(sub, { policies: { privacy: { body: "p".repeat(200), updatedAt: "2026-11-08" } } });
    });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

});
