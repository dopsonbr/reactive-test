import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { CartItemRow } from './CartItemRow';
import type { CartItem } from '../types';

expect.extend(toHaveNoViolations);

const mockItem: CartItem = {
  sku: 'SKU-001',
  name: 'Test Product',
  price: 99.99,
  quantity: 2,
  imageUrl: 'https://example.com/image.jpg',
};

describe('CartItemRow Accessibility', () => {
  it('has no accessibility violations', async () => {
    const { container } = render(
      <CartItemRow
        item={mockItem}
        onUpdateQuantity={vi.fn()}
        onRemove={vi.fn()}
      />
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('has no accessibility violations when updating', async () => {
    const { container } = render(
      <CartItemRow
        item={mockItem}
        onUpdateQuantity={vi.fn()}
        onRemove={vi.fn()}
        isUpdating
      />
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('has no accessibility violations at minimum quantity', async () => {
    const { container } = render(
      <CartItemRow
        item={{ ...mockItem, quantity: 1 }}
        onUpdateQuantity={vi.fn()}
        onRemove={vi.fn()}
      />
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
