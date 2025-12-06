# Code Organization Standard

## Intent

Define file/folder conventions for scalable frontend codebases.

## Outcomes

- Feature colocation (files that change together live together)
- Clear import boundaries
- Efficient tree-shaking

## Patterns

### Nx Library Structure

```
libs/
  shared-ui/              # scope:shared, type:ui
    button/
    card/
    modal/
  shared-data/            # scope:shared, type:data-access
    api-client/
  shared-utils/           # scope:shared, type:util
    logger/
    formatters/
apps/
  ecommerce-web/          # scope:ecommerce, type:app
    src/
      features/           # Feature modules
        products/
        cart/
        checkout/
      routes/             # TanStack Router routes
      providers/          # App-level providers
```

### Feature Folder Structure

```
src/features/products/
├── api/
│   ├── useProducts.ts        # Query hook
│   ├── useProduct.ts         # Single item query
│   └── useUpdateProduct.ts   # Mutation hook
├── components/
│   ├── ProductCard.tsx
│   ├── ProductGrid.tsx
│   └── ProductFilters.tsx
├── hooks/
│   └── useProductSort.ts
├── pages/
│   ├── ProductListPage.tsx
│   └── ProductDetailPage.tsx
├── types/
│   └── product.ts
└── index.ts                  # Public API only
```

### Index File Rules

Thin re-exports for public API only:

```typescript
// features/products/index.ts - GOOD
export { ProductListPage } from './pages/ProductListPage';
export { ProductDetailPage } from './pages/ProductDetailPage';
export type { Product, ProductFilter } from './types/product';

// BAD - exporting everything
export * from './components';
export * from './hooks';
export * from './api';
```

### Barrel Export Rules

```typescript
// AVOID: Re-exporting everything causes bundle bloat
export * from './button';
export * from './card';
export * from './modal';

// PREFER: Direct imports from subpaths
import { Button } from '@reactive-platform/shared-ui/button';
import { Card } from '@reactive-platform/shared-ui/card';
```

### Import Aliases

```typescript
// tsconfig paths (configured in tsconfig.base.json)
{
  "paths": {
    "@reactive-platform/shared-ui/*": ["libs/shared-ui/*/src/index.ts"],
    "@reactive-platform/shared-data/*": ["libs/shared-data/*/src/index.ts"],
    "@/features/*": ["apps/ecommerce-web/src/features/*"],
    "@/components/*": ["apps/ecommerce-web/src/components/*"]
  }
}

// Usage
import { Button } from '@reactive-platform/shared-ui/button';
import { ProductCard } from '@/features/products/components/ProductCard';
```

### File Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| Component | PascalCase.tsx | `ProductCard.tsx` |
| Hook | camelCase.ts | `useProduct.ts` |
| Utility | camelCase.ts | `formatPrice.ts` |
| Type | camelCase.ts | `product.ts` |
| Test | {name}.test.ts(x) | `ProductCard.test.tsx` |
| Story | {name}.stories.tsx | `ProductCard.stories.tsx` |
| Page | PascalCasePage.tsx | `ProductListPage.tsx` |

### Colocation Principle

Keep related files together:

```
components/ProductCard/
├── ProductCard.tsx           # Component
├── ProductCard.test.tsx      # Tests
├── ProductCard.stories.tsx   # Stories
└── ProductCard.module.css    # Styles (if CSS modules)
```

## Anti-patterns

- **Deep nesting (>3 levels)** - Flatten structure
- **Cross-feature imports** - Extract to shared lib
- **Generic "utils" folder** - Be specific: `formatters/`, `validators/`
- **Circular dependencies** - Review architecture if this occurs
- **Default exports** - Use named exports for better refactoring

## Reference

- ADR-006: Frontend Monorepo Strategy
- `libs/shared-ui/` for library structure examples
