import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { EmptyState } from './EmptyState';

expect.extend(toHaveNoViolations);

describe('EmptyState Accessibility', () => {
  it('has no accessibility violations', async () => {
    const { container } = render(
      <EmptyState message="No items found" />
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('has no accessibility violations with custom icon', async () => {
    const { container } = render(
      <EmptyState
        message="No items found"
        icon={<svg aria-hidden="true" />}
      />
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
