/**
 * Product MSW handlers for POS E2E testing
 * Matches the product-service API structure
 */

import { http, HttpResponse, delay } from 'msw';
import {
  findProductBySku,
  searchProducts,
  mockProducts,
  type MockProduct,
} from '../data/products';

// Transform mock product to search response format (matches SearchProduct)
function toSearchProduct(product: MockProduct, index = 0) {
  return {
    sku: parseInt(product.sku.replace(/\D/g, '') || String(index + 1), 10),
    name: product.name,
    description: product.description,
    price:
      product.originalPrice && product.price < product.originalPrice
        ? product.price
        : product.price,
    originalPrice: product.originalPrice || null,
    availableQuantity: product.inventory === Infinity ? 9999 : product.inventory,
    imageUrl: null,
    category: product.category,
    relevanceScore: 1.0 - index * 0.1,
    inStock: product.inventory > 0,
    onSale:
      product.originalPrice !== undefined && product.price < product.originalPrice,
  };
}

// Transform mock product to detail response format (matches Product)
function toProductDetail(product: MockProduct) {
  return {
    sku: parseInt(product.sku.replace(/\D/g, '') || '1', 10),
    name: product.name,
    description: product.description,
    price: product.price,
    basePrice: product.originalPrice || product.price,
    availability: product.inventory === Infinity ? 9999 : product.inventory,
    imageUrl: null,
    category: product.category,
  };
}

export const productHandlers = [
  // Product lookup by SKU - matches /products/{sku}
  http.get('*/products/:sku', async ({ params }) => {
    await delay(100);

    const sku = params.sku as string;

    // Skip if this is the search endpoint
    if (sku === 'search') {
      return;
    }

    const product = findProductBySku(sku);

    // Also try looking up by numeric SKU portion
    const numericSku = sku.replace(/\D/g, '');
    const productByNumeric = !product
      ? mockProducts.find((p) => p.sku.replace(/\D/g, '') === numericSku)
      : null;

    const foundProduct = product || productByNumeric;

    if (!foundProduct) {
      return HttpResponse.json(
        { error: 'Product not found', code: 'PRODUCT_NOT_FOUND' },
        { status: 404 }
      );
    }

    return HttpResponse.json(toProductDetail(foundProduct));
  }),

  // Product search - matches /products/search?q=...
  http.get('*/products/search', async ({ request }) => {
    await delay(150);

    const url = new URL(request.url);
    const query = url.searchParams.get('q') || '';
    const category = url.searchParams.get('category');
    const page = parseInt(url.searchParams.get('page') || '0', 10);
    const size = parseInt(url.searchParams.get('size') || '20', 10);

    let results = query ? searchProducts(query) : [...mockProducts];

    if (category) {
      results = results.filter((p) => p.category === category);
    }

    const total = results.length;
    const totalPages = Math.ceil(total / size);
    const start = page * size;
    const paginatedResults = results.slice(start, start + size);

    // Response matches ProductSearchResponse from product-service
    return HttpResponse.json({
      products: paginatedResults.map((p, i) => toSearchProduct(p, start + i)),
      total,
      totalPages,
      page,
      pageSize: size,
      query,
      searchTimeMs: Math.floor(Math.random() * 50) + 10,
    });
  }),

  // Search suggestions - matches /products/search/suggestions
  http.get('*/products/search/suggestions', async ({ request }) => {
    await delay(50);

    const url = new URL(request.url);
    const prefix = url.searchParams.get('prefix') || '';
    const limit = parseInt(url.searchParams.get('limit') || '10', 10);

    if (prefix.length < 2) {
      return HttpResponse.json([]);
    }

    const results = searchProducts(prefix);
    const suggestions = results.slice(0, limit).map((p) => p.name);

    return HttpResponse.json(suggestions);
  }),

  // Barcode scan (simulates scanner input)
  http.post('*/products/scan', async ({ request }) => {
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

    return HttpResponse.json(toProductDetail(product));
  }),

  // Check inventory availability
  http.get('*/products/:sku/inventory', async ({ params, request }) => {
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
  http.get('*/products/:sku/b2b-pricing', async ({ params, request }) => {
    await delay(100);

    const sku = params.sku as string;
    const url = new URL(request.url);
    const tier = url.searchParams.get('tier') as
      | 'STANDARD'
      | 'PREMIER'
      | 'ENTERPRISE'
      | null;

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
