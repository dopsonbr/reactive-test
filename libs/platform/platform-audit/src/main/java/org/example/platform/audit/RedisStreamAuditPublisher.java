package org.example.platform.audit;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.connection.stream.RecordId;
import org.springframework.data.redis.connection.stream.StreamRecords;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import reactor.core.publisher.Mono;

/**
 * Redis Streams implementation of AuditEventPublisher.
 *
 * <p>Publishes audit events to a Redis Stream for consumption by the audit-service.
 */
public class RedisStreamAuditPublisher implements AuditEventPublisher {

    private static final Logger log = LoggerFactory.getLogger(RedisStreamAuditPublisher.class);

    private final ReactiveRedisTemplate<String, String> redisTemplate;
    private final ObjectMapper objectMapper;
    private final AuditProperties properties;

    public RedisStreamAuditPublisher(
            ReactiveRedisTemplate<String, String> redisTemplate,
            ObjectMapper objectMapper,
            AuditProperties properties) {
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
        this.properties = properties;
    }

    @Override
    public Mono<Void> publish(AuditEvent event) {
        return publishInternal(event)
                .then()
                .onErrorResume(
                        e -> {
                            log.warn(
                                    "Failed to publish audit event: eventType={}, entityId={},"
                                            + " error={}",
                                    event.eventType(),
                                    event.entityId(),
                                    e.getMessage());
                            return Mono.empty();
                        });
    }

    @Override
    public Mono<String> publishAndAwait(AuditEvent event) {
        return publishInternal(event)
                .map(RecordId::getValue)
                .timeout(properties.publishTimeout())
                .doOnSuccess(
                        recordId ->
                                log.debug(
                                        "Published audit event: eventId={}, recordId={}",
                                        event.eventId(),
                                        recordId))
                .doOnError(
                        e ->
                                log.error(
                                        "Failed to publish audit event: eventType={}, entityId={},"
                                                + " error={}",
                                        event.eventType(),
                                        event.entityId(),
                                        e.getMessage()));
    }

    private Mono<RecordId> publishInternal(AuditEvent event) {
        return Mono.defer(
                () -> {
                    try {
                        String json = objectMapper.writeValueAsString(event);
                        Map<String, String> fields =
                                Map.of("eventId", event.eventId(), "payload", json);

                        return redisTemplate
                                .opsForStream()
                                .add(
                                        StreamRecords.newRecord()
                                                .in(properties.streamKey())
                                                .ofMap(fields));
                    } catch (JsonProcessingException e) {
                        log.error(
                                "Failed to serialize audit event: eventType={}, error={}",
                                event.eventType(),
                                e.getMessage());
                        return Mono.error(e);
                    }
                });
    }
}
