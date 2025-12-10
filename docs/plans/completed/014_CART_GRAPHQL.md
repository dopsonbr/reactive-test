# 014_CART_GRAPHQL

**Status: COMPLETE**

---

## Overview

Add a GraphQL interface to cart-service with full parity to the REST API plus real-time subscriptions. Implements Spring for GraphQL 2.0 with SSE transport for subscriptions and Redis Pub/Sub for cross-instance event fan-out, as specified in ADR 004.

**Prerequisites:**
- `013_SPRING_BOOT_4_MIGRATION.md` - Spring Boot 4.0 upgrade (complete)

**Related ADRs:**
- `docs/ADRs/004_graphql_subscriptions_architecture.md` - Architecture decisions for GraphQL/SSE/Redis Pub/Sub

## Goals

1. Implement GraphQL queries with REST parity (cart, products, discounts, fulfillments, customer)
2. Implement GraphQL mutations with REST parity (create, update, delete operations)
3. Implement GraphQL subscriptions for real-time cart updates via SSE + Redis Pub/Sub
4. Apply consistent validation patterns matching REST controllers
5. Ensure OAuth2 security integration for all GraphQL operations
6. Comprehensive testing (unit, integration, subscription)

## References

**Standards:**
- `docs/standards/validation.md` - Error aggregation, field-level messages

**Templates:**
- `docs/templates/_template_redis_pubsub.md` - Redis Pub/Sub publisher/subscriber patterns

**ADRs:**
- `docs/ADRs/004_graphql_subscriptions_architecture.md` - SSE transport, Redis Pub/Sub fan-out

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              GraphQL Endpoint                                    │
│                              POST /graphql                                       │
│                              GET /graphql (SSE subscriptions)                    │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
        ┌───────────────────────────────┼───────────────────────────────┐
        ▼                               ▼                               ▼
┌───────────────────┐       ┌───────────────────┐       ┌───────────────────────┐
│  QueryController  │       │MutationController │       │SubscriptionController │
│  @QueryMapping    │       │ @MutationMapping  │       │ @SubscriptionMapping  │
└────────┬──────────┘       └─────────┬─────────┘       └───────────┬───────────┘
         │                            │                             │
         │                            │                             │
         ▼                            ▼                             ▼
┌───────────────────┐       ┌───────────────────┐       ┌───────────────────────┐
│ GraphQLValidator  │       │ GraphQLValidator  │       │ CartEventSubscriber   │
│ (input validation)│       │ (input validation)│       │ (Redis Pub/Sub)       │
└────────┬──────────┘       └─────────┬─────────┘       └───────────┬───────────┘
         │                            │                             │
         ▼                            ▼                             │
┌─────────────────────────────────────────────────────────┐        │
│                      CartService                         │        │
│  (existing service layer - unchanged)                    │◄───────┘
└────────┬────────────────────────────────────────────────┘   publishes
         │                                                    CartEvent
         ▼
┌─────────────────────────────────────────────────────────┐
│                  CartEventPublisher                      │
│     (publishes to Redis Pub/Sub channel:                │
│      cart:{cartId}:events)                              │
└─────────────────────────────────────────────────────────┘
```

### Package Structure

| Package | Purpose |
|---------|---------|
| `org.example.cart.graphql` | GraphQL controllers (Query, Mutation, Subscription) |
| `org.example.cart.graphql.input` | GraphQL input types |
| `org.example.cart.graphql.validation` | GraphQL-specific validation |
| `org.example.cart.event` | Event models and types |
| `org.example.cart.pubsub` | Redis Pub/Sub publisher and subscriber |

---

## Phase 1: Dependencies and Configuration

### 1.1 Add GraphQL Dependencies

**Files:**
- MODIFY: `apps/cart-service/build.gradle.kts`

**Implementation:**
```kotlin
dependencies {
    // GraphQL (SSE transport included by default, no WebSocket starter needed)
    implementation("org.springframework.boot:spring-boot-starter-graphql")

    // Already present: Redis reactive for Pub/Sub
    // implementation("org.springframework.boot:spring-boot-starter-data-redis-reactive")

    // Test dependencies
    testImplementation("org.springframework.graphql:spring-graphql-test")
}
```

### 1.2 Configure GraphQL Properties

**Files:**
- MODIFY: `apps/cart-service/src/main/resources/application.yml`

**Implementation:**
```yaml
spring:
  graphql:
    graphiql:
      enabled: true  # Disable in production
      path: /graphiql
    schema:
      locations: classpath:graphql/
      printer:
        enabled: true
    # SSE settings (Spring GraphQL 2.0)
    sse:
      timeout: 30m
      keep-alive: 30s
```

### 1.3 Create GraphQL Schema Directory

**Files:**
- CREATE: `apps/cart-service/src/main/resources/graphql/` (directory)

---

## Phase 2: GraphQL Schema

### 2.1 Core Types Schema

**Files:**
- CREATE: `apps/cart-service/src/main/resources/graphql/schema.graphqls`

**Implementation:**
```graphql
# ─────────────────────────────────────────────────────────────────────
# Core Types
# ─────────────────────────────────────────────────────────────────────

type Cart {
    id: ID!
    storeNumber: Int!
    customerId: String
    customer: CartCustomer
    products: [CartProduct!]!
    discounts: [AppliedDiscount!]!
    fulfillments: [Fulfillment!]!
    totals: CartTotals!
    itemCount: Int!
    createdAt: String!
    updatedAt: String!
}

type CartCustomer {
    customerId: String!
    name: String!
    email: String!
}

type CartProduct {
    sku: ID!
    description: String!
    unitPrice: String!
    quantity: Int!
    availableQuantity: Int!
    lineTotal: String!
}

type AppliedDiscount {
    discountId: ID!
    code: String!
    type: DiscountType!
    originalValue: String!
    appliedSavings: String!
    applicableSkus: [ID!]!
}

type Fulfillment {
    fulfillmentId: ID!
    type: FulfillmentType!
    skus: [ID!]!
    cost: String!
}

type CartTotals {
    subtotal: String!
    discountTotal: String!
    fulfillmentTotal: String!
    taxTotal: String!
    grandTotal: String!
}

# ─────────────────────────────────────────────────────────────────────
# Enums
# ─────────────────────────────────────────────────────────────────────

enum DiscountType {
    PERCENTAGE
    FIXED_AMOUNT
    BUY_X_GET_Y
}

enum FulfillmentType {
    SHIPPING
    PICKUP
    DELIVERY
}

enum CartEventType {
    CART_CREATED
    CART_DELETED
    PRODUCT_ADDED
    PRODUCT_UPDATED
    PRODUCT_REMOVED
    DISCOUNT_APPLIED
    DISCOUNT_REMOVED
    FULFILLMENT_ADDED
    FULFILLMENT_UPDATED
    FULFILLMENT_REMOVED
    CUSTOMER_SET
    CUSTOMER_REMOVED
}

# ─────────────────────────────────────────────────────────────────────
# Event Types (for subscriptions)
# ─────────────────────────────────────────────────────────────────────

type CartEvent {
    eventType: CartEventType!
    cartId: ID!
    cart: Cart!
    timestamp: String! # ISO-8601 string
}
```

### 2.2 Operations Schema

**Files:**
- CREATE: `apps/cart-service/src/main/resources/graphql/operations.graphqls`

**Implementation:**
```graphql
# ─────────────────────────────────────────────────────────────────────
# Queries
# ─────────────────────────────────────────────────────────────────────

type Query {
    """Retrieve a cart by ID"""
    cart(id: ID!): Cart

    """Find all carts for a store"""
    cartsByStore(storeNumber: Int!): [Cart!]!

    """Find all carts for a customer"""
    cartsByCustomer(customerId: String!): [Cart!]!

    """Get a specific product from a cart"""
    cartProduct(cartId: ID!, sku: ID!): CartProduct

    """Get all products in a cart"""
    cartProducts(cartId: ID!): [CartProduct!]!

    """Get a specific discount from a cart"""
    cartDiscount(cartId: ID!, discountId: ID!): AppliedDiscount

    """Get all discounts in a cart"""
    cartDiscounts(cartId: ID!): [AppliedDiscount!]!

    """Get a specific fulfillment from a cart"""
    cartFulfillment(cartId: ID!, fulfillmentId: ID!): Fulfillment

    """Get all fulfillments in a cart"""
    cartFulfillments(cartId: ID!): [Fulfillment!]!

    """Get cart customer info"""
    cartCustomer(cartId: ID!): CartCustomer
}

# ─────────────────────────────────────────────────────────────────────
# Mutations
# ─────────────────────────────────────────────────────────────────────

type Mutation {
    # Cart lifecycle
    """Create a new cart"""
    createCart(input: CreateCartInput!): Cart!

    """Delete a cart"""
    deleteCart(id: ID!): Boolean!

    # Product operations
    """Add a product to the cart"""
    addProduct(cartId: ID!, input: AddProductInput!): Cart!

    """Update product quantity in cart"""
    updateProduct(cartId: ID!, sku: ID!, input: UpdateProductInput!): Cart!

    """Remove a product from cart"""
    removeProduct(cartId: ID!, sku: ID!): Cart!

    # Discount operations
    """Apply a discount code to cart"""
    applyDiscount(cartId: ID!, input: ApplyDiscountInput!): Cart!

    """Remove a discount from cart"""
    removeDiscount(cartId: ID!, discountId: ID!): Cart!

    # Fulfillment operations
    """Add fulfillment to cart"""
    addFulfillment(cartId: ID!, input: AddFulfillmentInput!): Cart!

    """Update fulfillment in cart"""
    updateFulfillment(cartId: ID!, fulfillmentId: ID!, input: UpdateFulfillmentInput!): Cart!

    """Remove fulfillment from cart"""
    removeFulfillment(cartId: ID!, fulfillmentId: ID!): Cart!

    # Customer operations (not in REST but available in service)
    """Set customer on cart"""
    setCustomer(cartId: ID!, input: SetCustomerInput!): Cart!

    """Remove customer from cart"""
    removeCustomer(cartId: ID!): Cart!
}

# ─────────────────────────────────────────────────────────────────────
# Subscriptions
# ─────────────────────────────────────────────────────────────────────

type Subscription {
    """Subscribe to real-time updates for a specific cart"""
    cartUpdated(cartId: ID!): CartEvent!

    """Subscribe to all cart events for a store (admin use)"""
    storeCartEvents(storeNumber: Int!): CartEvent!
}

# ─────────────────────────────────────────────────────────────────────
# Input Types
# ─────────────────────────────────────────────────────────────────────

input CreateCartInput {
    storeNumber: Int!
    customerId: String
}

input AddProductInput {
    sku: ID!
    quantity: Int!
}

input UpdateProductInput {
    quantity: Int!
}

input ApplyDiscountInput {
    code: String!
}

input AddFulfillmentInput {
    type: FulfillmentType!
    skus: [ID!]!
}

input UpdateFulfillmentInput {
    type: FulfillmentType!
    skus: [ID!]!
}

input SetCustomerInput {
    customerId: String!
    name: String!
    email: String!
}
```

---

## Phase 3: Event Infrastructure

### 3.1 Event Model

**Files:**
- CREATE: `apps/cart-service/src/main/java/org/example/cart/event/CartEvent.java`

**Implementation:**
```java
package org.example.cart.event;

import org.example.cart.model.Cart;
import java.time.Instant;

/**
 * Event published when a cart is modified.
 * Contains complete cart state for subscriber context.
 */
public record CartEvent(
        CartEventType eventType,
        String cartId,
        Cart cart,
        Instant timestamp
) {
    public static CartEvent of(CartEventType type, Cart cart) {
        return new CartEvent(type, cart.id(), cart, Instant.now());
    }
}
```

### 3.2 Event Type Enum

**Files:**
- CREATE: `apps/cart-service/src/main/java/org/example/cart/event/CartEventType.java`

**Implementation:**
```java
package org.example.cart.event;

/**
 * Types of cart events published to subscriptions.
 */
public enum CartEventType {
    CART_CREATED,
    CART_DELETED,
    PRODUCT_ADDED,
    PRODUCT_UPDATED,
    PRODUCT_REMOVED,
    DISCOUNT_APPLIED,
    DISCOUNT_REMOVED,
    FULFILLMENT_ADDED,
    FULFILLMENT_UPDATED,
    FULFILLMENT_REMOVED,
    CUSTOMER_SET,
    CUSTOMER_REMOVED
}
```

### 3.3 Redis Pub/Sub Publisher

**Files:**
- CREATE: `apps/cart-service/src/main/java/org/example/cart/pubsub/CartEventPublisher.java`

**Implementation:**
```java
package org.example.cart.pubsub;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.example.cart.event.CartEvent;
import org.example.platform.logging.StructuredLogger;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

/**
 * Publishes cart events to Redis Pub/Sub for real-time subscriptions.
 *
 * <p>Channel pattern: cart:{cartId}:events
 * <p>Publishing is fire-and-forget; failures don't break mutations.
 */
@Component
public class CartEventPublisher {

    private static final String CHANNEL_PREFIX = "cart:";
    private static final String CHANNEL_SUFFIX = ":events";

    private final ReactiveRedisTemplate<String, String> redisTemplate;
    private final ObjectMapper objectMapper;
    private final StructuredLogger log;

    public CartEventPublisher(
            ReactiveRedisTemplate<String, String> redisTemplate,
            ObjectMapper objectMapper,
            StructuredLogger.Factory loggerFactory) {
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
        this.log = loggerFactory.getLogger(CartEventPublisher.class);
    }

    /**
     * Publish a cart event to subscribers.
     *
     * @param event the cart event to publish
     * @return Mono completing when published (or on error, silently)
     */
    public Mono<Void> publish(CartEvent event) {
        return Mono.deferContextual(ctx ->
                serialize(event)
                        .flatMap(json -> {
                            String channel = channel(event.cartId());
                            return redisTemplate.convertAndSend(channel, json);
                        })
                        .doOnSuccess(count ->
                                log.info(ctx, "Published cart event",
                                        "eventType", event.eventType().name(),
                                        "cartId", event.cartId(),
                                        "subscribers", count))
                        .doOnError(e ->
                                log.warn(ctx, "Failed to publish cart event",
                                        "cartId", event.cartId(),
                                        "error", e.getMessage()))
                        .onErrorResume(e -> Mono.empty())
                        .then()
        );
    }

    /**
     * Publish to store-wide channel for admin subscriptions.
     */
    public Mono<Void> publishToStore(CartEvent event, int storeNumber) {
        return Mono.deferContextual(ctx ->
                serialize(event)
                        .flatMap(json -> {
                            String channel = storeChannel(storeNumber);
                            return redisTemplate.convertAndSend(channel, json);
                        })
                        .onErrorResume(e -> Mono.empty())
                        .then()
        );
    }

    private String channel(String cartId) {
        return CHANNEL_PREFIX + cartId + CHANNEL_SUFFIX;
    }

    private String storeChannel(int storeNumber) {
        return CHANNEL_PREFIX + "store:" + storeNumber + CHANNEL_SUFFIX;
    }

    private Mono<String> serialize(CartEvent event) {
        return Mono.fromCallable(() -> objectMapper.writeValueAsString(event))
                .onErrorMap(JsonProcessingException.class,
                        e -> new RuntimeException("Failed to serialize cart event", e));
    }
}
```

### 3.4 Redis Pub/Sub Subscriber

**Files:**
- CREATE: `apps/cart-service/src/main/java/org/example/cart/pubsub/CartEventSubscriber.java`

**Implementation:**
```java
package org.example.cart.pubsub;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.example.cart.event.CartEvent;
import org.example.platform.logging.StructuredLogger;
import org.springframework.data.redis.connection.ReactiveSubscription;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.data.redis.listener.ChannelTopic;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * Subscribes to cart events from Redis Pub/Sub for GraphQL subscriptions.
 */
@Component
public class CartEventSubscriber {

    private static final String CHANNEL_PREFIX = "cart:";
    private static final String CHANNEL_SUFFIX = ":events";

    private final ReactiveRedisTemplate<String, String> redisTemplate;
    private final ObjectMapper objectMapper;
    private final StructuredLogger log;

    public CartEventSubscriber(
            ReactiveRedisTemplate<String, String> redisTemplate,
            ObjectMapper objectMapper,
            StructuredLogger.Factory loggerFactory) {
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
        this.log = loggerFactory.getLogger(CartEventSubscriber.class);
    }

    /**
     * Subscribe to events for a specific cart.
     *
     * @param cartId the cart ID to subscribe to
     * @return Flux of cart events (infinite until cancelled)
     */
    public Flux<CartEvent> subscribe(String cartId) {
        String channel = channel(cartId);
        return redisTemplate.listenTo(ChannelTopic.of(channel))
                .map(ReactiveSubscription.Message::getMessage)
                .flatMap(this::deserialize)
                .doOnSubscribe(s -> log.info("Subscribed to cart events", "cartId", cartId))
                .doOnCancel(() -> log.info("Unsubscribed from cart events", "cartId", cartId))
                .onErrorResume(e -> {
                    log.warn("Error in cart subscription", "cartId", cartId, "error", e.getMessage());
                    return Flux.empty();
                });
    }

    /**
     * Subscribe to all cart events for a store.
     *
     * @param storeNumber the store number
     * @return Flux of cart events for all carts in the store
     */
    public Flux<CartEvent> subscribeToStore(int storeNumber) {
        String channel = storeChannel(storeNumber);
        return redisTemplate.listenTo(ChannelTopic.of(channel))
                .map(ReactiveSubscription.Message::getMessage)
                .flatMap(this::deserialize)
                .doOnSubscribe(s -> log.info("Subscribed to store cart events", "storeNumber", storeNumber))
                .doOnCancel(() -> log.info("Unsubscribed from store cart events", "storeNumber", storeNumber))
                .onErrorResume(e -> Flux.empty());
    }

    private String channel(String cartId) {
        return CHANNEL_PREFIX + cartId + CHANNEL_SUFFIX;
    }

    private String storeChannel(int storeNumber) {
        return CHANNEL_PREFIX + "store:" + storeNumber + CHANNEL_SUFFIX;
    }

    private Mono<CartEvent> deserialize(String json) {
        return Mono.fromCallable(() -> objectMapper.readValue(json, CartEvent.class))
                .onErrorResume(JsonProcessingException.class, e -> {
                    log.warn("Failed to deserialize cart event", "error", e.getMessage());
                    return Mono.empty();
                });
    }
}
```

### 3.5 Integrate Publisher with CartService

**Files:**
- MODIFY: `apps/cart-service/src/main/java/org/example/cart/service/CartService.java`

**Implementation:**
Add event publishing after each mutation. Example for `addProduct`:

```java
// Inject CartEventPublisher in constructor
private final CartEventPublisher eventPublisher;

public Mono<Cart> addProduct(String cartId, long sku, int quantity) {
    return Mono.deferContextual(ctx -> {
        // ... existing implementation ...
        return repository.save(updatedCart)
                .flatMap(saved ->
                        eventPublisher.publish(CartEvent.of(CartEventType.PRODUCT_ADDED, saved))
                                .then(eventPublisher.publishToStore(
                                        CartEvent.of(CartEventType.PRODUCT_ADDED, saved),
                                        saved.storeNumber()))
                                .thenReturn(saved)
                );
    });
}
```

Repeat pattern for: `createCart`, `deleteCart`, `updateProduct`, `removeProduct`, `applyDiscount`, `removeDiscount`, `addFulfillment`, `updateFulfillment`, `removeFulfillment`, `setCustomer`, `removeCustomer`.

---

## Phase 4: GraphQL Validation

### 4.1 GraphQL Input Validator

**Files:**
- CREATE: `apps/cart-service/src/main/java/org/example/cart/graphql/validation/GraphQLInputValidator.java`

**Implementation:**
```java
package org.example.cart.graphql.validation;

import org.example.cart.graphql.input.*;
import org.example.platform.error.ValidationError;
import org.example.platform.error.ValidationException;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.regex.Pattern;

import org.springframework.stereotype.Component;

/**
 * Validates GraphQL inputs using the same rules as REST validation.
 * Collects all errors before returning (not fail-fast).
 */
@Component
public class GraphQLInputValidator {

    private static final int STORE_NUMBER_MIN = 1;
    private static final int STORE_NUMBER_MAX = 2000;
    private static final int QUANTITY_MIN = 1;
    private static final int QUANTITY_MAX = 999;
    private static final long SKU_MIN = 100_000L;
    private static final long SKU_MAX = 999_999_999_999L;
    private static final Pattern UUID_PATTERN = Pattern.compile(
            "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$");
    private static final Pattern EMAIL_PATTERN = Pattern.compile(
            "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$");

    // ─────────────────────────────────────────────────────────────────
    // Cart Operations
    // ─────────────────────────────────────────────────────────────────

    public Mono<Void> validateCreateCart(CreateCartInput input) {
        List<ValidationError> errors = new ArrayList<>();
        validateStoreNumber(input.storeNumber(), "storeNumber", errors);
        // customerId is optional
        return toMono(errors);
    }

    public Mono<Void> validateCartId(String cartId) {
        List<ValidationError> errors = new ArrayList<>();
        validateUuid(cartId, "cartId", errors);
        return toMono(errors);
    }

    public Mono<Void> validateStoreNumber(int storeNumber) {
        List<ValidationError> errors = new ArrayList<>();
        validateStoreNumber(storeNumber, "storeNumber", errors);
        return toMono(errors);
    }

    public Mono<Void> validateCustomerId(String customerId) {
        List<ValidationError> errors = new ArrayList<>();
        validateNotBlank(customerId, "customerId", errors);
        return toMono(errors);
    }

    // ─────────────────────────────────────────────────────────────────
    // Product Operations
    // ─────────────────────────────────────────────────────────────────

    public Mono<Void> validateAddProduct(String cartId, AddProductInput input) {
        List<ValidationError> errors = new ArrayList<>();
        validateUuid(cartId, "cartId", errors);
        validateSku(input.sku(), "input.sku", errors);
        validateQuantity(input.quantity(), "input.quantity", errors);
        return toMono(errors);
    }

    public Mono<Void> validateUpdateProduct(String cartId, String sku, UpdateProductInput input) {
        List<ValidationError> errors = new ArrayList<>();
        validateUuid(cartId, "cartId", errors);
        validateSkuString(sku, "sku", errors);
        validateQuantity(input.quantity(), "input.quantity", errors);
        return toMono(errors);
    }

    public Mono<Void> validateProductAccess(String cartId, String sku) {
        List<ValidationError> errors = new ArrayList<>();
        validateUuid(cartId, "cartId", errors);
        validateSkuString(sku, "sku", errors);
        return toMono(errors);
    }

    // ─────────────────────────────────────────────────────────────────
    // Discount Operations
    // ─────────────────────────────────────────────────────────────────

    public Mono<Void> validateApplyDiscount(String cartId, ApplyDiscountInput input) {
        List<ValidationError> errors = new ArrayList<>();
        validateUuid(cartId, "cartId", errors);
        validateNotBlank(input.code(), "input.code", errors);
        return toMono(errors);
    }

    public Mono<Void> validateDiscountAccess(String cartId, String discountId) {
        List<ValidationError> errors = new ArrayList<>();
        validateUuid(cartId, "cartId", errors);
        validateUuid(discountId, "discountId", errors);
        return toMono(errors);
    }

    // ─────────────────────────────────────────────────────────────────
    // Fulfillment Operations
    // ─────────────────────────────────────────────────────────────────

    public Mono<Void> validateAddFulfillment(String cartId, AddFulfillmentInput input) {
        List<ValidationError> errors = new ArrayList<>();
        validateUuid(cartId, "cartId", errors);
        if (input.type() == null) {
            errors.add(new ValidationError("input.type", "Required"));
        }
        validateSkuList(input.skus(), "input.skus", errors);
        return toMono(errors);
    }

    public Mono<Void> validateUpdateFulfillment(String cartId, String fulfillmentId,
                                                 UpdateFulfillmentInput input) {
        List<ValidationError> errors = new ArrayList<>();
        validateUuid(cartId, "cartId", errors);
        validateUuid(fulfillmentId, "fulfillmentId", errors);
        if (input.type() == null) {
            errors.add(new ValidationError("input.type", "Required"));
        }
        validateSkuList(input.skus(), "input.skus", errors);
        return toMono(errors);
    }

    public Mono<Void> validateFulfillmentAccess(String cartId, String fulfillmentId) {
        List<ValidationError> errors = new ArrayList<>();
        validateUuid(cartId, "cartId", errors);
        validateUuid(fulfillmentId, "fulfillmentId", errors);
        return toMono(errors);
    }

    // ─────────────────────────────────────────────────────────────────
    // Customer Operations
    // ─────────────────────────────────────────────────────────────────

    public Mono<Void> validateSetCustomer(String cartId, SetCustomerInput input) {
        List<ValidationError> errors = new ArrayList<>();
        validateUuid(cartId, "cartId", errors);
        validateNotBlank(input.customerId(), "input.customerId", errors);
        validateNotBlank(input.name(), "input.name", errors);
        validateEmail(input.email(), "input.email", errors);
        return toMono(errors);
    }

    // ─────────────────────────────────────────────────────────────────
    // Validation Helpers
    // ─────────────────────────────────────────────────────────────────

    private void validateUuid(String value, String field, List<ValidationError> errors) {
        if (value == null || value.isBlank()) {
            errors.add(new ValidationError(field, "Required"));
        } else if (!UUID_PATTERN.matcher(value).matches()) {
            errors.add(new ValidationError(field, "Must be a valid UUID"));
        }
    }

    private void validateStoreNumber(int value, String field, List<ValidationError> errors) {
        if (value < STORE_NUMBER_MIN || value > STORE_NUMBER_MAX) {
            errors.add(new ValidationError(field,
                    "Must be between " + STORE_NUMBER_MIN + " and " + STORE_NUMBER_MAX));
        }
    }

    private void validateSku(String value, String field, List<ValidationError> errors) {
        if (value == null || value.isBlank()) {
            errors.add(new ValidationError(field, "Required"));
            return;
        }
        try {
            long sku = Long.parseLong(value);
            if (sku < SKU_MIN || sku > SKU_MAX) {
                errors.add(new ValidationError(field,
                        "Must be between " + SKU_MIN + " and " + SKU_MAX));
            }
        } catch (NumberFormatException e) {
            errors.add(new ValidationError(field, "Must be a valid number"));
        }
    }

    private void validateSkuString(String value, String field, List<ValidationError> errors) {
        validateSku(value, field, errors);
    }

    private void validateSkuList(List<String> skus, String field, List<ValidationError> errors) {
        if (skus == null || skus.isEmpty()) {
            errors.add(new ValidationError(field, "At least one SKU required"));
            return;
        }
        for (int i = 0; i < skus.size(); i++) {
            validateSku(skus.get(i), field + "[" + i + "]", errors);
        }
    }

    private void validateQuantity(int value, String field, List<ValidationError> errors) {
        if (value < QUANTITY_MIN || value > QUANTITY_MAX) {
            errors.add(new ValidationError(field,
                    "Must be between " + QUANTITY_MIN + " and " + QUANTITY_MAX));
        }
    }

    private void validateNotBlank(String value, String field, List<ValidationError> errors) {
        if (value == null || value.isBlank()) {
            errors.add(new ValidationError(field, "Required"));
        }
    }

    private void validateEmail(String value, String field, List<ValidationError> errors) {
        if (value == null || value.isBlank()) {
            errors.add(new ValidationError(field, "Required"));
        } else if (!EMAIL_PATTERN.matcher(value).matches()) {
            errors.add(new ValidationError(field, "Must be a valid email address"));
        }
    }

    private Mono<Void> toMono(List<ValidationError> errors) {
        return errors.isEmpty()
                ? Mono.empty()
                : Mono.error(new ValidationException(errors));
    }
}
```

### 4.2 GraphQL Input Types

**Files:**
- CREATE: `apps/cart-service/src/main/java/org/example/cart/graphql/input/CreateCartInput.java`
- CREATE: `apps/cart-service/src/main/java/org/example/cart/graphql/input/AddProductInput.java`
- CREATE: `apps/cart-service/src/main/java/org/example/cart/graphql/input/UpdateProductInput.java`
- CREATE: `apps/cart-service/src/main/java/org/example/cart/graphql/input/ApplyDiscountInput.java`
- CREATE: `apps/cart-service/src/main/java/org/example/cart/graphql/input/AddFulfillmentInput.java`
- CREATE: `apps/cart-service/src/main/java/org/example/cart/graphql/input/UpdateFulfillmentInput.java`
- CREATE: `apps/cart-service/src/main/java/org/example/cart/graphql/input/SetCustomerInput.java`

**Implementation (CreateCartInput example):**
```java
package org.example.cart.graphql.input;

public record CreateCartInput(
        int storeNumber,
        String customerId  // nullable
) {}
```

**Implementation (AddProductInput):**
```java
package org.example.cart.graphql.input;

public record AddProductInput(
        String sku,
        int quantity
) {}
```

**Implementation (AddFulfillmentInput):**
```java
package org.example.cart.graphql.input;

import org.example.shared.model.fulfillment.FulfillmentType;
import java.util.List;

public record AddFulfillmentInput(
        FulfillmentType type,
        List<String> skus
) {}
```

---

## Phase 5: GraphQL Controllers

### 5.1 Query Controller

**Files:**
- CREATE: `apps/cart-service/src/main/java/org/example/cart/graphql/CartQueryController.java`

**Implementation:**
```java
package org.example.cart.graphql;

import org.example.cart.graphql.validation.GraphQLInputValidator;
import org.example.cart.model.*;
import org.example.cart.service.CartService;
import org.example.shared.model.customer.CartCustomer;
import org.example.shared.model.discount.AppliedDiscount;
import org.example.shared.model.fulfillment.Fulfillment;
import org.example.shared.model.product.CartProduct;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;

/**
 * GraphQL query resolver for cart operations.
 * Provides read-only access to cart data with parity to REST GET endpoints.
 */
@Controller
public class CartQueryController {

    private final CartService cartService;
    private final GraphQLInputValidator validator;

    public CartQueryController(CartService cartService, GraphQLInputValidator validator) {
        this.cartService = cartService;
        this.validator = validator;
    }

    @QueryMapping
    @PreAuthorize("hasAuthority('SCOPE_cart:read')")
    public Mono<Cart> cart(@Argument String id) {
        return validator.validateCartId(id)
                .then(cartService.getCart(id));
    }

    @QueryMapping
    @PreAuthorize("hasAuthority('SCOPE_cart:read')")
    public Flux<Cart> cartsByStore(@Argument int storeNumber) {
        return validator.validateStoreNumber(storeNumber)
                .thenMany(cartService.findByStoreNumber(storeNumber));
    }

    @QueryMapping
    @PreAuthorize("hasAuthority('SCOPE_cart:read')")
    public Flux<Cart> cartsByCustomer(@Argument String customerId) {
        return validator.validateCustomerId(customerId)
                .thenMany(cartService.findByCustomerId(customerId));
    }

    @QueryMapping
    @PreAuthorize("hasAuthority('SCOPE_cart:read')")
    public Mono<CartProduct> cartProduct(@Argument String cartId, @Argument String sku) {
        return validator.validateProductAccess(cartId, sku)
                .then(cartService.getProduct(cartId, Long.parseLong(sku)));
    }

    @QueryMapping
    @PreAuthorize("hasAuthority('SCOPE_cart:read')")
    public Mono<List<CartProduct>> cartProducts(@Argument String cartId) {
        return validator.validateCartId(cartId)
                .then(cartService.getProducts(cartId));
    }

    @QueryMapping
    @PreAuthorize("hasAuthority('SCOPE_cart:read')")
    public Mono<AppliedDiscount> cartDiscount(@Argument String cartId, @Argument String discountId) {
        return validator.validateDiscountAccess(cartId, discountId)
                .then(cartService.getDiscount(cartId, discountId));
    }

    @QueryMapping
    @PreAuthorize("hasAuthority('SCOPE_cart:read')")
    public Mono<List<AppliedDiscount>> cartDiscounts(@Argument String cartId) {
        return validator.validateCartId(cartId)
                .then(cartService.getDiscounts(cartId));
    }

    @QueryMapping
    @PreAuthorize("hasAuthority('SCOPE_cart:read')")
    public Mono<Fulfillment> cartFulfillment(@Argument String cartId, @Argument String fulfillmentId) {
        return validator.validateFulfillmentAccess(cartId, fulfillmentId)
                .then(cartService.getFulfillment(cartId, fulfillmentId));
    }

    @QueryMapping
    @PreAuthorize("hasAuthority('SCOPE_cart:read')")
    public Mono<List<Fulfillment>> cartFulfillments(@Argument String cartId) {
        return validator.validateCartId(cartId)
                .then(cartService.getFulfillments(cartId));
    }

    @QueryMapping
    @PreAuthorize("hasAuthority('SCOPE_cart:read')")
    public Mono<CartCustomer> cartCustomer(@Argument String cartId) {
        return validator.validateCartId(cartId)
                .then(cartService.getCustomer(cartId));
    }
}
```

### 5.2 Mutation Controller

**Files:**
- CREATE: `apps/cart-service/src/main/java/org/example/cart/graphql/CartMutationController.java`

**Implementation:**
```java
package org.example.cart.graphql;

import org.example.cart.graphql.input.*;
import org.example.cart.graphql.validation.GraphQLInputValidator;
import org.example.cart.model.Cart;
import org.example.cart.service.CartService;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.stream.Collectors;

/**
 * GraphQL mutation resolver for cart operations.
 * Provides write operations with parity to REST POST/PUT/DELETE endpoints.
 */
@Controller
public class CartMutationController {

    private final CartService cartService;
    private final GraphQLInputValidator validator;

    public CartMutationController(CartService cartService, GraphQLInputValidator validator) {
        this.cartService = cartService;
        this.validator = validator;
    }

    // ─────────────────────────────────────────────────────────────────
    // Cart Lifecycle
    // ─────────────────────────────────────────────────────────────────

    @MutationMapping
    @PreAuthorize("hasAuthority('SCOPE_cart:write')")
    public Mono<Cart> createCart(@Argument CreateCartInput input) {
        return validator.validateCreateCart(input)
                .then(cartService.createCart(input.storeNumber(), input.customerId()));
    }

    @MutationMapping
    @PreAuthorize("hasAuthority('SCOPE_cart:write')")
    public Mono<Boolean> deleteCart(@Argument String id) {
        return validator.validateCartId(id)
                .then(cartService.deleteCart(id))
                .thenReturn(true);
    }

    // ─────────────────────────────────────────────────────────────────
    // Product Operations
    // ─────────────────────────────────────────────────────────────────

    @MutationMapping
    @PreAuthorize("hasAuthority('SCOPE_cart:write')")
    public Mono<Cart> addProduct(@Argument String cartId, @Argument AddProductInput input) {
        return validator.validateAddProduct(cartId, input)
                .then(cartService.addProduct(cartId, Long.parseLong(input.sku()), input.quantity()));
    }

    @MutationMapping
    @PreAuthorize("hasAuthority('SCOPE_cart:write')")
    public Mono<Cart> updateProduct(@Argument String cartId, @Argument String sku,
                                    @Argument UpdateProductInput input) {
        return validator.validateUpdateProduct(cartId, sku, input)
                .then(cartService.updateProduct(cartId, Long.parseLong(sku), input.quantity()));
    }

    @MutationMapping
    @PreAuthorize("hasAuthority('SCOPE_cart:write')")
    public Mono<Cart> removeProduct(@Argument String cartId, @Argument String sku) {
        return validator.validateProductAccess(cartId, sku)
                .then(cartService.removeProduct(cartId, Long.parseLong(sku)));
    }

    // ─────────────────────────────────────────────────────────────────
    // Discount Operations
    // ─────────────────────────────────────────────────────────────────

    @MutationMapping
    @PreAuthorize("hasAuthority('SCOPE_cart:write')")
    public Mono<Cart> applyDiscount(@Argument String cartId, @Argument ApplyDiscountInput input) {
        return validator.validateApplyDiscount(cartId, input)
                .then(cartService.applyDiscount(cartId, input.code()));
    }

    @MutationMapping
    @PreAuthorize("hasAuthority('SCOPE_cart:write')")
    public Mono<Cart> removeDiscount(@Argument String cartId, @Argument String discountId) {
        return validator.validateDiscountAccess(cartId, discountId)
                .then(cartService.removeDiscount(cartId, discountId));
    }

    // ─────────────────────────────────────────────────────────────────
    // Fulfillment Operations
    // ─────────────────────────────────────────────────────────────────

    @MutationMapping
    @PreAuthorize("hasAuthority('SCOPE_cart:write')")
    public Mono<Cart> addFulfillment(@Argument String cartId, @Argument AddFulfillmentInput input) {
        List<Long> skus = input.skus().stream()
                .map(Long::parseLong)
                .collect(Collectors.toList());
        return validator.validateAddFulfillment(cartId, input)
                .then(cartService.addFulfillment(cartId, input.type(), skus));
    }

    @MutationMapping
    @PreAuthorize("hasAuthority('SCOPE_cart:write')")
    public Mono<Cart> updateFulfillment(@Argument String cartId, @Argument String fulfillmentId,
                                        @Argument UpdateFulfillmentInput input) {
        List<Long> skus = input.skus().stream()
                .map(Long::parseLong)
                .collect(Collectors.toList());
        return validator.validateUpdateFulfillment(cartId, fulfillmentId, input)
                .then(cartService.updateFulfillment(cartId, fulfillmentId, input.type(), skus));
    }

    @MutationMapping
    @PreAuthorize("hasAuthority('SCOPE_cart:write')")
    public Mono<Cart> removeFulfillment(@Argument String cartId, @Argument String fulfillmentId) {
        return validator.validateFulfillmentAccess(cartId, fulfillmentId)
                .then(cartService.removeFulfillment(cartId, fulfillmentId));
    }

    // ─────────────────────────────────────────────────────────────────
    // Customer Operations (beyond REST parity)
    // ─────────────────────────────────────────────────────────────────

    @MutationMapping
    @PreAuthorize("hasAuthority('SCOPE_cart:write')")
    public Mono<Cart> setCustomer(@Argument String cartId, @Argument SetCustomerInput input) {
        return validator.validateSetCustomer(cartId, input)
                .then(cartService.setCustomer(cartId, input.customerId(), input.name(), input.email()));
    }

    @MutationMapping
    @PreAuthorize("hasAuthority('SCOPE_cart:write')")
    public Mono<Cart> removeCustomer(@Argument String cartId) {
        return validator.validateCartId(cartId)
                .then(cartService.removeCustomer(cartId));
    }
}
```

### 5.3 Subscription Controller

**Files:**
- CREATE: `apps/cart-service/src/main/java/org/example/cart/graphql/CartSubscriptionController.java`

**Implementation:**
```java
package org.example.cart.graphql;

import org.example.cart.event.CartEvent;
import org.example.cart.graphql.validation.GraphQLInputValidator;
import org.example.cart.pubsub.CartEventSubscriber;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.SubscriptionMapping;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import reactor.core.publisher.Flux;

/**
 * GraphQL subscription resolver for real-time cart updates.
 *
 * <p>Uses Redis Pub/Sub for cross-instance event fan-out.
 * SSE transport is used by default (no WebSocket configuration needed).
 *
 * <p>Client connection via SSE:
 * <pre>
 * GET /graphql?query=subscription{cartUpdated(cartId:"...")}
 * Accept: text/event-stream
 * Authorization: Bearer &lt;token&gt;
 * </pre>
 */
@Controller
public class CartSubscriptionController {

    private final CartEventSubscriber eventSubscriber;
    private final GraphQLInputValidator validator;

    public CartSubscriptionController(CartEventSubscriber eventSubscriber,
                                      GraphQLInputValidator validator) {
        this.eventSubscriber = eventSubscriber;
        this.validator = validator;
    }

    /**
     * Subscribe to updates for a specific cart.
     *
     * @param cartId the cart ID to subscribe to
     * @return Flux of cart events
     */
    @SubscriptionMapping
    @PreAuthorize("hasAuthority('SCOPE_cart:read')")
    public Flux<CartEvent> cartUpdated(@Argument String cartId) {
        return validator.validateCartId(cartId)
                .thenMany(eventSubscriber.subscribe(cartId));
    }

    /**
     * Subscribe to all cart events for a store (admin use).
     *
     * @param storeNumber the store number
     * @return Flux of cart events for all carts in the store
     */
    @SubscriptionMapping
    @PreAuthorize("hasAuthority('SCOPE_cart:admin')")
    public Flux<CartEvent> storeCartEvents(@Argument int storeNumber) {
        return validator.validateStoreNumber(storeNumber)
                .thenMany(eventSubscriber.subscribeToStore(storeNumber));
    }
}
```

---

## Phase 6: Error Handling

### 6.1 GraphQL Exception Resolver

**Files:**
- CREATE: `apps/cart-service/src/main/java/org/example/cart/graphql/GraphQLExceptionResolver.java`

**Implementation:**
```java
package org.example.cart.graphql;

import graphql.GraphQLError;
import graphql.GraphqlErrorBuilder;
import graphql.schema.DataFetchingEnvironment;
import org.example.platform.error.ValidationException;
import org.springframework.graphql.execution.DataFetcherExceptionResolverAdapter;
import org.springframework.graphql.execution.ErrorType;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.NoSuchElementException;
import java.util.stream.Collectors;

/**
 * Converts service exceptions to GraphQL errors with appropriate types.
 */
@Component
public class GraphQLExceptionResolver extends DataFetcherExceptionResolverAdapter {

    @Override
    protected GraphQLError resolveToSingleError(Throwable ex, DataFetchingEnvironment env) {
        if (ex instanceof ValidationException ve) {
            Map<String, Object> extensions = Map.of(
                    "validationErrors", ve.getErrors().stream()
                            .collect(Collectors.toMap(
                                    e -> e.field(),
                                    e -> e.message(),
                                    (a, b) -> a + "; " + b
                            ))
            );
            return GraphqlErrorBuilder.newError(env)
                    .message("Validation failed")
                    .errorType(ErrorType.BAD_REQUEST)
                    .extensions(extensions)
                    .build();
        }

        if (ex instanceof NoSuchElementException) {
            return GraphqlErrorBuilder.newError(env)
                    .message(ex.getMessage())
                    .errorType(ErrorType.NOT_FOUND)
                    .build();
        }

        if (ex instanceof IllegalArgumentException) {
            return GraphqlErrorBuilder.newError(env)
                    .message(ex.getMessage())
                    .errorType(ErrorType.BAD_REQUEST)
                    .build();
        }

        if (ex instanceof org.springframework.security.access.AccessDeniedException) {
            return GraphqlErrorBuilder.newError(env)
                    .message("Access denied")
                    .errorType(ErrorType.FORBIDDEN)
                    .build();
        }

        // Default: internal error (don't expose details)
        return GraphqlErrorBuilder.newError(env)
                .message("Internal server error")
                .errorType(ErrorType.INTERNAL_ERROR)
                .build();
    }
}
```

### 6.2 Security Configuration Update

**Files:**
- MODIFY: `apps/cart-service/src/main/java/org/example/cart/config/SecurityConfig.java`

**Implementation:**
Add GraphQL endpoint to security configuration:
```java
.pathMatchers("/graphql").authenticated()
.pathMatchers("/graphiql").permitAll()  // Disable in production
```

---

## Phase 7: Testing

### 7.1 GraphQL Query Tests

**Files:**
- CREATE: `apps/cart-service/src/test/java/org/example/cart/graphql/CartQueryControllerTest.java`

**Implementation:**
```java
package org.example.cart.graphql;

import org.example.cart.AbstractIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.graphql.test.tester.HttpGraphQlTester;
import org.springframework.security.test.context.support.WithMockUser;

class CartQueryControllerTest extends AbstractIntegrationTest {

    @Autowired
    private HttpGraphQlTester graphQlTester;

    @Test
    @WithMockUser(authorities = "SCOPE_cart:read")
    void shouldGetCartById() {
        // Given: create a cart first via mutation
        String cartId = createTestCart();

        // When/Then
        graphQlTester.document("""
                query GetCart($id: ID!) {
                    cart(id: $id) {
                        id
                        storeNumber
                        totals {
                            grandTotal
                        }
                        itemCount
                    }
                }
                """)
                .variable("id", cartId)
                .execute()
                .path("cart.id").entity(String.class).isEqualTo(cartId)
                .path("cart.storeNumber").entity(Integer.class).isEqualTo(100)
                .path("cart.itemCount").entity(Integer.class).isEqualTo(0);
    }

    @Test
    @WithMockUser(authorities = "SCOPE_cart:read")
    void shouldReturnNullForNonExistentCart() {
        graphQlTester.document("""
                query GetCart($id: ID!) {
                    cart(id: $id) {
                        id
                    }
                }
                """)
                .variable("id", "550e8400-e29b-41d4-a716-446655440000")
                .execute()
                .path("cart").valueIsNull();
    }

    @Test
    void shouldRejectUnauthenticatedRequest() {
        graphQlTester.document("""
                query {
                    cart(id: "test") {
                        id
                    }
                }
                """)
                .execute()
                .errors()
                .satisfy(errors ->
                        assertThat(errors).anyMatch(e ->
                                e.getMessage().contains("Access denied")));
    }

    private String createTestCart() {
        // Implementation using mutation
        return graphQlTester.document("""
                mutation {
                    createCart(input: { storeNumber: 100 }) {
                        id
                    }
                }
                """)
                .executeAndRetry()
                .path("createCart.id")
                .entity(String.class)
                .get();
    }
}
```

### 7.2 GraphQL Mutation Tests

**Files:**
- CREATE: `apps/cart-service/src/test/java/org/example/cart/graphql/CartMutationControllerTest.java`

**Implementation:**
```java
package org.example.cart.graphql;

import org.example.cart.AbstractIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.graphql.test.tester.HttpGraphQlTester;
import org.springframework.security.test.context.support.WithMockUser;

class CartMutationControllerTest extends AbstractIntegrationTest {

    @Autowired
    private HttpGraphQlTester graphQlTester;

    @Test
    @WithMockUser(authorities = "SCOPE_cart:write")
    void shouldCreateCart() {
        graphQlTester.document("""
                mutation CreateCart($input: CreateCartInput!) {
                    createCart(input: $input) {
                        id
                        storeNumber
                        customerId
                        totals {
                            grandTotal
                        }
                    }
                }
                """)
                .variable("input", Map.of(
                        "storeNumber", 100,
                        "customerId", "cust-123"
                ))
                .execute()
                .path("createCart.storeNumber").entity(Integer.class).isEqualTo(100)
                .path("createCart.customerId").entity(String.class).isEqualTo("cust-123")
                .path("createCart.totals.grandTotal").entity(String.class).isEqualTo("0.00");
    }

    @Test
    @WithMockUser(authorities = "SCOPE_cart:write")
    void shouldValidateCreateCartInput() {
        graphQlTester.document("""
                mutation {
                    createCart(input: { storeNumber: 9999 }) {
                        id
                    }
                }
                """)
                .execute()
                .errors()
                .satisfy(errors -> {
                    assertThat(errors).hasSize(1);
                    assertThat(errors.get(0).getMessage()).contains("Validation failed");
                    assertThat(errors.get(0).getExtensions())
                            .containsKey("validationErrors");
                });
    }

    @Test
    @WithMockUser(authorities = "SCOPE_cart:write")
    void shouldAddProductToCart() {
        String cartId = createTestCart();

        graphQlTester.document("""
                mutation AddProduct($cartId: ID!, $input: AddProductInput!) {
                    addProduct(cartId: $cartId, input: $input) {
                        id
                        products {
                            sku
                            quantity
                            lineTotal
                        }
                        totals {
                            subtotal
                            grandTotal
                        }
                        itemCount
                    }
                }
                """)
                .variable("cartId", cartId)
                .variable("input", Map.of(
                        "sku", "123456",
                        "quantity", 2
                ))
                .execute()
                .path("addProduct.itemCount").entity(Integer.class).isEqualTo(2)
                .path("addProduct.products[0].sku").entity(String.class).isEqualTo("123456")
                .path("addProduct.products[0].quantity").entity(Integer.class).isEqualTo(2);
    }
}
```

### 7.3 GraphQL Subscription Tests

**Files:**
- CREATE: `apps/cart-service/src/test/java/org/example/cart/graphql/CartSubscriptionControllerTest.java`

**Implementation:**
```java
package org.example.cart.graphql;

import org.example.cart.AbstractIntegrationTest;
import org.example.cart.event.CartEventType;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.graphql.test.tester.WebGraphQlTester;
import org.springframework.security.test.context.support.WithMockUser;
import reactor.test.StepVerifier;

import java.time.Duration;

class CartSubscriptionControllerTest extends AbstractIntegrationTest {

    @Autowired
    private WebGraphQlTester graphQlTester;

    @Test
    @WithMockUser(authorities = {"SCOPE_cart:read", "SCOPE_cart:write"})
    void shouldReceiveCartUpdatesViaSubscription() {
        // Given: create a cart
        String cartId = createTestCart();

        // When: subscribe to cart updates
        var subscription = graphQlTester.document("""
                subscription CartUpdated($cartId: ID!) {
                    cartUpdated(cartId: $cartId) {
                        eventType
                        cartId
                        cart {
                            id
                            itemCount
                        }
                    }
                }
                """)
                .variable("cartId", cartId)
                .executeSubscription()
                .toFlux("cartUpdated", CartEventResponse.class);

        // Then: trigger an update and verify subscription receives it
        StepVerifier.create(subscription.take(1))
                .then(() -> addProductToCart(cartId))
                .assertNext(event -> {
                    assertThat(event.eventType()).isEqualTo("PRODUCT_ADDED");
                    assertThat(event.cartId()).isEqualTo(cartId);
                })
                .verifyComplete();
    }

    record CartEventResponse(String eventType, String cartId, CartResponse cart) {}
    record CartResponse(String id, int itemCount) {}
}
```

### 7.4 Redis Pub/Sub Tests

**Files:**
- CREATE: `apps/cart-service/src/test/java/org/example/cart/pubsub/CartEventPubSubTest.java`

**Implementation:**
```java
package org.example.cart.pubsub;

import org.example.cart.AbstractIntegrationTest;
import org.example.cart.event.CartEvent;
import org.example.cart.event.CartEventType;
import org.example.cart.model.Cart;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import reactor.test.StepVerifier;

import java.time.Duration;

class CartEventPubSubTest extends AbstractIntegrationTest {

    @Autowired
    private CartEventPublisher publisher;

    @Autowired
    private CartEventSubscriber subscriber;

    @Test
    void shouldPublishAndReceiveCartEvent() {
        String cartId = "test-cart-" + System.currentTimeMillis();
        Cart cart = Cart.create(cartId, 100, null);
        CartEvent event = CartEvent.of(CartEventType.CART_CREATED, cart);

        StepVerifier.create(
                subscriber.subscribe(cartId)
                        .doOnSubscribe(s ->
                                // Publish after subscription established
                                publisher.publish(event).subscribe())
                        .take(1)
                        .timeout(Duration.ofSeconds(5))
        )
        .assertNext(received -> {
            assertThat(received.eventType()).isEqualTo(CartEventType.CART_CREATED);
            assertThat(received.cartId()).isEqualTo(cartId);
        })
        .verifyComplete();
    }

    @Test
    void shouldNotReceiveEventsForOtherCarts() {
        String cartId1 = "cart-1";
        String cartId2 = "cart-2";
        Cart cart2 = Cart.create(cartId2, 100, null);
        CartEvent event = CartEvent.of(CartEventType.CART_CREATED, cart2);

        // Subscribe to cart-1, publish to cart-2
        StepVerifier.create(
                subscriber.subscribe(cartId1)
                        .doOnSubscribe(s -> publisher.publish(event).subscribe())
                        .timeout(Duration.ofMillis(500))
        )
        .expectTimeout(Duration.ofMillis(500))
        .verify();
    }
}
```

### 7.5 Validation Tests

**Files:**
- CREATE: `apps/cart-service/src/test/java/org/example/cart/graphql/validation/GraphQLInputValidatorTest.java`

**Implementation:**
```java
package org.example.cart.graphql.validation;

import org.example.cart.graphql.input.*;
import org.example.platform.error.ValidationException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import reactor.test.StepVerifier;

class GraphQLInputValidatorTest {

    private GraphQLInputValidator validator;

    @BeforeEach
    void setUp() {
        validator = new GraphQLInputValidator();
    }

    @Nested
    class CreateCartValidation {
        @Test
        void shouldAcceptValidInput() {
            var input = new CreateCartInput(100, "cust-123");
            StepVerifier.create(validator.validateCreateCart(input))
                    .verifyComplete();
        }

        @ParameterizedTest
        @ValueSource(ints = {0, -1, 2001, 9999})
        void shouldRejectInvalidStoreNumber(int storeNumber) {
            var input = new CreateCartInput(storeNumber, null);
            StepVerifier.create(validator.validateCreateCart(input))
                    .expectErrorMatches(e ->
                            e instanceof ValidationException ve &&
                            ve.getErrors().stream()
                                    .anyMatch(err -> err.field().equals("storeNumber")))
                    .verify();
        }
    }

    @Nested
    class AddProductValidation {
        private static final String VALID_CART_ID = "550e8400-e29b-41d4-a716-446655440000";

        @Test
        void shouldAcceptValidInput() {
            var input = new AddProductInput("123456", 5);
            StepVerifier.create(validator.validateAddProduct(VALID_CART_ID, input))
                    .verifyComplete();
        }

        @Test
        void shouldCollectAllErrors() {
            var input = new AddProductInput("invalid", 0);
            StepVerifier.create(validator.validateAddProduct("not-a-uuid", input))
                    .expectErrorMatches(e ->
                            e instanceof ValidationException ve &&
                            ve.getErrors().size() >= 3)  // cartId, sku, quantity
                    .verify();
        }
    }
}
```

---

## Phase 8: Documentation and Examples

### 8.1 GraphQL README

**Files:**
- CREATE: `apps/cart-service/src/main/resources/graphql/README.md`

**Implementation:**
```markdown
# Cart Service GraphQL API

## Endpoint

- **URL**: `/graphql`
- **Method**: `POST` (queries/mutations), `GET` (subscriptions with SSE)

## Authentication

All operations require OAuth2 bearer token with appropriate scopes:
- `cart:read` - Query operations
- `cart:write` - Mutation operations
- `cart:admin` - Store-wide subscriptions

## Interactive Explorer

GraphiQL is available at `/graphiql` (development only).

## Example Operations

### Query: Get Cart

```graphql
query GetCart($id: ID!) {
  cart(id: $id) {
    id
    storeNumber
    customer {
      name
      email
    }
    products {
      sku
      description
      quantity
      lineTotal
    }
    discounts {
      code
      appliedSavings
    }
    fulfillments {
      type
      cost
    }
    totals {
      subtotal
      discountTotal
      fulfillmentTotal
      grandTotal
    }
    itemCount
  }
}
```

### Mutation: Add Product

```graphql
mutation AddProduct($cartId: ID!, $input: AddProductInput!) {
  addProduct(cartId: $cartId, input: $input) {
    id
    products {
      sku
      quantity
    }
    totals {
      grandTotal
    }
  }
}

# Variables:
{
  "cartId": "550e8400-e29b-41d4-a716-446655440000",
  "input": {
    "sku": "123456",
    "quantity": 2
  }
}
```

### Subscription: Cart Updates

```graphql
subscription CartUpdated($cartId: ID!) {
  cartUpdated(cartId: $cartId) {
    eventType
    cart {
      id
      itemCount
      totals {
        grandTotal
      }
    }
    timestamp
  }
}
```

## SSE Subscription Client Example

```javascript
// Browser client using EventSource
const cartId = "550e8400-e29b-41d4-a716-446655440000";
const query = `subscription { cartUpdated(cartId: "${cartId}") {
  eventType
  cart { id itemCount totals { grandTotal } }
  timestamp
}}`;

const url = `/graphql?query=${encodeURIComponent(query)}`;

const eventSource = new EventSource(url);
eventSource.withCredentials = true;

// Set auth via custom header not possible with EventSource
// Use cookies or URL token parameter instead

eventSource.onmessage = (event) => {
  const response = JSON.parse(event.data);
  const cartEvent = response.data.cartUpdated;
  console.log('Cart updated:', cartEvent.eventType);
  updateUI(cartEvent.cart);
};

eventSource.onerror = (error) => {
  console.error('Connection error:', error);
  // EventSource auto-reconnects
  // On reconnect, re-fetch current cart state
};

// Cleanup
window.addEventListener('beforeunload', () => eventSource.close());
```

## Error Response Format

```json
{
  "errors": [
    {
      "message": "Validation failed",
      "locations": [{"line": 2, "column": 3}],
      "path": ["createCart"],
      "extensions": {
        "classification": "BAD_REQUEST",
        "validationErrors": {
          "storeNumber": "Must be between 1 and 2000",
          "input.quantity": "Must be between 1 and 999"
        }
      }
    }
  ]
}
```
```

---

## Files Summary

| Action | File | Purpose |
|--------|------|---------|
| MODIFY | `apps/cart-service/build.gradle.kts` | Add GraphQL dependencies |
| MODIFY | `apps/cart-service/src/main/resources/application.yml` | GraphQL configuration |
| CREATE | `apps/cart-service/src/main/resources/graphql/schema.graphqls` | Core GraphQL types |
| CREATE | `apps/cart-service/src/main/resources/graphql/operations.graphqls` | Queries, mutations, subscriptions |
| CREATE | `apps/cart-service/src/main/java/.../event/CartEvent.java` | Event model |
| CREATE | `apps/cart-service/src/main/java/.../event/CartEventType.java` | Event type enum |
| CREATE | `apps/cart-service/src/main/java/.../pubsub/CartEventPublisher.java` | Redis Pub/Sub publisher |
| CREATE | `apps/cart-service/src/main/java/.../pubsub/CartEventSubscriber.java` | Redis Pub/Sub subscriber |
| CREATE | `apps/cart-service/src/main/java/.../graphql/input/*.java` | Input type records (7 files) |
| CREATE | `apps/cart-service/src/main/java/.../graphql/validation/GraphQLInputValidator.java` | Input validation |
| CREATE | `apps/cart-service/src/main/java/.../graphql/CartQueryController.java` | Query resolver |
| CREATE | `apps/cart-service/src/main/java/.../graphql/CartMutationController.java` | Mutation resolver |
| CREATE | `apps/cart-service/src/main/java/.../graphql/CartSubscriptionController.java` | Subscription resolver |
| CREATE | `apps/cart-service/src/main/java/.../graphql/GraphQLExceptionResolver.java` | Error handling |
| MODIFY | `apps/cart-service/src/main/java/.../service/CartService.java` | Add event publishing |
| MODIFY | `apps/cart-service/src/main/java/.../config/SecurityConfig.java` | GraphQL endpoint security |
| CREATE | `apps/cart-service/src/test/java/.../graphql/CartQueryControllerTest.java` | Query tests |
| CREATE | `apps/cart-service/src/test/java/.../graphql/CartMutationControllerTest.java` | Mutation tests |
| CREATE | `apps/cart-service/src/test/java/.../graphql/CartSubscriptionControllerTest.java` | Subscription tests |
| CREATE | `apps/cart-service/src/test/java/.../pubsub/CartEventPubSubTest.java` | Pub/Sub tests |
| CREATE | `apps/cart-service/src/test/java/.../graphql/validation/GraphQLInputValidatorTest.java` | Validation tests |
| CREATE | `apps/cart-service/src/main/resources/graphql/README.md` | API documentation |

---

## Testing Strategy

| Test Type | Scope | Tools |
|-----------|-------|-------|
| Unit | Validation logic | JUnit 5, StepVerifier |
| Integration | Query/Mutation controllers | Spring GraphQL Test, Testcontainers |
| Integration | Subscription controllers | WebGraphQlTester, StepVerifier |
| Integration | Redis Pub/Sub | Testcontainers (Redis), StepVerifier |
| E2E | Full flow with auth | k6, actual Redis + PostgreSQL |

---

## Known Issues (Resolved)

### Flyway Integration Test Issue

**Status:** RESOLVED

**Problem:** GraphQL integration tests failed because Flyway database migrations didn't run in the test environment with R2DBC.

**Solution:** Run Flyway programmatically in a static initializer block before Spring context loads:
```java
static {
  postgres = new PostgreSQLContainer<>("postgres:15-alpine")...;
  postgres.start();
  Flyway.configure()
      .dataSource(postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword())
      .locations("classpath:db/migration")
      .load()
      .migrate();
}
```

**Additional Fixes Applied:**
1. **Spring Data R2DBC INSERT vs UPDATE**: Implemented `Persistable<UUID>` on CartEntity with `isNew()` method
2. **JSONB column type conversion**: Created `JsonValue` wrapper type and R2DBC custom converters
3. **Mock external service clients**: Added `@MockitoBean` for CustomerServiceClient, ProductServiceClient, etc.
4. **Unauthenticated request tests**: Updated to use WebTestClient for testing 401 HTTP responses

---

## Checklist

- [x] Phase 1: Dependencies and configuration
  - [x] GraphQL starter added to build.gradle.kts
  - [x] application.yml configured for GraphQL + SSE
- [x] Phase 2: GraphQL schema
  - [x] schema.graphqls with all types
  - [x] operations.graphqls with queries, mutations, subscriptions
- [x] Phase 3: Event infrastructure
  - [x] CartEvent and CartEventType models
  - [x] CartEventPublisher (Redis Pub/Sub)
  - [x] CartEventSubscriber (Redis Pub/Sub)
  - [x] CartService integrated with event publishing
- [x] Phase 4: Validation
  - [x] GraphQLInputValidator with all validation methods
  - [x] Input type records created
- [x] Phase 5: Controllers
  - [x] CartQueryController with all queries
  - [x] CartMutationController with all mutations
  - [x] CartSubscriptionController with subscriptions
- [x] Phase 6: Error handling
  - [x] GraphQLExceptionResolver
  - [x] Security configuration updated
- [x] Phase 7: Testing
  - [x] Query controller tests
  - [x] Mutation controller tests
  - [x] Subscription controller tests
  - [x] Pub/Sub tests
  - [x] Validation tests
- [x] Phase 8: Documentation
  - [x] GraphQL README with examples
  - [x] SSE client integration examples
