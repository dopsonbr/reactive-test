import { http, HttpResponse } from 'msw';
import type { Cart, CartItem, AddToCartRequest, UpdateCartItemRequest } from '@reactive-platform/commerce-hooks';
import { mockProducts } from '../data/products';

const API_BASE = 'http://localhost:8081';

// In-memory cart storage for the mock
const carts = new Map<string, Cart>();

function calculateCartTotals(items: CartItem[]): { subtotal: number; tax: number; total: number; itemCount: number } {
  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const tax = subtotal * 0.08; // 8% tax
  const total = subtotal + tax;
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  return { subtotal, tax, total, itemCount };
}

export const cartHandlers = [
  // POST /api/carts - Create new cart
  http.post(`${API_BASE}/api/carts`, () => {
    const cartId = `cart-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const newCart: Cart = {
      id: cartId,
      items: [],
      subtotal: 0,
      tax: 0,
      total: 0,
      itemCount: 0,
    };
    carts.set(cartId, newCart);
    return HttpResponse.json<Cart>(newCart);
  }),

  // GET /api/carts/:id - Get cart
  http.get(`${API_BASE}/api/carts/:id`, ({ params }) => {
    const { id } = params;
    const cart = carts.get(id as string);

    if (!cart) {
      return new HttpResponse(null, {
        status: 404,
        statusText: 'Cart not found',
      });
    }

    return HttpResponse.json<Cart>(cart);
  }),

  // POST /api/carts/:id/items - Add item to cart
  http.post(`${API_BASE}/api/carts/:id/items`, async ({ params, request }) => {
    const { id } = params;
    const cart = carts.get(id as string);

    if (!cart) {
      return new HttpResponse(null, {
        status: 404,
        statusText: 'Cart not found',
      });
    }

    const body = (await request.json()) as AddToCartRequest;
    const product = mockProducts.find((p) => p.sku === body.sku);

    if (!product) {
      return new HttpResponse(null, {
        status: 404,
        statusText: 'Product not found',
      });
    }

    // Check if item already exists
    const existingItemIndex = cart.items.findIndex((item) => item.sku === body.sku);

    if (existingItemIndex >= 0) {
      // Update quantity
      const newQuantity = cart.items[existingItemIndex].quantity + body.quantity;
      cart.items[existingItemIndex].quantity = newQuantity;
      cart.items[existingItemIndex].lineTotal = newQuantity * product.price;
    } else {
      // Add new item
      const newItem: CartItem = {
        sku: product.sku,
        name: product.name,
        price: product.price,
        quantity: body.quantity,
        imageUrl: product.imageUrl,
        lineTotal: product.price * body.quantity,
      };
      cart.items.push(newItem);
    }

    // Recalculate totals
    Object.assign(cart, calculateCartTotals(cart.items));

    return HttpResponse.json<Cart>(cart);
  }),

  // PUT /api/carts/:id/items/:sku - Update cart item quantity
  http.put(`${API_BASE}/api/carts/:id/items/:sku`, async ({ params, request }) => {
    const { id, sku } = params;
    const cart = carts.get(id as string);

    if (!cart) {
      return new HttpResponse(null, {
        status: 404,
        statusText: 'Cart not found',
      });
    }

    const body = (await request.json()) as UpdateCartItemRequest;
    const itemIndex = cart.items.findIndex((item) => item.sku === sku);

    if (itemIndex < 0) {
      return new HttpResponse(null, {
        status: 404,
        statusText: 'Item not found in cart',
      });
    }

    if (body.quantity <= 0) {
      // Remove item if quantity is 0 or negative
      cart.items.splice(itemIndex, 1);
    } else {
      // Update quantity
      cart.items[itemIndex].quantity = body.quantity;
      cart.items[itemIndex].lineTotal = cart.items[itemIndex].price * body.quantity;
    }

    // Recalculate totals
    Object.assign(cart, calculateCartTotals(cart.items));

    return HttpResponse.json<Cart>(cart);
  }),

  // DELETE /api/carts/:id/items/:sku - Remove item from cart
  http.delete(`${API_BASE}/api/carts/:id/items/:sku`, ({ params }) => {
    const { id, sku } = params;
    const cart = carts.get(id as string);

    if (!cart) {
      return new HttpResponse(null, {
        status: 404,
        statusText: 'Cart not found',
      });
    }

    const itemIndex = cart.items.findIndex((item) => item.sku === sku);

    if (itemIndex < 0) {
      return new HttpResponse(null, {
        status: 404,
        statusText: 'Item not found in cart',
      });
    }

    cart.items.splice(itemIndex, 1);

    // Recalculate totals
    Object.assign(cart, calculateCartTotals(cart.items));

    return HttpResponse.json<Cart>(cart);
  }),

  // POST /api/carts/:id/clear - Clear all items from cart
  http.post(`${API_BASE}/api/carts/:id/clear`, ({ params }) => {
    const { id } = params;
    const cart = carts.get(id as string);

    if (!cart) {
      return new HttpResponse(null, {
        status: 404,
        statusText: 'Cart not found',
      });
    }

    cart.items = [];
    Object.assign(cart, calculateCartTotals([]));

    return HttpResponse.json<Cart>(cart);
  }),
];
