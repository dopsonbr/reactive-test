package org.example.cart.audit;

import reactor.core.publisher.Mono;

/** Interface for publishing audit events. */
public interface AuditEventPublisher {

    /**
     * Publish an audit event.
     *
     * @param event the event to publish
     * @return completion signal
     */
    Mono<Void> publish(AuditEvent event);
}
