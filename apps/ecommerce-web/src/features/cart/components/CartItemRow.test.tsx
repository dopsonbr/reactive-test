import { render, screen, fireEvent } from '@testing-library/react';
import { CartItemRow } from './CartItemRow';
import type { CartItem } from '../types';

const mockItem: CartItem = {
  sku: 'SKU-001',
  name: 'Test Product',
  price: 99.99,
  quantity: 2,
  imageUrl: 'https://example.com/image.jpg',
};

function renderCartItemRow(props: Partial<Parameters<typeof CartItemRow>[0]> = {}) {
  const defaultProps = {
    item: mockItem,
    onUpdateQuantity: vi.fn(),
    onRemove: vi.fn(),
    ...props,
  };
  return render(<CartItemRow {...defaultProps} />);
}

describe('CartItemRow', () => {
  it('renders item information', () => {
    renderCartItemRow();

    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('SKU: SKU-001')).toBeInTheDocument();
  });

  it('renders calculated total price (price * quantity)', () => {
    renderCartItemRow();

    // 99.99 * 2 = 199.98
    expect(screen.getByText('$199.98')).toBeInTheDocument();
  });

  it('renders quantity input with correct value', () => {
    renderCartItemRow();

    const input = screen.getByTestId('item-quantity');
    expect(input).toHaveValue(2);
  });

  it('calls onUpdateQuantity when increase button is clicked', () => {
    const onUpdateQuantity = vi.fn();
    renderCartItemRow({ onUpdateQuantity });

    fireEvent.click(screen.getByRole('button', { name: /increase quantity/i }));

    expect(onUpdateQuantity).toHaveBeenCalledWith(3);
  });

  it('calls onUpdateQuantity when decrease button is clicked', () => {
    const onUpdateQuantity = vi.fn();
    renderCartItemRow({ onUpdateQuantity });

    fireEvent.click(screen.getByRole('button', { name: /decrease quantity/i }));

    expect(onUpdateQuantity).toHaveBeenCalledWith(1);
  });

  it('disables decrease button when quantity is 1', () => {
    renderCartItemRow({
      item: { ...mockItem, quantity: 1 },
    });

    expect(screen.getByRole('button', { name: /decrease quantity/i })).toBeDisabled();
  });

  it('calls onRemove when remove button is clicked', () => {
    const onRemove = vi.fn();
    renderCartItemRow({ onRemove });

    fireEvent.click(screen.getByRole('button', { name: /remove/i }));

    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it('disables all buttons when isUpdating is true', () => {
    renderCartItemRow({ isUpdating: true });

    expect(screen.getByRole('button', { name: /increase quantity/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /decrease quantity/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /remove/i })).toBeDisabled();
    expect(screen.getByTestId('item-quantity')).toBeDisabled();
  });

  it('has correct test id based on sku', () => {
    renderCartItemRow();

    expect(screen.getByTestId('cart-item-SKU-001')).toBeInTheDocument();
  });

  it('updates quantity when input value changes', () => {
    const onUpdateQuantity = vi.fn();
    renderCartItemRow({ onUpdateQuantity });

    const input = screen.getByTestId('item-quantity');
    fireEvent.change(input, { target: { value: '5' } });

    expect(onUpdateQuantity).toHaveBeenCalledWith(5);
  });

  it('does not update quantity when input value is less than 1', () => {
    const onUpdateQuantity = vi.fn();
    renderCartItemRow({ onUpdateQuantity });

    const input = screen.getByTestId('item-quantity');
    fireEvent.change(input, { target: { value: '0' } });

    expect(onUpdateQuantity).not.toHaveBeenCalled();
  });
});
