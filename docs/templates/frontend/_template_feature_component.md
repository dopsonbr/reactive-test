# Feature Component Template

## Usage

For smart/container components with data fetching and business logic.

## Structure

```tsx
// features/{domain}/components/{ComponentName}.tsx
import { useQuery, useMutation } from '@tanstack/react-query';
import { use{Domain}Query } from '../api/use{Domain}';
import { use{Domain}Mutation } from '../api/use{Domain}Mutation';
import { {Domain}Card } from './components/{Domain}Card';
import { {ComponentName}Skeleton } from './{ComponentName}Skeleton';
import { ErrorCard } from '@/components/common/ErrorCard';

interface {ComponentName}Props {
  id: string;
}

export function {ComponentName}({ id }: {ComponentName}Props) {
  const { data, isLoading, isError, error, refetch } = use{Domain}Query(id);
  const mutation = use{Domain}Mutation();

  if (isLoading) {
    return <{ComponentName}Skeleton />;
  }

  if (isError) {
    return (
      <ErrorCard
        error={error}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div>
      <{Domain}Card
        data={data}
        onAction={(payload) => mutation.mutate(payload)}
        isSubmitting={mutation.isPending}
      />
    </div>
  );
}
```

## Query Hook Pattern

```tsx
// features/{domain}/api/use{Domain}.ts
import { useQuery, queryOptions } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { {Domain} } from '../types/{domain}';

export const {domain}QueryOptions = (id: string) =>
  queryOptions({
    queryKey: ['{domain}', id],
    queryFn: () => api.get<{Domain}>(`/{domain}s/${id}`),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

export function use{Domain}Query(id: string) {
  return useQuery({domain}QueryOptions(id));
}
```

## Mutation Hook Pattern

```tsx
// features/{domain}/api/use{Domain}Mutation.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { {Domain}Update } from '../types/{domain}';

export function use{Domain}Mutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {Domain}Update) => api.patch(`/{domain}s/${data.id}`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['{domain}', variables.id] });
    },
  });
}
```

## Co-located Files

```
features/{domain}/components/
├── {ComponentName}.tsx
├── {ComponentName}.test.tsx    # Vitest + RTL
├── {ComponentName}Skeleton.tsx # Loading state
└── {ComponentName}.stories.tsx # Optional
```

## Testing Pattern

```tsx
// {ComponentName}.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { {ComponentName} } from './{ComponentName}';
import { mock{Domain} } from '../__mocks__/{domain}';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

describe('{ComponentName}', () => {
  it('displays data when loaded', async () => {
    queryClient.setQueryData(['{domain}', '123'], mock{Domain});

    render(<{ComponentName} id="123" />, { wrapper: TestWrapper });

    await waitFor(() => {
      expect(screen.getByRole('heading')).toHaveTextContent(mock{Domain}.name);
    });
  });
});
```
