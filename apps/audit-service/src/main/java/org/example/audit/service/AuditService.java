package org.example.audit.service;

import org.example.audit.domain.TimeRange;
import org.example.audit.repository.AuditRepository;
import org.example.platform.audit.AuditEvent;
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
   * Saves an audit event.
   *
   * @param event The audit event to save
   * @return The saved audit event
   */
  public Mono<AuditEvent> save(AuditEvent event) {
    return auditRepository
        .save(event)
        .doOnSuccess(
            e ->
                log.debug(
                    "Saved audit event via API: eventId={}, eventType={}",
                    e.eventId(),
                    e.eventType()));
  }

  /**
   * Finds an audit event by ID.
   *
   * @param eventId The event ID
   * @return The audit event if found
   */
  public Mono<AuditEvent> findById(String eventId) {
    return auditRepository.findById(eventId);
  }

  /**
   * Finds audit events for a specific entity.
   *
   * @param entityType Type of entity
   * @param entityId Entity identifier
   * @param timeRange Time range filter
   * @param eventType Optional event type filter
   * @param limit Maximum number of results
   * @return Flux of matching audit events
   */
  public Flux<AuditEvent> findByEntity(
      String entityType, String entityId, TimeRange timeRange, String eventType, int limit) {
    return auditRepository.findByEntity(
        entityType, entityId, normalizeTimeRange(timeRange), eventType, normalizeLimit(limit));
  }

  /**
   * Finds audit events by user.
   *
   * @param userId User identifier
   * @param timeRange Time range filter
   * @param limit Maximum number of results
   * @return Flux of matching audit events
   */
  public Flux<AuditEvent> findByUser(String userId, TimeRange timeRange, int limit) {
    return auditRepository.findByUser(userId, normalizeTimeRange(timeRange), normalizeLimit(limit));
  }

  /**
   * Finds audit events by store and entity type.
   *
   * @param storeNumber Store number
   * @param entityType Entity type filter
   * @param timeRange Time range filter
   * @param eventType Optional event type filter
   * @param limit Maximum number of results
   * @return Flux of matching audit events
   */
  public Flux<AuditEvent> findByStoreAndEntityType(
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
