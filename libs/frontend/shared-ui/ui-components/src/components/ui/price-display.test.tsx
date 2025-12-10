import { render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";
import { PriceDisplay } from "./price-display";

describe("PriceDisplay", () => {
  it("renders price with default currency (USD)", () => {
    render(<PriceDisplay price={29.99} />);
    expect(screen.getByText("$29.99")).toBeInTheDocument();
  });

  it("formats price with cents by default", () => {
    render(<PriceDisplay price={100} />);
    expect(screen.getByText("$100.00")).toBeInTheDocument();
  });

  it("formats price without cents when showCents is false", () => {
    render(<PriceDisplay price={99.99} showCents={false} />);
    expect(screen.getByText("$99")).toBeInTheDocument();
  });

  it("displays different currency symbols", () => {
    const { rerender } = render(<PriceDisplay price={50} currency="EUR" />);
    expect(screen.getByText("€50.00")).toBeInTheDocument();

    rerender(<PriceDisplay price={50} currency="GBP" />);
    expect(screen.getByText("£50.00")).toBeInTheDocument();

    rerender(<PriceDisplay price={50} currency="JPY" />);
    expect(screen.getByText("¥50.00")).toBeInTheDocument();
  });

  it("displays original price when provided", () => {
    render(<PriceDisplay price={29.99} originalPrice={49.99} />);
    expect(screen.getByText("$49.99")).toBeInTheDocument();
    expect(screen.getByText("$29.99")).toBeInTheDocument();
  });

  it("applies strikethrough to original price", () => {
    const { container } = render(<PriceDisplay price={29.99} originalPrice={49.99} />);
    const originalPrice = container.querySelector(".line-through");
    expect(originalPrice).toBeInTheDocument();
    expect(originalPrice).toHaveTextContent("$49.99");
  });

  it("applies destructive color to sale price", () => {
    const { container } = render(<PriceDisplay price={29.99} originalPrice={49.99} />);
    const salePrice = container.querySelector(".text-destructive");
    expect(salePrice).toBeInTheDocument();
    expect(salePrice).toHaveTextContent("$29.99");
  });

  it("does not show original price if it equals current price", () => {
    render(<PriceDisplay price={29.99} originalPrice={29.99} />);
    const prices = screen.getAllByText(/\$29\.99/);
    expect(prices).toHaveLength(1);
  });

  it("does not show original price if it is less than current price", () => {
    render(<PriceDisplay price={49.99} originalPrice={29.99} />);
    expect(screen.queryByText("$29.99")).not.toBeInTheDocument();
    expect(screen.getByText("$49.99")).toBeInTheDocument();
  });

  it("applies small size variant", () => {
    const { container } = render(<PriceDisplay price={29.99} size="sm" />);
    expect(container.querySelector(".text-sm")).toBeInTheDocument();
  });

  it("applies medium size variant", () => {
    const { container } = render(<PriceDisplay price={29.99} size="md" />);
    expect(container.querySelector(".text-base")).toBeInTheDocument();
  });

  it("applies large size variant", () => {
    const { container } = render(<PriceDisplay price={29.99} size="lg" />);
    expect(container.querySelector(".text-xl")).toBeInTheDocument();
  });

  it("applies extra large size variant", () => {
    const { container } = render(<PriceDisplay price={29.99} size="xl" />);
    expect(container.querySelector(".text-3xl")).toBeInTheDocument();
  });

  it("includes aria-label for price", () => {
    render(<PriceDisplay price={29.99} />);
    expect(screen.getByLabelText(/price: \$29\.99/i)).toBeInTheDocument();
  });

  it("includes aria-label for original price", () => {
    render(<PriceDisplay price={29.99} originalPrice={49.99} />);
    expect(screen.getByLabelText(/original price: \$49\.99/i)).toBeInTheDocument();
  });

  it("includes sale price label when discounted", () => {
    render(<PriceDisplay price={29.99} originalPrice={49.99} />);
    expect(screen.getByLabelText(/sale price: \$29\.99/i)).toBeInTheDocument();
  });

  it("handles zero price", () => {
    render(<PriceDisplay price={0} />);
    expect(screen.getByText("$0.00")).toBeInTheDocument();
  });

  it("handles very large prices", () => {
    render(<PriceDisplay price={9999.99} />);
    expect(screen.getByText("$9999.99")).toBeInTheDocument();
  });

  it("handles very small decimal prices", () => {
    render(<PriceDisplay price={0.01} />);
    expect(screen.getByText("$0.01")).toBeInTheDocument();
  });

  it("uses fallback for unknown currency", () => {
    render(<PriceDisplay price={29.99} currency="XYZ" />);
    expect(screen.getByText("XYZ29.99")).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<PriceDisplay price={29.99} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("has no accessibility violations with discount", async () => {
    const { container } = render(<PriceDisplay price={29.99} originalPrice={49.99} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("forwards ref correctly", () => {
    const ref = vi.fn();
    render(<PriceDisplay ref={ref} price={29.99} />);
    expect(ref).toHaveBeenCalled();
    expect(ref.mock.calls[0][0]).toBeInstanceOf(HTMLDivElement);
  });

  it("merges custom className", () => {
    const { container } = render(<PriceDisplay price={29.99} className="custom-class" />);
    expect(container.querySelector(".custom-class")).toBeInTheDocument();
  });
});
