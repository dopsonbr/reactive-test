# Reactive Retail Platform (AI-Native Reference)

AI-native codebase experiment that uses a realistic, multi-service retail system to see how far agents can take you when building and operating production-grade software. Nx orchestrates a polyglot monorepo (Gradle backend today, TypeScript frontends coming) with platform libraries for logging, resilience, caching, and observability.

## What You Get
- Reactive Spring WebFlux services that propagate request metadata via Reactor Context (no MDC).
- Shared platform libs: structured logging, Resilience4j wrappers, Redis cache abstractions, global error handling, and test helpers.
- Nx-driven workflows (build, test, lint, graph) that span Gradle and npm projects.
- Observability stack pre-wired for JSON logs, metrics, and traces (Grafana, Prometheus, Loki, Tempo).
- Retail domain large enough to exercise checkout flows, promos, fulfillment, and audit while stress-testing AI workflows.

## Repository Map
- `apps/` — backend services such as `product-service`, `cart-service`, `customer-service`, `discount-service`, `fulfillment-service`, `audit-service`.
- `libs/backend/platform/` — shared platform libraries (`platform-logging`, `platform-resilience`, `platform-cache`, `platform-error`, etc.).
- `libs/frontend/` — shared UI/data/design packages for the upcoming React/Nx frontends.
- `docs/` — standards, ADRs, and implementation plans (`docs/plans/active` and `docs/plans/completed`).
- `tools/` — Nx workspace plugin and health checks (e.g., `tools/check-service-ports.mjs`, `tools/check-frontend.sh`).
- `e2e/` — mocked and full-stack journeys (Playwright/k6).

## Architecture Diagrams

**System overview (built today; merchant/data services + kiosk planned)**
```mermaid
graph LR
  subgraph Frontend
    FE1["ecommerce-web (React/Vite)"]
    FE2["Merchant Portal (React/Vite) - planned"]
    FE3["Offline POS (Go/SQLite)"]
    FE4["Self-Checkout Kiosk Web - planned"]
  end

  subgraph Core Services
    product[product-service]
    cart[cart-service]
    checkout[checkout-service]
    order[order-service]
    discount[discount-service]
    fulfillment[fulfillment-service]
    customer[customer-service]
    user[user-service]
    audit[audit-service]
  end

  subgraph Data & Infra
    postgres[(Postgres)]
    redis[(Redis)]
    wiremock[WireMock]
  end

  subgraph Observability
    grafana[Grafana]
    prom[Prometheus]
    loki[Loki]
    tempo[Tempo]
  end

  FE1 --> product
  FE1 --> cart
  FE2 --> product
  FE3 --> checkout
  FE4 --> cart
  FE4 --> checkout
  FE4 --> product

  product --> discount
  product --> fulfillment
  product --> customer
  product --> user
  cart --> discount
  cart --> fulfillment
  cart --> user
  checkout --> order
  checkout --> audit

  product --> postgres
  cart --> redis
  checkout --> postgres
  order --> postgres
  fulfillment --> postgres
  customer --> postgres
  discount --> postgres
  user --> postgres

  product -.-> wiremock
  cart -.-> wiremock
```

**Product data services + merchant portal (planned)**
```mermaid
graph TD
  portal["Merchant Portal (React/Vite)"]
  merch["merchandise-service :8091"]
  price["price-service :8092"]
  inventory["inventory-service :8093"]
  product["product-service"]
  web["ecommerce-web"]
  pg[("PostgreSQL: merchandise | price | inventory schemas")]

  portal --> merch
  portal --> price
  portal --> inventory

  merch --> pg
  price --> pg
  inventory --> pg

  merch --> product
  price --> product
  inventory --> product

  product --> web
```

**Offline POS (disaster recovery)**
```mermaid
graph TD
  browser["Browser (HTML/vanilla JS)"]
  pos["Offline POS Binary (Go)"]
  sqlite[("SQLite WAL")]
  sync["Background Sync (catalog refresh, tx upload)"]
  central["Central Systems (product/cart/checkout)"]
  peripheral["Peripheral Bridge :9100"]

  browser -->|"HTTP :3000"| pos
  pos --> sqlite
  pos --> peripheral
  pos --> sync
  sync -->|"HTTPS when online"| central
```

**Self-checkout kiosk web (planned)**
```mermaid
graph TD
  kioskUI["Self-Checkout Kiosk Web (React/Vite)"]
  cartSvc["cart-service"]
  checkoutSvc["checkout-service"]
  productSvc["product-service"]
  discountSvc["discount-service"]
  fulfillmentSvc["fulfillment-service"]
  auditSvc["audit-service"]

  kioskUI --> cartSvc
  kioskUI --> checkoutSvc
  kioskUI --> productSvc
  cartSvc --> discountSvc
  cartSvc --> fulfillmentSvc
  checkoutSvc --> auditSvc
```

**Order + fulfillment flow**
```mermaid
graph LR
  rest["REST client"] --> orderSvc["order-service"]
  gql["GraphQL client"] --> orderSvc
  orderSvc --> checkoutdb[("checkoutdb.orders")]
  checkoutSvc["checkout-service"] --> checkoutdb
  checkoutSvc --> fulfillmentSvc["fulfillment-service"]
  cartSvc["cart-service"] --> fulfillmentSvc
```

## Documentation & Design Principles
- **Progressive disclosure:** Quickstart lives here; service- or feature-specific details live in app/library READMEs and plans; standards provide patterns when you need them.
- **Scoped guidance:** `AGENTS.md` files are nested—read the one nearest your path before editing to pick up local conventions.
- **Findability:** `CONTENTS.md` (repo map) and `docs/repo-explorer/` help you locate code/docs fast; `docs/index.md` routes to ADRs, standards, plans.
- **Consistency:** Templates in `docs/templates/` and standards in `docs/standards/` keep controllers, repositories, docs, and plans uniform across services and frontends.
- **Decision history:** ADRs in `docs/ADRs/` capture why; implementation plans in `docs/plans/active/` say how; completed plans are archived, never deleted.
- **AI-friendly:** Path aliases, shared types/hooks/components, and Nx project graph reduce guesswork for agents; strict lint/tests enforce boundaries early.

## Quick Start (Nx-First)
1. Install deps: `corepack enable && corepack prepare pnpm@9.15.0 --activate && pnpm install`
2. Build everything: `pnpm nx run-many -t build`
3. Test everything: `pnpm nx run-many -t test`
4. Build one module: `pnpm nx build :apps:product-service` (swap target as needed)
5. Run a service locally: `pnpm nx run :apps:product-service:bootRun` (Gradle fallback: `./gradlew :apps:product-service:bootRun`)
6. Docker stack (services + infra + observability):
   ```bash
   ./gradlew :apps:product-service:bootJar :apps:cart-service:bootJar :apps:customer-service:bootJar :apps:discount-service:bootJar :apps:fulfillment-service:bootJar :apps:audit-service:bootJar
   cd docker && docker compose up -d
   ```
   Then hit `http://localhost:8090/actuator/health` (or the service port) and check Grafana at `http://localhost:3000`.

## Development Modes
- Hybrid (recommended): `pnpm dev` to run Dockerized backends with local frontend HMR; or split into `pnpm dev:backend` / `pnpm dev:frontend`.
- Full Docker: `cd docker && docker compose up -d ecommerce-web`.
- Stop services: `pnpm stop`.

## Request Metadata Headers

| Metadata | Header | Format |
|----------|--------|--------|
| Store Number | `x-store-number` | Integer 1-2000 |
| Order Number | `x-order-number` | UUID |
| User ID | `x-userid` | 6 alphanumeric chars |
| Session ID | `x-sessionid` | UUID |

Headers are mandatory and flow through Reactor Context for logging, tracing, and downstream calls.

## Canonical Ports

| Service | Port | Notes |
|---------|------|-------|
| product-service | 8090 | Product aggregation |
| cart-service | 8081 (Docker) / 8082 (local) | Cart and checkout |
| customer-service | 8083 | Customer profiles |
| discount-service | 8084 | Discounts and promos |
| fulfillment-service | 8085 | Fulfillment orchestration |
| audit-service | 8086 | Audit/compliance |
| checkout-service | 8087 | Checkout and payment |
| order-service | 8088 | Order viewing/management |
| user-service | 8089 | User/auth service |
| wiremock | 8082 | Mock external services |
| Observability | 3000 (Grafana), 9090 (Prometheus), 3100 (Loki), 3200 (Tempo) | |

Run `node tools/check-service-ports.mjs` to validate new services.

## AI-Native Workflow Hints
- Always read scoped `AGENTS.md` files before editing; instructions nest by directory.
- Use Nx to inspect and operate the graph: `pnpm nx show projects`, `pnpm nx graph`.
- Keep implementation plans up to date in `docs/plans/active`; archive completed plans to `docs/plans/completed`.
- Prefer Reactor Context over MDC; follow Resilience4j decorator order (timeout → circuit breaker → retry → bulkhead).
- Frontend linting is strict (`pnpm lint:all`, `./tools/check-frontend.sh`); fix issues before PRs.

## Learn More
- Agent/developer guide: `AGENTS.md`
- Repository map: `CONTENTS.md`
- Standards: `docs/standards/` (backend, frontend, documentation)
- ADRs: `docs/ADRs/` (e.g., `006_frontend_monorepo_strategy.md`)
