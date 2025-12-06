# 023A_MOCKED_E2E

**Status: COMPLETE**

---

## Overview

Scaffold `apps/ecommerce-web` with product and cart feature folders, implement TanStack Query hooks wired to backend contracts, set up MSW for API mocking, create Playwright E2E tests with mocked backend, and add Ladle stories for feature UX states.

**Parent Plan:** [023_FRONTEND_FLOWS_AND_E2E](./023_FRONTEND_FLOWS_AND_E2E.md)

**Prerequisites:**
- `020_NX_MONOREPO_IMPLEMENTATION.md` Phase 1.1 complete (pnpm, nx.json)
- `022_DESIGN_SYSTEM_AND_COMPONENT_LIBRARY.md` complete (shared-ui components)

**Blockers:**
- `@reactive-platform/shared-ui-components` must be published
- Tailwind CSS configured in workspace
- TanStack Router + Query packages installed

---

## Goals

1. Scaffold `apps/ecommerce-web` using Nx React generator
2. Create feature folders with smart/presentational component split
3. Implement TanStack Query hooks for product and cart APIs
4. Configure MSW for development and test mocking
5. Create Playwright E2E tests with mocked backend
6. Add Ladle stories documenting feature UX states

---

## Exit Criteria

- [ ] `nx serve ecommerce-web` runs successfully
- [ ] Product list/detail pages render with mocked data
- [ ] Cart add/update/remove works with mocked API
- [ ] `nx e2e ecommerce-web-e2e` passes with mocked backend
- [ ] Ladle stories cover loading, error, empty, and success states

---

## Phase 1: App Scaffold

**Prereqs:** Nx workspace initialized, React plugin installed

### 1.1 Generate App

```bash
nx g @nx/react:app ecommerce-web \
  --bundler=vite \
  --routing=true \
  --style=tailwindcss \
  --unitTestRunner=vitest \
  --e2eTestRunner=playwright \
  --tags="scope:ecommerce,type:app,platform:web"
```

### 1.2 Install Dependencies

```bash
pnpm add @tanstack/react-router @tanstack/react-query
pnpm add -D msw @mswjs/data
```

### 1.3 Configure TanStack Router

**File:** `apps/ecommerce-web/src/app/routes.tsx`

```tsx
import { createRouter, createRootRoute, createRoute } from '@tanstack/react-router';
import { RootLayout } from '../shared/layouts/RootLayout';
import { ProductListPage } from '../features/products/pages/ProductListPage';
import { ProductDetailPage } from '../features/products/pages/ProductDetailPage';
import { CartPage } from '../features/cart/pages/CartPage';

const rootRoute = createRootRoute({ component: RootLayout });

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: ProductListPage,
});

const productDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/products/$sku',
  component: ProductDetailPage,
});

const cartRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/cart',
  component: CartPage,
});

const routeTree = rootRoute.addChildren([indexRoute, productDetailRoute, cartRoute]);
export const router = createRouter({ routeTree });
```

### 1.4 Configure Providers

**File:** `apps/ecommerce-web/src/app/providers.tsx`

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { router } from './routes';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 3,
    },
  },
});

export function Providers({ children }: { children?: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
```

---

## Phase 2: Shared Data Access Library

**Prereqs:** Phase 1 complete

### 2.1 Generate Shared Data Library

```bash
nx g @nx/react:lib shared-data \
  --directory=libs/shared-data \
  --bundler=vite \
  --unitTestRunner=vitest \
  --tags="scope:shared,type:data-access"
```

### 2.2 API Client

**File:** `libs/shared-data/src/lib/api-client.ts`

```typescript
import { ApiError } from './errors';

interface RequestOptions extends RequestInit {
  params?: Record<string, string>;
}

export async function apiClient<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, ...fetchOptions } = options;

  const url = new URL(endpoint, import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080');
  if (params) {
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  }

  // Add required headers
  const headers = new Headers(fetchOptions.headers);
  headers.set('Content-Type', 'application/json');
  headers.set('x-store-number', sessionStorage.getItem('storeNumber') || '1');
  headers.set('x-order-number', sessionStorage.getItem('orderNumber') || crypto.randomUUID());
  headers.set('x-userid', sessionStorage.getItem('userId') || 'GUEST1');
  headers.set('x-sessionid', sessionStorage.getItem('sessionId') || crypto.randomUUID());

  const response = await fetch(url.toString(), { ...fetchOptions, headers });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new ApiError(body.message || response.statusText, response.status, body.code);
  }

  return response.json();
}
```

### 2.3 Error Types

**File:** `libs/shared-data/src/lib/errors.ts`

```typescript
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
```

---

## Phase 3: Product Feature

**Prereqs:** Phase 2 complete

### 3.1 Types

**File:** `apps/ecommerce-web/src/features/products/types/product.ts`

```typescript
export interface Product {
  sku: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  imageUrl: string;
  inStock: boolean;
  quantity: number;
  category: string;
}

export interface ProductSearchParams {
  query?: string;
  category?: string;
  page?: number;
  limit?: number;
}

export interface ProductSearchResult {
  products: Product[];
  total: number;
  page: number;
  totalPages: number;
}
```

### 3.2 API Hooks

**File:** `apps/ecommerce-web/src/features/products/api/useProducts.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@reactive-platform/shared-data';
import type { Product, ProductSearchParams, ProductSearchResult } from '../types/product';

export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (params: ProductSearchParams) => [...productKeys.lists(), params] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (sku: string) => [...productKeys.details(), sku] as const,
};

export function useProducts(params: ProductSearchParams = {}) {
  return useQuery({
    queryKey: productKeys.list(params),
    queryFn: () => apiClient<ProductSearchResult>('/products/search', {
      params: {
        q: params.query || '',
        category: params.category || '',
        page: String(params.page || 1),
        limit: String(params.limit || 20),
      },
    }),
  });
}

export function useProduct(sku: string) {
  return useQuery({
    queryKey: productKeys.detail(sku),
    queryFn: () => apiClient<Product>(`/products/${sku}`),
    enabled: !!sku,
  });
}
```

### 3.3 Presentational Components

**File:** `apps/ecommerce-web/src/features/products/components/ProductCard.tsx`

```tsx
import { Card, CardContent, CardFooter } from '@reactive-platform/shared-ui-components';
import { Button } from '@reactive-platform/shared-ui-components';
import type { Product } from '../types/product';

interface ProductCardProps {
  product: Product;
  onAddToCart: (sku: string) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  return (
    <Card data-testid={`product-card-${product.sku}`}>
      <CardContent>
        <img src={product.imageUrl} alt={product.name} className="w-full h-48 object-cover" />
        <h3 className="text-lg font-semibold mt-2">{product.name}</h3>
        <p className="text-muted-foreground">${product.price.toFixed(2)}</p>
      </CardContent>
      <CardFooter>
        <Button
          onClick={() => onAddToCart(product.sku)}
          disabled={!product.inStock}
          aria-label={`Add ${product.name} to cart`}
        >
          {product.inStock ? 'Add to Cart' : 'Out of Stock'}
        </Button>
      </CardFooter>
    </Card>
  );
}
```

### 3.4 Smart Components

**File:** `apps/ecommerce-web/src/features/products/components/ProductList.tsx`

```tsx
import { useProducts } from '../api/useProducts';
import { ProductCard } from './ProductCard';
import { ProductListSkeleton } from './ProductListSkeleton';
import { ErrorCard } from '../../../shared/components/ErrorCard';
import { useAddToCart } from '../../cart/api/useCart';

interface ProductListProps {
  category?: string;
  query?: string;
}

export function ProductList({ category, query }: ProductListProps) {
  const { data, isLoading, isError, error, refetch } = useProducts({ category, query });
  const addToCart = useAddToCart();

  if (isLoading) return <ProductListSkeleton />;
  if (isError) return <ErrorCard error={error} onRetry={() => refetch()} />;
  if (!data?.products.length) return <EmptyState message="No products found" />;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {data.products.map((product) => (
        <ProductCard
          key={product.sku}
          product={product}
          onAddToCart={(sku) => addToCart.mutate({ sku, quantity: 1 })}
        />
      ))}
    </div>
  );
}
```

### 3.5 Pages

**File:** `apps/ecommerce-web/src/features/products/pages/ProductListPage.tsx`

```tsx
import { useSearch } from '@tanstack/react-router';
import { ProductList } from '../components/ProductList';
import { ProductFilters } from '../components/ProductFilters';

export function ProductListPage() {
  const { category, q } = useSearch({ from: '/' });

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Products</h1>
      <div className="flex gap-8">
        <aside className="w-64">
          <ProductFilters />
        </aside>
        <main className="flex-1">
          <ProductList category={category} query={q} />
        </main>
      </div>
    </div>
  );
}
```

---

## Phase 4: Cart Feature

**Prereqs:** Phase 3 complete

### 4.1 Types

**File:** `apps/ecommerce-web/src/features/cart/types/cart.ts`

```typescript
export interface CartItem {
  sku: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
}

export interface Cart {
  id: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
}

export interface AddToCartRequest {
  sku: string;
  quantity: number;
}
```

### 4.2 API Hooks

**File:** `apps/ecommerce-web/src/features/cart/api/useCart.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@reactive-platform/shared-data';
import type { Cart, AddToCartRequest } from '../types/cart';

export const cartKeys = {
  all: ['cart'] as const,
  detail: (id: string) => [...cartKeys.all, id] as const,
};

function getCartId(): string {
  let cartId = sessionStorage.getItem('cartId');
  if (!cartId) {
    cartId = crypto.randomUUID();
    sessionStorage.setItem('cartId', cartId);
  }
  return cartId;
}

export function useCart() {
  const cartId = getCartId();
  return useQuery({
    queryKey: cartKeys.detail(cartId),
    queryFn: () => apiClient<Cart>(`/carts/${cartId}`),
    retry: (failureCount, error) => {
      if (error instanceof Error && error.message.includes('404')) return false;
      return failureCount < 3;
    },
  });
}

export function useAddToCart() {
  const queryClient = useQueryClient();
  const cartId = getCartId();

  return useMutation({
    mutationFn: (item: AddToCartRequest) =>
      apiClient<Cart>(`/carts/${cartId}/products`, {
        method: 'POST',
        body: JSON.stringify(item),
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(cartKeys.detail(cartId), data);
    },
  });
}

export function useUpdateCartItem() {
  const queryClient = useQueryClient();
  const cartId = getCartId();

  return useMutation({
    mutationFn: ({ sku, quantity }: { sku: string; quantity: number }) =>
      apiClient<Cart>(`/carts/${cartId}/products/${sku}`, {
        method: 'PUT',
        body: JSON.stringify({ quantity }),
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(cartKeys.detail(cartId), data);
    },
  });
}

export function useRemoveFromCart() {
  const queryClient = useQueryClient();
  const cartId = getCartId();

  return useMutation({
    mutationFn: (sku: string) =>
      apiClient<Cart>(`/carts/${cartId}/products/${sku}`, {
        method: 'DELETE',
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(cartKeys.detail(cartId), data);
    },
  });
}
```

### 4.3 Cart Page

**File:** `apps/ecommerce-web/src/features/cart/pages/CartPage.tsx`

```tsx
import { useCart, useUpdateCartItem, useRemoveFromCart } from '../api/useCart';
import { CartItemRow } from '../components/CartItemRow';
import { CartSummary } from '../components/CartSummary';
import { EmptyCart } from '../components/EmptyCart';
import { CartSkeleton } from '../components/CartSkeleton';

export function CartPage() {
  const { data: cart, isLoading, isError } = useCart();
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveFromCart();

  if (isLoading) return <CartSkeleton />;
  if (isError || !cart) return <EmptyCart />;
  if (cart.items.length === 0) return <EmptyCart />;

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Your Cart</h1>
      <div className="flex gap-8">
        <div className="flex-1 space-y-4">
          {cart.items.map((item) => (
            <CartItemRow
              key={item.sku}
              item={item}
              onUpdateQuantity={(qty) => updateItem.mutate({ sku: item.sku, quantity: qty })}
              onRemove={() => removeItem.mutate(item.sku)}
            />
          ))}
        </div>
        <aside className="w-80">
          <CartSummary cart={cart} />
        </aside>
      </div>
    </div>
  );
}
```

---

## Phase 5: MSW Setup

**Prereqs:** Phase 4 complete

### 5.1 MSW Handlers

**File:** `apps/ecommerce-web/src/mocks/handlers.ts`

```typescript
import { http, HttpResponse } from 'msw';
import { mockProducts, mockCart } from './data';

export const handlers = [
  // Products
  http.get('*/products/search', ({ request }) => {
    const url = new URL(request.url);
    const query = url.searchParams.get('q')?.toLowerCase() || '';
    const filtered = mockProducts.filter(p =>
      p.name.toLowerCase().includes(query) || p.category.toLowerCase().includes(query)
    );
    return HttpResponse.json({
      products: filtered,
      total: filtered.length,
      page: 1,
      totalPages: 1,
    });
  }),

  http.get('*/products/:sku', ({ params }) => {
    const product = mockProducts.find(p => p.sku === params.sku);
    if (!product) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json(product);
  }),

  // Cart
  http.get('*/carts/:id', () => {
    return HttpResponse.json(mockCart);
  }),

  http.post('*/carts/:id/products', async ({ request }) => {
    const body = await request.json() as { sku: string; quantity: number };
    const product = mockProducts.find(p => p.sku === body.sku);
    if (!product) return new HttpResponse(null, { status: 404 });

    mockCart.items.push({
      sku: product.sku,
      name: product.name,
      price: product.price,
      quantity: body.quantity,
      imageUrl: product.imageUrl,
    });
    mockCart.subtotal = mockCart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    mockCart.total = mockCart.subtotal * 1.08; // 8% tax

    return HttpResponse.json(mockCart);
  }),

  http.put('*/carts/:id/products/:sku', async ({ params, request }) => {
    const body = await request.json() as { quantity: number };
    const item = mockCart.items.find(i => i.sku === params.sku);
    if (item) item.quantity = body.quantity;
    return HttpResponse.json(mockCart);
  }),

  http.delete('*/carts/:id/products/:sku', ({ params }) => {
    mockCart.items = mockCart.items.filter(i => i.sku !== params.sku);
    return HttpResponse.json(mockCart);
  }),
];
```

### 5.2 Mock Data

**File:** `apps/ecommerce-web/src/mocks/data.ts`

```typescript
import type { Product } from '../features/products/types/product';
import type { Cart } from '../features/cart/types/cart';

export const mockProducts: Product[] = [
  {
    sku: 'SKU-001',
    name: 'Wireless Headphones',
    description: 'Premium noise-canceling headphones',
    price: 299.99,
    imageUrl: '/images/headphones.jpg',
    inStock: true,
    quantity: 50,
    category: 'Electronics',
  },
  {
    sku: 'SKU-002',
    name: 'Smart Watch',
    description: 'Fitness tracking smartwatch',
    price: 199.99,
    imageUrl: '/images/watch.jpg',
    inStock: true,
    quantity: 30,
    category: 'Electronics',
  },
  // Add more products...
];

export const mockCart: Cart = {
  id: 'cart-001',
  items: [],
  subtotal: 0,
  tax: 0,
  total: 0,
};
```

### 5.3 Browser Integration

**File:** `apps/ecommerce-web/src/mocks/browser.ts`

```typescript
import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

export const worker = setupWorker(...handlers);
```

### 5.4 Development Mode

**File:** `apps/ecommerce-web/src/main.tsx`

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Providers } from './app/providers';

async function enableMocking() {
  if (import.meta.env.DEV && import.meta.env.VITE_MSW_ENABLED === 'true') {
    const { worker } = await import('./mocks/browser');
    return worker.start({ onUnhandledRequest: 'bypass' });
  }
}

enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <Providers />
    </StrictMode>
  );
});
```

---

## Phase 6: Playwright E2E (Mocked)

**Prereqs:** Phase 5 complete

### 6.1 Playwright Config

**File:** `apps/ecommerce-web/e2e/playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './specs',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:4200',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: 'nx serve ecommerce-web',
    url: 'http://localhost:4200',
    reuseExistingServer: !process.env.CI,
    env: { VITE_MSW_ENABLED: 'true' },
  },
});
```

### 6.2 E2E Test: Product Journey

**File:** `apps/ecommerce-web/e2e/specs/product-journey.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Product Journey', () => {
  test('user can browse and view product details', async ({ page }) => {
    await page.goto('/');

    // Product list loads
    await expect(page.getByTestId('product-card-SKU-001')).toBeVisible();

    // Click on product
    await page.getByTestId('product-card-SKU-001').click();

    // Product detail page
    await expect(page).toHaveURL('/products/SKU-001');
    await expect(page.getByRole('heading', { name: 'Wireless Headphones' })).toBeVisible();
  });

  test('user can search for products', async ({ page }) => {
    await page.goto('/');

    await page.getByPlaceholder('Search products').fill('watch');
    await page.getByRole('button', { name: 'Search' }).click();

    await expect(page.getByTestId('product-card-SKU-002')).toBeVisible();
    await expect(page.getByTestId('product-card-SKU-001')).not.toBeVisible();
  });
});
```

### 6.3 E2E Test: Cart Journey

**File:** `apps/ecommerce-web/e2e/specs/cart-journey.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Cart Journey', () => {
  test('user can add item to cart and view cart', async ({ page }) => {
    await page.goto('/');

    // Add to cart
    await page.getByTestId('product-card-SKU-001')
      .getByRole('button', { name: /add to cart/i }).click();

    // Cart icon shows count
    await expect(page.getByTestId('cart-count')).toHaveText('1');

    // Navigate to cart
    await page.getByTestId('cart-link').click();
    await expect(page).toHaveURL('/cart');

    // Item in cart
    await expect(page.getByText('Wireless Headphones')).toBeVisible();
    await expect(page.getByText('$299.99')).toBeVisible();
  });

  test('user can update cart quantity', async ({ page }) => {
    // Setup: Add item first
    await page.goto('/');
    await page.getByTestId('product-card-SKU-001')
      .getByRole('button', { name: /add to cart/i }).click();
    await page.getByTestId('cart-link').click();

    // Increase quantity
    await page.getByRole('button', { name: 'Increase quantity' }).click();
    await expect(page.getByTestId('item-quantity')).toHaveValue('2');

    // Total updates
    await expect(page.getByTestId('cart-total')).toContainText('599.98');
  });

  test('user can remove item from cart', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('product-card-SKU-001')
      .getByRole('button', { name: /add to cart/i }).click();
    await page.getByTestId('cart-link').click();

    await page.getByRole('button', { name: 'Remove' }).click();

    await expect(page.getByText('Your cart is empty')).toBeVisible();
  });
});
```

---

## Phase 7: Ladle Stories

**Prereqs:** Phase 4 complete

### 7.1 Ladle Config

**File:** `apps/ecommerce-web/.ladle/config.mjs`

```javascript
export default {
  stories: '../src/**/*.stories.tsx',
  port: 61000,
  viteConfig: '../vite.config.ts',
};
```

### 7.2 Feature Stories

**File:** `apps/ecommerce-web/src/features/products/components/ProductCard.stories.tsx`

```tsx
import type { Story } from '@ladle/react';
import { ProductCard } from './ProductCard';
import { mockProducts } from '../../../mocks/data';

export default { title: 'Features/Products/ProductCard' };

export const Default: Story = () => (
  <ProductCard product={mockProducts[0]} onAddToCart={() => {}} />
);

export const OutOfStock: Story = () => (
  <ProductCard
    product={{ ...mockProducts[0], inStock: false }}
    onAddToCart={() => {}}
  />
);

export const OnSale: Story = () => (
  <ProductCard
    product={{ ...mockProducts[0], originalPrice: 349.99 }}
    onAddToCart={() => {}}
  />
);
```

---

## Files Summary

| Action | File | Purpose |
|--------|------|---------|
| CREATE | `apps/ecommerce-web/` | App scaffold |
| CREATE | `apps/ecommerce-web/src/app/routes.tsx` | TanStack Router config |
| CREATE | `apps/ecommerce-web/src/app/providers.tsx` | Query + Router providers |
| CREATE | `apps/ecommerce-web/src/features/products/` | Product feature |
| CREATE | `apps/ecommerce-web/src/features/cart/` | Cart feature |
| CREATE | `apps/ecommerce-web/src/mocks/` | MSW handlers + data |
| CREATE | `apps/ecommerce-web/e2e/` | Playwright tests |
| CREATE | `libs/shared-data/` | Shared API client |

---

## Checklist

- [ ] Phase 1: ecommerce-web app scaffolded
- [ ] Phase 2: shared-data library with API client
- [ ] Phase 3: Product feature (types, hooks, components, pages)
- [ ] Phase 4: Cart feature (types, hooks, components, pages)
- [ ] Phase 5: MSW handlers for all endpoints
- [ ] Phase 6: Playwright E2E tests passing
- [ ] Phase 7: Ladle stories for all states
- [ ] `nx serve ecommerce-web` works with mocked API
- [ ] `nx e2e ecommerce-web-e2e` passes
