# Cart Service

Shopping cart management service with PostgreSQL persistence and granular CRUD operations.

## Features

- **Cart Management**: Full CRUD for carts, products, discounts, and fulfillments
- **PostgreSQL Persistence**: R2DBC reactive database with JSONB columns for nested data
- **OAuth2 Security**: Resource server with JWT validation and scope-based authorization
- **Validation**: Comprehensive request validation with error aggregation
- **External Service Integration**: Clients for product, customer, discount, fulfillment services
- **Resilience4j**: Circuit breaker, retry, timeout, bulkhead patterns
- **Structured Logging**: JSON logs with trace correlation
- **Audit Events**: Placeholder for audit event publishing

## API Endpoints

All endpoints require the following headers:

| Header | Required | Format | Description |
|--------|----------|--------|-------------|
| x-store-number | Yes | 1-2000 | Store context |
| x-order-number | Yes | UUID | Order correlation |
| x-userid | Yes | 6 alphanumeric | User identifier |
| x-sessionid | Yes | UUID | Session correlation |
| Authorization | Yes | Bearer JWT | OAuth2 token with cart:read or cart:write scope |

### Cart Lifecycle

| Method | Path | Description | Scope |
|--------|------|-------------|-------|
| POST | `/carts` | Create new cart | cart:write |
| GET | `/carts/{cartId}` | Get cart by ID | cart:read |
| GET | `/carts?storeNumber={n}` | Find carts by store | cart:read |
| DELETE | `/carts/{cartId}` | Delete cart | cart:write |

### Products

| Method | Path | Description | Scope |
|--------|------|-------------|-------|
| GET | `/carts/{cartId}/products` | List products in cart | cart:read |
| POST | `/carts/{cartId}/products` | Add product to cart | cart:write |
| GET | `/carts/{cartId}/products/{sku}` | Get product by SKU | cart:read |
| PUT | `/carts/{cartId}/products/{sku}` | Update product quantity | cart:write |
| DELETE | `/carts/{cartId}/products/{sku}` | Remove product | cart:write |

### Discounts

| Method | Path | Description | Scope |
|--------|------|-------------|-------|
| GET | `/carts/{cartId}/discounts` | List applied discounts | cart:read |
| POST | `/carts/{cartId}/discounts` | Apply discount code | cart:write |
| GET | `/carts/{cartId}/discounts/{discountId}` | Get discount details | cart:read |
| DELETE | `/carts/{cartId}/discounts/{discountId}` | Remove discount | cart:write |

### Fulfillments

| Method | Path | Description | Scope |
|--------|------|-------------|-------|
| GET | `/carts/{cartId}/fulfillments` | List fulfillments | cart:read |
| POST | `/carts/{cartId}/fulfillments` | Add fulfillment | cart:write |
| GET | `/carts/{cartId}/fulfillments/{fulfillmentId}` | Get fulfillment | cart:read |
| PUT | `/carts/{cartId}/fulfillments/{fulfillmentId}` | Update fulfillment | cart:write |
| DELETE | `/carts/{cartId}/fulfillments/{fulfillmentId}` | Remove fulfillment | cart:write |

### Customer Carts

| Method | Path | Description | Scope |
|--------|------|-------------|-------|
| GET | `/customers/{customerId}/carts` | Find carts by customer | cart:read |

## Request/Response Examples

### Create Cart

```http
POST /carts
Content-Type: application/json
Authorization: Bearer <jwt-token>

{
  "storeNumber": 100,
  "customerId": "customer-123"
}
```

**Response (201 Created):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "storeNumber": 100,
  "customerId": "customer-123",
  "customer": null,
  "products": [],
  "discounts": [],
  "fulfillments": [],
  "totals": {
    "subtotal": 0,
    "discountTotal": 0,
    "fulfillmentTotal": 0,
    "taxTotal": 0,
    "grandTotal": 0
  },
  "createdAt": "2024-01-01T12:00:00Z",
  "updatedAt": "2024-01-01T12:00:00Z"
}
```

### Add Product

```http
POST /carts/{cartId}/products
Content-Type: application/json
Authorization: Bearer <jwt-token>

{
  "sku": 123456,
  "quantity": 2
}
```

### Apply Discount

```http
POST /carts/{cartId}/discounts
Content-Type: application/json
Authorization: Bearer <jwt-token>

{
  "code": "SAVE10"
}
```

### Add Fulfillment

```http
POST /carts/{cartId}/fulfillments
Content-Type: application/json
Authorization: Bearer <jwt-token>

{
  "type": "DELIVERY",
  "skus": [123456, 234567]
}
```

## Architecture

```
CartController / CartProductController / CartDiscountController / CartFulfillmentController
                                    ↓
                                CartService
                                    ↓
         ┌──────────────────────────┼──────────────────────────┐
         ↓                          ↓                          ↓
PostgresCartRepository      ProductServiceClient      DiscountServiceClient
         ↓                    (with Resilience4j)      (with Resilience4j)
   PostgreSQL                      ↓                          ↓
  (JSONB columns)           product-service            discount-service
```

## Data Model

### Cart

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Cart identifier |
| storeNumber | int | Store context (1-2000) |
| customerId | String | Customer identifier (optional) |
| customer | CartCustomer | Customer details (optional) |
| products | List<CartProduct> | Products in cart |
| discounts | List<AppliedDiscount> | Applied discounts |
| fulfillments | List<Fulfillment> | Fulfillment options |
| totals | CartTotals | Calculated totals |
| createdAt | Instant | Creation timestamp |
| updatedAt | Instant | Last update timestamp |

### Database Schema

```sql
CREATE TABLE carts (
    id UUID PRIMARY KEY,
    store_number INTEGER NOT NULL,
    customer_id VARCHAR(255),
    customer_json JSONB,
    products_json JSONB NOT NULL DEFAULT '[]',
    discounts_json JSONB NOT NULL DEFAULT '[]',
    fulfillments_json JSONB NOT NULL DEFAULT '[]',
    totals_json JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);
```

## Configuration

```yaml
spring:
  r2dbc:
    url: r2dbc:postgresql://localhost:5432/cartdb
    username: cart_user
    password: cart_pass
  flyway:
    url: jdbc:postgresql://localhost:5432/cartdb
    user: cart_user
    password: cart_pass
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: ${OAUTH_ISSUER_URI}
          jwk-set-uri: ${OAUTH_JWKS_URI}

server:
  port: 8082
```

## Running

### Local Development

```bash
# Start PostgreSQL
docker run -d --name postgres -p 5432:5432 \
  -e POSTGRES_DB=cartdb \
  -e POSTGRES_USER=cart_user \
  -e POSTGRES_PASSWORD=cart_pass \
  postgres:15-alpine

# Run with Gradle
./gradlew :apps:cart-service:bootRun
```

### Docker Compose

```bash
# Build JAR
./gradlew :apps:cart-service:bootJar

# Start full stack
cd docker && docker compose up -d
```

## Testing

```bash
# Run all tests
./gradlew :apps:cart-service:test

# Run security tests
./gradlew :apps:cart-service:test --tests '*SecurityTest*'

# Run validation tests
./gradlew :apps:cart-service:test --tests '*ValidatorTest*'
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

### Circuit Breaker Status
```http
GET /actuator/circuitbreakers
```

## Package Structure

```
org.example.cart/
├── CartServiceApplication.java
├── config/
│   └── SecurityConfig.java
├── controller/
│   ├── CartController.java
│   ├── CartProductController.java
│   ├── CartDiscountController.java
│   ├── CartFulfillmentController.java
│   └── CartCustomerController.java
├── service/
│   └── CartService.java
├── repository/
│   ├── CartRepository.java
│   ├── PostgresCartRepository.java
│   ├── CartEntity.java
│   └── CartEntityRepository.java
├── model/
│   ├── Cart.java
│   └── CartTotals.java
├── dto/
│   ├── CreateCartRequest.java
│   ├── AddProductRequest.java
│   ├── UpdateProductRequest.java
│   ├── ApplyDiscountRequest.java
│   ├── AddFulfillmentRequest.java
│   └── UpdateFulfillmentRequest.java
├── validation/
│   └── CartRequestValidator.java
├── client/
│   ├── ProductServiceClient.java
│   ├── CustomerServiceClient.java
│   ├── DiscountServiceClient.java
│   └── FulfillmentServiceClient.java
└── audit/
    ├── AuditEvent.java
    ├── AuditEventPublisher.java
    └── NoOpAuditEventPublisher.java
```
