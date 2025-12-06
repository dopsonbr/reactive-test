# Page/Route Component Template

## Usage

For route-level components that compose features using TanStack Router.

## Structure

```tsx
// routes/{path}.tsx (file-based routing)
// OR pages/{PageName}Page.tsx (manual routing)

import { createFileRoute } from '@tanstack/react-router';
import { ErrorBoundary } from 'react-error-boundary';
import { PageErrorFallback } from '@/components/common/PageErrorFallback';
import { {Feature}Section } from '@/features/{feature}/components/{Feature}Section';
import { {feature}QueryOptions } from '@/features/{feature}/api/use{Feature}';
import { queryClient } from '@/lib/queryClient';

export const Route = createFileRoute('/{path}')({
  component: {PageName}Page,

  // Prefetch critical data
  loader: async ({ params }) => {
    await queryClient.ensureQueryData({feature}QueryOptions(params.id));
    return null;
  },

  // Type-safe search params
  validateSearch: (search) => ({
    page: Number(search.page) || 1,
    filter: String(search.filter) || '',
    sortBy: (search.sortBy as 'name' | 'date' | 'price') || 'name',
  }),

  // Handle pending states
  pendingComponent: () => <{PageName}Skeleton />,

  // Handle errors at route level
  errorComponent: ({ error }) => <PageErrorFallback error={error} />,
});

function {PageName}Page() {
  const params = Route.useParams();
  const search = Route.useSearch();

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">{Page Title}</h1>

      {/* Wrap sections in ErrorBoundary for graceful degradation */}
      <ErrorBoundary FallbackComponent={PageErrorFallback}>
        <{Feature}Section
          id={params.id}
          page={search.page}
          filter={search.filter}
        />
      </ErrorBoundary>
    </div>
  );
}
```

## List Page Pattern

```tsx
// routes/products.tsx
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ProductList } from '@/features/products/components/ProductList';
import { ProductFilters } from '@/features/products/components/ProductFilters';
import { productsQueryOptions } from '@/features/products/api/useProducts';

export const Route = createFileRoute('/products')({
  component: ProductsPage,
  validateSearch: (search) => ({
    page: Number(search.page) || 1,
    category: search.category as string | undefined,
    sortBy: (search.sortBy as 'name' | 'price') || 'name',
  }),
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => {
    await queryClient.ensureQueryData(productsQueryOptions(deps));
    return null;
  },
});

function ProductsPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const updateSearch = (updates: Partial<typeof search>) => {
    navigate({ search: (prev) => ({ ...prev, ...updates }) });
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Products</h1>

      <ProductFilters
        category={search.category}
        sortBy={search.sortBy}
        onCategoryChange={(category) => updateSearch({ category, page: 1 })}
        onSortChange={(sortBy) => updateSearch({ sortBy })}
      />

      <ProductList
        page={search.page}
        category={search.category}
        sortBy={search.sortBy}
        onPageChange={(page) => updateSearch({ page })}
      />
    </div>
  );
}
```

## Detail Page Pattern

```tsx
// routes/products/$productId.tsx
import { createFileRoute } from '@tanstack/react-router';
import { ProductDetail } from '@/features/products/components/ProductDetail';
import { productQueryOptions } from '@/features/products/api/useProduct';

export const Route = createFileRoute('/products/$productId')({
  component: ProductDetailPage,
  loader: async ({ params }) => {
    await queryClient.ensureQueryData(productQueryOptions(params.productId));
    return null;
  },
});

function ProductDetailPage() {
  const { productId } = Route.useParams();

  return (
    <div className="container mx-auto py-8">
      <ProductDetail productId={productId} />
    </div>
  );
}
```

## Rules

1. **Pages are thin orchestrators** - delegate logic to feature components
2. **Wrap sections in ErrorBoundary** for graceful degradation
3. **Use route loader for critical data** - ensures data is ready before render
4. **Keep URL state in search params** - pagination, filters, sort order
5. **Use typed params and search** - leverage TanStack Router's type safety

## Co-located Files

```
features/{domain}/pages/
├── {PageName}Page.tsx
├── {PageName}Page.test.tsx
└── {PageName}Skeleton.tsx
```

## Testing Pattern

```tsx
// {PageName}Page.test.tsx
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from '@tanstack/react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { Route } from './{PageName}Page';

describe('{PageName}Page', () => {
  it('renders page content', async () => {
    const router = createMemoryRouter({
      routeTree: routeTree,
      initialEntries: ['/{path}/123'],
    });

    render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    );

    await screen.findByRole('heading', { name: /page title/i });
  });
});
```
