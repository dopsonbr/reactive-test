package org.example.reactivetest.cache;

import reactor.core.publisher.Mono;

import java.time.Duration;

/**
 * Reactive cache service for non-blocking Redis operations.
 * Handles serialization/deserialization and Redis connection failures gracefully.
 */
public interface ReactiveCacheService {

    /**
     * Get a value from cache.
     * Returns Mono.empty() on cache miss or Redis failure.
     */
    <T> Mono<T> get(String key, Class<T> type);

    /**
     * Put a value in cache with TTL.
     * Fails silently on Redis errors (does not propagate errors).
     */
    <T> Mono<Boolean> put(String key, T value, Duration ttl);

    /**
     * Delete a key from cache.
     */
    Mono<Boolean> delete(String key);
}
