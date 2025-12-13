# 059: Frontend Observability with Grafana Faro

## Summary

Implement full Real User Monitoring (RUM) across all frontend applications (except offline-pos) using Grafana Faro. This connects frontend telemetry to the existing Grafana stack (Loki, Tempo, Prometheus) via Grafana Alloy.

## Goals

- **Error visibility** - Frontend errors in Grafana alongside backend logs
- **Performance monitoring** - Core Web Vitals tracking with alerting thresholds
- **Full-stack tracing** - Frontend user actions → API calls → backend services in single trace
- **Session tracking** - Correlate all telemetry by user session

## Scope

### In Scope
- ecommerce-web
- merchant-portal
- pos-web
- kiosk-web

### Out of Scope
- offline-pos (Go app, different architecture - future work)
- Session replay (not available self-hosted)

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           BROWSER                                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ ecommerce-web│  │merchant-portal│  │   pos-web   │  │  kiosk-web   │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘ │
│         │                 │                 │                 │          │
│         └────────────┬────┴────────┬────────┴────────┬────────┘          │
│                      │  @grafana/faro-react          │                   │
│                      │  (errors, logs, vitals,       │                   │
│                      │   traces, user actions)       │                   │
└──────────────────────┼───────────────────────────────┼───────────────────┘
                       │                               │
                       ▼                               ▼
              ┌────────────────┐              ┌────────────────┐
              │  Alloy :12347  │              │ Backend APIs   │
              │  (faro.receiver)│              │ (traceparent)  │
              └───────┬────────┘              └────────┬───────┘
                      │                                │
        ┌─────────────┼─────────────┐                  │
        ▼             ▼             ▼                  ▼
   ┌─────────┐  ┌──────────┐  ┌───────────┐     ┌──────────┐
   │  Loki   │  │Prometheus│  │   Tempo   │◄────│  Tempo   │
   │ (logs)  │  │(metrics) │  │ (traces)  │     │  (OTLP)  │
   └─────────┘  └──────────┘  └───────────┘     └──────────┘
                      │
                      ▼
              ┌────────────────┐
              │    Grafana     │
              │  (dashboards)  │
              └────────────────┘
```

## Implementation

### Phase 1: Infrastructure

#### 1.1 Add Grafana Alloy to Docker

**File: `docker/docker-compose.yml`**

Add new service:

```yaml
alloy:
  image: grafana/alloy:v1.5.1
  container_name: alloy
  command: ["run", "/etc/alloy/config.alloy", "--server.http.listen-addr=0.0.0.0:12345"]
  volumes:
    - ./alloy/config.alloy:/etc/alloy/config.alloy:ro
  ports:
    - "12345:12345"   # Alloy UI
    - "12347:12347"   # Faro receiver
  depends_on:
    loki:
      condition: service_healthy
    tempo:
      condition: service_healthy
    prometheus:
      condition: service_healthy
  healthcheck:
    test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:12345/ready"]
    interval: 5s
    timeout: 3s
    retries: 10
  networks:
    - observability
```

#### 1.2 Create Alloy Configuration

**File: `docker/alloy/config.alloy`**

```hcl
// Faro receiver - accepts browser telemetry
faro.receiver "frontend" {
  server {
    listen_address = "0.0.0.0"
    listen_port    = 12347
    cors_allowed_origins = ["http://localhost:*", "http://127.0.0.1:*"]
  }

  output {
    logs   = [loki.write.default.receiver]
    traces = [otelcol.exporter.otlp.tempo.input]
  }
}

// Send logs to Loki
loki.write "default" {
  endpoint {
    url = "http://loki:3100/loki/api/v1/push"
  }
}

// Send traces to Tempo
otelcol.exporter.otlp "tempo" {
  client {
    endpoint = "tempo:4317"
    tls { insecure = true }
  }
}
```

### Phase 2: Shared Faro Library

#### 2.1 Create Library Structure

```
libs/frontend/shared-observability/
└── faro/
    ├── src/
    │   ├── index.ts
    │   ├── initFaro.ts
    │   ├── config.ts
    │   ├── logger.ts
    │   ├── instrumentations/
    │   │   ├── index.ts
    │   │   └── userActions.ts
    │   └── context/
    │       └── FaroProvider.tsx
    ├── package.json
    ├── tsconfig.json
    ├── README.md
    └── AGENTS.md
```

#### 2.2 Core Initialization

**File: `libs/frontend/shared-observability/faro/src/initFaro.ts`**

```typescript
import { initializeFaro, getWebInstrumentations } from '@grafana/faro-react';
import { TracingInstrumentation } from '@grafana/faro-web-tracing';

export interface FaroConfig {
  appName: string;
  appVersion: string;
  collectorUrl: string;
  apiBaseUrl: string;
  enabled?: boolean;
}

export function initFaro(config: FaroConfig) {
  if (config.enabled === false) {
    return null;
  }

  return initializeFaro({
    url: config.collectorUrl,
    app: {
      name: config.appName,
      version: config.appVersion,
      environment: import.meta.env.MODE,
    },

    instrumentations: [
      ...getWebInstrumentations({
        captureConsole: true,
        captureConsoleDisabledLevels: ['debug'],
      }),
      new TracingInstrumentation({
        instrumentationOptions: {
          propagateTraceHeaderCorsUrls: [new RegExp(config.apiBaseUrl)],
        },
      }),
    ],

    sessionTracking: { enabled: true },
  });
}
```

#### 2.3 Logger Implementation

**File: `libs/frontend/shared-observability/faro/src/logger.ts`**

```typescript
import { faro, LogLevel } from '@grafana/faro-react';

class FaroLogger {
  private context: Record<string, unknown> = {};

  setContext(ctx: Record<string, unknown>) {
    this.context = { ...this.context, ...ctx };
    if (faro.api) {
      faro.api.setSession({ attributes: this.context });
    }
  }

  clearContext() {
    this.context = {};
  }

  info(message: string, data?: Record<string, unknown>) {
    this.log(LogLevel.INFO, message, data);
  }

  warn(message: string, data?: Record<string, unknown>) {
    this.log(LogLevel.WARN, message, data);
  }

  error(message: string, error?: Error, data?: Record<string, unknown>) {
    if (error && faro.api) {
      faro.api.pushError(error, { context: { message, ...this.context, ...data } });
    } else {
      this.log(LogLevel.ERROR, message, data);
    }
  }

  private log(level: LogLevel, message: string, data?: Record<string, unknown>) {
    if (faro.api) {
      faro.api.pushLog([message], { level, context: { ...this.context, ...data } });
    }

    // Also log to console in dev
    if (import.meta.env.DEV) {
      const method = level === LogLevel.ERROR ? 'error' : level === LogLevel.WARN ? 'warn' : 'log';
      console[method](`[${level}]`, message, { ...this.context, ...data });
    }
  }
}

export const logger = new FaroLogger();
```

#### 2.4 User Action Tracking

**File: `libs/frontend/shared-observability/faro/src/instrumentations/userActions.ts`**

```typescript
import { faro } from '@grafana/faro-react';

export const trackAction = {
  // E-commerce actions
  cartAdd: (sku: string, quantity: number) =>
    faro.api?.pushEvent('cart:add', { sku, quantity }),

  cartRemove: (sku: string) =>
    faro.api?.pushEvent('cart:remove', { sku }),

  checkoutStart: (cartId: string, itemCount: number) =>
    faro.api?.pushEvent('checkout:start', { cartId, itemCount }),

  checkoutComplete: (orderId: string, total: number) =>
    faro.api?.pushEvent('checkout:complete', { orderId, total }),

  searchExecute: (query: string, resultCount: number) =>
    faro.api?.pushEvent('search:execute', { query, resultCount }),

  // Auth actions
  loginSuccess: (userId: string) => {
    faro.api?.setUser({ id: userId });
    faro.api?.pushEvent('auth:login', { userId });
  },

  logout: () => {
    faro.api?.resetUser();
    faro.api?.pushEvent('auth:logout', {});
  },

  // POS actions
  scanItem: (sku: string, price: number) =>
    faro.api?.pushEvent('pos:scan', { sku, price }),

  voidItem: (sku: string, reason?: string) =>
    faro.api?.pushEvent('pos:void-item', { sku, reason }),

  tenderStart: (transactionId: string, total: number) =>
    faro.api?.pushEvent('pos:tender-start', { transactionId, total }),

  tenderComplete: (transactionId: string, paymentMethod: string) =>
    faro.api?.pushEvent('pos:tender-complete', { transactionId, paymentMethod }),

  // Merchant actions
  productCreate: (sku: string) =>
    faro.api?.pushEvent('merchant:product-create', { sku }),

  productUpdate: (sku: string, fields: string[]) =>
    faro.api?.pushEvent('merchant:product-update', { sku, fields }),

  inventoryAdjust: (sku: string, delta: number) =>
    faro.api?.pushEvent('merchant:inventory-adjust', { sku, delta }),
};
```

### Phase 3: App Integration

#### 3.1 Integration Pattern

Each app follows this pattern:

**Entry point (`main.tsx`):**

```typescript
import { initFaro } from '@reactive-platform/shared-observability/faro';

const faro = initFaro({
  appName: 'ecommerce-web',  // Change per app
  appVersion: import.meta.env.VITE_APP_VERSION ?? 'dev',
  collectorUrl: import.meta.env.VITE_FARO_COLLECTOR_URL ?? 'http://localhost:12347/collect',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8090',
  enabled: import.meta.env.VITE_FARO_ENABLED !== 'false',
});
```

**Providers (`providers.tsx`):**

```typescript
import { FaroErrorBoundary, FaroRoutes } from '@grafana/faro-react';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <FaroErrorBoundary fallback={(error) => <ErrorCard error={error} />}>
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

#### 3.2 Environment Variables

Add to each frontend app's Vite config:

```bash
# Development
VITE_FARO_ENABLED=true
VITE_FARO_COLLECTOR_URL=http://localhost:12347/collect
VITE_APP_VERSION=dev

# Production (Docker)
VITE_FARO_ENABLED=true
VITE_FARO_COLLECTOR_URL=/collect
VITE_APP_VERSION=${GIT_SHA}
```

#### 3.3 Nginx Proxy (Docker builds)

Add to each frontend's nginx config:

```nginx
location /collect {
    proxy_pass http://alloy:12347/collect;
    proxy_set_header Host $host;
}
```

### Phase 4: Dashboards

#### 4.1 Frontend Health Overview Dashboard

**File: `docker/grafana/provisioning/dashboards/frontend-health.json`**

Panels:
- Error rate by app (Loki)
- Web Vitals gauges - LCP, INP, CLS with thresholds (Prometheus)
- Active sessions by app (Prometheus)
- Top errors table (Loki)
- Slowest pages by route (Tempo)

#### 4.2 User Journey Dashboard

**File: `docker/grafana/provisioning/dashboards/user-journey.json`**

Panels:
- Session timeline for selected session ID
- Distributed trace view (frontend → backend)
- Conversion funnel: cart → checkout
- Error context with surrounding events

### Phase 5: Cleanup & Migration

#### 5.1 Remove Redundant Code

- Delete `apps/ecommerce-web/src/shared/utils/vitals.ts` (Faro handles Web Vitals)
- Update `apps/ecommerce-web/src/shared/utils/logger.ts` to re-export from shared lib
- Remove manual Web Vitals initialization from app entry points

#### 5.2 Update Existing ErrorBoundary Usage

Replace existing `ErrorBoundary` imports with `FaroErrorBoundary`:

```typescript
// Before
import { ErrorBoundary } from '@/shared/components/ErrorBoundary';

// After
import { FaroErrorBoundary } from '@grafana/faro-react';
```

## Testing

### Unit Tests

Mock Faro in test setup:

```typescript
// libs/frontend/shared-observability/faro/src/test/mockFaro.ts
export const mockFaro = {
  api: {
    pushEvent: vi.fn(),
    pushError: vi.fn(),
    pushLog: vi.fn(),
    setUser: vi.fn(),
    resetUser: vi.fn(),
    setSession: vi.fn(),
  },
};

vi.mock('@grafana/faro-react', () => ({ faro: mockFaro }));
```

### E2E Tests

Disable Faro to avoid telemetry noise:

```typescript
// playwright.config.ts
use: {
  launchOptions: {
    env: { VITE_FARO_ENABLED: 'false' },
  },
},
```

### Integration Verification

```bash
# Verify Alloy is receiving data
curl -X POST http://localhost:12347/collect \
  -H "Content-Type: application/json" \
  -d '{"logs":[{"message":"test","level":"info","app":{"name":"test"}}]}'

# Check Loki received it
curl 'http://localhost:3100/loki/api/v1/query?query={app="test"}'

# Check Alloy UI
open http://localhost:12345
```

## Key User Flows to Instrument

| App | Actions |
|-----|---------|
| ecommerce-web | add-to-cart, checkout-start, checkout-complete, search, login/logout |
| pos-web | scan-item, void-item, tender-start, tender-complete, transaction-void |
| kiosk-web | scan-item, add-to-cart, checkout-start, payment-complete |
| merchant-portal | product-create, product-update, inventory-adjust, price-update |

## Dependencies

### NPM Packages (add to frontend apps)

```json
{
  "@grafana/faro-react": "^1.x",
  "@grafana/faro-web-sdk": "^1.x",
  "@grafana/faro-web-tracing": "^1.x"
}
```

### Docker Images

- `grafana/alloy:v1.5.1`

## Success Criteria

- [ ] Alloy running in Docker stack with Faro receiver
- [ ] All 4 frontend apps sending telemetry
- [ ] Errors visible in Grafana/Loki with stack traces
- [ ] Web Vitals metrics in Prometheus
- [ ] Distributed traces show frontend → backend correlation
- [ ] User actions tracked for key flows
- [ ] Two dashboards provisioned and functional

## References

- [Grafana Faro OSS](https://grafana.com/oss/faro/)
- [Faro Web SDK GitHub](https://github.com/grafana/faro-web-sdk)
- [Faro React Quickstart](https://grafana.com/docs/grafana-cloud/monitor-applications/frontend-observability/quickstart/react/)
- [Alloy Faro Receiver](https://grafana.com/docs/alloy/latest/reference/components/faro.receiver/)
- Existing: `docs/standards/frontend/observability.md`
