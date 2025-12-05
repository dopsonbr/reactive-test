package org.example.audit.controller;

import java.time.Instant;
import org.example.audit.domain.TimeRange;
import org.example.audit.service.AuditService;
import org.example.platform.audit.AuditEvent;
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

  public AuditController(AuditService auditService) {
    this.auditService = auditService;
  }

  /**
   * Creates an audit event directly via API.
   *
   * <p>Note: The primary ingestion mechanism is via message queue. This endpoint is provided for
   * convenience and testing.
   */
  @PostMapping("/events")
  @ResponseStatus(HttpStatus.CREATED)
  public Mono<AuditEvent> createEvent(@RequestBody AuditEvent event) {
    log.info(
        "Creating audit event via API: eventType={}, entityId={}",
        event.eventType(),
        event.entityId());
    return auditService.save(event);
  }

  /** Gets an audit event by ID. */
  @GetMapping("/events/{eventId}")
  public Mono<AuditEvent> getEvent(@PathVariable String eventId) {
    return auditService
        .findById(eventId)
        .switchIfEmpty(Mono.error(new NotFoundException("Audit event not found: " + eventId)));
  }

  /** Gets audit events for a specific entity. */
  @GetMapping("/entities/{entityType}/{entityId}/events")
  public Flux<AuditEvent> getEventsForEntity(
      @PathVariable String entityType,
      @PathVariable String entityId,
      @RequestParam(required = false) Instant startTime,
      @RequestParam(required = false) Instant endTime,
      @RequestParam(required = false) String eventType,
      @RequestParam(defaultValue = "100") int limit) {
    TimeRange timeRange = new TimeRange(startTime, endTime);
    return auditService.findByEntity(entityType, entityId, timeRange, eventType, limit);
  }

  /** Gets audit events for a specific user. */
  @GetMapping("/users/{userId}/events")
  public Flux<AuditEvent> getEventsForUser(
      @PathVariable String userId,
      @RequestParam(required = false) Instant startTime,
      @RequestParam(required = false) Instant endTime,
      @RequestParam(defaultValue = "100") int limit) {
    TimeRange timeRange = new TimeRange(startTime, endTime);
    return auditService.findByUser(userId, timeRange, limit);
  }

  /** Gets audit events for a specific store and entity type. */
  @GetMapping("/stores/{storeNumber}/events")
  public Flux<AuditEvent> getEventsForStore(
      @PathVariable int storeNumber,
      @RequestParam String entityType,
      @RequestParam(required = false) Instant startTime,
      @RequestParam(required = false) Instant endTime,
      @RequestParam(required = false) String eventType,
      @RequestParam(defaultValue = "100") int limit) {
    TimeRange timeRange = new TimeRange(startTime, endTime);
    return auditService.findByStoreAndEntityType(
        storeNumber, entityType, timeRange, eventType, limit);
  }
}
