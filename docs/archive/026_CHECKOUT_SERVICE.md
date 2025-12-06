# 026_CHECKOUT_SERVICE

**Status: DRAFT**

---

## Overview

Checkout service orchestrates order completion: validates cart state, applies/verifies discounts, creates fulfillment reservations (in-store pickup, will-call, delivery), collects payment, and persists completed orders to a dedicated PostgreSQL database optimized for fast transactional writes with denormalized structure for analytics extraction.

**Related Plans:**
- `008_CART_SERVICE` - Cart data source for checkout
- `017_DISCOUNT_SERVICE` - Discount validation and application

## Goals

1. Validate complete cart state before checkout (items, quantities, prices, customer)
2. Support three fulfillment types: immediate in-store, will-call (future pickup), delivery
3. Create inventory reservations via fulfillment-service
4. Validate and apply discounts at checkout time
5. Collect payment (integration-ready, mock for MVP)
6. Persist denormalized orders to dedicated PostgreSQL (checkoutdb)
7. Design for future analytics extraction to data lake

## References

**Standards:**
- `docs/standards/backend/validation.md` - Cart and request validation (MANDATORY)
- `docs/standards/backend/architecture.md` - Layer structure and package naming

**Templates:**
- `docs/templates/backend/_template_controller.md` - Controller pattern
- `docs/templates/backend/_template_postgres_repository.md` - Repository pattern

**ADRs:**
- `docs/ADRs/002_write_data_store.md` - PostgreSQL for transactional writes

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Checkout Flow                                │
└─────────────────────────────────────────────────────────────────────┘

     Client Request
          │
          ▼
┌─────────────────┐     ┌─────────────────┐
│ CheckoutController│────►│ RequestValidator │
└────────┬────────┘     └─────────────────┘
         │
         ▼
┌─────────────────┐
│ CheckoutService │
└────────┬────────┘
         │
    ┌────┴────┬─────────────┬──────────────┐
    │         │             │              │
    ▼         ▼             ▼              ▼
┌───────┐ ┌────────┐ ┌────────────┐ ┌──────────┐
│ Cart  │ │Discount│ │Fulfillment │ │ Payment  │
│Service│ │Service │ │  Service   │ │ Gateway  │
└───────┘ └────────┘ └────────────┘ └──────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │ Reservations │
                    └─────────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│ OrderRepository │────►│   checkoutdb    │
└─────────────────┘     │   (Postgres)    │
                        └─────────────────┘
```

### Package Naming

| Module | Package |
|--------|---------|
| checkout-service | `org.example.checkout` |
| Controllers | `org.example.checkout.controller` |
| Services | `org.example.checkout.service` |
| Repositories | `org.example.checkout.repository` |
| Clients | `org.example.checkout.client` |
| DTOs | `org.example.checkout.dto` |
| Models | `org.example.checkout.model` |
| Validation | `org.example.checkout.validation` |

### Dependency Order

```
Phase 1 (Infrastructure)
        │
        ▼
Phase 2 (Domain Models + Repository)
        │
        ▼
Phase 3 (Service Clients)
        │
        ▼
Phase 4 (Core Service + Validation)
        │
        ▼
Phase 5 (Controller + Integration Tests)
        │
        ▼
Phase 6 (Docker + Documentation)
```

---

## Phase 1: Infrastructure Setup

**Prereqs:** Gradle convention plugins exist, postgres Docker service exists
**Blockers:** None

### 1.1 Create Module Structure

**Files:**
- CREATE: `apps/checkout-service/build.gradle.kts`
- MODIFY: `settings.gradle.kts` (add include)

**Implementation:**

`build.gradle.kts`:
```kotlin
plugins {
    id("platform.application-conventions")
}

dependencies {
    implementation(platform(project(":libs:platform:platform-bom")))
    implementation(project(":libs:platform:platform-logging"))
    implementation(project(":libs:platform:platform-resilience"))
    implementation(project(":libs:platform:platform-error"))
    implementation(project(":libs:platform:platform-webflux"))
    implementation(project(":libs:platform:platform-security"))

    // R2DBC for reactive Postgres
    implementation("org.springframework.boot:spring-boot-starter-data-r2dbc")
    implementation("org.postgresql:r2dbc-postgresql")

    // Flyway for migrations
    implementation("org.flywaydb:flyway-core")
    implementation("org.flywaydb:flyway-database-postgresql")
    runtimeOnly("org.postgresql:postgresql")

    // Shared models
    implementation(project(":libs:shared-model:shared-model-discount"))
    implementation(project(":libs:shared-model:shared-model-fulfillment"))
}
```

### 1.2 Database Initialization

**Files:**
- MODIFY: `docker/postgres/init-databases.sql`

**Implementation:**
```sql
-- Checkout database
CREATE DATABASE checkoutdb;
CREATE USER checkout_user WITH ENCRYPTED PASSWORD 'checkout_pass';
GRANT ALL PRIVILEGES ON DATABASE checkoutdb TO checkout_user;
\c checkoutdb
GRANT ALL ON SCHEMA public TO checkout_user;
```

### 1.3 Application Configuration

**Files:**
- CREATE: `apps/checkout-service/src/main/resources/application.yml`

**Implementation:**
```yaml
server:
  port: 8087

spring:
  application:
    name: checkout-service
  r2dbc:
    url: r2dbc:postgresql://${DB_HOST:localhost}:${DB_PORT:5432}/${DB_NAME:checkoutdb}
    username: ${DB_USERNAME:checkout_user}
    password: ${DB_PASSWORD:checkout_pass}
    pool:
      initial-size: 5
      max-size: 20
  flyway:
    enabled: true
    url: jdbc:postgresql://${DB_HOST:localhost}:${DB_PORT:5432}/${DB_NAME:checkoutdb}
    user: ${DB_USERNAME:checkout_user}
    password: ${DB_PASSWORD:checkout_pass}

services:
  cart:
    base-url: ${CART_SERVICE_URL:http://localhost:8081}
  discount:
    base-url: ${DISCOUNT_SERVICE_URL:http://localhost:8084}
  fulfillment:
    base-url: ${FULFILLMENT_SERVICE_URL:http://localhost:8085}

resilience4j:
  circuitbreaker:
    configs:
      default:
        sliding-window-size: 10
        failure-rate-threshold: 50
        wait-duration-in-open-state: 10s
    instances:
      cart: { base-config: default }
      discount: { base-config: default }
      fulfillment: { base-config: default }
  timelimiter:
    instances:
      cart: { timeout-duration: 3s }
      discount: { timeout-duration: 2s }
      fulfillment: { timeout-duration: 3s }
```

---

## Phase 2: Domain Models and Repository

**Prereqs:** Phase 1 complete, Flyway configured
**Blockers:** None

### 2.1 Database Schema

**Files:**
- CREATE: `apps/checkout-service/src/main/resources/db/migration/V1__create_orders_table.sql`

**Implementation:**
```sql
-- Denormalized order table for fast transactional writes
-- Designed for analytics extraction, not normalized relationships
CREATE TABLE orders (
    id UUID PRIMARY KEY,
    store_number INTEGER NOT NULL,
    order_number VARCHAR(50) NOT NULL UNIQUE,
    customer_id VARCHAR(100),

    -- Fulfillment type: IMMEDIATE, WILL_CALL, DELIVERY
    fulfillment_type VARCHAR(20) NOT NULL,
    fulfillment_date TIMESTAMP WITH TIME ZONE,
    reservation_id UUID,

    -- Denormalized totals (pre-calculated)
    subtotal DECIMAL(12,2) NOT NULL,
    discount_total DECIMAL(12,2) NOT NULL DEFAULT 0,
    tax_total DECIMAL(12,2) NOT NULL DEFAULT 0,
    fulfillment_cost DECIMAL(12,2) NOT NULL DEFAULT 0,
    grand_total DECIMAL(12,2) NOT NULL,

    -- Payment info
    payment_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    payment_method VARCHAR(50),
    payment_reference VARCHAR(100),

    -- Order status
    status VARCHAR(20) NOT NULL DEFAULT 'CREATED',

    -- Denormalized line items as JSONB (for analytics extraction)
    line_items JSONB NOT NULL,

    -- Denormalized discounts applied as JSONB
    applied_discounts JSONB NOT NULL DEFAULT '[]',

    -- Denormalized customer snapshot
    customer_snapshot JSONB,

    -- Denormalized fulfillment details
    fulfillment_details JSONB,

    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by VARCHAR(50),
    session_id UUID
);

-- Indexes for common queries
CREATE INDEX idx_orders_store ON orders(store_number);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
CREATE INDEX idx_orders_fulfillment_type ON orders(fulfillment_type);
CREATE INDEX idx_orders_fulfillment_date ON orders(fulfillment_date);

-- GIN index for JSONB queries (analytics)
CREATE INDEX idx_orders_line_items ON orders USING GIN(line_items);
```

### 2.2 Domain Models

**Files:**
- CREATE: `apps/checkout-service/src/main/java/org/example/checkout/model/Order.java`
- CREATE: `apps/checkout-service/src/main/java/org/example/checkout/model/OrderLineItem.java`
- CREATE: `apps/checkout-service/src/main/java/org/example/checkout/model/OrderStatus.java`
- CREATE: `apps/checkout-service/src/main/java/org/example/checkout/model/FulfillmentType.java`
- CREATE: `apps/checkout-service/src/main/java/org/example/checkout/model/PaymentStatus.java`

### 2.3 Repository Layer

**Files:**
- CREATE: `apps/checkout-service/src/main/java/org/example/checkout/repository/OrderEntity.java`
- CREATE: `apps/checkout-service/src/main/java/org/example/checkout/repository/OrderEntityRepository.java`
- CREATE: `apps/checkout-service/src/main/java/org/example/checkout/repository/OrderRepository.java`
- CREATE: `apps/checkout-service/src/main/java/org/example/checkout/repository/PostgresOrderRepository.java`

Per `docs/templates/backend/_template_postgres_repository.md` pattern.

---

## Phase 3: Service Clients

**Prereqs:** Phase 2 complete, platform-resilience available
**Blockers:** None

### 3.1 Cart Service Client

**Files:**
- CREATE: `apps/checkout-service/src/main/java/org/example/checkout/client/CartServiceClient.java`

**Implementation:**
- Fetch cart by ID with full details (items, customer, discounts)
- Circuit breaker: "cart"
- Timeout: 3s

### 3.2 Discount Service Client

**Files:**
- CREATE: `apps/checkout-service/src/main/java/org/example/checkout/client/DiscountServiceClient.java`

**Implementation:**
- Validate and calculate final discounts
- Circuit breaker: "discount"
- Timeout: 2s

### 3.3 Fulfillment Service Client

**Files:**
- CREATE: `apps/checkout-service/src/main/java/org/example/checkout/client/FulfillmentServiceClient.java`

**Implementation:**
- Create inventory reservations
- Support IMMEDIATE, WILL_CALL, DELIVERY types
- Circuit breaker: "fulfillment"
- Timeout: 3s

### 3.4 Payment Gateway Client (Mock)

**Files:**
- CREATE: `apps/checkout-service/src/main/java/org/example/checkout/client/PaymentGatewayClient.java`

**Implementation:**
- Mock implementation for MVP
- Interface ready for real payment provider

---

## Phase 4: Core Service and Validation

**Prereqs:** Phase 3 complete
**Blockers:** None

### 4.1 Request/Response DTOs

**Files:**
- CREATE: `apps/checkout-service/src/main/java/org/example/checkout/dto/InitiateCheckoutRequest.java`
- CREATE: `apps/checkout-service/src/main/java/org/example/checkout/dto/CompleteCheckoutRequest.java`
- CREATE: `apps/checkout-service/src/main/java/org/example/checkout/dto/CheckoutResponse.java`
- CREATE: `apps/checkout-service/src/main/java/org/example/checkout/dto/PaymentRequest.java`

**InitiateCheckoutRequest:**
```java
public record InitiateCheckoutRequest(
    String cartId,
    FulfillmentType fulfillmentType,
    Instant fulfillmentDate,  // Required for WILL_CALL
    DeliveryAddress deliveryAddress  // Required for DELIVERY
) {}
```

### 4.2 Validators

**Files:**
- CREATE: `apps/checkout-service/src/main/java/org/example/checkout/validation/CheckoutRequestValidator.java`
- CREATE: `apps/checkout-service/src/main/java/org/example/checkout/validation/CartValidator.java`

**CheckoutRequestValidator** validates:
- Required headers (x-store-number, x-order-number, x-userid, x-sessionid)
- Cart ID format (UUID)
- Fulfillment type valid
- Fulfillment date required for WILL_CALL (future date)
- Delivery address required for DELIVERY

**CartValidator** validates:
- Cart exists and belongs to store
- Cart has items
- All items have valid quantities (1-999)
- All items have valid prices
- Customer info present if required
- Cart not expired
- No price/inventory changes since cart creation

### 4.3 Checkout Service

**Files:**
- CREATE: `apps/checkout-service/src/main/java/org/example/checkout/service/CheckoutService.java`

**Implementation flow:**
1. `initiateCheckout()`:
   - Fetch cart from cart-service
   - Validate cart state (CartValidator)
   - Calculate/validate discounts via discount-service
   - Create reservation via fulfillment-service
   - Return checkout summary for payment

2. `completeCheckout()`:
   - Process payment via payment gateway
   - Persist order to checkoutdb
   - Mark cart as completed
   - Publish audit event
   - Return order confirmation

---

## Phase 5: Controller and Integration Tests

**Prereqs:** Phase 4 complete
**Blockers:** None

### 5.1 Checkout Controller

**Files:**
- CREATE: `apps/checkout-service/src/main/java/org/example/checkout/controller/CheckoutController.java`

**Endpoints:**
| Method | Path | Purpose |
|--------|------|---------|
| POST | `/checkout/initiate` | Validate cart, create reservation, return summary |
| POST | `/checkout/complete` | Process payment, create order |
| GET | `/orders/{orderId}` | Retrieve order by ID |
| GET | `/orders` | List orders by store (query param) |

Per `docs/templates/backend/_template_controller.md`.

### 5.2 Application Entry Point

**Files:**
- CREATE: `apps/checkout-service/src/main/java/org/example/checkout/CheckoutServiceApplication.java`

### 5.3 Integration Tests

**Files:**
- CREATE: `apps/checkout-service/src/test/java/org/example/checkout/repository/PostgresOrderRepositoryTest.java`
- CREATE: `apps/checkout-service/src/test/java/org/example/checkout/service/CheckoutServiceTest.java`
- CREATE: `apps/checkout-service/src/test/java/org/example/checkout/controller/CheckoutControllerTest.java`

Use Testcontainers for Postgres, WireMock for service clients.

---

## Phase 6: Docker and Documentation

**Prereqs:** Phase 5 complete, all tests passing
**Blockers:** None

### 6.1 Docker Configuration

**Files:**
- CREATE: `docker/Dockerfile.checkout-service`
- MODIFY: `docker/docker-compose.yml`

**docker-compose.yml addition:**
```yaml
checkout-service:
  build:
    context: ..
    dockerfile: docker/Dockerfile.checkout-service
  container_name: checkout-service
  environment:
    - SPRING_PROFILES_ACTIVE=docker
    - SPRING_R2DBC_URL=r2dbc:postgresql://postgres:5432/checkoutdb
    - SPRING_R2DBC_USERNAME=checkout_user
    - SPRING_R2DBC_PASSWORD=checkout_pass
    - CART_SERVICE_URL=http://cart-service:8081
    - DISCOUNT_SERVICE_URL=http://discount-service:8084
    - FULFILLMENT_SERVICE_URL=http://fulfillment-service:8085
  ports:
    - "8087:8080"
  depends_on:
    postgres: { condition: service_healthy }
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:8080/actuator/health"]
    interval: 30s
    timeout: 10s
    retries: 3
```

### 6.2 Nx Integration

**Files:**
- MODIFY: `nx.json` (if needed for new Gradle module detection)

---

## Files Summary

| Action | File | Purpose |
|--------|------|---------|
| CREATE | `apps/checkout-service/build.gradle.kts` | Gradle build config |
| CREATE | `apps/checkout-service/src/main/resources/application.yml` | App config |
| CREATE | `apps/checkout-service/src/main/resources/db/migration/V1__create_orders_table.sql` | DB schema |
| CREATE | `apps/checkout-service/src/main/java/org/example/checkout/model/*.java` | Domain models |
| CREATE | `apps/checkout-service/src/main/java/org/example/checkout/repository/*.java` | Repository layer |
| CREATE | `apps/checkout-service/src/main/java/org/example/checkout/client/*.java` | Service clients |
| CREATE | `apps/checkout-service/src/main/java/org/example/checkout/dto/*.java` | Request/Response DTOs |
| CREATE | `apps/checkout-service/src/main/java/org/example/checkout/validation/*.java` | Validators |
| CREATE | `apps/checkout-service/src/main/java/org/example/checkout/service/CheckoutService.java` | Core service |
| CREATE | `apps/checkout-service/src/main/java/org/example/checkout/controller/CheckoutController.java` | REST endpoints |
| CREATE | `apps/checkout-service/src/main/java/org/example/checkout/CheckoutServiceApplication.java` | Entry point |
| CREATE | `docker/Dockerfile.checkout-service` | Docker build |
| MODIFY | `settings.gradle.kts` | Include module |
| MODIFY | `docker/postgres/init-databases.sql` | Add checkoutdb |
| MODIFY | `docker/docker-compose.yml` | Add service |
| MODIFY | `CLAUDE.md` | Update service list |

---

## Testing Strategy

1. **Unit Tests:**
   - CartValidator logic with various cart states
   - CheckoutRequestValidator with invalid inputs
   - Order model creation and calculations

2. **Integration Tests:**
   - PostgresOrderRepository with Testcontainers
   - CheckoutService with mocked clients
   - Full controller tests with WebTestClient

3. **Contract Tests:**
   - WireMock stubs for cart-service, discount-service, fulfillment-service
   - Verify resilience patterns (circuit breaker triggers)

---

## Documentation Updates

| File | Update Required |
|------|-----------------|
| `CLAUDE.md` | Add checkout-service to apps table (port 8087), update service ports table |
| `apps/checkout-service/README.md` | Create service documentation |
| `apps/checkout-service/AGENTS.md` | AI guidance for checkout package |

---

## Checklist

- [ ] Phase 1: Infrastructure complete
- [ ] Phase 2: Domain models and repository complete
- [ ] Phase 3: Service clients complete
- [ ] Phase 4: Core service and validation complete
- [ ] Phase 5: Controller and tests complete
- [ ] Phase 6: Docker and documentation complete
- [ ] All tests passing (`pnpm nx test :apps:checkout-service`)
- [ ] Service starts successfully (`pnpm nx build :apps:checkout-service`)
- [ ] Docker compose up works with all dependencies
- [ ] CLAUDE.md updated with new service
