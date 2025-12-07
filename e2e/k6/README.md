# k6 Performance Tests

Load testing, chaos testing, and resilience validation using [k6](https://k6.io/).

## Quick Start

```bash
# Via Nx (recommended)
pnpm nx load-test k6-perf
pnpm nx resilience-test k6-perf
pnpm nx circuit-breaker-test k6-perf

# Via Docker Compose
pnpm nx load-test k6-perf --configuration=docker
```

## Available Tests

| Test | Nx Command | Purpose |
|------|------------|---------|
| `load-test.js` | `pnpm nx load-test k6-perf` | Basic throughput testing |
| `cart-load-test.js` | `pnpm nx cart-load-test k6-perf` | Cart service load testing |
| `resilience-test.js` | `pnpm nx resilience-test k6-perf` | Multi-phase chaos testing |
| `circuit-breaker-test.js` | `pnpm nx circuit-breaker-test k6-perf` | Circuit breaker validation |
| `product-search-test.js` | `pnpm nx product-search-test k6-perf` | Product search performance |
| `oauth-chaos-test.js` | `pnpm nx oauth-chaos-test k6-perf` | OAuth service chaos testing |
| `oauth-circuit-breaker-test.js` | `pnpm nx oauth-circuit-breaker-test k6-perf` | OAuth circuit breaker |

## Prerequisites

### Local k6 Installation

```bash
# macOS
brew install k6

# Or via Docker (no installation needed)
pnpm nx load-test k6-perf --configuration=docker
```

### Test Data Generation

Tests require pre-generated test data:

```bash
pnpm nx generate-data k6-perf
```

This creates `e2e/data/test-input.json` with 1000 request metadata sets.

### Backend Services

Most tests require backend services running:

```bash
# Start services
cd docker && docker compose up -d

# Verify health
curl http://localhost:8080/actuator/health
```

## Running Tests

### Direct Execution (k6 installed locally)

```bash
# Basic load test
pnpm nx load-test k6-perf

# With custom parameters
k6 run --vus 50 --iterations 10000 e2e/k6/load-test.js

# With environment variables
k6 run -e BASE_URL=http://localhost:8080 e2e/k6/load-test.js
```

### Docker Execution (no local k6 needed)

```bash
# Load test via Docker Compose
pnpm nx load-test k6-perf --configuration=docker

# Resilience test via Docker Compose
pnpm nx resilience-test k6-perf --configuration=docker

# Circuit breaker test
pnpm nx circuit-breaker-test k6-perf --configuration=docker
```

## Test Descriptions

### load-test.js

Basic throughput testing against product-service.

- **VUs**: 50 (configurable)
- **Thresholds**:
  - < 1% failure rate
  - p95 < 500ms
  - p99 < 2000ms

### resilience-test.js

Multi-phase chaos test that progressively introduces failures:

1. **Warm-up**: Normal traffic
2. **Degradation**: Introduce latency
3. **Failure**: Partial failures
4. **Recovery**: Return to normal

### circuit-breaker-test.js

Validates circuit breaker behavior:

1. Drives traffic until circuit opens
2. Verifies fallback responses
3. Validates circuit recovery

### chaos-controller.js

Helper module for controlling WireMock chaos scenarios. Not a standalone test.

## Output and Reports

### Console Summary

k6 outputs a summary to console:

```
     ✓ status is 200
     ✓ response has sku

     checks.........................: 100.00% ✓ 1800      ✗ 0
     http_req_duration..............: avg=45ms min=12ms p(90)=78ms p(95)=98ms
     http_req_failed................: 0.00%   ✓ 0         ✗ 600
```

### JSON Export

```bash
k6 run --out json=results.json e2e/k6/load-test.js
```

### Grafana Integration

When running via Docker Compose, metrics are sent to Prometheus and visible in Grafana at http://localhost:3000.

## Performance Baselines

| Endpoint | P50 | P95 | P99 | Throughput |
|----------|-----|-----|-----|------------|
| GET /products/{sku} | 35ms | 95ms | 180ms | 150 rps |
| POST /carts | 45ms | 120ms | 250ms | 100 rps |
| GET /carts/{id} | 25ms | 65ms | 120ms | 200 rps |

Update baselines when:
- Major codebase changes
- Infrastructure changes
- New features added

## Documentation

Each test has a corresponding `.md` file with detailed scenarios:

- `load-test.md` - Load test scenarios and thresholds
- `resilience-test.md` - Chaos test phases
- `circuit-breaker-test.md` - Circuit breaker validation steps

## Related

- [k6 Documentation](https://k6.io/docs/)
- [Backend E2E Testing Standard](../../docs/standards/backend/testing-e2e.md)
- [WireMock Mappings](../wiremock/)
