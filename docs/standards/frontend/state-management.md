# State Management Standard

## Intent

Define where state lives and how it flows through the application.

## Outcomes

- Server state in TanStack Query (not Redux)
- URL state for navigation and filters
- Minimal global client state

## Patterns

### State Categories

| State Type | Tool | Example |
|------------|------|---------|
| Server state | TanStack Query | Products, user data, API responses |
| URL state | TanStack Router | Page number, filters, sort order |
| Form state | react-hook-form | Form inputs, validation |
| UI state | useState | Modal open, hover, expanded |
| Global UI | Context | Theme, notifications, auth |

### TanStack Query Configuration

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,  // 5 minutes
      gcTime: 1000 * 60 * 10,    // 10 minutes (garbage collection)
      retry: 3,
      refetchOnWindowFocus: true,
    },
    mutations: {
      retry: 1,
    },
  },
});
```

### Query Hook Pattern

```typescript
// Colocate query options for reuse
export const productQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ['product', id],
    queryFn: () => api.getProduct(id),
    staleTime: 1000 * 60 * 5,
  });

// Use in component
function ProductDetail({ id }: { id: string }) {
  const { data, isLoading, error } = useQuery(productQueryOptions(id));
  // ...
}

// Prefetch in loader
export const loader = async ({ params }) => {
  await queryClient.ensureQueryData(productQueryOptions(params.id));
  return null;
};
```

### URL State with TanStack Router

```typescript
// Define search params schema
const productListRoute = createRoute({
  path: '/products',
  validateSearch: (search) => ({
    page: Number(search.page) || 1,
    sortBy: String(search.sortBy) || 'name',
    category: search.category as string | undefined,
  }),
});

// Read and update URL state
function ProductFilters() {
  const { page, sortBy } = Route.useSearch();
  const navigate = useNavigate();

  const setPage = (newPage: number) => {
    navigate({ search: (prev) => ({ ...prev, page: newPage }) });
  };
  // ...
}
```

### Optimistic Updates

```typescript
const updateUser = useMutation({
  mutationFn: api.updateUser,
  onMutate: async (newData) => {
    // Cancel in-flight queries
    await queryClient.cancelQueries({ queryKey: ['user'] });

    // Snapshot previous value
    const previous = queryClient.getQueryData(['user']);

    // Optimistically update
    queryClient.setQueryData(['user'], (old) => ({ ...old, ...newData }));

    return { previous };
  },
  onError: (err, vars, context) => {
    // Rollback on error
    queryClient.setQueryData(['user'], context.previous);
  },
  onSettled: () => {
    // Refetch to ensure consistency
    queryClient.invalidateQueries({ queryKey: ['user'] });
  },
});
```

### Global UI State (Context)

For truly global state that changes UI across the app:

```typescript
// Theme context - affects entire app
const ThemeContext = createContext<ThemeState | null>(null);

function ThemeProvider({ children }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
```

## Anti-patterns

- **Redux for server state** - Use TanStack Query instead
- **Local state for shareable data** - If multiple components need it, lift up
- **Prop drilling complex state** - Use context or composition
- **Storing derived state** - Compute from source data
- **URL state in useState** - Keep navigation state in URL

## Reference

- ADR-007: Frontend UI Framework
- `apps/ecommerce-web/src/providers/` for provider setup
