import { http, HttpResponse } from 'msw';
import type { Product, ProductSearchResult } from '@reactive-platform/commerce-hooks';
import { mockProducts } from '../data/products';

const API_BASE = 'http://localhost:8090';

export const productHandlers = [
  // GET /api/products - Search products
  http.get(`${API_BASE}/api/products`, ({ request }) => {
    const url = new URL(request.url);
    const query = url.searchParams.get('query')?.toLowerCase();
    const category = url.searchParams.get('category');
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '10', 10);

    let filteredProducts = mockProducts;

    // Filter by query (search in name and description)
    if (query) {
      filteredProducts = filteredProducts.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          p.sku.toLowerCase().includes(query)
      );
    }

    // Filter by category
    if (category) {
      filteredProducts = filteredProducts.filter((p) => p.category === category);
    }

    // Pagination
    const total = filteredProducts.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedProducts = filteredProducts.slice(start, end);

    const result: ProductSearchResult = {
      products: paginatedProducts,
      total,
      page,
      totalPages,
    };

    return HttpResponse.json(result);
  }),

  // GET /api/products/:sku - Get single product
  http.get(`${API_BASE}/api/products/:sku`, ({ params }) => {
    const { sku } = params;
    const product = mockProducts.find((p) => p.sku === sku);

    if (!product) {
      return new HttpResponse(null, {
        status: 404,
        statusText: 'Product not found',
      });
    }

    return HttpResponse.json<Product>(product);
  }),
];
