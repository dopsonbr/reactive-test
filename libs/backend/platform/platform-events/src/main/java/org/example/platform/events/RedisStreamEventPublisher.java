package org.example.platform.events;

import io.cloudevents.CloudEvent;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.connection.stream.RecordId;
import org.springframework.data.redis.connection.stream.StreamRecords;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import reactor.core.publisher.Mono;

/** Redis Streams implementation of CloudEventPublisher. */
public class RedisStreamEventPublisher implements CloudEventPublisher {

  private static final Logger log = LoggerFactory.getLogger(RedisStreamEventPublisher.class);

  private final ReactiveRedisTemplate<String, String> redisTemplate;
  private final CloudEventSerializer serializer;
  private final EventStreamProperties properties;

  public RedisStreamEventPublisher(
      ReactiveRedisTemplate<String, String> redisTemplate,
      CloudEventSerializer serializer,
      EventStreamProperties properties) {
    this.redisTemplate = redisTemplate;
    this.serializer = serializer;
    this.properties = properties;
  }

  @Override
  public Mono<Void> publish(CloudEvent event) {
    return publishInternal(event)
        .then()
        .onErrorResume(
            e -> {
              log.warn(
                  "Failed to publish event: type={}, id={}, error={}",
                  event.getType(),
                  event.getId(),
                  e.getMessage());
              return Mono.empty();
            });
  }

  @Override
  public Mono<String> publishAndAwait(CloudEvent event) {
    return publishInternal(event)
        .map(RecordId::getValue)
        .timeout(properties.getPublishTimeout())
        .doOnSuccess(
            recordId ->
                log.debug(
                    "Published event: type={}, id={}, recordId={}",
                    event.getType(),
                    event.getId(),
                    recordId))
        .doOnError(
            e ->
                log.error(
                    "Failed to publish event: type={}, id={}, error={}",
                    event.getType(),
                    event.getId(),
                    e.getMessage()));
  }

  private Mono<RecordId> publishInternal(CloudEvent event) {
    return Mono.defer(
        () -> {
          String json = serializer.serialize(event);
          Map<String, String> fields =
              Map.of("eventId", event.getId(), "eventType", event.getType(), "payload", json);

          return redisTemplate
              .opsForStream()
              .add(StreamRecords.newRecord().in(properties.getStreamKey()).ofMap(fields));
        });
  }
}
