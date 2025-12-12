package org.example.platform.events;

import io.cloudevents.CloudEvent;
import java.time.Duration;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.connection.stream.Consumer;
import org.springframework.data.redis.connection.stream.MapRecord;
import org.springframework.data.redis.connection.stream.ReadOffset;
import org.springframework.data.redis.connection.stream.StreamOffset;
import org.springframework.data.redis.connection.stream.StreamReadOptions;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.util.retry.Retry;

/** Base class for CloudEvent consumers using Redis Streams. */
public abstract class EventConsumer {

  private static final Logger log = LoggerFactory.getLogger(EventConsumer.class);

  protected final ReactiveRedisTemplate<String, String> redisTemplate;
  protected final CloudEventSerializer serializer;
  protected final EventStreamProperties properties;

  protected EventConsumer(
      ReactiveRedisTemplate<String, String> redisTemplate,
      CloudEventSerializer serializer,
      EventStreamProperties properties) {
    this.redisTemplate = redisTemplate;
    this.serializer = serializer;
    this.properties = properties;
  }

  /**
   * Initialize the consumer group. Call this on startup.
   *
   * @return Mono completing when group is created
   */
  public Mono<Void> initializeConsumerGroup() {
    return redisTemplate
        .opsForStream()
        .createGroup(properties.getStreamKey(), properties.getConsumerGroup())
        .onErrorResume(
            e -> {
              if (e.getMessage() != null && e.getMessage().contains("BUSYGROUP")) {
                log.debug("Consumer group already exists: {}", properties.getConsumerGroup());
                return Mono.empty();
              }
              // Stream might not exist, create it
              return redisTemplate
                  .opsForStream()
                  .add(properties.getStreamKey(), Map.of("init", "true"))
                  .then(
                      redisTemplate
                          .opsForStream()
                          .createGroup(properties.getStreamKey(), properties.getConsumerGroup()))
                  .onErrorResume(e2 -> Mono.empty());
            })
        .then()
        .doOnSuccess(v -> log.info("Consumer group initialized: {}", properties.getConsumerGroup()));
  }

  /**
   * Read events from the stream.
   *
   * @return Flux of records
   */
  @SuppressWarnings("unchecked")
  public Flux<MapRecord<String, Object, Object>> readEvents() {
    return redisTemplate
        .opsForStream()
        .read(
            Consumer.from(properties.getConsumerGroup(), properties.getConsumerName()),
            StreamReadOptions.empty()
                .count(properties.getBatchSize())
                .block(Duration.ofMillis(50)),
            StreamOffset.create(properties.getStreamKey(), ReadOffset.lastConsumed()))
        .onErrorResume(
            e -> {
              log.warn("Failed to read from stream: {}", e.getMessage());
              return Flux.empty();
            });
  }

  /**
   * Process a single record. Deserializes the event, calls handler, and acknowledges.
   *
   * @param record the Redis stream record
   * @return Mono completing when processing is done
   */
  public Mono<Void> processRecord(MapRecord<String, Object, Object> record) {
    return Mono.defer(
        () -> {
          Map<Object, Object> values = record.getValue();
          String eventId = values.get("eventId") != null ? values.get("eventId").toString() : null;
          String payload = values.get("payload") != null ? values.get("payload").toString() : null;

          if (payload == null) {
            log.warn("Record has no payload: {}", record.getId());
            return acknowledge(record);
          }

          return parseAndHandle(eventId, payload, record);
        });
  }

  private Mono<Void> parseAndHandle(
      String eventId, String payload, MapRecord<String, Object, Object> record) {
    return Mono.defer(
            () -> {
              CloudEvent event = serializer.deserialize(payload);
              return handleEvent(event);
            })
        .retryWhen(
            Retry.backoff(properties.getMaxRetries(), properties.getRetryDelay())
                .filter(this::isRetryable)
                .doBeforeRetry(
                    signal ->
                        log.warn(
                            "Retrying event processing: eventId={}, attempt={}",
                            eventId,
                            signal.totalRetries() + 1)))
        .then(acknowledge(record))
        .doOnSuccess(v -> log.debug("Processed event: eventId={}", eventId))
        .onErrorResume(
            e -> {
              log.error("Failed to process event: eventId={}, error={}", eventId, e.getMessage());
              return handleDeadLetter(eventId, payload, e, record);
            });
  }

  /**
   * Handle a CloudEvent. Subclasses implement this to process events.
   *
   * @param event the CloudEvent
   * @return Mono completing when handling is done
   */
  protected abstract Mono<Void> handleEvent(CloudEvent event);

  /**
   * Determine if an error is retryable.
   *
   * @param e the error
   * @return true if should retry
   */
  protected boolean isRetryable(Throwable e) {
    String className = e.getClass().getName();
    return className.contains("TransientDataAccessException")
        || className.contains("R2dbcTransientResourceException")
        || className.contains("TimeoutException");
  }

  /**
   * Handle a permanently failed event.
   *
   * @param eventId event ID
   * @param payload original payload
   * @param error the error
   * @param record the record
   * @return Mono completing when dead letter handling is done
   */
  protected Mono<Void> handleDeadLetter(
      String eventId, String payload, Throwable error, MapRecord<String, Object, Object> record) {
    return redisTemplate
        .opsForStream()
        .add(
            properties.getDeadLetterStreamKey(),
            Map.of(
                "eventId", eventId != null ? eventId : "unknown",
                "payload", payload != null ? payload : "",
                "error", error.getMessage() != null ? error.getMessage() : "unknown",
                "errorClass", error.getClass().getName()))
        .doOnSuccess(id -> log.info("Moved to dead letter: eventId={}, dlqId={}", eventId, id))
        .then(acknowledge(record));
  }

  private Mono<Void> acknowledge(MapRecord<String, Object, Object> record) {
    return redisTemplate
        .opsForStream()
        .acknowledge(properties.getStreamKey(), properties.getConsumerGroup(), record.getId())
        .then();
  }
}
