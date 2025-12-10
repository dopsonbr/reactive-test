# End-to-End Testing

This directory contains all E2E and performance testing assets for the reactive platform.

## Test Types at a Glance

| Type | Directory | Speed | Backend Required | When to Run |
|------|-----------|-------|------------------|-------------|
| **Mocked E2E** | `apps/ecommerce-web/e2e/` | ~2 min | No (MSW mocks) | Every PR |
| **Full-Stack E2E** | `e2e/ecommerce-fullstack/` | ~10 min | Yes (Docker) | Main + nightly |
| **Performance** | `e2e/k6/` | Variable | Yes (Docker) | On-demand, pre-release |

## Directory Structure

```
e2e/
├── README.md                 # This file
├── AGENTS.md                 # AI agent guidance
├── ecommerce-fullstack/      # Playwright full-stack tests
│   ├── specs/                # Test specifications
│   ├── fixtures/             # Seed data
│   └── playwright.config.ts
├── k6/                       # Performance/load tests
│   ├── load-test.js          # Basic load testing
│   ├── resilience-test.js    # Multi-phase chaos tests
│   ├── circuit-breaker-test.js
│   └── *.md                  # Test documentation
├── wiremock/                 # API mock definitions
│   └── mappings/             # WireMock stub JSON files
├── data/                     # Generated test data
├── src/                      # Test utilities
└── config.json               # Test configuration
```

---

## Which Test Type Should I Use?

### Use Mocked E2E (`apps/ecommerce-web/e2e/`) when:

- Testing **frontend user journeys** (navigation, forms, UI interactions)
- Testing **error states** and edge cases (network errors, empty states)
- You need **fast feedback** during development
- You want to test **UI logic in isolation** from backend services
- Running in **CI on every PR**

```bash
pnpm nx e2e ecommerce-web-e2e
```

### Use Full-Stack E2E (`e2e/ecommerce-fullstack/`) when:

- Testing **critical paths** through the entire system
- Validating **service-to-service communication**
- Testing **database interactions** and data persistence
- Verifying **production-like behavior**
- Running **regression tests** before releases

```bash
# Start backend services
docker compose -f docker/docker-compose.e2e.yml up -d --build

# Seed test data
npx tsx e2e/ecommerce-fullstack/fixtures/seed-data.ts

# Run tests
pnpm nx e2e ecommerce-fullstack-e2e
```

### Use Performance Tests (`e2e/k6/`) when:

- **Load testing** to establish performance baselines
- Testing **circuit breaker** behavior under failure conditions
- Running **chaos tests** to validate resilience
- Verifying **throughput** meets requirements
- **Pre-release validation** of performance characteristics

```bash
# Via Docker Compose
docker compose --profile test-product up k6-product

# Or directly with k6
k6 run e2e/k6/load-test.js
```

---

## Quick Reference

### Mocked E2E (MSW-based)

**Location:** `apps/ecommerce-web/e2e/`

Fast, isolated tests using Mock Service Worker. No backend required.

```bash
# Run all mocked tests
pnpm nx e2e ecommerce-web-e2e

# Run with UI mode
pnpm nx e2e ecommerce-web-e2e --ui
```

**When it runs:** Every PR (blocks merge)

### Full-Stack E2E (Playwright + Docker)

**Location:** `e2e/ecommerce-fullstack/`

Integration tests against real services in Docker.

```bash
# Start services
docker compose -f docker/docker-compose.e2e.yml up -d --build

# Seed data
npx tsx e2e/ecommerce-fullstack/fixtures/seed-data.ts

# Run tests
pnpm nx e2e ecommerce-fullstack-e2e

# Keep services running for debugging
E2E_KEEP_RUNNING=true pnpm nx e2e ecommerce-fullstack-e2e
```

**When it runs:** Main branch + nightly builds

### Performance Tests (k6)

**Location:** `e2e/k6/`

Load tests, chaos tests, and resilience validation.

```bash
# Via Nx (recommended)
pnpm nx load-test k6-perf
pnpm nx resilience-test k6-perf
pnpm nx circuit-breaker-test k6-perf

# Via Docker Compose
pnpm nx load-test k6-perf --configuration=docker

# Direct k6 execution (requires k6 installed)
k6 run e2e/k6/load-test.js
```

**When it runs:** On-demand, pre-release

---

## WireMock Mappings

**Location:** `e2e/wiremock/mappings/`

Stub definitions for external services. Used by:
- Docker Compose stack (mounted as volume)
- Full-stack E2E tests
- Performance tests

### Adding New Mappings

1. Create JSON file in `wiremock/mappings/`
2. Follow existing naming conventions
3. Include chaos variants if needed (e.g., `*-chaos.json`)

---

## Test Data

**Location:** `e2e/data/`

Generated test data for load tests. Regenerate with:

```bash
cd e2e && node src/generate-input.js 1000
```

---

## E2E Docker Configuration

The E2E Docker stack (`docker/docker-compose.e2e.yml`) includes:

| Service | Internal Port | External Port | Notes |
|---------|---------------|---------------|-------|
| product-service | 8090 | 8090 | Uses `docker` Spring profile |
| cart-service | 8082 | 8081 | Note: internal port is 8082 |
| customer-service | 8083 | - | Internal only |
| discount-service | 8085 | - | Internal only |
| fulfillment-service | 8080 | - | Internal only |
| ecommerce-web | 3000 | 4200 | nginx serving static files |
| wiremock | 8080 | 8082 | API mocks |
| postgres | 5432 | 5433 | E2E database |
| redis | 6379 | 6380 | Cache |

### E2E-Specific Configuration

The E2E stack uses `docker/nginx-frontend-e2e.conf` which:
- Routes `/products` to product-service
- Routes `/carts` to cart-service (port 8082)
- Adds default request headers for E2E (`x-store-number`, etc.)
- Routes `/auth`, `/oauth2`, `/.well-known` to WireMock fake auth

---

## Related Documentation

- [Backend E2E Testing Standard](../docs/standards/backend/testing-e2e.md)
- [Frontend Testing Standard](../docs/standards/frontend/testing.md)
- [k6 Documentation](https://k6.io/docs/)
- [Playwright Documentation](https://playwright.dev/)
- [MSW Documentation](https://mswjs.io/)
