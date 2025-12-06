package org.example.cart.pubsub;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.example.cart.event.CartEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.connection.ReactiveSubscription;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.data.redis.listener.ChannelTopic;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/** Subscribes to cart events from Redis Pub/Sub for GraphQL subscriptions. */
@Component
public class CartEventSubscriber {

  private static final Logger log = LoggerFactory.getLogger(CartEventSubscriber.class);
  private static final String CHANNEL_PREFIX = "cart:";
  private static final String CHANNEL_SUFFIX = ":events";

  private final ReactiveRedisTemplate<String, String> redisTemplate;
  private final ObjectMapper objectMapper;

  public CartEventSubscriber(
      ReactiveRedisTemplate<String, String> redisTemplate, ObjectMapper objectMapper) {
    this.redisTemplate = redisTemplate;
    this.objectMapper = objectMapper;
  }

  /**
   * Subscribe to events for a specific cart.
   *
   * @param cartId the cart ID to subscribe to
   * @return Flux of cart events (infinite until cancelled)
   */
  public Flux<CartEvent> subscribe(String cartId) {
    String channel = channel(cartId);
    return redisTemplate
        .listenTo(ChannelTopic.of(channel))
        .map(ReactiveSubscription.Message::getMessage)
        .flatMap(this::deserialize)
        .doOnSubscribe(s -> log.info("Subscribed to cart events: cartId={}", cartId))
        .doOnCancel(() -> log.info("Unsubscribed from cart events: cartId={}", cartId))
        .onErrorResume(
            e -> {
              log.warn("Error in cart subscription: cartId={}, error={}", cartId, e.getMessage());
              return Flux.empty();
            });
  }

  /**
   * Subscribe to all cart events for a store.
   *
   * @param storeNumber the store number
   * @return Flux of cart events for all carts in the store
   */
  public Flux<CartEvent> subscribeToStore(int storeNumber) {
    String channel = storeChannel(storeNumber);
    return redisTemplate
        .listenTo(ChannelTopic.of(channel))
        .map(ReactiveSubscription.Message::getMessage)
        .flatMap(this::deserialize)
        .doOnSubscribe(
            s -> log.info("Subscribed to store cart events: storeNumber={}", storeNumber))
        .doOnCancel(
            () -> log.info("Unsubscribed from store cart events: storeNumber={}", storeNumber))
        .onErrorResume(e -> Flux.empty());
  }

  private String channel(String cartId) {
    return CHANNEL_PREFIX + cartId + CHANNEL_SUFFIX;
  }

  private String storeChannel(int storeNumber) {
    return CHANNEL_PREFIX + "store:" + storeNumber + CHANNEL_SUFFIX;
  }

  private Mono<CartEvent> deserialize(String json) {
    return Mono.fromCallable(() -> objectMapper.readValue(json, CartEvent.class))
        .onErrorResume(
            JsonProcessingException.class,
            e -> {
              log.warn("Failed to deserialize cart event: {}", e.getMessage());
              return Mono.empty();
            });
  }
}
