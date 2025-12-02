package org.example.platform.cache;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import reactor.core.publisher.Mono;

import java.time.Duration;

/**
 * Redis implementation of ReactiveCacheService.
 * Fails silently on Redis errors to avoid cascading failures.
 *
 * <p>This bean is auto-configured by {@link RedisCacheAutoConfiguration}
 * when Redis is on the classpath.
 */
public class RedisCacheService implements ReactiveCacheService {

    private static final Logger log = LoggerFactory.getLogger(RedisCacheService.class);

    private final ReactiveRedisTemplate<String, Object> redisTemplate;
    private final ObjectMapper objectMapper;

    public RedisCacheService(
            ReactiveRedisTemplate<String, Object> redisTemplate,
            ObjectMapper objectMapper) {
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
    }

    @Override
    public <T> Mono<T> get(String key, Class<T> type) {
        return redisTemplate.opsForValue()
            .get(key)
            .flatMap(value -> {
                try {
                    T result = objectMapper.convertValue(value, type);
                    log.debug("Cache HIT for key: {}", key);
                    return Mono.just(result);
                } catch (Exception e) {
                    log.warn("Failed to deserialize cached value for key: {}", key, e);
                    return Mono.empty();
                }
            })
            .switchIfEmpty(Mono.defer(() -> {
                log.debug("Cache MISS for key: {}", key);
                return Mono.empty();
            }))
            .onErrorResume(e -> {
                log.warn("Redis GET failed for key: {}", key, e);
                return Mono.empty();
            });
    }

    @Override
    public <T> Mono<Boolean> put(String key, T value, Duration ttl) {
        return redisTemplate.opsForValue()
            .set(key, value, ttl)
            .doOnSuccess(success -> {
                if (Boolean.TRUE.equals(success)) {
                    log.debug("Cache PUT for key: {} with TTL: {}", key, ttl);
                }
            })
            .onErrorResume(e -> {
                log.warn("Redis SET failed for key: {}", key, e);
                return Mono.just(false);
            });
    }

    @Override
    public Mono<Boolean> delete(String key) {
        return redisTemplate.delete(key)
            .map(count -> count > 0)
            .doOnSuccess(deleted -> {
                if (Boolean.TRUE.equals(deleted)) {
                    log.debug("Cache DELETE for key: {}", key);
                }
            })
            .onErrorResume(e -> {
                log.warn("Redis DELETE failed for key: {}", key, e);
                return Mono.just(false);
            });
    }
}
