import type { Story } from '@ladle/react';
import { MemoryRouter } from 'react-router-dom';
import { CartSummary } from './CartSummary';
import type { Cart } from '../types';

const mockCart: Cart = {
  id: 'cart-001',
  items: [
    { sku: 'SKU-001', name: 'Wireless Headphones', price: 299.99, quantity: 1, imageUrl: '' },
    { sku: 'SKU-002', name: 'Phone Case', price: 29.99, quantity: 2, imageUrl: '' },
  ],
  subtotal: 359.97,
  tax: 28.80,
  total: 388.77,
};

function Wrapper({ children }: { children: React.ReactNode }) {
  return <MemoryRouter>{children}</MemoryRouter>;
}

export const Default: Story = () => (
  <Wrapper>
    <div className="max-w-sm">
      <CartSummary cart={mockCart} />
    </div>
  </Wrapper>
);

export const SingleItem: Story = () => (
  <Wrapper>
    <div className="max-w-sm">
      <CartSummary
        cart={{
          ...mockCart,
          items: [mockCart.items[0]],
          subtotal: 299.99,
          tax: 24.00,
          total: 323.99,
        }}
      />
    </div>
  </Wrapper>
);

export const EmptyCart: Story = () => (
  <Wrapper>
    <div className="max-w-sm">
      <CartSummary
        cart={{
          id: 'cart-empty',
          items: [],
          subtotal: 0,
          tax: 0,
          total: 0,
        }}
      />
    </div>
  </Wrapper>
);

export const LargeOrder: Story = () => (
  <Wrapper>
    <div className="max-w-sm">
      <CartSummary
        cart={{
          ...mockCart,
          items: Array(5).fill(mockCart.items[0]).map((item, i) => ({
            ...item,
            sku: `SKU-00${i + 1}`,
            quantity: i + 1,
          })),
          subtotal: 4499.85,
          tax: 360.00,
          total: 4859.85,
        }}
      />
    </div>
  </Wrapper>
);
