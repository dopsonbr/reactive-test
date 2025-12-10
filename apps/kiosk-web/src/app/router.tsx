import {
  createRouter,
  createRootRoute,
  createRoute,
} from '@tanstack/react-router';
import { KioskLayout } from '../shared/layouts/KioskLayout';
import { StartPage } from '../features/start/pages/StartPage';
import { ScanPage } from '../features/scan/pages/ScanPage';
import { CartPage } from '../features/cart/pages/CartPage';
import { LoyaltyPage } from '../features/loyalty/pages/LoyaltyPage';
import { CheckoutPage, ConfirmationPage } from '../features/checkout';

// Root route with kiosk layout
const rootRoute = createRootRoute({
  component: KioskLayout,
});

// Start screen (index route)
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: StartPage,
});

// Scan page
const scanRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/scan',
  component: ScanPage,
});

const cartRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/cart',
  component: CartPage,
});

const loyaltyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/loyalty',
  component: LoyaltyPage,
});

const checkoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/checkout',
  component: CheckoutPage,
});

const confirmRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/confirm',
  component: ConfirmationPage,
});

// Build route tree
const routeTree = rootRoute.addChildren([
  indexRoute,
  scanRoute,
  cartRoute,
  loyaltyRoute,
  checkoutRoute,
  confirmRoute,
]);

// Create router
export const router = createRouter({ routeTree });

// Register router for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
