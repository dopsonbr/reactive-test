package org.example.platform.audit;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.util.Map;
import org.junit.jupiter.api.Test;

class AuditEventTest {

  @Test
  void create_generatesEventIdAndTimestamp() {
    AuditEvent event =
        AuditEvent.create(
            AuditEventType.CART_CREATED,
            EntityType.CART,
            "cart-123",
            100,
            "user01",
            "session-uuid",
            "trace-uuid",
            Map.of("items", 3));

    assertThat(event.eventId()).isNotNull();
    assertThat(event.eventId()).hasSize(36); // UUID format
    assertThat(event.timestamp()).isNotNull();
    assertThat(event.timestamp()).isBeforeOrEqualTo(Instant.now());
  }

  @Test
  void create_setsAllFieldsCorrectly() {
    Map<String, Object> data = Map.of("items", 5, "total", 99.99);

    AuditEvent event =
        AuditEvent.create(
            AuditEventType.PRODUCT_ADDED,
            EntityType.CART,
            "cart-456",
            200,
            "user02",
            "session-123",
            "trace-456",
            data);

    assertThat(event.eventType()).isEqualTo(AuditEventType.PRODUCT_ADDED);
    assertThat(event.entityType()).isEqualTo(EntityType.CART);
    assertThat(event.entityId()).isEqualTo("cart-456");
    assertThat(event.storeNumber()).isEqualTo(200);
    assertThat(event.userId()).isEqualTo("user02");
    assertThat(event.sessionId()).isEqualTo("session-123");
    assertThat(event.traceId()).isEqualTo("trace-456");
    assertThat(event.data()).isEqualTo(data);
  }

  @Test
  void create_withNullData_usesEmptyMap() {
    AuditEvent event =
        AuditEvent.create(
            AuditEventType.CART_DELETED,
            EntityType.CART,
            "cart-789",
            300,
            "user03",
            null,
            null,
            null);

    assertThat(event.data()).isNotNull();
    assertThat(event.data()).isEmpty();
  }

  @Test
  void builder_createsEventWithAllFields() {
    AuditEvent event =
        AuditEvent.builder()
            .eventType(AuditEventType.CUSTOMER_SET)
            .entityType(EntityType.CART)
            .entityId("cart-builder")
            .storeNumber(400)
            .userId("builder-user")
            .sessionId("builder-session")
            .traceId("builder-trace")
            .data(Map.of("customerId", "cust-123"))
            .build();

    assertThat(event.eventId()).isNotNull();
    assertThat(event.eventType()).isEqualTo(AuditEventType.CUSTOMER_SET);
    assertThat(event.entityType()).isEqualTo(EntityType.CART);
    assertThat(event.entityId()).isEqualTo("cart-builder");
    assertThat(event.storeNumber()).isEqualTo(400);
    assertThat(event.userId()).isEqualTo("builder-user");
    assertThat(event.sessionId()).isEqualTo("builder-session");
    assertThat(event.traceId()).isEqualTo("builder-trace");
    assertThat(event.data()).containsEntry("customerId", "cust-123");
  }

  @Test
  void builder_withDefaultData_usesEmptyMap() {
    AuditEvent event =
        AuditEvent.builder()
            .eventType(AuditEventType.CART_VIEWED)
            .entityType(EntityType.CART)
            .entityId("cart-no-data")
            .storeNumber(500)
            .build();

    assertThat(event.data()).isNotNull();
    assertThat(event.data()).isEmpty();
  }

  @Test
  void recordEquality_worksCorrectly() {
    Instant now = Instant.now();
    Map<String, Object> data = Map.of("key", "value");

    AuditEvent event1 =
        new AuditEvent(
            "event-id",
            AuditEventType.CART_CREATED,
            EntityType.CART,
            "cart-id",
            100,
            "user",
            "session",
            "trace",
            now,
            data);

    AuditEvent event2 =
        new AuditEvent(
            "event-id",
            AuditEventType.CART_CREATED,
            EntityType.CART,
            "cart-id",
            100,
            "user",
            "session",
            "trace",
            now,
            data);

    assertThat(event1).isEqualTo(event2);
    assertThat(event1.hashCode()).isEqualTo(event2.hashCode());
  }
}
