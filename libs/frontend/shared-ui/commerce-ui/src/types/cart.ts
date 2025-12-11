import { Product } from './product';

/**
 * Cart item representing a product in the shopping cart
 */
export interface CartItem {
  sku: string;
  quantity: number;
  product: Product;
  appliedDiscounts?: AppliedDiscount[];
  subtotal: number;
  lineTotal: number;
}

/**
 * Applied discount on a cart item or cart
 */
export interface AppliedDiscount {
  type: 'loyalty' | 'promo' | 'markdown';
  description: string;
  amount: number;
}
