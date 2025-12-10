export interface CartItem {
  sku: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  lineTotal: number;
}

export interface Cart {
  id: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  itemCount: number;
}

export interface AddToCartRequest {
  sku: string;
  quantity: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}
