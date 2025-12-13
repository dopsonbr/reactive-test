# 060C: Faro App Integration

> **For Claude:** Use superpowers:executing-plans to implement this plan task-by-task.

**Parent Plan:** [060_FRONTEND_OBSERVABILITY_FARO.md](060_FRONTEND_OBSERVABILITY_FARO.md)

**Prerequisite:** [060B_FARO_SHARED_LIBRARY.md](060B_FARO_SHARED_LIBRARY.md)

**Goal:** Integrate Faro into all 4 frontend apps and instrument key user flows.

---

## Task 1: Add Faro to ecommerce-web

**Files:**
- Modify: `apps/ecommerce-web/src/main.tsx`
- Modify: `apps/ecommerce-web/src/app/providers.tsx`
- Create/Modify: `apps/ecommerce-web/.env.development`

**Step 1: Update main.tsx to initialize Faro**

Add at the TOP of the file, before any React imports:

```typescript
// apps/ecommerce-web/src/main.tsx
import { initFaro } from '@reactive-platform/shared-observability/faro';

// Initialize Faro FIRST to capture early errors
initFaro({
  appName: 'ecommerce-web',
  appVersion: import.meta.env.VITE_APP_VERSION ?? 'dev',
  collectorUrl: import.meta.env.VITE_FARO_COLLECTOR_URL ?? 'http://localhost:12347/collect',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8090',
  enabled: import.meta.env.VITE_FARO_ENABLED !== 'false',
});

// ... rest of existing imports and code
```

**Step 2: Update providers.tsx to use FaroErrorBoundary and FaroRoutes**

Replace existing ErrorBoundary with FaroErrorBoundary:

```typescript
// apps/ecommerce-web/src/app/providers.tsx
import { FaroErrorBoundary, FaroRoutes } from '@reactive-platform/shared-observability/faro';
import { ErrorCard } from '@/shared/components/ErrorCard';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <FaroErrorBoundary
      fallback={(error, resetError) => (
        <div className="container mx-auto p-8">
          <ErrorCard error={error} onRetry={resetError} />
        </div>
      )}
    >
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <FaroRoutes>
            {children}
          </FaroRoutes>
        </BrowserRouter>
      </QueryClientProvider>
    </FaroErrorBoundary>
  );
}
```

**Step 3: Add environment variables**

Create or update `apps/ecommerce-web/.env.development`:

```bash
VITE_FARO_ENABLED=true
VITE_FARO_COLLECTOR_URL=http://localhost:12347/collect
VITE_APP_VERSION=dev
VITE_API_BASE_URL=http://localhost:8090
```

**Step 4: Verify app builds**

Run: `pnpm nx build ecommerce-web`
Expected: Build succeeds

**Step 5: Commit**

```bash
git add apps/ecommerce-web/src/main.tsx apps/ecommerce-web/src/app/providers.tsx apps/ecommerce-web/.env.development
git commit -m "feat(ecommerce-web): integrate Faro observability"
```

---

## Task 2: Add Faro to pos-web

**Files:**
- Modify: `apps/pos-web/src/main.tsx`
- Modify: `apps/pos-web/src/app/providers.tsx` (or equivalent)
- Create/Modify: `apps/pos-web/.env.development`

**Step 1: Update main.tsx**

Add at TOP of file:

```typescript
import { initFaro } from '@reactive-platform/shared-observability/faro';

initFaro({
  appName: 'pos-web',
  appVersion: import.meta.env.VITE_APP_VERSION ?? 'dev',
  collectorUrl: import.meta.env.VITE_FARO_COLLECTOR_URL ?? 'http://localhost:12347/collect',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8090',
  enabled: import.meta.env.VITE_FARO_ENABLED !== 'false',
});
```

**Step 2: Update providers with FaroErrorBoundary and FaroRoutes**

(Same pattern as ecommerce-web)

**Step 3: Add .env.development**

```bash
VITE_FARO_ENABLED=true
VITE_FARO_COLLECTOR_URL=http://localhost:12347/collect
VITE_APP_VERSION=dev
VITE_API_BASE_URL=http://localhost:8090
```

**Step 4: Verify build**

Run: `pnpm nx build pos-web`
Expected: Build succeeds

**Step 5: Commit**

```bash
git add apps/pos-web/
git commit -m "feat(pos-web): integrate Faro observability"
```

---

## Task 3: Add Faro to kiosk-web

**Files:**
- Modify: `apps/kiosk-web/src/main.tsx`
- Modify: `apps/kiosk-web/src/app/providers.tsx` (or equivalent)
- Create/Modify: `apps/kiosk-web/.env.development`

**Step 1: Update main.tsx**

Add at TOP of file:

```typescript
import { initFaro } from '@reactive-platform/shared-observability/faro';

initFaro({
  appName: 'kiosk-web',
  appVersion: import.meta.env.VITE_APP_VERSION ?? 'dev',
  collectorUrl: import.meta.env.VITE_FARO_COLLECTOR_URL ?? 'http://localhost:12347/collect',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8090',
  enabled: import.meta.env.VITE_FARO_ENABLED !== 'false',
});
```

**Step 2: Update providers with FaroErrorBoundary and FaroRoutes**

(Same pattern as ecommerce-web)

**Step 3: Add .env.development**

```bash
VITE_FARO_ENABLED=true
VITE_FARO_COLLECTOR_URL=http://localhost:12347/collect
VITE_APP_VERSION=dev
VITE_API_BASE_URL=http://localhost:8090
```

**Step 4: Verify build**

Run: `pnpm nx build kiosk-web`
Expected: Build succeeds

**Step 5: Commit**

```bash
git add apps/kiosk-web/
git commit -m "feat(kiosk-web): integrate Faro observability"
```

---

## Task 4: Add Faro to merchant-portal

**Files:**
- Modify: `apps/merchant-portal/src/main.tsx`
- Modify: `apps/merchant-portal/src/app/providers.tsx` (or equivalent)
- Create/Modify: `apps/merchant-portal/.env.development`

**Step 1: Update main.tsx**

Add at TOP of file:

```typescript
import { initFaro } from '@reactive-platform/shared-observability/faro';

initFaro({
  appName: 'merchant-portal',
  appVersion: import.meta.env.VITE_APP_VERSION ?? 'dev',
  collectorUrl: import.meta.env.VITE_FARO_COLLECTOR_URL ?? 'http://localhost:12347/collect',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8090',
  enabled: import.meta.env.VITE_FARO_ENABLED !== 'false',
});
```

**Step 2: Update providers with FaroErrorBoundary and FaroRoutes**

(Same pattern as ecommerce-web)

**Step 3: Add .env.development**

```bash
VITE_FARO_ENABLED=true
VITE_FARO_COLLECTOR_URL=http://localhost:12347/collect
VITE_APP_VERSION=dev
VITE_API_BASE_URL=http://localhost:8090
```

**Step 4: Verify build**

Run: `pnpm nx build merchant-portal`
Expected: Build succeeds

**Step 5: Commit**

```bash
git add apps/merchant-portal/
git commit -m "feat(merchant-portal): integrate Faro observability"
```

---

## Task 5: Update Nginx Configs for Docker Builds

**Files:**
- Modify: `docker/nginx-frontend.conf` (or per-app nginx configs)

**Step 1: Add /collect proxy location**

Add to each frontend nginx config:

```nginx
# Proxy Faro collector requests to Alloy
location /collect {
    proxy_pass http://alloy:12347/collect;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

**Step 2: Commit**

```bash
git add docker/nginx-*.conf
git commit -m "chore(docker): add Faro collector proxy to nginx configs"
```

---

## Task 6: Instrument ecommerce-web Cart Flow

**Files:**
- Modify cart-related components to add tracking

**Step 1: Add tracking to add-to-cart**

Find the add-to-cart handler and add:

```typescript
import { trackAction } from '@reactive-platform/shared-observability/faro';

const handleAddToCart = async (product: Product, quantity: number) => {
  trackAction.cartAdd(product.sku, quantity, product.price);
  // ... existing logic
};
```

**Step 2: Add tracking to checkout flow**

```typescript
// On checkout start
trackAction.checkoutStart(cartId, items.length, total);

// On checkout complete
trackAction.checkoutComplete(orderId, total, items.length);

// On checkout failure
trackAction.checkoutFail(cartId, error.message, currentStep);
```

**Step 3: Add tracking to search**

```typescript
// After search results return
trackAction.searchExecute(query, results.length, appliedFilters);

// On result click
trackAction.searchResultClick(query, product.sku, index);
```

**Step 4: Commit**

```bash
git add apps/ecommerce-web/src/features/
git commit -m "feat(ecommerce-web): add user action tracking to cart/checkout/search"
```

---

## Task 7: Instrument pos-web Transaction Flow

**Files:**
- Modify POS transaction components

**Step 1: Add tracking to scan/void/tender flows**

```typescript
import { trackAction } from '@reactive-platform/shared-observability/faro';

// On item scan
trackAction.scanItem(sku, price, 'barcode');

// On item void
trackAction.voidItem(sku, reason);

// On tender start
trackAction.tenderStart(transactionId, total);

// On tender complete
trackAction.tenderComplete(transactionId, paymentMethod, amount);

// On transaction void
trackAction.transactionVoid(transactionId, reason, items.length);
```

**Step 2: Commit**

```bash
git add apps/pos-web/src/features/
git commit -m "feat(pos-web): add user action tracking to transaction flow"
```

---

## Task 8: Instrument merchant-portal CRUD Flows

**Files:**
- Modify merchant product/inventory components

**Step 1: Add tracking to product and inventory operations**

```typescript
import { trackAction } from '@reactive-platform/shared-observability/faro';

// On product create
trackAction.productCreate(sku);

// On product update
trackAction.productUpdate(sku, Object.keys(changedFields));

// On inventory adjust
trackAction.inventoryAdjust(sku, delta, newQuantity);

// On price update
trackAction.priceUpdate(sku, oldPrice, newPrice);
```

**Step 2: Commit**

```bash
git add apps/merchant-portal/src/features/
git commit -m "feat(merchant-portal): add user action tracking to product/inventory flows"
```

---

## Summary

| Task | App | Commit |
|------|-----|--------|
| 1 | ecommerce-web | integrate Faro observability |
| 2 | pos-web | integrate Faro observability |
| 3 | kiosk-web | integrate Faro observability |
| 4 | merchant-portal | integrate Faro observability |
| 5 | nginx | add Faro collector proxy |
| 6 | ecommerce-web | user action tracking |
| 7 | pos-web | user action tracking |
| 8 | merchant-portal | user action tracking |

**Next:** [060D_FARO_DASHBOARDS_CLEANUP.md](060D_FARO_DASHBOARDS_CLEANUP.md)
