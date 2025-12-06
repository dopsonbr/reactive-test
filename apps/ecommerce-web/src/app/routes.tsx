import {
  createRouter,
  createRootRoute,
  createRoute,
  Outlet,
} from '@tanstack/react-router';
import { RootLayout } from '../shared/layouts/RootLayout';
import { ProductListPage } from '../features/products/pages/ProductListPage';
import { ProductDetailPage } from '../features/products/pages/ProductDetailPage';
import { CartPage } from '../features/cart/pages/CartPage';

// Root route with layout
const rootRoute = createRootRoute({
  component: RootLayout,
});

// Index route (product listing)
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: ProductListPage,
});

// Product detail route
const productDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/products/$sku',
  component: ProductDetailPage,
});

// Cart route
const cartRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/cart',
  component: CartPage,
});

// Build route tree
const routeTree = rootRoute.addChildren([
  indexRoute,
  productDetailRoute,
  cartRoute,
]);

// Create router
export const router = createRouter({ routeTree });

// Register router for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
