import http from 'k6/http';
import { check } from 'k6';
import { SharedArray } from 'k6/data';

const testData = new SharedArray('requests', function() {
  return JSON.parse(open('../data/test-input.json')).requests;
});

export const options = {
  // VUs and iterations are passed via CLI from orchestrator
  thresholds: {
    http_req_failed: ['rate<0.01'], // Less than 1% failures
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
  },
};

export default function() {
  const request = testData[__ITER % testData.length];

  const headers = {
    'Content-Type': 'application/json',
    'x-store-number': String(request.metadata.storeNumber),
    'x-order-number': request.metadata.orderNumber,
    'x-userid': request.metadata.userId,
    'x-sessionid': request.metadata.sessionId,
  };

  const response = http.get(
    `http://localhost:8080/products/${request.sku}`,
    { headers }
  );

  check(response, {
    'status is 200': (r) => r.status === 200,
    'response has sku': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.sku === request.sku;
      } catch (e) {
        return false;
      }
    },
  });
}
