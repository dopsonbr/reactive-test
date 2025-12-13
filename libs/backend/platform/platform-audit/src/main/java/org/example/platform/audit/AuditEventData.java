package org.example.platform.audit;

import java.util.Map;

/**
 * Audit event data payload for CloudEvents.
 *
 * <p>This record represents the domain-specific data carried in a CloudEvent. The CloudEvent
 * envelope provides: id, source, type, subject, time.
 *
 * @param entityType Type of entity (e.g., "CART", "ORDER")
 * @param entityId Entity identifier
 * @param storeNumber Store context
 * @param userId User who performed the action
 * @param sessionId Session context
 * @param traceId Distributed tracing ID
 * @param payload Event-specific data
 */
public record AuditEventData(
    String entityType,
    String entityId,
    int storeNumber,
    String userId,
    String sessionId,
    String traceId,
    Map<String, Object> payload) {

  public static AuditEventDataBuilder builder() {
    return new AuditEventDataBuilder();
  }

  /** Builder for constructing AuditEventData instances. */
  public static class AuditEventDataBuilder {
    private String entityType;
    private String entityId;
    private int storeNumber;
    private String userId;
    private String sessionId;
    private String traceId;
    private Map<String, Object> payload = Map.of();

    public AuditEventDataBuilder entityType(String entityType) {
      this.entityType = entityType;
      return this;
    }

    public AuditEventDataBuilder entityId(String entityId) {
      this.entityId = entityId;
      return this;
    }

    public AuditEventDataBuilder storeNumber(int storeNumber) {
      this.storeNumber = storeNumber;
      return this;
    }

    public AuditEventDataBuilder userId(String userId) {
      this.userId = userId;
      return this;
    }

    public AuditEventDataBuilder sessionId(String sessionId) {
      this.sessionId = sessionId;
      return this;
    }

    public AuditEventDataBuilder traceId(String traceId) {
      this.traceId = traceId;
      return this;
    }

    public AuditEventDataBuilder payload(Map<String, Object> payload) {
      this.payload = payload != null ? payload : Map.of();
      return this;
    }

    public AuditEventData build() {
      return new AuditEventData(
          entityType, entityId, storeNumber, userId, sessionId, traceId, payload);
    }
  }
}
