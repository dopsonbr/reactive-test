import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LoginPage } from './LoginPage';
import { AuthContext } from '../context/AuthContext';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
}));

function createWrapper(authOverride?: Partial<React.ComponentProps<typeof AuthContext.Provider>['value']>) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  const mockAuthValue = {
    isAuthenticated: false,
    user: null,
    token: null,
    authConfig: { authUrl: 'http://localhost:8089/dev' },
    login: vi.fn(),
    logout: vi.fn(),
    hasPermission: vi.fn(() => false),
    isLoading: false,
    ...authOverride,
  };

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider value={mockAuthValue as any}>
          {children}
        </AuthContext.Provider>
      </QueryClientProvider>
    );
  };
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it('renders login page with test users', () => {
    render(<LoginPage />, { wrapper: createWrapper() });

    expect(screen.getByText(/merchant portal/i)).toBeInTheDocument();
    expect(screen.getByText(/merchant1/i)).toBeInTheDocument();
    expect(screen.getByText(/admin1/i)).toBeInTheDocument();
  });

  it('shows loading state when logging in', async () => {
    const mockLogin = vi.fn(() => new Promise(() => {})); // Never resolves

    render(<LoginPage />, { wrapper: createWrapper({ login: mockLogin, isLoading: true }) });

    const buttons = screen.getAllByRole('button');
    buttons.forEach((button) => {
      expect(button).toBeDisabled();
    });
  });

  it('handles login error gracefully', async () => {
    const mockLogin = vi.fn().mockRejectedValueOnce(new Error('Network error'));

    render(<LoginPage />, { wrapper: createWrapper({ login: mockLogin }) });

    const merchantButton = screen.getAllByRole('button')[0];
    fireEvent.click(merchantButton);

    await waitFor(() => {
      expect(screen.getByText(/failed|error/i)).toBeInTheDocument();
    });
  });

  it('successfully logs in and navigates to dashboard', async () => {
    const mockLogin = vi.fn().mockResolvedValueOnce(undefined);

    render(<LoginPage />, { wrapper: createWrapper({ login: mockLogin }) });

    const merchantButton = screen.getAllByRole('button')[0];
    fireEvent.click(merchantButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith({ to: '/' });
    });
  });

  it('displays all test users with their permissions', () => {
    render(<LoginPage />, { wrapper: createWrapper() });

    // Check that user descriptions are displayed
    expect(screen.getByText(/product management/i)).toBeInTheDocument();
    expect(screen.getByText(/inventory management/i)).toBeInTheDocument();
    expect(screen.getByText(/full access/i)).toBeInTheDocument();

    // Check that permission tags are displayed (use getAllByText for duplicates)
    expect(screen.getAllByText('merchant').length).toBeGreaterThan(0);
    expect(screen.getByText('admin')).toBeInTheDocument();
    expect(screen.getAllByText('pricing_specialist').length).toBeGreaterThan(0);
    expect(screen.getAllByText('inventory_specialist').length).toBeGreaterThan(0);
  });
});
