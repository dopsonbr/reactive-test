import { render, screen } from '@testing-library/react';
import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  it('renders message', () => {
    render(<EmptyState message="No items found" />);

    expect(screen.getByText('No items found')).toBeInTheDocument();
  });

  it('renders default icon when not provided', () => {
    render(<EmptyState message="Empty state" />);

    // Default Package icon should be rendered (as svg)
    const card = screen.getByText('Empty state').closest('.flex');
    expect(card?.querySelector('svg')).toBeInTheDocument();
  });

  it('renders custom icon when provided', () => {
    const TestIcon = () => <svg data-testid="test-icon" />;

    render(<EmptyState message="Empty state" icon={<TestIcon />} />);

    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });
});
