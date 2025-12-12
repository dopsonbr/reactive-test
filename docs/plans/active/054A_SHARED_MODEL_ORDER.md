# 054A: Shared Model Order Library

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create `shared-model-order` library with consolidated order domain models

**Architecture:** Pure DTOs with Jackson annotations, no JPA. Used by checkout-service, order-service, and platform-events.

**Tech Stack:** Java records, Jackson annotations, Lombok-style builders

---

## Task 1: Create Module Structure

**Files:**
- Create: `libs/backend/shared-model/shared-model-order/build.gradle.kts`
- Modify: `settings.gradle.kts`

**Step 1: Create build.gradle.kts**

Create file `libs/backend/shared-model/shared-model-order/build.gradle.kts`:

```kotlin
plugins {
    id("platform.library-conventions")
}

dependencies {
    api(platform(project(":libs:backend:platform:platform-bom")))
    api("com.fasterxml.jackson.core:jackson-annotations")
}
```

**Step 2: Add to settings.gradle.kts**

In `settings.gradle.kts`, add after line 26 (after shared-model-payment):

```kotlin
include("libs:backend:shared-model:shared-model-order")
```

**Step 3: Verify module recognized**

Run: `./gradlew :libs:backend:shared-model:shared-model-order:tasks`

Expected: Task list output (not "project not found")

**Step 4: Commit**

```bash
git add libs/backend/shared-model/shared-model-order/build.gradle.kts settings.gradle.kts
git commit -m "feat(shared-model): add shared-model-order module structure"
```

---

## Task 2: Create OrderStatus Enum

**Files:**
- Create: `libs/backend/shared-model/shared-model-order/src/main/java/org/example/model/order/OrderStatus.java`
- Test: `libs/backend/shared-model/shared-model-order/src/test/java/org/example/model/order/OrderStatusTest.java`

**Step 1: Write the failing test**

Create file `libs/backend/shared-model/shared-model-order/src/test/java/org/example/model/order/OrderStatusTest.java`:

```java
package org.example.model.order;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class OrderStatusTest {

  @Test
  void shouldHaveExpectedStatuses() {
    assertThat(OrderStatus.values())
        .containsExactlyInAnyOrder(
            OrderStatus.CREATED,
            OrderStatus.PAID,
            OrderStatus.PROCESSING,
            OrderStatus.SHIPPED,
            OrderStatus.DELIVERED,
            OrderStatus.CANCELLED,
            OrderStatus.REFUNDED);
  }
}
```

**Step 2: Run test to verify it fails**

Run: `./gradlew :libs:backend:shared-model:shared-model-order:test --tests OrderStatusTest`

Expected: FAIL with "cannot find symbol: class OrderStatus"

**Step 3: Write minimal implementation**

Create file `libs/backend/shared-model/shared-model-order/src/main/java/org/example/model/order/OrderStatus.java`:

```java
package org.example.model.order;

/** Status of an order in the system. */
public enum OrderStatus {
  CREATED,
  PAID,
  PROCESSING,
  SHIPPED,
  DELIVERED,
  CANCELLED,
  REFUNDED
}
```

**Step 4: Run test to verify it passes**

Run: `./gradlew :libs:backend:shared-model:shared-model-order:test --tests OrderStatusTest`

Expected: PASS

**Step 5: Commit**

```bash
git add libs/backend/shared-model/shared-model-order/src/
git commit -m "feat(shared-model-order): add OrderStatus enum"
```

---

## Task 3: Create PaymentStatus Enum

**Files:**
- Create: `libs/backend/shared-model/shared-model-order/src/main/java/org/example/model/order/PaymentStatus.java`
- Test: `libs/backend/shared-model/shared-model-order/src/test/java/org/example/model/order/PaymentStatusTest.java`

**Step 1: Write the failing test**

Create file `libs/backend/shared-model/shared-model-order/src/test/java/org/example/model/order/PaymentStatusTest.java`:

```java
package org.example.model.order;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class PaymentStatusTest {

  @Test
  void shouldHaveExpectedStatuses() {
    assertThat(PaymentStatus.values())
        .containsExactlyInAnyOrder(
            PaymentStatus.PENDING,
            PaymentStatus.AUTHORIZED,
            PaymentStatus.COMPLETED,
            PaymentStatus.FAILED,
            PaymentStatus.REFUNDED);
  }
}
```

**Step 2: Run test to verify it fails**

Run: `./gradlew :libs:backend:shared-model:shared-model-order:test --tests PaymentStatusTest`

Expected: FAIL

**Step 3: Write minimal implementation**

Create file `libs/backend/shared-model/shared-model-order/src/main/java/org/example/model/order/PaymentStatus.java`:

```java
package org.example.model.order;

/** Payment status for an order. */
public enum PaymentStatus {
  PENDING,
  AUTHORIZED,
  COMPLETED,
  FAILED,
  REFUNDED
}
```

**Step 4: Run test to verify it passes**

Run: `./gradlew :libs:backend:shared-model:shared-model-order:test --tests PaymentStatusTest`

Expected: PASS

**Step 5: Commit**

```bash
git add libs/backend/shared-model/shared-model-order/src/
git commit -m "feat(shared-model-order): add PaymentStatus enum"
```

---

## Task 4: Create FulfillmentType Enum

**Files:**
- Create: `libs/backend/shared-model/shared-model-order/src/main/java/org/example/model/order/FulfillmentType.java`
- Test: `libs/backend/shared-model/shared-model-order/src/test/java/org/example/model/order/FulfillmentTypeTest.java`

**Step 1: Write the failing test**

Create file `libs/backend/shared-model/shared-model-order/src/test/java/org/example/model/order/FulfillmentTypeTest.java`:

```java
package org.example.model.order;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class FulfillmentTypeTest {

  @Test
  void shouldHaveExpectedTypes() {
    assertThat(FulfillmentType.values())
        .containsExactlyInAnyOrder(
            FulfillmentType.DELIVERY,
            FulfillmentType.PICKUP,
            FulfillmentType.IMMEDIATE);
  }
}
```

**Step 2: Run test to verify it fails**

Run: `./gradlew :libs:backend:shared-model:shared-model-order:test --tests FulfillmentTypeTest`

Expected: FAIL

**Step 3: Write minimal implementation**

Create file `libs/backend/shared-model/shared-model-order/src/main/java/org/example/model/order/FulfillmentType.java`:

```java
package org.example.model.order;

/** Type of order fulfillment. */
public enum FulfillmentType {
  DELIVERY,
  PICKUP,
  IMMEDIATE
}
```

**Step 4: Run test to verify it passes**

Run: `./gradlew :libs:backend:shared-model:shared-model-order:test --tests FulfillmentTypeTest`

Expected: PASS

**Step 5: Commit**

```bash
git add libs/backend/shared-model/shared-model-order/src/
git commit -m "feat(shared-model-order): add FulfillmentType enum"
```

---

## Task 5: Create DeliveryAddress Record

**Files:**
- Create: `libs/backend/shared-model/shared-model-order/src/main/java/org/example/model/order/DeliveryAddress.java`
- Test: `libs/backend/shared-model/shared-model-order/src/test/java/org/example/model/order/DeliveryAddressTest.java`

**Step 1: Write the failing test**

Create file `libs/backend/shared-model/shared-model-order/src/test/java/org/example/model/order/DeliveryAddressTest.java`:

```java
package org.example.model.order;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

class DeliveryAddressTest {

  private final ObjectMapper objectMapper = new ObjectMapper();

  @Test
  void shouldSerializeToJson() throws Exception {
    DeliveryAddress address =
        new DeliveryAddress(
            "123 Main St", "Apt 4", "Springfield", "IL", "62701", "USA");

    String json = objectMapper.writeValueAsString(address);

    assertThat(json).contains("123 Main St");
    assertThat(json).contains("Springfield");
    assertThat(json).contains("62701");
  }

  @Test
  void shouldDeserializeFromJson() throws Exception {
    String json =
        """
        {
          "street1": "123 Main St",
          "street2": "Apt 4",
          "city": "Springfield",
          "state": "IL",
          "postalCode": "62701",
          "country": "USA"
        }
        """;

    DeliveryAddress address = objectMapper.readValue(json, DeliveryAddress.class);

    assertThat(address.street1()).isEqualTo("123 Main St");
    assertThat(address.city()).isEqualTo("Springfield");
    assertThat(address.postalCode()).isEqualTo("62701");
  }
}
```

**Step 2: Run test to verify it fails**

Run: `./gradlew :libs:backend:shared-model:shared-model-order:test --tests DeliveryAddressTest`

Expected: FAIL

**Step 3: Write minimal implementation**

Create file `libs/backend/shared-model/shared-model-order/src/main/java/org/example/model/order/DeliveryAddress.java`:

```java
package org.example.model.order;

/** Delivery address for order fulfillment. */
public record DeliveryAddress(
    String street1,
    String street2,
    String city,
    String state,
    String postalCode,
    String country) {}
```

**Step 4: Run test to verify it passes**

Run: `./gradlew :libs:backend:shared-model:shared-model-order:test --tests DeliveryAddressTest`

Expected: PASS

**Step 5: Commit**

```bash
git add libs/backend/shared-model/shared-model-order/src/
git commit -m "feat(shared-model-order): add DeliveryAddress record"
```

---

## Task 6: Create CustomerSnapshot Record

**Files:**
- Create: `libs/backend/shared-model/shared-model-order/src/main/java/org/example/model/order/CustomerSnapshot.java`
- Test: `libs/backend/shared-model/shared-model-order/src/test/java/org/example/model/order/CustomerSnapshotTest.java`

**Step 1: Write the failing test**

Create file `libs/backend/shared-model/shared-model-order/src/test/java/org/example/model/order/CustomerSnapshotTest.java`:

```java
package org.example.model.order;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

class CustomerSnapshotTest {

  private final ObjectMapper objectMapper = new ObjectMapper();

  @Test
  void shouldSerializeToJson() throws Exception {
    CustomerSnapshot customer =
        new CustomerSnapshot(
            "cust-123", "John", "Doe", "john@example.com", "555-1234", "GOLD");

    String json = objectMapper.writeValueAsString(customer);

    assertThat(json).contains("cust-123");
    assertThat(json).contains("John");
    assertThat(json).contains("GOLD");
  }

  @Test
  void shouldDeserializeFromJson() throws Exception {
    String json =
        """
        {
          "customerId": "cust-123",
          "firstName": "John",
          "lastName": "Doe",
          "email": "john@example.com",
          "phone": "555-1234",
          "loyaltyTier": "GOLD"
        }
        """;

    CustomerSnapshot customer = objectMapper.readValue(json, CustomerSnapshot.class);

    assertThat(customer.customerId()).isEqualTo("cust-123");
    assertThat(customer.firstName()).isEqualTo("John");
    assertThat(customer.loyaltyTier()).isEqualTo("GOLD");
  }
}
```

**Step 2: Run test to verify it fails**

Run: `./gradlew :libs:backend:shared-model:shared-model-order:test --tests CustomerSnapshotTest`

Expected: FAIL

**Step 3: Write minimal implementation**

Create file `libs/backend/shared-model/shared-model-order/src/main/java/org/example/model/order/CustomerSnapshot.java`:

```java
package org.example.model.order;

/** Snapshot of customer data at time of order. */
public record CustomerSnapshot(
    String customerId,
    String firstName,
    String lastName,
    String email,
    String phone,
    String loyaltyTier) {}
```

**Step 4: Run test to verify it passes**

Run: `./gradlew :libs:backend:shared-model:shared-model-order:test --tests CustomerSnapshotTest`

Expected: PASS

**Step 5: Commit**

```bash
git add libs/backend/shared-model/shared-model-order/src/
git commit -m "feat(shared-model-order): add CustomerSnapshot record"
```

---

## Task 7: Create AppliedDiscount Record

**Files:**
- Create: `libs/backend/shared-model/shared-model-order/src/main/java/org/example/model/order/AppliedDiscount.java`
- Test: `libs/backend/shared-model/shared-model-order/src/test/java/org/example/model/order/AppliedDiscountTest.java`

**Step 1: Write the failing test**

Create file `libs/backend/shared-model/shared-model-order/src/test/java/org/example/model/order/AppliedDiscountTest.java`:

```java
package org.example.model.order;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import org.junit.jupiter.api.Test;

class AppliedDiscountTest {

  private final ObjectMapper objectMapper = new ObjectMapper();

  @Test
  void shouldSerializeToJson() throws Exception {
    AppliedDiscount discount =
        new AppliedDiscount(
            "disc-123", "SAVE20", "20% off", "PERCENTAGE", new BigDecimal("15.00"));

    String json = objectMapper.writeValueAsString(discount);

    assertThat(json).contains("SAVE20");
    assertThat(json).contains("15.00");
  }

  @Test
  void shouldDeserializeFromJson() throws Exception {
    String json =
        """
        {
          "discountId": "disc-123",
          "code": "SAVE20",
          "description": "20% off",
          "type": "PERCENTAGE",
          "appliedAmount": 15.00
        }
        """;

    AppliedDiscount discount = objectMapper.readValue(json, AppliedDiscount.class);

    assertThat(discount.code()).isEqualTo("SAVE20");
    assertThat(discount.appliedAmount()).isEqualByComparingTo(new BigDecimal("15.00"));
  }
}
```

**Step 2: Run test to verify it fails**

Run: `./gradlew :libs:backend:shared-model:shared-model-order:test --tests AppliedDiscountTest`

Expected: FAIL

**Step 3: Write minimal implementation**

Create file `libs/backend/shared-model/shared-model-order/src/main/java/org/example/model/order/AppliedDiscount.java`:

```java
package org.example.model.order;

import java.math.BigDecimal;

/** Discount applied to an order. */
public record AppliedDiscount(
    String discountId,
    String code,
    String description,
    String type,
    BigDecimal appliedAmount) {}
```

**Step 4: Run test to verify it passes**

Run: `./gradlew :libs:backend:shared-model:shared-model-order:test --tests AppliedDiscountTest`

Expected: PASS

**Step 5: Commit**

```bash
git add libs/backend/shared-model/shared-model-order/src/
git commit -m "feat(shared-model-order): add AppliedDiscount record"
```

---

## Task 8: Create FulfillmentDetails Record

**Files:**
- Create: `libs/backend/shared-model/shared-model-order/src/main/java/org/example/model/order/FulfillmentDetails.java`
- Test: `libs/backend/shared-model/shared-model-order/src/test/java/org/example/model/order/FulfillmentDetailsTest.java`

**Step 1: Write the failing test**

Create file `libs/backend/shared-model/shared-model-order/src/test/java/org/example/model/order/FulfillmentDetailsTest.java`:

```java
package org.example.model.order;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import java.time.Instant;
import org.junit.jupiter.api.Test;

class FulfillmentDetailsTest {

  private final ObjectMapper objectMapper =
      new ObjectMapper().registerModule(new JavaTimeModule());

  @Test
  void shouldSerializeDeliveryFulfillment() throws Exception {
    DeliveryAddress address =
        new DeliveryAddress("123 Main St", null, "Springfield", "IL", "62701", "USA");
    FulfillmentDetails details =
        new FulfillmentDetails(
            FulfillmentType.DELIVERY,
            Instant.parse("2025-01-15T10:00:00Z"),
            address,
            null,
            "Leave at door");

    String json = objectMapper.writeValueAsString(details);

    assertThat(json).contains("DELIVERY");
    assertThat(json).contains("123 Main St");
    assertThat(json).contains("Leave at door");
  }

  @Test
  void shouldSerializePickupFulfillment() throws Exception {
    FulfillmentDetails details =
        new FulfillmentDetails(
            FulfillmentType.PICKUP,
            Instant.parse("2025-01-15T14:00:00Z"),
            null,
            "Store #42 - Downtown",
            null);

    String json = objectMapper.writeValueAsString(details);

    assertThat(json).contains("PICKUP");
    assertThat(json).contains("Store #42");
  }
}
```

**Step 2: Update build.gradle.kts for JavaTimeModule**

Modify `libs/backend/shared-model/shared-model-order/build.gradle.kts`:

```kotlin
plugins {
    id("platform.library-conventions")
}

dependencies {
    api(platform(project(":libs:backend:platform:platform-bom")))
    api("com.fasterxml.jackson.core:jackson-annotations")

    // Test dependencies
    testImplementation("com.fasterxml.jackson.datatype:jackson-datatype-jsr310")
}
```

**Step 3: Run test to verify it fails**

Run: `./gradlew :libs:backend:shared-model:shared-model-order:test --tests FulfillmentDetailsTest`

Expected: FAIL (class not found)

**Step 4: Write minimal implementation**

Create file `libs/backend/shared-model/shared-model-order/src/main/java/org/example/model/order/FulfillmentDetails.java`:

```java
package org.example.model.order;

import java.time.Instant;

/** Details about order fulfillment. */
public record FulfillmentDetails(
    FulfillmentType type,
    Instant scheduledDate,
    DeliveryAddress deliveryAddress,
    String pickupLocation,
    String instructions) {}
```

**Step 5: Run test to verify it passes**

Run: `./gradlew :libs:backend:shared-model:shared-model-order:test --tests FulfillmentDetailsTest`

Expected: PASS

**Step 6: Commit**

```bash
git add libs/backend/shared-model/shared-model-order/
git commit -m "feat(shared-model-order): add FulfillmentDetails record"
```

---

## Task 9: Create OrderLineItem Record

**Files:**
- Create: `libs/backend/shared-model/shared-model-order/src/main/java/org/example/model/order/OrderLineItem.java`
- Test: `libs/backend/shared-model/shared-model-order/src/test/java/org/example/model/order/OrderLineItemTest.java`

**Step 1: Write the failing test**

Create file `libs/backend/shared-model/shared-model-order/src/test/java/org/example/model/order/OrderLineItemTest.java`:

```java
package org.example.model.order;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import org.junit.jupiter.api.Test;

class OrderLineItemTest {

  private final ObjectMapper objectMapper = new ObjectMapper();

  @Test
  void shouldCalculateLineTotal() {
    OrderLineItem item =
        OrderLineItem.create(
            "prod-123", "SKU-001", "Widget", 3, new BigDecimal("10.00"), new BigDecimal("2.00"));

    assertThat(item.lineTotal()).isEqualByComparingTo(new BigDecimal("28.00")); // (10 * 3) - 2
  }

  @Test
  void shouldSerializeToJson() throws Exception {
    OrderLineItem item =
        OrderLineItem.create(
            "prod-123", "SKU-001", "Widget", 2, new BigDecimal("25.00"), BigDecimal.ZERO);

    String json = objectMapper.writeValueAsString(item);

    assertThat(json).contains("SKU-001");
    assertThat(json).contains("Widget");
    assertThat(json).contains("25.00");
  }

  @Test
  void shouldDeserializeFromJson() throws Exception {
    String json =
        """
        {
          "productId": "prod-123",
          "sku": "SKU-001",
          "name": "Widget",
          "quantity": 2,
          "unitPrice": 25.00,
          "discountAmount": 5.00
        }
        """;

    OrderLineItem item = objectMapper.readValue(json, OrderLineItem.class);

    assertThat(item.sku()).isEqualTo("SKU-001");
    assertThat(item.quantity()).isEqualTo(2);
    assertThat(item.lineTotal()).isEqualByComparingTo(new BigDecimal("45.00")); // (25 * 2) - 5
  }
}
```

**Step 2: Run test to verify it fails**

Run: `./gradlew :libs:backend:shared-model:shared-model-order:test --tests OrderLineItemTest`

Expected: FAIL

**Step 3: Write minimal implementation**

Create file `libs/backend/shared-model/shared-model-order/src/main/java/org/example/model/order/OrderLineItem.java`:

```java
package org.example.model.order;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.math.BigDecimal;

/** Line item in an order. */
public record OrderLineItem(
    String productId,
    String sku,
    String name,
    int quantity,
    BigDecimal unitPrice,
    BigDecimal discountAmount) {

  public static OrderLineItem create(
      String productId,
      String sku,
      String name,
      int quantity,
      BigDecimal unitPrice,
      BigDecimal discountAmount) {
    return new OrderLineItem(
        productId,
        sku,
        name,
        quantity,
        unitPrice,
        discountAmount != null ? discountAmount : BigDecimal.ZERO);
  }

  @JsonProperty
  public BigDecimal lineTotal() {
    BigDecimal gross = unitPrice.multiply(BigDecimal.valueOf(quantity));
    return gross.subtract(discountAmount != null ? discountAmount : BigDecimal.ZERO);
  }
}
```

**Step 4: Run test to verify it passes**

Run: `./gradlew :libs:backend:shared-model:shared-model-order:test --tests OrderLineItemTest`

Expected: PASS

**Step 5: Commit**

```bash
git add libs/backend/shared-model/shared-model-order/src/
git commit -m "feat(shared-model-order): add OrderLineItem record with lineTotal"
```

---

## Task 10: Create Order Record

**Files:**
- Create: `libs/backend/shared-model/shared-model-order/src/main/java/org/example/model/order/Order.java`
- Test: `libs/backend/shared-model/shared-model-order/src/test/java/org/example/model/order/OrderTest.java`

**Step 1: Write the failing test**

Create file `libs/backend/shared-model/shared-model-order/src/test/java/org/example/model/order/OrderTest.java`:

```java
package org.example.model.order;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class OrderTest {

  private final ObjectMapper objectMapper =
      new ObjectMapper().registerModule(new JavaTimeModule());

  @Test
  void shouldBuildOrder() {
    UUID orderId = UUID.randomUUID();
    Instant now = Instant.now();

    Order order =
        Order.builder()
            .id(orderId)
            .storeNumber(100)
            .orderNumber("ORD-001")
            .grandTotal(new BigDecimal("99.99"))
            .status(OrderStatus.PAID)
            .paymentStatus(PaymentStatus.COMPLETED)
            .createdAt(now)
            .build();

    assertThat(order.id()).isEqualTo(orderId);
    assertThat(order.storeNumber()).isEqualTo(100);
    assertThat(order.orderNumber()).isEqualTo("ORD-001");
    assertThat(order.grandTotal()).isEqualByComparingTo(new BigDecimal("99.99"));
    assertThat(order.status()).isEqualTo(OrderStatus.PAID);
  }

  @Test
  void shouldSerializeToJson() throws Exception {
    Order order =
        Order.builder()
            .id(UUID.fromString("11111111-1111-1111-1111-111111111111"))
            .storeNumber(100)
            .orderNumber("ORD-001")
            .grandTotal(new BigDecimal("99.99"))
            .status(OrderStatus.PAID)
            .paymentStatus(PaymentStatus.COMPLETED)
            .lineItems(List.of())
            .appliedDiscounts(List.of())
            .createdAt(Instant.parse("2025-01-01T12:00:00Z"))
            .build();

    String json = objectMapper.writeValueAsString(order);

    assertThat(json).contains("11111111-1111-1111-1111-111111111111");
    assertThat(json).contains("ORD-001");
    assertThat(json).contains("99.99");
    assertThat(json).contains("PAID");
  }

  @Test
  void shouldDeserializeFromJson() throws Exception {
    String json =
        """
        {
          "id": "11111111-1111-1111-1111-111111111111",
          "storeNumber": 100,
          "orderNumber": "ORD-001",
          "grandTotal": 99.99,
          "status": "PAID",
          "paymentStatus": "COMPLETED",
          "lineItems": [],
          "appliedDiscounts": [],
          "createdAt": "2025-01-01T12:00:00Z"
        }
        """;

    Order order = objectMapper.readValue(json, Order.class);

    assertThat(order.orderNumber()).isEqualTo("ORD-001");
    assertThat(order.status()).isEqualTo(OrderStatus.PAID);
  }
}
```

**Step 2: Run test to verify it fails**

Run: `./gradlew :libs:backend:shared-model:shared-model-order:test --tests OrderTest`

Expected: FAIL

**Step 3: Write minimal implementation**

Create file `libs/backend/shared-model/shared-model-order/src/main/java/org/example/model/order/Order.java`:

```java
package org.example.model.order;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/** Domain model for an order. */
public record Order(
    UUID id,
    int storeNumber,
    String orderNumber,
    String customerId,
    FulfillmentType fulfillmentType,
    Instant fulfillmentDate,
    UUID reservationId,
    BigDecimal subtotal,
    BigDecimal discountTotal,
    BigDecimal taxTotal,
    BigDecimal fulfillmentCost,
    BigDecimal grandTotal,
    PaymentStatus paymentStatus,
    String paymentMethod,
    String paymentReference,
    OrderStatus status,
    List<OrderLineItem> lineItems,
    List<AppliedDiscount> appliedDiscounts,
    CustomerSnapshot customerSnapshot,
    FulfillmentDetails fulfillmentDetails,
    Instant createdAt,
    Instant updatedAt,
    String createdBy,
    UUID sessionId) {

  public static Builder builder() {
    return new Builder();
  }

  public static class Builder {
    private UUID id;
    private int storeNumber;
    private String orderNumber;
    private String customerId;
    private FulfillmentType fulfillmentType;
    private Instant fulfillmentDate;
    private UUID reservationId;
    private BigDecimal subtotal = BigDecimal.ZERO;
    private BigDecimal discountTotal = BigDecimal.ZERO;
    private BigDecimal taxTotal = BigDecimal.ZERO;
    private BigDecimal fulfillmentCost = BigDecimal.ZERO;
    private BigDecimal grandTotal = BigDecimal.ZERO;
    private PaymentStatus paymentStatus = PaymentStatus.PENDING;
    private String paymentMethod;
    private String paymentReference;
    private OrderStatus status = OrderStatus.CREATED;
    private List<OrderLineItem> lineItems = List.of();
    private List<AppliedDiscount> appliedDiscounts = List.of();
    private CustomerSnapshot customerSnapshot;
    private FulfillmentDetails fulfillmentDetails;
    private Instant createdAt;
    private Instant updatedAt;
    private String createdBy;
    private UUID sessionId;

    public Builder id(UUID id) {
      this.id = id;
      return this;
    }

    public Builder storeNumber(int storeNumber) {
      this.storeNumber = storeNumber;
      return this;
    }

    public Builder orderNumber(String orderNumber) {
      this.orderNumber = orderNumber;
      return this;
    }

    public Builder customerId(String customerId) {
      this.customerId = customerId;
      return this;
    }

    public Builder fulfillmentType(FulfillmentType fulfillmentType) {
      this.fulfillmentType = fulfillmentType;
      return this;
    }

    public Builder fulfillmentDate(Instant fulfillmentDate) {
      this.fulfillmentDate = fulfillmentDate;
      return this;
    }

    public Builder reservationId(UUID reservationId) {
      this.reservationId = reservationId;
      return this;
    }

    public Builder subtotal(BigDecimal subtotal) {
      this.subtotal = subtotal;
      return this;
    }

    public Builder discountTotal(BigDecimal discountTotal) {
      this.discountTotal = discountTotal;
      return this;
    }

    public Builder taxTotal(BigDecimal taxTotal) {
      this.taxTotal = taxTotal;
      return this;
    }

    public Builder fulfillmentCost(BigDecimal fulfillmentCost) {
      this.fulfillmentCost = fulfillmentCost;
      return this;
    }

    public Builder grandTotal(BigDecimal grandTotal) {
      this.grandTotal = grandTotal;
      return this;
    }

    public Builder paymentStatus(PaymentStatus paymentStatus) {
      this.paymentStatus = paymentStatus;
      return this;
    }

    public Builder paymentMethod(String paymentMethod) {
      this.paymentMethod = paymentMethod;
      return this;
    }

    public Builder paymentReference(String paymentReference) {
      this.paymentReference = paymentReference;
      return this;
    }

    public Builder status(OrderStatus status) {
      this.status = status;
      return this;
    }

    public Builder lineItems(List<OrderLineItem> lineItems) {
      this.lineItems = lineItems;
      return this;
    }

    public Builder appliedDiscounts(List<AppliedDiscount> appliedDiscounts) {
      this.appliedDiscounts = appliedDiscounts;
      return this;
    }

    public Builder customerSnapshot(CustomerSnapshot customerSnapshot) {
      this.customerSnapshot = customerSnapshot;
      return this;
    }

    public Builder fulfillmentDetails(FulfillmentDetails fulfillmentDetails) {
      this.fulfillmentDetails = fulfillmentDetails;
      return this;
    }

    public Builder createdAt(Instant createdAt) {
      this.createdAt = createdAt;
      return this;
    }

    public Builder updatedAt(Instant updatedAt) {
      this.updatedAt = updatedAt;
      return this;
    }

    public Builder createdBy(String createdBy) {
      this.createdBy = createdBy;
      return this;
    }

    public Builder sessionId(UUID sessionId) {
      this.sessionId = sessionId;
      return this;
    }

    public Order build() {
      return new Order(
          id,
          storeNumber,
          orderNumber,
          customerId,
          fulfillmentType,
          fulfillmentDate,
          reservationId,
          subtotal,
          discountTotal,
          taxTotal,
          fulfillmentCost,
          grandTotal,
          paymentStatus,
          paymentMethod,
          paymentReference,
          status,
          lineItems,
          appliedDiscounts,
          customerSnapshot,
          fulfillmentDetails,
          createdAt,
          updatedAt,
          createdBy,
          sessionId);
    }
  }
}
```

**Step 4: Run test to verify it passes**

Run: `./gradlew :libs:backend:shared-model:shared-model-order:test --tests OrderTest`

Expected: PASS

**Step 5: Commit**

```bash
git add libs/backend/shared-model/shared-model-order/src/
git commit -m "feat(shared-model-order): add Order record with builder"
```

---

## Task 11: Run Full Test Suite

**Step 1: Run all shared-model-order tests**

Run: `./gradlew :libs:backend:shared-model:shared-model-order:test`

Expected: All tests PASS

**Step 2: Run build for module**

Run: `./gradlew :libs:backend:shared-model:shared-model-order:build`

Expected: BUILD SUCCESSFUL

**Step 3: Verify no compilation errors across workspace**

Run: `pnpm nx run-many -t build --projects=tag:backend`

Expected: All backend projects build (some may have errors if they depend on this module - that's expected and will be fixed in later sub-plans)

---

## Task 12: Add AGENTS.md Documentation

**Files:**
- Create: `libs/backend/shared-model/shared-model-order/AGENTS.md`

**Step 1: Create AGENTS.md**

Create file `libs/backend/shared-model/shared-model-order/AGENTS.md`:

```markdown
# shared-model-order

Shared domain models for order-related data, used by checkout-service and order-service.

## Package Structure

```
org.example.model.order/
├── Order.java           # Main order aggregate
├── OrderLineItem.java   # Line item with computed lineTotal
├── OrderStatus.java     # Order lifecycle states
├── PaymentStatus.java   # Payment states
├── FulfillmentType.java # DELIVERY, PICKUP, IMMEDIATE
├── FulfillmentDetails.java
├── DeliveryAddress.java
├── CustomerSnapshot.java
└── AppliedDiscount.java
```

## Design Principles

1. **Immutable records** - All models are Java records (immutable by design)
2. **No JPA annotations** - These are pure DTOs; entity mapping stays in services
3. **Jackson-friendly** - Annotated for JSON serialization in CloudEvents
4. **Builder pattern** - Order uses builder for convenient construction

## Usage

```java
// Building an order
Order order = Order.builder()
    .id(UUID.randomUUID())
    .storeNumber(100)
    .orderNumber("ORD-001")
    .grandTotal(new BigDecimal("99.99"))
    .status(OrderStatus.PAID)
    .build();

// Line item with computed total
OrderLineItem item = OrderLineItem.create(
    "prod-123", "SKU-001", "Widget",
    2, new BigDecimal("25.00"), BigDecimal.ZERO);
BigDecimal total = item.lineTotal(); // 50.00
```

## Consumers

- `checkout-service` - Creates orders and publishes events
- `order-service` - Consumes events and persists orders
- `platform-events` - Serializes Order in CloudEvent data payload
```

**Step 2: Commit**

```bash
git add libs/backend/shared-model/shared-model-order/AGENTS.md
git commit -m "docs(shared-model-order): add AGENTS.md documentation"
```

---

## Completion Checklist

- [ ] Module structure created
- [ ] All 9 model classes implemented with tests
- [ ] All tests passing
- [ ] Build successful
- [ ] AGENTS.md documentation added
- [ ] All changes committed
