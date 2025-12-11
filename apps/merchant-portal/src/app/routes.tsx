import {
  createRouter,
  createRootRoute,
  createRoute,
} from '@tanstack/react-router';
import { DashboardLayout } from '../shared/layouts/DashboardLayout';
import { ProductsPage } from '../features/products/pages/ProductsPage';
import { PricingPage } from '../features/pricing/pages/PricingPage';
import { InventoryPage } from '../features/inventory/pages/InventoryPage';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { DashboardPage } from '../features/dashboard/pages/DashboardPage';

const rootRoute = createRootRoute({
  component: DashboardLayout,
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: DashboardPage,
});

const productsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/products',
  component: ProductsPage,
});

const pricingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/pricing',
  component: PricingPage,
});

const inventoryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/inventory',
  component: InventoryPage,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
});

const routeTree = rootRoute.addChildren([
  dashboardRoute,
  productsRoute,
  pricingRoute,
  inventoryRoute,
  loginRoute,
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
