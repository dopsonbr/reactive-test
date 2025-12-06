package org.example.cart.pubsub;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.example.cart.event.CartEvent;
import org.example.platform.logging.StructuredLogger;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

/**
 * Publishes cart events to Redis Pub/Sub for real-time subscriptions.
 *
 * <p>Channel pattern: cart:{cartId}:events
 *
 * <p>Publishing is fire-and-forget; failures don't break mutations.
 */
@Component
public class CartEventPublisher {

  private static final String LOGGER_NAME = "CartEventPublisher";
  private static final String CHANNEL_PREFIX = "cart:";
  private static final String CHANNEL_SUFFIX = ":events";

  private final ReactiveRedisTemplate<String, String> redisTemplate;
  private final ObjectMapper objectMapper;
  private final StructuredLogger log;

  public CartEventPublisher(
      ReactiveRedisTemplate<String, String> redisTemplate,
      ObjectMapper objectMapper,
      StructuredLogger log) {
    this.redisTemplate = redisTemplate;
    this.objectMapper = objectMapper;
    this.log = log;
  }

  /**
   * Publish a cart event to subscribers.
   *
   * @param event the cart event to publish
   * @return Mono completing when published (or on error, silently)
   */
  public Mono<Void> publish(CartEvent event) {
    return Mono.deferContextual(
        ctx ->
            serialize(event)
                .flatMap(
                    json -> {
                      String channel = channel(event.cartId());
                      return redisTemplate.convertAndSend(channel, json);
                    })
                .doOnSuccess(
                    count ->
                        log.logMessage(
                            ctx,
                            LOGGER_NAME,
                            String.format(
                                "Published cart event: %s," + " cartId=%s, subscribers=%d",
                                event.eventType().name(), event.cartId(), count)))
                .doOnError(e -> log.logError(ctx, LOGGER_NAME, "redis", e))
                .onErrorResume(e -> Mono.empty())
                .then());
  }

  /** Publish to store-wide channel for admin subscriptions. */
  public Mono<Void> publishToStore(CartEvent event, int storeNumber) {
    return Mono.deferContextual(
        ctx ->
            serialize(event)
                .flatMap(
                    json -> {
                      String channel = storeChannel(storeNumber);
                      return redisTemplate.convertAndSend(channel, json);
                    })
                .onErrorResume(e -> Mono.empty())
                .then());
  }

  private String channel(String cartId) {
    return CHANNEL_PREFIX + cartId + CHANNEL_SUFFIX;
  }

  private String storeChannel(int storeNumber) {
    return CHANNEL_PREFIX + "store:" + storeNumber + CHANNEL_SUFFIX;
  }

  private Mono<String> serialize(CartEvent event) {
    return Mono.fromCallable(() -> objectMapper.writeValueAsString(event))
        .onErrorMap(
            JsonProcessingException.class,
            e -> new RuntimeException("Failed to serialize cart event", e));
  }
}
