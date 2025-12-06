import { render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./card";

describe("Card", () => {
  it("renders with all subcomponents", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Test Title</CardTitle>
          <CardDescription>Test Description</CardDescription>
        </CardHeader>
        <CardContent>Test Content</CardContent>
        <CardFooter>Test Footer</CardFooter>
      </Card>
    );

    expect(screen.getByText("Test Title")).toBeInTheDocument();
    expect(screen.getByText("Test Description")).toBeInTheDocument();
    expect(screen.getByText("Test Content")).toBeInTheDocument();
    expect(screen.getByText("Test Footer")).toBeInTheDocument();
  });

  it("applies base classes", () => {
    render(<Card data-testid="card">Content</Card>);
    const card = screen.getByTestId("card");
    expect(card).toHaveClass("rounded-lg", "border", "shadow-sm");
  });

  it("merges custom className", () => {
    render(<Card className="custom-class" data-testid="card">Content</Card>);
    expect(screen.getByTestId("card")).toHaveClass("custom-class");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <Card>
        <CardHeader>
          <CardTitle>Accessible Card</CardTitle>
          <CardDescription>This card is accessible.</CardDescription>
        </CardHeader>
        <CardContent>Card content goes here.</CardContent>
      </Card>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("forwards refs correctly", () => {
    const cardRef = vi.fn();
    const headerRef = vi.fn();
    const titleRef = vi.fn();
    const contentRef = vi.fn();
    const footerRef = vi.fn();

    render(
      <Card ref={cardRef}>
        <CardHeader ref={headerRef}>
          <CardTitle ref={titleRef}>Title</CardTitle>
        </CardHeader>
        <CardContent ref={contentRef}>Content</CardContent>
        <CardFooter ref={footerRef}>Footer</CardFooter>
      </Card>
    );

    expect(cardRef).toHaveBeenCalled();
    expect(headerRef).toHaveBeenCalled();
    expect(titleRef).toHaveBeenCalled();
    expect(contentRef).toHaveBeenCalled();
    expect(footerRef).toHaveBeenCalled();
  });
});
