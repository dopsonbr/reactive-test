package org.example.audit.domain;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.util.Map;
import org.example.platform.audit.AuditEvent;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

/** Persisted audit record entity for R2DBC. */
@Table("audit_events")
public class AuditRecord {

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
   * Creates an AuditRecord from an AuditEvent.
   *
   * @param event The audit event
   * @param mapper ObjectMapper for JSON serialization
   * @return A new AuditRecord instance
   */
  public static AuditRecord fromEvent(AuditEvent event, ObjectMapper mapper) {
    String dataJson;
    try {
      dataJson = mapper.writeValueAsString(event.data());
    } catch (JsonProcessingException e) {
      dataJson = "{}";
    }
    AuditRecord record = new AuditRecord();
    record.eventId = event.eventId();
    record.eventType = event.eventType();
    record.entityType = event.entityType();
    record.entityId = event.entityId();
    record.storeNumber = event.storeNumber();
    record.userId = event.userId();
    record.sessionId = event.sessionId();
    record.traceId = event.traceId();
    record.createdAt = event.timestamp();
    record.data = dataJson;
    return record;
  }

  /**
   * Converts this record to an AuditEvent.
   *
   * @param mapper ObjectMapper for JSON deserialization
   * @return The corresponding AuditEvent
   */
  @SuppressWarnings("unchecked")
  public AuditEvent toEvent(ObjectMapper mapper) {
    Map<String, Object> dataMap;
    try {
      dataMap = mapper.readValue(data, Map.class);
    } catch (JsonProcessingException e) {
      dataMap = Map.of();
    }
    return new AuditEvent(
        eventId,
        eventType,
        entityType,
        entityId,
        storeNumber,
        userId,
        sessionId,
        traceId,
        createdAt,
        dataMap);
  }

  // Getters and setters

  public String getEventId() {
    return eventId;
  }

  public void setEventId(String eventId) {
    this.eventId = eventId;
  }

  public String getEventType() {
    return eventType;
  }

  public void setEventType(String eventType) {
    this.eventType = eventType;
  }

  public String getEntityType() {
    return entityType;
  }

  public void setEntityType(String entityType) {
    this.entityType = entityType;
  }

  public String getEntityId() {
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
