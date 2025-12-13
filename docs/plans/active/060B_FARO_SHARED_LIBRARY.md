# 060B: Faro Shared Library

> **For Claude:** Use superpowers:executing-plans to implement this plan task-by-task.

**Parent Plan:** [060_FRONTEND_OBSERVABILITY_FARO.md](060_FRONTEND_OBSERVABILITY_FARO.md)

**Prerequisite:** [060A_FARO_INFRASTRUCTURE.md](060A_FARO_INFRASTRUCTURE.md)

**Goal:** Create a shared Faro library with initialization, logging, and user action tracking that all frontend apps can use.

---

## Task 1: Generate Library Scaffold

**Step 1: Generate the library using Nx**

Run:
```bash
pnpm nx g @nx/js:library faro \
  --directory=libs/frontend/shared-observability/faro \
  --importPath=@reactive-platform/shared-observability/faro \
  --bundler=vite \
  --unitTestRunner=vitest \
  --projectNameAndRootFormat=as-provided
```
Expected: Library created with standard structure

**Step 2: Commit scaffold**

```bash
git add libs/frontend/shared-observability/
git commit -m "chore: scaffold shared-observability/faro library"
```

---

## Task 2: Add Faro Dependencies

**Files:**
- Modify: `libs/frontend/shared-observability/faro/package.json`

**Step 1: Add Faro packages to the library**

Run:
```bash
pnpm add @grafana/faro-react @grafana/faro-web-sdk @grafana/faro-web-tracing --filter @reactive-platform/shared-observability/faro
```
Expected: Packages added to package.json

**Step 2: Verify installation**

Run: `cat libs/frontend/shared-observability/faro/package.json | grep faro`
Expected: Shows @grafana/faro-* dependencies

**Step 3: Commit**

```bash
git add libs/frontend/shared-observability/faro/package.json pnpm-lock.yaml
git commit -m "chore(faro): add @grafana/faro-* dependencies"
```

---

## Task 3: Create Configuration Types

**Files:**
- Create: `libs/frontend/shared-observability/faro/src/lib/config.ts`

**Step 1: Write the config types**

```typescript
// libs/frontend/shared-observability/faro/src/lib/config.ts

export interface FaroConfig {
  /** Application name shown in Grafana (e.g., 'ecommerce-web') */
  appName: string;

  /** Application version, typically from VITE_APP_VERSION or git SHA */
  appVersion: string;

  /** Faro collector URL (e.g., 'http://localhost:12347/collect') */
  collectorUrl: string;

  /** Base URL for API calls - used for trace propagation CORS */
  apiBaseUrl: string | string[];

  /** Set to false to disable Faro (useful for tests) */
  enabled?: boolean;

  /** Additional session attributes */
  sessionAttributes?: Record<string, string>;
}

export const defaultConfig: Partial<FaroConfig> = {
  enabled: true,
};
```

**Step 2: Commit**

```bash
git add libs/frontend/shared-observability/faro/src/lib/config.ts
git commit -m "feat(faro): add FaroConfig types"
```

---

## Task 4: Write initFaro Tests

**Files:**
- Create: `libs/frontend/shared-observability/faro/src/lib/initFaro.spec.ts`

**Step 1: Write the failing tests**

```typescript
// libs/frontend/shared-observability/faro/src/lib/initFaro.spec.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { FaroConfig } from './config';

// Mock @grafana/faro-react before importing initFaro
const mockInitializeFaro = vi.fn();
const mockGetWebInstrumentations = vi.fn(() => []);

vi.mock('@grafana/faro-react', () => ({
  initializeFaro: mockInitializeFaro,
  getWebInstrumentations: mockGetWebInstrumentations,
}));

vi.mock('@grafana/faro-web-tracing', () => ({
  TracingInstrumentation: vi.fn().mockImplementation(() => ({})),
}));

describe('initFaro', () => {
  const validConfig: FaroConfig = {
    appName: 'test-app',
    appVersion: '1.0.0',
    collectorUrl: 'http://localhost:12347/collect',
    apiBaseUrl: 'http://localhost:8090',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockInitializeFaro.mockReturnValue({ api: {} });
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('should call initializeFaro with correct app config', async () => {
    const { initFaro } = await import('./initFaro');

    initFaro(validConfig);

    expect(mockInitializeFaro).toHaveBeenCalledTimes(1);
    expect(mockInitializeFaro).toHaveBeenCalledWith(
      expect.objectContaining({
        url: validConfig.collectorUrl,
        app: expect.objectContaining({
          name: validConfig.appName,
          version: validConfig.appVersion,
        }),
      })
    );
  });

  it('should not initialize when enabled is false', async () => {
    const { initFaro } = await import('./initFaro');

    const result = initFaro({ ...validConfig, enabled: false });

    expect(result).toBeNull();
    expect(mockInitializeFaro).not.toHaveBeenCalled();
  });

  it('should enable session tracking', async () => {
    const { initFaro } = await import('./initFaro');

    initFaro(validConfig);

    expect(mockInitializeFaro).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionTracking: expect.objectContaining({ enabled: true }),
      })
    );
  });

  it('should include tracing instrumentation', async () => {
    const { initFaro } = await import('./initFaro');

    initFaro(validConfig);

    expect(mockInitializeFaro).toHaveBeenCalledWith(
      expect.objectContaining({
        instrumentations: expect.arrayContaining([expect.any(Object)]),
      })
    );
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `pnpm nx test faro --testFile=initFaro.spec.ts`
Expected: FAIL - Cannot find module './initFaro'

**Step 3: Commit failing tests**

```bash
git add libs/frontend/shared-observability/faro/src/lib/initFaro.spec.ts
git commit -m "test(faro): add initFaro unit tests (red)"
```

---

## Task 5: Implement initFaro

**Files:**
- Create: `libs/frontend/shared-observability/faro/src/lib/initFaro.ts`

**Step 1: Write the implementation**

```typescript
// libs/frontend/shared-observability/faro/src/lib/initFaro.ts
import { initializeFaro, getWebInstrumentations } from '@grafana/faro-react';
import { TracingInstrumentation } from '@grafana/faro-web-tracing';
import type { Faro } from '@grafana/faro-react';
import type { FaroConfig } from './config';
import { defaultConfig } from './config';

/**
 * Initialize Grafana Faro for frontend observability.
 *
 * Call this in your app's entry point (main.tsx) BEFORE React renders
 * to capture early errors.
 *
 * @example
 * ```typescript
 * const faro = initFaro({
 *   appName: 'ecommerce-web',
 *   appVersion: import.meta.env.VITE_APP_VERSION ?? 'dev',
 *   collectorUrl: import.meta.env.VITE_FARO_COLLECTOR_URL,
 *   apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
 * });
 * ```
 */
export function initFaro(config: FaroConfig): Faro | null {
  const mergedConfig = { ...defaultConfig, ...config };

  if (mergedConfig.enabled === false) {
    return null;
  }

  const apiUrls = Array.isArray(mergedConfig.apiBaseUrl)
    ? mergedConfig.apiBaseUrl
    : [mergedConfig.apiBaseUrl];

  const corsUrlPatterns = apiUrls.map((url) => new RegExp(url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));

  return initializeFaro({
    url: mergedConfig.collectorUrl,

    app: {
      name: mergedConfig.appName,
      version: mergedConfig.appVersion,
      environment: typeof import.meta !== 'undefined'
        ? (import.meta as { env?: { MODE?: string } }).env?.MODE ?? 'production'
        : 'production',
    },

    instrumentations: [
      ...getWebInstrumentations({
        captureConsole: true,
        captureConsoleDisabledLevels: ['debug', 'trace'],
      }),
      new TracingInstrumentation({
        instrumentationOptions: {
          propagateTraceHeaderCorsUrls: corsUrlPatterns,
        },
      }),
    ],

    sessionTracking: {
      enabled: true,
      persistent: true,
    },
  });
}
```

**Step 2: Run tests to verify they pass**

Run: `pnpm nx test faro --testFile=initFaro.spec.ts`
Expected: All tests PASS

**Step 3: Commit**

```bash
git add libs/frontend/shared-observability/faro/src/lib/initFaro.ts
git commit -m "feat(faro): implement initFaro initialization (green)"
```

---

## Task 6: Write Logger Tests

**Files:**
- Create: `libs/frontend/shared-observability/faro/src/lib/logger.spec.ts`

**Step 1: Write the failing tests**

```typescript
// libs/frontend/shared-observability/faro/src/lib/logger.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockPushLog = vi.fn();
const mockPushError = vi.fn();
const mockSetSession = vi.fn();

vi.mock('@grafana/faro-react', () => ({
  faro: {
    api: {
      pushLog: mockPushLog,
      pushError: mockPushError,
      setSession: mockSetSession,
    },
  },
  LogLevel: {
    INFO: 'info',
    WARN: 'warn',
    ERROR: 'error',
    DEBUG: 'debug',
  },
}));

describe('FaroLogger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('info', () => {
    it('should push info log to Faro', async () => {
      const { logger } = await import('./logger');

      logger.info('Test message', { key: 'value' });

      expect(mockPushLog).toHaveBeenCalledWith(
        ['Test message'],
        expect.objectContaining({
          level: 'info',
          context: expect.objectContaining({ key: 'value' }),
        })
      );
    });
  });

  describe('warn', () => {
    it('should push warn log to Faro', async () => {
      const { logger } = await import('./logger');

      logger.warn('Warning message');

      expect(mockPushLog).toHaveBeenCalledWith(
        ['Warning message'],
        expect.objectContaining({ level: 'warn' })
      );
    });
  });

  describe('error', () => {
    it('should push error with Error object to Faro', async () => {
      const { logger } = await import('./logger');
      const testError = new Error('Test error');

      logger.error('Error occurred', testError, { userId: '123' });

      expect(mockPushError).toHaveBeenCalledWith(
        testError,
        expect.objectContaining({
          context: expect.objectContaining({
            message: 'Error occurred',
            userId: '123',
          }),
        })
      );
    });

    it('should push error log when no Error object provided', async () => {
      const { logger } = await import('./logger');

      logger.error('Error message without exception');

      expect(mockPushLog).toHaveBeenCalledWith(
        ['Error message without exception'],
        expect.objectContaining({ level: 'error' })
      );
    });
  });

  describe('setContext', () => {
    it('should set session attributes in Faro', async () => {
      const { logger } = await import('./logger');

      logger.setContext({ userId: 'user-123', storeId: 'store-456' });

      expect(mockSetSession).toHaveBeenCalledWith(
        expect.objectContaining({
          attributes: expect.objectContaining({
            userId: 'user-123',
            storeId: 'store-456',
          }),
        })
      );
    });

    it('should merge context with subsequent calls', async () => {
      const { logger } = await import('./logger');

      logger.setContext({ userId: 'user-123' });
      logger.setContext({ cartId: 'cart-789' });

      logger.info('Test');

      expect(mockPushLog).toHaveBeenCalledWith(
        ['Test'],
        expect.objectContaining({
          context: expect.objectContaining({
            userId: 'user-123',
            cartId: 'cart-789',
          }),
        })
      );
    });
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `pnpm nx test faro --testFile=logger.spec.ts`
Expected: FAIL - Cannot find module './logger'

**Step 3: Commit failing tests**

```bash
git add libs/frontend/shared-observability/faro/src/lib/logger.spec.ts
git commit -m "test(faro): add logger unit tests (red)"
```

---

## Task 7: Implement Logger

**Files:**
- Create: `libs/frontend/shared-observability/faro/src/lib/logger.ts`

**Step 1: Write the implementation**

```typescript
// libs/frontend/shared-observability/faro/src/lib/logger.ts
import { faro, LogLevel } from '@grafana/faro-react';

/**
 * Faro-backed structured logger.
 *
 * Sends logs to Grafana Loki via Faro collector.
 * In development, also logs to console.
 *
 * @example
 * ```typescript
 * logger.setContext({ userId: 'user-123', cartId: 'cart-456' });
 * logger.info('Item added to cart', { sku: 'SKU-001', quantity: 2 });
 * logger.error('Checkout failed', error, { cartId: 'cart-456' });
 * ```
 */
class FaroLogger {
  private context: Record<string, unknown> = {};

  /**
   * Set persistent context that will be included in all subsequent logs.
   * Context is merged with each call, so you can add context incrementally.
   */
  setContext(ctx: Record<string, unknown>): void {
    this.context = { ...this.context, ...ctx };
    if (faro.api) {
      faro.api.setSession({ attributes: this.context });
    }
  }

  /**
   * Clear all context.
   */
  clearContext(): void {
    this.context = {};
  }

  /**
   * Log an info-level message.
   */
  info(message: string, data?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, data);
  }

  /**
   * Log a warning-level message.
   */
  warn(message: string, data?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, data);
  }

  /**
   * Log an error. If an Error object is provided, it will be sent as an exception
   * with full stack trace. Otherwise, logged as an error-level message.
   */
  error(message: string, error?: Error, data?: Record<string, unknown>): void {
    const context = { ...this.context, ...data };

    if (error && faro.api) {
      faro.api.pushError(error, { context: { message, ...context } });
    } else {
      this.log(LogLevel.ERROR, message, data);
    }

    // Always log to console in dev
    if (this.isDev()) {
      console.error(`[ERROR] ${message}`, error, context);
    }
  }

  /**
   * Log a debug-level message. Only logged to console in development.
   */
  debug(message: string, data?: Record<string, unknown>): void {
    if (this.isDev()) {
      console.debug(`[DEBUG] ${message}`, { ...this.context, ...data });
    }
  }

  private log(level: LogLevel, message: string, data?: Record<string, unknown>): void {
    const context = { ...this.context, ...data };

    if (faro.api) {
      faro.api.pushLog([message], { level, context });
    }

    // Log to console in development
    if (this.isDev()) {
      const consoleMethod = level === LogLevel.ERROR
        ? 'error'
        : level === LogLevel.WARN
          ? 'warn'
          : 'log';
      console[consoleMethod](`[${level.toUpperCase()}] ${message}`, context);
    }
  }

  private isDev(): boolean {
    return typeof import.meta !== 'undefined' &&
      (import.meta as { env?: { DEV?: boolean } }).env?.DEV === true;
  }
}

export const logger = new FaroLogger();
```

**Step 2: Run tests to verify they pass**

Run: `pnpm nx test faro --testFile=logger.spec.ts`
Expected: All tests PASS

**Step 3: Commit**

```bash
git add libs/frontend/shared-observability/faro/src/lib/logger.ts
git commit -m "feat(faro): implement FaroLogger (green)"
```

---

## Task 8: Implement User Action Tracking

**Files:**
- Create: `libs/frontend/shared-observability/faro/src/lib/userActions.ts`

**Step 1: Write the user actions module**

```typescript
// libs/frontend/shared-observability/faro/src/lib/userActions.ts
import { faro } from '@grafana/faro-react';

/**
 * Pre-defined user action tracking for key business flows.
 *
 * Use these to instrument critical user journeys. Events appear in
 * Grafana Loki and can be used for funnel analysis.
 *
 * @example
 * ```typescript
 * trackAction.cartAdd('SKU-001', 2);
 * trackAction.checkoutStart('cart-123', 3);
 * trackAction.loginSuccess('user-456');
 * ```
 */
export const trackAction = {
  // =========================================================================
  // E-commerce / Cart Actions
  // =========================================================================

  /** Track item added to cart */
  cartAdd: (sku: string, quantity: number, price?: number) =>
    faro.api?.pushEvent('cart:add', { sku, quantity, price }),

  /** Track item removed from cart */
  cartRemove: (sku: string, quantity?: number) =>
    faro.api?.pushEvent('cart:remove', { sku, quantity }),

  /** Track cart view */
  cartView: (cartId: string, itemCount: number, total: number) =>
    faro.api?.pushEvent('cart:view', { cartId, itemCount, total }),

  // =========================================================================
  // Checkout Actions
  // =========================================================================

  /** Track checkout process started */
  checkoutStart: (cartId: string, itemCount: number, total?: number) =>
    faro.api?.pushEvent('checkout:start', { cartId, itemCount, total }),

  /** Track checkout step completed (e.g., shipping, payment) */
  checkoutStep: (step: string, cartId: string) =>
    faro.api?.pushEvent('checkout:step', { step, cartId }),

  /** Track checkout completed successfully */
  checkoutComplete: (orderId: string, total: number, itemCount: number) =>
    faro.api?.pushEvent('checkout:complete', { orderId, total, itemCount }),

  /** Track checkout abandoned or failed */
  checkoutFail: (cartId: string, reason: string, step?: string) =>
    faro.api?.pushEvent('checkout:fail', { cartId, reason, step }),

  // =========================================================================
  // Search Actions
  // =========================================================================

  /** Track search executed */
  searchExecute: (query: string, resultCount: number, filters?: Record<string, unknown>) =>
    faro.api?.pushEvent('search:execute', { query, resultCount, filters }),

  /** Track search result clicked */
  searchResultClick: (query: string, sku: string, position: number) =>
    faro.api?.pushEvent('search:result-click', { query, sku, position }),

  // =========================================================================
  // Auth Actions
  // =========================================================================

  /** Track successful login - also sets user in Faro */
  loginSuccess: (userId: string, method?: string) => {
    faro.api?.setUser({ id: userId });
    faro.api?.pushEvent('auth:login', { userId, method });
  },

  /** Track failed login attempt */
  loginFail: (reason: string) =>
    faro.api?.pushEvent('auth:login-fail', { reason }),

  /** Track logout - also clears user in Faro */
  logout: () => {
    faro.api?.resetUser();
    faro.api?.pushEvent('auth:logout', {});
  },

  // =========================================================================
  // POS Actions
  // =========================================================================

  /** Track item scanned at POS */
  scanItem: (sku: string, price: number, method?: 'barcode' | 'manual') =>
    faro.api?.pushEvent('pos:scan', { sku, price, method }),

  /** Track item voided */
  voidItem: (sku: string, reason?: string) =>
    faro.api?.pushEvent('pos:void-item', { sku, reason }),

  /** Track tender/payment started */
  tenderStart: (transactionId: string, total: number) =>
    faro.api?.pushEvent('pos:tender-start', { transactionId, total }),

  /** Track tender/payment completed */
  tenderComplete: (transactionId: string, paymentMethod: string, amount: number) =>
    faro.api?.pushEvent('pos:tender-complete', { transactionId, paymentMethod, amount }),

  /** Track entire transaction voided */
  transactionVoid: (transactionId: string, reason: string, itemCount: number) =>
    faro.api?.pushEvent('pos:transaction-void', { transactionId, reason, itemCount }),

  // =========================================================================
  // Merchant Portal Actions
  // =========================================================================

  /** Track product created */
  productCreate: (sku: string) =>
    faro.api?.pushEvent('merchant:product-create', { sku }),

  /** Track product updated */
  productUpdate: (sku: string, fields: string[]) =>
    faro.api?.pushEvent('merchant:product-update', { sku, fields }),

  /** Track inventory adjusted */
  inventoryAdjust: (sku: string, delta: number, newQuantity: number) =>
    faro.api?.pushEvent('merchant:inventory-adjust', { sku, delta, newQuantity }),

  /** Track price changed */
  priceUpdate: (sku: string, oldPrice: number, newPrice: number) =>
    faro.api?.pushEvent('merchant:price-update', { sku, oldPrice, newPrice }),

  // =========================================================================
  // Generic Actions
  // =========================================================================

  /** Track a custom action */
  custom: (name: string, attributes?: Record<string, unknown>) =>
    faro.api?.pushEvent(name, attributes ?? {}),
};
```

**Step 2: Commit**

```bash
git add libs/frontend/shared-observability/faro/src/lib/userActions.ts
git commit -m "feat(faro): add user action tracking helpers"
```

---

## Task 9: Create Public Exports

**Files:**
- Modify: `libs/frontend/shared-observability/faro/src/index.ts`

**Step 1: Update the index file with all exports**

```typescript
// libs/frontend/shared-observability/faro/src/index.ts

// Core initialization
export { initFaro } from './lib/initFaro';
export type { FaroConfig } from './lib/config';

// Logger
export { logger } from './lib/logger';

// User action tracking
export { trackAction } from './lib/userActions';

// Re-export commonly used Faro types and components
export {
  faro,
  FaroErrorBoundary,
  FaroRoutes,
  withFaroProfiler,
  setUser,
  resetUser,
} from '@grafana/faro-react';

export type { Faro } from '@grafana/faro-react';
```

**Step 2: Run full library tests**

Run: `pnpm nx test faro`
Expected: All tests PASS

**Step 3: Build the library**

Run: `pnpm nx build faro`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add libs/frontend/shared-observability/faro/src/index.ts
git commit -m "feat(faro): add public exports"
```

---

## Task 10: Add Library Documentation

**Files:**
- Create: `libs/frontend/shared-observability/faro/README.md`
- Create: `libs/frontend/shared-observability/faro/AGENTS.md`

**Step 1: Write README**

```markdown
# @reactive-platform/shared-observability/faro

Shared Grafana Faro integration for frontend observability.

## Quick Start

```typescript
// main.tsx - Initialize BEFORE React renders
import { initFaro } from '@reactive-platform/shared-observability/faro';

initFaro({
  appName: 'ecommerce-web',
  appVersion: import.meta.env.VITE_APP_VERSION ?? 'dev',
  collectorUrl: import.meta.env.VITE_FARO_COLLECTOR_URL ?? 'http://localhost:12347/collect',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8090',
  enabled: import.meta.env.VITE_FARO_ENABLED !== 'false',
});
```

```typescript
// providers.tsx - Wrap app with error boundary and route tracking
import { FaroErrorBoundary, FaroRoutes } from '@reactive-platform/shared-observability/faro';

<FaroErrorBoundary>
  <BrowserRouter>
    <FaroRoutes>{children}</FaroRoutes>
  </BrowserRouter>
</FaroErrorBoundary>
```

## Logger

```typescript
import { logger } from '@reactive-platform/shared-observability/faro';

logger.setContext({ userId: 'user-123', cartId: 'cart-456' });
logger.info('Item added to cart', { sku: 'SKU-001' });
logger.error('Checkout failed', error);
```

## User Action Tracking

```typescript
import { trackAction } from '@reactive-platform/shared-observability/faro';

trackAction.cartAdd('SKU-001', 2);
trackAction.checkoutStart('cart-123', 3);
trackAction.loginSuccess('user-456');
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_FARO_ENABLED` | Enable/disable Faro | `true` |
| `VITE_FARO_COLLECTOR_URL` | Alloy collector URL | Required |
| `VITE_APP_VERSION` | App version for telemetry | `dev` |
| `VITE_API_BASE_URL` | API URL for trace propagation | Required |

## Testing

Mock Faro in tests:

```typescript
vi.mock('@reactive-platform/shared-observability/faro', () => ({
  initFaro: vi.fn(),
  logger: { info: vi.fn(), error: vi.fn(), setContext: vi.fn() },
  trackAction: { cartAdd: vi.fn(), checkoutStart: vi.fn() },
  FaroErrorBoundary: ({ children }) => children,
  FaroRoutes: ({ children }) => children,
}));
```
```

**Step 2: Write AGENTS.md**

```markdown
# AGENTS.md - Faro Library

## Purpose

Shared Grafana Faro integration providing frontend observability (errors, logs, traces, metrics) across all frontend apps.

## Key Files

| File | Purpose |
|------|---------|
| `src/lib/initFaro.ts` | Initialize Faro SDK with app config |
| `src/lib/logger.ts` | Structured logger sending to Loki |
| `src/lib/userActions.ts` | Pre-defined action tracking helpers |
| `src/lib/config.ts` | Configuration types |

## Usage Pattern

1. Call `initFaro()` in app entry point BEFORE React renders
2. Wrap app with `FaroErrorBoundary` and `FaroRoutes`
3. Use `logger` for structured logging
4. Use `trackAction` for key user flow events

## Dependencies

- `@grafana/faro-react` - Core Faro React integration
- `@grafana/faro-web-sdk` - Browser instrumentation
- `@grafana/faro-web-tracing` - Distributed tracing

## Testing

Always mock Faro in tests - real Faro tries to send telemetry.

## Do Not

- Initialize Faro multiple times
- Use console.log in production code (use logger instead)
- Forget to set `enabled: false` in E2E tests
```

**Step 3: Commit**

```bash
git add libs/frontend/shared-observability/faro/README.md libs/frontend/shared-observability/faro/AGENTS.md
git commit -m "docs(faro): add README and AGENTS.md"
```

---

## Summary

| Task | Files | Commit |
|------|-------|--------|
| 1 | Library scaffold | scaffold shared-observability/faro |
| 2 | package.json | add @grafana/faro-* dependencies |
| 3 | config.ts | FaroConfig types |
| 4 | initFaro.spec.ts | initFaro tests (red) |
| 5 | initFaro.ts | initFaro implementation (green) |
| 6 | logger.spec.ts | logger tests (red) |
| 7 | logger.ts | FaroLogger implementation (green) |
| 8 | userActions.ts | user action tracking |
| 9 | index.ts | public exports |
| 10 | README.md, AGENTS.md | documentation |

**Next:** [060C_FARO_APP_INTEGRATION.md](060C_FARO_APP_INTEGRATION.md)
