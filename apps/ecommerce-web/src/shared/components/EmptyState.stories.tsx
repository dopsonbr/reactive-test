import type { Story } from '@ladle/react';
import { ShoppingCart, Search, Package } from 'lucide-react';
import { EmptyState } from './EmptyState';

export const Default: Story = () => (
  <div className="max-w-md">
    <EmptyState message="No items found" />
  </div>
);

export const WithShoppingCartIcon: Story = () => (
  <div className="max-w-md">
    <EmptyState
      message="Your cart is empty"
      icon={<ShoppingCart className="h-12 w-12 text-muted-foreground" />}
    />
  </div>
);

export const WithSearchIcon: Story = () => (
  <div className="max-w-md">
    <EmptyState
      message="No search results found"
      icon={<Search className="h-12 w-12 text-muted-foreground" />}
    />
  </div>
);

export const WithPackageIcon: Story = () => (
  <div className="max-w-md">
    <EmptyState
      message="No products available"
      icon={<Package className="h-12 w-12 text-muted-foreground" />}
    />
  </div>
);
