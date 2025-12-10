me# Reactive Retail Platform

Modern retail reference system built on Spring WebFlux. The original goal (reactive logging propagation) has evolved into a full-featured, multi-service retail stack with resilience, caching, observability, and planned frontends.

## Quick Start (Progressive Disclosure)
- Build everything: `./gradlew buildAll`
- Run all tests: `./gradlew testAll`
- Run one service locally: `./gradlew :apps:product-service:bootRun` (swap module as needed)
- Docker stack (apps + infra + observability):
  ```bash
  ./gradlew :apps:product-service:bootJar :apps:cart-service:bootJar :apps:customer-service:bootJar :apps:discount-service:bootJar :apps:fulfillment-service:bootJar :apps:audit-service:bootJar
  cd docker && docker compose up -d
  ```
- Check health: `docker compose ps` then hit the service actuator endpoint (e.g., `http://localhost:8080/actuator/health`).

## Service Lineup

| Service | Host Port | Purpose |
|---------|-----------|---------|
| product-service | 8090 | Product aggregation (merchandise, price, inventory) |
| cart-service | 8081 | Cart and checkout |
| customer-service | 8083 | Customer profiles |
| discount-service | 8085 | Discounts and promos |
| fulfillment-service | 8085 (collision to be resolved) | Fulfillment orchestration |
| audit-service | 8086 | Audit/compliance |
| wiremock | 8082 | Mock external services |
| Observability | 3000 (Grafana), 9090 (Prometheus), 3100 (Loki), 3200 (Tempo) |

> Port collisions are being reconciled; see `tools/check-service-ports.sh` and `019_monorepo_prep.md`.

## Core Practices (What Changed)
- **Retail-first:** End-to-end retail flows, not just logging demos.
- **Reactive services:** Spring WebFlux with Reactor Context for metadata propagation.
- **Resilience:** Circuit breakers, retries, timeouts, bulkheads via Resilience4j.
- **Caching:** Redis with cache-aside and fallback-only patterns.
- **Observability:** Structured JSON logs, metrics, and traces wired into Grafana/Prometheus/Loki/Tempo.
- **Frontends (planned):** React/Nx with shared design system and cross-cutting hooks (auth, telemetry), browser-first by default.

## Request Metadata Headers

| Metadata | Header | Format |
|----------|--------|--------|
| Store Number | `x-store-number` | Integer 1-2000 |
| Order Number | `x-order-number` | UUID |
| User ID | `x-userid` | 6 alphanumeric chars |
| Session ID | `x-sessionid` | UUID |

Headers are mandatory and flow through Reactor Context for logging, tracing, and downstream calls.

## Where to Learn More
- **Agent/developer guide:** `AGENTS.md`
- **Repository map:** `CONTENTS.md`
- **Standards:** `docs/standards/` (see `frontend-guiding-principles.md` for upcoming UI work)
- **ADRs:** `docs/ADRs/` (frontend monorepo strategy in `006_frontend_monorepo_strategy.md`)
- **Plans:** active in repo root (e.g., `019_monorepo_prep.md`), archived in `docs/archive/`
- **Port checks:** `tools/check-service-ports.sh` (`docs/port-mapping-check.md`)
