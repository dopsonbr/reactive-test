package org.example.platform.cache;

import java.time.Duration;
import reactor.core.publisher.Mono;

/**
 * Reactive cache service for non-blocking Redis operations. Handles serialization/deserialization
 * and Redis connection failures gracefully.
 */
public interface ReactiveCacheService {

    /**
     * Get a value from cache. Returns Mono.empty() on cache miss or Redis failure.
     *
     * @param key the cache key
     * @param type the class type to deserialize to
     * @param <T> the type of the cached value
     * @return a Mono containing the cached value, or empty if not found
     */
    <T> Mono<T> get(String key, Class<T> type);

    /**
     * Put a value in cache with TTL. Fails silently on Redis errors (does not propagate errors).
     *
     * @param key the cache key
     * @param value the value to cache
     * @param ttl the time-to-live duration
     * @param <T> the type of the value
     * @return a Mono indicating success (true) or failure (false)
     */
    <T> Mono<Boolean> put(String key, T value, Duration ttl);

    /**
     * Delete a key from cache.
     *
     * @param key the cache key to delete
     * @return a Mono indicating if the key was deleted
     */
    Mono<Boolean> delete(String key);
}
