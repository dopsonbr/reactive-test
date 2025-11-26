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
    MerchandiseRepository   # GET  /merchandise/{sku} → description (cache-aside)
    PriceRepository         # POST /price            → price (cache-aside)
    InventoryRepository     # POST /inventory        → availableQuantity (fallback-only cache)

Cache/
    ReactiveCacheService    # Interface for reactive cache operations
    RedisCacheService       # Redis implementation with graceful degradation
    CacheKeyGenerator       # Consistent key generation (e.g., merchandise:sku:123)

Resilience/
    ReactiveResilience      # Circuit breaker, retry, timeout, bulkhead decorators
```

All repository calls execute **in parallel**. Merchandise and Price check cache first; Inventory always calls HTTP first and uses cache only on errors.

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
    "payload": {...}
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
    "payload": {..}
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
| redis | 6379 | Cache (merchandise, price, inventory fallback) |
| grafana | 3000 | Dashboards (admin/admin) |
| prometheus | 9090 | Metrics |
| loki | 3100 | Logs |
| tempo | 3200 | Traces |
| redis-exporter | 9121 | Redis metrics for Prometheus |

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

## Resilience & Chaos Testing

The application includes Resilience4j for fault tolerance and chaos testing capabilities.

### Resilience4j Features

Each external service call (price, merchandise, inventory) is protected with:

| Pattern | Configuration | Purpose |
|---------|--------------|---------|
| Circuit Breaker | 50% failure threshold, 10s open duration | Fail fast when service is down |
| Retry | 3 attempts, exponential backoff | Handle transient failures |
| Timeout | 2 seconds | Prevent hanging requests |
| Bulkhead | 25 concurrent calls | Limit resource consumption |

### Fallback Behavior

When a service fails, the application returns degraded responses:

| Service | Fallback Value |
|---------|---------------|
| Price | `"0.00"` |
| Merchandise | `"Description unavailable"` |
| Inventory | `-1` (backordered) or cached value |

## Redis Caching

The application uses Redis for caching with two distinct patterns based on data volatility.

### Caching Patterns

#### Cache-Aside (Merchandise & Price)

For relatively stable data, the cache is checked **before** making HTTP calls:

```
Request → Check Cache → [HIT] → Return cached value
                     → [MISS] → Call HTTP → Store in cache → Return value
```

- **Merchandise**: Product descriptions rarely change (TTL: 15 minutes)
- **Price**: Prices change occasionally (TTL: 2 minutes)

#### Fallback-Only (Inventory)

For volatile data, HTTP is **always called first**. Cache is only used as a fallback after errors:

```
Request → Call HTTP (with retry) → [SUCCESS] → Update cache → Return value
                                 → [ERROR] → Check cache → [HIT] → Return cached (stale) value
                                                        → [MISS] → Return -1 (backordered)
```

- **Inventory**: Real-time stock data should never show stale values unless the service is unavailable
- The `-1` value indicates "backordered" status when both HTTP and cache fail
- TTL: 30 seconds (only used as emergency fallback)

### Cache Configuration

All TTLs are configurable via `application.yml`:

```yaml
cache:
  merchandise:
    ttl: 15m    # Product descriptions
  price:
    ttl: 2m     # Prices (more volatile)
  inventory:
    ttl: 30s    # Fallback cache only

spring:
  data:
    redis:
      host: localhost  # 'redis' in Docker
      port: 6379
      timeout: 1000ms
```

### Cache Keys

Keys follow a consistent pattern for easy debugging:

| Service | Key Pattern | Example |
|---------|------------|---------|
| Merchandise | `merchandise:sku:{sku}` | `merchandise:sku:123456` |
| Price | `price:sku:{sku}` | `price:sku:123456` |
| Inventory | `inventory:sku:{sku}` | `inventory:sku:123456` |

### Graceful Degradation

The application continues working if Redis is unavailable:
- Cache operations return empty/false on Redis errors (no exceptions propagate)
- Repositories fall back to direct HTTP calls
- No impact on application availability

### Redis in Docker

Redis and Redis Exporter are included in the Docker Compose stack:

```bash
# Check Redis status
docker exec redis redis-cli ping

# View cache keys
docker exec redis redis-cli keys "*"

# Check cache hit/miss stats
docker exec redis redis-cli INFO stats | grep keyspace

# Clear all cache
docker exec redis redis-cli FLUSHALL
```

### Redis Metrics in Grafana

The Grafana dashboard includes Redis panels:

- **Redis Memory Used** - Current memory consumption
- **Redis Clients** - Connected client count
- **Redis Keys** - Total cached keys
- **Cache Hit Rate** - Percentage of cache hits
- **Cache Hits vs Misses** - Rate over time
- **Redis Commands/sec** - Command throughput

### Chaos Testing (Docker)

Run multi-phase chaos tests that inject failures and verify resilience:

```bash
cd docker

# Start the stack
docker compose up -d

# Run resilience test (baseline → errors → timeouts → full chaos → recovery)
docker compose --profile chaos up k6-resilience

# Run circuit breaker specific test
docker compose --profile chaos run k6-circuit-breaker

# Stop everything
docker compose --profile chaos down -v
```

### Chaos Test Phases

The `resilience-test.js` runs through these phases:

| Phase | Duration | Scenario |
|-------|----------|----------|
| Baseline | 30s | All services healthy |
| Price Errors | 30s | Price service returns 500s |
| Merchandise Timeout | 30s | Merchandise service times out |
| Inventory 503 | 30s | Inventory returns 503 (retryable) |
| Full Chaos | 30s | All services degraded |
| Recovery | 30s | Services restored to healthy |

### WireMock Chaos Scenarios

Toggle chaos scenarios via WireMock API:

```bash
# Enable 500 errors on price service
curl -X PUT http://localhost:8081/__admin/scenarios/price-chaos/state \
  -H "Content-Type: application/json" \
  -d '{"state": "error-500"}'

# Enable timeout on merchandise service
curl -X PUT http://localhost:8081/__admin/scenarios/merchandise-chaos/state \
  -H "Content-Type: application/json" \
  -d '{"state": "timeout"}'

# Reset to normal
curl -X PUT http://localhost:8081/__admin/scenarios/price-chaos/state \
  -H "Content-Type: application/json" \
  -d '{"state": "Started"}'
```

Available chaos states: `Started` (normal), `error-500`, `error-503`, `timeout`, `slow`

### Resilience Metrics in Grafana

The Grafana dashboard includes Resilience4j panels:

- **Circuit Breaker State** - Shows CLOSED (green), HALF_OPEN (yellow), or OPEN (red)
- **Failure Rate** - Percentage of failed calls per service
- **Retry Calls** - Successful with/without retry, failed after retries
- **Timeout Calls** - Successful vs timed out requests

### Actuator Endpoints

Resilience4j metrics are exposed via Spring Actuator:

```bash
# Circuit breaker status
curl http://localhost:8080/actuator/circuitbreakers

# Health with circuit breaker details
curl http://localhost:8080/actuator/health

# Prometheus metrics
curl http://localhost:8080/actuator/prometheus | grep resilience4j
```
