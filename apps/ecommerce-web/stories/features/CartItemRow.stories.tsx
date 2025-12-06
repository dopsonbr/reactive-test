import type { Story } from '@ladle/react';
import { CartItemRow } from '../../src/features/cart/components/CartItemRow';
import { mockProducts } from '../../src/mocks/data';

export default {
  title: 'Features/Cart/CartItemRow',
};

const mockCartItem = {
  sku: mockProducts[0].sku,
  name: mockProducts[0].name,
  price: mockProducts[0].price,
  quantity: 2,
  imageUrl: mockProducts[0].imageUrl,
};

export const Default: Story = () => (
  <div className="max-w-2xl">
    <CartItemRow
      item={mockCartItem}
      onUpdateQuantity={(qty) => alert(`Updated quantity to ${qty}`)}
      onRemove={() => alert('Removed')}
    />
  </div>
);

export const SingleItem: Story = () => (
  <div className="max-w-2xl">
    <CartItemRow
      item={{ ...mockCartItem, quantity: 1 }}
      onUpdateQuantity={(qty) => alert(`Updated quantity to ${qty}`)}
      onRemove={() => alert('Removed')}
    />
  </div>
);

export const Updating: Story = () => (
  <div className="max-w-2xl">
    <CartItemRow
      item={mockCartItem}
      onUpdateQuantity={() => {}}
      onRemove={() => {}}
      isUpdating={true}
    />
  </div>
);

export const HighQuantity: Story = () => (
  <div className="max-w-2xl">
    <CartItemRow
      item={{ ...mockCartItem, quantity: 99 }}
      onUpdateQuantity={(qty) => alert(`Updated quantity to ${qty}`)}
      onRemove={() => alert('Removed')}
    />
  </div>
);
