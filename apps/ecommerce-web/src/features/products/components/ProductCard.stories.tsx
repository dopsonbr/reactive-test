import type { Story } from '@ladle/react';
import { MemoryRouter } from 'react-router-dom';
import { ProductCard } from './ProductCard';
import type { Product } from '../types';

const mockProduct: Product = {
  sku: 'SKU-001',
  name: 'Wireless Headphones',
  description: 'High-quality wireless headphones with noise cancellation and 30-hour battery life.',
  price: 299.99,
  imageUrl: 'https://via.placeholder.com/300x200?text=Headphones',
  category: 'Electronics',
  inStock: true,
};

function Wrapper({ children }: { children: React.ReactNode }) {
  return <MemoryRouter>{children}</MemoryRouter>;
}

export const Default: Story = () => (
  <Wrapper>
    <div className="max-w-sm">
      <ProductCard
        product={mockProduct}
        onAddToCart={(sku) => console.log('Add to cart:', sku)}
      />
    </div>
  </Wrapper>
);

export const WithDiscount: Story = () => (
  <Wrapper>
    <div className="max-w-sm">
      <ProductCard
        product={{ ...mockProduct, originalPrice: 399.99 }}
        onAddToCart={() => {}}
      />
    </div>
  </Wrapper>
);

export const OutOfStock: Story = () => (
  <Wrapper>
    <div className="max-w-sm">
      <ProductCard
        product={{ ...mockProduct, inStock: false }}
        onAddToCart={() => {}}
      />
    </div>
  </Wrapper>
);

export const AddingToCart: Story = () => (
  <Wrapper>
    <div className="max-w-sm">
      <ProductCard
        product={mockProduct}
        onAddToCart={() => {}}
        isAddingToCart
      />
    </div>
  </Wrapper>
);

export const LongName: Story = () => (
  <Wrapper>
    <div className="max-w-sm">
      <ProductCard
        product={{
          ...mockProduct,
          name: 'Premium Wireless Noise-Cancelling Over-Ear Headphones with Extended Battery Life',
        }}
        onAddToCart={() => {}}
      />
    </div>
  </Wrapper>
);
