# Cart Service

Shopping cart management service with Redis persistence.

## Features

- **Cart Management**: Create, read, update carts with items
- **Redis Persistence**: Non-blocking reactive Redis operations
- **Reactive WebFlux**: Non-blocking I/O with Project Reactor
- **Structured Logging**: JSON logs with trace correlation

## API Endpoints

### Create Cart

```http
POST /carts
```

**Headers:**
| Header | Required | Format |
|--------|----------|--------|
| x-store-number | Yes | 1-2000 |
| x-order-number | Yes | UUID |
| x-userid | Yes | 6 alphanumeric |
| x-sessionid | Yes | UUID |

**Response (201 Created):**
```json
{
  "id": "cart-uuid",
  "userId": "abc123",
  "items": [],
  "createdAt": "2024-01-01T12:00:00Z",
  "updatedAt": "2024-01-01T12:00:00Z"
}
```

### Get Cart

```http
GET /carts/{cartId}
```

**Response:**
```json
{
  "id": "cart-uuid",
  "userId": "abc123",
  "items": [
    {
      "sku": "SKU123",
      "quantity": 2,
      "price": 29.99
    }
  ],
  "createdAt": "2024-01-01T12:00:00Z",
  "updatedAt": "2024-01-01T12:30:00Z"
}
```

### Add/Update Item

```http
PUT /carts/{cartId}/items
```

**Request Body:**
```json
{
  "sku": "SKU123",
  "quantity": 2,
  "price": 29.99
}
```

### Remove Item

```http
DELETE /carts/{cartId}/items/{sku}
```

### Get Cart Summary

```http
GET /carts/{cartId}/summary
```

**Response:**
```json
{
  "cartId": "cart-uuid",
  "itemCount": 5,
  "total": 149.95
}
```

## Architecture

```
CartController
      ↓
CartService
      ↓
ReactiveRedisTemplate
      ↓
   Redis
```

## Configuration

```yaml
spring:
  data:
    redis:
      host: localhost
      port: 6379
      timeout: 1000ms

server:
  port: 8082
```

## Running

### Local Development

```bash
# Start Redis
docker run -d --name redis -p 6379:6379 redis:7-alpine

# Run with Gradle
./gradlew :apps:cart-service:bootRun
```

### Docker

```bash
# Build JAR
./gradlew :apps:cart-service:bootJar

# Start with Docker Compose
cd docker && docker compose up -d
```

## Testing

```bash
# Run all tests
./gradlew :apps:cart-service:test

# Run specific test class
./gradlew :apps:cart-service:test --tests '*CartServiceTest*'
```

## Observability

### Metrics

```http
GET /actuator/prometheus
```

### Health

```http
GET /actuator/health
```

## Package Structure

```
org.example.cart/
├── CartServiceApplication.java
├── controller/
│   └── CartController.java
├── service/
│   └── CartService.java
└── domain/
    ├── Cart.java
    └── CartItem.java
```

## Data Model

### Cart

| Field | Type | Description |
|-------|------|-------------|
| id | String | Cart UUID |
| userId | String | User identifier |
| items | List<CartItem> | Cart items |
| createdAt | Instant | Creation timestamp |
| updatedAt | Instant | Last update timestamp |

### CartItem

| Field | Type | Description |
|-------|------|-------------|
| sku | String | Product SKU |
| quantity | int | Item quantity |
| price | BigDecimal | Unit price |

## Differences from Product Service

| Feature | Product Service | Cart Service |
|---------|-----------------|--------------|
| External HTTP calls | Yes (3 services) | No |
| Resilience4j | Full (CB, retry, timeout, bulkhead) | Not needed |
| Caching strategy | Cache-aside / Fallback-only | Direct Redis persistence |
| OAuth2 | Yes | Not yet implemented |
| Complexity | High (aggregation) | Low (CRUD) |
