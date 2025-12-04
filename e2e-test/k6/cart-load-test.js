import http from 'k6/http';
import { check, group } from 'k6';
import { uuidv4 } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

export const options = {
  thresholds: {
    http_req_failed: ['rate<0.01'], // Less than 1% failures
    http_req_duration: ['p(95)<1000'], // 95% of requests under 1s
    http_req_duration: ['p(99)<3000'], // 99% under 3s
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8081';

function getHeaders() {
  return {
    'Content-Type': 'application/json',
    'x-store-number': '100',
    'x-order-number': uuidv4(),
    'x-userid': 'user01',
    'x-sessionid': uuidv4(),
  };
}

export default function() {
  let cartId;
  const headers = getHeaders();

  group('Cart Lifecycle', () => {
    // Create cart
    const createResponse = http.post(
      `${BASE_URL}/carts`,
      JSON.stringify({ storeNumber: 100, customerId: null }),
      { headers }
    );

    const createOk = check(createResponse, {
      'create cart - status is 201': (r) => r.status === 201,
      'create cart - has cart id': (r) => {
        try {
          const body = JSON.parse(r.body);
          cartId = body.id;
          return cartId && cartId.length > 0;
        } catch (e) {
          return false;
        }
      },
    });

    if (!createOk || !cartId) {
      console.error(`Failed to create cart: ${createResponse.status} - ${createResponse.body}`);
      return;
    }

    // Get cart
    const getResponse = http.get(
      `${BASE_URL}/carts/${cartId}`,
      { headers }
    );

    check(getResponse, {
      'get cart - status is 200': (r) => r.status === 200,
      'get cart - correct id': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.id === cartId;
        } catch (e) {
          return false;
        }
      },
    });

    // Add product
    const addProductResponse = http.post(
      `${BASE_URL}/carts/${cartId}/products`,
      JSON.stringify({ sku: 123456, quantity: 2 }),
      { headers }
    );

    check(addProductResponse, {
      'add product - status is 201': (r) => r.status === 201,
      'add product - has product': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.products && body.products.length > 0;
        } catch (e) {
          return false;
        }
      },
    });

    // Get products
    const getProductsResponse = http.get(
      `${BASE_URL}/carts/${cartId}/products`,
      { headers }
    );

    check(getProductsResponse, {
      'get products - status is 200': (r) => r.status === 200,
    });

    // Update product quantity
    const updateProductResponse = http.put(
      `${BASE_URL}/carts/${cartId}/products/123456`,
      JSON.stringify({ quantity: 5 }),
      { headers }
    );

    check(updateProductResponse, {
      'update product - status is 200': (r) => r.status === 200,
      'update product - quantity updated': (r) => {
        try {
          const body = JSON.parse(r.body);
          const product = body.products.find(p => p.sku === 123456);
          return product && product.quantity === 5;
        } catch (e) {
          return false;
        }
      },
    });

    // Delete cart
    const deleteResponse = http.del(
      `${BASE_URL}/carts/${cartId}`,
      null,
      { headers }
    );

    check(deleteResponse, {
      'delete cart - status is 204': (r) => r.status === 204,
    });

    // Verify cart is deleted
    const verifyDeleteResponse = http.get(
      `${BASE_URL}/carts/${cartId}`,
      { headers }
    );

    check(verifyDeleteResponse, {
      'verify delete - status is 404': (r) => r.status === 404,
    });
  });
}
