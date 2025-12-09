import { screen } from '@testing-library/react';
import { renderWithRouter } from '../../../test/test-utils';
import { CartSummary } from './CartSummary';
import type { Cart } from '../types';

const mockCart: Cart = {
  id: 'cart-001',
  storeNumber: 1,
  products: [
    {
      sku: 1001,
      name: 'Product 1',
      description: 'Product 1 description',
      unitPrice: '100.00',
      originalUnitPrice: '120.00',
      quantity: 2,
      availableQuantity: 50,
      imageUrl: '',
      category: 'Electronics',
      lineTotal: '200.00',
      inStock: true
    },
    {
      sku: 1002,
      name: 'Product 2',
      description: 'Product 2 description',
      unitPrice: '50.00',
      quantity: 1,
      availableQuantity: 30,
      imageUrl: '',
      category: 'Electronics',
      lineTotal: '50.00',
      inStock: true
    },
  ],
  totals: {
    subtotal: '250.00',
    discountTotal: '0.00',
    fulfillmentTotal: '0.00',
    taxTotal: '20.00',
    grandTotal: '270.00'
  },
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

async function renderCartSummary(cart: Cart = mockCart) {
  return renderWithRouter(<CartSummary cart={cart} />);
}

describe('CartSummary', () => {
  it('renders order summary heading', async () => {
    await renderCartSummary();

    expect(screen.getByText('Order Summary')).toBeInTheDocument();
  });

  it('renders correct item count (total quantity)', async () => {
    await renderCartSummary();

    // 2 + 1 = 3 items
    expect(screen.getByText(/3 items/)).toBeInTheDocument();
  });

  it('renders singular "item" when count is 1', async () => {
    const singleItemCart: Cart = {
      ...mockCart,
      products: [{
        sku: 1001,
        name: 'Product',
        description: 'Product description',
        unitPrice: '100.00',
        quantity: 1,
        availableQuantity: 50,
        imageUrl: '',
        category: 'Electronics',
        lineTotal: '100.00',
        inStock: true
      }],
    };

    await renderCartSummary(singleItemCart);

    expect(screen.getByText(/1 item\)/)).toBeInTheDocument();
  });

  it('renders subtotal', async () => {
    await renderCartSummary();

    expect(screen.getByText('$250.00')).toBeInTheDocument();
  });

  it('renders tax', async () => {
    await renderCartSummary();

    expect(screen.getByText('$20.00')).toBeInTheDocument();
  });

  it('renders free shipping', async () => {
    await renderCartSummary();

    expect(screen.getByText('Free')).toBeInTheDocument();
  });

  it('renders total with test id', async () => {
    await renderCartSummary();

    const total = screen.getByTestId('cart-total');
    expect(total).toHaveTextContent('$270.00');
  });

  it('renders checkout button', async () => {
    await renderCartSummary();

    expect(screen.getByRole('button', { name: /proceed to checkout/i })).toBeInTheDocument();
  });

  it('disables checkout button when cart is empty', async () => {
    const emptyCart: Cart = {
      ...mockCart,
      products: [],
    };

    await renderCartSummary(emptyCart);

    expect(screen.getByRole('button', { name: /proceed to checkout/i })).toBeDisabled();
  });

  it('renders continue shopping link', async () => {
    await renderCartSummary();

    expect(screen.getByRole('button', { name: /continue shopping/i })).toBeInTheDocument();
  });
});
