import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  RouterProvider,
  createMemoryHistory,
  createRouter,
  createRootRoute,
  createRoute,
} from '@tanstack/react-router';
import { DashboardLayout } from './DashboardLayout';
import { AuthProvider, AuthContext } from '../../features/auth/context/AuthContext';

function createTestRouter(initialPath = '/') {
  const rootRoute = createRootRoute({
    component: DashboardLayout,
  });

  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: () => <div data-testid="dashboard-content">Dashboard Content</div>,
  });

  const loginRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/login',
    component: () => <div data-testid="login-content">Login Page</div>,
  });

  const routeTree = rootRoute.addChildren([indexRoute, loginRoute]);

  return createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  });
}

function createWrapper(
  router: ReturnType<typeof createTestRouter>,
  authOverride?: Partial<React.ComponentProps<typeof AuthContext.Provider>['value']>
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    const content = authOverride ? (
      <AuthContext.Provider value={authOverride as any}>
        {children}
      </AuthContext.Provider>
    ) : (
      <AuthProvider>{children}</AuthProvider>
    );

    return (
      <QueryClientProvider client={queryClient}>
        {content}
      </QueryClientProvider>
    );
  };
}

describe('DashboardLayout', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  it('redirects to login when not authenticated', async () => {
    const router = createTestRouter('/');
    const Wrapper = createWrapper(router);

    render(<RouterProvider router={router} />, { wrapper: Wrapper });

    // Should redirect to login
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/login');
    });
  });

  it('shows sidebar when authenticated', async () => {
    const router = createTestRouter('/');

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

    const Wrapper = createWrapper(router, mockAuthValue);

    render(<RouterProvider router={router} />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText('Merchant Portal')).toBeInTheDocument();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('testuser')).toBeInTheDocument();
    });
  });

  it('filters navigation items based on permissions', async () => {
    const router = createTestRouter('/');

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
      hasPermission: (permission: string) => permission === 'merchant',
      isLoading: false,
    };

    const Wrapper = createWrapper(router, mockAuthValue);

    render(<RouterProvider router={router} />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText('Products')).toBeInTheDocument();
      expect(screen.queryByText('Pricing')).not.toBeInTheDocument();
      expect(screen.queryByText('Inventory')).not.toBeInTheDocument();
    });
  });

  it('shows all navigation items for admin', async () => {
    const router = createTestRouter('/');

    const mockAuthValue = {
      isAuthenticated: true,
      user: {
        id: '123',
        username: 'admin',
        permissions: ['admin'],
      },
      token: 'test-token',
      authConfig: { authUrl: 'http://localhost:8089/dev' },
      login: vi.fn(),
      logout: vi.fn(),
      hasPermission: vi.fn(() => true),
      isLoading: false,
    };

    const Wrapper = createWrapper(router, mockAuthValue);

    render(<RouterProvider router={router} />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Products')).toBeInTheDocument();
      expect(screen.getByText('Pricing')).toBeInTheDocument();
      expect(screen.getByText('Inventory')).toBeInTheDocument();
    });
  });

  it('renders login page without sidebar', async () => {
    const router = createTestRouter('/login');
    const Wrapper = createWrapper(router);

    render(<RouterProvider router={router} />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.queryByText('Merchant Portal')).not.toBeInTheDocument();
      expect(screen.getByTestId('login-content')).toBeInTheDocument();
    });
  });
});
