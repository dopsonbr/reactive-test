package org.example.audit.domain;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import java.time.Instant;
import java.util.Map;
import org.example.platform.audit.AuditEvent;
import org.example.platform.audit.AuditEventType;
import org.example.platform.audit.EntityType;
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
    void fromEvent_copiesAllFields() {
        Instant timestamp = Instant.parse("2024-06-15T10:30:00Z");
        Map<String, Object> data = Map.of("items", 3, "total", 99.99);

        AuditEvent event =
                new AuditEvent(
                        "event-123",
                        AuditEventType.CART_CREATED,
                        EntityType.CART,
                        "cart-456",
                        100,
                        "user01",
                        "session-uuid",
                        "trace-uuid",
                        timestamp,
                        data);

        AuditRecord record = AuditRecord.fromEvent(event, objectMapper);

        assertThat(record.getEventId()).isEqualTo("event-123");
        assertThat(record.getEventType()).isEqualTo(AuditEventType.CART_CREATED);
        assertThat(record.getEntityType()).isEqualTo(EntityType.CART);
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
    void fromEvent_withEmptyData_serializesEmptyJson() {
        AuditEvent event =
                new AuditEvent(
                        "event-empty",
                        AuditEventType.CART_DELETED,
                        EntityType.CART,
                        "cart-789",
                        200,
                        "user02",
                        null,
                        null,
                        Instant.now(),
                        Map.of());

        AuditRecord record = AuditRecord.fromEvent(event, objectMapper);

        assertThat(record.getData()).isEqualTo("{}");
    }

    @Test
    void toEvent_reconstructsEvent() {
        Instant timestamp = Instant.parse("2024-06-15T10:30:00Z");

        AuditRecord record = new AuditRecord();
        record.setEventId("event-456");
        record.setEventType(AuditEventType.PRODUCT_ADDED);
        record.setEntityType(EntityType.CART);
        record.setEntityId("cart-789");
        record.setStoreNumber(300);
        record.setUserId("user03");
        record.setSessionId("session-123");
        record.setTraceId("trace-123");
        record.setCreatedAt(timestamp);
        record.setData("{\"sku\":\"ABC123\",\"quantity\":2}");

        AuditEvent event = record.toEvent(objectMapper);

        assertThat(event.eventId()).isEqualTo("event-456");
        assertThat(event.eventType()).isEqualTo(AuditEventType.PRODUCT_ADDED);
        assertThat(event.entityType()).isEqualTo(EntityType.CART);
        assertThat(event.entityId()).isEqualTo("cart-789");
        assertThat(event.storeNumber()).isEqualTo(300);
        assertThat(event.userId()).isEqualTo("user03");
        assertThat(event.sessionId()).isEqualTo("session-123");
        assertThat(event.traceId()).isEqualTo("trace-123");
        assertThat(event.timestamp()).isEqualTo(timestamp);
        assertThat(event.data()).containsEntry("sku", "ABC123");
        assertThat(event.data()).containsEntry("quantity", 2);
    }

    @Test
    void toEvent_withInvalidJson_returnsEmptyMap() {
        AuditRecord record = new AuditRecord();
        record.setEventId("event-invalid");
        record.setEventType(AuditEventType.CART_VIEWED);
        record.setEntityType(EntityType.CART);
        record.setEntityId("cart-invalid");
        record.setStoreNumber(400);
        record.setCreatedAt(Instant.now());
        record.setData("not valid json");

        AuditEvent event = record.toEvent(objectMapper);

        assertThat(event.data()).isEmpty();
    }

    @Test
    void roundTrip_preservesAllData() {
        Map<String, Object> originalData = Map.of("key1", "value1", "key2", 42);
        AuditEvent originalEvent =
                AuditEvent.create(
                        AuditEventType.CUSTOMER_SET,
                        EntityType.CART,
                        "cart-roundtrip",
                        500,
                        "user04",
                        "session-rt",
                        "trace-rt",
                        originalData);

        AuditRecord record = AuditRecord.fromEvent(originalEvent, objectMapper);
        AuditEvent reconstructedEvent = record.toEvent(objectMapper);

        assertThat(reconstructedEvent.eventId()).isEqualTo(originalEvent.eventId());
        assertThat(reconstructedEvent.eventType()).isEqualTo(originalEvent.eventType());
        assertThat(reconstructedEvent.entityType()).isEqualTo(originalEvent.entityType());
        assertThat(reconstructedEvent.entityId()).isEqualTo(originalEvent.entityId());
        assertThat(reconstructedEvent.storeNumber()).isEqualTo(originalEvent.storeNumber());
        assertThat(reconstructedEvent.userId()).isEqualTo(originalEvent.userId());
        assertThat(reconstructedEvent.sessionId()).isEqualTo(originalEvent.sessionId());
        assertThat(reconstructedEvent.traceId()).isEqualTo(originalEvent.traceId());
        assertThat(reconstructedEvent.data()).containsEntry("key1", "value1");
        assertThat(reconstructedEvent.data()).containsEntry("key2", 42);
    }
}
