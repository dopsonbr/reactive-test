package org.example.platform.audit;

import reactor.core.publisher.Mono;

/**
 * Interface for publishing audit events as CloudEvents to a message queue.
 *
 * <p>Implementations should be non-blocking and handle failures gracefully without impacting the
 * main application flow.
 */
public interface AuditEventPublisher {

  /**
   * Publishes an audit event asynchronously (fire-and-forget).
   *
   * <p>Returns immediately; failures are logged but do not propagate to the caller. This is the
   * preferred method for most use cases where audit is fire-and-forget.
   *
   * @param eventType Event type (e.g., "CART_CREATED", "PRODUCT_ADDED")
   * @param data Audit event data payload
   * @return A Mono that completes when the publish operation finishes (success or failure)
   */
  Mono<Void> publish(String eventType, AuditEventData data);

  /**
   * Publishes an audit event and waits for acknowledgment.
   *
   * <p>Use when audit confirmation is required. Errors will propagate to the caller.
   *
   * @param eventType Event type (e.g., "CART_CREATED", "PRODUCT_ADDED")
   * @param data Audit event data payload
   * @return A Mono containing the record ID from the message queue
   */
  Mono<String> publishAndAwait(String eventType, AuditEventData data);
}
