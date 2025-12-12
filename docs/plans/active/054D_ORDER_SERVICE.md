# 054D: Order Service Changes

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add event consumer to order-service to receive and persist orders from checkout-service

**Architecture:** Redis Streams consumer using platform-events, persists orders to database

**Tech Stack:** Spring WebFlux, Redis Streams, R2DBC PostgreSQL, platform-events

**Prerequisites:** Complete 054A (shared-model-order) and 054B (platform-events) first

---

## Task 1: Add Dependencies

**Files:**
- Modify: `apps/order-service/build.gradle.kts`

**Step 1: Update dependencies**

In `apps/order-service/build.gradle.kts`, add new dependencies:

```kotlin
// Add to dependencies block:
implementation(project(":libs:backend:shared-model:shared-model-order"))
implementation(project(":libs:backend:platform:platform-events"))
implementation("org.springframework.boot:spring-boot-starter-data-redis-reactive")
```

**Step 2: Verify build**

Run: `./gradlew :apps:order-service:compileJava`

Expected: BUILD SUCCESSFUL

**Step 3: Commit**

```bash
git add apps/order-service/build.gradle.kts
git commit -m "feat(order-service): add shared-model-order and platform-events dependencies"
```

---

## Task 2: Create OrderEventProperties

**Files:**
- Create: `apps/order-service/src/main/java/org/example/order/consumer/OrderEventProperties.java`

**Step 1: Create properties class**

Create file `apps/order-service/src/main/java/org/example/order/consumer/OrderEventProperties.java`:

```java
package org.example.order.consumer;

import org.example.platform.events.EventStreamProperties;
import org.springframework.boot.context.properties.ConfigurationProperties;

/** Configuration for order event consumption. */
@ConfigurationProperties(prefix = "order.consumer")
public class OrderEventProperties extends EventStreamProperties {

  public OrderEventProperties() {
    setStreamKey("orders:completed");
    setConsumerGroup("order-service-group");
  }
}
```

**Step 2: Commit**

```bash
git add apps/order-service/src/main/java/org/example/order/consumer/OrderEventProperties.java
git commit -m "feat(order-service): add OrderEventProperties"
```

---

## Task 3: Create OrderEventHandler

**Files:**
- Create: `apps/order-service/src/main/java/org/example/order/consumer/OrderEventHandler.java`
- Test: `apps/order-service/src/test/java/org/example/order/consumer/OrderEventHandlerTest.java`

**Step 1: Write the failing test**

Create file `apps/order-service/src/test/java/org/example/order/consumer/OrderEventHandlerTest.java`:

```java
package org.example.order.consumer;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.example.model.order.Order;
import org.example.model.order.OrderStatus;
import org.example.model.order.PaymentStatus;
import org.example.order.repository.OrderRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

class OrderEventHandlerTest {

  private OrderRepository orderRepository;
  private OrderEventHandler handler;

  @BeforeEach
  void setUp() {
    orderRepository = mock(OrderRepository.class);
    handler = new OrderEventHandler(orderRepository);
  }

  @Test
  void shouldSaveOrderFromEvent() {
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

    when(orderRepository.save(any(Order.class))).thenReturn(Mono.just(order));

    StepVerifier.create(handler.handleOrderCompleted("session-123", order))
        .verifyComplete();

    ArgumentCaptor<Order> orderCaptor = ArgumentCaptor.forClass(Order.class);
    verify(orderRepository).save(orderCaptor.capture());
    assertThat(orderCaptor.getValue().orderNumber()).isEqualTo("ORD-001");
  }

  @Test
  void shouldHandleDuplicateOrder() {
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

    // Simulate duplicate key error
    when(orderRepository.existsById(order.id())).thenReturn(Mono.just(true));
    when(orderRepository.save(any(Order.class))).thenReturn(Mono.just(order));

    // Should complete without error (idempotent)
    StepVerifier.create(handler.handleOrderCompleted("session-123", order))
        .verifyComplete();
  }
}
```

**Step 2: Run test to verify it fails**

Run: `./gradlew :apps:order-service:test --tests OrderEventHandlerTest`

Expected: FAIL

**Step 3: Write minimal implementation**

Create file `apps/order-service/src/main/java/org/example/order/consumer/OrderEventHandler.java`:

```java
package org.example.order.consumer;

import org.example.model.order.Order;
import org.example.order.repository.OrderRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

/** Handles OrderCompleted events by persisting orders. */
@Component
public class OrderEventHandler {

  private static final Logger log = LoggerFactory.getLogger(OrderEventHandler.class);

  private final OrderRepository orderRepository;

  public OrderEventHandler(OrderRepository orderRepository) {
    this.orderRepository = orderRepository;
  }

  /**
   * Handle an OrderCompleted event.
   *
   * @param checkoutSessionId the checkout session ID
   * @param order the order to persist
   * @return Mono completing when order is saved
   */
  public Mono<Void> handleOrderCompleted(String checkoutSessionId, Order order) {
    return orderRepository
        .existsById(order.id())
        .flatMap(
            exists -> {
              if (exists) {
                log.info(
                    "Order already exists, skipping: orderId={}, sessionId={}",
                    order.id(),
                    checkoutSessionId);
                return Mono.empty();
              }
              return orderRepository
                  .save(order)
                  .doOnSuccess(
                      saved ->
                          log.info(
                              "Order saved: orderId={}, orderNumber={}, sessionId={}",
                              saved.id(),
                              saved.orderNumber(),
                              checkoutSessionId))
                  .then();
            });
  }
}
```

**Step 4: Run test to verify it passes**

Run: `./gradlew :apps:order-service:test --tests OrderEventHandlerTest`

Expected: PASS

**Step 5: Commit**

```bash
git add apps/order-service/src/
git commit -m "feat(order-service): add OrderEventHandler"
```

---

## Task 4: Create OrderEventConsumer

**Files:**
- Create: `apps/order-service/src/main/java/org/example/order/consumer/OrderEventConsumer.java`
- Test: `apps/order-service/src/test/java/org/example/order/consumer/OrderEventConsumerTest.java`

**Step 1: Write the failing test**

Create file `apps/order-service/src/test/java/org/example/order/consumer/OrderEventConsumerTest.java`:

```java
package org.example.order.consumer;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
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
import org.example.platform.events.CloudEventSerializer;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.data.redis.core.ReactiveStreamOperations;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

class OrderEventConsumerTest {

  private ReactiveRedisTemplate<String, String> redisTemplate;
  private ReactiveStreamOperations<String, Object, Object> streamOps;
  private OrderEventHandler eventHandler;
  private CloudEventSerializer serializer;
  private OrderEventConsumer consumer;

  @BeforeEach
  @SuppressWarnings("unchecked")
  void setUp() {
    redisTemplate = mock(ReactiveRedisTemplate.class);
    streamOps = mock(ReactiveStreamOperations.class);
    when(redisTemplate.opsForStream()).thenReturn(streamOps);

    eventHandler = mock(OrderEventHandler.class);
    ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());
    serializer = new CloudEventSerializer(objectMapper);
    OrderEventProperties properties = new OrderEventProperties();

    consumer = new OrderEventConsumer(redisTemplate, serializer, properties, eventHandler);
  }

  @Test
  void shouldDelegateToHandler() {
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

    when(eventHandler.handleOrderCompleted(anyString(), any(Order.class)))
        .thenReturn(Mono.empty());

    // Create a mock CloudEvent (in real test would use actual event)
    CloudEvent event = serializer.buildEvent(
        "org.example.checkout.OrderCompleted",
        java.net.URI.create("urn:test"),
        order.id().toString(),
        new OrderCompletedData("session-123", order));

    StepVerifier.create(consumer.handleEvent(event))
        .verifyComplete();

    verify(eventHandler).handleOrderCompleted(anyString(), any(Order.class));
  }

  record OrderCompletedData(String checkoutSessionId, Order order) {}
}
```

**Step 2: Run test to verify it fails**

Run: `./gradlew :apps:order-service:test --tests OrderEventConsumerTest`

Expected: FAIL

**Step 3: Write minimal implementation**

Create file `apps/order-service/src/main/java/org/example/order/consumer/OrderEventConsumer.java`:

```java
package org.example.order.consumer;

import io.cloudevents.CloudEvent;
import jakarta.annotation.PostConstruct;
import org.example.model.order.Order;
import org.example.platform.events.CloudEventSerializer;
import org.example.platform.events.EventConsumer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

/** Consumes OrderCompleted events from Redis Streams. */
@Component
@EnableConfigurationProperties(OrderEventProperties.class)
public class OrderEventConsumer extends EventConsumer {

  private static final Logger log = LoggerFactory.getLogger(OrderEventConsumer.class);

  private final CloudEventSerializer serializer;
  private final OrderEventHandler eventHandler;

  public OrderEventConsumer(
      ReactiveRedisTemplate<String, String> redisTemplate,
      CloudEventSerializer serializer,
      OrderEventProperties properties,
      OrderEventHandler eventHandler) {
    super(redisTemplate, serializer, properties);
    this.serializer = serializer;
    this.eventHandler = eventHandler;
  }

  @PostConstruct
  public void init() {
    initializeConsumerGroup()
        .doOnSuccess(v -> log.info("Order event consumer initialized"))
        .subscribe();
  }

  @Scheduled(fixedDelayString = "${order.consumer.poll-interval:100}")
  public void consume() {
    readEvents()
        .flatMap(this::processRecord)
        .subscribe(null, error -> log.error("Error in consumer loop: {}", error.getMessage()));
  }

  @Override
  protected Mono<Void> handleEvent(CloudEvent event) {
    log.debug("Handling event: type={}, id={}", event.getType(), event.getId());

    OrderCompletedData data = serializer.extractData(event, OrderCompletedData.class);
    if (data == null || data.order() == null) {
      log.warn("Event has no order data: id={}", event.getId());
      return Mono.empty();
    }

    return eventHandler.handleOrderCompleted(data.checkoutSessionId(), data.order());
  }

  /** Data structure for OrderCompleted events. */
  public record OrderCompletedData(String checkoutSessionId, Order order) {}
}
```

**Step 4: Run test to verify it passes**

Run: `./gradlew :apps:order-service:test --tests OrderEventConsumerTest`

Expected: PASS

**Step 5: Commit**

```bash
git add apps/order-service/src/
git commit -m "feat(order-service): add OrderEventConsumer"
```

---

## Task 5: Update Imports to Use Shared Models

**Files:**
- Modify: Multiple files in `apps/order-service/src/main/java/org/example/order/`

**Step 1: Update model imports**

In all order-service files, replace:
```java
import org.example.order.model.*;
```

With:
```java
import org.example.model.order.*;
```

Files to update:
- `model/Order.java` - DELETE (use shared model)
- `model/OrderLineItem.java` - DELETE
- `model/OrderStatus.java` - DELETE
- `model/PaymentStatus.java` - DELETE
- `model/AppliedDiscount.java` - DELETE
- `model/CustomerSnapshot.java` - DELETE
- `model/FulfillmentDetails.java` - DELETE
- `model/FulfillmentType.java` - DELETE
- `model/DeliveryAddress.java` - DELETE
- `service/OrderService.java` - UPDATE imports
- `controller/OrderController.java` - UPDATE imports
- `repository/OrderEntity.java` - UPDATE imports (or adapt)

**Step 2: Delete old model files**

```bash
rm -rf apps/order-service/src/main/java/org/example/order/model/
```

**Step 3: Update remaining files to use shared model imports**

**Step 4: Verify compilation**

Run: `./gradlew :apps:order-service:compileJava`

Expected: BUILD SUCCESSFUL (may need to fix entity mapping)

**Step 5: Commit**

```bash
git add apps/order-service/src/
git commit -m "refactor(order-service): use shared-model-order imports"
```

---

## Task 6: Update OrderRepository Interface

**Files:**
- Modify: `apps/order-service/src/main/java/org/example/order/repository/OrderRepository.java`

**Step 1: Add existsById method if missing**

Ensure the repository has:

```java
package org.example.order.repository;

import java.util.UUID;
import org.example.model.order.Order;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface OrderRepository {
  Mono<Order> findById(UUID id);
  Mono<Boolean> existsById(UUID id);
  Mono<Order> save(Order order);
  Flux<Order> findByStoreNumber(int storeNumber);
}
```

**Step 2: Verify compilation**

Run: `./gradlew :apps:order-service:compileJava`

Expected: BUILD SUCCESSFUL

**Step 3: Commit**

```bash
git add apps/order-service/src/
git commit -m "feat(order-service): add existsById to OrderRepository"
```

---

## Task 7: Update Configuration

**Files:**
- Modify: `apps/order-service/src/main/resources/application.yml`

**Step 1: Add Redis and consumer configuration**

Add to `application.yml`:

```yaml
spring:
  data:
    redis:
      host: ${REDIS_HOST:localhost}
      port: ${REDIS_PORT:6379}

order:
  consumer:
    stream-key: orders:completed
    consumer-group: order-service-group
    consumer-name: ${HOSTNAME:order-service-1}
    batch-size: 10
    poll-interval: 100
    max-retries: 3
    retry-delay: 1s
```

**Step 2: Enable scheduling**

Ensure `@EnableScheduling` is on the application class or a config class.

**Step 3: Commit**

```bash
git add apps/order-service/src/main/resources/
git commit -m "feat(order-service): add Redis and consumer configuration"
```

---

## Task 8: Update Tests

**Files:**
- Modify: Test files to use shared model imports
- Delete: Old model test files if any

**Step 1: Update test imports**

Update all test files to use `org.example.model.order.*` imports.

**Step 2: Run tests**

Run: `./gradlew :apps:order-service:test`

Expected: All tests PASS

**Step 3: Commit**

```bash
git add apps/order-service/src/test/
git commit -m "test(order-service): update tests for shared model imports"
```

---

## Task 9: Run Full Test Suite

**Step 1: Run all order-service tests**

Run: `./gradlew :apps:order-service:test`

Expected: All tests PASS

**Step 2: Run build**

Run: `./gradlew :apps:order-service:build`

Expected: BUILD SUCCESSFUL

---

## Completion Checklist

- [ ] Dependencies added (shared-model-order, platform-events, Redis)
- [ ] OrderEventProperties created
- [ ] OrderEventHandler implemented
- [ ] OrderEventConsumer implemented
- [ ] Imports updated to use shared models
- [ ] Old model classes deleted
- [ ] OrderRepository interface updated
- [ ] Configuration updated
- [ ] Scheduling enabled
- [ ] Tests updated and passing
- [ ] Build successful
