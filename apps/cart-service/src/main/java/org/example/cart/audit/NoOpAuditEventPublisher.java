package org.example.cart.audit;

import org.example.platform.logging.StructuredLogger;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

/**
 * No-op implementation of AuditEventPublisher. Logs audit events locally until 009_AUDIT_DATA is
 * implemented.
 */
@Component
@ConditionalOnProperty(name = "audit.enabled", havingValue = "false", matchIfMissing = true)
public class NoOpAuditEventPublisher implements AuditEventPublisher {

  private static final String LOGGER_NAME = "audit";

  private final StructuredLogger structuredLogger;

  public NoOpAuditEventPublisher(StructuredLogger structuredLogger) {
    this.structuredLogger = structuredLogger;
  }

  @Override
  public Mono<Void> publish(AuditEvent event) {
    return Mono.deferContextual(
        ctx -> {
          structuredLogger.logMessage(
              ctx,
              LOGGER_NAME,
              String.format(
                  "Audit event (no-op): %s for %s [store=%d]",
                  event.eventType(), event.entityId(), event.storeNumber()));
          return Mono.empty();
        });
  }
}
