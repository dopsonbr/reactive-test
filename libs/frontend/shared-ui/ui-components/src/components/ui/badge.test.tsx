import { render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";
import { Badge } from "./badge";

describe("Badge", () => {
  it("renders children", () => {
    render(<Badge>New</Badge>);
    expect(screen.getByText("New")).toBeInTheDocument();
  });

  it("applies default variant by default", () => {
    const { container } = render(<Badge>Default</Badge>);
    expect(container.querySelector(".bg-primary")).toBeInTheDocument();
  });

  it("applies secondary variant", () => {
    const { container } = render(<Badge variant="secondary">Secondary</Badge>);
    expect(container.querySelector(".bg-secondary")).toBeInTheDocument();
  });

  it("applies success variant", () => {
    const { container } = render(<Badge variant="success">Success</Badge>);
    expect(container.querySelector(".bg-green-500")).toBeInTheDocument();
  });

  it("applies warning variant", () => {
    const { container } = render(<Badge variant="warning">Warning</Badge>);
    expect(container.querySelector(".bg-yellow-500")).toBeInTheDocument();
  });

  it("applies destructive variant", () => {
    const { container } = render(<Badge variant="destructive">Error</Badge>);
    expect(container.querySelector(".bg-destructive")).toBeInTheDocument();
  });

  it("applies outline variant", () => {
    const { container } = render(<Badge variant="outline">Outline</Badge>);
    expect(container.querySelector(".text-foreground")).toBeInTheDocument();
  });

  it("merges custom className", () => {
    const { container } = render(<Badge className="custom-class">Badge</Badge>);
    expect(container.querySelector(".custom-class")).toBeInTheDocument();
  });

  it("passes through HTML attributes", () => {
    render(<Badge data-testid="custom-badge">Badge</Badge>);
    expect(screen.getByTestId("custom-badge")).toBeInTheDocument();
  });

  it("renders with different content types", () => {
    const { rerender } = render(<Badge>Text</Badge>);
    expect(screen.getByText("Text")).toBeInTheDocument();

    rerender(<Badge>123</Badge>);
    expect(screen.getByText("123")).toBeInTheDocument();

    rerender(
      <Badge>
        <span>Complex content</span>
      </Badge>
    );
    expect(screen.getByText("Complex content")).toBeInTheDocument();
  });

  it("has no accessibility violations with default variant", async () => {
    const { container } = render(<Badge>New</Badge>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("has no accessibility violations with secondary variant", async () => {
    const { container } = render(<Badge variant="secondary">Secondary</Badge>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("has no accessibility violations with success variant", async () => {
    const { container } = render(<Badge variant="success">Success</Badge>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("has no accessibility violations with warning variant", async () => {
    const { container } = render(<Badge variant="warning">Warning</Badge>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("has no accessibility violations with destructive variant", async () => {
    const { container } = render(<Badge variant="destructive">Error</Badge>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("has no accessibility violations with outline variant", async () => {
    const { container } = render(<Badge variant="outline">Outline</Badge>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
