package org.example.audit.repository;

import org.example.audit.domain.AuditRecord;
import org.example.audit.domain.TimeRange;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/** Repository interface for audit event storage and retrieval. */
public interface AuditRepository {

  /**
   * Saves an audit record to the database.
   *
   * @param record The audit record to save
   * @return The saved audit record with generated ID
   */
  Mono<AuditRecord> saveRecord(AuditRecord record);

  /**
   * Finds an audit record by its event ID.
   *
   * @param eventId The event ID
   * @return The audit record if found
   */
  Mono<AuditRecord> findByEventId(String eventId);

  /**
   * Finds audit records for a specific entity.
   *
   * @param entityType Type of entity
   * @param entityId Entity identifier
   * @param timeRange Time range filter
   * @param eventType Optional event type filter (null for all)
   * @param limit Maximum number of results
   * @return Flux of matching audit records
   */
  Flux<AuditRecord> findByEntity(
      String entityType, String entityId, TimeRange timeRange, String eventType, int limit);

  /**
   * Finds audit records by user.
   *
   * @param userId User identifier
   * @param timeRange Time range filter
   * @param limit Maximum number of results
   * @return Flux of matching audit records
   */
  Flux<AuditRecord> findByUser(String userId, TimeRange timeRange, int limit);

  /**
   * Finds audit records by store and entity type.
   *
   * @param storeNumber Store number
   * @param entityType Entity type filter
   * @param timeRange Time range filter
   * @param eventType Optional event type filter (null for all)
   * @param limit Maximum number of results
   * @return Flux of matching audit records
   */
  Flux<AuditRecord> findByStoreAndEntityType(
      int storeNumber, String entityType, TimeRange timeRange, String eventType, int limit);
}
