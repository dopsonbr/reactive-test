# 023C_STANDARDS_REMEDIATION

**Status: COMPLETE**
**Parent Plan:** [023_FRONTEND_FLOWS_AND_E2E](./023_FRONTEND_FLOWS_AND_E2E.md)

---

## Overview

Address standards compliance violations identified during frontend standards verification of `apps/ecommerce-web`. The verification found 9 violations and 5 warnings across testing, error handling, observability, and Nx conventions.

**Compliance Score Before:** 67% (C-)
**Target Score:** 95%+ (A)

---

## Standards Violation Summary

| Priority | Category | Issue | Severity |
|----------|----------|-------|----------|
| P1-1 | Testing | Missing unit/integration tests | FAIL |
| P1-2 | Testing | Missing Ladle stories for app components | FAIL |
| P1-3 | Testing | Missing accessibility tests | FAIL |
| P1-4 | Error Handling | No React Error Boundaries | FAIL |
| P1-5 | Nx Conventions | Missing project tags | FAIL |
| P2-1 | Code Organization | Barrel export anti-pattern | WARN |
| P2-2 | State Management | Missing gcTime in QueryClient | WARN |
| P2-3 | Observability | No structured logger | WARN |
| P2-4 | Observability | No Web Vitals tracking | WARN |
| P2-5 | Error Handling | No global query error handler | WARN |

---

## Phase 1: Critical Fixes (P1)

### Task 1.1: Add Nx Project Tags

**Files:**
| Action | File |
|--------|------|
| MODIFY | `apps/ecommerce-web/project.json` |

**Implementation:**

```json
{
  "name": "ecommerce-web",
  "tags": ["type:app", "scope:ecommerce", "platform:web"],
  ...
}
```

**Acceptance Criteria:**
- [ ] Project tags added to `project.json`
- [ ] `pnpm nx show project ecommerce-web` displays correct tags

---

### Task 1.2: Implement React Error Boundaries

**Files:**
| Action | File |
|--------|------|
| CREATE | `apps/ecommerce-web/src/shared/components/ErrorBoundary.tsx` |
| CREATE | `apps/ecommerce-web/src/shared/components/ErrorBoundary.test.tsx` |
| MODIFY | `apps/ecommerce-web/src/shared/layouts/RootLayout.tsx` |
| MODIFY | `apps/ecommerce-web/src/features/products/pages/ProductDetailPage.tsx` |
| MODIFY | `apps/ecommerce-web/src/features/cart/pages/CartPage.tsx` |

**Implementation:**

```typescript
// src/shared/components/ErrorBoundary.tsx
import { Component, ReactNode } from 'react';
import { ErrorCard } from './ErrorCard';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.props.onError?.(error, errorInfo);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      return this.props.fallback?.(this.state.error, this.reset) || (
        <ErrorCard
          error={this.state.error}
          onRetry={this.reset}
        />
      );
    }
    return this.props.children;
  }
}
```

**Acceptance Criteria:**
- [ ] ErrorBoundary component created with proper typing
- [ ] RootLayout wraps content in ErrorBoundary
- [ ] Feature pages have local error boundaries
- [ ] Unit test verifies error catching and reset

---

### Task 1.3: Add Unit/Integration Tests

**Files:**
| Action | File |
|--------|------|
| CREATE | `apps/ecommerce-web/src/features/products/components/ProductList.test.tsx` |
| CREATE | `apps/ecommerce-web/src/features/products/components/ProductCard.test.tsx` |
| CREATE | `apps/ecommerce-web/src/features/products/components/ProductDetail.test.tsx` |
| CREATE | `apps/ecommerce-web/src/features/products/api/useProducts.test.ts` |
| CREATE | `apps/ecommerce-web/src/features/cart/components/CartItemRow.test.tsx` |
| CREATE | `apps/ecommerce-web/src/features/cart/components/CartSummary.test.tsx` |
| CREATE | `apps/ecommerce-web/src/features/cart/api/useCart.test.ts` |
| CREATE | `apps/ecommerce-web/src/shared/components/ErrorCard.test.tsx` |
| CREATE | `apps/ecommerce-web/src/shared/components/EmptyState.test.tsx` |
| CREATE | `apps/ecommerce-web/src/test/test-utils.tsx` |

**Test Utilities Setup:**

```typescript
// src/test/test-utils.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createMemoryHistory, createRouter } from '@tanstack/react-router';
import { render, RenderOptions } from '@testing-library/react';
import { ReactElement, ReactNode } from 'react';

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

interface WrapperProps {
  children: ReactNode;
}

export function createWrapper(queryClient?: QueryClient) {
  const client = queryClient ?? createTestQueryClient();
  return function Wrapper({ children }: WrapperProps) {
    return (
      <QueryClientProvider client={client}>
        {children}
      </QueryClientProvider>
    );
  };
}

export function renderWithProviders(
  ui: ReactElement,
  options?: RenderOptions & { queryClient?: QueryClient }
) {
  const { queryClient, ...renderOptions } = options ?? {};
  return render(ui, {
    wrapper: createWrapper(queryClient),
    ...renderOptions,
  });
}
```

**Example Component Test:**

```typescript
// src/features/products/components/ProductCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProductCard } from './ProductCard';

const mockProduct = {
  sku: 'SKU-001',
  name: 'Test Product',
  description: 'A test product',
  price: 99.99,
  imageUrl: 'https://example.com/image.jpg',
  category: 'Electronics',
  inStock: true,
};

describe('ProductCard', () => {
  it('renders product information', () => {
    render(
      <MemoryRouter>
        <ProductCard product={mockProduct} onAddToCart={vi.fn()} />
      </MemoryRouter>
    );

    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('$99.99')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add to cart/i })).toBeEnabled();
  });

  it('disables button when out of stock', () => {
    render(
      <MemoryRouter>
        <ProductCard
          product={{ ...mockProduct, inStock: false }}
          onAddToCart={vi.fn()}
        />
      </MemoryRouter>
    );

    expect(screen.getByRole('button', { name: /out of stock/i })).toBeDisabled();
  });

  it('calls onAddToCart with sku when clicked', () => {
    const onAddToCart = vi.fn();
    render(
      <MemoryRouter>
        <ProductCard product={mockProduct} onAddToCart={onAddToCart} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /add to cart/i }));
    expect(onAddToCart).toHaveBeenCalledWith('SKU-001');
  });
});
```

**Example Hook Test:**

```typescript
// src/features/products/api/useProducts.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { useProducts, useProduct } from './useProducts';
import { createWrapper } from '../../../test/test-utils';

const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('useProducts', () => {
  it('fetches product list successfully', async () => {
    server.use(
      http.get('*/products/search', () => {
        return HttpResponse.json({
          products: [{ sku: 'SKU-001', name: 'Test' }],
          total: 1,
        });
      })
    );

    const { result } = renderHook(() => useProducts({}), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.products).toHaveLength(1);
  });

  it('handles error responses', async () => {
    server.use(
      http.get('*/products/search', () => {
        return HttpResponse.json(
          { message: 'Server error' },
          { status: 500 }
        );
      })
    );

    const { result } = renderHook(() => useProducts({}), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
```

**Acceptance Criteria:**
- [ ] Test utilities created in `src/test/test-utils.tsx`
- [ ] At least 10 unit/integration test files created
- [ ] All tests pass with `pnpm nx test ecommerce-web`
- [ ] Coverage meets minimum threshold (>60% for feature code)

---

### Task 1.4: Add Ladle Stories for App Components

**Files:**
| Action | File |
|--------|------|
| CREATE | `apps/ecommerce-web/src/features/products/components/ProductCard.stories.tsx` |
| CREATE | `apps/ecommerce-web/src/features/products/components/ProductFilters.stories.tsx` |
| CREATE | `apps/ecommerce-web/src/features/cart/components/CartItemRow.stories.tsx` |
| CREATE | `apps/ecommerce-web/src/features/cart/components/CartSummary.stories.tsx` |
| CREATE | `apps/ecommerce-web/src/features/cart/components/EmptyCart.stories.tsx` |
| CREATE | `apps/ecommerce-web/src/shared/components/ErrorCard.stories.tsx` |
| CREATE | `apps/ecommerce-web/src/shared/components/EmptyState.stories.tsx` |

**Example Story:**

```typescript
// src/features/products/components/ProductCard.stories.tsx
import type { Story } from '@ladle/react';
import { BrowserRouter } from 'react-router-dom';
import { ProductCard } from './ProductCard';

const mockProduct = {
  sku: 'SKU-001',
  name: 'Wireless Headphones',
  description: 'High-quality wireless headphones with noise cancellation',
  price: 299.99,
  originalPrice: 349.99,
  imageUrl: 'https://via.placeholder.com/300x200',
  category: 'Electronics',
  inStock: true,
};

export const Default: Story = () => (
  <BrowserRouter>
    <div className="max-w-sm">
      <ProductCard
        product={mockProduct}
        onAddToCart={(sku) => console.log('Add to cart:', sku)}
      />
    </div>
  </BrowserRouter>
);

export const OutOfStock: Story = () => (
  <BrowserRouter>
    <div className="max-w-sm">
      <ProductCard
        product={{ ...mockProduct, inStock: false }}
        onAddToCart={() => {}}
      />
    </div>
  </BrowserRouter>
);

export const NoDiscount: Story = () => (
  <BrowserRouter>
    <div className="max-w-sm">
      <ProductCard
        product={{ ...mockProduct, originalPrice: undefined }}
        onAddToCart={() => {}}
      />
    </div>
  </BrowserRouter>
);

export const AddingToCart: Story = () => (
  <BrowserRouter>
    <div className="max-w-sm">
      <ProductCard
        product={mockProduct}
        onAddToCart={() => {}}
        isAddingToCart
      />
    </div>
  </BrowserRouter>
);
```

**Acceptance Criteria:**
- [ ] Stories created for all presentational components
- [ ] Each component has stories for all key states
- [ ] `pnpm nx ladle ecommerce-web` runs successfully
- [ ] All stories render without errors

---

### Task 1.5: Add Accessibility Tests

**Files:**
| Action | File |
|--------|------|
| MODIFY | `apps/ecommerce-web/package.json` (add jest-axe) |
| CREATE | `apps/ecommerce-web/src/features/products/components/ProductCard.a11y.test.tsx` |
| CREATE | `apps/ecommerce-web/src/features/cart/components/CartItemRow.a11y.test.tsx` |
| CREATE | `apps/ecommerce-web/src/shared/components/ErrorCard.a11y.test.tsx` |
| CREATE | `apps/ecommerce-web/src/shared/components/EmptyState.a11y.test.tsx` |

**Setup:**

```bash
pnpm add -D jest-axe @types/jest-axe --filter ecommerce-web
```

**Example A11y Test:**

```typescript
// src/features/products/components/ProductCard.a11y.test.tsx
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { MemoryRouter } from 'react-router-dom';
import { ProductCard } from './ProductCard';

expect.extend(toHaveNoViolations);

const mockProduct = {
  sku: 'SKU-001',
  name: 'Test Product',
  description: 'A test product',
  price: 99.99,
  imageUrl: 'https://example.com/image.jpg',
  category: 'Electronics',
  inStock: true,
};

describe('ProductCard Accessibility', () => {
  it('has no accessibility violations', async () => {
    const { container } = render(
      <MemoryRouter>
        <ProductCard product={mockProduct} onAddToCart={vi.fn()} />
      </MemoryRouter>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('has no violations when out of stock', async () => {
    const { container } = render(
      <MemoryRouter>
        <ProductCard
          product={{ ...mockProduct, inStock: false }}
          onAddToCart={vi.fn()}
        />
      </MemoryRouter>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

**Acceptance Criteria:**
- [ ] jest-axe installed and configured
- [ ] A11y tests created for key components
- [ ] All a11y tests pass
- [ ] No WCAG 2.1 AA violations

---

## Phase 2: High Priority Fixes (P2)

### Task 2.1: Fix Barrel Export Anti-Pattern

**Files:**
| Action | File |
|--------|------|
| MODIFY | `apps/ecommerce-web/src/features/products/index.ts` |
| MODIFY | `apps/ecommerce-web/src/features/cart/index.ts` |

**Implementation:**

```typescript
// features/products/index.ts - BEFORE
export * from './api';
export * from './components';
export * from './pages';
export * from './types';

// features/products/index.ts - AFTER
// Only export what external consumers need
export { ProductListPage, ProductDetailPage } from './pages';
export { useProducts, useProduct } from './api';
export type { Product, ProductSearchParams, ProductSearchResult } from './types';
```

**Acceptance Criteria:**
- [ ] `export *` replaced with explicit named exports
- [ ] Only necessary exports exposed
- [ ] Application still builds and runs

---

### Task 2.2: Add gcTime to QueryClient Config

**Files:**
| Action | File |
|--------|------|
| MODIFY | `apps/ecommerce-web/src/app/providers.tsx` |

**Implementation:**

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,  // 5 minutes
      gcTime: 1000 * 60 * 10,    // 10 minutes (garbage collection)
      retry: 3,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});
```

**Acceptance Criteria:**
- [ ] gcTime added to QueryClient config
- [ ] Mutations retry config added
- [ ] Application functions correctly

---

### Task 2.3: Create Structured Logger Utility

**Files:**
| Action | File |
|--------|------|
| CREATE | `apps/ecommerce-web/src/shared/utils/logger.ts` |
| CREATE | `apps/ecommerce-web/src/shared/utils/logger.test.ts` |
| MODIFY | `apps/ecommerce-web/src/main.tsx` |

**Implementation:**

```typescript
// src/shared/utils/logger.ts
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  url?: string;
  sessionId?: string;
}

class Logger {
  private context: Record<string, unknown> = {};

  setContext(ctx: Record<string, unknown>) {
    this.context = { ...this.context, ...ctx };
  }

  clearContext() {
    this.context = {};
  }

  private log(level: LogLevel, message: string, data?: Record<string, unknown>) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: { ...this.context, ...data },
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      sessionId: this.context.sessionId as string | undefined,
    };

    if (import.meta.env.DEV) {
      const consoleMethod = level === 'debug' ? 'log' : level;
      console[consoleMethod](`[${level.toUpperCase()}]`, message, entry.context);
    }

    // In production, could send to logging endpoint
    // this.sendToEndpoint(entry);
  }

  debug(message: string, data?: Record<string, unknown>) {
    this.log('debug', message, data);
  }

  info(message: string, data?: Record<string, unknown>) {
    this.log('info', message, data);
  }

  warn(message: string, data?: Record<string, unknown>) {
    this.log('warn', message, data);
  }

  error(message: string, error?: Error, data?: Record<string, unknown>) {
    this.log('error', message, {
      ...data,
      errorName: error?.name,
      errorMessage: error?.message,
      stack: error?.stack,
    });
  }
}

export const logger = new Logger();
```

**Acceptance Criteria:**
- [ ] Logger utility created with typed interface
- [ ] Logger initialized in main.tsx with session context
- [ ] Unit tests verify logging behavior
- [ ] Dev mode logs to console

---

### Task 2.4: Add Web Vitals Tracking

**Files:**
| Action | File |
|--------|------|
| MODIFY | `apps/ecommerce-web/package.json` (add web-vitals) |
| CREATE | `apps/ecommerce-web/src/shared/utils/vitals.ts` |
| MODIFY | `apps/ecommerce-web/src/main.tsx` |

**Setup:**

```bash
pnpm add web-vitals --filter ecommerce-web
```

**Implementation:**

```typescript
// src/shared/utils/vitals.ts
import { onCLS, onINP, onLCP, onTTFB, onFCP, Metric } from 'web-vitals';
import { logger } from './logger';

function sendToAnalytics(metric: Metric) {
  logger.info('web-vital', {
    metric: metric.name,
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta,
    id: metric.id,
  });
}

export function initWebVitals() {
  onCLS(sendToAnalytics);
  onINP(sendToAnalytics);
  onLCP(sendToAnalytics);
  onTTFB(sendToAnalytics);
  onFCP(sendToAnalytics);
}
```

```typescript
// src/main.tsx (add to initialization)
import { initWebVitals } from './shared/utils/vitals';

// After app renders
initWebVitals();
```

**Acceptance Criteria:**
- [ ] web-vitals package installed
- [ ] Vitals utility created
- [ ] Vitals initialized on app load
- [ ] Metrics logged in dev mode

---

### Task 2.5: Add Global Query Error Handler

**Files:**
| Action | File |
|--------|------|
| MODIFY | `apps/ecommerce-web/src/app/providers.tsx` |

**Implementation:**

```typescript
import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import { ApiError } from '@reactive-platform/api-client';
import { logger } from '../shared/utils/logger';

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      // Log all query errors
      logger.error('Query failed', error instanceof Error ? error : new Error(String(error)), {
        queryKey: query.queryKey,
      });

      // Handle auth errors globally
      if (error instanceof ApiError && error.status === 401) {
        // Could redirect to login or trigger token refresh
        logger.info('Unauthorized - would redirect to login');
      }
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, variables, context, mutation) => {
      logger.error('Mutation failed', error instanceof Error ? error : new Error(String(error)), {
        mutationKey: mutation.options.mutationKey,
      });
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
      retry: 3,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});
```

**Acceptance Criteria:**
- [ ] QueryCache onError handler added
- [ ] MutationCache onError handler added
- [ ] Errors logged with context
- [ ] Auth errors handled appropriately

---

## Files Summary

| Action | File | Task |
|--------|------|------|
| MODIFY | `apps/ecommerce-web/project.json` | 1.1 |
| CREATE | `apps/ecommerce-web/src/shared/components/ErrorBoundary.tsx` | 1.2 |
| CREATE | `apps/ecommerce-web/src/shared/components/ErrorBoundary.test.tsx` | 1.2 |
| MODIFY | `apps/ecommerce-web/src/shared/layouts/RootLayout.tsx` | 1.2 |
| CREATE | `apps/ecommerce-web/src/test/test-utils.tsx` | 1.3 |
| CREATE | `apps/ecommerce-web/src/features/products/components/ProductCard.test.tsx` | 1.3 |
| CREATE | `apps/ecommerce-web/src/features/products/components/ProductList.test.tsx` | 1.3 |
| CREATE | `apps/ecommerce-web/src/features/products/components/ProductDetail.test.tsx` | 1.3 |
| CREATE | `apps/ecommerce-web/src/features/products/api/useProducts.test.ts` | 1.3 |
| CREATE | `apps/ecommerce-web/src/features/cart/components/CartItemRow.test.tsx` | 1.3 |
| CREATE | `apps/ecommerce-web/src/features/cart/components/CartSummary.test.tsx` | 1.3 |
| CREATE | `apps/ecommerce-web/src/features/cart/api/useCart.test.ts` | 1.3 |
| CREATE | `apps/ecommerce-web/src/shared/components/ErrorCard.test.tsx` | 1.3 |
| CREATE | `apps/ecommerce-web/src/shared/components/EmptyState.test.tsx` | 1.3 |
| CREATE | `apps/ecommerce-web/src/features/products/components/ProductCard.stories.tsx` | 1.4 |
| CREATE | `apps/ecommerce-web/src/features/products/components/ProductFilters.stories.tsx` | 1.4 |
| CREATE | `apps/ecommerce-web/src/features/cart/components/CartItemRow.stories.tsx` | 1.4 |
| CREATE | `apps/ecommerce-web/src/features/cart/components/CartSummary.stories.tsx` | 1.4 |
| CREATE | `apps/ecommerce-web/src/features/cart/components/EmptyCart.stories.tsx` | 1.4 |
| CREATE | `apps/ecommerce-web/src/shared/components/ErrorCard.stories.tsx` | 1.4 |
| CREATE | `apps/ecommerce-web/src/shared/components/EmptyState.stories.tsx` | 1.4 |
| CREATE | `apps/ecommerce-web/src/features/products/components/ProductCard.a11y.test.tsx` | 1.5 |
| CREATE | `apps/ecommerce-web/src/features/cart/components/CartItemRow.a11y.test.tsx` | 1.5 |
| CREATE | `apps/ecommerce-web/src/shared/components/ErrorCard.a11y.test.tsx` | 1.5 |
| CREATE | `apps/ecommerce-web/src/shared/components/EmptyState.a11y.test.tsx` | 1.5 |
| MODIFY | `apps/ecommerce-web/src/features/products/index.ts` | 2.1 |
| MODIFY | `apps/ecommerce-web/src/features/cart/index.ts` | 2.1 |
| MODIFY | `apps/ecommerce-web/src/app/providers.tsx` | 2.2, 2.5 |
| CREATE | `apps/ecommerce-web/src/shared/utils/logger.ts` | 2.3 |
| CREATE | `apps/ecommerce-web/src/shared/utils/logger.test.ts` | 2.3 |
| CREATE | `apps/ecommerce-web/src/shared/utils/vitals.ts` | 2.4 |
| MODIFY | `apps/ecommerce-web/src/main.tsx` | 2.3, 2.4 |

---

## Execution Order

```
Phase 1 (Critical - P1)
├── 1.1 Add Nx project tags (quick win)
├── 1.2 Implement Error Boundaries
├── 1.3 Add unit/integration tests (largest effort)
├── 1.4 Add Ladle stories
└── 1.5 Add accessibility tests

Phase 2 (High Priority - P2)
├── 2.1 Fix barrel exports
├── 2.2 Add gcTime config
├── 2.3 Create structured logger
├── 2.4 Add Web Vitals tracking
└── 2.5 Add global query error handler
```

**Dependencies:**
- 2.3 (logger) should complete before 2.4 (vitals) and 2.5 (error handler)
- 1.3 (tests) can run in parallel with 1.4 (stories)

---

## Acceptance Criteria

### Phase 1 Complete When:
- [ ] Project has proper Nx tags
- [ ] ErrorBoundary wraps application and feature routes
- [ ] At least 10 unit/integration test files exist
- [ ] All tests pass (`pnpm nx test ecommerce-web`)
- [ ] Stories exist for all presentational components
- [ ] A11y tests pass for key components

### Phase 2 Complete When:
- [ ] No `export *` in feature index files
- [ ] QueryClient has gcTime and mutation retry config
- [ ] Structured logger created and initialized
- [ ] Web Vitals tracking enabled
- [ ] Global error handlers log errors with context

### Final Verification:
- [ ] Re-run `/verify-frontend-standards ecommerce-web`
- [ ] Compliance score >= 95%
- [ ] All P1 violations resolved
- [ ] All P2 warnings resolved

---

## Estimated Effort

| Phase | Tasks | Estimated Files | Complexity |
|-------|-------|-----------------|------------|
| Phase 1 | 5 | ~25 | High |
| Phase 2 | 5 | ~8 | Medium |
| **Total** | **10** | **~33** | - |
