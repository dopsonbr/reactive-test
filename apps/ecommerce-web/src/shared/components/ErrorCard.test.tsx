import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorCard } from './ErrorCard';

describe('ErrorCard', () => {
  it('renders error message', () => {
    const error = new Error('Something broke');

    render(<ErrorCard error={error} />);

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Something broke')).toBeInTheDocument();
  });

  it('renders default message when error is null', () => {
    render(<ErrorCard error={null} />);

    expect(screen.getByText('An unexpected error occurred')).toBeInTheDocument();
  });

  it('renders retry button when onRetry is provided', () => {
    const onRetry = vi.fn();

    render(<ErrorCard error={new Error('Test')} onRetry={onRetry} />);

    const retryButton = screen.getByRole('button', { name: /try again/i });
    expect(retryButton).toBeInTheDocument();

    fireEvent.click(retryButton);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('does not render retry button when onRetry is not provided', () => {
    render(<ErrorCard error={new Error('Test')} />);

    expect(screen.queryByRole('button', { name: /try again/i })).not.toBeInTheDocument();
  });
});
