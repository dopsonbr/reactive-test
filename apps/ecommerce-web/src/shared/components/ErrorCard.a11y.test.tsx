import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ErrorCard } from './ErrorCard';

expect.extend(toHaveNoViolations);

describe('ErrorCard Accessibility', () => {
  it('has no accessibility violations', async () => {
    const { container } = render(
      <ErrorCard error={new Error('Test error')} />
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('has no accessibility violations with retry button', async () => {
    const { container } = render(
      <ErrorCard error={new Error('Test error')} onRetry={vi.fn()} />
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('has no accessibility violations with null error', async () => {
    const { container } = render(
      <ErrorCard error={null} />
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
