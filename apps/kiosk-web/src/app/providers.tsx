import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { KioskSessionProvider } from '../features/session';
import { router } from './router';
import { logger } from '../shared/utils/logger';

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      logger.error('Query failed', error instanceof Error ? error : new Error(String(error)), {
        queryKey: JSON.stringify(query.queryKey),
      });
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      logger.error('Mutation failed', error instanceof Error ? error : new Error(String(error)), {
        mutationKey: mutation.options.mutationKey ? JSON.stringify(mutation.options.mutationKey) : undefined,
      });
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (garbage collection)
      retry: 3,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

export function Providers() {
  return (
    <KioskSessionProvider>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </KioskSessionProvider>
  );
}
