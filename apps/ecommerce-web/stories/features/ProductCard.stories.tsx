import type { Story } from '@ladle/react';
import { ProductCard } from '../../src/features/products/components/ProductCard';
import { mockProducts } from '../../src/mocks/data';

export default {
  title: 'Features/Products/ProductCard',
};

const defaultProduct = mockProducts[0];

export const Default: Story = () => (
  <div className="w-72">
    <ProductCard product={defaultProduct} onAddToCart={() => alert('Added to cart!')} />
  </div>
);

export const OutOfStock: Story = () => (
  <div className="w-72">
    <ProductCard
      product={{ ...defaultProduct, inStock: false, quantity: 0 }}
      onAddToCart={() => {}}
    />
  </div>
);

export const OnSale: Story = () => (
  <div className="w-72">
    <ProductCard
      product={{ ...defaultProduct, originalPrice: 349.99 }}
      onAddToCart={() => alert('Added to cart!')}
    />
  </div>
);

export const Loading: Story = () => (
  <div className="w-72">
    <ProductCard
      product={defaultProduct}
      onAddToCart={() => {}}
      isAddingToCart={true}
    />
  </div>
);

export const LongTitle: Story = () => (
  <div className="w-72">
    <ProductCard
      product={{
        ...defaultProduct,
        name: 'Premium Wireless Noise-Canceling Over-Ear Headphones with Extended Battery Life',
      }}
      onAddToCart={() => alert('Added to cart!')}
    />
  </div>
);
