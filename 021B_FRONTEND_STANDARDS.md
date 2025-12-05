# 021B_FRONTEND_STANDARDS

**Status: DRAFT**

---

## Overview

Create 7 frontend standards documents covering architecture, error handling, observability, testing, components, state management, and code organization.

**Parent Plan:** [021_FRONTEND_STANDARDS_INITIATIVE](./021_FRONTEND_STANDARDS_INITIATIVE.md)

**Prerequisites:**
- [021A_STANDARDS_REORG](./021A_STANDARDS_REORG.md) complete (`docs/standards/frontend/` exists)

**Blockers:**
- None

**Related ADRs:**
- `docs/ADRs/007_frontend_ui_framework.md` - React + Vite + TanStack
- `docs/ADRs/008_component_library_design_system.md` - shadcn/ui + Tailwind
- `docs/ADRs/009_frontend_testing_strategy.md` - Ladle + Vitest + Playwright

---

## Goals

1. Create 7 frontend standards following existing format (Intent, Outcomes, Patterns, Anti-patterns, Reference)
2. Standards reference ADR decisions
3. Update `docs/standards/frontend/README.md` index

---

## Exit Criteria

- [ ] 7 frontend standards created in `docs/standards/frontend/`
- [ ] Each standard follows Intent/Outcomes/Patterns/Anti-patterns/Reference format
- [ ] `docs/standards/frontend/README.md` indexes all 7 standards
- [ ] `pnpm check:docs-index` passes

---

## Phase 1: Architecture Standard

**File:** `docs/standards/frontend/architecture.md`

**Content Outline:**
```markdown
# Frontend Architecture Standard

## Intent
Define consistent component layering and code organization across React applications.

## Outcomes
- Clear separation between smart and presentational components
- Predictable feature folder structure
- Consistent data flow patterns

## Patterns

### Feature Folder Structure
src/features/{domain}/
├── api/          # TanStack Query hooks
├── components/   # Feature-specific components
├── hooks/        # Custom hooks
├── pages/        # Route components
└── types/        # TypeScript types

### Component Layering
Page → Feature Component → UI Component
         ↓                    ↓
    TanStack Query         Props only

### State Boundaries
- URL state (TanStack Router) for navigation/filters
- Server state (TanStack Query) for API data
- Local state (useState) for ephemeral UI

## Anti-patterns
- Barrel exports causing bundle bloat
- Circular feature dependencies
- Business logic in UI components

## Reference
- ADR-007: Frontend UI Framework
```

---

## Phase 2: Error Handling Standard

**File:** `docs/standards/frontend/error-handling.md`

**Content Outline:**
```markdown
# Frontend Error Handling Standard

## Intent
Establish consistent error handling patterns for graceful degradation.

## Outcomes
- No unhandled exceptions reaching users
- Granular error recovery (feature-level, not app-level crashes)
- Consistent user-facing error messages

## Patterns

### Error Boundary Hierarchy
App → Route → Feature → Widget
 ↓      ↓        ↓        ↓
Fatal  Page   Section   Component

### ApiError Wrapper (Required for typed errors)
class ApiError extends Error {
  constructor(message, status, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function apiFetch(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new ApiError(body.message || response.statusText, response.status, body.code);
  }
  return response.json();
}

### TanStack Query Global Error Handler
const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      if (error instanceof ApiError && error.status === 401) {
        handleAuthError();
      }
      if (!query.meta?.silent) toast.error(error.message);
    },
  }),
});

## Anti-patterns
- Swallowing errors silently
- Showing technical errors to users
- Retry loops without backoff

## Reference
- ADR-009: Frontend Testing Strategy
```

---

## Phase 3: Observability Standard

**File:** `docs/standards/frontend/observability.md`

**Content Outline:**
```markdown
# Frontend Observability Standard

## Intent
Enable debugging and performance monitoring for React applications.

## Outcomes
- Structured JSON logging correlates with backend traces
- Core Web Vitals tracked (LCP, INP, CLS)
- User sessions traceable end-to-end

## Patterns

### Structured Logger (closure pattern)
function createLogger() {
  let context = {};
  return {
    setContext(ctx) { context = { ...context, ...ctx }; },
    info(message, data) { sendLog('info', message, data); },
    error(message, error, data) {
      sendLog('error', message, { ...data, stack: error?.stack, name: error?.name });
    },
  };
  function sendLog(level, message, data) {
    const entry = { timestamp: new Date().toISOString(), level, message, ...context, ...data, url: window.location.href };
    if (typeof window.__TELEMETRY__?.sendLog === 'function') {
      window.__TELEMETRY__.sendLog(entry);
    }
    if (process.env.NODE_ENV === 'development') {
      console[level](JSON.stringify(entry));
    }
  }
}
export const logger = createLogger();

### Web Vitals
import { getCLS, getLCP, getTTFB } from 'web-vitals';
getCLS(metric => sendToAnalytics('CLS', metric.value));

### Trace Context Propagation
headers.set('traceparent', currentTraceContext);

## Anti-patterns
- Console.log in production
- Missing error context (user, session, route)
- Performance metrics without actionable thresholds

## Reference
- Backend: docs/standards/backend/observability-traces.md
```

---

## Phase 4: Testing Standard

**File:** `docs/standards/frontend/testing.md`

**Content Outline:**
```markdown
# Frontend Testing Standard

## Intent
Define testing strategy based on Testing Trophy model.

## Outcomes
- High confidence with minimal test maintenance
- Presentation components tested via Ladle stories
- Feature components tested with Vitest + RTL
- E2E tests cover critical user journeys only

## Patterns

### Testing Trophy Distribution
      E2E (10%)        - Critical user journeys
   Integration (60%)   - Feature components with RTL
     Unit (20%)        - Pure functions, hooks
    Static (10%)       - TypeScript, ESLint

### Presentation Component Testing
// No unit tests - Ladle story IS the test
// Accessibility test required
it('has no violations', async () => {
  const { container } = render(<Button>Click</Button>);
  expect(await axe(container)).toHaveNoViolations();
});

### Feature Component Testing
it('displays product information', async () => {
  queryClient.setQueryData(['product', 'SKU'], mockProduct);
  render(<ProductDetail productId="SKU" />);
  expect(screen.getByRole('heading')).toHaveTextContent('Product Name');
});

### E2E Scope
// GOOD: High-level user journey
test('checkout flow', async ({ page }) => {
  await page.goto('/cart');
  await page.click('text=Checkout');
});
// BAD: Testing component behavior in E2E

## Anti-patterns
- Unit tests for props → render
- E2E for individual components
- Skipping accessibility tests

## Reference
- ADR-009: Frontend Testing Strategy
```

---

## Phase 5: Component Patterns Standard

**File:** `docs/standards/frontend/components.md`

**Content Outline:**
```markdown
# Component Patterns Standard

## Intent
Establish consistent component design patterns for reusability.

## Outcomes
- Compound components for complex UI
- Headless hooks for logic extraction
- Clear smart/presentational separation

## Patterns

### Compound Components
<Modal>
  <Modal.Trigger>Open</Modal.Trigger>
  <Modal.Content>
    <Modal.Header>Title</Modal.Header>
    <Modal.Body>Content</Modal.Body>
  </Modal.Content>
</Modal>

### Headless Hooks
function useAccordion(initialIndex = 0) {
  const [expandedIndex, setExpandedIndex] = useState(initialIndex);
  return {
    expandedIndex,
    toggle: (i) => setExpandedIndex(expandedIndex === i ? -1 : i),
  };
}

### Smart vs Presentational
// Presentational (libs/ui) - Props only
function ProductCard({ name, price, onAddToCart }) { ... }

// Smart (apps/*/features) - Data fetching
function ProductDetail({ productId }) {
  const { data } = useProduct(productId);
  return <ProductCard {...data} />;
}

## Anti-patterns
- Prop drilling >2 levels
- Business logic in presentational components
- Context overuse (prefer composition)

## Reference
- ADR-008: Component Library Design System
```

---

## Phase 6: State Management Standard

**File:** `docs/standards/frontend/state-management.md`

**Content Outline:**
```markdown
# State Management Standard

## Intent
Define where state lives and how it flows.

## Outcomes
- Server state in TanStack Query (not Redux)
- URL state for navigation/filters
- Minimal global client state

## Patterns

### TanStack Query Configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
      retry: 3,
    },
  },
});

### URL State with TanStack Router
const { page, sortBy } = useSearch({ from: productListRoute.id });
navigate({ search: { ...prev, page: 2 } });

### Optimistic Updates
useMutation({
  mutationFn: updateUser,
  onMutate: async (newData) => {
    await queryClient.cancelQueries(['user']);
    const previous = queryClient.getQueryData(['user']);
    queryClient.setQueryData(['user'], (old) => ({ ...old, ...newData }));
    return { previous };
  },
  onError: (err, vars, context) => {
    queryClient.setQueryData(['user'], context.previous);
  },
});

## Anti-patterns
- Redux for server state
- Local state for shareable data
- Prop drilling complex state

## Reference
- ADR-007: Frontend UI Framework
```

---

## Phase 7: Code Organization Standard

**File:** `docs/standards/frontend/code-organization.md`

**Content Outline:**
```markdown
# Code Organization Standard

## Intent
Define file/folder conventions for scalable frontend codebases.

## Outcomes
- Feature colocation (files that change together live together)
- Clear import boundaries
- Efficient tree-shaking

## Patterns

### Recommended Structure
libs/
  shared-ui/           # scope:shared, type:ui
  shared-data/         # scope:shared, type:data-access
  shared-utils/        # scope:shared, type:util
apps/
  ecommerce-web/       # scope:ecommerce, type:app
    src/features/
      products/
      cart/
      checkout/

### Barrel Export Rules
// AVOID: Re-exporting everything
export * from './button';

// PREFER: Direct imports
import { Button } from '@reactive-platform/shared-ui/button';

### Index Files
// Thin re-exports for public API only
export { ProductListPage } from './pages/ProductListPage';
export type { Product } from './types/product';

## Anti-patterns
- Deep nesting (max 3 levels)
- Cross-feature imports
- Generic "utils" folder

## Reference
- ADR-006: Frontend Monorepo Strategy
```

---

## Phase 8: Update Index

**File:** `docs/standards/frontend/README.md`

**Content:**
```markdown
# Frontend Standards

Standards for React + Vite + TanStack applications per ADRs 007-009.

| Standard | Description |
|----------|-------------|
| [architecture.md](./architecture.md) | Component layers, feature folders |
| [error-handling.md](./error-handling.md) | Error boundaries, ApiError, Query errors |
| [observability.md](./observability.md) | Structured logging, Web Vitals, tracing |
| [testing.md](./testing.md) | Testing Trophy, Ladle, Vitest, Playwright |
| [components.md](./components.md) | Compound, headless, smart/presentational |
| [state-management.md](./state-management.md) | TanStack Query, URL state |
| [code-organization.md](./code-organization.md) | Feature folders, barrel exports |
```

---

## Files Summary

| Action | File | Purpose |
|--------|------|---------|
| CREATE | `docs/standards/frontend/architecture.md` | Component architecture |
| CREATE | `docs/standards/frontend/error-handling.md` | Error boundaries, Query errors |
| CREATE | `docs/standards/frontend/observability.md` | Telemetry, metrics, tracing |
| CREATE | `docs/standards/frontend/testing.md` | Testing trophy, Ladle, Vitest |
| CREATE | `docs/standards/frontend/components.md` | Component patterns |
| CREATE | `docs/standards/frontend/state-management.md` | TanStack Query, URL state |
| CREATE | `docs/standards/frontend/code-organization.md` | Feature folders, imports |
| MODIFY | `docs/standards/frontend/README.md` | Index all 7 standards |

---

## Checklist

- [ ] Phase 1: architecture.md created
- [ ] Phase 2: error-handling.md created
- [ ] Phase 3: observability.md created
- [ ] Phase 4: testing.md created
- [ ] Phase 5: components.md created
- [ ] Phase 6: state-management.md created
- [ ] Phase 7: code-organization.md created
- [ ] Phase 8: README.md indexes all standards
- [ ] `pnpm check:docs-index` passes
