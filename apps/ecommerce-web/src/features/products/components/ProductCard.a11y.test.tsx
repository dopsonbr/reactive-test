import { axe, toHaveNoViolations } from 'jest-axe';
import { renderWithRouter } from '../../../test/test-utils';
import { ProductCard } from './ProductCard';
import type { Product } from '../types';

expect.extend(toHaveNoViolations);

const mockProduct: Product = {
  sku: 'SKU-001',
  name: 'Test Product',
  description: 'A test product description',
  price: 99.99,
  imageUrl: 'https://example.com/image.jpg',
  category: 'Electronics',
  inStock: true,
};

describe('ProductCard Accessibility', () => {
  it('has no accessibility violations', async () => {
    const { container } = await renderWithRouter(
      <ProductCard product={mockProduct} onAddToCart={vi.fn()} />
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('has no accessibility violations when out of stock', async () => {
    const { container } = await renderWithRouter(
      <ProductCard
        product={{ ...mockProduct, inStock: false }}
        onAddToCart={vi.fn()}
      />
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('has no accessibility violations when adding to cart', async () => {
    const { container } = await renderWithRouter(
      <ProductCard
        product={mockProduct}
        onAddToCart={vi.fn()}
        isAddingToCart
      />
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
