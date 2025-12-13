import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  RouterProvider,
  createMemoryHistory,
  createRouter,
  createRootRoute,
} from '@tanstack/react-router';
import { DashboardPage } from './DashboardPage';
import { AuthContext } from '../../auth/context/AuthContext';

// Mock the data hooks to isolate the component from network requests
vi.mock('../../products/api/useProducts', () => ({
  useProducts: vi.fn(),
}));

vi.mock('../../inventory/api/useInventory', () => ({
  useLowStockItems: vi.fn(),
}));

vi.mock('../../pricing/api/usePricing', () => ({
  usePrices: vi.fn(),
}));

// Import the mocked hooks so we can control their return values
import { useProducts } from '../../products/api/useProducts';
import { useLowStockItems } from '../../inventory/api/useInventory';
import { usePrices } from '../../pricing/api/usePricing';

const mockUseProducts = vi.mocked(useProducts);
const mockUseLowStockItems = vi.mocked(useLowStockItems);
const mockUsePrices = vi.mocked(usePrices);

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

// Default hook return values - data loaded, not loading
const defaultHookState = {
  data: undefined,
  isLoading: false,
  isError: false,
  error: null,
  refetch: vi.fn(),
};

async function renderDashboard(authOverride?: Partial<typeof mockAuthValue>) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const authValue = { ...mockAuthValue, ...authOverride };

  const rootRoute = createRootRoute({
    component: DashboardPage,
  });

  const router = createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });

  await router.load();

  return render(
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={authValue as never}>
        <RouterProvider router={router} />
      </AuthContext.Provider>
    </QueryClientProvider>
  );
}

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set default mock return values - empty data, not loading
    mockUseProducts.mockReturnValue(defaultHookState as ReturnType<typeof useProducts>);
    mockUseLowStockItems.mockReturnValue(defaultHookState as ReturnType<typeof useLowStockItems>);
    mockUsePrices.mockReturnValue(defaultHookState as ReturnType<typeof usePrices>);
  });

  describe('layout and structure', () => {
    it('renders dashboard heading', async () => {
      await renderDashboard();

      expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument();
    });

    it('renders welcome message with username', async () => {
      await renderDashboard();

      expect(screen.getByText(/welcome back, testuser/i)).toBeInTheDocument();
    });

    it('renders all three metric cards', async () => {
      await renderDashboard();

      expect(screen.getByText('Products')).toBeInTheDocument();
      expect(screen.getByText('Low Stock')).toBeInTheDocument();
      expect(screen.getByText('On Sale')).toBeInTheDocument();
    });

    it('renders card descriptions', async () => {
      await renderDashboard();

      expect(screen.getByText('Total products')).toBeInTheDocument();
      expect(screen.getByText('Items below threshold')).toBeInTheDocument();
      expect(screen.getByText('Discounted items')).toBeInTheDocument();
    });
  });

  describe('user display', () => {
    it('shows Guest when no user is authenticated', async () => {
      await renderDashboard({ user: null, isAuthenticated: false });

      expect(screen.getByText(/welcome back, guest/i)).toBeInTheDocument();
    });

    it('shows correct username for different users', async () => {
      await renderDashboard({
        user: { id: '456', username: 'merchant1', permissions: ['merchant'] },
      });

      expect(screen.getByText(/welcome back, merchant1/i)).toBeInTheDocument();
    });
  });

  describe('loading states', () => {
    it('shows loading indicators when data is loading', async () => {
      mockUseProducts.mockReturnValue({ ...defaultHookState, isLoading: true } as ReturnType<typeof useProducts>);
      mockUseLowStockItems.mockReturnValue({ ...defaultHookState, isLoading: true } as ReturnType<typeof useLowStockItems>);
      mockUsePrices.mockReturnValue({ ...defaultHookState, isLoading: true } as ReturnType<typeof usePrices>);

      await renderDashboard();

      const loadingIndicators = screen.getAllByText('...');
      expect(loadingIndicators).toHaveLength(3);
    });

    it('shows zero when data loads as empty', async () => {
      // Default state has no data and isLoading=false, so should show 0
      await renderDashboard();

      const zeroValues = screen.getAllByText('0');
      expect(zeroValues).toHaveLength(3);
    });
  });

  describe('data display', () => {
    it('shows product count when data is loaded', async () => {
      mockUseProducts.mockReturnValue({
        ...defaultHookState,
        data: [{ sku: 1 }, { sku: 2 }, { sku: 3 }],
      } as ReturnType<typeof useProducts>);

      await renderDashboard();

      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('shows low stock count when data is loaded', async () => {
      mockUseLowStockItems.mockReturnValue({
        ...defaultHookState,
        data: [{ sku: 1 }, { sku: 2 }],
      } as ReturnType<typeof useLowStockItems>);

      await renderDashboard();

      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('shows on sale count based on prices with discounts', async () => {
      mockUsePrices.mockReturnValue({
        ...defaultHookState,
        data: [
          { sku: 1, price: 10, originalPrice: 15 }, // on sale
          { sku: 2, price: 20, originalPrice: 25 }, // on sale
          { sku: 3, price: 30, originalPrice: null }, // not on sale
          { sku: 4, price: 40, originalPrice: 40 }, // same price, not on sale
        ],
      } as ReturnType<typeof usePrices>);

      await renderDashboard();

      // Only 2 items have originalPrice > price
      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });

  describe('navigation links', () => {
    it('has link to products page', async () => {
      await renderDashboard();

      const productCard = screen.getByText('Products').closest('a');
      expect(productCard).toHaveAttribute('href', '/products');
    });

    it('has link to inventory page', async () => {
      await renderDashboard();

      const inventoryCard = screen.getByText('Low Stock').closest('a');
      expect(inventoryCard).toHaveAttribute('href', '/inventory');
    });

    it('has link to pricing page', async () => {
      await renderDashboard();

      const pricingCard = screen.getByText('On Sale').closest('a');
      expect(pricingCard).toHaveAttribute('href', '/pricing');
    });
  });
});
