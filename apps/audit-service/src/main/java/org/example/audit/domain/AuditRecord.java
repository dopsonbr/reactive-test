package org.example.audit.domain;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.cloudevents.CloudEvent;
import java.time.Instant;
import java.util.Map;
import org.example.platform.audit.AuditEventData;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

/** Persisted audit record entity for R2DBC. */
@Table("audit_events")
public class AuditRecord {

  private static final String EVENT_TYPE_PREFIX = "org.example.audit.";

  @Id
  @Column("event_id")
  private String eventId;

  @Column("event_type")
  private String eventType;

  @Column("entity_type")
  private String entityType;

  @Column("entity_id")
  private String entityId;

  @Column("store_number")
  private int storeNumber;

  @Column("user_id")
  private String userId;

  @Column("session_id")
  private String sessionId;

  @Column("trace_id")
  private String traceId;

  @Column("created_at")
  private Instant createdAt;

  @Column("data")
  private String data; // JSON string (JSONB in PostgreSQL)

  /** Default constructor for R2DBC. */
  public AuditRecord() {}

  /**
   * Creates an AuditRecord from a CloudEvent and AuditEventData.
   *
   * @param event The CloudEvent envelope
   * @param eventData The audit event data payload
   * @param mapper ObjectMapper for JSON serialization
   * @return A new AuditRecord instance
   */
  public static AuditRecord fromCloudEvent(
      CloudEvent event, AuditEventData eventData, ObjectMapper mapper) {
    String dataJson;
    try {
      dataJson = mapper.writeValueAsString(eventData.payload());
    } catch (JsonProcessingException e) {
      dataJson = "{}";
    }

    AuditRecord record = new AuditRecord();
    record.eventId = event.getId();
    record.eventType = extractEventType(event.getType());
    record.entityType = eventData.entityType();
    record.entityId = eventData.entityId();
    record.storeNumber = eventData.storeNumber();
    record.userId = eventData.userId();
    record.sessionId = eventData.sessionId();
    record.traceId = eventData.traceId();
    record.createdAt = event.getTime() != null ? event.getTime().toInstant() : Instant.now();
    record.data = dataJson;
    return record;
  }

  /**
   * Extracts the short event type from the full CloudEvent type.
   *
   * @param fullType Full type (e.g., "org.example.audit.CART_CREATED")
   * @return Short type (e.g., "CART_CREATED")
   */
  private static String extractEventType(String fullType) {
    if (fullType != null && fullType.startsWith(EVENT_TYPE_PREFIX)) {
      return fullType.substring(EVENT_TYPE_PREFIX.length());
    }
    return fullType;
  }

  /**
   * Converts this record to an AuditEventData for API responses.
   *
   * @param mapper ObjectMapper for JSON deserialization
   * @return The corresponding AuditEventData
   */
  @SuppressWarnings("unchecked")
  public AuditEventData toEventData(ObjectMapper mapper) {
    Map<String, Object> dataMap;
    try {
      dataMap = mapper.readValue(data, Map.class);
    } catch (JsonProcessingException e) {
      dataMap = Map.of();
    }
    return new AuditEventData(
        entityType, entityId, storeNumber, userId, sessionId, traceId, dataMap);
  }

  // Getters and setters

  public String getEventId() {
    return eventId;
  }

  public String eventId() {
    return eventId;
  }

  public void setEventId(String eventId) {
    this.eventId = eventId;
  }

  public String getEventType() {
    return eventType;
  }

  public String eventType() {
    return eventType;
  }

  public void setEventType(String eventType) {
    this.eventType = eventType;
  }

  public String getEntityType() {
    return entityType;
  }

  public String entityType() {
    return entityType;
  }

  public void setEntityType(String entityType) {
    this.entityType = entityType;
  }

  public String getEntityId() {
    return entityId;
  }

  public String entityId() {
    return entityId;
  }

  public void setEntityId(String entityId) {
    this.entityId = entityId;
  }

  public int getStoreNumber() {
    return storeNumber;
  }

  public void setStoreNumber(int storeNumber) {
    this.storeNumber = storeNumber;
  }

  public String getUserId() {
    return userId;
  }

  public void setUserId(String userId) {
    this.userId = userId;
  }

  public String getSessionId() {
    return sessionId;
  }

  public void setSessionId(String sessionId) {
    this.sessionId = sessionId;
  }

  public String getTraceId() {
    return traceId;
  }

  public void setTraceId(String traceId) {
    this.traceId = traceId;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(Instant createdAt) {
    this.createdAt = createdAt;
  }

  public String getData() {
    return data;
  }

  public void setData(String data) {
    this.data = data;
  }
}
