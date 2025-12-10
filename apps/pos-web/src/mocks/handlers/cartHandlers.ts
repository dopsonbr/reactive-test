/**
 * Cart/Transaction MSW handlers for POS E2E testing
 */

import { http, HttpResponse, delay } from 'msw';
import { findProductBySku } from '../data/products';
import { findCustomerById, getB2BDiscount, getLoyaltyDiscount } from '../data/customers';

// In-memory cart state for testing
interface CartItem {
  id: string;
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  markdown?: {
    type: 'PERCENTAGE' | 'FIXED_AMOUNT';
    value: number;
    reason: string;
    authorizedBy?: string;
    authorizerName?: string;
  };
}

interface Cart {
  id: string;
  storeNumber: number;
  employeeId: string;
  customerId?: string;
  items: CartItem[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  grandTotal: number;
  status: 'ACTIVE' | 'CHECKOUT' | 'COMPLETE' | 'VOIDED';
  createdAt: Date;
  updatedAt: Date;
}

const activeCarts: Map<string, Cart> = new Map();

export const cartHandlers = [
  // Create new cart/transaction
  http.post('*/api/carts', async ({ request }) => {
    await delay(100);

    const body = (await request.json()) as {
      storeNumber: number;
      employeeId: string;
      customerId?: string;
    };

    const cartId = `cart-${Date.now()}`;
    const cart: Cart = {
      id: cartId,
      storeNumber: body.storeNumber,
      employeeId: body.employeeId,
      customerId: body.customerId,
      items: [],
      subtotal: 0,
      discountTotal: 0,
      taxTotal: 0,
      grandTotal: 0,
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    activeCarts.set(cartId, cart);

    return HttpResponse.json(formatCartResponse(cart), { status: 201 });
  }),

  // Get cart
  http.get('*/api/carts/:id', async ({ params }) => {
    await delay(50);

    const id = params.id as string;
    const cart = activeCarts.get(id);

    if (!cart) {
      return HttpResponse.json(
        { error: 'Cart not found', code: 'CART_NOT_FOUND' },
        { status: 404 }
      );
    }

    return HttpResponse.json(formatCartResponse(cart));
  }),

  // Add item to cart
  http.post('*/api/carts/:id/items', async ({ params, request }) => {
    await delay(100);

    const id = params.id as string;
    const body = (await request.json()) as { sku: string; quantity: number };
    const cart = activeCarts.get(id);

    if (!cart) {
      return HttpResponse.json(
        { error: 'Cart not found', code: 'CART_NOT_FOUND' },
        { status: 404 }
      );
    }

    if (cart.status !== 'ACTIVE') {
      return HttpResponse.json(
        { error: 'Cart is not active', code: 'CART_NOT_ACTIVE' },
        { status: 400 }
      );
    }

    const product = findProductBySku(body.sku);
    if (!product) {
      return HttpResponse.json(
        { error: 'Product not found', code: 'PRODUCT_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Check if item already in cart
    const existingItem = cart.items.find((i) => i.sku === body.sku);
    if (existingItem) {
      existingItem.quantity += body.quantity;
      existingItem.lineTotal = existingItem.unitPrice * existingItem.quantity;
    } else {
      // Apply customer discounts if applicable
      let unitPrice = product.price;
      if (cart.customerId) {
        const customer = findCustomerById(cart.customerId);
        if (customer?.type === 'B2B' && customer.b2bTier && product.b2bPricing) {
          const discount = getB2BDiscount(customer.b2bTier);
          unitPrice = product.price * (1 - discount / 100);
        }
      }

      cart.items.push({
        id: `item-${Date.now()}`,
        sku: body.sku,
        name: product.name,
        quantity: body.quantity,
        unitPrice: Math.round(unitPrice * 100) / 100,
        lineTotal: Math.round(unitPrice * body.quantity * 100) / 100,
      });
    }

    recalculateCart(cart);
    cart.updatedAt = new Date();

    return HttpResponse.json(formatCartResponse(cart));
  }),

  // Update item quantity
  http.patch('*/api/carts/:cartId/items/:itemId', async ({ params, request }) => {
    await delay(100);

    const { cartId, itemId } = params as { cartId: string; itemId: string };
    const body = (await request.json()) as { quantity: number };
    const cart = activeCarts.get(cartId);

    if (!cart) {
      return HttpResponse.json(
        { error: 'Cart not found', code: 'CART_NOT_FOUND' },
        { status: 404 }
      );
    }

    const item = cart.items.find((i) => i.id === itemId);
    if (!item) {
      return HttpResponse.json(
        { error: 'Item not found', code: 'ITEM_NOT_FOUND' },
        { status: 404 }
      );
    }

    if (body.quantity <= 0) {
      // Remove item
      cart.items = cart.items.filter((i) => i.id !== itemId);
    } else {
      item.quantity = body.quantity;
      const basePrice = item.markdown
        ? item.markdown.type === 'PERCENTAGE'
          ? item.unitPrice * (1 - item.markdown.value / 100)
          : item.unitPrice - item.markdown.value
        : item.unitPrice;
      item.lineTotal = Math.round(basePrice * item.quantity * 100) / 100;
    }

    recalculateCart(cart);
    cart.updatedAt = new Date();

    return HttpResponse.json(formatCartResponse(cart));
  }),

  // Remove item from cart
  http.delete('*/api/carts/:cartId/items/:itemId', async ({ params }) => {
    await delay(100);

    const { cartId, itemId } = params as { cartId: string; itemId: string };
    const cart = activeCarts.get(cartId);

    if (!cart) {
      return HttpResponse.json(
        { error: 'Cart not found', code: 'CART_NOT_FOUND' },
        { status: 404 }
      );
    }

    cart.items = cart.items.filter((i) => i.id !== itemId);
    recalculateCart(cart);
    cart.updatedAt = new Date();

    return HttpResponse.json(formatCartResponse(cart));
  }),

  // Apply markdown to item
  http.post('*/api/carts/:cartId/items/:itemId/markdown', async ({ params, request }) => {
    await delay(150);

    const { cartId, itemId } = params as { cartId: string; itemId: string };
    const body = (await request.json()) as {
      type: 'PERCENTAGE' | 'FIXED_AMOUNT';
      value: number;
      reason: string;
      authorizedBy?: string;
      authorizerName?: string;
    };
    const cart = activeCarts.get(cartId);

    if (!cart) {
      return HttpResponse.json(
        { error: 'Cart not found', code: 'CART_NOT_FOUND' },
        { status: 404 }
      );
    }

    const item = cart.items.find((i) => i.id === itemId);
    if (!item) {
      return HttpResponse.json(
        { error: 'Item not found', code: 'ITEM_NOT_FOUND' },
        { status: 404 }
      );
    }

    item.markdown = {
      type: body.type,
      value: body.value,
      reason: body.reason,
      authorizedBy: body.authorizedBy,
      authorizerName: body.authorizerName,
    };

    // Recalculate line total with markdown
    const discountedPrice =
      body.type === 'PERCENTAGE'
        ? item.unitPrice * (1 - body.value / 100)
        : item.unitPrice - body.value;
    item.lineTotal = Math.round(discountedPrice * item.quantity * 100) / 100;

    recalculateCart(cart);
    cart.updatedAt = new Date();

    return HttpResponse.json(formatCartResponse(cart));
  }),

  // Remove markdown from item
  http.delete('*/api/carts/:cartId/items/:itemId/markdown', async ({ params }) => {
    await delay(100);

    const { cartId, itemId } = params as { cartId: string; itemId: string };
    const cart = activeCarts.get(cartId);

    if (!cart) {
      return HttpResponse.json(
        { error: 'Cart not found', code: 'CART_NOT_FOUND' },
        { status: 404 }
      );
    }

    const item = cart.items.find((i) => i.id === itemId);
    if (!item) {
      return HttpResponse.json(
        { error: 'Item not found', code: 'ITEM_NOT_FOUND' },
        { status: 404 }
      );
    }

    delete item.markdown;
    item.lineTotal = Math.round(item.unitPrice * item.quantity * 100) / 100;

    recalculateCart(cart);
    cart.updatedAt = new Date();

    return HttpResponse.json(formatCartResponse(cart));
  }),

  // Attach customer to cart
  http.post('*/api/carts/:id/customer', async ({ params, request }) => {
    await delay(100);

    const id = params.id as string;
    const body = (await request.json()) as { customerId: string };
    const cart = activeCarts.get(id);

    if (!cart) {
      return HttpResponse.json(
        { error: 'Cart not found', code: 'CART_NOT_FOUND' },
        { status: 404 }
      );
    }

    const customer = findCustomerById(body.customerId);
    if (!customer) {
      return HttpResponse.json(
        { error: 'Customer not found', code: 'CUSTOMER_NOT_FOUND' },
        { status: 404 }
      );
    }

    cart.customerId = body.customerId;

    // Reapply pricing with customer discounts
    for (const item of cart.items) {
      const product = findProductBySku(item.sku);
      if (product) {
        let unitPrice = product.price;
        if (customer.type === 'B2B' && customer.b2bTier && product.b2bPricing) {
          const discount = getB2BDiscount(customer.b2bTier);
          unitPrice = product.price * (1 - discount / 100);
        } else if (customer.type === 'D2C' && customer.loyaltyTier) {
          const discount = getLoyaltyDiscount(customer.loyaltyTier);
          if (discount > 0) {
            unitPrice = product.price * (1 - discount / 100);
          }
        }
        item.unitPrice = Math.round(unitPrice * 100) / 100;
        item.lineTotal = Math.round(item.unitPrice * item.quantity * 100) / 100;
      }
    }

    recalculateCart(cart);
    cart.updatedAt = new Date();

    return HttpResponse.json(formatCartResponse(cart));
  }),

  // Void/cancel cart
  http.post('*/api/carts/:id/void', async ({ params, request }) => {
    await delay(150);

    const id = params.id as string;
    const body = (await request.json()) as { reason: string; authorizedBy: string };
    const cart = activeCarts.get(id);

    if (!cart) {
      return HttpResponse.json(
        { error: 'Cart not found', code: 'CART_NOT_FOUND' },
        { status: 404 }
      );
    }

    cart.status = 'VOIDED';
    cart.updatedAt = new Date();

    return HttpResponse.json({
      ...formatCartResponse(cart),
      voidReason: body.reason,
      voidAuthorizedBy: body.authorizedBy,
    });
  }),
];

function recalculateCart(cart: Cart) {
  cart.subtotal = cart.items.reduce((sum, item) => sum + item.lineTotal, 0);

  // Calculate discount total (from markdowns)
  cart.discountTotal = cart.items.reduce((sum, item) => {
    if (!item.markdown) return sum;
    const originalTotal = item.unitPrice * item.quantity;
    return sum + (originalTotal - item.lineTotal);
  }, 0);

  // Tax at 8%
  cart.taxTotal = Math.round(cart.subtotal * 0.08 * 100) / 100;
  cart.grandTotal = Math.round((cart.subtotal + cart.taxTotal) * 100) / 100;
}

function formatCartResponse(cart: Cart) {
  return {
    id: cart.id,
    storeNumber: cart.storeNumber,
    employeeId: cart.employeeId,
    customerId: cart.customerId,
    items: cart.items,
    totals: {
      subtotal: cart.subtotal.toFixed(2),
      discountTotal: cart.discountTotal.toFixed(2),
      taxTotal: cart.taxTotal.toFixed(2),
      grandTotal: cart.grandTotal.toFixed(2),
    },
    itemCount: cart.items.reduce((sum, i) => sum + i.quantity, 0),
    status: cart.status,
    createdAt: cart.createdAt.toISOString(),
    updatedAt: cart.updatedAt.toISOString(),
  };
}

// Export for testing utilities
export function resetCarts() {
  activeCarts.clear();
}

export function getCart(id: string) {
  return activeCarts.get(id);
}
