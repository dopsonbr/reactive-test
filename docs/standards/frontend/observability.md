# Frontend Observability Standard

## Intent

Enable debugging and performance monitoring for React applications.

## Outcomes

- Structured JSON logging correlates with backend traces
- Core Web Vitals tracked (LCP, INP, CLS)
- User sessions traceable end-to-end

## Patterns

### Structured Logger

Closure pattern for context persistence:

```typescript
function createLogger() {
  let context: Record<string, unknown> = {};

  return {
    setContext(ctx: Record<string, unknown>) {
      context = { ...context, ...ctx };
    },
    info(message: string, data?: Record<string, unknown>) {
      sendLog('info', message, data);
    },
    error(message: string, error?: Error, data?: Record<string, unknown>) {
      sendLog('error', message, {
        ...data,
        stack: error?.stack,
        name: error?.name,
      });
    },
  };

  function sendLog(
    level: string,
    message: string,
    data?: Record<string, unknown>
  ) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...context,
      ...data,
      url: window.location.href,
    };

    if (typeof window.__TELEMETRY__?.sendLog === 'function') {
      window.__TELEMETRY__.sendLog(entry);
    }

    if (import.meta.env.DEV) {
      console[level](JSON.stringify(entry));
    }
  }
}

export const logger = createLogger();
```

### Web Vitals Collection

```typescript
import { onCLS, onINP, onLCP, onTTFB } from 'web-vitals';

function sendToAnalytics(metric: string, value: number) {
  logger.info('web-vital', { metric, value });
}

onCLS((metric) => sendToAnalytics('CLS', metric.value));
onINP((metric) => sendToAnalytics('INP', metric.value));
onLCP((metric) => sendToAnalytics('LCP', metric.value));
onTTFB((metric) => sendToAnalytics('TTFB', metric.value));
```

### Trace Context Propagation

Include trace headers in all API requests:

```typescript
function createFetchWithTracing(baseUrl: string) {
  return async function (path: string, options?: RequestInit) {
    const headers = new Headers(options?.headers);

    // Propagate trace context from backend
    const traceParent = window.__TRACE_CONTEXT__?.traceparent;
    if (traceParent) {
      headers.set('traceparent', traceParent);
    }

    return fetch(`${baseUrl}${path}`, { ...options, headers });
  };
}
```

### Session Context

Initialize on app mount:

```typescript
useEffect(() => {
  logger.setContext({
    sessionId: getSessionId(),
    userId: user?.id,
    appVersion: import.meta.env.VITE_APP_VERSION,
  });
}, [user]);
```

## Anti-patterns

- **console.log in production** - Use structured logger
- **Missing error context** - Always include user, session, route
- **Performance metrics without thresholds** - Define and alert on budgets

## Reference

- Backend: `docs/standards/backend/observability-traces.md`
- `libs/shared-utils/logger/` for shared implementation
