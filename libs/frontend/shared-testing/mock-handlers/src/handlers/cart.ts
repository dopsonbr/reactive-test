import { http, HttpResponse } from 'msw';
import type { Cart, CartProduct, CartTotals, AddToCartRequest, UpdateCartItemRequest } from '@reactive-platform/commerce-hooks';
import { mockProducts } from '../data/products';

const API_BASE = 'http://localhost:8081';

// In-memory cart storage for the mock
const carts = new Map<string, Cart>();

function calculateCartTotals(products: CartProduct[]): CartTotals {
  const subtotal = products.reduce((sum, item) => sum + item.lineTotal, 0);
  const taxTotal = subtotal * 0.08; // 8% tax
  const grandTotal = subtotal + taxTotal;
  return {
    subtotal,
    discountTotal: 0,
    fulfillmentTotal: 0,
    taxTotal,
    grandTotal,
  };
}

export const cartHandlers = [
  // POST /api/carts - Create new cart
  http.post(`${API_BASE}/api/carts`, () => {
    const cartId = `cart-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const newCart: Cart = {
      id: cartId,
      products: [],
      totals: {
        subtotal: 0,
        discountTotal: 0,
        fulfillmentTotal: 0,
        taxTotal: 0,
        grandTotal: 0,
      },
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

    // Check if item already exists (convert both to string for comparison since mock uses string SKUs)
    const existingItemIndex = cart.products.findIndex((item) => String(item.sku) === String(body.sku));

    if (existingItemIndex >= 0) {
      // Update quantity
      const newQuantity = cart.products[existingItemIndex].quantity + body.quantity;
      cart.products[existingItemIndex].quantity = newQuantity;
      cart.products[existingItemIndex].lineTotal = newQuantity * product.price;
    } else {
      // Add new item - convert string SKU to number for mock (using hash)
      const skuNum = typeof product.sku === 'string'
        ? parseInt(product.sku.replace(/\D/g, ''), 10) || Date.now()
        : product.sku;
      const newItem: CartProduct = {
        sku: skuNum,
        name: product.name,
        description: product.description,
        unitPrice: product.price,
        quantity: body.quantity,
        imageUrl: product.imageUrl,
        lineTotal: product.price * body.quantity,
      };
      cart.products.push(newItem);
    }

    // Recalculate totals
    cart.totals = calculateCartTotals(cart.products);

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
    const itemIndex = cart.products.findIndex((item) => String(item.sku) === String(sku));

    if (itemIndex < 0) {
      return new HttpResponse(null, {
        status: 404,
        statusText: 'Item not found in cart',
      });
    }

    if (body.quantity <= 0) {
      // Remove item if quantity is 0 or negative
      cart.products.splice(itemIndex, 1);
    } else {
      // Update quantity
      cart.products[itemIndex].quantity = body.quantity;
      cart.products[itemIndex].lineTotal = cart.products[itemIndex].unitPrice * body.quantity;
    }

    // Recalculate totals
    cart.totals = calculateCartTotals(cart.products);

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

    const itemIndex = cart.products.findIndex((item) => String(item.sku) === String(sku));

    if (itemIndex < 0) {
      return new HttpResponse(null, {
        status: 404,
        statusText: 'Item not found in cart',
      });
    }

    cart.products.splice(itemIndex, 1);

    // Recalculate totals
    cart.totals = calculateCartTotals(cart.products);

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

    cart.products = [];
    cart.totals = calculateCartTotals([]);

    return HttpResponse.json<Cart>(cart);
  }),
];
