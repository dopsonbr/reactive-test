import type { Story } from '@ladle/react';
import { Search, ShoppingBag } from 'lucide-react';
import { EmptyState } from '../../src/shared/components/EmptyState';

export default {
  title: 'Features/Shared/EmptyState',
};

export const Default: Story = () => (
  <div className="max-w-md">
    <EmptyState message="No items found" />
  </div>
);

export const NoSearchResults: Story = () => (
  <div className="max-w-md">
    <EmptyState
      message="No products match your search"
      icon={<Search className="h-12 w-12 text-muted-foreground" />}
    />
  </div>
);

export const NoOrders: Story = () => (
  <div className="max-w-md">
    <EmptyState
      message="You haven't placed any orders yet"
      icon={<ShoppingBag className="h-12 w-12 text-muted-foreground" />}
    />
  </div>
);
