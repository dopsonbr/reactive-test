# 055C: Checkout Service Changes

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform checkout-service from direct order storage to event-driven orchestration

**Architecture:** Redis sessions, transaction log, CloudEvents publishing, remove order persistence

**Tech Stack:** Spring WebFlux, Redis, R2DBC PostgreSQL, platform-events

**Prerequisites:** Complete 055A (shared-model-order) and 055B (platform-events) first

---

## Task 1: Add Dependencies

**Files:**
- Modify: `apps/checkout-service/build.gradle.kts`

**Step 1: Update dependencies**

In `apps/checkout-service/build.gradle.kts`, add new dependencies:

```kotlin
plugins {
    id("platform.application-conventions")
}

dependencies {
    // Platform BOM for version management
    implementation(platform(project(":libs:backend:platform:platform-bom")))

    // Shared model libraries
    implementation(project(":libs:backend:shared-model:shared-model-product"))
    implementation(project(":libs:backend:shared-model:shared-model-customer"))
    implementation(project(":libs:backend:shared-model:shared-model-discount"))
    implementation(project(":libs:backend:shared-model:shared-model-fulfillment"))
    implementation(project(":libs:backend:shared-model:shared-model-order"))  // NEW

    // Platform libraries
    implementation(project(":libs:backend:platform:platform-logging"))
    implementation(project(":libs:backend:platform:platform-resilience"))
    implementation(project(":libs:backend:platform:platform-cache"))
    implementation(project(":libs:backend:platform:platform-error"))
    implementation(project(":libs:backend:platform:platform-webflux"))
    implementation(project(":libs:backend:platform:platform-security"))
    implementation(project(":libs:backend:platform:platform-events"))  // NEW

    // Spring Boot starters (versions from BOM)
    implementation("org.springframework.boot:spring-boot-starter-webflux")
    implementation("org.springframework.boot:spring-boot-starter-webclient")
    implementation("org.springframework.boot:spring-boot-starter-actuator")
    implementation("org.springframework.boot:spring-boot-starter-data-r2dbc")
    implementation("org.springframework.boot:spring-boot-starter-data-redis-reactive")  // NEW

    // R2DBC PostgreSQL driver
    implementation("org.postgresql:r2dbc-postgresql")

    // Flyway for database migrations
    implementation("org.springframework.boot:spring-boot-starter-flyway")
    implementation("org.flywaydb:flyway-database-postgresql")
    implementation("org.springframework.boot:spring-boot-starter-jdbc")
    runtimeOnly("org.postgresql:postgresql")

    // Prometheus metrics
    runtimeOnly("io.micrometer:micrometer-registry-prometheus")

    // Test dependencies
    testImplementation(project(":libs:backend:platform:platform-test"))
    testImplementation("org.testcontainers:postgresql")
    testImplementation("org.testcontainers:r2dbc")
    testImplementation("org.springframework.security:spring-security-test")
    testImplementation("org.springframework.boot:spring-boot-starter-jdbc")
    testImplementation("io.r2dbc:r2dbc-h2")
}
```

**Step 2: Verify build**

Run: `./gradlew :apps:checkout-service:compileJava`

Expected: BUILD SUCCESSFUL

**Step 3: Commit**

```bash
git add apps/checkout-service/build.gradle.kts
git commit -m "feat(checkout-service): add shared-model-order and platform-events dependencies"
```

---

## Task 2: Create Checkout Transaction Schema

**Files:**
- Create: `apps/checkout-service/src/main/resources/db/migration/V2__create_checkout_transactions_table.sql`

**Step 1: Create migration**

Create file `apps/checkout-service/src/main/resources/db/migration/V2__create_checkout_transactions_table.sql`:

```sql
-- Checkout transaction log for reporting and retry tracking
CREATE TABLE checkout_transactions (
    id                      UUID PRIMARY KEY,
    checkout_session_id     VARCHAR(64) NOT NULL UNIQUE,
    cart_id                 VARCHAR(64) NOT NULL,
    store_number            INTEGER NOT NULL,
    order_id                UUID,

    -- Status tracking
    status                  VARCHAR(32) NOT NULL,
    failure_reason          TEXT,

    -- Totals (for reporting without needing order-service)
    grand_total             DECIMAL(12,2) NOT NULL,
    item_count              INTEGER NOT NULL,

    -- Payment info
    payment_method          VARCHAR(32),
    payment_reference       VARCHAR(128),

    -- Event publishing tracking
    event_published         BOOLEAN DEFAULT FALSE,
    event_publish_attempts  INTEGER DEFAULT 0,
    last_publish_attempt    TIMESTAMPTZ,

    -- Timestamps
    initiated_at            TIMESTAMPTZ NOT NULL,
    completed_at            TIMESTAMPTZ,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_checkout_transactions_store ON checkout_transactions(store_number);
CREATE INDEX idx_checkout_transactions_status ON checkout_transactions(status);
CREATE INDEX idx_checkout_transactions_retry ON checkout_transactions(event_published, status)
    WHERE event_published = FALSE AND status = 'COMPLETED';
CREATE INDEX idx_checkout_transactions_session ON checkout_transactions(checkout_session_id);
```

**Step 2: Verify migration syntax**

Run: `./gradlew :apps:checkout-service:flywayValidate` (if available) or just build

**Step 3: Commit**

```bash
git add apps/checkout-service/src/main/resources/db/migration/V2__create_checkout_transactions_table.sql
git commit -m "feat(checkout-service): add checkout_transactions migration"
```

---

## Task 3: Create CheckoutTransactionStatus Enum

**Files:**
- Create: `apps/checkout-service/src/main/java/org/example/checkout/model/CheckoutTransactionStatus.java`
- Test: `apps/checkout-service/src/test/java/org/example/checkout/model/CheckoutTransactionStatusTest.java`

**Step 1: Write the failing test**

Create file `apps/checkout-service/src/test/java/org/example/checkout/model/CheckoutTransactionStatusTest.java`:

```java
package org.example.checkout.model;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class CheckoutTransactionStatusTest {

  @Test
  void shouldHaveExpectedStatuses() {
    assertThat(CheckoutTransactionStatus.values())
        .containsExactlyInAnyOrder(
            CheckoutTransactionStatus.INITIATED,
            CheckoutTransactionStatus.PAYMENT_PROCESSING,
            CheckoutTransactionStatus.COMPLETED,
            CheckoutTransactionStatus.FAILED,
            CheckoutTransactionStatus.RETRY_PENDING);
  }

  @Test
  void shouldIdentifyTerminalStatuses() {
    assertThat(CheckoutTransactionStatus.COMPLETED.isTerminal()).isTrue();
    assertThat(CheckoutTransactionStatus.FAILED.isTerminal()).isTrue();
    assertThat(CheckoutTransactionStatus.INITIATED.isTerminal()).isFalse();
    assertThat(CheckoutTransactionStatus.PAYMENT_PROCESSING.isTerminal()).isFalse();
    assertThat(CheckoutTransactionStatus.RETRY_PENDING.isTerminal()).isFalse();
  }
}
```

**Step 2: Run test to verify it fails**

Run: `./gradlew :apps:checkout-service:test --tests CheckoutTransactionStatusTest`

Expected: FAIL

**Step 3: Write minimal implementation**

Create file `apps/checkout-service/src/main/java/org/example/checkout/model/CheckoutTransactionStatus.java`:

```java
package org.example.checkout.model;

/** Status of a checkout transaction. */
public enum CheckoutTransactionStatus {
  INITIATED,
  PAYMENT_PROCESSING,
  COMPLETED,
  FAILED,
  RETRY_PENDING;

  public boolean isTerminal() {
    return this == COMPLETED || this == FAILED;
  }
}
```

**Step 4: Run test to verify it passes**

Run: `./gradlew :apps:checkout-service:test --tests CheckoutTransactionStatusTest`

Expected: PASS

**Step 5: Commit**

```bash
git add apps/checkout-service/src/
git commit -m "feat(checkout-service): add CheckoutTransactionStatus enum"
```

---

## Task 4: Create CheckoutTransactionEntity

**Files:**
- Create: `apps/checkout-service/src/main/java/org/example/checkout/repository/CheckoutTransactionEntity.java`
- Test: `apps/checkout-service/src/test/java/org/example/checkout/repository/CheckoutTransactionEntityTest.java`

**Step 1: Write the failing test**

Create file `apps/checkout-service/src/test/java/org/example/checkout/repository/CheckoutTransactionEntityTest.java`:

```java
package org.example.checkout.repository;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import org.example.checkout.model.CheckoutTransactionStatus;
import org.junit.jupiter.api.Test;

class CheckoutTransactionEntityTest {

  @Test
  void shouldCreateEntity() {
    UUID id = UUID.randomUUID();
    Instant now = Instant.now();

    CheckoutTransactionEntity entity = new CheckoutTransactionEntity();
    entity.setId(id);
    entity.setCheckoutSessionId("session-123");
    entity.setCartId("cart-456");
    entity.setStoreNumber(100);
    entity.setStatus(CheckoutTransactionStatus.INITIATED);
    entity.setGrandTotal(new BigDecimal("99.99"));
    entity.setItemCount(3);
    entity.setInitiatedAt(now);

    assertThat(entity.getId()).isEqualTo(id);
    assertThat(entity.getCheckoutSessionId()).isEqualTo("session-123");
    assertThat(entity.getStatus()).isEqualTo(CheckoutTransactionStatus.INITIATED);
    assertThat(entity.getGrandTotal()).isEqualByComparingTo(new BigDecimal("99.99"));
  }

  @Test
  void shouldTrackEventPublishing() {
    CheckoutTransactionEntity entity = new CheckoutTransactionEntity();
    entity.setEventPublished(false);
    entity.setEventPublishAttempts(0);

    entity.incrementPublishAttempts();

    assertThat(entity.getEventPublishAttempts()).isEqualTo(1);
    assertThat(entity.getLastPublishAttempt()).isNotNull();
  }
}
```

**Step 2: Run test to verify it fails**

Run: `./gradlew :apps:checkout-service:test --tests CheckoutTransactionEntityTest`

Expected: FAIL

**Step 3: Write minimal implementation**

Create file `apps/checkout-service/src/main/java/org/example/checkout/repository/CheckoutTransactionEntity.java`:

```java
package org.example.checkout.repository;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import org.example.checkout.model.CheckoutTransactionStatus;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

/** Entity for checkout transaction log. */
@Table("checkout_transactions")
public class CheckoutTransactionEntity {

  @Id private UUID id;

  @Column("checkout_session_id")
  private String checkoutSessionId;

  @Column("cart_id")
  private String cartId;

  @Column("store_number")
  private int storeNumber;

  @Column("order_id")
  private UUID orderId;

  @Column("status")
  private CheckoutTransactionStatus status;

  @Column("failure_reason")
  private String failureReason;

  @Column("grand_total")
  private BigDecimal grandTotal;

  @Column("item_count")
  private int itemCount;

  @Column("payment_method")
  private String paymentMethod;

  @Column("payment_reference")
  private String paymentReference;

  @Column("event_published")
  private boolean eventPublished;

  @Column("event_publish_attempts")
  private int eventPublishAttempts;

  @Column("last_publish_attempt")
  private Instant lastPublishAttempt;

  @Column("initiated_at")
  private Instant initiatedAt;

  @Column("completed_at")
  private Instant completedAt;

  @Column("created_at")
  private Instant createdAt;

  @Column("updated_at")
  private Instant updatedAt;

  // Getters and setters
  public UUID getId() {
    return id;
  }

  public void setId(UUID id) {
    this.id = id;
  }

  public String getCheckoutSessionId() {
    return checkoutSessionId;
  }

  public void setCheckoutSessionId(String checkoutSessionId) {
    this.checkoutSessionId = checkoutSessionId;
  }

  public String getCartId() {
    return cartId;
  }

  public void setCartId(String cartId) {
    this.cartId = cartId;
  }

  public int getStoreNumber() {
    return storeNumber;
  }

  public void setStoreNumber(int storeNumber) {
    this.storeNumber = storeNumber;
  }

  public UUID getOrderId() {
    return orderId;
  }

  public void setOrderId(UUID orderId) {
    this.orderId = orderId;
  }

  public CheckoutTransactionStatus getStatus() {
    return status;
  }

  public void setStatus(CheckoutTransactionStatus status) {
    this.status = status;
  }

  public String getFailureReason() {
    return failureReason;
  }

  public void setFailureReason(String failureReason) {
    this.failureReason = failureReason;
  }

  public BigDecimal getGrandTotal() {
    return grandTotal;
  }

  public void setGrandTotal(BigDecimal grandTotal) {
    this.grandTotal = grandTotal;
  }

  public int getItemCount() {
    return itemCount;
  }

  public void setItemCount(int itemCount) {
    this.itemCount = itemCount;
  }

  public String getPaymentMethod() {
    return paymentMethod;
  }

  public void setPaymentMethod(String paymentMethod) {
    this.paymentMethod = paymentMethod;
  }

  public String getPaymentReference() {
    return paymentReference;
  }

  public void setPaymentReference(String paymentReference) {
    this.paymentReference = paymentReference;
  }

  public boolean isEventPublished() {
    return eventPublished;
  }

  public void setEventPublished(boolean eventPublished) {
    this.eventPublished = eventPublished;
  }

  public int getEventPublishAttempts() {
    return eventPublishAttempts;
  }

  public void setEventPublishAttempts(int eventPublishAttempts) {
    this.eventPublishAttempts = eventPublishAttempts;
  }

  public Instant getLastPublishAttempt() {
    return lastPublishAttempt;
  }

  public void setLastPublishAttempt(Instant lastPublishAttempt) {
    this.lastPublishAttempt = lastPublishAttempt;
  }

  public Instant getInitiatedAt() {
    return initiatedAt;
  }

  public void setInitiatedAt(Instant initiatedAt) {
    this.initiatedAt = initiatedAt;
  }

  public Instant getCompletedAt() {
    return completedAt;
  }

  public void setCompletedAt(Instant completedAt) {
    this.completedAt = completedAt;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(Instant createdAt) {
    this.createdAt = createdAt;
  }

  public Instant getUpdatedAt() {
    return updatedAt;
  }

  public void setUpdatedAt(Instant updatedAt) {
    this.updatedAt = updatedAt;
  }

  public void incrementPublishAttempts() {
    this.eventPublishAttempts++;
    this.lastPublishAttempt = Instant.now();
  }
}
```

**Step 4: Run test to verify it passes**

Run: `./gradlew :apps:checkout-service:test --tests CheckoutTransactionEntityTest`

Expected: PASS

**Step 5: Commit**

```bash
git add apps/checkout-service/src/
git commit -m "feat(checkout-service): add CheckoutTransactionEntity"
```

---

## Task 5: Create CheckoutTransactionRepository

**Files:**
- Create: `apps/checkout-service/src/main/java/org/example/checkout/repository/CheckoutTransactionRepository.java`

**Step 1: Create repository interface**

Create file `apps/checkout-service/src/main/java/org/example/checkout/repository/CheckoutTransactionRepository.java`:

```java
package org.example.checkout.repository;

import java.util.UUID;
import org.example.checkout.model.CheckoutTransactionStatus;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/** Repository for checkout transaction log. */
public interface CheckoutTransactionRepository
    extends ReactiveCrudRepository<CheckoutTransactionEntity, UUID> {

  Mono<CheckoutTransactionEntity> findByCheckoutSessionId(String checkoutSessionId);

  Flux<CheckoutTransactionEntity> findByStoreNumber(int storeNumber);

  Flux<CheckoutTransactionEntity> findByStatus(CheckoutTransactionStatus status);

  @Query(
      "SELECT * FROM checkout_transactions "
          + "WHERE event_published = false AND status = 'COMPLETED' "
          + "ORDER BY completed_at ASC LIMIT :limit")
  Flux<CheckoutTransactionEntity> findPendingEventPublish(int limit);
}
```

**Step 2: Commit**

```bash
git add apps/checkout-service/src/main/java/org/example/checkout/repository/CheckoutTransactionRepository.java
git commit -m "feat(checkout-service): add CheckoutTransactionRepository"
```

---

## Task 6: Create OrderCompletedEventPublisher

**Files:**
- Create: `apps/checkout-service/src/main/java/org/example/checkout/event/OrderCompletedEventPublisher.java`
- Create: `apps/checkout-service/src/main/java/org/example/checkout/event/CheckoutEventProperties.java`
- Test: `apps/checkout-service/src/test/java/org/example/checkout/event/OrderCompletedEventPublisherTest.java`

**Step 1: Create properties class**

Create file `apps/checkout-service/src/main/java/org/example/checkout/event/CheckoutEventProperties.java`:

```java
package org.example.checkout.event;

import org.example.platform.events.EventStreamProperties;
import org.springframework.boot.context.properties.ConfigurationProperties;

/** Configuration for checkout event publishing. */
@ConfigurationProperties(prefix = "checkout.events")
public class CheckoutEventProperties extends EventStreamProperties {

  private String source = "urn:reactive-platform:checkout-service";
  private String orderCompletedType = "org.example.checkout.OrderCompleted";

  public CheckoutEventProperties() {
    setStreamKey("orders:completed");
  }

  public String getSource() {
    return source;
  }

  public void setSource(String source) {
    this.source = source;
  }

  public String getOrderCompletedType() {
    return orderCompletedType;
  }

  public void setOrderCompletedType(String orderCompletedType) {
    this.orderCompletedType = orderCompletedType;
  }
}
```

**Step 2: Write the failing test**

Create file `apps/checkout-service/src/test/java/org/example/checkout/event/OrderCompletedEventPublisherTest.java`:

```java
package org.example.checkout.event;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import io.cloudevents.CloudEvent;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.example.model.order.Order;
import org.example.model.order.OrderStatus;
import org.example.model.order.PaymentStatus;
import org.example.platform.events.CloudEventPublisher;
import org.example.platform.events.CloudEventSerializer;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

class OrderCompletedEventPublisherTest {

  private CloudEventPublisher cloudEventPublisher;
  private OrderCompletedEventPublisher publisher;

  @BeforeEach
  void setUp() {
    cloudEventPublisher = mock(CloudEventPublisher.class);
    ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());
    CloudEventSerializer serializer = new CloudEventSerializer(objectMapper);
    CheckoutEventProperties properties = new CheckoutEventProperties();

    publisher = new OrderCompletedEventPublisher(cloudEventPublisher, serializer, properties);
  }

  @Test
  void shouldPublishOrderCompletedEvent() {
    Order order = Order.builder()
        .id(UUID.randomUUID())
        .storeNumber(100)
        .orderNumber("ORD-001")
        .grandTotal(new BigDecimal("99.99"))
        .status(OrderStatus.PAID)
        .paymentStatus(PaymentStatus.COMPLETED)
        .lineItems(List.of())
        .appliedDiscounts(List.of())
        .createdAt(Instant.now())
        .build();

    when(cloudEventPublisher.publishAndAwait(any(CloudEvent.class)))
        .thenReturn(Mono.just("record-123"));

    StepVerifier.create(publisher.publishOrderCompleted(order, "session-456"))
        .expectNext("record-123")
        .verifyComplete();

    ArgumentCaptor<CloudEvent> eventCaptor = ArgumentCaptor.forClass(CloudEvent.class);
    verify(cloudEventPublisher).publishAndAwait(eventCaptor.capture());

    CloudEvent event = eventCaptor.getValue();
    assertThat(event.getType()).isEqualTo("org.example.checkout.OrderCompleted");
    assertThat(event.getSource().toString()).isEqualTo("urn:reactive-platform:checkout-service");
    assertThat(event.getSubject()).isEqualTo(order.id().toString());
  }
}
```

**Step 3: Run test to verify it fails**

Run: `./gradlew :apps:checkout-service:test --tests OrderCompletedEventPublisherTest`

Expected: FAIL

**Step 4: Write minimal implementation**

Create file `apps/checkout-service/src/main/java/org/example/checkout/event/OrderCompletedEventPublisher.java`:

```java
package org.example.checkout.event;

import io.cloudevents.CloudEvent;
import java.net.URI;
import org.example.model.order.Order;
import org.example.platform.events.CloudEventPublisher;
import org.example.platform.events.CloudEventSerializer;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

/** Publishes OrderCompleted events to Redis Streams. */
@Component
public class OrderCompletedEventPublisher {

  private final CloudEventPublisher cloudEventPublisher;
  private final CloudEventSerializer serializer;
  private final CheckoutEventProperties properties;

  public OrderCompletedEventPublisher(
      CloudEventPublisher cloudEventPublisher,
      CloudEventSerializer serializer,
      CheckoutEventProperties properties) {
    this.cloudEventPublisher = cloudEventPublisher;
    this.serializer = serializer;
    this.properties = properties;
  }

  /**
   * Publish an OrderCompleted event.
   *
   * @param order the completed order
   * @param checkoutSessionId the checkout session ID
   * @return Mono with the record ID
   */
  public Mono<String> publishOrderCompleted(Order order, String checkoutSessionId) {
    OrderCompletedEventData data = new OrderCompletedEventData(checkoutSessionId, order);

    CloudEvent event =
        serializer.buildEvent(
            properties.getOrderCompletedType(),
            URI.create(properties.getSource()),
            order.id().toString(),
            data);

    return cloudEventPublisher.publishAndAwait(event);
  }

  /** Event data for OrderCompleted. */
  public record OrderCompletedEventData(String checkoutSessionId, Order order) {}
}
```

**Step 5: Run test to verify it passes**

Run: `./gradlew :apps:checkout-service:test --tests OrderCompletedEventPublisherTest`

Expected: PASS

**Step 6: Commit**

```bash
git add apps/checkout-service/src/
git commit -m "feat(checkout-service): add OrderCompletedEventPublisher"
```

---

## Task 7: Update Imports to Use Shared Models

**Files:**
- Modify: `apps/checkout-service/src/main/java/org/example/checkout/service/CheckoutService.java`
- Modify: `apps/checkout-service/src/main/java/org/example/checkout/dto/CheckoutSummaryResponse.java`

**Step 1: Update CheckoutService imports**

In `apps/checkout-service/src/main/java/org/example/checkout/service/CheckoutService.java`:

Replace these imports:
```java
import org.example.checkout.model.AppliedDiscount;
import org.example.checkout.model.CustomerSnapshot;
import org.example.checkout.model.FulfillmentDetails;
import org.example.checkout.model.FulfillmentType;
import org.example.checkout.model.Order;
import org.example.checkout.model.OrderLineItem;
import org.example.checkout.model.OrderStatus;
import org.example.checkout.model.PaymentStatus;
```

With:
```java
import org.example.model.order.AppliedDiscount;
import org.example.model.order.CustomerSnapshot;
import org.example.model.order.FulfillmentDetails;
import org.example.model.order.FulfillmentType;
import org.example.model.order.Order;
import org.example.model.order.OrderLineItem;
import org.example.model.order.OrderStatus;
import org.example.model.order.PaymentStatus;
```

**Step 2: Update CheckoutSummaryResponse**

Similarly update `CheckoutSummaryResponse.java` to use shared model imports.

**Step 3: Verify compilation**

Run: `./gradlew :apps:checkout-service:compileJava`

Expected: BUILD SUCCESSFUL (may have some errors to fix - address them)

**Step 4: Commit**

```bash
git add apps/checkout-service/src/
git commit -m "refactor(checkout-service): use shared-model-order imports"
```

---

## Task 8: Remove Order Repository and Related Files

**Files:**
- Delete: `apps/checkout-service/src/main/java/org/example/checkout/repository/OrderEntity.java`
- Delete: `apps/checkout-service/src/main/java/org/example/checkout/repository/OrderEntityRepository.java`
- Delete: `apps/checkout-service/src/main/java/org/example/checkout/repository/OrderRepository.java`
- Delete: `apps/checkout-service/src/main/java/org/example/checkout/repository/PostgresOrderRepository.java`
- Delete: `apps/checkout-service/src/main/java/org/example/checkout/model/` (old model classes)

**Step 1: Delete order repository files**

```bash
rm apps/checkout-service/src/main/java/org/example/checkout/repository/OrderEntity.java
rm apps/checkout-service/src/main/java/org/example/checkout/repository/OrderEntityRepository.java
rm apps/checkout-service/src/main/java/org/example/checkout/repository/OrderRepository.java
rm apps/checkout-service/src/main/java/org/example/checkout/repository/PostgresOrderRepository.java
```

**Step 2: Delete old model classes (keep CheckoutTransactionStatus)**

```bash
rm apps/checkout-service/src/main/java/org/example/checkout/model/Order.java
rm apps/checkout-service/src/main/java/org/example/checkout/model/OrderLineItem.java
rm apps/checkout-service/src/main/java/org/example/checkout/model/OrderStatus.java
rm apps/checkout-service/src/main/java/org/example/checkout/model/PaymentStatus.java
rm apps/checkout-service/src/main/java/org/example/checkout/model/AppliedDiscount.java
rm apps/checkout-service/src/main/java/org/example/checkout/model/CustomerSnapshot.java
rm apps/checkout-service/src/main/java/org/example/checkout/model/FulfillmentDetails.java
rm apps/checkout-service/src/main/java/org/example/checkout/model/FulfillmentType.java
rm apps/checkout-service/src/main/java/org/example/checkout/model/DeliveryAddress.java
```

**Step 3: Verify compilation fails (expected)**

Run: `./gradlew :apps:checkout-service:compileJava`

Expected: FAIL (CheckoutService still references OrderRepository)

**Step 4: Commit deletions**

```bash
git add -u apps/checkout-service/
git commit -m "refactor(checkout-service): remove order repository and old models"
```

---

## Task 9: Update CheckoutService for Event Publishing

**Files:**
- Modify: `apps/checkout-service/src/main/java/org/example/checkout/service/CheckoutService.java`

This is a significant refactor. The key changes:
1. Remove `OrderRepository` dependency
2. Add `CheckoutTransactionRepository` and `OrderCompletedEventPublisher`
3. Replace `orderRepository.save()` with event publishing
4. Add transaction log entries

**Step 1: Update CheckoutService**

Update `apps/checkout-service/src/main/java/org/example/checkout/service/CheckoutService.java`:

See the full updated implementation in the design document. Key changes:

```java
// Remove this dependency
// private final OrderRepository orderRepository;

// Add these dependencies
private final CheckoutTransactionRepository transactionRepository;
private final OrderCompletedEventPublisher eventPublisher;

// In completeCheckout method, replace:
// return orderRepository.save(order);

// With:
return publishOrderCompletedEvent(order, session.sessionId())
    .thenReturn(order);

// Add new method:
private Mono<Void> publishOrderCompletedEvent(Order order, String sessionId) {
    return eventPublisher.publishOrderCompleted(order, sessionId)
        .flatMap(recordId -> updateTransactionEventPublished(sessionId))
        .then();
}
```

**Step 2: Add transaction log creation in initiateCheckout**

Add transaction log entry when checkout is initiated.

**Step 3: Verify compilation**

Run: `./gradlew :apps:checkout-service:compileJava`

Expected: BUILD SUCCESSFUL

**Step 4: Run existing tests**

Run: `./gradlew :apps:checkout-service:test`

Expected: Some tests may fail (need updates)

**Step 5: Commit**

```bash
git add apps/checkout-service/src/
git commit -m "refactor(checkout-service): replace order storage with event publishing"
```

---

## Task 10: Remove Order APIs from Controller

**Files:**
- Modify: `apps/checkout-service/src/main/java/org/example/checkout/controller/CheckoutController.java`

**Step 1: Remove order endpoints**

Remove these methods from `CheckoutController.java`:
- `getOrder()`
- `listOrders()`

Keep:
- `initiateCheckout()`
- `completeCheckout()`

**Step 2: Remove unused imports and validator methods**

**Step 3: Verify compilation**

Run: `./gradlew :apps:checkout-service:compileJava`

Expected: BUILD SUCCESSFUL

**Step 4: Commit**

```bash
git add apps/checkout-service/src/
git commit -m "refactor(checkout-service): remove order query endpoints"
```

---

## Task 11: Update Configuration

**Files:**
- Modify: `apps/checkout-service/src/main/resources/application.yml`

**Step 1: Add Redis and event configuration**

Add to `application.yml`:

```yaml
spring:
  data:
    redis:
      host: ${REDIS_HOST:localhost}
      port: ${REDIS_PORT:6379}

checkout:
  events:
    stream-key: orders:completed
    source: urn:reactive-platform:checkout-service
    order-completed-type: org.example.checkout.OrderCompleted
    publish-timeout: 5s
```

**Step 2: Commit**

```bash
git add apps/checkout-service/src/main/resources/
git commit -m "feat(checkout-service): add Redis and event configuration"
```

---

## Task 12: Update Tests

**Files:**
- Modify: `apps/checkout-service/src/test/java/org/example/checkout/service/CheckoutServiceTest.java`
- Delete: `apps/checkout-service/src/test/java/org/example/checkout/repository/PostgresOrderRepositoryTest.java`

**Step 1: Delete obsolete test**

```bash
rm apps/checkout-service/src/test/java/org/example/checkout/repository/PostgresOrderRepositoryTest.java
```

**Step 2: Update CheckoutServiceTest**

Update to mock `OrderCompletedEventPublisher` instead of `OrderRepository`.

**Step 3: Run tests**

Run: `./gradlew :apps:checkout-service:test`

Expected: All tests PASS

**Step 4: Commit**

```bash
git add apps/checkout-service/src/test/
git commit -m "test(checkout-service): update tests for event-based architecture"
```

---

## Task 13: Run Full Test Suite

**Step 1: Run all checkout-service tests**

Run: `./gradlew :apps:checkout-service:test`

Expected: All tests PASS

**Step 2: Run build**

Run: `./gradlew :apps:checkout-service:build`

Expected: BUILD SUCCESSFUL

---

## Completion Checklist

- [ ] Dependencies added (shared-model-order, platform-events, Redis)
- [ ] Checkout transaction schema created
- [ ] CheckoutTransactionEntity implemented
- [ ] CheckoutTransactionRepository implemented
- [ ] OrderCompletedEventPublisher implemented
- [ ] Imports updated to use shared models
- [ ] Old order repository/models deleted
- [ ] CheckoutService refactored for event publishing
- [ ] Order query endpoints removed
- [ ] Configuration updated
- [ ] Tests updated and passing
- [ ] Build successful
