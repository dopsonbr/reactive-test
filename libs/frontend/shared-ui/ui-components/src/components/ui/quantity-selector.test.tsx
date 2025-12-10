import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { QuantitySelector } from "./quantity-selector";

describe("QuantitySelector", () => {
  it("renders with initial value", () => {
    const onChange = vi.fn();
    render(<QuantitySelector value={5} onChange={onChange} />);
    expect(screen.getByRole("status", { name: /quantity: 5/i })).toBeInTheDocument();
  });

  it("renders increment and decrement buttons", () => {
    const onChange = vi.fn();
    render(<QuantitySelector value={5} onChange={onChange} />);
    expect(screen.getByRole("button", { name: /increase quantity/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /decrease quantity/i })).toBeInTheDocument();
  });

  it("increments value when plus button is clicked", async () => {
    const onChange = vi.fn();
    render(<QuantitySelector value={5} onChange={onChange} />);

    await userEvent.click(screen.getByRole("button", { name: /increase quantity/i }));
    expect(onChange).toHaveBeenCalledWith(6);
  });

  it("decrements value when minus button is clicked", async () => {
    const onChange = vi.fn();
    render(<QuantitySelector value={5} onChange={onChange} />);

    await userEvent.click(screen.getByRole("button", { name: /decrease quantity/i }));
    expect(onChange).toHaveBeenCalledWith(4);
  });

  it("disables decrement button when at minimum", () => {
    const onChange = vi.fn();
    render(<QuantitySelector value={0} onChange={onChange} min={0} />);

    const decrementButton = screen.getByRole("button", { name: /decrease quantity/i });
    expect(decrementButton).toBeDisabled();
  });

  it("does not decrement below minimum", async () => {
    const onChange = vi.fn();
    render(<QuantitySelector value={0} onChange={onChange} min={0} />);

    await userEvent.click(screen.getByRole("button", { name: /decrease quantity/i }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("disables increment button when at maximum", () => {
    const onChange = vi.fn();
    render(<QuantitySelector value={10} onChange={onChange} max={10} />);

    const incrementButton = screen.getByRole("button", { name: /increase quantity/i });
    expect(incrementButton).toBeDisabled();
  });

  it("does not increment above maximum", async () => {
    const onChange = vi.fn();
    render(<QuantitySelector value={10} onChange={onChange} max={10} />);

    await userEvent.click(screen.getByRole("button", { name: /increase quantity/i }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("respects custom min and max values", async () => {
    const onChange = vi.fn();
    render(<QuantitySelector value={5} onChange={onChange} min={5} max={5} />);

    const decrementButton = screen.getByRole("button", { name: /decrease quantity/i });
    const incrementButton = screen.getByRole("button", { name: /increase quantity/i });

    expect(decrementButton).toBeDisabled();
    expect(incrementButton).toBeDisabled();
  });

  it("disables all buttons when disabled prop is true", () => {
    const onChange = vi.fn();
    render(<QuantitySelector value={5} onChange={onChange} disabled />);

    expect(screen.getByRole("button", { name: /increase quantity/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /decrease quantity/i })).toBeDisabled();
  });

  it("applies small size variant", () => {
    const onChange = vi.fn();
    const { container } = render(<QuantitySelector value={5} onChange={onChange} size="sm" />);
    expect(container.querySelector(".gap-1")).toBeInTheDocument();
  });

  it("applies medium size variant", () => {
    const onChange = vi.fn();
    const { container } = render(<QuantitySelector value={5} onChange={onChange} size="md" />);
    expect(container.querySelector(".gap-2")).toBeInTheDocument();
  });

  it("applies large size variant", () => {
    const onChange = vi.fn();
    const { container } = render(<QuantitySelector value={5} onChange={onChange} size="lg" />);
    expect(container.querySelector(".gap-3")).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const onChange = vi.fn();
    const { container } = render(<QuantitySelector value={5} onChange={onChange} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("has no accessibility violations when disabled", async () => {
    const onChange = vi.fn();
    const { container } = render(<QuantitySelector value={5} onChange={onChange} disabled />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("has no accessibility violations at boundaries", async () => {
    const onChange = vi.fn();
    const { container } = render(<QuantitySelector value={0} onChange={onChange} min={0} max={10} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("forwards ref correctly", () => {
    const ref = vi.fn();
    const onChange = vi.fn();
    render(<QuantitySelector ref={ref} value={5} onChange={onChange} />);
    expect(ref).toHaveBeenCalled();
    expect(ref.mock.calls[0][0]).toBeInstanceOf(HTMLDivElement);
  });

  it("merges custom className", () => {
    const onChange = vi.fn();
    const { container } = render(
      <QuantitySelector value={5} onChange={onChange} className="custom-class" />
    );
    expect(container.querySelector(".custom-class")).toBeInTheDocument();
  });
});
