import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { NumericKeypad } from "./numeric-keypad";

describe("NumericKeypad", () => {
  it("renders all numeric buttons", () => {
    const onChange = vi.fn();
    render(<NumericKeypad value="" onChange={onChange} />);

    for (let i = 0; i <= 9; i++) {
      expect(screen.getByRole("button", { name: i.toString() })).toBeInTheDocument();
    }
  });

  it("renders decimal button when showDecimal is true", () => {
    const onChange = vi.fn();
    render(<NumericKeypad value="" onChange={onChange} showDecimal={true} />);
    expect(screen.getByRole("button", { name: /decimal point/i })).toBeInTheDocument();
  });

  it("disables decimal button when showDecimal is false", () => {
    const onChange = vi.fn();
    render(<NumericKeypad value="" onChange={onChange} showDecimal={false} />);
    const decimalButton = screen.getByRole("button", { name: /decimal point/i });
    expect(decimalButton).toBeDisabled();
  });

  it("calls onChange when number is clicked", async () => {
    const onChange = vi.fn();
    render(<NumericKeypad value="" onChange={onChange} />);

    await userEvent.click(screen.getByRole("button", { name: "5" }));
    expect(onChange).toHaveBeenCalledWith("5");
  });

  it("appends digits to existing value", async () => {
    const onChange = vi.fn();
    render(<NumericKeypad value="12" onChange={onChange} />);

    await userEvent.click(screen.getByRole("button", { name: "3" }));
    expect(onChange).toHaveBeenCalledWith("123");
  });

  it("respects maxLength constraint", async () => {
    const onChange = vi.fn();
    render(<NumericKeypad value="123" onChange={onChange} maxLength={3} />);

    await userEvent.click(screen.getByRole("button", { name: "4" }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("handles decimal point correctly", async () => {
    const onChange = vi.fn();
    render(<NumericKeypad value="12" onChange={onChange} showDecimal={true} />);

    await userEvent.click(screen.getByRole("button", { name: /decimal point/i }));
    expect(onChange).toHaveBeenCalledWith("12.");
  });

  it("prevents multiple decimal points", async () => {
    const onChange = vi.fn();
    render(<NumericKeypad value="12.5" onChange={onChange} showDecimal={true} />);

    await userEvent.click(screen.getByRole("button", { name: /decimal point/i }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("adds 0 before decimal when value is empty", async () => {
    const onChange = vi.fn();
    render(<NumericKeypad value="" onChange={onChange} showDecimal={true} />);

    await userEvent.click(screen.getByRole("button", { name: /decimal point/i }));
    expect(onChange).toHaveBeenCalledWith("0.");
  });

  it("handles backspace correctly", async () => {
    const onChange = vi.fn();
    render(<NumericKeypad value="123" onChange={onChange} />);

    await userEvent.click(screen.getByRole("button", { name: /backspace/i }));
    expect(onChange).toHaveBeenCalledWith("12");
  });

  it("disables backspace when value is empty", () => {
    const onChange = vi.fn();
    render(<NumericKeypad value="" onChange={onChange} />);

    const backspaceButton = screen.getByRole("button", { name: /backspace/i });
    expect(backspaceButton).toBeDisabled();
  });

  it("renders submit button when onSubmit is provided", () => {
    const onChange = vi.fn();
    const onSubmit = vi.fn();
    render(<NumericKeypad value="123" onChange={onChange} onSubmit={onSubmit} />);

    expect(screen.getByRole("button", { name: /submit/i })).toBeInTheDocument();
  });

  it("calls onSubmit when submit button is clicked", async () => {
    const onChange = vi.fn();
    const onSubmit = vi.fn();
    render(<NumericKeypad value="123" onChange={onChange} onSubmit={onSubmit} />);

    await userEvent.click(screen.getByRole("button", { name: /submit/i }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("does not render submit button when onSubmit is not provided", () => {
    const onChange = vi.fn();
    render(<NumericKeypad value="123" onChange={onChange} />);

    expect(screen.queryByRole("button", { name: /submit/i })).not.toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const onChange = vi.fn();
    const { container } = render(<NumericKeypad value="123" onChange={onChange} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("has no accessibility violations with submit button", async () => {
    const onChange = vi.fn();
    const onSubmit = vi.fn();
    const { container } = render(
      <NumericKeypad value="123" onChange={onChange} onSubmit={onSubmit} />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("forwards ref correctly", () => {
    const ref = vi.fn();
    const onChange = vi.fn();
    render(<NumericKeypad ref={ref} value="" onChange={onChange} />);
    expect(ref).toHaveBeenCalled();
    expect(ref.mock.calls[0][0]).toBeInstanceOf(HTMLDivElement);
  });
});
