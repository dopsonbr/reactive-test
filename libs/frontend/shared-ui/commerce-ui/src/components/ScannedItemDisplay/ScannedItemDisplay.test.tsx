import { render, screen, fireEvent } from "@testing-library/react";
import { axe } from "vitest-axe";
import { ScannedItemDisplay } from "./ScannedItemDisplay";
import type { Product } from "../../types";

const mockProduct: Product = {
  sku: "TEST-001",
  name: "Test Product",
  description: "This is a test product",
  basePrice: 99.99,
  finalPrice: 79.99,
  imageUrl: "https://example.com/image.jpg",
  category: "Electronics",
  inStock: true,
  stockLevel: 10,
};

describe("ScannedItemDisplay", () => {
  it("shows loading state", () => {
    render(
      <ScannedItemDisplay
        product={null}
        isLoading={true}
        onAddToCart={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByText("Scanning item...")).toBeInTheDocument();
  });

  it("shows error state", () => {
    render(
      <ScannedItemDisplay
        product={null}
        error="Item not found"
        onAddToCart={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByText("Error")).toBeInTheDocument();
    expect(screen.getByText("Item not found")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try Again" })).toBeInTheDocument();
  });

  it("shows empty state when no product", () => {
    render(
      <ScannedItemDisplay
        product={null}
        onAddToCart={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByText("Scan an item to add it to your cart")).toBeInTheDocument();
  });

  it("renders product information", () => {
    render(
      <ScannedItemDisplay
        product={mockProduct}
        onAddToCart={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByText("Test Product")).toBeInTheDocument();
    expect(screen.getByText("This is a test product")).toBeInTheDocument();
    expect(screen.getByText("Electronics")).toBeInTheDocument();
  });

  it("displays product image", () => {
    render(
      <ScannedItemDisplay
        product={mockProduct}
        onAddToCart={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    const image = screen.getByAltText("Test Product");
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute("src", "https://example.com/image.jpg");
  });

  it("shows price with discount", () => {
    render(
      <ScannedItemDisplay
        product={mockProduct}
        onAddToCart={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByText("$79.99")).toBeInTheDocument();
    expect(screen.getByText("$99.99")).toBeInTheDocument();
  });

  it("shows savings alert when discounted", () => {
    render(
      <ScannedItemDisplay
        product={mockProduct}
        onAddToCart={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByText("Save $20.00!")).toBeInTheDocument();
  });

  it("does not show savings when no discount", () => {
    const productNoDiscount = { ...mockProduct, finalPrice: 99.99 };
    render(
      <ScannedItemDisplay
        product={productNoDiscount}
        onAddToCart={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.queryByText(/Save \$/)).not.toBeInTheDocument();
  });

  it("displays out of stock badge", () => {
    const outOfStockProduct = { ...mockProduct, inStock: false };
    render(
      <ScannedItemDisplay
        product={outOfStockProduct}
        onAddToCart={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    const badges = screen.getAllByText("Out of Stock");
    expect(badges.length).toBeGreaterThan(0);
  });

  it("displays low stock badge", () => {
    const lowStockProduct = { ...mockProduct, stockLevel: 3 };
    render(
      <ScannedItemDisplay
        product={lowStockProduct}
        onAddToCart={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByText("Low Stock")).toBeInTheDocument();
  });

  it("does not show low stock badge when stock is 5 or more", () => {
    const adequateStockProduct = { ...mockProduct, stockLevel: 5 };
    render(
      <ScannedItemDisplay
        product={adequateStockProduct}
        onAddToCart={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.queryByText("Low Stock")).not.toBeInTheDocument();
  });

  it("disables add to cart when out of stock", () => {
    const outOfStockProduct = { ...mockProduct, inStock: false };
    render(
      <ScannedItemDisplay
        product={outOfStockProduct}
        onAddToCart={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    const addButton = screen.getByRole("button", { name: /out of stock/i });
    expect(addButton).toBeDisabled();
  });

  it("calls onAddToCart when add button is clicked", () => {
    const handleAddToCart = vi.fn();
    render(
      <ScannedItemDisplay
        product={mockProduct}
        onAddToCart={handleAddToCart}
        onCancel={vi.fn()}
      />
    );

    const addButton = screen.getByRole("button", { name: /add to cart/i });
    fireEvent.click(addButton);

    expect(handleAddToCart).toHaveBeenCalledTimes(1);
  });

  it("calls onCancel when cancel button is clicked", () => {
    const handleCancel = vi.fn();
    render(
      <ScannedItemDisplay
        product={mockProduct}
        onAddToCart={vi.fn()}
        onCancel={handleCancel}
      />
    );

    const cancelButton = screen.getByRole("button", { name: "Cancel" });
    fireEvent.click(cancelButton);

    expect(handleCancel).toHaveBeenCalledTimes(1);
  });

  it("calls onCancel when try again button is clicked in error state", () => {
    const handleCancel = vi.fn();
    render(
      <ScannedItemDisplay
        product={null}
        error="Item not found"
        onAddToCart={vi.fn()}
        onCancel={handleCancel}
      />
    );

    const tryAgainButton = screen.getByRole("button", { name: "Try Again" });
    fireEvent.click(tryAgainButton);

    expect(handleCancel).toHaveBeenCalledTimes(1);
  });

  it("has no accessibility violations in empty state", async () => {
    const { container } = render(
      <ScannedItemDisplay
        product={null}
        onAddToCart={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("has no accessibility violations with product", async () => {
    const { container } = render(
      <ScannedItemDisplay
        product={mockProduct}
        onAddToCart={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("has no accessibility violations in loading state", async () => {
    const { container } = render(
      <ScannedItemDisplay
        product={null}
        isLoading={true}
        onAddToCart={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("has no accessibility violations in error state", async () => {
    const { container } = render(
      <ScannedItemDisplay
        product={null}
        error="Error message"
        onAddToCart={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("forwards ref correctly", () => {
    const ref = vi.fn();
    render(
      <ScannedItemDisplay
        ref={ref}
        product={mockProduct}
        onAddToCart={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    expect(ref).toHaveBeenCalled();
    expect(ref.mock.calls[0][0]).toBeInstanceOf(HTMLDivElement);
  });
});
