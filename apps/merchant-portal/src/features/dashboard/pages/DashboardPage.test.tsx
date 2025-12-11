import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DashboardPage } from './DashboardPage';
import { AuthContext } from '../../auth/context/AuthContext';

const mockAuthValue = {
  isAuthenticated: true,
  user: {
    id: '123',
    username: 'testuser',
    permissions: ['merchant'],
  },
  token: 'test-token',
  authConfig: { authUrl: 'http://localhost:8089/dev' },
  login: vi.fn(),
  logout: vi.fn(),
  hasPermission: vi.fn(() => true),
  isLoading: false,
};

function createWrapper(authOverride?: Partial<typeof mockAuthValue>) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const authValue = { ...mockAuthValue, ...authOverride };

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider value={authValue as any}>
          {children}
        </AuthContext.Provider>
      </QueryClientProvider>
    );
  };
}

describe('DashboardPage', () => {
  it('renders dashboard with welcome message', () => {
    render(<DashboardPage />, { wrapper: createWrapper() });

    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
  });

  it('displays user information', () => {
    render(<DashboardPage />, { wrapper: createWrapper() });

    expect(screen.getByText(/testuser/i)).toBeInTheDocument();
  });

  it('shows guest when no user is authenticated', () => {
    render(<DashboardPage />, {
      wrapper: createWrapper({ user: null, isAuthenticated: false }),
    });

    expect(screen.getByText(/guest/i)).toBeInTheDocument();
  });

  it('renders all dashboard metric cards', () => {
    render(<DashboardPage />, { wrapper: createWrapper() });

    expect(screen.getByText('Products')).toBeInTheDocument();
    expect(screen.getByText('Low Stock')).toBeInTheDocument();
    expect(screen.getByText('On Sale')).toBeInTheDocument();
  });

  it('shows placeholder values for metrics', () => {
    render(<DashboardPage />, { wrapper: createWrapper() });

    const placeholders = screen.getAllByText('--');
    expect(placeholders).toHaveLength(3);
  });

  it('displays different username correctly', () => {
    render(<DashboardPage />, {
      wrapper: createWrapper({
        user: {
          id: '456',
          username: 'merchant1',
          permissions: ['merchant'],
        },
      }),
    });

    expect(screen.getByText(/merchant1/i)).toBeInTheDocument();
  });
});
