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
    public Mono<Void> publish(AuditEvent event) {
        return Mono.fromRunnable(
                () ->
                        log.debug(
                                "Audit event (disabled): eventType={}, entityId={}",
                                event.eventType(),
                                event.entityId()));
    }

    @Override
    public Mono<String> publishAndAwait(AuditEvent event) {
        log.debug(
                "Audit event (disabled): eventType={}, entityId={}",
                event.eventType(),
                event.entityId());
        return Mono.just("noop-" + event.eventId());
    }
}
