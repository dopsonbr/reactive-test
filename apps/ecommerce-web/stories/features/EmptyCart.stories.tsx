import type { Story } from '@ladle/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createRouter, createRootRoute } from '@tanstack/react-router';
import { EmptyCart } from '../../src/features/cart/components/EmptyCart';

export default {
  title: 'Features/Cart/EmptyCart',
};

// Create minimal router for Link component
const rootRoute = createRootRoute({ component: () => null });
const router = createRouter({ routeTree: rootRoute });

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={new QueryClient()}>
    <RouterProvider router={router} />
    {children}
  </QueryClientProvider>
);

export const Default: Story = () => (
  <Wrapper>
    <div className="max-w-lg">
      <EmptyCart />
    </div>
  </Wrapper>
);
