package org.example.audit.consumer;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.util.Map;
import org.example.platform.audit.AuditEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.connection.stream.StreamRecords;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

/** Handles failed audit events by sending them to a dead letter queue. */
@Component
public class DeadLetterHandler {

    private static final Logger log = LoggerFactory.getLogger(DeadLetterHandler.class);
    private static final String DLQ_STREAM = "audit-events-dlq";

    private final ReactiveRedisTemplate<String, String> redisTemplate;
    private final ObjectMapper objectMapper;

    public DeadLetterHandler(
            ReactiveRedisTemplate<String, String> redisTemplate, ObjectMapper objectMapper) {
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
    }

    /**
     * Sends a failed audit event to the dead letter queue.
     *
     * @param event The failed audit event
     * @param error The error that caused the failure
     * @return A Mono that completes when the event is sent to DLQ
     */
    public Mono<Void> handleFailedEvent(AuditEvent event, Throwable error) {
        return Mono.defer(
                () -> {
                    try {
                        String eventJson = objectMapper.writeValueAsString(event);
                        Map<String, String> fields =
                                Map.of(
                                        "eventId", event.eventId(),
                                        "event", eventJson,
                                        "error", error.getMessage(),
                                        "errorType", error.getClass().getSimpleName(),
                                        "timestamp", Instant.now().toString());

                        return redisTemplate
                                .opsForStream()
                                .add(StreamRecords.newRecord().in(DLQ_STREAM).ofMap(fields))
                                .doOnSuccess(
                                        recordId ->
                                                log.warn(
                                                        "Moved audit event to DLQ: eventId={},"
                                                                + " recordId={}, error={}",
                                                        event.eventId(),
                                                        recordId.getValue(),
                                                        error.getMessage()))
                                .then();
                    } catch (JsonProcessingException e) {
                        log.error("Failed to serialize event for DLQ: eventId={}", event.eventId());
                        return Mono.empty();
                    }
                });
    }

    /**
     * Sends a raw failed message to the dead letter queue.
     *
     * @param eventId The event ID (if available)
     * @param payload The raw message payload
     * @param error The error that caused the failure
     * @return A Mono that completes when the message is sent to DLQ
     */
    public Mono<Void> handleFailedMessage(String eventId, String payload, Throwable error) {
        Map<String, String> fields =
                Map.of(
                        "eventId", eventId != null ? eventId : "unknown",
                        "payload", payload,
                        "error", error.getMessage(),
                        "errorType", error.getClass().getSimpleName(),
                        "timestamp", Instant.now().toString());

        return redisTemplate
                .opsForStream()
                .add(StreamRecords.newRecord().in(DLQ_STREAM).ofMap(fields))
                .doOnSuccess(
                        recordId ->
                                log.warn(
                                        "Moved failed message to DLQ: eventId={}, recordId={},"
                                                + " error={}",
                                        eventId,
                                        recordId.getValue(),
                                        error.getMessage()))
                .then();
    }
}
