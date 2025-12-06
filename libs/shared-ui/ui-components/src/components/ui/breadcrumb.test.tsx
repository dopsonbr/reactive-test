import { render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { Breadcrumb } from './breadcrumb';

describe('Breadcrumb', () => {
  it('renders children', () => {
    render(<Breadcrumb data-testid="breadcrumb">Content</Breadcrumb>);
    expect(screen.getByTestId('breadcrumb')).toBeInTheDocument();
  });

  it('applies variant classes', () => {
    const { rerender } = render(
      <Breadcrumb variant="default" data-testid="breadcrumb">
        Content
      </Breadcrumb>
    );
    expect(screen.getByTestId('breadcrumb')).toHaveClass('bg-primary');

    rerender(
      <Breadcrumb variant="secondary" data-testid="breadcrumb">
        Content
      </Breadcrumb>
    );
    expect(screen.getByTestId('breadcrumb')).toHaveClass('bg-secondary');
  });

  it('applies size classes', () => {
    const { rerender } = render(
      <Breadcrumb size="sm" data-testid="breadcrumb">
        Content
      </Breadcrumb>
    );
    expect(screen.getByTestId('breadcrumb')).toHaveClass('h-8');

    rerender(
      <Breadcrumb size="lg" data-testid="breadcrumb">
        Content
      </Breadcrumb>
    );
    expect(screen.getByTestId('breadcrumb')).toHaveClass('h-12');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Breadcrumb>Accessible content</Breadcrumb>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('forwards ref correctly', () => {
    const ref = vi.fn();
    render(<Breadcrumb ref={ref}>Content</Breadcrumb>);
    expect(ref).toHaveBeenCalled();
    expect(ref.mock.calls[0][0]).toBeInstanceOf(HTMLDivElement);
  });

  it('merges custom className', () => {
    render(
      <Breadcrumb className="custom-class" data-testid="breadcrumb">
        Content
      </Breadcrumb>
    );
    expect(screen.getByTestId('breadcrumb')).toHaveClass('custom-class');
  });
});
