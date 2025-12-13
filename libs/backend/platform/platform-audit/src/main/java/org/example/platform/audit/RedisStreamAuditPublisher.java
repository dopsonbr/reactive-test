package org.example.platform.audit;

import io.cloudevents.CloudEvent;
import java.net.URI;
import java.util.Map;
import org.example.platform.events.CloudEventSerializer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.connection.stream.RecordId;
import org.springframework.data.redis.connection.stream.StreamRecords;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import reactor.core.publisher.Mono;

/**
 * Redis Streams implementation of AuditEventPublisher using CloudEvents format.
 *
 * <p>Publishes audit events as CloudEvents to a Redis Stream for consumption by the audit-service.
 */
public class RedisStreamAuditPublisher implements AuditEventPublisher {

  private static final Logger log = LoggerFactory.getLogger(RedisStreamAuditPublisher.class);

  private final ReactiveRedisTemplate<String, String> redisTemplate;
  private final CloudEventSerializer serializer;
  private final AuditProperties properties;
  private final URI source;

  public RedisStreamAuditPublisher(
      ReactiveRedisTemplate<String, String> redisTemplate,
      CloudEventSerializer serializer,
      AuditProperties properties,
      URI source) {
    this.redisTemplate = redisTemplate;
    this.serializer = serializer;
    this.properties = properties;
    this.source = source;
  }

  @Override
  public Mono<Void> publish(String eventType, AuditEventData data) {
    return publishInternal(eventType, data)
        .then()
        .onErrorResume(
            e -> {
              log.warn(
                  "Failed to publish audit event: eventType={}, entityId={}, error={}",
                  eventType,
                  data.entityId(),
                  e.getMessage());
              return Mono.empty();
            });
  }

  @Override
  public Mono<String> publishAndAwait(String eventType, AuditEventData data) {
    return publishInternal(eventType, data)
        .map(RecordId::getValue)
        .timeout(properties.publishTimeout())
        .doOnSuccess(
            recordId ->
                log.debug("Published audit event: eventType={}, recordId={}", eventType, recordId))
        .doOnError(
            e ->
                log.error(
                    "Failed to publish audit event: eventType={}, entityId={}, error={}",
                    eventType,
                    data.entityId(),
                    e.getMessage()));
  }

  private Mono<RecordId> publishInternal(String eventType, AuditEventData data) {
    return Mono.defer(
        () -> {
          String type = "org.example.audit." + eventType;
          String subject = data.entityType() + ":" + data.entityId();

          CloudEvent cloudEvent = serializer.buildEvent(type, source, subject, data);
          String payload = serializer.serialize(cloudEvent);

          Map<String, String> fields =
              Map.of(
                  "eventId",
                  cloudEvent.getId(),
                  "eventType",
                  cloudEvent.getType(),
                  "payload",
                  payload);

          return redisTemplate
              .opsForStream()
              .add(StreamRecords.newRecord().in(properties.streamKey()).ofMap(fields));
        });
  }
}
