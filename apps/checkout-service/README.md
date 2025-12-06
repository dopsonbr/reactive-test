# Checkout Service

Order checkout and payment processing service with multi-service orchestration.

## Purpose

Orchestrates multi-step checkout process by coordinating cart validation, discount calculation, fulfillment reservation, payment processing, and order creation.

## Behavior

Exposes a two-phase checkout API: initiate validates cart and creates fulfillment reservation with temporary checkout session; complete processes payment and persists order to PostgreSQL. Orders can be retrieved by ID or listed by store number.

## Features

- **Two-Phase Checkout**: Initiate validates cart, reserves fulfillment; complete processes payment
- **Multi-Service Orchestration**: Coordinates cart, discount, fulfillment, and payment services
- **PostgreSQL Persistence**: R2DBC reactive database with JSONB columns for nested data
- **OAuth2 Security**: Resource server with JWT validation and scope-based authorization
- **Validation**: Comprehensive request validation with error aggregation
- **Resilience4j**: Circuit breaker, retry, timeout, bulkhead patterns for external calls
- **Structured Logging**: JSON logs with trace correlation

## API Endpoints

All endpoints require the following headers:

| Header | Required | Format | Description |
|--------|----------|--------|-------------|
| x-store-number | Yes | 1-2000 | Store context |
| x-order-number | Yes | UUID | Order correlation |
| x-userid | Yes | 6 alphanumeric | User identifier |
| x-sessionid | Yes | UUID | Session correlation |
| Authorization | Yes | Bearer JWT | OAuth2 token with checkout:read or checkout:write scope |

### Checkout Operations

| Method | Path | Description | Scope |
|--------|------|-------------|-------|
| POST | `/checkout/initiate` | Begin checkout process | checkout:write |
| POST | `/checkout/complete` | Complete checkout with payment | checkout:write |

### Order Operations

| Method | Path | Description | Scope |
|--------|------|-------------|-------|
| GET | `/orders/{orderId}` | Get order by ID | checkout:read |
| GET | `/orders?storeNumber={n}` | List orders by store | checkout:read |

## Request/Response Examples

### Initiate Checkout

```http
POST /checkout/initiate
Content-Type: application/json
Authorization: Bearer <jwt-token>

{
  "cartId": "550e8400-e29b-41d4-a716-446655440000",
  "storeNumber": 100,
  "customerId": "customer-123",
  "fulfillmentType": "DELIVERY",
  "deliveryAddress": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001"
  }
}
```

### Complete Checkout

```http
POST /checkout/complete
Content-Type: application/json
Authorization: Bearer <jwt-token>

{
  "checkoutSessionId": "session-uuid",
  "paymentMethod": "CREDIT_CARD",
  "paymentToken": "tok_visa_123"
}
```

## Architecture

```
CheckoutController
        ↓
CheckoutRequestValidator
        ↓
CheckoutService ────────────────────────────────────────────┐
        │                                                   │
        ├──→ CartServiceClient (validates cart)             │
        │         ↓                                         │
        │    cart-service                                   │
        │                                                   │
        ├──→ DiscountServiceClient (calculates discounts)   │
        │         ↓                                         │
        │    discount-service                               │
        │                                                   │
        ├──→ FulfillmentServiceClient (reserves inventory)  │
        │         ↓                                         │
        │    fulfillment-service                            │
        │                                                   │
        └──→ PaymentGatewayClient (processes payment)       │
                  ↓                                         │
             payment-gateway (external)                     │
                                                            │
        PostgresOrderRepository ←───────────────────────────┘
                  ↓
            PostgreSQL
```

## Configuration

```yaml
server:
  port: 8087

spring:
  r2dbc:
    url: r2dbc:postgresql://localhost:5432/checkoutdb
    username: checkout_user
    password: checkout_pass
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: ${OAUTH_ISSUER_URI}
          jwk-set-uri: ${OAUTH_JWKS_URI}

external:
  cart-service:
    url: http://localhost:8081
  discount-service:
    url: http://localhost:8084
  fulfillment-service:
    url: http://localhost:8085
  payment-gateway:
    url: http://localhost:8090
```

## Running

### Local Development

```bash
# Start PostgreSQL
docker run -d --name postgres -p 5432:5432 \
  -e POSTGRES_DB=checkoutdb \
  -e POSTGRES_USER=checkout_user \
  -e POSTGRES_PASSWORD=checkout_pass \
  postgres:15-alpine

# Run with Gradle
./gradlew :apps:checkout-service:bootRun
```

### Docker Compose

```bash
# Build JAR
./gradlew :apps:checkout-service:bootJar

# Start full stack
cd docker && docker compose up -d
```

## Testing

```bash
# Run all tests
./gradlew :apps:checkout-service:test

# Run specific test class
./gradlew :apps:checkout-service:test --tests '*CheckoutServiceTest*'
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
org.example.checkout/
├── CheckoutServiceApplication.java
├── client/
│   ├── CartServiceClient.java
│   ├── DiscountServiceClient.java
│   ├── FulfillmentServiceClient.java
│   └── PaymentGatewayClient.java
├── config/
│   ├── R2dbcConfiguration.java
│   └── SecurityConfig.java
├── controller/
│   └── CheckoutController.java
├── dto/
│   ├── CheckoutSummaryResponse.java
│   ├── CompleteCheckoutRequest.java
│   ├── InitiateCheckoutRequest.java
│   └── OrderResponse.java
├── model/
│   ├── AppliedDiscount.java
│   ├── CustomerSnapshot.java
│   ├── DeliveryAddress.java
│   ├── FulfillmentDetails.java
│   ├── FulfillmentType.java
│   ├── Order.java
│   ├── OrderLineItem.java
│   ├── OrderStatus.java
│   └── PaymentStatus.java
├── repository/
│   ├── JsonValue.java
│   ├── OrderEntity.java
│   ├── OrderEntityRepository.java
│   ├── OrderRepository.java
│   └── PostgresOrderRepository.java
├── service/
│   └── CheckoutService.java
└── validation/
    ├── CartValidator.java
    └── CheckoutRequestValidator.java
```
