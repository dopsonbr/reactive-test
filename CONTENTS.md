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
- `docs/archive/` - Archived plans/ADRs

## Plans
- Active plans in repo root (e.g., `019_monorepo_prep.md`)
- Archived plans in `docs/archive/`

## Tooling
- `tools/check-service-ports.sh` - Port collision/expectation checker
- `docker/` - Compose stack for apps, infra, and observability

## Tests
- `perf-test/` - k6 load/chaos test plans
- `e2e-test/` - End-to-end assets (k6, Playwright placeholders)

## Build/Config
- `build.gradle.kts`, `settings.gradle.kts`, `buildSrc/`, `gradle/` - Gradle multi-module build
- `ci/` - CI/CD configuration
