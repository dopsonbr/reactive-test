import { render, screen, fireEvent } from "@testing-library/react";
import { axe } from "vitest-axe";
import { CartSummary } from "./CartSummary";
import type { AppliedDiscount } from "../../types";

const mockDiscounts: AppliedDiscount[] = [
  { type: "promo", description: "10% off", amount: 10.00 },
  { type: "loyalty", description: "Loyalty reward", amount: 5.00 },
  { type: "markdown", description: "Clearance sale", amount: 3.50 },
];

describe("CartSummary", () => {
  it("renders order summary with all amounts", () => {
    render(
      <CartSummary
        subtotal={100.00}
        tax={8.50}
        total={108.50}
      />
    );

    expect(screen.getByText("Order Summary")).toBeInTheDocument();
    expect(screen.getByText("Subtotal")).toBeInTheDocument();
    expect(screen.getByText("$100.00")).toBeInTheDocument();
    expect(screen.getByText("Tax")).toBeInTheDocument();
    expect(screen.getByText("$8.50")).toBeInTheDocument();
    expect(screen.getByText("Total")).toBeInTheDocument();
    expect(screen.getByText("$108.50")).toBeInTheDocument();
  });

  it("displays discounts when provided", () => {
    render(
      <CartSummary
        subtotal={118.50}
        tax={8.50}
        total={108.50}
        discounts={mockDiscounts}
      />
    );

    expect(screen.getByText("Discounts")).toBeInTheDocument();
    expect(screen.getByText("10% off")).toBeInTheDocument();
    expect(screen.getByText("-$10.00")).toBeInTheDocument();
    expect(screen.getByText("Loyalty reward")).toBeInTheDocument();
    expect(screen.getByText("-$5.00")).toBeInTheDocument();
    expect(screen.getByText("Clearance sale")).toBeInTheDocument();
    expect(screen.getByText("-$3.50")).toBeInTheDocument();
  });

  it("calculates and displays total savings", () => {
    render(
      <CartSummary
        subtotal={118.50}
        tax={8.50}
        total={108.50}
        discounts={mockDiscounts}
      />
    );

    expect(screen.getByText("Total Savings")).toBeInTheDocument();
    expect(screen.getByText("-$18.50")).toBeInTheDocument();
  });

  it("displays discount type badges", () => {
    render(
      <CartSummary
        subtotal={118.50}
        tax={8.50}
        total={108.50}
        discounts={mockDiscounts}
      />
    );

    expect(screen.getByText("promo")).toBeInTheDocument();
    expect(screen.getByText("loyalty")).toBeInTheDocument();
    expect(screen.getByText("markdown")).toBeInTheDocument();
  });

  it("shows checkout button by default", () => {
    render(
      <CartSummary
        subtotal={100.00}
        tax={8.50}
        total={108.50}
        onCheckout={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: "Checkout" })).toBeInTheDocument();
  });

  it("hides checkout button when showCheckoutButton is false", () => {
    render(
      <CartSummary
        subtotal={100.00}
        tax={8.50}
        total={108.50}
        onCheckout={vi.fn()}
        showCheckoutButton={false}
      />
    );

    expect(screen.queryByRole("button", { name: "Checkout" })).not.toBeInTheDocument();
  });

  it("uses custom checkout label", () => {
    render(
      <CartSummary
        subtotal={100.00}
        tax={8.50}
        total={108.50}
        onCheckout={vi.fn()}
        checkoutLabel="Pay Now"
      />
    );

    expect(screen.getByRole("button", { name: "Pay Now" })).toBeInTheDocument();
  });

  it("calls onCheckout when checkout button is clicked", () => {
    const handleCheckout = vi.fn();
    render(
      <CartSummary
        subtotal={100.00}
        tax={8.50}
        total={108.50}
        onCheckout={handleCheckout}
      />
    );

    const checkoutButton = screen.getByRole("button", { name: "Checkout" });
    fireEvent.click(checkoutButton);

    expect(handleCheckout).toHaveBeenCalledTimes(1);
  });

  it("does not show discounts section when no discounts", () => {
    render(
      <CartSummary
        subtotal={100.00}
        tax={8.50}
        total={108.50}
      />
    );

    expect(screen.queryByText("Discounts")).not.toBeInTheDocument();
    expect(screen.queryByText("Total Savings")).not.toBeInTheDocument();
  });

  it("handles zero discounts array", () => {
    render(
      <CartSummary
        subtotal={100.00}
        tax={8.50}
        total={108.50}
        discounts={[]}
      />
    );

    expect(screen.queryByText("Discounts")).not.toBeInTheDocument();
  });

  it("formats prices with two decimal places", () => {
    render(
      <CartSummary
        subtotal={100}
        tax={8}
        total={108}
      />
    );

    expect(screen.getByText("$100.00")).toBeInTheDocument();
    expect(screen.getByText("$8.00")).toBeInTheDocument();
    expect(screen.getByText("$108.00")).toBeInTheDocument();
  });

  it("handles decimal amounts correctly", () => {
    render(
      <CartSummary
        subtotal={99.99}
        tax={8.49}
        total={108.48}
      />
    );

    expect(screen.getByText("$99.99")).toBeInTheDocument();
    expect(screen.getByText("$8.49")).toBeInTheDocument();
    expect(screen.getByText("$108.48")).toBeInTheDocument();
  });

  it("handles zero amounts", () => {
    render(
      <CartSummary
        subtotal={0}
        tax={0}
        total={0}
      />
    );

    const zeroAmounts = screen.getAllByText("$0.00");
    expect(zeroAmounts.length).toBe(3); // subtotal, tax, and total
  });

  it("does not show checkout button when onCheckout is not provided", () => {
    render(
      <CartSummary
        subtotal={100.00}
        tax={8.50}
        total={108.50}
      />
    );

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <CartSummary
        subtotal={100.00}
        tax={8.50}
        total={108.50}
      />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("has no accessibility violations with discounts", async () => {
    const { container } = render(
      <CartSummary
        subtotal={118.50}
        tax={8.50}
        total={108.50}
        discounts={mockDiscounts}
        onCheckout={vi.fn()}
      />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("forwards ref correctly", () => {
    const ref = vi.fn();
    render(
      <CartSummary
        ref={ref}
        subtotal={100.00}
        tax={8.50}
        total={108.50}
      />
    );
    expect(ref).toHaveBeenCalled();
    expect(ref.mock.calls[0][0]).toBeInstanceOf(HTMLDivElement);
  });

  it("merges custom className", () => {
    const { container } = render(
      <CartSummary
        subtotal={100.00}
        tax={8.50}
        total={108.50}
        className="custom-class"
      />
    );
    expect(container.querySelector(".custom-class")).toBeInTheDocument();
  });
});
