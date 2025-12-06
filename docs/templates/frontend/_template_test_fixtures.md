# Test Fixtures Template

## Usage

Feature components should have co-located mock data in `__fixtures__` folder.

## Structure

```
features/{domain}/components/
├── ComponentName.tsx
├── ComponentName.test.tsx
└── __fixtures__/
    ├── mockData.ts
    └── handlers.ts (MSW handlers if needed)
```

## mockData.ts Example

```typescript
// __fixtures__/mockData.ts
import type { Product, Cart } from '../types';

export const mockProduct: Product = {
  id: 'SKU-001',
  name: 'Test Product',
  price: 29.99,
  description: 'A test product for unit tests',
  inStock: true,
};

export const mockProducts: Product[] = [
  mockProduct,
  { ...mockProduct, id: 'SKU-002', name: 'Second Product' },
];

export const mockCart: Cart = {
  id: 'cart-001',
  items: [{ productId: 'SKU-001', quantity: 2 }],
  total: 59.98,
};

// Factory functions for variations
export function createMockProduct(overrides: Partial<Product> = {}): Product {
  return { ...mockProduct, ...overrides };
}
```

## handlers.ts Example (MSW)

```typescript
// __fixtures__/handlers.ts
import { http, HttpResponse } from 'msw';
import { mockProducts } from './mockData';

export const handlers = [
  http.get('/api/products', () => {
    return HttpResponse.json(mockProducts);
  }),
  http.get('/api/products/:id', ({ params }) => {
    const product = mockProducts.find((p) => p.id === params.id);
    if (!product) {
      return new HttpResponse(null, { status: 404 });
    }
    return HttpResponse.json(product);
  }),
];
```

## Usage in Tests

```tsx
// ComponentName.test.tsx
import { mockProduct, createMockProduct } from './__fixtures__/mockData';

describe('ProductCard', () => {
  it('renders product info', () => {
    render(<ProductCard product={mockProduct} />);
    expect(screen.getByText('Test Product')).toBeInTheDocument();
  });

  it('handles out of stock', () => {
    const outOfStock = createMockProduct({ inStock: false });
    render(<ProductCard product={outOfStock} />);
    expect(screen.getByText('Out of Stock')).toBeInTheDocument();
  });
});
```

## Best Practices

1. **Type your mocks**: Use TypeScript interfaces for type safety
2. **Use factory functions**: Create variations easily with `createMock*` functions
3. **Keep fixtures focused**: Each fixture file should serve one component/feature
4. **Avoid over-mocking**: Only mock what's necessary for the test

## Enforcement

The `pnpm lint:tests` command checks that feature components have co-located test files.
