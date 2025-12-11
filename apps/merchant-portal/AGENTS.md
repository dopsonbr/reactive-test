# Merchant Portal Agent Guidelines

## Overview

Internal management portal for merchant operations. Provides role-based access to product catalog management, pricing updates, and inventory tracking. Built with React, TanStack Router, TanStack Query, and integrates with merchandise-service (8091), price-service (8092), inventory-service (8093), and user-service (8089) for authentication.

## Key Files

| File | Purpose |
|------|---------|
| `src/app/routes.tsx` | TanStack Router route definitions (dashboard, products, pricing, inventory, login) |
| `src/app/providers.tsx` | Provider hierarchy - AuthProvider, QueryClientProvider, RouterProvider |
| `src/features/auth/context/AuthContext.tsx` | Authentication state management, login/logout, permission checking |
| `src/features/auth/config.ts` | Auth configuration and dev test users |
| `src/features/auth/pages/LoginPage.tsx` | Login UI with test user selection |
| `src/shared/layouts/DashboardLayout.tsx` | Sidebar layout with navigation and auth redirect |
| `src/features/dashboard/pages/DashboardPage.tsx` | Dashboard landing page |
| `src/features/products/pages/ProductsPage.tsx` | Product management UI (placeholder) |
| `src/features/pricing/pages/PricingPage.tsx` | Pricing management UI (placeholder) |
| `src/features/inventory/pages/InventoryPage.tsx` | Inventory management UI (placeholder) |
| `src/mocks/handlers.ts` | MSW mock handlers for auth endpoints |
| `src/mocks/browser.ts` | MSW browser worker setup |
| `src/main.tsx` | Application entry point with MSW initialization |
| `vite.config.mts` | Vite config with API proxies and Vitest setup |
| `e2e/specs/*.spec.ts` | Playwright E2E test journeys |

## Common Tasks

### Adding a New Route

1. Create feature page component in `src/features/{feature}/pages/`:

```typescript
export function NewFeaturePage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">New Feature</h1>
      <p className="text-muted-foreground">Feature description</p>
    </div>
  );
}
```

2. Add route definition in `src/app/routes.tsx`:

```typescript
import { NewFeaturePage } from '../features/new-feature/pages/NewFeaturePage';

const newFeatureRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/new-feature',
  component: NewFeaturePage,
});

// Add to route tree
const routeTree = rootRoute.addChildren([
  dashboardRoute,
  productsRoute,
  newFeatureRoute, // Add here
  // ...
]);
```

3. Add navigation link in `src/shared/layouts/DashboardLayout.tsx`:

```typescript
import { NewIcon } from 'lucide-react';

const navItems = [
  // existing items...
  { to: '/new-feature', label: 'New Feature', icon: NewIcon, permission: 'required_permission' },
];
```

### Adding a New Feature with API Integration

1. Create feature directory structure:

```
src/features/new-feature/
├── api/
│   └── useNewFeatureApi.ts     # TanStack Query hooks
├── components/
│   └── FeatureComponent.tsx    # Feature-specific components
└── pages/
    └── NewFeaturePage.tsx      # Page component
```

2. Create API hook with TanStack Query:

```typescript
// src/features/new-feature/api/useNewFeatureApi.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../auth';

export function useNewFeatureData() {
  const { token } = useAuth();

  return useQuery({
    queryKey: ['new-feature'],
    queryFn: async () => {
      const response = await fetch('/api/new-feature/data', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch data');
      return response.json();
    },
    enabled: !!token, // Only fetch when authenticated
  });
}

export function useUpdateNewFeature() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: NewFeatureData) => {
      const response = await fetch('/api/new-feature/data', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update');
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['new-feature'] });
    },
  });
}
```

3. Add Vite proxy configuration in `vite.config.mts`:

```typescript
server: {
  proxy: {
    '/api/new-feature': {
      target: 'http://localhost:8094', // Backend service port
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api/, ''),
    },
  },
}
```

### Adding Permission-Based Features

1. Define permission in `src/features/auth/config.ts`:

```typescript
export const DEV_TEST_USERS = [
  {
    username: 'new-role-user',
    description: 'New role description',
    permissions: ['read', 'write', 'new_permission'],
  },
];
```

2. Use `hasPermission` in components:

```typescript
import { useAuth } from '../../auth';

export function ConditionalFeature() {
  const { hasPermission } = useAuth();

  if (!hasPermission('new_permission')) {
    return <div>Access denied</div>;
  }

  return <div>Feature content</div>;
}
```

3. Add permission check to navigation in `DashboardLayout.tsx`:

```typescript
const navItems = [
  { to: '/new-feature', label: 'New Feature', icon: Icon, permission: 'new_permission' },
];
```

### Adding MSW Mock Handlers

1. Add handler in `src/mocks/handlers.ts`:

```typescript
export const handlers = [
  // Existing handlers...
  http.get('*/new-feature/data', async () => {
    await delay(100); // Simulate latency
    return HttpResponse.json({
      items: [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
      ],
    });
  }),

  http.put('*/new-feature/data', async ({ request }) => {
    const body = await request.json();
    await delay(100);
    return HttpResponse.json({ success: true, data: body });
  }),
];
```

2. Enable MSW in development:

```bash
VITE_MSW_ENABLED=true pnpm nx serve merchant-portal
```

### Writing E2E Tests

1. Create test spec in `e2e/specs/`:

```typescript
// e2e/specs/new-feature-journey.spec.ts
import { test, expect } from '@playwright/test';

test.describe('New Feature Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin user
    await page.goto('/login');
    await page.getByRole('button').filter({ hasText: 'admin1' }).click();
    await expect(page).toHaveURL('/');
  });

  test('can access new feature', async ({ page }) => {
    // Navigate to feature
    await page.getByRole('link', { name: 'New Feature' }).click();
    await expect(page).toHaveURL('/new-feature');

    // Verify page content
    await expect(page.getByRole('heading', { name: 'New Feature' })).toBeVisible();
  });
});
```

2. Run E2E tests:

```bash
pnpm nx e2e merchant-portal-e2e
```

## Patterns Used

### Context API for Auth State

AuthContext provides global authentication state:

```typescript
// src/features/auth/context/AuthContext.tsx
export function AuthProvider({ children }) {
  const [token, setToken] = useState<string | null>(
    () => sessionStorage.getItem('authToken')
  );
  // ...
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
```

Usage in components:

```typescript
const { isAuthenticated, user, token, login, logout, hasPermission } = useAuth();
```

### TanStack Router Route Protection

DashboardLayout handles authentication redirect:

```typescript
export function DashboardLayout() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated && location.pathname !== '/login') {
      navigate({ to: '/login' });
    }
  }, [isAuthenticated, location.pathname, navigate]);

  // Show only content for login page
  if (location.pathname === '/login' || !isAuthenticated) {
    return <Outlet />;
  }

  // Show sidebar for authenticated users
  return <div>...</div>;
}
```

### TanStack Query for Server State

Centralized query client configuration with sensible defaults:

```typescript
// src/app/providers.tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
      retry: 3,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});
```

### Feature-Based Directory Structure

Each feature is self-contained:

```
features/{feature}/
├── api/           # API hooks and clients
├── components/    # Feature-specific components
├── pages/         # Route components
└── index.ts       # Public exports
```

### MSW for Development

Mock Service Worker intercepts API calls for local development:

```typescript
// src/main.tsx
async function enableMocking() {
  if (import.meta.env.DEV && import.meta.env.VITE_MSW_ENABLED === 'true') {
    const { worker } = await import('./mocks/browser');
    return worker.start({ onUnhandledRequest: 'bypass' });
  }
}

enableMocking().then(() => {
  // Render app
});
```

## Anti-patterns

### Do NOT Use Global State for Server Data

```typescript
// BAD: Don't manage server state in Context
const [products, setProducts] = useState([]);

useEffect(() => {
  fetch('/api/products').then(r => r.json()).then(setProducts);
}, []);
```

```typescript
// GOOD: Use TanStack Query for server state
const { data: products, isLoading } = useQuery({
  queryKey: ['products'],
  queryFn: fetchProducts,
});
```

### Do NOT Bypass Authentication

```typescript
// BAD: Direct access to protected routes
<Route path="/products" component={ProductsPage} />
```

```typescript
// GOOD: Use DashboardLayout for auth redirect
const productsRoute = createRoute({
  getParentRoute: () => rootRoute, // rootRoute uses DashboardLayout
  path: '/products',
  component: ProductsPage,
});
```

### Do NOT Store Sensitive Data in localStorage

```typescript
// BAD: localStorage persists across tabs/windows
localStorage.setItem('authToken', token);
```

```typescript
// GOOD: sessionStorage clears on tab close
sessionStorage.setItem('authToken', token);
```

### Do NOT Hardcode API URLs

```typescript
// BAD: Hardcoded URLs won't work across environments
fetch('http://localhost:8091/api/products')
```

```typescript
// GOOD: Use Vite proxy paths
fetch('/api/merchandise/products')
```

### Do NOT Create Custom Routing Guards

```typescript
// BAD: Custom route guards duplicate auth logic
function ProtectedRoute({ children, permission }) {
  const { hasPermission } = useAuth();
  if (!hasPermission(permission)) return <Navigate to="/login" />;
  return children;
}
```

```typescript
// GOOD: Let DashboardLayout handle auth, use permission checks in UI
export function DashboardLayout() {
  // Centralized auth redirect
  useEffect(() => {
    if (!isAuthenticated && location.pathname !== '/login') {
      navigate({ to: '/login' });
    }
  }, [isAuthenticated, location.pathname]);
}

// In feature pages:
const { hasPermission } = useAuth();
if (!hasPermission('merchant')) return <AccessDenied />;
```

## Dependencies

- `react` - UI framework
- `@tanstack/react-router` - Type-safe routing
- `@tanstack/react-query` - Server state management
- `@reactive-platform/shared-ui-components` - Shared UI component library
- `tailwindcss` - Utility-first CSS framework
- `msw` - API mocking for development and testing
- `vitest` - Unit test runner
- `@playwright/test` - E2E testing framework
- `lucide-react` - Icon library

## Testing

### Unit Tests (Vitest)

```bash
# Run all unit tests
pnpm nx test merchant-portal

# Run tests in watch mode
pnpm nx test merchant-portal --watch

# Run tests with coverage
pnpm nx test merchant-portal --coverage
```

### E2E Tests (Playwright)

```bash
# Run all E2E tests
pnpm nx e2e merchant-portal-e2e

# Run E2E tests with UI
pnpm nx e2e merchant-portal-e2e --ui

# Run specific test file
pnpm nx e2e merchant-portal-e2e --grep "login-journey"

# Debug tests
pnpm nx e2e merchant-portal-e2e --debug
```

### E2E Test Patterns

All E2E tests follow these patterns:

1. **Clear session before each test**:
```typescript
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    sessionStorage.clear();
  });
});
```

2. **Login helper for authenticated tests**:
```typescript
test.beforeEach(async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('button').filter({ hasText: 'admin1' }).click();
  await expect(page).toHaveURL('/');
});
```

3. **Use semantic queries (role, text)**:
```typescript
// GOOD: Semantic queries
await page.getByRole('heading', { name: 'Dashboard' });
await page.getByRole('button', { name: /logout/i });

// AVOID: CSS selectors (brittle)
await page.locator('.dashboard-title');
```

## Development Workflow

1. **Start dev server**:
```bash
pnpm nx serve merchant-portal
```

2. **Enable MSW for local-only development**:
```bash
VITE_MSW_ENABLED=true pnpm nx serve merchant-portal
```

3. **Run tests during development**:
```bash
# Terminal 1: Dev server
pnpm nx serve merchant-portal

# Terminal 2: Unit tests in watch mode
pnpm nx test merchant-portal --watch

# Terminal 3: E2E tests with UI
pnpm nx e2e merchant-portal-e2e --ui
```

4. **Build for production**:
```bash
pnpm nx build merchant-portal
```

## Related Standards

- [Frontend Architecture](../../docs/standards/frontend/architecture.md)
- [Frontend Components](../../docs/standards/frontend/components.md)
- [Documentation Standard](../../docs/standards/documentation.md)
