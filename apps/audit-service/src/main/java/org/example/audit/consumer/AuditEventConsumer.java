package org.example.audit.consumer;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import java.time.Duration;
import java.util.Map;
import org.example.audit.config.AuditConsumerProperties;
import org.example.audit.repository.AuditRepository;
import org.example.platform.audit.AuditEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.data.redis.connection.stream.Consumer;
import org.springframework.data.redis.connection.stream.MapRecord;
import org.springframework.data.redis.connection.stream.ReadOffset;
import org.springframework.data.redis.connection.stream.StreamOffset;
import org.springframework.data.redis.connection.stream.StreamReadOptions;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.util.retry.Retry;

/** Redis Streams consumer for processing audit events. */
@Component
@EnableConfigurationProperties(AuditConsumerProperties.class)
public class AuditEventConsumer {

    private static final Logger log = LoggerFactory.getLogger(AuditEventConsumer.class);

    private final ReactiveRedisTemplate<String, String> redisTemplate;
    private final AuditRepository auditRepository;
    private final ObjectMapper objectMapper;
    private final DeadLetterHandler deadLetterHandler;
    private final AuditConsumerProperties properties;

    public AuditEventConsumer(
            ReactiveRedisTemplate<String, String> redisTemplate,
            AuditRepository auditRepository,
            ObjectMapper objectMapper,
            DeadLetterHandler deadLetterHandler,
            AuditConsumerProperties properties) {
        this.redisTemplate = redisTemplate;
        this.auditRepository = auditRepository;
        this.objectMapper = objectMapper;
        this.deadLetterHandler = deadLetterHandler;
        this.properties = properties;
    }

    @PostConstruct
    public void init() {
        createConsumerGroup()
                .doOnSuccess(
                        v -> log.info("Consumer group initialized: {}", properties.consumerGroup()))
                .doOnError(e -> log.warn("Consumer group may already exist: {}", e.getMessage()))
                .subscribe();
    }

    @Scheduled(fixedDelayString = "${audit.consumer.poll-interval:100}")
    public void consume() {
        readEvents()
                .flatMap(this::processEvent)
                .subscribe(
                        null, error -> log.error("Error in consumer loop: {}", error.getMessage()));
    }

    @SuppressWarnings("unchecked")
    private Flux<MapRecord<String, Object, Object>> readEvents() {
        return redisTemplate
                .opsForStream()
                .read(
                        Consumer.from(properties.consumerGroup(), properties.consumerName()),
                        StreamReadOptions.empty()
                                .count(properties.batchSize())
                                .block(Duration.ofMillis(50)),
                        StreamOffset.create(properties.streamKey(), ReadOffset.lastConsumed()))
                .onErrorResume(
                        e -> {
                            log.warn("Failed to read from stream: {}", e.getMessage());
                            return Flux.empty();
                        });
    }

    private Mono<Void> processEvent(MapRecord<String, Object, Object> record) {
        return Mono.defer(
                () -> {
                    Map<Object, Object> values = record.getValue();
                    String eventId =
                            values.get("eventId") != null ? values.get("eventId").toString() : null;
                    String payload =
                            values.get("payload") != null ? values.get("payload").toString() : null;

                    return parseEvent(payload)
                            .flatMap(event -> saveWithRetry(event, record))
                            .onErrorResume(e -> handleProcessingError(eventId, payload, e, record));
                });
    }

    private Mono<AuditEvent> parseEvent(String payload) {
        return Mono.defer(
                () -> {
                    try {
                        AuditEvent event = objectMapper.readValue(payload, AuditEvent.class);
                        return Mono.just(event);
                    } catch (Exception e) {
                        return Mono.error(
                                new IllegalArgumentException(
                                        "Failed to parse audit event: " + e.getMessage(), e));
                    }
                });
    }

    private Mono<Void> saveWithRetry(AuditEvent event, MapRecord<String, Object, Object> record) {
        return auditRepository
                .save(event)
                .retryWhen(
                        Retry.backoff(properties.maxRetries(), properties.retryDelay())
                                .filter(this::isRetryable)
                                .doBeforeRetry(
                                        signal ->
                                                log.warn(
                                                        "Retrying save for event {}, attempt {}",
                                                        event.eventId(),
                                                        signal.totalRetries() + 1)))
                .then(acknowledgeRecord(record))
                .doOnSuccess(
                        v ->
                                log.debug(
                                        "Processed audit event: eventId={}, eventType={}",
                                        event.eventId(),
                                        event.eventType()));
    }

    private boolean isRetryable(Throwable e) {
        // Retry on transient database errors
        String className = e.getClass().getName();
        return className.contains("TransientDataAccessException")
                || className.contains("R2dbcTransientResourceException")
                || className.contains("TimeoutException");
    }

    private Mono<Void> handleProcessingError(
            String eventId,
            String payload,
            Throwable error,
            MapRecord<String, Object, Object> record) {
        log.error(
                "Failed to process audit event: eventId={}, error={}", eventId, error.getMessage());

        return deadLetterHandler
                .handleFailedMessage(eventId, payload, error)
                .then(acknowledgeRecord(record));
    }

    private Mono<Void> acknowledgeRecord(MapRecord<String, Object, Object> record) {
        return redisTemplate
                .opsForStream()
                .acknowledge(properties.streamKey(), properties.consumerGroup(), record.getId())
                .then();
    }

    private Mono<Void> createConsumerGroup() {
        return redisTemplate
                .opsForStream()
                .createGroup(properties.streamKey(), properties.consumerGroup())
                .onErrorResume(
                        e -> {
                            // Group may already exist, which is fine
                            if (e.getMessage() != null && e.getMessage().contains("BUSYGROUP")) {
                                return Mono.empty();
                            }
                            // Stream might not exist yet, create it with a dummy entry then create
                            // group
                            return redisTemplate
                                    .opsForStream()
                                    .add(properties.streamKey(), Map.of("init", "true"))
                                    .then(
                                            redisTemplate
                                                    .opsForStream()
                                                    .createGroup(
                                                            properties.streamKey(),
                                                            properties.consumerGroup()))
                                    .onErrorResume(e2 -> Mono.empty());
                        })
                .then();
    }
}
