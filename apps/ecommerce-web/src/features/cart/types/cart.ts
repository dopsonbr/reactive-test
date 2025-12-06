export interface CartItem {
  sku: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
}

export interface Cart {
  id: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
}

export interface AddToCartRequest {
  sku: string;
  quantity: number;
}

export interface UpdateCartItemRequest {
  sku: string;
  quantity: number;
}
