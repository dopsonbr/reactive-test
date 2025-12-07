# End-to-End Testing Standard

## Intent

Verify system behavior under realistic load and failure conditions to validate performance, resilience, and overall system health.

## Outcomes

- Validated performance under load
- Verified resilience patterns (circuit breakers, fallbacks)
- Documented performance baselines
- Confidence in production readiness

## Patterns

### Test Types

| Type | Purpose | When to Run |
|------|---------|-------------|
| Load Test | Validate normal traffic handling | Pre-release, CI pipeline |
| Stress Test | Find breaking point | Capacity planning |
| Soak Test | Long-running stability | Pre-release (major versions) |
| Resilience Test | Verify failure handling | Pre-release, after changes |
| Chaos Test | Circuit breaker validation | After resilience changes |

### k6 Test Structure

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    scenarios: {
        load_test: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '30s', target: 10 },   // Ramp up
                { duration: '1m', target: 10 },    // Steady state
                { duration: '30s', target: 0 }     // Ramp down
            ]
        }
    },
    thresholds: {
        http_req_duration: ['p(95)<500'],          // 95% under 500ms
        http_req_failed: ['rate<0.01'],            // <1% error rate
        'http_req_duration{status:200}': ['p(99)<1000']  // 99% success under 1s
    }
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

export default function() {
    const headers = {
        'x-store-number': '1234',
        'x-order-number': 'test-order-' + __VU + '-' + __ITER,
        'x-userid': 'test01',
        'x-sessionid': 'test-session-' + __VU
    };

    const res = http.get(`${BASE_URL}/products/123456`, { headers });

    check(res, {
        'status is 200': (r) => r.status === 200,
        'response has sku': (r) => JSON.parse(r.body).sku === 123456,
        'response time < 500ms': (r) => r.timings.duration < 500
    });

    sleep(1);  // Think time between requests
}
```

### Threshold Guidelines

| Metric | Threshold | Rationale |
|--------|-----------|-----------|
| `http_req_duration p(95)` | < 500ms | Good user experience |
| `http_req_duration p(99)` | < 2000ms | Acceptable for edge cases |
| `http_req_failed` | < 1% | High availability |
| `iteration_duration p(95)` | < 2000ms | Full scenario completion |

### Scenario Types

```javascript
export const options = {
    scenarios: {
        // Constant load
        constant_load: {
            executor: 'constant-vus',
            vus: 10,
            duration: '5m'
        },

        // Ramping load
        ramping_load: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '2m', target: 50 },
                { duration: '5m', target: 50 },
                { duration: '2m', target: 0 }
            ]
        },

        // Arrival rate (requests per second)
        arrival_rate: {
            executor: 'constant-arrival-rate',
            rate: 100,          // 100 requests per timeUnit
            timeUnit: '1s',
            duration: '5m',
            preAllocatedVUs: 50
        },

        // Spike test
        spike_test: {
            executor: 'ramping-vus',
            stages: [
                { duration: '1m', target: 10 },
                { duration: '10s', target: 100 },  // Spike!
                { duration: '1m', target: 10 }
            ]
        }
    }
};
```

### Resilience Testing

Test circuit breaker behavior:

```javascript
// resilience-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter } from 'k6/metrics';

const fallbackCount = new Counter('fallback_responses');

export const options = {
    scenarios: {
        resilience_test: {
            executor: 'constant-vus',
            vus: 10,
            duration: '3m'
        }
    },
    thresholds: {
        http_req_failed: ['rate<0.05'],  // Allow some failures during chaos
        fallback_responses: ['count<100']  // Track fallback usage
    }
};

export default function() {
    const res = http.get(`${BASE_URL}/products/123456`, { headers });

    check(res, {
        'status is 200': (r) => r.status === 200
    });

    // Track fallback responses
    const body = JSON.parse(res.body);
    if (body.description === 'Product information temporarily unavailable') {
        fallbackCount.add(1);
    }

    sleep(0.5);
}
```

### Chaos Testing

Test system behavior under failure:

1. **Run normal load**
2. **Inject failure** (WireMock returns 503)
3. **Verify circuit opens** (fallback responses)
4. **Remove failure**
5. **Verify circuit closes** (normal responses)

```javascript
// chaos-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import exec from 'k6/execution';

export const options = {
    scenarios: {
        chaos: {
            executor: 'ramping-vus',
            stages: [
                { duration: '30s', target: 10 },  // Normal operation
                { duration: '1m', target: 10 },   // Inject failure
                { duration: '1m', target: 10 },   // Circuit should open
                { duration: '30s', target: 10 }   // Recovery
            ]
        }
    }
};

export function setup() {
    // Start with healthy state
    http.post('http://wiremock:8082/__admin/mappings/reset');
    configureHealthyStubs();
}

export default function() {
    const iteration = exec.scenario.iterationInTest;

    // Inject failure at iteration 100 (roughly 30s in)
    if (iteration === 100) {
        injectFailure();
    }

    // Remove failure at iteration 300 (roughly 2m in)
    if (iteration === 300) {
        configureHealthyStubs();
    }

    const res = http.get(`${BASE_URL}/products/123456`, { headers });

    check(res, {
        'request completed': (r) => r.status !== 0,
        'status is 200 or 503': (r) => [200, 503].includes(r.status)
    });

    sleep(0.5);
}

function configureHealthyStubs() {
    http.post('http://wiremock:8082/__admin/mappings', JSON.stringify({
        request: { urlPathPattern: '/merchandise/.*' },
        response: { status: 200, body: '{"name":"Test"}' }
    }));
}

function injectFailure() {
    http.delete('http://wiremock:8082/__admin/mappings');
    http.post('http://wiremock:8082/__admin/mappings', JSON.stringify({
        request: { urlPathPattern: '/merchandise/.*' },
        response: { status: 503 }
    }));
}
```

### Running Tests

```bash
# Local development
k6 run e2e/load-test.js

# With environment variables
k6 run -e BASE_URL=http://localhost:8080 e2e/load-test.js

# Docker Compose profile
docker compose --profile test-product up k6-product

# Chaos test profile
docker compose --profile chaos-product up k6-product-resilience
```

### Test Reports

k6 outputs summary to console:

```
     ✓ status is 200
     ✓ response has sku
     ✓ response time < 500ms

     checks.........................: 100.00% ✓ 1800      ✗ 0
     data_received..................: 1.2 MB  20 kB/s
     data_sent......................: 360 kB  6.0 kB/s
     http_req_duration..............: avg=45ms min=12ms med=38ms max=234ms p(90)=78ms p(95)=98ms
     http_req_failed................: 0.00%   ✓ 0         ✗ 600
     http_reqs......................: 600     10/s
     iteration_duration.............: avg=1.04s min=1.01s med=1.03s max=1.23s p(90)=1.08s p(95)=1.1s
```

Export to JSON for CI:

```bash
k6 run --out json=results.json e2e/load-test.js
```

### Performance Baselines

Document baseline performance:

| Endpoint | P50 | P95 | P99 | Throughput |
|----------|-----|-----|-----|------------|
| GET /products/{sku} | 35ms | 95ms | 180ms | 150 rps |
| POST /carts | 45ms | 120ms | 250ms | 100 rps |
| GET /carts/{id} | 25ms | 65ms | 120ms | 200 rps |

Update baselines when:
- Major changes to codebase
- Infrastructure changes
- New features added

## Anti-patterns

### No Thresholds (Test Always Passes)

```javascript
// DON'T - no failure criteria
export const options = {
    vus: 10,
    duration: '1m'
    // No thresholds - test always passes
};

// DO - define pass/fail criteria
export const options = {
    vus: 10,
    duration: '1m',
    thresholds: {
        http_req_duration: ['p(95)<500'],
        http_req_failed: ['rate<0.01']
    }
};
```

### Testing Only Happy Path

```javascript
// DON'T - only test success
export default function() {
    const res = http.get(`${BASE_URL}/products/123456`);
    check(res, { 'status is 200': (r) => r.status === 200 });
}

// DO - test error scenarios too
export default function() {
    // Valid request
    const valid = http.get(`${BASE_URL}/products/123456`, { headers });
    check(valid, { 'valid request succeeds': (r) => r.status === 200 });

    // Invalid request
    const invalid = http.get(`${BASE_URL}/products/-1`, { headers });
    check(invalid, { 'invalid request returns 400': (r) => r.status === 400 });

    // Missing headers
    const noHeaders = http.get(`${BASE_URL}/products/123456`);
    check(noHeaders, { 'missing headers returns 400': (r) => r.status === 400 });
}
```

### Skipping Chaos Tests

```javascript
// DON'T - only test happy path under load
// "Circuit breaker works in unit tests, should be fine"

// DO - verify resilience under load
export default function() {
    // Test includes failure injection and recovery
}
```

### Unrealistic Load Patterns

```javascript
// DON'T - constant hammering
export const options = {
    vus: 1000,
    duration: '10s'  // No ramp up
};

// DO - realistic traffic patterns
export const options = {
    stages: [
        { duration: '2m', target: 50 },   // Gradual ramp up
        { duration: '5m', target: 50 },   // Steady state
        { duration: '2m', target: 0 }     // Gradual ramp down
    ]
};
```

### No Think Time

```javascript
// DON'T - unrealistic bombardment
export default function() {
    http.get(`${BASE_URL}/products/123456`);
    // Immediately fires next request
}

// DO - simulate real user behavior
export default function() {
    http.get(`${BASE_URL}/products/123456`);
    sleep(Math.random() * 2 + 1);  // 1-3 second think time
}
```

### Testing Against Production

```javascript
// DON'T - load test production
const BASE_URL = 'https://api.production.com';

// DO - test against staging/load-test environment
const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
// Set BASE_URL to staging environment for load tests
```

### Ignoring Resource Constraints

```javascript
// DON'T - ignore system limits
export const options = {
    vus: 10000  // More VUs than k6 can handle
};

// DO - understand limits
export const options = {
    scenarios: {
        // Use arrival rate for high throughput
        high_load: {
            executor: 'constant-arrival-rate',
            rate: 1000,
            timeUnit: '1s',
            duration: '5m',
            preAllocatedVUs: 100,
            maxVUs: 500
        }
    }
};
```

## Reference

- `e2e/` - k6 test scripts
- `e2e/TEST_PLAN.md` - Test plan documentation
- `docker/docker-compose.yml` - Test profiles
