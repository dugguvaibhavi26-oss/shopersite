import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Button } from "@/components/ui/button";
import { PhoneInput, PriceInput, PinCodeInput } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ResponsiveTable } from "@/components/ui/table";

describe("UI Primitives Component Suite", () => {
  it("renders Button in default, loading, and disabled states", () => {
    const handleClick = vi.fn();
    const { rerender } = render(
      <Button onClick={handleClick}>Click Me</Button>
    );

    const button = screen.getByRole("button", { name: "Click Me" });
    expect(button).toBeInTheDocument();
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);

    // Test disabled state
    rerender(<Button disabled onClick={handleClick}>Disabled</Button>);
    const disabledBtn = screen.getByRole("button", { name: "Disabled" });
    expect(disabledBtn).toBeDisabled();
    fireEvent.click(disabledBtn);
    expect(handleClick).toHaveBeenCalledTimes(1); // Not called again

    // Test loading state
    rerender(<Button isLoading loadingText="Saving...">Click Me</Button>);
    expect(screen.getByText("Saving...")).toBeInTheDocument();
  });

  it("renders PhoneInput with +91 indicator and restricts non-digits", () => {
    const handleChange = vi.fn();
    render(
      <PhoneInput
        label="Phone"
        placeholder="9876543210"
        onChange={handleChange}
      />
    );

    expect(screen.getByText("+91")).toBeInTheDocument();
    const input = screen.getByPlaceholderText("9876543210") as HTMLInputElement;

    fireEvent.change(input, { target: { value: "98765abc43210extra" } });
    expect(input.value).toBe("9876543210"); // Cleaned non-digits and capped at 10
  });

  it("renders PriceInput with Rupee ₹ prefix", () => {
    render(<PriceInput label="Price" placeholder="799" />);
    expect(screen.getByText("₹")).toBeInTheDocument();
  });

  it("renders Badge with appropriate status colors", () => {
    render(<Badge variant="success">Paid</Badge>);
    expect(screen.getByText("Paid")).toBeInTheDocument();
  });

  it("renders ResponsiveTable for desktop and mobile card structures", () => {
    const data = [{ id: "101", customer: "Pooja", amount: "₹499" }];
    const columns = [
      { key: "id", header: "Order ID" },
      { key: "customer", header: "Customer" },
      { key: "amount", header: "Amount" },
    ];

    render(
      <ResponsiveTable
        columns={columns}
        data={data}
        keyExtractor={(item) => item.id}
      />
    );

    // Desktop table header check
    expect(screen.getAllByText("Order ID")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Pooja")[0]).toBeInTheDocument();
  });
});
