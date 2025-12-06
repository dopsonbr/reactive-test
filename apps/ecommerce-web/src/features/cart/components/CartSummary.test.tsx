import { screen } from '@testing-library/react';
import { renderWithRouter } from '../../../test/test-utils';
import { CartSummary } from './CartSummary';
import type { Cart } from '../types';

const mockCart: Cart = {
  id: 'cart-001',
  items: [
    { sku: 'SKU-001', name: 'Product 1', price: 100, quantity: 2, imageUrl: '' },
    { sku: 'SKU-002', name: 'Product 2', price: 50, quantity: 1, imageUrl: '' },
  ],
  subtotal: 250,
  tax: 20,
  total: 270,
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
      items: [{ sku: 'SKU-001', name: 'Product', price: 100, quantity: 1, imageUrl: '' }],
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
      items: [],
    };

    await renderCartSummary(emptyCart);

    expect(screen.getByRole('button', { name: /proceed to checkout/i })).toBeDisabled();
  });

  it('renders continue shopping link', async () => {
    await renderCartSummary();

    expect(screen.getByRole('button', { name: /continue shopping/i })).toBeInTheDocument();
  });
});
