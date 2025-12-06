# Frontend Error Handling Standard

## Intent

Establish consistent error handling patterns for graceful degradation.

## Outcomes

- No unhandled exceptions reaching users
- Granular error recovery (feature-level, not app-level crashes)
- Consistent user-facing error messages

## Patterns

### Error Boundary Hierarchy

```
App → Route → Feature → Widget
 ↓      ↓        ↓        ↓
Fatal  Page   Section   Component
```

Each level catches errors from its children, preventing full app crashes.

### ApiError Wrapper

Required for typed errors from API responses:

```typescript
class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new ApiError(
      body.message || response.statusText,
      response.status,
      body.code
    );
  }
  return response.json();
}
```

### TanStack Query Global Error Handler

```typescript
const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      // Handle auth errors globally
      if (error instanceof ApiError && error.status === 401) {
        handleAuthError();
        return;
      }
      // Show toast unless query opts out
      if (!query.meta?.silent) {
        toast.error(error.message);
      }
    },
  }),
});
```

### Error Recovery Patterns

| Error Type | Recovery Strategy |
|------------|-------------------|
| 401 Unauthorized | Redirect to login |
| 403 Forbidden | Show permission error |
| 404 Not Found | Show "not found" UI |
| 5xx Server Error | Retry with backoff, then fallback |
| Network Error | Show offline indicator, queue mutation |

### Error Boundary Implementation

```typescript
function FeatureErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div role="alert">
      <p>Something went wrong in this section.</p>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  );
}
```

## Anti-patterns

- **Swallowing errors silently** - Always log or display errors
- **Showing technical errors to users** - Map to user-friendly messages
- **Retry loops without backoff** - Use exponential backoff
- **Single top-level error boundary** - Use granular boundaries

## Reference

- ADR-009: Frontend Testing Strategy
- `libs/shared-ui/error-boundary/` for shared components
