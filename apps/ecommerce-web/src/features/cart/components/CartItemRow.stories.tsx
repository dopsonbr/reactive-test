import type { Story } from '@ladle/react';
import { CartItemRow } from './CartItemRow';
import type { CartItem } from '../types';

const mockItem: CartItem = {
  sku: '1001',
  name: 'Wireless Headphones',
  description: 'High-quality wireless headphones',
  unitPrice: '299.99',
  originalUnitPrice: '349.99',
  quantity: 1,
  availableQuantity: 50,
  imageUrl: 'https://via.placeholder.com/100?text=Product',
  category: 'Electronics',
  lineTotal: '299.99',
  inStock: true,
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
      item={{ ...mockItem, quantity: 3, lineTotal: '899.97' }}
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
