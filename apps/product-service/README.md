# Product Service

Product aggregation service that combines data from merchandise, price, and inventory services.

## Features

- **Product Aggregation**: Combines merchandise details, pricing, and inventory availability
- **Reactive WebFlux**: Non-blocking I/O with Project Reactor
- **Resilience4j**: Circuit breaker, retry, timeout, and bulkhead patterns
- **Redis Caching**: Cache-aside for merchandise/price, fallback-only for inventory
- **OAuth2 Security**: JWT validation for inbound requests, client credentials for downstream calls
- **Structured Logging**: JSON logs with trace correlation

## API Endpoints

### Get Product

```http
GET /products/{sku}
```

**Headers:**
| Header | Required | Format | Description |
|--------|----------|--------|-------------|
| Authorization | Yes | Bearer token | JWT access token |
| x-store-number | Yes | 1-2000 | Store identifier |
| x-order-number | Yes | UUID | Order correlation |
| x-userid | Yes | 6 alphanumeric | User identifier |
| x-sessionid | Yes | UUID | Session identifier |

**Response:**
```json
{
  "sku": 123456,
  "description": "Product Name",
  "price": "$29.99",
  "availableQuantity": 100
}
```

### Health Check

```http
GET /actuator/health
```

## Architecture

```
ProductController
       ↓
ProductService
    ↓      ↓      ↓
Merchandise  Price  Inventory
Repository   Repository   Repository
    ↓          ↓           ↓
 (HTTP)     (HTTP)      (HTTP)
    ↓          ↓           ↓
External   External   External
Service    Service    Service
```

## Configuration

### External Services

```yaml
services:
  merchandise:
    base-url: http://merchandise-service:8080
  price:
    base-url: http://price-service:8080
  inventory:
    base-url: http://inventory-service:8080
```

### Cache TTLs

```yaml
cache:
  merchandise:
    ttl: 15m    # Static data, cache longer
  price:
    ttl: 2m     # May change, shorter cache
  inventory:
    ttl: 30s    # Real-time, fallback only
```

### Resilience4j

Default configuration for all services:

| Setting | Value | Description |
|---------|-------|-------------|
| Circuit breaker window | 10 calls | Sliding window size |
| Failure threshold | 50% | Opens circuit |
| Wait in open | 10s | Before half-open |
| Retry attempts | 3 | With exponential backoff |
| Timeout | 2s | Per request |
| Bulkhead | 25 | Max concurrent calls |

### OAuth2/Security

```yaml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: http://auth-server/oauth
          jwk-set-uri: http://auth-server/oauth/.well-known/jwks.json
```

## Running

### Local Development

```bash
# Start dependencies (Redis)
docker run -d --name redis -p 6379:6379 redis:7-alpine

# Run with Gradle
./gradlew :apps:product-service:bootRun
```

### Docker

```bash
# Build JAR
./gradlew :apps:product-service:bootJar

# Start with Docker Compose (includes observability stack)
cd docker && docker compose up -d
```

## Testing

```bash
# Run all tests
./gradlew :apps:product-service:test

# Run specific test class
./gradlew :apps:product-service:test --tests '*ProductServiceIntegrationTest*'

# Run architecture tests only
./gradlew :apps:product-service:test --tests '*ArchitectureTest*'
```

## Observability

### Metrics (Prometheus)

```http
GET /actuator/prometheus
```

Key metrics:
- `http_server_requests_seconds` - Request latency
- `resilience4j_circuitbreaker_state` - Circuit breaker state
- `resilience4j_retry_calls_total` - Retry counts
- `cache_gets_total` / `cache_puts_total` - Cache stats

### Logs

JSON-structured logs with:
- `traceId` / `spanId` for distributed tracing
- `metadata` with store, order, user, session
- Component-specific logger names

### Health

```http
GET /actuator/health
```

Includes circuit breaker health indicators.

## Package Structure

```
org.example.product/
├── ProductServiceApplication.java
├── controller/
│   └── ProductController.java
├── service/
│   └── ProductService.java
├── repository/
│   ├── merchandise/
│   │   ├── MerchandiseRepository.java
│   │   └── MerchandiseResponse.java
│   ├── price/
│   │   ├── PriceRepository.java
│   │   ├── PriceRequest.java
│   │   └── PriceResponse.java
│   └── inventory/
│       ├── InventoryRepository.java
│       ├── InventoryRequest.java
│       └── InventoryResponse.java
├── domain/
│   └── Product.java
├── config/
│   ├── ProductServiceConfig.java
│   └── CacheProperties.java
├── validation/
│   └── ProductRequestValidator.java
└── security/
    ├── SecurityConfig.java
    └── OAuth2ClientConfig.java
```
