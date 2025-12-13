# Repository Contents

## Core
- `README.md` - Overview, quick start, and service lineup for the retail reference system
- `AGENTS.md` - Agent/developer guidance and build/run commands
- `CONTENTS.md` - This index

## Applications (apps/)
- `product-service/` - Product aggregation (merchandise, price, inventory)
- `cart-service/` - Cart and checkout flows
- `customer-service/` - Customer profiles
- `discount-service/` - Discounts and promotions
- `fulfillment-service/` - Fulfillment orchestration
- `audit-service/` - Audit logging and compliance

## Standards and Architecture
- `docs/standards/` - Engineering standards (architecture, observability, security, testing, frontend principles)
- `docs/ADRs/` - Architectural decisions (e.g., frontend monorepo strategy)
- `docs/plans/` - Implementation plans (active + completed)

## Plans
- Active plans in `docs/plans/active/`
- Completed plans in `docs/plans/completed/`

## Tooling
- `tools/check-service-ports.mjs` - Port collision/expectation checker
- `docker/` - Compose stack for apps, infra, and observability

## Tests

All end-to-end and performance tests live under `e2e/`:

| Directory | Type | When to Use |
|-----------|------|-------------|
| `e2e/k6/` | **Performance** | Load tests, chaos tests, circuit breaker validation |
| `e2e/ecommerce-fullstack/` | **Full-Stack E2E** | Playwright tests against real Docker services (~10 min) |
| `apps/ecommerce-web/e2e/` | **Mocked E2E** | Fast Playwright tests with MSW mocks (~2 min), every PR |
| `e2e/wiremock/` | **API Mocks** | WireMock stub definitions for external services |

## Build/Config
- `build.gradle.kts`, `settings.gradle.kts`, `buildSrc/`, `gradle/` - Gradle multi-module build
- `ci/` - CI/CD configuration
