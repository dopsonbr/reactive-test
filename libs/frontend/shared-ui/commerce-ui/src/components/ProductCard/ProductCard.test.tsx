import { render, screen, fireEvent } from "@testing-library/react";
import { axe } from "vitest-axe";
import { ProductCard } from "./ProductCard";
import type { Product } from "../../types";

const mockProduct: Product = {
  sku: "TEST-001",
  name: "Test Product",
  description: "This is a test product description",
  basePrice: 99.99,
  finalPrice: 79.99,
  imageUrl: "https://example.com/image.jpg",
  category: "Electronics",
  inStock: true,
  stockLevel: 10,
};

describe("ProductCard", () => {
  it("renders product information", () => {
    render(<ProductCard product={mockProduct} />);

    expect(screen.getByText("Test Product")).toBeInTheDocument();
    expect(screen.getByText("This is a test product description")).toBeInTheDocument();
    expect(screen.getByText("Electronics")).toBeInTheDocument();
  });

  it("displays product image", () => {
    render(<ProductCard product={mockProduct} />);

    const image = screen.getByAltText("Test Product");
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute("src", "https://example.com/image.jpg");
  });

  it("shows price with discount", () => {
    render(<ProductCard product={mockProduct} />);

    expect(screen.getByText("$79.99")).toBeInTheDocument();
    expect(screen.getByText("$99.99")).toBeInTheDocument();
  });

  it("shows price without discount", () => {
    const productNoDiscount = { ...mockProduct, finalPrice: 99.99 };
    render(<ProductCard product={productNoDiscount} />);

    expect(screen.getByText("$99.99")).toBeInTheDocument();
  });

  it("displays out of stock badge", () => {
    const outOfStockProduct = { ...mockProduct, inStock: false };
    render(<ProductCard product={outOfStockProduct} />);

    expect(screen.getByText("Out of Stock")).toBeInTheDocument();
  });

  it("disables add to cart when out of stock", () => {
    const outOfStockProduct = { ...mockProduct, inStock: false };
    render(<ProductCard product={outOfStockProduct} onAddToCart={vi.fn()} />);

    const button = screen.getByRole("button", { name: /out of stock/i });
    expect(button).toBeDisabled();
  });

  it("calls onAddToCart with sku and quantity", () => {
    const handleAddToCart = vi.fn();
    render(<ProductCard product={mockProduct} onAddToCart={handleAddToCart} />);

    const addButton = screen.getByRole("button", { name: /add to cart/i });
    fireEvent.click(addButton);

    expect(handleAddToCart).toHaveBeenCalledWith("TEST-001", 1);
  });

  it("shows quantity selector when showQuantitySelector is true", () => {
    render(
      <ProductCard
        product={mockProduct}
        onAddToCart={vi.fn()}
        showQuantitySelector={true}
      />
    );

    expect(screen.getByLabelText("Quantity selector")).toBeInTheDocument();
  });

  it("updates quantity and passes to onAddToCart", () => {
    const handleAddToCart = vi.fn();
    render(
      <ProductCard
        product={mockProduct}
        onAddToCart={handleAddToCart}
        showQuantitySelector={true}
      />
    );

    const increaseButton = screen.getByLabelText("Increase quantity");
    fireEvent.click(increaseButton);
    fireEvent.click(increaseButton);

    const addButton = screen.getByRole("button", { name: /add to cart/i });
    fireEvent.click(addButton);

    expect(handleAddToCart).toHaveBeenCalledWith("TEST-001", 3);
  });

  it("calls onNavigate when clicking product image", () => {
    const handleNavigate = vi.fn();
    render(<ProductCard product={mockProduct} onNavigate={handleNavigate} />);

    const image = screen.getByAltText("Test Product");
    fireEvent.click(image.parentElement!);

    expect(handleNavigate).toHaveBeenCalledWith("TEST-001");
  });

  it("calls onNavigate when clicking product title", () => {
    const handleNavigate = vi.fn();
    render(<ProductCard product={mockProduct} onNavigate={handleNavigate} />);

    const title = screen.getByText("Test Product");
    fireEvent.click(title);

    expect(handleNavigate).toHaveBeenCalledWith("TEST-001");
  });

  it("supports keyboard navigation on title", () => {
    const handleNavigate = vi.fn();
    render(<ProductCard product={mockProduct} onNavigate={handleNavigate} />);

    const title = screen.getByText("Test Product");
    fireEvent.keyDown(title, { key: "Enter" });

    expect(handleNavigate).toHaveBeenCalledWith("TEST-001");
  });

  it("applies compact size variant", () => {
    const { container } = render(<ProductCard product={mockProduct} size="compact" />);

    expect(container.querySelector(".max-w-\\[200px\\]")).toBeInTheDocument();
  });

  it("applies default size variant", () => {
    const { container } = render(<ProductCard product={mockProduct} size="default" />);

    expect(container.querySelector(".max-w-\\[280px\\]")).toBeInTheDocument();
  });

  it("applies large size variant", () => {
    const { container } = render(<ProductCard product={mockProduct} size="large" />);

    expect(container.querySelector(".max-w-\\[360px\\]")).toBeInTheDocument();
  });

  it("hides description in compact mode", () => {
    render(<ProductCard product={mockProduct} size="compact" />);

    expect(screen.queryByText("This is a test product description")).not.toBeInTheDocument();
  });

  it("shows loading spinner when isLoading is true", () => {
    render(<ProductCard product={mockProduct} isLoading={true} />);

    expect(screen.queryByText("Test Product")).not.toBeInTheDocument();
  });

  it("respects stock level for quantity selector max", () => {
    const lowStockProduct = { ...mockProduct, stockLevel: 2 };
    render(
      <ProductCard
        product={lowStockProduct}
        onAddToCart={vi.fn()}
        showQuantitySelector={true}
      />
    );

    const increaseButton = screen.getByLabelText("Increase quantity");
    fireEvent.click(increaseButton);
    fireEvent.click(increaseButton);

    expect(increaseButton).toBeDisabled();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<ProductCard product={mockProduct} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("has no accessibility violations with add to cart", async () => {
    const { container } = render(
      <ProductCard
        product={mockProduct}
        onAddToCart={vi.fn()}
        showQuantitySelector={true}
      />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("forwards ref correctly", () => {
    const ref = vi.fn();
    render(<ProductCard ref={ref} product={mockProduct} />);
    expect(ref).toHaveBeenCalled();
    expect(ref.mock.calls[0][0]).toBeInstanceOf(HTMLDivElement);
  });
});
