package org.example.audit.consumer;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.cloudevents.CloudEvent;
import jakarta.annotation.PostConstruct;
import org.example.audit.domain.AuditRecord;
import org.example.audit.repository.AuditRepository;
import org.example.platform.audit.AuditEventData;
import org.example.platform.events.CloudEventSerializer;
import org.example.platform.events.EventConsumer;
import org.example.platform.events.EventStreamProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

/**
 * CloudEvents consumer for audit events.
 *
 * <p>Extends platform EventConsumer for standardized Redis Streams consumption with retry and
 * dead-letter queue handling.
 */
@Component
public class AuditEventConsumer extends EventConsumer {

  private static final Logger log = LoggerFactory.getLogger(AuditEventConsumer.class);

  private final AuditRepository auditRepository;
  private final CloudEventSerializer serializer;
  private final ObjectMapper objectMapper;

  public AuditEventConsumer(
      ReactiveRedisTemplate<String, String> redisTemplate,
      CloudEventSerializer serializer,
      EventStreamProperties properties,
      AuditRepository auditRepository,
      ObjectMapper objectMapper) {
    super(redisTemplate, serializer, properties);
    this.auditRepository = auditRepository;
    this.serializer = serializer;
    this.objectMapper = objectMapper;
  }

  @PostConstruct
  public void init() {
    initializeConsumerGroup()
        .doOnSuccess(v -> log.info("Audit consumer group initialized"))
        .subscribe();
  }

  @Scheduled(fixedDelayString = "${platform.events.poll-interval:100}")
  public void poll() {
    readEvents()
        .flatMap(this::processRecord)
        .subscribe(null, error -> log.error("Error in consumer loop: {}", error.getMessage()));
  }

  @Override
  protected Mono<Void> handleEvent(CloudEvent event) {
    AuditEventData data = serializer.extractData(event, AuditEventData.class);
    AuditRecord record = AuditRecord.fromCloudEvent(event, data, objectMapper);

    return auditRepository
        .saveRecord(record)
        .doOnSuccess(saved -> log.debug("Saved audit event: eventId={}", saved.eventId()))
        .then();
  }
}
