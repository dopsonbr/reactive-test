# Reactive Test

This repo tests logging behavior and reactive context propagation in Spring WebFlux.

## Goal

Validate that request metadata is accurately propagated through reactive chains and appears correctly in all log statements.

### Request Headers

| Metadata | Header | Format |
|----------|--------|--------|
| Store Number | `x-store-number` | Integer 1-2000 |
| Order Number | `x-order-number` | UUID |
| User ID | `x-userid` | 6 alphanumeric chars |
| Session ID | `x-sessionid` | UUID |

## Architecture

```
Controller/
    ProductController       # GET /products/{sku} - validates input, creates Reactor Context

Domain/
    Product                 # { sku, description, price, availableQuantity }

Services/
    ProductService          # Orchestrates parallel calls to repositories

Repository/
    MerchandiseRepository   # GET  /merchandise/{sku} → description
    PriceRepository         # POST /price            → price
    InventoryRepository     # POST /inventory        → availableQuantity
```

All repository calls execute **in parallel**.

## Logging

- **Format:** Structured JSON
- **Context propagation:** Reactor Context
- **Filters:**
  - Inbound: Request/response at controller layer with metadata 
  - Outbound: Request/response for each external HTTP call with metadata

examples
controller request:

```json
{
  "level": "info",
  "logger": "productscontroller",
  "metadata": {
    "storeNumber": 1234,
    "orderNumber": "abc-123",
    "userId": "foo124",
    "sessionId": "145a-arst-123-ar23"
  },
  "data": {
    "type": "request",
    "path": "/products/{sku}",
    "uri": "/products/1234",
    "method": "GET",
    "headers": [],
    "payload": {}
  }
}
```
controller response
```json
{
  "level": "info",
  "logger": "productscontroller",
  "metadata": {
    "storeNumber": 1234,
    "orderNumber": "abc-123",
    "userId": "foo124",
    "sessionId": "145a-arst-123-ar23"
  },
  "data": {
    "type": "response",
    "path": "/products/{sku}",
    "uri": "/products/1234",
    "method": "GET",
    "status": 200,
    "headers": [],
    "payload": {}
  }
}
```
repository request
```json
{
  "level": "info",
  "logger": "pricerepository",
  "metadata": {
    "storeNumber": 1234,
    "orderNumber": "abc-123",
    "userId": "foo124",
    "sessionId": "145a-arst-123-ar23"
  },
  "data": {
    "type": "request",
    "path": "/price", //uri template
    "host": "localhost:8081",
    "uri": "/price",
    "method": "POST",
    "headers": [],
    "payload": { "sku":  12354}
  }
}
```

repository response
```json
{
  "level": "info",
  "logger": "priceerepository",
  "metadata": {
    "storeNumber": 1234,
    "orderNumber": "abc-123",
    "userId": "foo124",
    "sessionId": "145a-arst-123-ar23"
  },
  "data": {
    "type": "response",
    "path": "/price", //uri template
    "host": "localhost:8081",
    "uri": "/price",
    "method": "POST",
    "headers": [],
    "status": 200,
    "payload": {"price":  "12.34"}
  }
}
```
service log
```json
{
  "level": "info",
  "logger": "productservice",
  "metadata": {
    "storeNumber": 1234,
    "orderNumber": "abc-123",
    "userId": "foo124",
    "sessionId": "145a-arst-123-ar23"
  },
  "data": {
    "message": "some message"
  }
}
```
### Expected Log Sequence (per request)
1. Inbound request (controller) 
2. ProductService start/checkpoints
3. Outbound request/response × 3 (parallel)
4. Inbound response (controller)


## Configuration

External service URLs configured in `application.properties`:
- Merchandise service base URL
- Price service base URL
- Inventory service base URL

## Docker Compose (Recommended)

The easiest way to run the application with full observability is using Docker Compose.

### Prerequisites
- Docker and Docker Compose
- Java 21 (for building the JAR)

### Quick Start

```bash
# Build the application JAR
./gradlew bootJar

# Start the observability stack
cd docker
docker compose up -d

# Wait for services to be healthy
docker compose ps

# Run load test (10k requests)
docker compose --profile test up k6

# Stop everything
docker compose --profile test down -v
```

### Services

| Service | Port | Description |
|---------|------|-------------|
| reactive-test | 8080 | Spring Boot application |
| wiremock | 8081 | Mock external services |
| grafana | 3000 | Dashboards (admin/admin) |
| prometheus | 9090 | Metrics |
| loki | 3100 | Logs |
| tempo | 3200 | Traces |

### Grafana Dashboards

Access Grafana at http://localhost:3000 (admin/admin):

- **Reactive Test Application** - Custom dashboard with request rate, latency, errors, and logs
- **Spring Boot Observability** - Community dashboard with detailed Spring Boot metrics

### Observability Features

1. **Logs → Traces**: Click trace ID in Loki to jump to Tempo trace
2. **Traces → Logs**: View related logs for any trace in Tempo
3. **Metrics → Traces**: Exemplars link Prometheus metrics to traces
4. **Structured JSON Logs**: All logs include `traceId` and `spanId` for correlation

### Log Format

```json
{
  "level": "info",
  "logger": "productscontroller",
  "traceId": "abc123...",
  "spanId": "def456...",
  "metadata": {
    "storeNumber": 1234,
    "orderNumber": "uuid",
    "userId": "user123",
    "sessionId": "session-uuid"
  },
  "data": { "type": "request|response|message", ... }
}
```

## Testing

### Performance Test (Docker)

```bash
cd docker
docker compose --profile test up k6
```

This runs 10k requests across 50 virtual users, with metrics sent to Prometheus.

### Performance Test (Local)
- **Goal:** 10k requests, validate metadata correlation across all logs
- **Runner:** k6 (standalone script)
- **Mock server:** WireMock standalone (responses 15-75ms latency)
- **Data:** All request inputs and mock responses are generated/faked

### Test Script Workflow
1. Start WireMock with stubs
2. Start Spring Boot application
3. Execute k6 performance test
4. Inspect logs for metadata correlation
5. Shutdown services

## Implementation Plan

1. Create ProductController with inbound logging filter
2. Implement Reactor Context propagation for metadata
3. Create domain model and ProductService
4. Create repositories with outbound logging filter
5. Configure structured JSON logging
6. Set up WireMock standalone with stubs
7. Build k6 performance test script
8. Create test orchestration script
9. Validate log correlation