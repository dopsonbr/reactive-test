import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createRouter, createMemoryHistory, createRootRoute } from '@tanstack/react-router';
import { render, RenderOptions, waitFor } from '@testing-library/react';
import { ReactElement, ReactNode } from 'react';

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

interface WrapperProps {
  children: ReactNode;
}

export function createWrapper(queryClient?: QueryClient) {
  const client = queryClient ?? createTestQueryClient();
  return function Wrapper({ children }: WrapperProps) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

export function renderWithProviders(
  ui: ReactElement,
  options?: RenderOptions & { queryClient?: QueryClient }
) {
  const { queryClient, ...renderOptions } = options ?? {};
  return render(ui, {
    wrapper: createWrapper(queryClient),
    ...renderOptions,
  });
}

// Store for passing the test component to the router
let testComponentToRender: ReactElement | null = null;

function TestComponentWrapper() {
  return testComponentToRender;
}

export async function renderWithRouter(
  ui: ReactElement,
  options?: RenderOptions & { queryClient?: QueryClient }
) {
  const { queryClient, ...renderOptions } = options ?? {};
  const client = queryClient ?? createTestQueryClient();

  // Set the component to render
  testComponentToRender = ui;

  const rootRoute = createRootRoute({
    component: TestComponentWrapper,
  });

  const router = createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });

  // Wait for router to be ready
  await router.load();

  const result = render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
    renderOptions
  );

  // Wait for component to render
  await waitFor(() => {
    if (!result.container.querySelector('[data-testid]') && !result.container.textContent) {
      // Component hasn't rendered yet, keep waiting
    }
  }, { timeout: 100 }).catch(() => {
    // Ignore timeout - component may not have test ids
  });

  return result;
}

// Re-export everything from testing-library
export * from '@testing-library/react';
export { renderWithProviders as render };
