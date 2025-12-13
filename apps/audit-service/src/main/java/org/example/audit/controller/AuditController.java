package org.example.audit.controller;

import java.time.Instant;
import org.example.audit.domain.AuditRecord;
import org.example.audit.domain.TimeRange;
import org.example.audit.service.AuditService;
import org.example.audit.validation.AuditRequestValidator;
import org.example.platform.error.NotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/** REST controller for audit event operations. */
@RestController
@RequestMapping("/audit")
public class AuditController {

  private static final Logger log = LoggerFactory.getLogger(AuditController.class);

  private final AuditService auditService;
  private final AuditRequestValidator validator;

  public AuditController(AuditService auditService, AuditRequestValidator validator) {
    this.auditService = auditService;
    this.validator = validator;
  }

  /**
   * Creates an audit record directly via API.
   *
   * <p>Note: The primary ingestion mechanism is via Redis streams. This endpoint is provided for
   * convenience and testing.
   */
  @PostMapping("/events")
  @ResponseStatus(HttpStatus.CREATED)
  public Mono<AuditRecord> createEvent(@RequestBody AuditRecord record) {
    return validator
        .validateAuditRecord(record)
        .then(
            Mono.defer(
                () -> {
                  log.info(
                      "Creating audit record via API: eventType={}, entityId={}",
                      record.eventType(),
                      record.entityId());
                  return auditService.save(record);
                }));
  }

  /** Gets an audit record by event ID. */
  @GetMapping("/events/{eventId}")
  public Mono<AuditRecord> getEvent(@PathVariable String eventId) {
    return validator
        .validateEventId(eventId)
        .then(auditService.findByEventId(eventId))
        .switchIfEmpty(Mono.error(new NotFoundException("Audit record not found: " + eventId)));
  }

  /** Gets audit records for a specific entity. */
  @GetMapping("/entities/{entityType}/{entityId}/events")
  public Flux<AuditRecord> getEventsForEntity(
      @PathVariable String entityType,
      @PathVariable String entityId,
      @RequestParam(required = false) Instant startTime,
      @RequestParam(required = false) Instant endTime,
      @RequestParam(required = false) String eventType,
      @RequestParam(defaultValue = "100") int limit) {
    TimeRange timeRange = new TimeRange(startTime, endTime);
    return validator
        .validateEntityQuery(entityType, entityId, limit)
        .thenMany(auditService.findByEntity(entityType, entityId, timeRange, eventType, limit));
  }

  /** Gets audit records for a specific user. */
  @GetMapping("/users/{userId}/events")
  public Flux<AuditRecord> getEventsForUser(
      @PathVariable String userId,
      @RequestParam(required = false) Instant startTime,
      @RequestParam(required = false) Instant endTime,
      @RequestParam(defaultValue = "100") int limit) {
    TimeRange timeRange = new TimeRange(startTime, endTime);
    return validator
        .validateUserQuery(userId, limit)
        .thenMany(auditService.findByUser(userId, timeRange, limit));
  }

  /** Gets audit records for a specific store and entity type. */
  @GetMapping("/stores/{storeNumber}/events")
  public Flux<AuditRecord> getEventsForStore(
      @PathVariable int storeNumber,
      @RequestParam String entityType,
      @RequestParam(required = false) Instant startTime,
      @RequestParam(required = false) Instant endTime,
      @RequestParam(required = false) String eventType,
      @RequestParam(defaultValue = "100") int limit) {
    TimeRange timeRange = new TimeRange(startTime, endTime);
    return validator
        .validateStoreQuery(storeNumber, entityType, limit)
        .thenMany(
            auditService.findByStoreAndEntityType(
                storeNumber, entityType, timeRange, eventType, limit));
  }
}
