# AGENTS.md - E2E Testing

Guidance for AI agents working with end-to-end and performance tests.

---

## Overview

This directory contains full-stack E2E tests and performance tests:

| Type | Location | Purpose |
|------|----------|---------|
| Full-Stack E2E | `{app}-fullstack/` | Playwright tests against real Docker services |
| Performance | `k6/` | Load tests, chaos tests, resilience validation |
| API Mocks | `wiremock/` | WireMock stub definitions for backend services |

### Full-Stack E2E Suites

| Suite | Directory | Target App |
|-------|-----------|------------|
| E-commerce | `ecommerce-fullstack/` | ecommerce-web |
| POS | `pos-fullstack/` | pos-web |
| Kiosk | `kiosk-fullstack/` | kiosk-web |
| Merchant Portal | `merchant-portal-fullstack/` | merchant-portal-web |

**IMPORTANT:** Mocked E2E tests live in `apps/{app}/e2e/` or `apps/{app}-e2e/`, NOT in this directory. The `e2e/` directory is exclusively for full-stack integration tests that require real backend services.

---

## Conventions

### Test Selection

- **Adding frontend tests?** Use `apps/{app}/e2e/` or `apps/{app}-e2e/` (MSW mocks, fast)
- **Testing service integration?** Use `e2e/{app}-fullstack/` (real services)
- **Testing performance/resilience?** Use `e2e/k6/`
- **Mocking external APIs for backend?** Add to `e2e/wiremock/mappings/`

**Never use MSW or mocks in the `e2e/` directory.** All tests here must run against real backend services.

### WireMock Mappings

```
wiremock/mappings/
├── merchandise.json       # Product catalog mock
├── price.json             # Pricing service mock
├── inventory.json         # Inventory mock
├── oauth/                 # OAuth provider mocks
│   └── jwks.json
├── fake-auth/             # Development auth mocks
│   ├── token.json
│   └── jwks.json
└── *-chaos.json           # Chaos variants (delayed/failing responses)
```

**Naming:** Use lowercase with hyphens. Add `-chaos.json` suffix for failure scenarios.

### k6 Tests

```
k6/
├── load-test.js           # Basic throughput testing
├── resilience-test.js     # Multi-phase chaos testing
├── circuit-breaker-test.js # Circuit breaker validation
├── chaos-controller.js    # WireMock chaos control helpers
└── *.md                   # Documentation per test
```

**Pattern:** Each `.js` test should have a corresponding `.md` documenting scenarios and thresholds.

### Full-Stack E2E

```
ecommerce-fullstack/
├── specs/                 # Playwright test files
├── fixtures/              # Seed data scripts
│   └── seed-data.ts
├── playwright.config.ts
└── global-setup.ts        # Pre-test setup (wait for services)
```

**Pattern:** Use seeded data with predictable IDs (e.g., `e2e-cart-001`).

---

## Warnings

- **Do not run k6 tests in CI without throttling** - they can overwhelm services
- **WireMock mappings are shared** - changes affect dev, e2e, and perf tests
- **Full-stack tests require Docker** - ensure services are healthy before running
- **Seed data is idempotent** - running seed-data.ts multiple times is safe

---

## Commands

```bash
# Full-stack E2E
docker compose -f docker/docker-compose.e2e.yml up -d --build
npx tsx e2e/ecommerce-fullstack/fixtures/seed-data.ts
pnpm nx e2e ecommerce-fullstack-e2e

# Performance tests (via Nx)
pnpm nx load-test k6-perf
pnpm nx resilience-test k6-perf
pnpm nx circuit-breaker-test k6-perf

# Performance tests (via Docker)
pnpm nx load-test k6-perf --configuration=docker

# Generate test data
pnpm nx generate-data k6-perf
```

---

## Related Files

- `docker/docker-compose.yml` - k6 and WireMock service definitions
- `docker/docker-compose.e2e.yml` - E2E-specific compose stack
- `docs/standards/backend/testing-e2e.md` - Backend E2E standards
- `apps/ecommerce-web/e2e/` - Mocked frontend E2E tests
