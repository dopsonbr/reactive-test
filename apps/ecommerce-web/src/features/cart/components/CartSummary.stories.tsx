import type { Story } from '@ladle/react';
import { MemoryRouter } from 'react-router-dom';
import { CartSummary } from './CartSummary';
import type { Cart, CartItem } from '../types';

const mockCartItem: CartItem = {
  sku: '1001',
  name: 'Wireless Headphones',
  description: 'High-quality wireless headphones',
  unitPrice: '299.99',
  originalUnitPrice: '349.99',
  quantity: 1,
  availableQuantity: 50,
  imageUrl: 'https://via.placeholder.com/100?text=Headphones',
  category: 'Electronics',
  lineTotal: '299.99',
  inStock: true,
};

const mockCart: Cart = {
  id: 'cart-001',
  storeNumber: 1,
  products: [
    mockCartItem,
    {
      ...mockCartItem,
      sku: '1002',
      name: 'Phone Case',
      unitPrice: '29.99',
      originalUnitPrice: undefined,
      quantity: 2,
      lineTotal: '59.98',
    },
  ],
  totals: {
    subtotal: '359.97',
    discountTotal: '0.00',
    fulfillmentTotal: '0.00',
    taxTotal: '28.80',
    grandTotal: '388.77',
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
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
          products: [mockCart.products[0]],
          totals: {
            ...mockCart.totals,
            subtotal: '299.99',
            taxTotal: '24.00',
            grandTotal: '323.99',
          },
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
          ...mockCart,
          id: 'cart-empty',
          products: [],
          totals: {
            subtotal: '0.00',
            discountTotal: '0.00',
            fulfillmentTotal: '0.00',
            taxTotal: '0.00',
            grandTotal: '0.00',
          },
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
          products: Array(5).fill(mockCart.products[0]).map((item, i) => ({
            ...item,
            sku: String(1001 + i),
            quantity: i + 1,
            lineTotal: (299.99 * (i + 1)).toFixed(2),
          })),
          totals: {
            ...mockCart.totals,
            subtotal: '4499.85',
            taxTotal: '360.00',
            grandTotal: '4859.85',
          },
        }}
      />
    </div>
  </Wrapper>
);
