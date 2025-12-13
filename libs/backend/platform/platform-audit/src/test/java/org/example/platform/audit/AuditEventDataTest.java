package org.example.platform.audit;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;
import org.junit.jupiter.api.Test;

class AuditEventDataTest {

  @Test
  void builder_createsEventDataWithAllFields() {
    Map<String, Object> payload = Map.of("items", 5, "total", 99.99);

    AuditEventData data =
        AuditEventData.builder()
            .entityType("CART")
            .entityId("cart-456")
            .storeNumber(200)
            .userId("user02")
            .sessionId("session-123")
            .traceId("trace-456")
            .payload(payload)
            .build();

    assertThat(data.entityType()).isEqualTo("CART");
    assertThat(data.entityId()).isEqualTo("cart-456");
    assertThat(data.storeNumber()).isEqualTo(200);
    assertThat(data.userId()).isEqualTo("user02");
    assertThat(data.sessionId()).isEqualTo("session-123");
    assertThat(data.traceId()).isEqualTo("trace-456");
    assertThat(data.payload()).isEqualTo(payload);
  }

  @Test
  void builder_withNullPayload_usesEmptyMap() {
    AuditEventData data =
        AuditEventData.builder()
            .entityType("CART")
            .entityId("cart-789")
            .storeNumber(300)
            .userId("user03")
            .build();

    assertThat(data.payload()).isNotNull();
    assertThat(data.payload()).isEmpty();
  }

  @Test
  void builder_withNullStrings_keepsNulls() {
    AuditEventData data =
        AuditEventData.builder().entityType("CART").entityId("cart-123").storeNumber(100).build();

    assertThat(data.userId()).isNull();
    assertThat(data.sessionId()).isNull();
    assertThat(data.traceId()).isNull();
  }

  @Test
  void recordEquality_worksCorrectly() {
    Map<String, Object> payload = Map.of("key", "value");

    AuditEventData data1 =
        new AuditEventData("CART", "cart-id", 100, "user", "session", "trace", payload);

    AuditEventData data2 =
        new AuditEventData("CART", "cart-id", 100, "user", "session", "trace", payload);

    assertThat(data1).isEqualTo(data2);
    assertThat(data1.hashCode()).isEqualTo(data2.hashCode());
  }

  @Test
  void recordInequality_differentEntityId() {
    AuditEventData data1 =
        AuditEventData.builder().entityType("CART").entityId("cart-1").storeNumber(100).build();

    AuditEventData data2 =
        AuditEventData.builder().entityType("CART").entityId("cart-2").storeNumber(100).build();

    assertThat(data1).isNotEqualTo(data2);
  }
}
