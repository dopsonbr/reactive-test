# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands

```bash
# Build the project
./gradlew build

# Run tests
./gradlew test

# Run a single test class
./gradlew test --tests "org.example.reactivetest.ReactiveTestApplicationTests"

# Run a single test method
./gradlew test --tests "org.example.reactivetest.ReactiveTestApplicationTests.contextLoads"

# Run the application
./gradlew bootRun

# Clean build
./gradlew clean build

# Build JAR for Docker
./gradlew bootJar
```

## Docker Commands

```bash
# Start full observability stack
cd docker && docker compose up -d

# Run load test (10k requests)
docker compose --profile test up k6

# Run chaos/resilience tests
docker compose --profile chaos up k6-resilience
docker compose --profile chaos run k6-circuit-breaker

# Stop everything
docker compose --profile test --profile chaos down -v

# View logs
docker compose logs -f reactive-test
```

## Project Overview

Spring Boot 3.5.x WebFlux application (Java 21) for testing logging behavior, reactive context propagation, and resilience patterns. Validates that request metadata is correctly propagated through reactive chains and the application handles failures gracefully.

**Key dependencies:**
- Spring WebFlux (reactive web stack)
- Spring Actuator with Prometheus metrics
- Resilience4j (circuit breaker, retry, timeout, bulkhead)
- OpenTelemetry (distributed tracing)
- Reactor Test for testing reactive streams

## Architecture

```
Controller/
    ProductController       # GET /products/{sku} - validates input, creates Reactor Context

Domain/
    Product                 # { sku, description, price, availableQuantity }

Services/
    ProductService          # Orchestrates parallel calls to repositories (clean business logic)

Repository/
    MerchandiseRepository   # GET  /merchandise/{sku} → description + resilience + fallback
    PriceRepository         # POST /price            → price + resilience + fallback
    InventoryRepository     # POST /inventory        → availableQuantity + resilience + fallback

Resilience/
    ReactiveResilience      # Wrapper applying circuit breaker, retry, timeout, bulkhead

Error/
    GlobalErrorHandler      # Handles Resilience4j exceptions (503, 504)
    ErrorResponse           # Structured error response model

Logging/
    StructuredLogger        # JSON logging with trace correlation
    ErrorLogData            # Error-specific log data model
```

Repository calls execute in parallel. Each repository has resilience decorators and fallback handling.

## Configuration

Configuration is in YAML format:
- `src/main/resources/application.yml` - Main config with Resilience4j settings
- `src/main/resources/application-docker.yml` - Docker-specific overrides

## Request Headers

Metadata propagated via Reactor Context:
- `x-store-number` - Integer 1-2000
- `x-order-number` - UUID
- `x-userid` - 6 alphanumeric chars
- `x-sessionid` - UUID

## Resilience4j Configuration

Each external service (price, merchandise, inventory) has:

| Pattern | Configuration |
|---------|--------------|
| Circuit Breaker | 50% failure threshold, 10s open duration, 10 call sliding window |
| Retry | 3 attempts, exponential backoff (100ms, 200ms, 400ms) |
| Timeout | 2 seconds |
| Bulkhead | 25 concurrent calls |

**Fallback values when services fail:**
- Price: `"0.00"`
- Merchandise: `"Description unavailable"`
- Inventory: `0`

## Logging

- **Format:** Structured JSON
- **Context propagation:** Reactor Context (not MDC)
- **Trace correlation:** `traceId` and `spanId` from OpenTelemetry
- **Inbound filter:** Request/response at controller layer with metadata
- **Outbound filter:** Request/response for external HTTP calls with metadata
- **Error logging:** Structured error logs with circuit breaker state

## Testing

### Load Testing
- **Script:** `perf-test/k6/load-test.js`
- **Goal:** 10k requests, < 1% failure rate, p95 < 500ms

### Chaos Testing
- **Script:** `perf-test/k6/resilience-test.js`
- **Phases:** baseline → price errors → merchandise timeout → inventory 503 → full chaos → recovery

### Circuit Breaker Testing
- **Script:** `perf-test/k6/circuit-breaker-test.js`
- **Phases:** warmup → trigger circuit → verify open → heal → verify recovery

### WireMock Chaos Scenarios
Toggle failures via WireMock API:
```bash
# Enable 500 errors
curl -X PUT http://localhost:8081/__admin/scenarios/price-chaos/state \
  -d '{"state": "error-500"}'

# Reset to normal
curl -X PUT http://localhost:8081/__admin/scenarios/price-chaos/state \
  -d '{"state": "Started"}'
```

Available states: `Started`, `error-500`, `error-503`, `timeout`, `slow`

## Observability Stack (Docker)

| Service | Port | Description |
|---------|------|-------------|
| reactive-test | 8080 | Spring Boot application |
| wiremock | 8081 | Mock external services |
| grafana | 3000 | Dashboards (admin/admin) |
| prometheus | 9090 | Metrics |
| loki | 3100 | Logs |
| tempo | 3200 | Traces |

## Actuator Endpoints

```bash
# Health with circuit breaker details
curl http://localhost:8080/actuator/health

# Circuit breaker status
curl http://localhost:8080/actuator/circuitbreakers

# Prometheus metrics
curl http://localhost:8080/actuator/prometheus | grep resilience4j
```
