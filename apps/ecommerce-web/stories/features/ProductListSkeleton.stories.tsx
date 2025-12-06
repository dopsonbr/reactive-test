import type { Story } from '@ladle/react';
import { ProductListSkeleton } from '../../src/features/products/components/ProductListSkeleton';

export default {
  title: 'Features/Products/ProductListSkeleton',
};

export const Default: Story = () => <ProductListSkeleton />;

export const FourItems: Story = () => <ProductListSkeleton count={4} />;

export const TwoItems: Story = () => <ProductListSkeleton count={2} />;
