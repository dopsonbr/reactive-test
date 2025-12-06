package org.example.platform.audit;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * Audit event structure for capturing system events.
 *
 * <p>Events are published to a message queue and consumed by the audit-service for persistent
 * storage and querying.
 *
 * @param eventId Unique identifier for this event (UUID)
 * @param eventType Type of event (e.g., "CART_CREATED", "PRODUCT_ADDED")
 * @param entityType Type of entity involved (e.g., "CART", "PRODUCT", "ORDER")
 * @param entityId Identifier of the entity (e.g., cartId, orderId)
 * @param storeNumber Store context for the event
 * @param userId User who performed the action
 * @param sessionId Session context
 * @param traceId Distributed tracing ID for correlation
 * @param timestamp When the event occurred
 * @param data Event-specific payload (JSON serializable)
 */
public record AuditEvent(
    String eventId,
    String eventType,
    String entityType,
    String entityId,
    int storeNumber,
    String userId,
    String sessionId,
    String traceId,
    Instant timestamp,
    Map<String, Object> data) {

  /**
   * Creates a new audit event with auto-generated eventId and current timestamp.
   *
   * @param eventType Type of event
   * @param entityType Type of entity
   * @param entityId Entity identifier
   * @param storeNumber Store number
   * @param userId User identifier
   * @param sessionId Session identifier
   * @param traceId Trace identifier for distributed tracing
   * @param data Event-specific data payload
   * @return A new AuditEvent instance
   */
  public static AuditEvent create(
      String eventType,
      String entityType,
      String entityId,
      int storeNumber,
      String userId,
      String sessionId,
      String traceId,
      Map<String, Object> data) {
    return new AuditEvent(
        UUID.randomUUID().toString(),
        eventType,
        entityType,
        entityId,
        storeNumber,
        userId,
        sessionId,
        traceId,
        Instant.now(),
        data != null ? data : Map.of());
  }

  /**
   * Creates a builder for constructing audit events with fluent API.
   *
   * @return A new AuditEventBuilder
   */
  public static AuditEventBuilder builder() {
    return new AuditEventBuilder();
  }

  /** Builder for constructing AuditEvent instances. */
  public static class AuditEventBuilder {
    private String eventType;
    private String entityType;
    private String entityId;
    private int storeNumber;
    private String userId;
    private String sessionId;
    private String traceId;
    private Map<String, Object> data = Map.of();

    public AuditEventBuilder eventType(String eventType) {
      this.eventType = eventType;
      return this;
    }

    public AuditEventBuilder entityType(String entityType) {
      this.entityType = entityType;
      return this;
    }

    public AuditEventBuilder entityId(String entityId) {
      this.entityId = entityId;
      return this;
    }

    public AuditEventBuilder storeNumber(int storeNumber) {
      this.storeNumber = storeNumber;
      return this;
    }

    public AuditEventBuilder userId(String userId) {
      this.userId = userId;
      return this;
    }

    public AuditEventBuilder sessionId(String sessionId) {
      this.sessionId = sessionId;
      return this;
    }

    public AuditEventBuilder traceId(String traceId) {
      this.traceId = traceId;
      return this;
    }

    public AuditEventBuilder data(Map<String, Object> data) {
      this.data = data;
      return this;
    }

    public AuditEvent build() {
      return AuditEvent.create(
          eventType, entityType, entityId, storeNumber, userId, sessionId, traceId, data);
    }
  }
}
