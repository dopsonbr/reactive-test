# 050F: Merchant Portal Frontend

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create a React frontend for managing products, prices, and inventory with role-based access control.

**Architecture:** Vite + React 19 + TanStack Router + TanStack Query, following ecommerce-web patterns.

**Tech Stack:** React 19, TypeScript, Vite, TanStack Router, TanStack Query, Tailwind CSS, shadcn/ui

---

## Task 1: Create Nx Project Configuration

**Files:**
- Create: `apps/merchant-portal/project.json`

**Step 1: Create directory**

```bash
mkdir -p apps/merchant-portal
```

**Step 2: Create project.json**

```json
{
  "name": "merchant-portal",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "sourceRoot": "apps/merchant-portal/src",
  "projectType": "application",
  "tags": ["type:app", "scope:merchant", "platform:web"],
  "targets": {}
}
```

**Step 3: Commit**

```bash
git add apps/merchant-portal/project.json
git commit -m "feat(merchant-portal): add Nx project configuration"
```

---

## Task 2: Create Vite Configuration

**Files:**
- Create: `apps/merchant-portal/vite.config.mts`

**Step 1: Create the Vite config**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';

export default defineConfig(() => ({
  root: import.meta.dirname,
  server: {
    port: 4201,
    host: 'localhost',
    proxy: {
      // Merchandise API
      '/api/merchandise': {
        target: 'http://localhost:8091',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      // Price API
      '/api/price': {
        target: 'http://localhost:8092',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      // Inventory API
      '/api/inventory': {
        target: 'http://localhost:8093',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      // Auth endpoints
      '/auth': {
        target: 'http://localhost:8089',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/auth/, '/dev'),
      },
    },
  },
  preview: { port: 4201, host: 'localhost' },
  plugins: [react(), nxViteTsPaths()],
  build: {
    outDir: '../../dist/apps/merchant-portal',
    emptyOutDir: true,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
}));
```

**Step 2: Commit**

```bash
git add apps/merchant-portal/vite.config.mts
git commit -m "feat(merchant-portal): add Vite configuration"
```

---

## Task 3: Create TypeScript Configuration

**Files:**
- Create: `apps/merchant-portal/tsconfig.json`
- Create: `apps/merchant-portal/tsconfig.app.json`

**Step 1: Create tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "strict": true
  },
  "references": [
    { "path": "./tsconfig.app.json" }
  ]
}
```

**Step 2: Create tsconfig.app.json**

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "../../dist/out-tsc",
    "types": ["vite/client"]
  },
  "include": ["src/**/*.ts", "src/**/*.tsx"],
  "exclude": ["src/**/*.test.ts", "src/**/*.test.tsx"]
}
```

**Step 3: Commit**

```bash
git add apps/merchant-portal/tsconfig*.json
git commit -m "feat(merchant-portal): add TypeScript configuration"
```

---

## Task 4: Create HTML Entry Point

**Files:**
- Create: `apps/merchant-portal/index.html`

**Step 1: Create index.html**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Merchant Portal</title>
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

**Step 2: Commit**

```bash
git add apps/merchant-portal/index.html
git commit -m "feat(merchant-portal): add HTML entry point"
```

---

## Task 5: Create Main Entry Point and Styles

**Files:**
- Create: `apps/merchant-portal/src/main.tsx`
- Create: `apps/merchant-portal/src/styles.css`

**Step 1: Create directory structure**

```bash
mkdir -p apps/merchant-portal/src/app
mkdir -p apps/merchant-portal/src/features
mkdir -p apps/merchant-portal/src/shared
```

**Step 2: Create main.tsx**

```typescript
import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import { Providers } from './app/providers';
import './styles.css';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <StrictMode>
    <Providers />
  </StrictMode>
);
```

**Step 3: Create styles.css**

```css
@import '@reactive-platform/shared-design-tokens';

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

**Step 4: Commit**

```bash
git add apps/merchant-portal/src/main.tsx apps/merchant-portal/src/styles.css
git commit -m "feat(merchant-portal): add main entry point and styles"
```

---

## Task 6: Create Providers

**Files:**
- Create: `apps/merchant-portal/src/app/providers.tsx`

**Step 1: Create the providers**

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { router } from './routes';
import { AuthProvider } from '../features/auth';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
      retry: 3,
      refetchOnWindowFocus: false,
    },
    mutations: { retry: 1 },
  },
});

export function Providers() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </AuthProvider>
  );
}
```

**Step 2: Commit**

```bash
git add apps/merchant-portal/src/app/providers.tsx
git commit -m "feat(merchant-portal): add provider composition"
```

---

## Task 7: Create Auth Feature

**Files:**
- Create: `apps/merchant-portal/src/features/auth/index.ts`
- Create: `apps/merchant-portal/src/features/auth/context/AuthContext.tsx`
- Create: `apps/merchant-portal/src/features/auth/config.ts`

**Step 1: Create auth directories**

```bash
mkdir -p apps/merchant-portal/src/features/auth/context
mkdir -p apps/merchant-portal/src/features/auth/components
```

**Step 2: Create config.ts**

```typescript
export type AuthMode = 'dev' | 'oauth';

export interface AuthConfig {
  mode: AuthMode;
  authUrl: string;
  clientId: string;
  redirectUri: string;
}

export function getAuthConfig(): AuthConfig {
  return {
    mode: 'dev',
    authUrl: import.meta.env.VITE_AUTH_URL || '/auth',
    clientId: 'merchant-portal',
    redirectUri: `${window.location.origin}/callback`,
  };
}

export const MERCHANT_ROLES = ['MERCHANT', 'PRICING_SPECIALIST', 'INVENTORY_SPECIALIST', 'ADMIN'];

export const DEV_TEST_USERS = [
  {
    username: 'merchant1',
    description: 'Product management',
    permissions: ['read', 'write', 'merchant'],
  },
  {
    username: 'pricer1',
    description: 'Price management',
    permissions: ['read', 'write', 'pricing_specialist'],
  },
  {
    username: 'inventory1',
    description: 'Inventory management',
    permissions: ['read', 'write', 'inventory_specialist'],
  },
  {
    username: 'admin1',
    description: 'Full access',
    permissions: ['read', 'write', 'admin', 'merchant', 'pricing_specialist', 'inventory_specialist'],
  },
];
```

**Step 3: Create AuthContext.tsx**

```typescript
import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { getAuthConfig, AuthConfig } from '../config';

interface User {
  id: string;
  username: string;
  permissions: string[];
  storeNumber?: number;
}

interface AuthContextValue {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  authConfig: AuthConfig;
  login: (username: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function parseTokenClaims(token: string): User | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      id: payload.sub || '',
      username: payload.username || '',
      permissions: payload.permissions || [],
      storeNumber: payload.store_number,
    };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authConfig] = useState(() => getAuthConfig());
  const [token, setToken] = useState<string | null>(
    () => sessionStorage.getItem('authToken')
  );
  const [user, setUser] = useState<User | null>(() => {
    const stored = sessionStorage.getItem('authToken');
    return stored ? parseTokenClaims(stored) : null;
  });
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback(async (username: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${authConfig.authUrl}/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, userType: 'EMPLOYEE', storeNumber: 1234 }),
      });

      if (!response.ok) throw new Error('Login failed');

      const data = await response.json();
      const accessToken = data.access_token;
      const claims = parseTokenClaims(accessToken);

      sessionStorage.setItem('authToken', accessToken);
      setToken(accessToken);
      setUser(claims);
    } finally {
      setIsLoading(false);
    }
  }, [authConfig]);

  const logout = useCallback(() => {
    sessionStorage.removeItem('authToken');
    setToken(null);
    setUser(null);
  }, []);

  const hasPermission = useCallback((permission: string) => {
    if (!user) return false;
    return user.permissions.includes(permission) || user.permissions.includes('admin');
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!token,
        user,
        token,
        authConfig,
        login,
        logout,
        isLoading,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
```

**Step 4: Create index.ts**

```typescript
export { AuthProvider, useAuth } from './context/AuthContext';
export { getAuthConfig, DEV_TEST_USERS, MERCHANT_ROLES } from './config';
```

**Step 5: Commit**

```bash
git add apps/merchant-portal/src/features/auth/
git commit -m "feat(merchant-portal): add auth context and configuration"
```

---

## Task 8: Create Routes

**Files:**
- Create: `apps/merchant-portal/src/app/routes.tsx`

**Step 1: Create the router**

```typescript
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
```

**Step 2: Commit**

```bash
git add apps/merchant-portal/src/app/routes.tsx
git commit -m "feat(merchant-portal): add TanStack router configuration"
```

---

## Task 9: Create Dashboard Layout

**Files:**
- Create: `apps/merchant-portal/src/shared/layouts/DashboardLayout.tsx`

**Step 1: Create layouts directory**

```bash
mkdir -p apps/merchant-portal/src/shared/layouts
```

**Step 2: Create DashboardLayout.tsx**

```typescript
import { Outlet, Link, useLocation } from '@tanstack/react-router';
import { Package, DollarSign, Boxes, LayoutDashboard, LogOut } from 'lucide-react';
import { useAuth } from '../../features/auth';
import { Button } from '@reactive-platform/shared-ui-components';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, permission: null },
  { to: '/products', label: 'Products', icon: Package, permission: 'merchant' },
  { to: '/pricing', label: 'Pricing', icon: DollarSign, permission: 'pricing_specialist' },
  { to: '/inventory', label: 'Inventory', icon: Boxes, permission: 'inventory_specialist' },
];

export function DashboardLayout() {
  const { isAuthenticated, user, logout, hasPermission } = useAuth();
  const location = useLocation();

  if (!isAuthenticated && location.pathname !== '/login') {
    return <Outlet />;
  }

  const visibleNavItems = navItems.filter(
    (item) => !item.permission || hasPermission(item.permission)
  );

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card">
        <div className="p-6">
          <h1 className="text-xl font-bold">Merchant Portal</h1>
        </div>
        <nav className="px-3 space-y-1">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        {user && (
          <div className="absolute bottom-0 left-0 w-64 p-4 border-t">
            <div className="text-sm text-muted-foreground mb-2">
              {user.username}
            </div>
            <Button variant="ghost" size="sm" onClick={logout} className="w-full">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        )}
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto p-8">
        <Outlet />
      </main>
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add apps/merchant-portal/src/shared/layouts/
git commit -m "feat(merchant-portal): add dashboard layout with sidebar"
```

---

## Task 10: Create Feature Pages (Stubs)

**Files:**
- Create: `apps/merchant-portal/src/features/dashboard/pages/DashboardPage.tsx`
- Create: `apps/merchant-portal/src/features/products/pages/ProductsPage.tsx`
- Create: `apps/merchant-portal/src/features/pricing/pages/PricingPage.tsx`
- Create: `apps/merchant-portal/src/features/inventory/pages/InventoryPage.tsx`
- Create: `apps/merchant-portal/src/features/auth/pages/LoginPage.tsx`

**Step 1: Create directories**

```bash
mkdir -p apps/merchant-portal/src/features/dashboard/pages
mkdir -p apps/merchant-portal/src/features/products/pages
mkdir -p apps/merchant-portal/src/features/pricing/pages
mkdir -p apps/merchant-portal/src/features/inventory/pages
mkdir -p apps/merchant-portal/src/features/auth/pages
```

**Step 2: Create DashboardPage.tsx**

```typescript
import { useAuth } from '../../auth';

export function DashboardPage() {
  const { user } = useAuth();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <p className="text-muted-foreground">
        Welcome back, {user?.username || 'Guest'}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="rounded-lg border p-6">
          <h3 className="font-semibold">Products</h3>
          <p className="text-3xl font-bold mt-2">--</p>
        </div>
        <div className="rounded-lg border p-6">
          <h3 className="font-semibold">Low Stock</h3>
          <p className="text-3xl font-bold mt-2">--</p>
        </div>
        <div className="rounded-lg border p-6">
          <h3 className="font-semibold">On Sale</h3>
          <p className="text-3xl font-bold mt-2">--</p>
        </div>
      </div>
    </div>
  );
}
```

**Step 3: Create ProductsPage.tsx**

```typescript
export function ProductsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Products</h1>
      <p className="text-muted-foreground">Manage product catalog</p>
      {/* Product list and CRUD will be implemented here */}
    </div>
  );
}
```

**Step 4: Create PricingPage.tsx**

```typescript
export function PricingPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Pricing</h1>
      <p className="text-muted-foreground">Manage product prices</p>
      {/* Price editor will be implemented here */}
    </div>
  );
}
```

**Step 5: Create InventoryPage.tsx**

```typescript
export function InventoryPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Inventory</h1>
      <p className="text-muted-foreground">Manage stock levels</p>
      {/* Inventory editor will be implemented here */}
    </div>
  );
}
```

**Step 6: Create LoginPage.tsx**

```typescript
import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '@reactive-platform/shared-ui-components';
import { useAuth, DEV_TEST_USERS } from '../../auth';

export function LoginPage() {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (username: string) => {
    setError(null);
    try {
      await login(username);
      navigate({ to: '/' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-6 rounded-lg border p-8">
        <div>
          <h1 className="text-2xl font-bold">Merchant Portal</h1>
          <p className="text-muted-foreground mt-1">Sign in to continue</p>
        </div>

        {error && (
          <div className="rounded-lg bg-destructive/10 p-3 text-destructive text-sm">
            {error}
          </div>
        )}

        <div className="space-y-3">
          {DEV_TEST_USERS.map((user) => (
            <button
              key={user.username}
              onClick={() => handleLogin(user.username)}
              disabled={isLoading}
              className="w-full rounded-lg border p-4 text-left hover:bg-muted disabled:opacity-50"
            >
              <div className="font-medium">{user.username}</div>
              <div className="text-sm text-muted-foreground">{user.description}</div>
              <div className="flex flex-wrap gap-1 mt-2">
                {user.permissions.map((perm) => (
                  <span key={perm} className="rounded bg-primary/10 px-2 py-0.5 text-xs">
                    {perm}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
```

**Step 7: Commit**

```bash
git add apps/merchant-portal/src/features/
git commit -m "feat(merchant-portal): add feature page stubs"
```

---

## Task 11: Verify Build

**Step 1: Run the dev server**

```bash
pnpm nx serve merchant-portal
```

Expected: Opens at http://localhost:4201

**Step 2: Test login flow**

1. Navigate to http://localhost:4201/login
2. Click on a test user
3. Verify redirect to dashboard

**Step 3: Commit any fixes**

---

## Summary

| Task | Files | Purpose |
|------|-------|---------|
| 1 | `project.json` | Nx configuration |
| 2 | `vite.config.mts` | Build and proxy |
| 3 | `tsconfig*.json` | TypeScript |
| 4 | `index.html` | HTML entry |
| 5 | `main.tsx`, `styles.css` | App entry |
| 6 | `providers.tsx` | Provider composition |
| 7 | Auth feature | Auth context + config |
| 8 | `routes.tsx` | TanStack Router |
| 9 | `DashboardLayout.tsx` | Sidebar layout |
| 10 | Feature pages | Page stubs |
| 11 | - | Build verification |

---

## Future Tasks (Not in this plan)

- Product CRUD with forms
- Price editor with inline editing
- Inventory management with low-stock alerts
- Docker configuration for production build
- E2E tests with Playwright
