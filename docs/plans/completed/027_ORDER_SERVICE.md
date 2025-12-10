# 027_ORDER_SERVICE

**Status: DRAFT**

---

## Overview

Order service provides read and update access to sold orders created by checkout-service. Implements order search endpoints, dual REST/GraphQL APIs for viewing orders, and GraphQL mutations for order updates. Shares the `checkoutdb.orders` table with checkout-service.

**Related Plans:**
- `026_CHECKOUT_SERVICE` - Creates orders that this service reads/updates

## Goals

1. Search orders by store, customer, status, date range
2. View individual orders via REST and GraphQL
3. Update orders via GraphQL mutations (status, fulfillment, notes)
4. Follow cart-service patterns for GraphQL implementation
5. Share database with checkout-service (read/update only, no inserts)

## References

**Standards:**
- `docs/standards/backend/architecture.md` - Package structure
- `docs/standards/backend/validation.md` - Request validation

**Templates:**
- `docs/templates/backend/_template_controller.md` - Controller pattern
- `docs/templates/backend/_template_postgres_repository.md` - Repository pattern

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  REST Client    │────►│                 │     │  checkout-      │
└─────────────────┘     │  order-service  │     │  service        │
                        │                 │     │  (writes)       │
┌─────────────────┐     │  /orders/**     │     └────────┬────────┘
│ GraphQL Client  │────►│  /graphql       │              │
└─────────────────┘     └────────┬────────┘              │
                                 │                       │
                                 ▼                       ▼
                        ┌────────────────────────────────────────┐
                        │           checkoutdb.orders            │
                        │           (PostgreSQL)                 │
                        └────────────────────────────────────────┘
```

### Package Naming

| Module | Package |
|--------|---------|
| order-service | `org.example.order` |
| Controllers | `org.example.order.controller` |
| GraphQL | `org.example.order.graphql` |
| GraphQL Inputs | `org.example.order.graphql.input` |
| Services | `org.example.order.service` |
| Repositories | `org.example.order.repository` |
| DTOs | `org.example.order.dto` |
| Models | `org.example.order.model` |
| Validation | `org.example.order.validation` |
| Config | `org.example.order.config` |

### Dependency Order

```
026_CHECKOUT_SERVICE (must be implemented first - creates DB schema)
        │
        ▼
Phase 1 (Infrastructure)
        │
        ▼
Phase 2 (Models + Repository)
        │
   ┌────┴────┐
   ▼         ▼
Phase 3   Phase 4
(REST)    (GraphQL)  ← Can run in parallel
   │         │
   └────┬────┘
        ▼
Phase 5 (Tests + Docs)
```

---

## Phase 1: Infrastructure Setup

**Prereqs:** checkout-service implemented (026), `checkoutdb` exists with orders table
**Blockers:** 026_CHECKOUT_SERVICE must be complete

### 1.1 Create Module Structure

**Files:**
- CREATE: `apps/order-service/build.gradle.kts`
- MODIFY: `settings.gradle.kts`

**Implementation:**

```kotlin
plugins {
    id("platform.application-conventions")
}

dependencies {
    implementation(platform(project(":libs:platform:platform-bom")))
    implementation(project(":libs:platform:platform-logging"))
    implementation(project(":libs:platform:platform-error"))
    implementation(project(":libs:platform:platform-webflux"))
    implementation(project(":libs:platform:platform-security"))

    // R2DBC for reactive Postgres
    implementation("org.springframework.boot:spring-boot-starter-data-r2dbc")
    implementation("org.postgresql:r2dbc-postgresql")

    // GraphQL
    implementation("org.springframework.boot:spring-boot-starter-graphql")

    // Shared models
    implementation(project(":libs:shared-model:shared-model-discount"))
    implementation(project(":libs:shared-model:shared-model-fulfillment"))
    implementation(project(":libs:shared-model:shared-model-product"))
}
```

### 1.2 Application Configuration

**Files:**
- CREATE: `apps/order-service/src/main/resources/application.yml`

**Implementation:**
```yaml
server:
  port: 8088

spring:
  application:
    name: order-service
  r2dbc:
    url: r2dbc:postgresql://${DB_HOST:localhost}:${DB_PORT:5432}/${DB_NAME:checkoutdb}
    username: ${DB_USERNAME:checkout_user}
    password: ${DB_PASSWORD:checkout_pass}
    pool:
      initial-size: 5
      max-size: 20
  graphql:
    graphiql:
      enabled: true
    schema:
      locations: classpath:graphql/
```

### 1.3 Application Entry Point

**Files:**
- CREATE: `apps/order-service/src/main/java/org/example/order/OrderServiceApplication.java`

---

## Phase 2: Models and Repository

**Prereqs:** Phase 1 complete
**Blockers:** None

### 2.1 Domain Models

**Files:**
- CREATE: `apps/order-service/src/main/java/org/example/order/model/Order.java`
- CREATE: `apps/order-service/src/main/java/org/example/order/model/OrderLineItem.java`
- CREATE: `apps/order-service/src/main/java/org/example/order/model/OrderStatus.java`
- CREATE: `apps/order-service/src/main/java/org/example/order/model/PaymentStatus.java`

**OrderStatus enum:**
```java
public enum OrderStatus {
    CREATED, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED, REFUNDED
}
```

### 2.2 Repository Layer

**Files:**
- CREATE: `apps/order-service/src/main/java/org/example/order/repository/OrderEntity.java`
- CREATE: `apps/order-service/src/main/java/org/example/order/repository/OrderEntityRepository.java`
- CREATE: `apps/order-service/src/main/java/org/example/order/repository/OrderRepository.java`
- CREATE: `apps/order-service/src/main/java/org/example/order/repository/PostgresOrderRepository.java`
- CREATE: `apps/order-service/src/main/java/org/example/order/repository/JsonValue.java`
- CREATE: `apps/order-service/src/main/java/org/example/order/config/R2dbcConfiguration.java`

**OrderEntityRepository queries:**
```java
public interface OrderEntityRepository extends ReactiveCrudRepository<OrderEntity, UUID> {
    Flux<OrderEntity> findByStoreNumber(int storeNumber);
    Flux<OrderEntity> findByCustomerId(String customerId);
    Flux<OrderEntity> findByStatus(String status);
    Flux<OrderEntity> findByStoreNumberAndStatus(int storeNumber, String status);
    Mono<OrderEntity> findByOrderNumber(String orderNumber);

    @Query("SELECT * FROM orders WHERE store_number = :storeNumber " +
           "AND created_at >= :startDate AND created_at <= :endDate " +
           "ORDER BY created_at DESC LIMIT :limit OFFSET :offset")
    Flux<OrderEntity> searchOrders(int storeNumber, Instant startDate,
                                   Instant endDate, int limit, int offset);
}
```

### 2.3 Order Service

**Files:**
- CREATE: `apps/order-service/src/main/java/org/example/order/service/OrderService.java`

**Key methods:**
- `findById(UUID id)` → `Mono<Order>`
- `findByOrderNumber(String orderNumber)` → `Mono<Order>`
- `findByStore(int storeNumber)` → `Flux<Order>`
- `findByCustomer(String customerId)` → `Flux<Order>`
- `search(OrderSearchCriteria criteria)` → `Flux<Order>`
- `updateStatus(UUID id, OrderStatus status)` → `Mono<Order>`
- `updateFulfillment(UUID id, FulfillmentUpdate update)` → `Mono<Order>`
- `addNote(UUID id, String note)` → `Mono<Order>`

---

## Phase 3: REST Controllers

**Prereqs:** Phase 2 complete
**Blockers:** None

### 3.1 DTOs

**Files:**
- CREATE: `apps/order-service/src/main/java/org/example/order/dto/OrderSearchRequest.java`
- CREATE: `apps/order-service/src/main/java/org/example/order/dto/OrderSearchResponse.java`

**OrderSearchRequest:**
```java
public record OrderSearchRequest(
    Integer storeNumber,
    String customerId,
    String status,
    Instant startDate,
    Instant endDate,
    int page,
    int size
) {}
```

### 3.2 Validation

**Files:**
- CREATE: `apps/order-service/src/main/java/org/example/order/validation/OrderRequestValidator.java`

### 3.3 REST Controller

**Files:**
- CREATE: `apps/order-service/src/main/java/org/example/order/controller/OrderController.java`

**Endpoints:**
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/orders/{orderId}` | Get order by ID |
| GET | `/orders/number/{orderNumber}` | Get order by order number |
| GET | `/orders` | Search orders (query params) |
| GET | `/orders/store/{storeNumber}` | List orders by store |
| GET | `/orders/customer/{customerId}` | List orders by customer |

---

## Phase 4: GraphQL Implementation

**Prereqs:** Phase 2 complete
**Blockers:** None

### 4.1 GraphQL Schema

**Files:**
- CREATE: `apps/order-service/src/main/resources/graphql/schema.graphqls`
- CREATE: `apps/order-service/src/main/resources/graphql/operations.graphqls`

**schema.graphqls:**
```graphql
type Order {
    id: ID!
    storeNumber: Int!
    orderNumber: String!
    customerId: String
    status: OrderStatus!
    paymentStatus: PaymentStatus!
    fulfillmentType: String!
    fulfillmentDate: String
    subtotal: String!
    discountTotal: String!
    taxTotal: String!
    fulfillmentCost: String!
    grandTotal: String!
    lineItems: [OrderLineItem!]!
    appliedDiscounts: [AppliedDiscount!]!
    createdAt: String!
    updatedAt: String!
}

type OrderLineItem {
    sku: ID!
    name: String!
    quantity: Int!
    unitPrice: String!
    totalPrice: String!
}

enum OrderStatus {
    CREATED
    CONFIRMED
    PROCESSING
    SHIPPED
    DELIVERED
    CANCELLED
    REFUNDED
}

enum PaymentStatus {
    PENDING
    AUTHORIZED
    CAPTURED
    REFUNDED
    FAILED
}
```

**operations.graphqls:**
```graphql
type Query {
    order(id: ID!): Order
    orderByNumber(orderNumber: String!): Order
    orders(storeNumber: Int!, status: OrderStatus, limit: Int, offset: Int): [Order!]!
    ordersByCustomer(customerId: String!): [Order!]!
    searchOrders(input: OrderSearchInput!): OrderSearchResult!
}

type Mutation {
    updateOrderStatus(id: ID!, status: OrderStatus!): Order
    updateFulfillment(id: ID!, input: UpdateFulfillmentInput!): Order
    cancelOrder(id: ID!, reason: String!): Order
    addOrderNote(id: ID!, note: String!): Order
}

input OrderSearchInput {
    storeNumber: Int!
    customerId: String
    status: OrderStatus
    startDate: String
    endDate: String
    limit: Int
    offset: Int
}

input UpdateFulfillmentInput {
    fulfillmentDate: String
    trackingNumber: String
    carrier: String
}

type OrderSearchResult {
    orders: [Order!]!
    totalCount: Int!
    hasMore: Boolean!
}
```

### 4.2 GraphQL Input Types

**Files:**
- CREATE: `apps/order-service/src/main/java/org/example/order/graphql/input/OrderSearchInput.java`
- CREATE: `apps/order-service/src/main/java/org/example/order/graphql/input/UpdateFulfillmentInput.java`
- CREATE: `apps/order-service/src/main/java/org/example/order/graphql/input/UpdateStatusInput.java`

### 4.3 GraphQL Controllers

**Files:**
- CREATE: `apps/order-service/src/main/java/org/example/order/graphql/OrderQueryController.java`
- CREATE: `apps/order-service/src/main/java/org/example/order/graphql/OrderMutationController.java`
- CREATE: `apps/order-service/src/main/java/org/example/order/graphql/GraphQLExceptionResolver.java`

**OrderQueryController:**
```java
@Controller
public class OrderQueryController {
    private final OrderService orderService;

    @QueryMapping
    @PreAuthorize("hasAuthority('SCOPE_order:read')")
    public Mono<Order> order(@Argument String id) {
        return orderService.findById(UUID.fromString(id));
    }

    @QueryMapping
    @PreAuthorize("hasAuthority('SCOPE_order:read')")
    public Flux<Order> orders(@Argument int storeNumber,
                              @Argument OrderStatus status,
                              @Argument Integer limit,
                              @Argument Integer offset) {
        // Implementation
    }
}
```

**OrderMutationController:**
```java
@Controller
public class OrderMutationController {
    private final OrderService orderService;
    private final GraphQLInputValidator validator;

    @MutationMapping
    @PreAuthorize("hasAuthority('SCOPE_order:write')")
    public Mono<Order> updateOrderStatus(@Argument String id,
                                         @Argument OrderStatus status) {
        return validator.validateId(id)
            .then(orderService.updateStatus(UUID.fromString(id), status));
    }

    @MutationMapping
    @PreAuthorize("hasAuthority('SCOPE_order:write')")
    public Mono<Order> cancelOrder(@Argument String id, @Argument String reason) {
        return validator.validateId(id)
            .then(orderService.cancelOrder(UUID.fromString(id), reason));
    }
}
```

### 4.4 GraphQL Validation

**Files:**
- CREATE: `apps/order-service/src/main/java/org/example/order/graphql/GraphQLInputValidator.java`

---

## Phase 5: Tests and Documentation

**Prereqs:** Phases 3 and 4 complete
**Blockers:** None

### 5.1 Unit Tests

**Files:**
- CREATE: `apps/order-service/src/test/java/org/example/order/service/OrderServiceTest.java`
- CREATE: `apps/order-service/src/test/java/org/example/order/validation/OrderRequestValidatorTest.java`

### 5.2 Integration Tests

**Files:**
- CREATE: `apps/order-service/src/test/java/org/example/order/repository/PostgresOrderRepositoryTest.java`
- CREATE: `apps/order-service/src/test/java/org/example/order/controller/OrderControllerTest.java`
- CREATE: `apps/order-service/src/test/java/org/example/order/graphql/OrderGraphQLTest.java`

### 5.3 Docker Configuration

**Files:**
- CREATE: `docker/Dockerfile.order-service`
- MODIFY: `docker/docker-compose.yml`

### 5.4 Documentation

**Files:**
- MODIFY: `CLAUDE.md` - Add order-service (port 8088)
- CREATE: `apps/order-service/README.md`
- CREATE: `apps/order-service/AGENTS.md`

---

## Files Summary

| Action | File | Purpose |
|--------|------|---------|
| CREATE | `apps/order-service/build.gradle.kts` | Gradle config |
| CREATE | `apps/order-service/src/main/resources/application.yml` | App config |
| CREATE | `apps/order-service/src/main/resources/graphql/schema.graphqls` | GraphQL types |
| CREATE | `apps/order-service/src/main/resources/graphql/operations.graphqls` | Queries/mutations |
| CREATE | `.../order/model/*.java` | Domain models (4 files) |
| CREATE | `.../order/repository/*.java` | Repository layer (5 files) |
| CREATE | `.../order/config/R2dbcConfiguration.java` | R2DBC/JSON config |
| CREATE | `.../order/service/OrderService.java` | Business logic |
| CREATE | `.../order/dto/*.java` | REST DTOs (2 files) |
| CREATE | `.../order/validation/OrderRequestValidator.java` | REST validation |
| CREATE | `.../order/controller/OrderController.java` | REST endpoints |
| CREATE | `.../order/graphql/*.java` | GraphQL controllers (3 files) |
| CREATE | `.../order/graphql/input/*.java` | GraphQL inputs (3 files) |
| CREATE | `docker/Dockerfile.order-service` | Docker build |
| MODIFY | `settings.gradle.kts` | Include module |
| MODIFY | `docker/docker-compose.yml` | Add service |
| MODIFY | `CLAUDE.md` | Add to service list |

---

## API Summary

### REST Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/orders/{orderId}` | Get by ID |
| GET | `/orders/number/{orderNumber}` | Get by order number |
| GET | `/orders?store=&status=&start=&end=` | Search orders |
| GET | `/orders/store/{storeNumber}` | List by store |
| GET | `/orders/customer/{customerId}` | List by customer |

### GraphQL Operations

**Queries:** `order`, `orderByNumber`, `orders`, `ordersByCustomer`, `searchOrders`
**Mutations:** `updateOrderStatus`, `updateFulfillment`, `cancelOrder`, `addOrderNote`

---

## Checklist

- [ ] Phase 1: Infrastructure setup complete
- [ ] Phase 2: Models and repository complete
- [ ] Phase 3: REST controllers complete
- [ ] Phase 4: GraphQL implementation complete
- [ ] Phase 5: Tests and documentation complete
- [ ] All tests passing (`pnpm nx test :apps:order-service`)
- [ ] Service builds (`pnpm nx build :apps:order-service`)
- [ ] CLAUDE.md updated with port 8088
