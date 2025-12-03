package org.example.platform.webflux.context;

/**
 * Request metadata propagated through Reactor Context. Contains information about the originating
 * request.
 */
public record RequestMetadata(
        int storeNumber, String orderNumber, String userId, String sessionId) {}
