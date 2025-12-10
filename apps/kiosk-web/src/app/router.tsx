import {
  createRouter,
  createRootRoute,
  createRoute,
} from '@tanstack/react-router';
import { KioskLayout } from '../shared/layouts/KioskLayout';
import { StartPage } from '../features/start/pages/StartPage';

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

// Placeholder routes for future phases
const scanRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/scan',
  component: () => <div>Scan Page - Coming in 044C</div>,
});

const cartRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/cart',
  component: () => <div>Cart Page - Coming in 044C</div>,
});

const loyaltyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/loyalty',
  component: () => <div>Loyalty Page - Coming in 044C</div>,
});

const checkoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/checkout',
  component: () => <div>Checkout Page - Coming in 044C</div>,
});

const confirmRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/confirm',
  component: () => <div>Confirmation Page - Coming in 044C</div>,
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
