import type { Story } from '@ladle/react';
import { CartItemRow } from './CartItemRow';
import type { CartItem } from '../types';

const mockItem: CartItem = {
  sku: 'SKU-001',
  name: 'Wireless Headphones',
  price: 299.99,
  quantity: 1,
  imageUrl: 'https://via.placeholder.com/100?text=Product',
};

export const Default: Story = () => (
  <div className="max-w-2xl">
    <CartItemRow
      item={mockItem}
      onUpdateQuantity={(qty) => console.log('Update quantity:', qty)}
      onRemove={() => console.log('Remove item')}
    />
  </div>
);

export const MultipleQuantity: Story = () => (
  <div className="max-w-2xl">
    <CartItemRow
      item={{ ...mockItem, quantity: 3 }}
      onUpdateQuantity={() => {}}
      onRemove={() => {}}
    />
  </div>
);

export const Updating: Story = () => (
  <div className="max-w-2xl">
    <CartItemRow
      item={mockItem}
      onUpdateQuantity={() => {}}
      onRemove={() => {}}
      isUpdating
    />
  </div>
);

export const MinQuantity: Story = () => (
  <div className="max-w-2xl">
    <CartItemRow
      item={{ ...mockItem, quantity: 1 }}
      onUpdateQuantity={() => {}}
      onRemove={() => {}}
    />
  </div>
);
