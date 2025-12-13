package org.example.order.consumer;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.cloudevents.CloudEvent;
import io.cloudevents.core.data.PojoCloudEventData;
import java.time.Duration;
import java.util.concurrent.atomic.AtomicBoolean;
import org.example.model.order.Order;
import org.example.platform.events.CloudEventSerializer;
import org.example.platform.events.EventConsumer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.SmartLifecycle;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.stereotype.Component;
import reactor.core.Disposable;
import reactor.core.publisher.Mono;

/**
 * Consumes OrderCompleted events from Redis Streams.
 *
 * <p>Implements SmartLifecycle for controlled startup/shutdown of the polling loop.
 */
@Component
public class OrderEventConsumer extends EventConsumer implements SmartLifecycle {

  private static final Logger log = LoggerFactory.getLogger(OrderEventConsumer.class);

  private final OrderEventProperties orderProperties;
  private final OrderEventHandler handler;
  private final ObjectMapper objectMapper;
  private final AtomicBoolean running = new AtomicBoolean(false);
  private Disposable subscription;

  public OrderEventConsumer(
      ReactiveRedisTemplate<String, String> redisTemplate,
      CloudEventSerializer serializer,
      OrderEventProperties properties,
      OrderEventHandler handler,
      ObjectMapper objectMapper) {
    super(redisTemplate, serializer, properties);
    this.orderProperties = properties;
    this.handler = handler;
    this.objectMapper = objectMapper;
  }

  @Override
  protected Mono<Void> handleEvent(CloudEvent event) {
    // Filter by event type
    if (!orderProperties.getOrderCompletedType().equals(event.getType())) {
      log.debug("Ignoring event type: {}", event.getType());
      return Mono.empty();
    }

    return Mono.defer(
        () -> {
          String eventId = event.getId();

          // Extract data from the event
          if (event.getData() == null) {
            log.warn("Event has no data: eventId={}", eventId);
            return Mono.empty();
          }

          try {
            // Parse the event data
            byte[] dataBytes;
            if (event.getData() instanceof PojoCloudEventData) {
              Object value = ((PojoCloudEventData<?>) event.getData()).getValue();
              dataBytes = objectMapper.writeValueAsBytes(value);
            } else {
              dataBytes = event.getData().toBytes();
            }

            JsonNode root = objectMapper.readTree(dataBytes);
            String checkoutSessionId =
                root.has("checkoutSessionId") ? root.get("checkoutSessionId").asText() : null;

            JsonNode orderNode = root.get("order");
            if (orderNode == null) {
              log.warn("Event data has no order: eventId={}", eventId);
              return Mono.empty();
            }

            Order order = objectMapper.treeToValue(orderNode, Order.class);
            return handler.handleOrderCompleted(checkoutSessionId, order, eventId);

          } catch (Exception e) {
            log.error("Failed to parse event data: eventId={}, error={}", eventId, e.getMessage());
            return Mono.error(e);
          }
        });
  }

  @Override
  public void start() {
    if (running.compareAndSet(false, true)) {
      log.info("Starting order event consumer");

      // Initialize consumer group and start polling
      subscription =
          initializeConsumerGroup()
              .thenMany(
                  reactor.core.publisher.Flux.interval(
                          Duration.ZERO, orderProperties.getPollInterval())
                      .flatMap(tick -> readEvents())
                      .flatMap(this::processRecord)
                      .onErrorContinue(
                          (e, o) -> log.error("Error in consumer loop: {}", e.getMessage())))
              .subscribe();

      log.info("Order event consumer started");
    }
  }

  @Override
  public void stop() {
    if (running.compareAndSet(true, false)) {
      log.info("Stopping order event consumer");
      if (subscription != null && !subscription.isDisposed()) {
        subscription.dispose();
      }
      log.info("Order event consumer stopped");
    }
  }

  @Override
  public boolean isRunning() {
    return running.get();
  }

  @Override
  public int getPhase() {
    // Start late, stop early
    return Integer.MAX_VALUE - 100;
  }
}
