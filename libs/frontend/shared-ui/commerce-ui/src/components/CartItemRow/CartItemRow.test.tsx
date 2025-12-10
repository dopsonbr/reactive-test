import { render, screen, fireEvent } from "@testing-library/react";
import { axe } from "vitest-axe";
import { CartItemRow } from "./CartItemRow";
import type { CartItem } from "../../types";

const mockCartItem: CartItem = {
  sku: "TEST-001",
  quantity: 2,
  product: {
    sku: "TEST-001",
    name: "Test Product",
    description: "Test description",
    basePrice: 99.99,
    finalPrice: 79.99,
    imageUrl: "https://example.com/image.jpg",
    category: "Electronics",
    inStock: true,
    stockLevel: 10,
  },
  subtotal: 159.98,
  lineTotal: 159.98,
};

const mockCartItemWithDiscount: CartItem = {
  ...mockCartItem,
  appliedDiscounts: [
    { type: "promo", description: "10% off", amount: 16.00 },
    { type: "loyalty", description: "Loyalty reward", amount: 4.00 },
  ],
  lineTotal: 139.98,
};

describe("CartItemRow", () => {
  it("renders cart item information", () => {
    render(
      <CartItemRow
        item={mockCartItem}
        onUpdateQuantity={vi.fn()}
        onRemove={vi.fn()}
      />
    );

    expect(screen.getByText("Test Product")).toBeInTheDocument();
    expect(screen.getByText("Test description")).toBeInTheDocument();
  });

  it("displays product image by default", () => {
    render(
      <CartItemRow
        item={mockCartItem}
        onUpdateQuantity={vi.fn()}
        onRemove={vi.fn()}
      />
    );

    const image = screen.getByAltText("Test Product");
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute("src", "https://example.com/image.jpg");
  });

  it("hides image when showImage is false", () => {
    render(
      <CartItemRow
        item={mockCartItem}
        onUpdateQuantity={vi.fn()}
        onRemove={vi.fn()}
        showImage={false}
      />
    );

    expect(screen.queryByAltText("Test Product")).not.toBeInTheDocument();
  });

  it("displays quantity selector with current quantity", () => {
    render(
      <CartItemRow
        item={mockCartItem}
        onUpdateQuantity={vi.fn()}
        onRemove={vi.fn()}
      />
    );

    expect(screen.getByLabelText("Quantity: 2")).toBeInTheDocument();
  });

  it("calls onUpdateQuantity when quantity changes", () => {
    const handleUpdateQuantity = vi.fn();
    render(
      <CartItemRow
        item={mockCartItem}
        onUpdateQuantity={handleUpdateQuantity}
        onRemove={vi.fn()}
      />
    );

    const increaseButton = screen.getByLabelText("Increase quantity");
    fireEvent.click(increaseButton);

    expect(handleUpdateQuantity).toHaveBeenCalledWith("TEST-001", 3);
  });

  it("calls onRemove when remove button is clicked", () => {
    const handleRemove = vi.fn();
    render(
      <CartItemRow
        item={mockCartItem}
        onUpdateQuantity={vi.fn()}
        onRemove={handleRemove}
      />
    );

    const removeButton = screen.getByLabelText("Remove Test Product from cart");
    fireEvent.click(removeButton);

    expect(handleRemove).toHaveBeenCalledWith("TEST-001");
  });

  it("displays unit price", () => {
    render(
      <CartItemRow
        item={mockCartItem}
        onUpdateQuantity={vi.fn()}
        onRemove={vi.fn()}
      />
    );

    expect(screen.getByText("$79.99")).toBeInTheDocument();
    expect(screen.getByText("per item")).toBeInTheDocument();
  });

  it("displays original price when discounted", () => {
    render(
      <CartItemRow
        item={mockCartItem}
        onUpdateQuantity={vi.fn()}
        onRemove={vi.fn()}
      />
    );

    expect(screen.getByText("$99.99")).toBeInTheDocument();
  });

  it("displays line total", () => {
    render(
      <CartItemRow
        item={mockCartItem}
        onUpdateQuantity={vi.fn()}
        onRemove={vi.fn()}
      />
    );

    expect(screen.getByText("$159.98")).toBeInTheDocument();
  });

  it("displays applied discounts", () => {
    render(
      <CartItemRow
        item={mockCartItemWithDiscount}
        onUpdateQuantity={vi.fn()}
        onRemove={vi.fn()}
      />
    );

    expect(screen.getByText("promo: -$16.00")).toBeInTheDocument();
    expect(screen.getByText("loyalty: -$4.00")).toBeInTheDocument();
  });

  it("hides discounts in compact mode", () => {
    render(
      <CartItemRow
        item={mockCartItemWithDiscount}
        onUpdateQuantity={vi.fn()}
        onRemove={vi.fn()}
        size="compact"
      />
    );

    expect(screen.queryByText("promo: -$16.00")).not.toBeInTheDocument();
  });

  it("hides description in compact mode", () => {
    render(
      <CartItemRow
        item={mockCartItem}
        onUpdateQuantity={vi.fn()}
        onRemove={vi.fn()}
        size="compact"
      />
    );

    expect(screen.queryByText("Test description")).not.toBeInTheDocument();
  });

  it("hides per item label in compact mode", () => {
    render(
      <CartItemRow
        item={mockCartItem}
        onUpdateQuantity={vi.fn()}
        onRemove={vi.fn()}
        size="compact"
      />
    );

    expect(screen.queryByText("per item")).not.toBeInTheDocument();
  });

  it("applies compact size variant", () => {
    const { container } = render(
      <CartItemRow
        item={mockCartItem}
        onUpdateQuantity={vi.fn()}
        onRemove={vi.fn()}
        size="compact"
      />
    );

    expect(container.querySelector(".gap-2")).toBeInTheDocument();
  });

  it("applies large size variant", () => {
    const { container } = render(
      <CartItemRow
        item={mockCartItem}
        onUpdateQuantity={vi.fn()}
        onRemove={vi.fn()}
        size="large"
      />
    );

    expect(container.querySelector(".gap-6")).toBeInTheDocument();
  });

  it("respects stock level for quantity selector", () => {
    const lowStockItem = {
      ...mockCartItem,
      quantity: 2,
      product: { ...mockCartItem.product, stockLevel: 2 },
    };
    render(
      <CartItemRow
        item={lowStockItem}
        onUpdateQuantity={vi.fn()}
        onRemove={vi.fn()}
      />
    );

    const increaseButton = screen.getByLabelText("Increase quantity");
    expect(increaseButton).toBeDisabled();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <CartItemRow
        item={mockCartItem}
        onUpdateQuantity={vi.fn()}
        onRemove={vi.fn()}
      />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("has no accessibility violations with discounts", async () => {
    const { container } = render(
      <CartItemRow
        item={mockCartItemWithDiscount}
        onUpdateQuantity={vi.fn()}
        onRemove={vi.fn()}
      />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("forwards ref correctly", () => {
    const ref = vi.fn();
    render(
      <CartItemRow
        ref={ref}
        item={mockCartItem}
        onUpdateQuantity={vi.fn()}
        onRemove={vi.fn()}
      />
    );
    expect(ref).toHaveBeenCalled();
    expect(ref.mock.calls[0][0]).toBeInstanceOf(HTMLDivElement);
  });
});
