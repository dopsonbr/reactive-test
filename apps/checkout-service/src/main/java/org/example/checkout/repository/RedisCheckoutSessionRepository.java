package org.example.checkout.repository;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Duration;
import java.time.Instant;
import org.example.checkout.service.CheckoutService.CheckoutSession;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Mono;

/**
 * Redis implementation of CheckoutSessionRepository.
 *
 * <p>Stores checkout sessions as JSON strings with automatic TTL-based expiration. Sessions are
 * stored under the key pattern: checkout:session:{sessionId}
 */
@Repository
public class RedisCheckoutSessionRepository implements CheckoutSessionRepository {

  private static final Logger log = LoggerFactory.getLogger(RedisCheckoutSessionRepository.class);
  private static final String KEY_PREFIX = "checkout:session:";
  private static final Duration DEFAULT_TTL = Duration.ofMinutes(20);

  private final ReactiveRedisTemplate<String, String> redisTemplate;
  private final ObjectMapper objectMapper;

  public RedisCheckoutSessionRepository(
      ReactiveRedisTemplate<String, String> redisTemplate, ObjectMapper objectMapper) {
    this.redisTemplate = redisTemplate;
    this.objectMapper = objectMapper;
  }

  @Override
  public Mono<Void> save(CheckoutSession session) {
    String key = buildKey(session.sessionId());

    return Mono.fromCallable(() -> serialize(session))
        .flatMap(
            json -> {
              // Calculate TTL based on session expiration
              Duration ttl = calculateTtl(session.expiresAt());
              return redisTemplate.opsForValue().set(key, json, ttl);
            })
        .doOnSuccess(result -> log.debug("Saved checkout session: {}", session.sessionId()))
        .doOnError(e -> log.error("Failed to save checkout session: {}", session.sessionId(), e))
        .then();
  }

  @Override
  public Mono<CheckoutSession> findById(String sessionId) {
    String key = buildKey(sessionId);

    return redisTemplate
        .opsForValue()
        .get(key)
        .flatMap(
            json ->
                Mono.fromCallable(() -> deserialize(json))
                    .onErrorResume(
                        e -> {
                          log.error("Failed to deserialize checkout session: {}", sessionId, e);
                          return Mono.empty();
                        }))
        .doOnNext(session -> log.debug("Found checkout session: {}", sessionId))
        .switchIfEmpty(Mono.defer(() -> logSessionNotFound(sessionId)));
  }

  @Override
  public Mono<Void> deleteById(String sessionId) {
    String key = buildKey(sessionId);

    return redisTemplate
        .delete(key)
        .doOnSuccess(
            deleted ->
                log.debug("Deleted checkout session: {} (deleted={})", sessionId, deleted > 0))
        .then();
  }

  @Override
  public Mono<Boolean> exists(String sessionId) {
    String key = buildKey(sessionId);
    return redisTemplate.hasKey(key);
  }

  private String buildKey(String sessionId) {
    return KEY_PREFIX + sessionId;
  }

  private Duration calculateTtl(Instant expiresAt) {
    if (expiresAt == null) {
      return DEFAULT_TTL;
    }
    Duration ttl = Duration.between(Instant.now(), expiresAt);
    // Add a small buffer and ensure minimum TTL
    if (ttl.isNegative() || ttl.isZero()) {
      return Duration.ofMinutes(1); // Minimum 1 minute for cleanup
    }
    // Add 5 minute buffer to account for clock drift
    return ttl.plusMinutes(5);
  }

  private String serialize(CheckoutSession session) {
    try {
      return objectMapper.writeValueAsString(session);
    } catch (JsonProcessingException e) {
      throw new RuntimeException("Failed to serialize checkout session", e);
    }
  }

  private CheckoutSession deserialize(String json) {
    try {
      return objectMapper.readValue(json, CheckoutSession.class);
    } catch (JsonProcessingException e) {
      throw new RuntimeException("Failed to deserialize checkout session", e);
    }
  }

  private Mono<CheckoutSession> logSessionNotFound(String sessionId) {
    log.debug("Checkout session not found: {}", sessionId);
    return Mono.empty();
  }
}
