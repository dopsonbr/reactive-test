import { screen, fireEvent } from '@testing-library/react';
import { renderWithRouter } from '../../../test/test-utils';
import { ProductCard } from './ProductCard';
import type { Product } from '../types';

const mockProduct: Product = {
  sku: 1001,
  name: 'Test Product',
  description: 'A test product description',
  price: '99.99',
  originalPrice: '129.99',
  availableQuantity: 50,
  imageUrl: 'https://example.com/image.jpg',
  category: 'Electronics',
  inStock: true,
  onSale: true,
};

async function renderProductCard(props: Partial<Parameters<typeof ProductCard>[0]> = {}) {
  return renderWithRouter(
    <ProductCard product={mockProduct} onAddToCart={vi.fn()} {...props} />
  );
}

describe('ProductCard', () => {
  it('renders product information', async () => {
    await renderProductCard();

    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('A test product description')).toBeInTheDocument();
    expect(screen.getByText('$99.99')).toBeInTheDocument();
    expect(screen.getByText('Electronics')).toBeInTheDocument();
  });

  it('renders product image with correct alt text', async () => {
    await renderProductCard();

    const image = screen.getByRole('img');
    expect(image).toHaveAttribute('alt', 'Test Product');
    expect(image).toHaveAttribute('src', 'https://example.com/image.jpg');
  });

  it('renders Add to Cart button when in stock', async () => {
    await renderProductCard();

    const button = screen.getByRole('button', { name: /add to cart/i });
    expect(button).toBeInTheDocument();
    expect(button).toBeEnabled();
  });

  it('disables button when out of stock', async () => {
    await renderProductCard({
      product: { ...mockProduct, inStock: false },
    });

    const button = screen.getByRole('button', { name: /out of stock/i });
    expect(button).toBeDisabled();
  });

  it('calls onAddToCart with sku when button is clicked', async () => {
    const onAddToCart = vi.fn();
    await renderProductCard({ onAddToCart });

    fireEvent.click(screen.getByRole('button', { name: /add to cart/i }));

    expect(onAddToCart).toHaveBeenCalledWith(1001);
  });

  it('shows loading state when adding to cart', async () => {
    await renderProductCard({ isAddingToCart: true });

    const button = screen.getByRole('button', { name: /adding/i });
    expect(button).toBeDisabled();
  });

  it('renders original price with strikethrough when on sale', async () => {
    await renderProductCard({
      product: { ...mockProduct, originalPrice: '149.99' },
    });

    expect(screen.getByText('$149.99')).toHaveClass('line-through');
  });

  it('does not render original price when not on sale', async () => {
    const productWithoutOriginalPrice: Product = {
      ...mockProduct,
      originalPrice: undefined,
      onSale: false,
    };
    await renderProductCard({ product: productWithoutOriginalPrice });

    // Check that no element with line-through class contains a price
    const priceElements = screen.queryAllByText(/\$\d+\.\d{2}/);
    const strikeThroughPrices = priceElements.filter(el => el.classList.contains('line-through'));
    expect(strikeThroughPrices).toHaveLength(0);
  });

  it('has correct test id based on sku', async () => {
    await renderProductCard();

    expect(screen.getByTestId('product-card-1001')).toBeInTheDocument();
  });
});
