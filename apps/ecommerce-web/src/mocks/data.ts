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
    sku: 'SKU-001',
    name: 'Wireless Headphones',
    description: 'Premium noise-canceling wireless headphones with 30-hour battery life and crystal-clear sound quality.',
    price: 299.99,
    originalPrice: 349.99,
    imageUrl: placeholderImage('Headphones', '#dbeafe'),
    inStock: true,
    quantity: 50,
    category: 'Electronics',
  },
  {
    sku: 'SKU-002',
    name: 'Smart Watch',
    description: 'Fitness tracking smartwatch with heart rate monitor, GPS, and 7-day battery life.',
    price: 199.99,
    imageUrl: placeholderImage('Smart Watch', '#dbeafe'),
    inStock: true,
    quantity: 30,
    category: 'Electronics',
  },
  {
    sku: 'SKU-003',
    name: 'Laptop Stand',
    description: 'Ergonomic aluminum laptop stand with adjustable height and improved airflow cooling.',
    price: 79.99,
    imageUrl: placeholderImage('Laptop Stand', '#dbeafe'),
    inStock: true,
    quantity: 100,
    category: 'Electronics',
  },
  {
    sku: 'SKU-004',
    name: 'Mechanical Keyboard',
    description: 'RGB mechanical keyboard with Cherry MX switches and programmable macros.',
    price: 149.99,
    originalPrice: 179.99,
    imageUrl: placeholderImage('Keyboard', '#dbeafe'),
    inStock: true,
    quantity: 25,
    category: 'Electronics',
  },
  {
    sku: 'SKU-005',
    name: 'Running Shoes',
    description: 'Lightweight running shoes with responsive cushioning and breathable mesh upper.',
    price: 129.99,
    imageUrl: placeholderImage('Running Shoes', '#dcfce7'),
    inStock: true,
    quantity: 75,
    category: 'Sports',
  },
  {
    sku: 'SKU-006',
    name: 'Yoga Mat',
    description: 'Premium non-slip yoga mat with extra cushioning and alignment guides.',
    price: 49.99,
    imageUrl: placeholderImage('Yoga Mat', '#dcfce7'),
    inStock: true,
    quantity: 200,
    category: 'Sports',
  },
  {
    sku: 'SKU-007',
    name: 'Cotton T-Shirt',
    description: 'Soft 100% organic cotton t-shirt in classic fit.',
    price: 29.99,
    imageUrl: placeholderImage('T-Shirt', '#fef3c7'),
    inStock: true,
    quantity: 500,
    category: 'Clothing',
  },
  {
    sku: 'SKU-008',
    name: 'Denim Jacket',
    description: 'Classic denim jacket with vintage wash and button closure.',
    price: 89.99,
    originalPrice: 119.99,
    imageUrl: placeholderImage('Denim Jacket', '#fef3c7'),
    inStock: false,
    quantity: 0,
    category: 'Clothing',
  },
  {
    sku: 'SKU-009',
    name: 'Ceramic Planter',
    description: 'Hand-crafted ceramic planter perfect for indoor plants.',
    price: 34.99,
    imageUrl: placeholderImage('Planter', '#fce7f3'),
    inStock: true,
    quantity: 60,
    category: 'Home',
  },
  {
    sku: 'SKU-010',
    name: 'Throw Blanket',
    description: 'Cozy knitted throw blanket in neutral tones.',
    price: 59.99,
    imageUrl: placeholderImage('Blanket', '#fce7f3'),
    inStock: true,
    quantity: 40,
    category: 'Home',
  },
];

// Create a mutable cart state for MSW
export const mockCart: Cart = {
  id: 'cart-001',
  items: [],
  subtotal: 0,
  tax: 0,
  total: 0,
};

export function calculateCartTotals(cart: Cart): Cart {
  const subtotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.08; // 8% tax
  return {
    ...cart,
    subtotal,
    tax,
    total: subtotal + tax,
  };
}

export function resetMockCart(): void {
  mockCart.items = [];
  mockCart.subtotal = 0;
  mockCart.tax = 0;
  mockCart.total = 0;
}
