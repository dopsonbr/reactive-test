import type { Product } from '../features/products/types/product';
import type { Cart } from '../features/cart/types/cart';

// Generate a placeholder SVG image as a data URI
function placeholderImage(text: string, bgColor: string = '#e2e8f0'): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
    <rect width="400" height="400" fill="${bgColor}"/>
    <text x="200" y="200" font-family="system-ui, sans-serif" font-size="24" font-weight="500" fill="#64748b" text-anchor="middle" dominant-baseline="middle">${text}</text>
  </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export const mockProducts: Product[] = [
  {
    sku: 1001,
    name: 'Wireless Headphones',
    description: 'Premium noise-canceling wireless headphones with 30-hour battery life and crystal-clear sound quality.',
    price: '299.99',
    originalPrice: '349.99',
    availableQuantity: 50,
    imageUrl: placeholderImage('Headphones', '#dbeafe'),
    category: 'Electronics',
    inStock: true,
    onSale: true,
  },
  {
    sku: 1002,
    name: 'Smart Watch',
    description: 'Fitness tracking smartwatch with heart rate monitor, GPS, and 7-day battery life.',
    price: '199.99',
    availableQuantity: 30,
    imageUrl: placeholderImage('Smart Watch', '#dbeafe'),
    category: 'Electronics',
    inStock: true,
    onSale: false,
  },
  {
    sku: 1003,
    name: 'Laptop Stand',
    description: 'Ergonomic aluminum laptop stand with adjustable height and improved airflow cooling.',
    price: '79.99',
    availableQuantity: 100,
    imageUrl: placeholderImage('Laptop Stand', '#dbeafe'),
    category: 'Electronics',
    inStock: true,
    onSale: false,
  },
  {
    sku: 1004,
    name: 'Mechanical Keyboard',
    description: 'RGB mechanical keyboard with Cherry MX switches and programmable macros.',
    price: '149.99',
    originalPrice: '179.99',
    availableQuantity: 25,
    imageUrl: placeholderImage('Keyboard', '#dbeafe'),
    category: 'Electronics',
    inStock: true,
    onSale: true,
  },
  {
    sku: 1005,
    name: 'Running Shoes',
    description: 'Lightweight running shoes with responsive cushioning and breathable mesh upper.',
    price: '129.99',
    availableQuantity: 75,
    imageUrl: placeholderImage('Running Shoes', '#dcfce7'),
    category: 'Sports',
    inStock: true,
    onSale: false,
  },
  {
    sku: 1006,
    name: 'Yoga Mat',
    description: 'Premium non-slip yoga mat with extra cushioning and alignment guides.',
    price: '49.99',
    availableQuantity: 200,
    imageUrl: placeholderImage('Yoga Mat', '#dcfce7'),
    category: 'Sports',
    inStock: true,
    onSale: false,
  },
  {
    sku: 1007,
    name: 'Cotton T-Shirt',
    description: 'Soft 100% organic cotton t-shirt in classic fit.',
    price: '29.99',
    availableQuantity: 500,
    imageUrl: placeholderImage('T-Shirt', '#fef3c7'),
    category: 'Clothing',
    inStock: true,
    onSale: false,
  },
  {
    sku: 1008,
    name: 'Denim Jacket',
    description: 'Classic denim jacket with vintage wash and button closure.',
    price: '89.99',
    originalPrice: '119.99',
    availableQuantity: 0,
    imageUrl: placeholderImage('Denim Jacket', '#fef3c7'),
    category: 'Clothing',
    inStock: false,
    onSale: true,
  },
  {
    sku: 1009,
    name: 'Ceramic Planter',
    description: 'Hand-crafted ceramic planter perfect for indoor plants.',
    price: '34.99',
    availableQuantity: 60,
    imageUrl: placeholderImage('Planter', '#fce7f3'),
    category: 'Home',
    inStock: true,
    onSale: false,
  },
  {
    sku: 1010,
    name: 'Throw Blanket',
    description: 'Cozy knitted throw blanket in neutral tones.',
    price: '59.99',
    availableQuantity: 40,
    imageUrl: placeholderImage('Blanket', '#fce7f3'),
    category: 'Home',
    inStock: true,
    onSale: false,
  },
];

// Create a mutable cart state for MSW
export const mockCart: Cart = {
  id: 'cart-001',
  storeNumber: 1,
  products: [],
  totals: {
    subtotal: '0.00',
    discountTotal: '0.00',
    fulfillmentTotal: '0.00',
    taxTotal: '0.00',
    grandTotal: '0.00',
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export function calculateCartTotals(cart: Cart): Cart {
  const subtotal = cart.products.reduce((sum, item) => {
    return sum + parseFloat(item.lineTotal);
  }, 0);
  const tax = subtotal * 0.08; // 8% tax
  const grandTotal = subtotal + tax;

  return {
    ...cart,
    totals: {
      subtotal: subtotal.toFixed(2),
      discountTotal: '0.00',
      fulfillmentTotal: '0.00',
      taxTotal: tax.toFixed(2),
      grandTotal: grandTotal.toFixed(2),
    },
    updatedAt: new Date().toISOString(),
  };
}

export function resetMockCart(): void {
  mockCart.products = [];
  mockCart.totals = {
    subtotal: '0.00',
    discountTotal: '0.00',
    fulfillmentTotal: '0.00',
    taxTotal: '0.00',
    grandTotal: '0.00',
  };
  mockCart.updatedAt = new Date().toISOString();
}
