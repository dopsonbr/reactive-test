package org.example.audit.domain;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import io.cloudevents.CloudEvent;
import io.cloudevents.core.builder.CloudEventBuilder;
import java.net.URI;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Map;
import org.example.platform.audit.AuditEventData;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class AuditRecordTest {

  private ObjectMapper objectMapper;

  @BeforeEach
  void setUp() {
    objectMapper =
        new ObjectMapper()
            .registerModule(new JavaTimeModule())
            .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
  }

  @Test
  void fromCloudEvent_copiesAllFields() {
    Instant timestamp = Instant.parse("2024-06-15T10:30:00Z");
    Map<String, Object> payload = Map.of("items", 3, "total", 99.99);

    AuditEventData eventData =
        AuditEventData.builder()
            .entityType("CART")
            .entityId("cart-456")
            .storeNumber(100)
            .userId("user01")
            .sessionId("session-uuid")
            .traceId("trace-uuid")
            .payload(payload)
            .build();

    CloudEvent cloudEvent =
        CloudEventBuilder.v1()
            .withId("event-123")
            .withType("org.example.audit.CART_CREATED")
            .withSource(URI.create("/cart-service"))
            .withSubject("CART:cart-456")
            .withTime(OffsetDateTime.ofInstant(timestamp, ZoneOffset.UTC))
            .build();

    AuditRecord record = AuditRecord.fromCloudEvent(cloudEvent, eventData, objectMapper);

    assertThat(record.getEventId()).isEqualTo("event-123");
    assertThat(record.getEventType()).isEqualTo("CART_CREATED"); // prefix stripped
    assertThat(record.getEntityType()).isEqualTo("CART");
    assertThat(record.getEntityId()).isEqualTo("cart-456");
    assertThat(record.getStoreNumber()).isEqualTo(100);
    assertThat(record.getUserId()).isEqualTo("user01");
    assertThat(record.getSessionId()).isEqualTo("session-uuid");
    assertThat(record.getTraceId()).isEqualTo("trace-uuid");
    assertThat(record.getCreatedAt()).isEqualTo(timestamp);
    assertThat(record.getData()).contains("\"items\":3");
    assertThat(record.getData()).contains("\"total\":99.99");
  }

  @Test
  void fromCloudEvent_withEmptyPayload_serializesEmptyJson() {
    AuditEventData eventData =
        AuditEventData.builder()
            .entityType("CART")
            .entityId("cart-789")
            .storeNumber(200)
            .userId("user02")
            .payload(Map.of())
            .build();

    CloudEvent cloudEvent =
        CloudEventBuilder.v1()
            .withId("event-empty")
            .withType("org.example.audit.CART_DELETED")
            .withSource(URI.create("/cart-service"))
            .withSubject("CART:cart-789")
            .withTime(OffsetDateTime.now())
            .build();

    AuditRecord record = AuditRecord.fromCloudEvent(cloudEvent, eventData, objectMapper);

    assertThat(record.getData()).isEqualTo("{}");
  }

  @Test
  void toEventData_reconstructsEventData() {
    AuditRecord record = new AuditRecord();
    record.setEventId("event-456");
    record.setEventType("PRODUCT_ADDED");
    record.setEntityType("CART");
    record.setEntityId("cart-789");
    record.setStoreNumber(300);
    record.setUserId("user03");
    record.setSessionId("session-123");
    record.setTraceId("trace-123");
    record.setCreatedAt(Instant.parse("2024-06-15T10:30:00Z"));
    record.setData("{\"sku\":\"ABC123\",\"quantity\":2}");

    AuditEventData eventData = record.toEventData(objectMapper);

    assertThat(eventData.entityType()).isEqualTo("CART");
    assertThat(eventData.entityId()).isEqualTo("cart-789");
    assertThat(eventData.storeNumber()).isEqualTo(300);
    assertThat(eventData.userId()).isEqualTo("user03");
    assertThat(eventData.sessionId()).isEqualTo("session-123");
    assertThat(eventData.traceId()).isEqualTo("trace-123");
    assertThat(eventData.payload()).containsEntry("sku", "ABC123");
    assertThat(eventData.payload()).containsEntry("quantity", 2);
  }

  @Test
  void toEventData_withInvalidJson_returnsEmptyMap() {
    AuditRecord record = new AuditRecord();
    record.setEventId("event-invalid");
    record.setEventType("CART_VIEWED");
    record.setEntityType("CART");
    record.setEntityId("cart-invalid");
    record.setStoreNumber(400);
    record.setCreatedAt(Instant.now());
    record.setData("not valid json");

    AuditEventData eventData = record.toEventData(objectMapper);

    assertThat(eventData.payload()).isEmpty();
  }

  @Test
  void roundTrip_preservesAllData() {
    Map<String, Object> originalPayload = Map.of("key1", "value1", "key2", 42);
    Instant timestamp = Instant.now();

    AuditEventData originalEventData =
        AuditEventData.builder()
            .entityType("CART")
            .entityId("cart-roundtrip")
            .storeNumber(500)
            .userId("user04")
            .sessionId("session-rt")
            .traceId("trace-rt")
            .payload(originalPayload)
            .build();

    CloudEvent cloudEvent =
        CloudEventBuilder.v1()
            .withId("event-roundtrip")
            .withType("org.example.audit.CUSTOMER_SET")
            .withSource(URI.create("/cart-service"))
            .withSubject("CART:cart-roundtrip")
            .withTime(OffsetDateTime.ofInstant(timestamp, ZoneOffset.UTC))
            .build();

    AuditRecord record = AuditRecord.fromCloudEvent(cloudEvent, originalEventData, objectMapper);
    AuditEventData reconstructedEventData = record.toEventData(objectMapper);

    assertThat(reconstructedEventData.entityType()).isEqualTo(originalEventData.entityType());
    assertThat(reconstructedEventData.entityId()).isEqualTo(originalEventData.entityId());
    assertThat(reconstructedEventData.storeNumber()).isEqualTo(originalEventData.storeNumber());
    assertThat(reconstructedEventData.userId()).isEqualTo(originalEventData.userId());
    assertThat(reconstructedEventData.sessionId()).isEqualTo(originalEventData.sessionId());
    assertThat(reconstructedEventData.traceId()).isEqualTo(originalEventData.traceId());
    assertThat(reconstructedEventData.payload()).containsEntry("key1", "value1");
    assertThat(reconstructedEventData.payload()).containsEntry("key2", 42);
  }

  @Test
  void fromCloudEvent_stripsEventTypePrefix() {
    AuditEventData eventData =
        AuditEventData.builder().entityType("ORDER").entityId("order-123").storeNumber(100).build();

    CloudEvent cloudEvent =
        CloudEventBuilder.v1()
            .withId("event-prefix-test")
            .withType("org.example.audit.ORDER_CREATED")
            .withSource(URI.create("/order-service"))
            .withSubject("ORDER:order-123")
            .build();

    AuditRecord record = AuditRecord.fromCloudEvent(cloudEvent, eventData, objectMapper);

    // Should strip the "org.example.audit." prefix
    assertThat(record.getEventType()).isEqualTo("ORDER_CREATED");
  }

  @Test
  void fromCloudEvent_preservesNonPrefixedType() {
    AuditEventData eventData =
        AuditEventData.builder()
            .entityType("CUSTOM")
            .entityId("custom-123")
            .storeNumber(100)
            .build();

    CloudEvent cloudEvent =
        CloudEventBuilder.v1()
            .withId("event-no-prefix")
            .withType("CUSTOM_EVENT")
            .withSource(URI.create("/custom-service"))
            .withSubject("CUSTOM:custom-123")
            .build();

    AuditRecord record = AuditRecord.fromCloudEvent(cloudEvent, eventData, objectMapper);

    // Should preserve type as-is when no prefix
    assertThat(record.getEventType()).isEqualTo("CUSTOM_EVENT");
  }
}
