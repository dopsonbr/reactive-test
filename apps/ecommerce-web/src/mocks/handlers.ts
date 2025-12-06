import { http, HttpResponse, delay } from 'msw';
import { mockProducts, mockCart, calculateCartTotals } from './data';

// Base URLs for API mocking - matches both direct and proxied requests
const PRODUCT_API = import.meta.env.VITE_PRODUCT_API_URL || 'http://localhost:8080';
const CART_API = import.meta.env.VITE_CART_API_URL || 'http://localhost:8081';

export const handlers = [
  // Product Search
  http.get(`${PRODUCT_API}/products/search`, async ({ request }) => {
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

  // Product Detail
  http.get(`${PRODUCT_API}/products/:sku`, async ({ params }) => {
    await delay(100);

    const product = mockProducts.find((p) => p.sku === params.sku);
    if (!product) {
      return new HttpResponse(
        JSON.stringify({ message: 'Product not found', code: 'PRODUCT_NOT_FOUND' }),
        { status: 404 }
      );
    }
    return HttpResponse.json(product);
  }),

  // Get Cart
  http.get(`${CART_API}/carts/:id`, async ({ params }) => {
    await delay(100);

    // Return the mock cart with updated ID
    const cart = { ...mockCart, id: params.id as string };
    return HttpResponse.json(calculateCartTotals(cart));
  }),

  // Create Cart (POST to /carts)
  http.post(`${CART_API}/carts`, async () => {
    await delay(100);

    const newCart = {
      id: crypto.randomUUID(),
      items: [],
      subtotal: 0,
      tax: 0,
      total: 0,
    };
    return HttpResponse.json(newCart, { status: 201 });
  }),

  // Add to Cart
  http.post(`${CART_API}/carts/:id/products`, async ({ params, request }) => {
    await delay(100);

    const body = (await request.json()) as { sku: string; quantity: number };
    const product = mockProducts.find((p) => p.sku === body.sku);

    if (!product) {
      return new HttpResponse(
        JSON.stringify({ message: 'Product not found', code: 'PRODUCT_NOT_FOUND' }),
        { status: 404 }
      );
    }

    // Check if item already exists in cart
    const existingItem = mockCart.items.find((i) => i.sku === body.sku);
    if (existingItem) {
      existingItem.quantity += body.quantity;
    } else {
      mockCart.items.push({
        sku: product.sku,
        name: product.name,
        price: product.price,
        quantity: body.quantity,
        imageUrl: product.imageUrl,
      });
    }

    const updatedCart = calculateCartTotals({ ...mockCart, id: params.id as string });
    Object.assign(mockCart, updatedCart);

    return HttpResponse.json(updatedCart);
  }),

  // Update Cart Item
  http.put(`${CART_API}/carts/:id/products/:sku`, async ({ params, request }) => {
    await delay(100);

    const body = (await request.json()) as { quantity: number };
    const item = mockCart.items.find((i) => i.sku === params.sku);

    if (!item) {
      return new HttpResponse(
        JSON.stringify({ message: 'Cart item not found', code: 'ITEM_NOT_FOUND' }),
        { status: 404 }
      );
    }

    if (body.quantity < 1) {
      // Remove item if quantity is 0 or less
      mockCart.items = mockCart.items.filter((i) => i.sku !== params.sku);
    } else {
      item.quantity = body.quantity;
    }

    const updatedCart = calculateCartTotals({ ...mockCart, id: params.id as string });
    Object.assign(mockCart, updatedCart);

    return HttpResponse.json(updatedCart);
  }),

  // Remove from Cart
  http.delete(`${CART_API}/carts/:id/products/:sku`, async ({ params }) => {
    await delay(100);

    mockCart.items = mockCart.items.filter((i) => i.sku !== params.sku);

    const updatedCart = calculateCartTotals({ ...mockCart, id: params.id as string });
    Object.assign(mockCart, updatedCart);

    return HttpResponse.json(updatedCart);
  }),
];
