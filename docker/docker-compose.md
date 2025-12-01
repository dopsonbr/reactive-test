# docker-compose.yml

## Purpose

Orchestrates the complete local development and testing environment for the reactive-test application. This file defines all services needed to run the application with full observability (metrics, logs, traces) and load/chaos testing capabilities.

## Services Overview

### External Service Mock

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| **wiremock** | wiremock/wiremock:3.10.0 | 8081 | Mocks external APIs (merchandise, price, inventory) for isolated testing |

WireMock loads mappings from `../perf-test/wiremock/mappings` and supports response templating for dynamic chaos testing scenarios.

### Observability Stack

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| **tempo** | grafana/tempo:2.6.1 | 3200, 4317, 4318 | Distributed tracing backend (receives OTLP traces) |
| **loki** | grafana/loki:3.3.2 | 3100 | Log aggregation and querying |
| **prometheus** | prom/prometheus:v2.55.1 | 9090 | Metrics collection and storage |
| **grafana** | grafana/grafana:11.4.0 | 3000 | Visualization dashboards (admin/admin) |
| **promtail** | grafana/promtail:3.3.2 | - | Log shipper (collects app logs → Loki) |

### Cache Layer

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| **redis** | redis:7.4-alpine | 6379 | Caching layer with 128MB LRU eviction |
| **redis-exporter** | oliver006/redis_exporter:v1.66.0 | 9121 | Exposes Redis metrics to Prometheus |

### Application

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| **reactive-test** | Built from Dockerfile | 8080 | The Spring Boot WebFlux application |

Configured with OpenTelemetry to send traces to Tempo via OTLP gRPC.

### Load Testing (Profile: `test`)

| Service | Purpose |
|---------|---------|
| **k6** | Runs 10,000 requests with 50 virtual users for performance validation |

### Chaos Testing (Profile: `chaos`)

| Service | Purpose |
|---------|---------|
| **k6-resilience** | Tests application behavior under various failure scenarios |
| **k6-circuit-breaker** | Validates circuit breaker open/close behavior |

## Usage

```bash
# Start core stack
docker compose up -d

# Run load tests
docker compose --profile test up k6

# Run chaos tests
docker compose --profile chaos up k6-resilience
docker compose --profile chaos run k6-circuit-breaker

# Stop everything
docker compose --profile test --profile chaos down -v
```

## Network

All services connect to a single `observability` bridge network for inter-service communication.

## Volumes

- `tempo-data`, `loki-data`, `prometheus-data`, `grafana-data` - Persistent storage for observability data
- `app-logs` - Shared volume for application logs (written by app, read by promtail)
- `redis-data` - Redis persistence
- `k6-output` - k6 test results
