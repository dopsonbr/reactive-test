# docker-compose.yml

## Purpose

Orchestrates the complete local development and testing environment for the reactive-platform system: backend services, supporting infra (Postgres/Redis/WireMock), observability (Grafana/Prometheus/Loki/Tempo), and k6 load/chaos profiles.

## Canonical Ports

For backend service host ports, the source of truth is `tools/expected-ports.json`. Verify `docker/docker-compose.yml` matches it with:

```bash
node tools/check-service-ports.mjs
```

## Services Overview (high level)

### External Service Mock

| Service | Image | Host Port | Container Port | Purpose |
|---------|-------|-----------|----------------|---------|
| **wiremock** | wiremock/wiremock:3.10.0 | 8082 | 8080 | Mocks external APIs and supports response templating |

WireMock mappings are mounted from `../e2e/wiremock/mappings`.

### Infra

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| **postgres** | postgres:16-alpine | 5432 | Shared databases (Flyway + R2DBC) |
| **redis** | redis:7.4-alpine | 6379 | Cache + pubsub |

### Observability

| Service | Port(s) | Purpose |
|---------|---------|---------|
| **grafana** | 3000 | Dashboards (admin/admin) |
| **prometheus** | 9090 | Metrics storage |
| **loki** | 3100 | Log aggregation |
| **tempo** | 3200, 4317, 4318 | Traces + OTLP ingest |

### Backend Services (selected)

| Service | Host Port | Container Port | Notes |
|---------|-----------|----------------|-------|
| **product-service** | 8090 | 8090 | Aggregates merchandise/price/inventory |
| **cart-service** | 8081 | 8080 | Cart + checkout flows |
| **customer-service** | 8083 | 8083 | Customer profiles |
| **discount-service** | 8084 | 8084 | Promotions/discounts |
| **fulfillment-service** | 8085 | 8085 | Fulfillment orchestration |
| **audit-service** | 8086 | 8080 | Audit events |
| **checkout-service** | 8087 | 8080 | Checkout + payment |
| **order-service** | 8088 | 8088 | Orders (REST + GraphQL) |
| **user-service** | 8089 | 8089 | User/auth |
| **merchandise-service** | 8091 | 8091 | Catalog data |
| **price-service** | 8092 | 8092 | Pricing data |
| **inventory-service** | 8093 | 8093 | Inventory data |

### Frontends / Tools (selected)

| Service | Host Port | Purpose |
|---------|-----------|---------|
| **ecommerce-web** | 3001 | E-commerce UI (nginx) |
| **merchant-portal** | 3010 | Merchant UI (nginx) |
| **offline-pos** | 3005 | Offline POS binary (Go) |
| **peripheral-emulator** | 9100 (WS), 9101 (HTTP) | Peripheral bridge emulator |

### k6 Profiles

| Profile | Service(s) | Purpose |
|---------|------------|---------|
| `test-product` | `k6-product` | Product-service load test |
| `chaos-product` | `k6-product-resilience`, `k6-product-circuit-breaker` | Chaos + circuit breaker tests |
| `oauth-chaos` | `k6-oauth-chaos`, `k6-oauth-circuit-breaker` | OAuth/WireMock chaos scenarios |

## Usage

```bash
# Start core stack
docker compose up -d

# Product-service load test
docker compose --profile test-product up k6-product

# Product-service chaos tests
docker compose --profile chaos-product up k6-product-resilience
docker compose --profile chaos-product run k6-product-circuit-breaker

# Stop everything
docker compose --profile test-product --profile chaos-product --profile oauth-chaos down -v
```

## Network and Volumes

All services connect to a single `observability` bridge network. Volumes persist Grafana/Prometheus/Loki/Tempo state plus Postgres/Redis data and k6 outputs.
