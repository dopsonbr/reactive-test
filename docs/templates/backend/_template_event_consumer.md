# Event Consumer Template

This template defines the standard structure for CloudEvents consumers using Redis Streams in this codebase.

## Required Components

Every event consumer MUST have:

1. **Extend EventConsumer** - Use the base class from `platform-events`
2. **Implement handleEvent()** - Process CloudEvents with domain logic
3. **Initialize Consumer Group** - Call `initializeConsumerGroup()` on startup
4. **Schedule Polling** - Use `@Scheduled` to poll for events
5. **Ensure Idempotency** - Handle duplicate event delivery gracefully

## Template

```java
package org.example.{service}.consumer;

import io.cloudevents.CloudEvent;
import jakarta.annotation.PostConstruct;
import org.example.{service}.model.{Entity};
import org.example.{service}.repository.{Repository};
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
 * Consumes {EventType} events from Redis Streams.
 *
 * <p>This consumer follows the standard patterns:
 * <ul>
 *   <li>Extends platform EventConsumer for retry/DLQ handling</li>
 *   <li>Uses CloudEvents v1.0 format</li>
 *   <li>Ensures idempotent processing</li>
 *   <li>Logs all event processing with structured fields</li>
 * </ul>
 */
@Component
public class {EventType}Consumer extends EventConsumer {

    private static final Logger log = LoggerFactory.getLogger({EventType}Consumer.class);

    private final {Repository} repository;
    private final CloudEventSerializer serializer;

    public {EventType}Consumer(
            ReactiveRedisTemplate<String, String> redisTemplate,
            CloudEventSerializer serializer,
            EventStreamProperties properties,
            {Repository} repository) {
        super(redisTemplate, serializer, properties);
        this.repository = repository;
        this.serializer = serializer;
    }

    // ==================== Lifecycle ====================

    /**
     * Initialize the consumer group on startup.
     * Creates the group if it doesn't exist.
     */
    @PostConstruct
    public void init() {
        initializeConsumerGroup()
            .doOnSuccess(v -> log.info("Consumer group initialized: {}",
                properties.getConsumerGroup()))
            .doOnError(e -> log.error("Failed to initialize consumer group", e))
            .subscribe();
    }

    /**
     * Poll for events at configured interval.
     * Each poll reads up to batch-size events.
     */
    @Scheduled(fixedDelayString = "${events.consumer.poll-interval:100}")
    public void poll() {
        readEvents()
            .flatMap(this::processRecord)
            .subscribe(
                null,
                error -> log.error("Error in consumer loop: {}", error.getMessage())
            );
    }

    // ==================== Event Handling ====================

    /**
     * Handle a single CloudEvent.
     *
     * <p>IMPORTANT: This method MUST be idempotent. The same event
     * may be delivered multiple times due to:
     * <ul>
     *   <li>Consumer restart before acknowledgment</li>
     *   <li>Network issues</li>
     *   <li>Retry after transient failure</li>
     * </ul>
     *
     * @param event the CloudEvent to process
     * @return Mono completing when processing is done
     */
    @Override
    protected Mono<Void> handleEvent(CloudEvent event) {
        // Extract typed data from CloudEvent
        {EventData} data = serializer.extractData(event, {EventData}.class);

        return ensureIdempotent(event)
            .then(processEvent(event, data))
            .doOnSuccess(v -> log.info("Processed event: eventId={}, type={}, subject={}",
                event.getId(), event.getType(), event.getSubject()))
            .doOnError(e -> log.error("Failed to process event: eventId={}, error={}",
                event.getId(), e.getMessage()));
    }

    /**
     * Check if this event has already been processed.
     * Returns empty Mono if already processed (skip), error if check fails.
     */
    private Mono<Void> ensureIdempotent(CloudEvent event) {
        // Option 1: Check by event ID
        return repository.existsByEventId(event.getId())
            .flatMap(exists -> exists
                ? Mono.error(new AlreadyProcessedException(event.getId()))
                : Mono.empty());

        // Option 2: Check by subject (entity ID)
        // return repository.existsById(event.getSubject())
        //     .flatMap(exists -> exists
        //         ? Mono.error(new AlreadyProcessedException(event.getSubject()))
        //         : Mono.empty());
    }

    /**
     * Process the event after idempotency check.
     */
    private Mono<Void> processEvent(CloudEvent event, {EventData} data) {
        {Entity} entity = mapToEntity(event, data);

        return repository.save(entity)
            .doOnSuccess(saved -> log.debug("Saved entity: id={}", saved.id()))
            .then();
    }

    /**
     * Map CloudEvent data to domain entity.
     */
    private {Entity} mapToEntity(CloudEvent event, {EventData} data) {
        return new {Entity}(
            event.getSubject(),           // Use subject as entity ID
            data.field1(),
            data.field2(),
            event.getTime().toInstant(),  // Event timestamp
            event.getId()                 // Store event ID for idempotency
        );
    }

    // ==================== Error Handling ====================

    /**
     * Determine if an error is retryable.
     *
     * <p>Override to add domain-specific retry logic.
     * Non-retryable errors go directly to DLQ.
     */
    @Override
    protected boolean isRetryable(Throwable e) {
        // Skip retry for already-processed events
        if (e instanceof AlreadyProcessedException) {
            return false;
        }

        // Skip retry for invalid data
        if (e instanceof IllegalArgumentException) {
            return false;
        }

        // Add domain-specific retryable errors
        if (e instanceof OptimisticLockException) {
            return true;
        }

        // Delegate to base class for standard transient errors
        return super.isRetryable(e);
    }

    /**
     * Exception indicating event was already processed.
     * Not retryable - the event is acknowledged and skipped.
     */
    private static class AlreadyProcessedException extends RuntimeException {
        AlreadyProcessedException(String eventId) {
            super("Event already processed: " + eventId);
        }
    }
}
```

## Event Data Record

Define a record for the typed event data:

```java
package org.example.{service}.consumer;

/**
 * Data payload for {EventType} events.
 *
 * <p>This record maps to the 'data' field of the CloudEvent.
 * Field names must match the JSON structure exactly.
 */
public record {EventData}(
    String field1,
    String field2,
    int quantity,
    java.math.BigDecimal amount
) {}
```

## Configuration

### Properties Class

```java
package org.example.{service}.config;

import org.example.platform.events.EventStreamProperties;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Configuration properties for {EventType} consumer.
 */
@ConfigurationProperties(prefix = "events.consumer")
public record {EventType}ConsumerProperties(
    String streamKey,
    String consumerGroup,
    String consumerName,
    int batchSize,
    java.time.Duration pollInterval,
    int maxRetries,
    java.time.Duration retryDelay
) implements EventStreamProperties {

    @Override
    public String getStreamKey() { return streamKey; }

    @Override
    public String getConsumerGroup() { return consumerGroup; }

    @Override
    public String getConsumerName() { return consumerName; }

    @Override
    public int getBatchSize() { return batchSize; }

    @Override
    public int getMaxRetries() { return maxRetries; }

    @Override
    public java.time.Duration getRetryDelay() { return retryDelay; }

    @Override
    public String getDeadLetterStreamKey() {
        return streamKey + ":dlq";
    }
}
```

### Application YAML

```yaml
events:
  consumer:
    stream-key: orders:completed      # Redis stream to consume
    consumer-group: my-service-group  # Consumer group name
    consumer-name: ${HOSTNAME:consumer-1}  # Unique consumer instance ID
    batch-size: 100                   # Events per poll
    poll-interval: 100ms              # Polling frequency
    max-retries: 3                    # Retries before DLQ
    retry-delay: 1s                   # Initial retry delay (exponential backoff)
```

### Bean Configuration

```java
package org.example.{service}.config;

import org.example.platform.events.CloudEventSerializer;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties({EventType}ConsumerProperties.class)
public class EventConsumerConfig {

    @Bean
    public CloudEventSerializer cloudEventSerializer(
            com.fasterxml.jackson.databind.ObjectMapper objectMapper) {
        return new CloudEventSerializer(objectMapper);
    }
}
```

## Anti-Patterns

### Not Extending EventConsumer

```java
// DON'T - custom implementation duplicates infrastructure
@Component
public class MyConsumer {
    @Scheduled(fixedDelay = 100)
    public void consume() {
        redisTemplate.opsForStream().read(...)
            .flatMap(record -> {
                // Custom parsing, retry, DLQ handling...
            });
    }
}

// DO - extend EventConsumer
@Component
public class MyConsumer extends EventConsumer {
    @Override
    protected Mono<Void> handleEvent(CloudEvent event) {
        // Only domain logic here
    }
}
```

### Missing Idempotency

```java
// DON'T - creates duplicates on retry
@Override
protected Mono<Void> handleEvent(CloudEvent event) {
    return repository.save(mapToEntity(event)).then();
}

// DO - check before save
@Override
protected Mono<Void> handleEvent(CloudEvent event) {
    return repository.existsByEventId(event.getId())
        .flatMap(exists -> exists
            ? Mono.empty()  // Already processed
            : repository.save(mapToEntity(event)))
        .then();
}
```

### Blocking in Handler

```java
// DON'T - blocks event loop
@Override
protected Mono<Void> handleEvent(CloudEvent event) {
    Entity entity = repository.save(mapToEntity(event)).block();
    return Mono.empty();
}

// DO - stay reactive
@Override
protected Mono<Void> handleEvent(CloudEvent event) {
    return repository.save(mapToEntity(event)).then();
}
```

### Swallowing Errors

```java
// DON'T - hides failures
@Override
protected Mono<Void> handleEvent(CloudEvent event) {
    return repository.save(mapToEntity(event))
        .onErrorResume(e -> Mono.empty())  // Silent failure!
        .then();
}

// DO - let errors propagate for retry/DLQ
@Override
protected Mono<Void> handleEvent(CloudEvent event) {
    return repository.save(mapToEntity(event)).then();
    // Errors handled by base class (retry or DLQ)
}
```

### Custom Event Format

```java
// DON'T - proprietary format
@Override
protected Mono<Void> handleEvent(CloudEvent event) {
    String json = new String(event.getData().toBytes());
    MyCustomEvent custom = objectMapper.readValue(json, MyCustomEvent.class);
    // ...
}

// DO - use CloudEventSerializer
@Override
protected Mono<Void> handleEvent(CloudEvent event) {
    MyEventData data = serializer.extractData(event, MyEventData.class);
    // ...
}
```

## Checklist

Before submitting an event consumer for review, verify:

- [ ] Consumer extends `EventConsumer` base class
- [ ] Consumer group initialized in `@PostConstruct`
- [ ] Polling configured via `@Scheduled` annotation
- [ ] `handleEvent()` is idempotent (duplicate-safe)
- [ ] `isRetryable()` overridden if domain-specific retry logic needed
- [ ] Event data record matches CloudEvent `data` structure
- [ ] Configuration properties implement `EventStreamProperties`
- [ ] Structured logging includes eventId, type, and subject
- [ ] No blocking calls in handler (`block()`, `blockFirst()`, etc.)
- [ ] Errors propagate for retry/DLQ handling (not swallowed)
