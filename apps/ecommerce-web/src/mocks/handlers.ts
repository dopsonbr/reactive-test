import { http, HttpResponse, delay, graphql } from 'msw';
import {
  mockProducts,
  mockCart,
  calculateCartTotals,
  findProductBySku,
  productSkuToCartSku,
} from './data';
import type { Cart, CartItem } from '../features/cart/types/cart';

// MSW handlers use wildcard patterns to match both same-origin and cross-origin requests
// This allows the same handlers to work in dev mode (same-origin via vite proxy)
// and in tests (direct to backend URLs when VITE_*_API_URL is set)

// GraphQL endpoint for cart operations - use wildcard to match any origin
const graphqlCart = graphql.link('*/graphql');

// Helper to build a CartItem from a Product
function buildCartItem(
  sku: string,
  quantity: number,
  product: { name: string; description: string; price: string; originalPrice?: string; availableQuantity: number; imageUrl: string; category: string; inStock: boolean }
): CartItem {
  const unitPrice = parseFloat(product.price);
  return {
    sku,
    name: product.name,
    description: product.description,
    unitPrice: product.price,
    originalUnitPrice: product.originalPrice,
    quantity,
    availableQuantity: product.availableQuantity,
    imageUrl: product.imageUrl,
    category: product.category,
    lineTotal: (unitPrice * quantity).toFixed(2),
    inStock: product.inStock,
  };
}

// Helper to get cart with correct typing
function getMockCartWithId(id: string): Cart {
  return { ...mockCart, id, products: [...mockCart.products] };
}

export const handlers = [
  // Product Search (REST) - wildcard matches any origin
  http.get('*/products/search', async ({ request }) => {
    await delay(100); // Simulate network latency

    const url = new URL(request.url);
    const query = url.searchParams.get('q')?.toLowerCase() || '';
    const category = url.searchParams.get('category') || '';
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);

    let filtered = [...mockProducts];

    if (query) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query)
      );
    }

    if (category) {
      filtered = filtered.filter((p) => p.category === category);
    }

    const total = filtered.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const paginatedProducts = filtered.slice(start, start + limit);

    return HttpResponse.json({
      products: paginatedProducts,
      total,
      page,
      totalPages,
    });
  }),

  // Product Detail (REST) - wildcard matches any origin
  http.get('*/products/:sku', async ({ params }) => {
    await delay(100);

    const sku = Number(params.sku);
    const product = mockProducts.find((p) => p.sku === sku);
    if (!product) {
      return new HttpResponse(
        JSON.stringify({ message: 'Product not found', code: 'PRODUCT_NOT_FOUND' }),
        { status: 404 }
      );
    }
    return HttpResponse.json(product);
  }),

  // GraphQL: Cart query
  graphqlCart.query('Cart', async ({ variables }) => {
    await delay(100);

    const { id } = variables as { id: string };
    const cart = getMockCartWithId(id);
    return HttpResponse.json({
      data: {
        cart: calculateCartTotals(cart),
      },
    });
  }),

  // GraphQL: CreateCart mutation
  graphqlCart.mutation('CreateCart', async ({ variables }) => {
    await delay(100);

    const { input } = variables as { input: { storeNumber: number; customerId?: string } };
    const newCart: Cart = {
      id: crypto.randomUUID(),
      storeNumber: input.storeNumber,
      customerId: input.customerId,
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

    // Update the mock cart state
    mockCart.id = newCart.id;
    mockCart.storeNumber = newCart.storeNumber;
    mockCart.products = [];
    Object.assign(mockCart.totals, newCart.totals);

    return HttpResponse.json({
      data: {
        createCart: newCart,
      },
    });
  }),

  // GraphQL: AddProduct mutation
  graphqlCart.mutation('AddProduct', async ({ variables }) => {
    await delay(100);

    const { cartId, input } = variables as {
      cartId: string;
      input: { sku: string; quantity: number };
    };

    const product = findProductBySku(input.sku);
    if (!product) {
      return HttpResponse.json({
        errors: [
          {
            message: 'Product not found',
            extensions: { classification: 'NOT_FOUND', code: 'PRODUCT_NOT_FOUND' },
          },
        ],
      });
    }

    // Check if item already exists in cart
    const existingItem = mockCart.products.find((i) => i.sku === input.sku);
    if (existingItem) {
      existingItem.quantity += input.quantity;
      const unitPrice = parseFloat(existingItem.unitPrice);
      existingItem.lineTotal = (unitPrice * existingItem.quantity).toFixed(2);
    } else {
      mockCart.products.push(
        buildCartItem(productSkuToCartSku(product.sku), input.quantity, product)
      );
    }

    const updatedCart = calculateCartTotals(getMockCartWithId(cartId));
    Object.assign(mockCart, { ...updatedCart, products: [...updatedCart.products] });

    return HttpResponse.json({
      data: {
        addProduct: updatedCart,
      },
    });
  }),

  // GraphQL: UpdateProduct mutation
  graphqlCart.mutation('UpdateProduct', async ({ variables }) => {
    await delay(100);

    const { cartId, sku, input } = variables as {
      cartId: string;
      sku: string;
      input: { quantity: number };
    };

    const item = mockCart.products.find((i) => i.sku === sku);
    if (!item) {
      return HttpResponse.json({
        errors: [
          {
            message: 'Cart item not found',
            extensions: { classification: 'NOT_FOUND', code: 'ITEM_NOT_FOUND' },
          },
        ],
      });
    }

    if (input.quantity < 1) {
      // Remove item if quantity is 0 or less
      mockCart.products = mockCart.products.filter((i) => i.sku !== sku);
    } else {
      item.quantity = input.quantity;
      const unitPrice = parseFloat(item.unitPrice);
      item.lineTotal = (unitPrice * item.quantity).toFixed(2);
    }

    const updatedCart = calculateCartTotals(getMockCartWithId(cartId));
    Object.assign(mockCart, { ...updatedCart, products: [...updatedCart.products] });

    return HttpResponse.json({
      data: {
        updateProduct: updatedCart,
      },
    });
  }),

  // GraphQL: RemoveProduct mutation
  graphqlCart.mutation('RemoveProduct', async ({ variables }) => {
    await delay(100);

    const { cartId, sku } = variables as { cartId: string; sku: string };

    mockCart.products = mockCart.products.filter((i) => i.sku !== sku);

    const updatedCart = calculateCartTotals(getMockCartWithId(cartId));
    Object.assign(mockCart, { ...updatedCart, products: [...updatedCart.products] });

    return HttpResponse.json({
      data: {
        removeProduct: updatedCart,
      },
    });
  }),
];
