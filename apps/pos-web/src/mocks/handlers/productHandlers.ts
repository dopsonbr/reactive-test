/**
 * Product MSW handlers for POS E2E testing
 */

import { http, HttpResponse, delay } from 'msw';
import { findProductBySku, searchProducts, mockProducts } from '../data/products';

export const productHandlers = [
  // Product lookup by SKU
  http.get('*/api/products/:sku', async ({ params }) => {
    await delay(100);

    const sku = params.sku as string;
    const product = findProductBySku(sku);

    if (!product) {
      return HttpResponse.json(
        { error: 'Product not found', code: 'PRODUCT_NOT_FOUND' },
        { status: 404 }
      );
    }

    return HttpResponse.json({
      sku: product.sku,
      name: product.name,
      description: product.description,
      price: product.price,
      originalPrice: product.originalPrice,
      inventory: product.inventory,
      category: product.category,
      taxable: product.taxable,
      requiresAge: product.requiresAge,
      serialRequired: product.serialRequired,
      inStock: product.inventory > 0,
    });
  }),

  // Product search
  http.get('*/api/products/search', async ({ request }) => {
    await delay(150);

    const url = new URL(request.url);
    const query = url.searchParams.get('q') || '';
    const category = url.searchParams.get('category');
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);

    let results = query ? searchProducts(query) : [...mockProducts];

    if (category) {
      results = results.filter((p) => p.category === category);
    }

    const total = results.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const paginatedResults = results.slice(start, start + limit);

    return HttpResponse.json({
      products: paginatedResults.map((p) => ({
        sku: p.sku,
        name: p.name,
        description: p.description,
        price: p.price,
        originalPrice: p.originalPrice,
        inventory: p.inventory,
        category: p.category,
        inStock: p.inventory > 0,
      })),
      total,
      page,
      totalPages,
    });
  }),

  // Barcode scan (simulates scanner input)
  http.post('*/api/products/scan', async ({ request }) => {
    await delay(50); // Scanner should be fast

    const body = (await request.json()) as { barcode: string };

    // In a real system, barcode would map to SKU
    // For mock, we'll just treat it as the SKU directly
    const product = findProductBySku(body.barcode);

    if (!product) {
      return HttpResponse.json(
        { error: 'Item not found', code: 'ITEM_NOT_FOUND' },
        { status: 404 }
      );
    }

    return HttpResponse.json({
      sku: product.sku,
      name: product.name,
      price: product.price,
      inventory: product.inventory,
      taxable: product.taxable,
      requiresAge: product.requiresAge,
      serialRequired: product.serialRequired,
    });
  }),

  // Check inventory availability
  http.get('*/api/products/:sku/inventory', async ({ params, request }) => {
    await delay(100);

    const sku = params.sku as string;
    const url = new URL(request.url);
    const quantity = parseInt(url.searchParams.get('quantity') || '1', 10);
    const storeNumber = url.searchParams.get('store');

    const product = findProductBySku(sku);

    if (!product) {
      return HttpResponse.json(
        { error: 'Product not found', code: 'PRODUCT_NOT_FOUND' },
        { status: 404 }
      );
    }

    const available = product.inventory >= quantity;

    return HttpResponse.json({
      sku: product.sku,
      requestedQuantity: quantity,
      availableQuantity: product.inventory,
      available,
      storeNumber: storeNumber ? parseInt(storeNumber, 10) : undefined,
    });
  }),

  // Get B2B pricing
  http.get('*/api/products/:sku/b2b-pricing', async ({ params, request }) => {
    await delay(100);

    const sku = params.sku as string;
    const url = new URL(request.url);
    const tier = url.searchParams.get('tier') as 'STANDARD' | 'PREMIER' | 'ENTERPRISE' | null;

    const product = findProductBySku(sku);

    if (!product) {
      return HttpResponse.json(
        { error: 'Product not found', code: 'PRODUCT_NOT_FOUND' },
        { status: 404 }
      );
    }

    if (!product.b2bPricing) {
      return HttpResponse.json({
        sku: product.sku,
        basePrice: product.price,
        b2bPrice: product.price,
        discount: 0,
        tier: tier || 'STANDARD',
      });
    }

    const tierPricing = tier
      ? product.b2bPricing.find((p) => p.tier === tier)
      : product.b2bPricing[0];

    const discount = tierPricing?.discount || 0;
    const b2bPrice = product.price * (1 - discount / 100);

    return HttpResponse.json({
      sku: product.sku,
      basePrice: product.price,
      b2bPrice: Math.round(b2bPrice * 100) / 100,
      discount,
      tier: tier || 'STANDARD',
    });
  }),
];
