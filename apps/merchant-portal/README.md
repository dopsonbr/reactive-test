# Merchant Portal

Internal management portal for merchant operations including product catalog, pricing, and inventory management. Role-based access control ensures users can only access features relevant to their permissions.

## Features

- **Authentication** - JWT-based auth with role-based access control via user-service
- **Product Management** - CRUD operations for product catalog (merchandise data)
- **Pricing Management** - Price updates and management for products
- **Inventory Management** - Stock levels and availability tracking
- **Permission-based Navigation** - UI adapts to user roles (merchant, pricing specialist, inventory specialist, admin)
- **Mock Service Worker** - Development mode with MSW for API mocking

## Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **TanStack Router** - Type-safe routing
- **TanStack Query** - Server state management
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - UI component library via `@reactive-platform/shared-ui-components`
- **MSW** - API mocking for development
- **Vitest** - Unit testing
- **Playwright** - E2E testing

## Running

### Development Server (Local)

```bash
# From repository root
pnpm nx serve merchant-portal
```

Opens at: http://localhost:4201

API proxies to:
- Merchandise API: http://localhost:8091
- Price API: http://localhost:8092
- Inventory API: http://localhost:8093
- User/Auth API: http://localhost:8089

### With MSW Mocking

```bash
# Enable MSW for development without backend services
VITE_MSW_ENABLED=true pnpm nx serve merchant-portal
```

MSW mocks authentication endpoints with test users (no backend required).

### Docker (Production-like)

```bash
# Build application
pnpm nx build merchant-portal

# Build and start Docker container
cd docker
docker compose up -d merchant-portal

# View logs
docker compose logs -f merchant-portal
```

Opens at: http://localhost:3002

### Testing

```bash
# Unit tests (Vitest)
pnpm nx test merchant-portal

# E2E tests (Playwright)
pnpm nx e2e merchant-portal-e2e

# E2E tests with UI
pnpm nx e2e merchant-portal-e2e --ui
```

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_AUTH_URL` | `/auth` | User service authentication endpoint |
| `VITE_MSW_ENABLED` | `false` | Enable Mock Service Worker for API mocking |

### API Endpoints

The application consumes these backend services:

| Service | Port | Proxy Path | Purpose |
|---------|------|------------|---------|
| merchandise-service | 8091 | `/api/merchandise` | Product catalog data |
| price-service | 8092 | `/api/price` | Product pricing |
| inventory-service | 8093 | `/api/inventory` | Stock levels |
| user-service | 8089 | `/auth` | Authentication and JWT tokens |

All API calls are proxied through Vite dev server to avoid CORS issues.

### Dev Test Users

In development mode with MSW enabled, use these test users:

| Username | Role | Permissions |
|----------|------|-------------|
| `merchant1` | Merchant | Product management |
| `pricer1` | Pricing Specialist | Price management |
| `inventory1` | Inventory Specialist | Inventory management |
| `admin1` | Admin | Full access to all features |

Click any user on the login page to authenticate instantly (no password required).

## Project Structure

```
apps/merchant-portal/
├── src/
│   ├── app/                      # Application setup
│   │   ├── providers.tsx         # React Context + TanStack Query + Router
│   │   └── routes.tsx            # TanStack Router configuration
│   ├── features/                 # Feature modules
│   │   ├── auth/                 # Authentication
│   │   │   ├── config.ts         # Auth config and test users
│   │   │   ├── context/          # AuthContext and useAuth hook
│   │   │   └── pages/            # LoginPage
│   │   ├── dashboard/            # Dashboard landing page
│   │   ├── products/             # Product management
│   │   ├── pricing/              # Pricing management
│   │   └── inventory/            # Inventory management
│   ├── shared/                   # Shared components
│   │   └── layouts/              # DashboardLayout with sidebar
│   ├── mocks/                    # MSW handlers
│   │   ├── browser.ts            # MSW browser worker setup
│   │   └── handlers.ts           # Mock API handlers
│   ├── test/                     # Test setup
│   │   └── setup.ts              # Vitest configuration
│   ├── main.tsx                  # Application entry point
│   └── styles.css                # Global Tailwind CSS imports
├── e2e/                          # Playwright E2E tests
│   ├── specs/                    # Test specifications
│   │   ├── login-journey.spec.ts
│   │   ├── dashboard-journey.spec.ts
│   │   └── navigation-journey.spec.ts
│   └── playwright.config.ts
├── public/                       # Static assets
├── index.html                    # HTML entry point
├── vite.config.mts               # Vite configuration
├── tailwind.config.ts            # Tailwind CSS configuration
├── project.json                  # Nx project configuration
└── tsconfig.json                 # TypeScript configuration
```

## Key Patterns

### Route Definition

Routes are defined in `src/app/routes.tsx` using TanStack Router:

```typescript
const productsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/products',
  component: ProductsPage,
});
```

### Authentication Flow

1. User clicks test user on LoginPage
2. AuthContext calls `/auth/token` endpoint (proxied to user-service:8089)
3. JWT token stored in sessionStorage
4. DashboardLayout redirects unauthenticated users to `/login`
5. Navigation menu shows only permitted routes based on user permissions

### Permission Checking

```typescript
const { hasPermission } = useAuth();

// Check if user can access feature
if (hasPermission('merchant')) {
  // Show product management UI
}
```

### API Integration (Pattern)

```typescript
import { useQuery } from '@tanstack/react-query';

function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const response = await fetch('/api/merchandise/products');
      if (!response.ok) throw new Error('Failed to fetch products');
      return response.json();
    },
  });
}
```

## Related

- [Frontend Architecture Standard](../../docs/standards/frontend/architecture.md)
- [User Service](../../apps/user-service/README.md) - Authentication and JWT generation
- [Merchandise Service](../../apps/merchandise-service/README.md) - Product catalog
- [Price Service](../../apps/price-service/README.md) - Pricing data
- [Inventory Service](../../apps/inventory-service/README.md) - Stock levels
- [Shared UI Components](../../libs/frontend/shared-ui/ui-components/README.md)
