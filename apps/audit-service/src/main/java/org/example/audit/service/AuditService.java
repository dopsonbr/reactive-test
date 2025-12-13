package org.example.audit.service;

import org.example.audit.domain.AuditRecord;
import org.example.audit.domain.TimeRange;
import org.example.audit.repository.AuditRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/** Service layer for audit operations. */
@Service
public class AuditService {

  private static final Logger log = LoggerFactory.getLogger(AuditService.class);
  private static final int DEFAULT_LIMIT = 100;
  private static final int MAX_LIMIT = 1000;

  private final AuditRepository auditRepository;

  public AuditService(AuditRepository auditRepository) {
    this.auditRepository = auditRepository;
  }

  /**
   * Saves an audit record.
   *
   * @param record The audit record to save
   * @return The saved audit record
   */
  public Mono<AuditRecord> save(AuditRecord record) {
    return auditRepository
        .saveRecord(record)
        .doOnSuccess(
            r ->
                log.debug(
                    "Saved audit record via API: eventId={}, eventType={}",
                    r.eventId(),
                    r.eventType()));
  }

  /**
   * Finds an audit record by event ID.
   *
   * @param eventId The event ID
   * @return The audit record if found
   */
  public Mono<AuditRecord> findByEventId(String eventId) {
    return auditRepository.findByEventId(eventId);
  }

  /**
   * Finds audit records for a specific entity.
   *
   * @param entityType Type of entity
   * @param entityId Entity identifier
   * @param timeRange Time range filter
   * @param eventType Optional event type filter
   * @param limit Maximum number of results
   * @return Flux of matching audit records
   */
  public Flux<AuditRecord> findByEntity(
      String entityType, String entityId, TimeRange timeRange, String eventType, int limit) {
    return auditRepository.findByEntity(
        entityType, entityId, normalizeTimeRange(timeRange), eventType, normalizeLimit(limit));
  }

  /**
   * Finds audit records by user.
   *
   * @param userId User identifier
   * @param timeRange Time range filter
   * @param limit Maximum number of results
   * @return Flux of matching audit records
   */
  public Flux<AuditRecord> findByUser(String userId, TimeRange timeRange, int limit) {
    return auditRepository.findByUser(userId, normalizeTimeRange(timeRange), normalizeLimit(limit));
  }

  /**
   * Finds audit records by store and entity type.
   *
   * @param storeNumber Store number
   * @param entityType Entity type filter
   * @param timeRange Time range filter
   * @param eventType Optional event type filter
   * @param limit Maximum number of results
   * @return Flux of matching audit records
   */
  public Flux<AuditRecord> findByStoreAndEntityType(
      int storeNumber, String entityType, TimeRange timeRange, String eventType, int limit) {
    return auditRepository.findByStoreAndEntityType(
        storeNumber, entityType, normalizeTimeRange(timeRange), eventType, normalizeLimit(limit));
  }

  private int normalizeLimit(int limit) {
    if (limit <= 0) {
      return DEFAULT_LIMIT;
    }
    return Math.min(limit, MAX_LIMIT);
  }

  private TimeRange normalizeTimeRange(TimeRange timeRange) {
    return timeRange != null ? timeRange : TimeRange.unbounded();
  }
}
