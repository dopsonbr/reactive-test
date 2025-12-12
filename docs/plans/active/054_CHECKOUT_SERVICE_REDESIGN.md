# 054: Checkout Service Redesign

**Status:** Design Complete
**Created:** 2025-12-11
**Author:** AI-assisted design session

## Overview

Redesign checkout-service from storing orders directly to being an orchestration layer that publishes events for order-service to consume. This aligns with the intended architecture where checkout handles the cart-to-order conversion workflow while order-service owns order persistence and queries.

## Problem Statement

Current issues with checkout-service:
1. **Stores orders directly** via `orderRepository.save()` instead of publishing events
2. **Exposes order read APIs** (`GET /orders/{id}`, `GET /orders`) - clients incorrectly query checkout for orders
3. **No event publishing** - order-service never gets notified of completed checkouts
4. **In-memory checkout sessions** using `ConcurrentHashMap` - doesn't survive restarts
5. **Duplicated models** - both checkout and order services have their own `Order`, `OrderLineItem`, etc.

## Design Decisions

| Aspect | Decision |
|--------|----------|
| Checkout sessions | Redis (supports TTL, multi-instance) |
| Messaging | Redis Streams via new `platform-events` library |
| Event format | CloudEvents v1.0 specification |
| Event content | Full order snapshot (event-carried state transfer) |
| Checkout persistence | Transaction log (metadata only) for reporting/debugging |
| Order APIs in checkout | Remove entirely - clients use order-service |
| Complete response | Full order snapshot (fire-and-forget, no persistence guarantee) |
| Publish failure handling | Store-and-forward, background retry scheduler |
| Order-service failure | Internal retries + dead letter (like audit-service) |
| Shared models | New `shared-model-order` library |

## Architecture

### Service Boundaries

**Checkout-service responsibilities (orchestration only):**
- `POST /checkout/initiate` - Validate cart, calculate discounts, reserve inventory, create Redis session
- `POST /checkout/complete` - Process payment, publish order event, return snapshot
- `GET /checkout/sessions/{id}` - Check session status (optional, for debugging)

**Order-service responsibilities (order persistence + queries):**
- Consume `OrderCompleted` events from Redis Streams
- Persist orders to database
- `GET /orders/{id}`, `GET /orders?storeNumber=X` - All order queries
- GraphQL queries/mutations for order management

**Data ownership:**
- Checkout-service owns: checkout sessions (Redis), checkout transaction log (Postgres)
- Order-service owns: orders table (Postgres)

### Complete Checkout Flow

```
1. Client calls POST /checkout/complete
2. Validate session from Redis
3. Process payment
4. Create CheckoutTransaction record (status=COMPLETED, event_published=false)
5. Build CloudEvent with full Order snapshot
6. Publish to Redis Stream "orders:completed"
7. Update transaction record (event_published=true)
8. Delete Redis session
9. Return Order snapshot to client

On publish failure:
- Transaction stays event_published=false
- EventRetryScheduler picks up and retries
```

## New Components

### Platform Events Library

**Location:** `libs/backend/platform/platform-events`

Uses [CloudEvents specification](https://cloudevents.io/) with the official [Java SDK](https://github.com/cloudevents/sdk-java):

```
platform-events/
├── CloudEventPublisher.java        # Reactive publisher to Redis Streams
├── CloudEventConsumer.java         # Base consumer with retry/dead-letter
├── CloudEventSerializer.java       # JSON serialization using SDK
├── EventStreamProperties.java      # Configurable stream keys, consumer groups
└── EventsAutoConfiguration.java
```

**Dependencies:**
```kotlin
api("io.cloudevents:cloudevents-core:4.0.1")
api("io.cloudevents:cloudevents-json-jackson:4.0.1")
```

### CloudEvents Structure for OrderCompleted

| Attribute | Value |
|-----------|-------|
| `specversion` | `1.0` |
| `id` | UUID (unique per event) |
| `source` | `urn:reactive-platform:checkout-service` |
| `type` | `org.example.checkout.OrderCompleted` |
| `subject` | Order ID |
| `time` | ISO 8601 timestamp |
| `datacontenttype` | `application/json` |
| `dataschema` | `urn:reactive-platform:schemas:order:v1` |
| `data` | Full `Order` object from shared-model |

### Shared Model Library

**Location:** `libs/backend/shared-model/shared-model-order`

Consolidates duplicated models:

```
shared-model-order/
├── Order.java
├── OrderLineItem.java
├── OrderStatus.java
├── PaymentStatus.java
├── AppliedDiscount.java
├── CustomerSnapshot.java
├── FulfillmentDetails.java
├── FulfillmentType.java
└── DeliveryAddress.java
```

**Design choices:**
- Immutable records - events carry snapshots
- Lombok `@Builder` for construction
- Jackson annotations for CloudEvents data payload
- No JPA annotations - entities stay in each service; shared models are pure DTOs

**Dependency direction:**
```
checkout-service  ──→  shared-model-order  ←──  order-service
                              ↑
                       platform-events (for CloudEvent data)
```

### Checkout Transaction Log Schema

**Table:** `checkout_transactions` (in checkout-service's schema)

```sql
CREATE TABLE checkout_transactions (
    id                  UUID PRIMARY KEY,
    checkout_session_id VARCHAR(64) NOT NULL UNIQUE,
    cart_id             VARCHAR(64) NOT NULL,
    store_number        INTEGER NOT NULL,
    order_id            UUID,                    -- Set after event published

    -- Status tracking
    status              VARCHAR(32) NOT NULL,    -- INITIATED, PAYMENT_PROCESSING,
                                                 -- COMPLETED, FAILED, RETRY_PENDING
    failure_reason      TEXT,

    -- Totals (for reporting without needing order-service)
    grand_total         DECIMAL(12,2) NOT NULL,
    item_count          INTEGER NOT NULL,

    -- Payment info
    payment_method      VARCHAR(32),
    payment_reference   VARCHAR(128),

    -- Event publishing tracking
    event_published     BOOLEAN DEFAULT FALSE,
    event_publish_attempts INTEGER DEFAULT 0,
    last_publish_attempt TIMESTAMPTZ,

    -- Timestamps
    initiated_at        TIMESTAMPTZ NOT NULL,
    completed_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_checkout_transactions_store ON checkout_transactions(store_number);
CREATE INDEX idx_checkout_transactions_status ON checkout_transactions(status);
CREATE INDEX idx_checkout_transactions_retry ON checkout_transactions(event_published, status)
    WHERE event_published = FALSE AND status = 'COMPLETED';
```

**Status flow:**
```
INITIATED → PAYMENT_PROCESSING → COMPLETED → (event published)
                ↓
              FAILED (payment failure)

COMPLETED + event_published=false → RETRY_PENDING (background job picks up)
```

### Order-Service Event Consumer

**Location:** `apps/order-service/src/main/java/org/example/order/consumer/`

```
consumer/
├── OrderEventConsumer.java      # Polls Redis Streams, similar to AuditEventConsumer
├── OrderEventHandler.java       # Deserializes CloudEvent, persists Order
└── OrderDeadLetterHandler.java  # Handles permanent failures
```

**Consumer behavior (mirrors audit-service pattern):**
1. **Startup**: Create consumer group `order-service-group` on stream `orders:completed`
2. **Poll loop**: Read events with `XREADGROUP`, configurable batch size
3. **Process**: Deserialize CloudEvent → Extract `Order` from data → Persist to DB
4. **Acknowledge**: `XACK` after successful persistence
5. **Retry**: Transient failures (DB timeouts) retry with exponential backoff
6. **Dead letter**: Permanent failures logged to `orders:completed:dlq` stream
7. **Idempotency**: Check if `order_id` exists before inserting (handles redelivery)

**Configuration:**
```yaml
order:
  consumer:
    stream-key: orders:completed
    consumer-group: order-service-group
    consumer-name: ${HOSTNAME:order-service-1}
    batch-size: 10
    poll-interval: 100ms
    max-retries: 3
    retry-delay: 1s
```

## Checkout Service Changes

### Files to Remove
- `repository/OrderEntity.java`
- `repository/OrderEntityRepository.java`
- `repository/OrderRepository.java`
- `repository/PostgresOrderRepository.java`
- `dto/OrderResponse.java` (move to shared-model or keep as API response wrapper)
- Order-related endpoints in `CheckoutController.java` (`GET /orders/*`)

### Files to Add
- `repository/CheckoutTransactionEntity.java`
- `repository/CheckoutTransactionRepository.java`
- `event/OrderCompletedEventPublisher.java`
- `scheduler/EventRetryScheduler.java` (background job for failed publishes)
- `config/RedisSessionConfig.java` (checkout sessions in Redis)

### Files to Modify
- `CheckoutService.java`:
  - Replace `orderRepository.save()` with event publishing
  - Store checkout session in Redis instead of `ConcurrentHashMap`
  - Create transaction log entry on initiate/complete
- `CheckoutController.java`:
  - Remove `GET /orders/{id}` and `GET /orders`
  - Keep `POST /checkout/initiate` and `POST /checkout/complete`

## Migration Approach

1. Create `shared-model-order` with models from checkout-service
2. Create `platform-events` library with CloudEvents support
3. Update checkout-service to use shared models
4. Update order-service to use shared models
5. Add event consumer to order-service
6. Add transaction log and event publishing to checkout-service
7. Remove order persistence from checkout-service
8. Remove order read APIs from checkout-service
9. Update frontend clients to query order-service for orders
10. Delete duplicate model classes from both services

## References

- [CloudEvents Specification](https://cloudevents.io/)
- [CloudEvents Java SDK](https://github.com/cloudevents/sdk-java)
- Existing pattern: `platform-audit` / `audit-service` for Redis Streams consumer
