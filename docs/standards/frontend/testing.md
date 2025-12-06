# Frontend Testing Standard

## Intent

Define testing strategy based on Testing Trophy model for high confidence with minimal maintenance.

## Outcomes

- Presentation components tested via Ladle stories
- Feature components tested with Vitest + React Testing Library
- E2E tests cover critical user journeys only

## Patterns

### Testing Trophy Distribution

```
      E2E (10%)        - Critical user journeys
   Integration (60%)   - Feature components with RTL
     Unit (20%)        - Pure functions, hooks
    Static (10%)       - TypeScript, ESLint
```

### Test Placement

| Component Type | Test Location | Tools |
|----------------|---------------|-------|
| UI Component | `*.stories.tsx` + `*.a11y.test.tsx` | Ladle, axe-core |
| Feature Component | `*.test.tsx` | Vitest, RTL |
| Custom Hook | `*.test.ts` | Vitest, @testing-library/react-hooks |
| Utility Function | `*.test.ts` | Vitest |
| User Journey | `e2e/*.spec.ts` | Playwright |

### Presentation Component Testing

No unit tests - Ladle story IS the documentation and visual test:

```tsx
// Button.stories.tsx
export const Default: Story = () => <Button>Click me</Button>;
export const Variants: Story = () => (
  <div className="flex gap-2">
    <Button variant="primary">Primary</Button>
    <Button variant="secondary">Secondary</Button>
  </div>
);
```

Accessibility test required:

```tsx
// Button.a11y.test.tsx
import { axe, toHaveNoViolations } from 'jest-axe';
expect.extend(toHaveNoViolations);

it('has no accessibility violations', async () => {
  const { container } = render(<Button>Click</Button>);
  expect(await axe(container)).toHaveNoViolations();
});
```

### Feature Component Testing

```tsx
// ProductDetail.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

function TestWrapper({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

it('displays product information', async () => {
  queryClient.setQueryData(['product', 'SKU'], mockProduct);
  render(<ProductDetail productId="SKU" />, { wrapper: TestWrapper });

  await waitFor(() => {
    expect(screen.getByRole('heading')).toHaveTextContent('Product Name');
  });
});
```

### E2E Test Scope

```typescript
// GOOD: High-level user journey
test('checkout flow', async ({ page }) => {
  await page.goto('/cart');
  await page.click('text=Checkout');
  await page.fill('[name="email"]', 'test@example.com');
  await page.click('text=Place Order');
  await expect(page).toHaveURL('/confirmation');
});

// BAD: Testing component behavior in E2E
test('button changes color on hover', async ({ page }) => { ... });
```

### Mock Strategies

| Scenario | Strategy |
|----------|----------|
| API responses | MSW (Mock Service Worker) |
| TanStack Query | `queryClient.setQueryData()` |
| External services | Vitest mocks |
| Time-dependent | `vi.useFakeTimers()` |

## Anti-patterns

- **Unit tests for props → render** - Use stories instead
- **E2E for individual components** - Use integration tests
- **Skipping accessibility tests** - Required for all UI components
- **Testing implementation details** - Test behavior, not internals

## Reference

- ADR-009: Frontend Testing Strategy
- `apps/ecommerce-web/src/**/*.test.tsx` for examples
