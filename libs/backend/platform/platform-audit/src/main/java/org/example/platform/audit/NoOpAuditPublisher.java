package org.example.platform.audit;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import reactor.core.publisher.Mono;

/**
 * No-op implementation of AuditEventPublisher for use when auditing is disabled.
 *
 * <p>Logs audit events at debug level without actually publishing them.
 */
public class NoOpAuditPublisher implements AuditEventPublisher {

  private static final Logger log = LoggerFactory.getLogger(NoOpAuditPublisher.class);

  @Override
  public Mono<Void> publish(String eventType, AuditEventData data) {
    return Mono.fromRunnable(
        () ->
            log.debug(
                "Audit event (disabled): eventType={}, entityId={}", eventType, data.entityId()));
  }

  @Override
  public Mono<String> publishAndAwait(String eventType, AuditEventData data) {
    log.debug("Audit event (disabled): eventType={}, entityId={}", eventType, data.entityId());
    return Mono.just("noop");
  }
}
