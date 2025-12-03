# 008 Cart Service Enhancement - Granular CRUD with Shared Domain

## Overview

This plan enhances the cart-service to provide granular CRUD operations for a comprehensive cart object. The cart will include products, customer information, discounts, and fulfillments. Shared domain objects will be extracted into independent platform libraries.

**Related Plans:**
- **009_AUDIT_DATA** - Audit data service for event tracking (can be developed in parallel)

## Goals

1. Create shared domain libraries (`shared-domain-*`) for reusable domain objects
2. Refactor product-service to use `shared-domain-product`
3. Create placeholder services for customer, discounts, and fulfillments
4. Implement granular CRUD APIs for cart management
5. Apply full resilience, logging, and security patterns
6. Integrate audit event publishing (placeholder for 009_AUDIT_DATA)

## Architecture

### New Module Structure

```
libs/
├── platform/                          # Existing platform libraries
│   ├── platform-bom/
│   ├── platform-logging/
│   ├── platform-resilience/
│   ├── platform-cache/
│   ├── platform-error/
│   ├── platform-webflux/
│   ├── platform-security/
│   └── platform-test/
└── shared-model/                     # NEW: Shared model libraries
    ├── shared-model-product/         # Product model objects
    ├── shared-model-customer/        # Customer model objects (placeholder)
    ├── shared-model-discount/        # Discount model objects
    └── shared-model-fulfillment/     # Fulfillment model objects (placeholder)

apps/
├── product-service/                   # Uses shared-model-product
├── cart-service/                      # Uses all shared-model-* libraries
├── customer-service/                  # NEW: Placeholder service
├── discount-service/                  # NEW: Placeholder service
└── fulfillment-service/               # NEW: Placeholder service
```

### Package Naming

| Module | Package |
|--------|---------|
| shared-model-product | `org.example.model.product` |
| shared-model-customer | `org.example.model.customer` |
| shared-model-discount | `org.example.model.discount` |
| shared-model-fulfillment | `org.example.model.fulfillment` |
| customer-service | `org.example.customer` |
| discount-service | `org.example.discount` |
| fulfillment-service | `org.example.fulfillment` |

---

## Phase 1: Shared model Libraries

### 1.1 shared-model-product

**Location:** `libs/shared-model/shared-model-product/`

**Package:** `org.example.model.product`

```java
// Product.java - core product representation
public record Product(
    long sku,
    String description,
    String price,
    int availableQuantity
) {}

// CartProduct.java - product as it appears in a cart (with quantity)
public record CartProduct(
    long sku,
    String description,
    String unitPrice,
    int quantity,
    int availableQuantity
) {
    public BigDecimal lineTotal() {
        return new BigDecimal(unitPrice).multiply(BigDecimal.valueOf(quantity));
    }
}
```

**Dependencies:** None (standalone model library)

### 1.2 shared-model-customer (Placeholder)

**Location:** `libs/shared-model/shared-model-customer/`

**Package:** `org.example.model.customer`

**Note:** This is a placeholder for a complex model with B2B, B2C, and omnichannel use cases. Will be expanded in a future feature plan.

```java
// CartCustomer.java - minimal placeholder for customer attached to cart
public record CartCustomer(
    String customerId,
    String name,
    String email
) {}
```

**Dependencies:** None (standalone model library)

### 1.3 shared-model-discount

**Location:** `libs/shared-model/shared-model-discount/`

**Package:** `org.example.model.discount`

```java
// Discount.java - discount applied to a cart
public record Discount(
    String discountId,
    String code,
    DiscountType type,
    BigDecimal value,
    String description,
    Instant expiresAt
) {}

// DiscountType.java
public enum DiscountType {
    PERCENTAGE,      // e.g., 10% off
    FIXED_AMOUNT,    // e.g., $5 off
    FREE_SHIPPING,   // shipping discount
    BUY_X_GET_Y      // promotional
}

// AppliedDiscount.java - discount as applied to cart with calculated savings
public record AppliedDiscount(
    String discountId,
    String code,
    DiscountType type,
    BigDecimal originalValue,
    BigDecimal appliedSavings,
    List<Long> applicableSkus  // empty = applies to entire cart
) {}
```

**Dependencies:** None (standalone model library)

### 1.4 shared-model-fulfillment (Placeholder)

**Location:** `libs/shared-model/shared-model-fulfillment/`

**Package:** `org.example.model.fulfillment`

**Note:** This is a placeholder for a complex model with B2B, B2C, and omnichannel use cases (delivery, pickup, installation, haul-away, etc.). Will be expanded in a future feature plan.

```java
// FulfillmentType.java
public enum FulfillmentType {
    DELIVERY,
    PICKUP,
    INSTALLATION
}

// Fulfillment.java - minimal placeholder for fulfillment on a cart
public record Fulfillment(
    String fulfillmentId,
    FulfillmentType type,
    List<Long> skus,
    BigDecimal cost
) {}
```

**Dependencies:** None (standalone model library)

---

## Phase 2: Cart model Model

### 2.1 Enhanced Cart Object

**Location:** `apps/cart-service/src/main/java/org/example/cart/model/`

```java
// Cart.java - the complete cart aggregate
public record Cart(
    String id,                           // UUID
    int storeNumber,                     // Store context
    String customerId,                   // Customer identifier (nullable for anonymous)
    CartCustomer customer,               // Customer details (nullable)
    List<CartProduct> products,          // Products in cart
    List<AppliedDiscount> discounts,     // Applied discounts
    List<Fulfillment> fulfillments,      // Fulfillment options
    CartTotals totals,                   // Calculated totals
    Instant createdAt,
    Instant updatedAt
) {}

// CartTotals.java - calculated totals
public record CartTotals(
    BigDecimal subtotal,         // Sum of product line totals
    BigDecimal discountTotal,    // Sum of discount savings
    BigDecimal fulfillmentTotal, // Sum of fulfillment costs
    BigDecimal taxTotal,         // Calculated tax (placeholder)
    BigDecimal grandTotal        // Final total
) {
    public static CartTotals calculate(
        List<CartProduct> products,
        List<AppliedDiscount> discounts,
        List<Fulfillment> fulfillments
    ) {
        // Implementation calculates all totals
    }
}
```

### 2.2 Cart Persistence

**Storage:** Redis with JSON serialization

**Key Patterns:**
- Primary: `cart:{cartId}`
- Store index: `cart:store:{storeNumber}` (Set of cartIds)

**TTL:** Configurable (default 7 days for active carts)

```java
// CartRepository.java
public interface CartRepository {
    Mono<Cart> findById(String cartId);
    Flux<Cart> findByStoreNumber(int storeNumber);
    Mono<Cart> save(Cart cart);
    Mono<Void> deleteById(String cartId);
    Mono<Boolean> exists(String cartId);
}

// RedisCartRepository.java - Redis implementation
@Repository
public class RedisCartRepository implements CartRepository {
    // Uses ReactiveRedisTemplate<String, Cart>
    // Maintains store index via Redis Sets
}
```

---

## Phase 3: Cart Service APIs

### 3.1 Cart Lifecycle Endpoints

| Method | Path | Description | Request Body | Response |
|--------|------|-------------|--------------|----------|
| POST | `/carts` | Create new cart | `CreateCartRequest` | `Cart` (201) |
| GET | `/carts/{cartId}` | Get cart by ID | - | `Cart` (200) |
| GET | `/carts?storeNumber={storeNumber}` | Find carts by store | - | `List<Cart>` (200) |
| DELETE | `/carts/{cartId}` | Delete cart | - | (204) |

```java
// CreateCartRequest.java
public record CreateCartRequest(
    int storeNumber,   // Required - store context
    String customerId  // Optional - can create anonymous cart
) {}
```

### 3.2 Product Endpoints (Granular CRUD)

| Method | Path | Description | Request Body | Response |
|--------|------|-------------|--------------|----------|
| GET | `/carts/{cartId}/products` | List all products | - | `List<CartProduct>` |
| POST | `/carts/{cartId}/products` | Add product | `AddProductRequest` | `Cart` (201) |
| GET | `/carts/{cartId}/products/{sku}` | Get product | - | `CartProduct` |
| PUT | `/carts/{cartId}/products/{sku}` | Update product | `UpdateProductRequest` | `Cart` |
| DELETE | `/carts/{cartId}/products/{sku}` | Remove product | - | `Cart` |

```java
// AddProductRequest.java
public record AddProductRequest(
    long sku,
    int quantity
) {}

// UpdateProductRequest.java
public record UpdateProductRequest(
    int quantity
) {}
```

**Product Integration:** When adding a product, cart-service calls product-service to fetch product details (description, price, availability).

### 3.3 Customer Endpoints (Granular CRUD)

| Method | Path | Description | Request Body | Response |
|--------|------|-------------|--------------|----------|
| GET | `/carts/{cartId}/customer` | Get customer | - | `CartCustomer` |
| PUT | `/carts/{cartId}/customer` | Set/update customer | `SetCustomerRequest` | `Cart` |
| DELETE | `/carts/{cartId}/customer` | Remove customer | - | `Cart` |

```java
// SetCustomerRequest.java - minimal placeholder
public record SetCustomerRequest(
    String customerId,
    String name,
    String email
) {}
```

**Customer Integration:** When setting customer, cart-service calls customer-service (placeholder) to validate customer ID.

### 3.4 Discount Endpoints (Granular CRUD)

| Method | Path | Description | Request Body | Response |
|--------|------|-------------|--------------|----------|
| GET | `/carts/{cartId}/discounts` | List discounts | - | `List<AppliedDiscount>` |
| POST | `/carts/{cartId}/discounts` | Apply discount | `ApplyDiscountRequest` | `Cart` (201) |
| GET | `/carts/{cartId}/discounts/{discountId}` | Get discount | - | `AppliedDiscount` |
| DELETE | `/carts/{cartId}/discounts/{discountId}` | Remove discount | - | `Cart` |

```java
// ApplyDiscountRequest.java
public record ApplyDiscountRequest(
    String code  // Discount/promo code
) {}
```

**Discount Integration:** When applying discount, cart-service calls discount-service (placeholder) to validate and calculate discount.

### 3.5 Fulfillment Endpoints (Granular CRUD)

| Method | Path | Description | Request Body | Response |
|--------|------|-------------|--------------|----------|
| GET | `/carts/{cartId}/fulfillments` | List fulfillments | - | `List<Fulfillment>` |
| POST | `/carts/{cartId}/fulfillments` | Add fulfillment | `AddFulfillmentRequest` | `Cart` (201) |
| GET | `/carts/{cartId}/fulfillments/{fulfillmentId}` | Get fulfillment | - | `Fulfillment` |
| PUT | `/carts/{cartId}/fulfillments/{fulfillmentId}` | Update fulfillment | `UpdateFulfillmentRequest` | `Cart` |
| DELETE | `/carts/{cartId}/fulfillments/{fulfillmentId}` | Remove fulfillment | - | `Cart` |

```java
// AddFulfillmentRequest.java - minimal placeholder
public record AddFulfillmentRequest(
    FulfillmentType type,
    List<Long> skus
) {}

// UpdateFulfillmentRequest.java - minimal placeholder
public record UpdateFulfillmentRequest(
    FulfillmentType type,
    List<Long> skus
) {}
```

**Fulfillment Integration:** When adding fulfillment, cart-service calls fulfillment-service (placeholder) to calculate cost.

---

## Phase 4: Placeholder Services

### 4.1 customer-service (Minimal Placeholder)

**Location:** `apps/customer-service/`

**Port:** 8083

**Note:** Complex B2B/B2C omnichannel customer model to be designed in a future feature plan.

**Placeholder Endpoints:**

| Method | Path | Description | Response |
|--------|------|-------------|----------|
| GET | `/customers/{customerId}` | Get customer | `CartCustomer` (stubbed) |
| GET | `/customers/{customerId}/validate` | Validate customer exists | `200` or `404` |

**Implementation:** Returns hardcoded/mock data. Ready for future implementation.

### 4.2 discount-service

**Location:** `apps/discount-service/`

**Port:** 8084

**Placeholder Endpoints:**

| Method | Path | Description | Response |
|--------|------|-------------|----------|
| GET | `/discounts/validate` | Validate discount code | `Discount` |
| POST | `/discounts/calculate` | Calculate discount for cart | `AppliedDiscount` |

**Request/Response:**

```java
// ValidateDiscountRequest (query params)
?code=SAVE10

// CalculateDiscountRequest
{
    "code": "SAVE10",
    "subtotal": "199.99",
    "skus": [12345, 67890]
}
```

**Implementation:** Returns stubbed discounts (e.g., "SAVE10" = 10% off).

### 4.3 fulfillment-service (Minimal Placeholder)

**Location:** `apps/fulfillment-service/`

**Port:** 8085

**Note:** Complex B2B/B2C omnichannel fulfillment model (delivery, pickup, installation, haul-away, scheduling) to be designed in a future feature plan.

**Placeholder Endpoints:**

| Method | Path | Description | Response |
|--------|------|-------------|----------|
| POST | `/fulfillments/calculate` | Calculate fulfillment cost | `FulfillmentCost` |

**Request/Response:**

```java
// FulfillmentCostRequest
{
    "type": "DELIVERY",
    "skus": [12345, 67890]
}

// FulfillmentCost (response)
{
    "cost": "9.99"
}
```

**Implementation:** Returns stubbed costs (e.g., DELIVERY = $9.99, PICKUP = $0.00, INSTALLATION = $49.99).

---

## Phase 5: Resilience Configuration

### 5.1 Cart Service Resilience

**External Service Calls:**

| Service | Circuit Breaker | Retry | Timeout | Bulkhead |
|---------|-----------------|-------|---------|----------|
| product-service | product | 3 attempts | 2s | 25 concurrent |
| customer-service | customer | 3 attempts | 2s | 10 concurrent |
| discount-service | discount | 3 attempts | 1s | 10 concurrent |
| fulfillment-service | fulfillment | 3 attempts | 2s | 10 concurrent |
| audit-service (queue) | audit | 2 attempts | 500ms | 50 concurrent |

**Configuration (`application.yml`):**

```yaml
resilience4j:
  circuitbreaker:
    configs:
      default:
        registerHealthIndicator: true
        slidingWindowSize: 10
        permittedNumberOfCallsInHalfOpenState: 3
        automaticTransitionFromOpenToHalfOpenEnabled: true
        waitDurationInOpenState: 10s
        failureRateThreshold: 50
        slowCallRateThreshold: 100
        slowCallDurationThreshold: 2s
    instances:
      product: { base-config: default }
      customer: { base-config: default }
      discount: { base-config: default }
      fulfillment: { base-config: default }
      audit: { base-config: default, failureRateThreshold: 80 }

  retry:
    configs:
      default:
        maxAttempts: 3
        waitDuration: 500ms
        exponentialBackoffMultiplier: 2
        retryExceptions:
          - java.io.IOException
          - java.util.concurrent.TimeoutException
    instances:
      product: { base-config: default }
      customer: { base-config: default }
      discount: { base-config: default }
      fulfillment: { base-config: default }
      audit: { maxAttempts: 2, waitDuration: 100ms }

  timelimiter:
    configs:
      default:
        timeoutDuration: 2s
    instances:
      product: { base-config: default }
      customer: { base-config: default }
      discount: { timeoutDuration: 1s }
      fulfillment: { base-config: default }
      audit: { timeoutDuration: 500ms }

  bulkhead:
    configs:
      default:
        maxConcurrentCalls: 25
    instances:
      product: { base-config: default }
      customer: { maxConcurrentCalls: 10 }
      discount: { maxConcurrentCalls: 10 }
      fulfillment: { maxConcurrentCalls: 10 }
      audit: { maxConcurrentCalls: 50 }
```

### 5.2 Fallback Behaviors

| Service | Fallback Strategy |
|---------|-------------------|
| product-service | Return error (product required for cart) |
| customer-service | Allow anonymous cart (customer optional) |
| discount-service | Skip discount (cart still valid without discount) |
| fulfillment-service | Return error (fulfillment cost required) |
| audit-service | Log locally, continue (audit failures never block cart operations) |

---

## Phase 6: Security Configuration

### 6.1 OAuth2 Resource Server

Cart service will be protected as an OAuth2 resource server.

**Required Scopes:**

| Endpoint Pattern | Required Scope |
|------------------|----------------|
| POST /carts | `cart:write` |
| GET /carts/{cartId} | `cart:read` |
| GET /carts?storeNumber=* | `cart:read` |
| DELETE /carts/{cartId} | `cart:write` |
| * /carts/{cartId}/products/* | `cart:write` (modify), `cart:read` (get) |
| * /carts/{cartId}/customer/* | `cart:write` (modify), `cart:read` (get) |
| * /carts/{cartId}/discounts/* | `cart:write` (modify), `cart:read` (get) |
| * /carts/{cartId}/fulfillments/* | `cart:write` (modify), `cart:read` (get) |

**Configuration:**

```java
@Configuration
@EnableWebFluxSecurity
public class SecurityConfig {

    @Bean
    public SecurityWebFilterChain securityWebFilterChain(ServerHttpSecurity http) {
        return http
            .authorizeExchange(exchanges -> exchanges
                .pathMatchers(HttpMethod.GET, "/carts/**").hasAuthority("SCOPE_cart:read")
                .pathMatchers("/carts/**").hasAuthority("SCOPE_cart:write")
                .pathMatchers("/actuator/**").permitAll()
                .anyExchange().authenticated()
            )
            .oauth2ResourceServer(oauth2 -> oauth2.jwt(Customizer.withDefaults()))
            .build();
    }
}
```

### 6.2 Service-to-Service Authentication

When cart-service calls other services, it will use client credentials flow:

```yaml
spring:
  security:
    oauth2:
      client:
        registration:
          product-service:
            client-id: cart-service
            client-secret: ${CART_SERVICE_SECRET}
            scope: product:read
            authorization-grant-type: client_credentials
          customer-service:
            client-id: cart-service
            client-secret: ${CART_SERVICE_SECRET}
            scope: customer:read
            authorization-grant-type: client_credentials
          # ... similar for discount and fulfillment
```

---

## Phase 7: Logging & Audit Configuration

### 7.1 Structured Application Logging

All cart service operations will use `StructuredLogger` from platform-logging for application logs. **These logs are retained independently of audit events.**

```java
@Service
public class CartService {
    private final StructuredLogger logger = StructuredLogger.getLogger(CartService.class);

    public Mono<Cart> addProduct(String cartId, AddProductRequest request) {
        return Mono.deferContextual(ctx -> {
            logger.info(ctx, "Adding product to cart",
                Map.of("cartId", cartId, "sku", request.sku(), "quantity", request.quantity()));

            // ... implementation
        });
    }
}
```

### 7.2 Application Log Events

| Event | Level | Data |
|-------|-------|------|
| Cart created | INFO | cartId, customerId, storeNumber |
| Cart deleted | INFO | cartId |
| Product added | INFO | cartId, sku, quantity |
| Product updated | INFO | cartId, sku, oldQuantity, newQuantity |
| Product removed | INFO | cartId, sku |
| Customer set | INFO | cartId, customerId |
| Customer removed | INFO | cartId |
| Discount applied | INFO | cartId, discountCode, savings |
| Discount removed | INFO | cartId, discountId |
| Fulfillment added | INFO | cartId, fulfillmentType, cost |
| Fulfillment updated | INFO | cartId, fulfillmentId |
| Fulfillment removed | INFO | cartId, fulfillmentId |
| External service error | WARN | service, operation, error |
| Cart not found | WARN | cartId |
| Audit publish failed | WARN | eventType, cartId, error |

### 7.3 Audit Event Publishing (Placeholder for 009_AUDIT_DATA)

Cart service will publish audit events to a message queue for all write operations and selected read operations. This enables the audit-service (see 009_AUDIT_DATA) to maintain a complete audit trail.

**Audit Event Publisher Interface:**

```java
// AuditEventPublisher.java - in cart-service
public interface AuditEventPublisher {
    Mono<Void> publish(AuditEvent event);
}

// AuditEvent.java - shared audit event structure
public record AuditEvent(
    String eventId,          // UUID
    String eventType,        // e.g., "CART_CREATED", "PRODUCT_ADDED"
    String entityType,       // e.g., "CART"
    String entityId,         // e.g., cartId
    int storeNumber,
    String userId,           // from request context
    String sessionId,        // from request context
    Instant timestamp,
    Map<String, Object> data // event-specific payload
) {}
```

**Cart Audit Event Types:**

| Event Type | Trigger | Data Payload |
|------------|---------|--------------|
| `CART_CREATED` | POST /carts | cartId, storeNumber, customerId |
| `CART_DELETED` | DELETE /carts/{cartId} | cartId, storeNumber |
| `CART_VIEWED` | GET /carts/{cartId} | cartId (read event) |
| `PRODUCT_ADDED` | POST /carts/{cartId}/products | cartId, sku, quantity, unitPrice |
| `PRODUCT_UPDATED` | PUT /carts/{cartId}/products/{sku} | cartId, sku, oldQty, newQty |
| `PRODUCT_REMOVED` | DELETE /carts/{cartId}/products/{sku} | cartId, sku |
| `CUSTOMER_SET` | PUT /carts/{cartId}/customer | cartId, customerId |
| `CUSTOMER_REMOVED` | DELETE /carts/{cartId}/customer | cartId, customerId |
| `DISCOUNT_APPLIED` | POST /carts/{cartId}/discounts | cartId, discountCode, savings |
| `DISCOUNT_REMOVED` | DELETE /carts/{cartId}/discounts/{id} | cartId, discountId |
| `FULFILLMENT_ADDED` | POST /carts/{cartId}/fulfillments | cartId, fulfillmentType, cost |
| `FULFILLMENT_UPDATED` | PUT /carts/{cartId}/fulfillments/{id} | cartId, fulfillmentId |
| `FULFILLMENT_REMOVED` | DELETE /carts/{cartId}/fulfillments/{id} | cartId, fulfillmentId |

**Placeholder Implementation:**

Until 009_AUDIT_DATA is implemented, the audit publisher will be a no-op that logs locally:

```java
@Component
@ConditionalOnProperty(name = "audit.enabled", havingValue = "false", matchIfMissing = true)
public class NoOpAuditEventPublisher implements AuditEventPublisher {
    private final StructuredLogger logger = StructuredLogger.getLogger(NoOpAuditEventPublisher.class);

    @Override
    public Mono<Void> publish(AuditEvent event) {
        return Mono.deferContextual(ctx -> {
            logger.debug(ctx, "Audit event (no-op)", Map.of(
                "eventType", event.eventType(),
                "entityId", event.entityId()
            ));
            return Mono.empty();
        });
    }
}
```

When 009_AUDIT_DATA is implemented, this will be replaced with a queue-based publisher.

---

## Phase 8: Testing Strategy

### 8.1 Unit Tests

- model object tests (Cart, CartTotals calculations)
- Service layer tests with mocked repositories
- Controller tests with WebTestClient

### 8.2 Integration Tests

- Redis repository tests using `@DataRedisTest`
- Full API tests with WireMock for external services
- Security tests validating OAuth2 scopes
- Audit event publishing tests (verify events are published)

### 8.3 Contract Tests

- Define Pact contracts for:
  - cart-service → product-service
  - cart-service → customer-service
  - cart-service → discount-service
  - cart-service → fulfillment-service

### 8.4 E2E Tests (k6)

- Cart lifecycle scenarios
- Concurrent cart operations
- Resilience scenarios (service failures)

---

## Implementation Order

### Step 1: Shared model Libraries
1. Create `libs/shared-model/` directory structure
2. Implement `shared-model-product`
3. Implement `shared-model-customer` (minimal placeholder)
4. Implement `shared-model-discount`
5. Implement `shared-model-fulfillment` (minimal placeholder)
6. Update `settings.gradle.kts` with new modules

### Step 2: Refactor Product Service
1. Update product-service to depend on `shared-model-product`
2. Remove local `Product` class, use shared model
3. Verify all tests pass

### Step 3: Placeholder Services
1. Create `apps/customer-service/` with minimal placeholder endpoints
2. Create `apps/discount-service/` with placeholder endpoints
3. Create `apps/fulfillment-service/` with minimal placeholder endpoints
4. Add services to Docker Compose

### Step 4: Cart Service Core
1. Update cart model model to use shared model objects
2. Implement `CartRepository` with Redis persistence (including store index)
3. Implement `CartService` with totals calculation
4. Add resilience configuration

### Step 5: Cart Service APIs
1. Implement cart lifecycle endpoints (including findByStoreNumber)
2. Implement product CRUD endpoints
3. Implement customer CRUD endpoints
4. Implement discount CRUD endpoints
5. Implement fulfillment CRUD endpoints

### Step 6: External Service Integration
1. Create `ProductServiceClient` for product-service calls
2. Create `CustomerServiceClient` for customer-service calls
3. Create `DiscountServiceClient` for discount-service calls
4. Create `FulfillmentServiceClient` for fulfillment-service calls
5. Apply resilience patterns to all clients

### Step 7: Audit Integration (Placeholder)
1. Define `AuditEvent` record
2. Define `AuditEventPublisher` interface
3. Implement `NoOpAuditEventPublisher` placeholder
4. Integrate audit publishing into CartService operations
5. Add configuration for enabling/disabling audit

### Step 8: Security
1. Configure OAuth2 resource server
2. Configure service-to-service authentication
3. Add security tests

### Step 9: Testing & Documentation
1. Write unit tests
2. Write integration tests
3. Write e2e tests
4. Update Docker Compose
5. Update API documentation

---

## File Checklist

### New Files to Create

**Shared model Libraries:**
- [ ] `libs/shared-model/shared-model-product/build.gradle.kts`
- [ ] `libs/shared-model/shared-model-product/src/main/java/org/example/model/product/Product.java`
- [ ] `libs/shared-model/shared-model-product/src/main/java/org/example/model/product/CartProduct.java`
- [ ] `libs/shared-model/shared-model-customer/build.gradle.kts`
- [ ] `libs/shared-model/shared-model-customer/src/main/java/org/example/model/customer/CartCustomer.java`
- [ ] `libs/shared-model/shared-model-discount/build.gradle.kts`
- [ ] `libs/shared-model/shared-model-discount/src/main/java/org/example/model/discount/Discount.java`
- [ ] `libs/shared-model/shared-model-discount/src/main/java/org/example/model/discount/DiscountType.java`
- [ ] `libs/shared-model/shared-model-discount/src/main/java/org/example/model/discount/AppliedDiscount.java`
- [ ] `libs/shared-model/shared-model-fulfillment/build.gradle.kts`
- [ ] `libs/shared-model/shared-model-fulfillment/src/main/java/org/example/model/fulfillment/Fulfillment.java`
- [ ] `libs/shared-model/shared-model-fulfillment/src/main/java/org/example/model/fulfillment/FulfillmentType.java`

**Placeholder Services:**
- [ ] `apps/customer-service/build.gradle.kts`
- [ ] `apps/customer-service/src/main/java/org/example/customer/CustomerServiceApplication.java`
- [ ] `apps/customer-service/src/main/java/org/example/customer/controller/CustomerController.java`
- [ ] `apps/customer-service/src/main/resources/application.yml`
- [ ] `apps/discount-service/build.gradle.kts`
- [ ] `apps/discount-service/src/main/java/org/example/discount/DiscountServiceApplication.java`
- [ ] `apps/discount-service/src/main/java/org/example/discount/controller/DiscountController.java`
- [ ] `apps/discount-service/src/main/resources/application.yml`
- [ ] `apps/fulfillment-service/build.gradle.kts`
- [ ] `apps/fulfillment-service/src/main/java/org/example/fulfillment/FulfillmentServiceApplication.java`
- [ ] `apps/fulfillment-service/src/main/java/org/example/fulfillment/controller/FulfillmentController.java`
- [ ] `apps/fulfillment-service/src/main/resources/application.yml`

**Cart Service Enhancements:**
- [ ] `apps/cart-service/src/main/java/org/example/cart/model/Cart.java` (update)
- [ ] `apps/cart-service/src/main/java/org/example/cart/model/CartTotals.java`
- [ ] `apps/cart-service/src/main/java/org/example/cart/repository/CartRepository.java`
- [ ] `apps/cart-service/src/main/java/org/example/cart/repository/RedisCartRepository.java`
- [ ] `apps/cart-service/src/main/java/org/example/cart/controller/CartController.java` (update)
- [ ] `apps/cart-service/src/main/java/org/example/cart/controller/CartProductController.java`
- [ ] `apps/cart-service/src/main/java/org/example/cart/controller/CartCustomerController.java`
- [ ] `apps/cart-service/src/main/java/org/example/cart/controller/CartDiscountController.java`
- [ ] `apps/cart-service/src/main/java/org/example/cart/controller/CartFulfillmentController.java`
- [ ] `apps/cart-service/src/main/java/org/example/cart/client/ProductServiceClient.java`
- [ ] `apps/cart-service/src/main/java/org/example/cart/client/CustomerServiceClient.java`
- [ ] `apps/cart-service/src/main/java/org/example/cart/client/DiscountServiceClient.java`
- [ ] `apps/cart-service/src/main/java/org/example/cart/client/FulfillmentServiceClient.java`
- [ ] `apps/cart-service/src/main/java/org/example/cart/audit/AuditEvent.java`
- [ ] `apps/cart-service/src/main/java/org/example/cart/audit/AuditEventPublisher.java`
- [ ] `apps/cart-service/src/main/java/org/example/cart/audit/NoOpAuditEventPublisher.java`
- [ ] `apps/cart-service/src/main/java/org/example/cart/config/SecurityConfig.java`
- [ ] `apps/cart-service/src/main/java/org/example/cart/config/WebClientConfig.java`
- [ ] `apps/cart-service/src/main/resources/application.yml` (update)

**Configuration Updates:**
- [ ] `settings.gradle.kts` (add new modules)
- [ ] `docker/docker-compose.yml` (add new services)

### Files to Modify

- [ ] `apps/product-service/build.gradle.kts` - add shared-model-product dependency
- [ ] `apps/product-service/src/main/java/org/example/product/model/Product.java` - remove (use shared)
- [ ] `apps/cart-service/build.gradle.kts` - add shared-model dependencies

---

## Open Questions

1. **Cart Ownership:** Should carts be strictly tied to a customer, or allow anonymous carts that are later associated with a customer?
   - **Proposed:** Allow anonymous carts, associate customer later via `PUT /carts/{cartId}/customer`

2. **Cart Expiration:** What is the TTL for abandoned carts?
   - **Proposed:** 7 days for anonymous, 30 days for customer-associated

3. **Inventory Reservation:** Should adding a product to cart reserve inventory?
   - **Proposed:** No reservation at cart level (only at checkout)

4. **Discount Stacking:** Can multiple discounts be applied to the same cart?
   - **Proposed:** Yes, but business rules in discount-service will control compatibility

5. **Fulfillment Splitting:** Can a single cart have multiple fulfillments for different products?
   - **Proposed:** Yes, each fulfillment specifies which SKUs it covers

6. **Audit Read Events:** Which read operations should generate audit events?
   - **Proposed:** Only `GET /carts/{cartId}` (cart view), not list operations
