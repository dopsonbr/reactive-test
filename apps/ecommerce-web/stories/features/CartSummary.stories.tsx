import type { Story } from '@ladle/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createRouter, createRootRoute } from '@tanstack/react-router';
import { CartSummary } from '../../src/features/cart/components/CartSummary';
import type { Cart } from '../../src/features/cart/types';

export default {
  title: 'Features/Cart/CartSummary',
};

// Create minimal router for Link component
const rootRoute = createRootRoute({ component: () => null });
const router = createRouter({ routeTree: rootRoute });

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={new QueryClient()}>
    <RouterProvider router={router} />
    <div className="w-80">{children}</div>
  </QueryClientProvider>
);

const mockCart: Cart = {
  id: 'cart-001',
  items: [
    {
      sku: 'SKU-001',
      name: 'Wireless Headphones',
      price: 299.99,
      quantity: 2,
      imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e',
    },
  ],
  subtotal: 599.98,
  tax: 48.0,
  total: 647.98,
};

export const Default: Story = () => (
  <Wrapper>
    <CartSummary cart={mockCart} />
  </Wrapper>
);

export const SingleItem: Story = () => (
  <Wrapper>
    <CartSummary
      cart={{
        ...mockCart,
        items: [{ ...mockCart.items[0], quantity: 1 }],
        subtotal: 299.99,
        tax: 24.0,
        total: 323.99,
      }}
    />
  </Wrapper>
);

export const MultipleItems: Story = () => (
  <Wrapper>
    <CartSummary
      cart={{
        ...mockCart,
        items: [
          mockCart.items[0],
          {
            sku: 'SKU-002',
            name: 'Smart Watch',
            price: 199.99,
            quantity: 1,
            imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30',
          },
        ],
        subtotal: 799.97,
        tax: 64.0,
        total: 863.97,
      }}
    />
  </Wrapper>
);

export const EmptyCart: Story = () => (
  <Wrapper>
    <CartSummary
      cart={{
        id: 'cart-001',
        items: [],
        subtotal: 0,
        tax: 0,
        total: 0,
      }}
    />
  </Wrapper>
);
