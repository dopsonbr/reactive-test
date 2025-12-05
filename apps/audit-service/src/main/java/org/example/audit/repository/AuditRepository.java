package org.example.audit.repository;

import org.example.audit.domain.TimeRange;
import org.example.platform.audit.AuditEvent;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/** Repository interface for audit event storage and retrieval. */
public interface AuditRepository {

  /**
   * Saves an audit event to the database.
   *
   * @param event The audit event to save
   * @return The saved audit event
   */
  Mono<AuditEvent> save(AuditEvent event);

  /**
   * Finds an audit event by its ID.
   *
   * @param eventId The event ID
   * @return The audit event if found
   */
  Mono<AuditEvent> findById(String eventId);

  /**
   * Finds audit events for a specific entity.
   *
   * @param entityType Type of entity
   * @param entityId Entity identifier
   * @param timeRange Time range filter
   * @param eventType Optional event type filter (null for all)
   * @param limit Maximum number of results
   * @return Flux of matching audit events
   */
  Flux<AuditEvent> findByEntity(
      String entityType, String entityId, TimeRange timeRange, String eventType, int limit);

  /**
   * Finds audit events by user.
   *
   * @param userId User identifier
   * @param timeRange Time range filter
   * @param limit Maximum number of results
   * @return Flux of matching audit events
   */
  Flux<AuditEvent> findByUser(String userId, TimeRange timeRange, int limit);

  /**
   * Finds audit events by store and entity type.
   *
   * @param storeNumber Store number
   * @param entityType Entity type filter
   * @param timeRange Time range filter
   * @param eventType Optional event type filter (null for all)
   * @param limit Maximum number of results
   * @return Flux of matching audit events
   */
  Flux<AuditEvent> findByStoreAndEntityType(
      int storeNumber, String entityType, TimeRange timeRange, String eventType, int limit);
}
