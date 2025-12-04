package org.example.cart.audit;

import java.time.Instant;
import java.util.Map;

/**
 * Audit event structure for tracking cart operations.
 *
 * @param eventId unique event identifier (UUID)
 * @param eventType the type of event (e.g., CART_CREATED, PRODUCT_ADDED)
 * @param entityType the type of entity (e.g., CART)
 * @param entityId the entity identifier (e.g., cartId)
 * @param storeNumber the store context
 * @param userId the user from request context
 * @param sessionId the session from request context
 * @param timestamp when the event occurred
 * @param data event-specific payload
 */
public record AuditEvent(
        String eventId,
        String eventType,
        String entityType,
        String entityId,
        int storeNumber,
        String userId,
        String sessionId,
        Instant timestamp,
        Map<String, Object> data) {
    /**
     * Create a new cart audit event.
     *
     * @param eventType the event type
     * @param cartId the cart ID
     * @param storeNumber the store number
     * @param userId the user ID
     * @param sessionId the session ID
     * @param data the event data
     * @return the audit event
     */
    public static AuditEvent cartEvent(
            String eventType,
            String cartId,
            int storeNumber,
            String userId,
            String sessionId,
            Map<String, Object> data) {
        return new AuditEvent(
                java.util.UUID.randomUUID().toString(),
                eventType,
                "CART",
                cartId,
                storeNumber,
                userId,
                sessionId,
                Instant.now(),
                data);
    }
}
