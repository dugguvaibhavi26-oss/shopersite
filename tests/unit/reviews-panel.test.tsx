import React from "react";
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { ReviewsPanel } from "@/components/dashboard/reviews-panel";
import type { StoreData } from "@/lib/store-service";

afterEach(cleanup);

const store = {
  subdomain: "demo",
  name: "Demo",
  products: [
    { id: "p1", title: "Linen shirt", images: [] },
    { id: "p2", title: "Silk saree", images: [] },
  ],
  reviews: [
    { id: "r1", productId: "p1", rating: 5, comment: "Lovely fabric", customerName: "Asha", status: "approved", createdAt: "2026-11-01T00:00:00Z", verifiedPurchase: true },
    { id: "r2", productId: "p2", rating: 2, comment: "Colour faded", customerName: "Ravi", status: "pending", createdAt: "2026-11-05T00:00:00Z" },
  ],
} as unknown as StoreData;

describe("ReviewsPanel", () => {
  it("lists reviews as rows and filters them", () => {
    render(<ReviewsPanel store={store} onChanged={() => {}} onShare={() => {}} shareLabel="Copy" />);
    expect(screen.getAllByRole("listitem")).toHaveLength(2);

    fireEvent.change(screen.getByLabelText("Filter by stars"), { target: { value: "5" } });
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
    expect(screen.getByText("Lovely fabric")).toBeTruthy();

    fireEvent.click(screen.getByText("Clear filters"));
    fireEvent.change(screen.getByPlaceholderText("Search words, buyer or product"), { target: { value: "saree" } });
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
    expect(screen.getByText("Colour faded")).toBeTruthy();
  });

  it("shows only waiting reviews on the Waiting tab", () => {
    render(<ReviewsPanel store={store} onChanged={() => {}} onShare={() => {}} shareLabel="Copy" />);
    fireEvent.click(screen.getByRole("button", { name: /Waiting/ }));
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
    expect(screen.getByText("Ravi")).toBeTruthy();
  });
});
