# Merchant Portal Contents

## Application Setup (`src/app/`)

- `providers.tsx` - Provider hierarchy: AuthProvider, QueryClientProvider, RouterProvider with QueryClient configuration
- `routes.tsx` - TanStack Router route definitions for dashboard, products, pricing, inventory, and login

## Features (`src/features/`)

### Authentication (`src/features/auth/`)

- `config.ts` - Auth configuration, test user definitions, role constants
- `index.ts` - Public exports (AuthProvider, useAuth)

#### Auth Context (`src/features/auth/context/`)

- `AuthContext.tsx` - Authentication state management, login/logout logic, JWT token parsing, permission checking

#### Auth Pages (`src/features/auth/pages/`)

- `LoginPage.tsx` - Login UI with test user selection cards

### Dashboard (`src/features/dashboard/`)

#### Dashboard Pages (`src/features/dashboard/pages/`)

- `DashboardPage.tsx` - Landing page with welcome message and user stats

### Products (`src/features/products/`)

#### Product Pages (`src/features/products/pages/`)

- `ProductsPage.tsx` - Product catalog management page (placeholder for CRUD implementation)

### Pricing (`src/features/pricing/`)

#### Pricing Pages (`src/features/pricing/pages/`)

- `PricingPage.tsx` - Pricing management page (placeholder for price updates)

### Inventory (`src/features/inventory/`)

#### Inventory Pages (`src/features/inventory/pages/`)

- `InventoryPage.tsx` - Inventory tracking page (placeholder for stock management)

## Shared Components (`src/shared/`)

### Layouts (`src/shared/layouts/`)

- `DashboardLayout.tsx` - Main layout with sidebar navigation, auth redirect, permission-based menu filtering, logout button

## Mocks (`src/mocks/`)

- `browser.ts` - MSW browser worker setup for development mode
- `handlers.ts` - Mock API handlers for authentication endpoints, JWT token generation

## Test Setup (`src/test/`)

- `setup.ts` - Vitest configuration and global test setup

## Application Entry (`src/`)

- `main.tsx` - Application entry point, MSW initialization, React root rendering
- `styles.css` - Global Tailwind CSS imports and custom styles

## E2E Tests (`e2e/`)

### E2E Specifications (`e2e/specs/`)

- `login-journey.spec.ts` - Login flow tests: view test users, login as different roles, logout
- `dashboard-journey.spec.ts` - Dashboard access and user info display tests
- `navigation-journey.spec.ts` - Permission-based navigation tests for different user roles

### E2E Configuration (`e2e/`)

- `playwright.config.ts` - Playwright configuration for E2E tests
- `project.json` - Nx E2E project configuration

## Configuration Files

- `vite.config.mts` - Vite configuration with API proxies, Vitest setup, build options
- `tailwind.config.ts` - Tailwind CSS configuration with design tokens
- `tsconfig.json` - Root TypeScript configuration
- `tsconfig.app.json` - Application TypeScript configuration
- `tsconfig.spec.json` - Test TypeScript configuration
- `project.json` - Nx project configuration
- `index.html` - HTML entry point with root div
- `.env` - Environment variables (gitignored)
- `.env.example` - Example environment variables template

## Static Assets (`public/`)

- `public/` - Static assets directory for images, fonts, etc.

## Generated Outputs

- `dist/apps/merchant-portal/` - Production build output (gitignored)
- `coverage/apps/merchant-portal/` - Test coverage reports (gitignored)
- `e2e/playwright-report/` - Playwright test reports (gitignored)
- `e2e/test-results/` - Playwright test results (gitignored)

## Summary

### Directory Structure Overview

```
apps/merchant-portal/
├── src/
│   ├── app/                      # Application setup (2 files)
│   ├── features/                 # Feature modules (10 files)
│   │   ├── auth/                 # Authentication (4 files)
│   │   ├── dashboard/            # Dashboard (1 file)
│   │   ├── inventory/            # Inventory (1 file)
│   │   ├── pricing/              # Pricing (1 file)
│   │   └── products/             # Products (1 file)
│   ├── shared/                   # Shared components (1 file)
│   │   └── layouts/
│   ├── mocks/                    # MSW mocks (2 files)
│   ├── test/                     # Test setup (1 file)
│   ├── main.tsx                  # Entry point
│   └── styles.css                # Global styles
├── e2e/                          # E2E tests (4 specs)
├── public/                       # Static assets
└── [config files]                # Vite, Tailwind, TypeScript configs
```

### File Count by Type

- TypeScript/TSX files: 16
- Test specification files: 3
- Configuration files: 6
- Total lines of code: ~1,200 (excluding dependencies)

### Key Integration Points

1. **Authentication**: AuthContext → user-service (8089) → JWT token → sessionStorage
2. **API Calls**: Feature components → TanStack Query → Vite proxy → Backend services
3. **Routing**: TanStack Router → DashboardLayout (auth check) → Feature pages
4. **Mocking**: MSW handlers → Development mode (VITE_MSW_ENABLED) → Mock responses
5. **Testing**: Playwright → E2E specs → Dev server (4201) → MSW or real backend
