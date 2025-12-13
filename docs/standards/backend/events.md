# Events Standard

## Intent

Provide a unified, CloudEvents-compliant event streaming infrastructure for asynchronous communication between services using Redis Streams.

## Outcomes

- All services use a single event framework (`platform-events`)
- Events conform to CloudEvents v1.0 specification
- Consistent error handling with automatic retries and dead-letter queues
- Observable event flows with structured logging and tracing

## CloudEvents Specification

All events MUST conform to [CloudEvents v1.0](https://cloudevents.io/). This ensures interoperability, tooling compatibility, and clear semantics.

### Required Attributes

| Attribute | Type | Description | Example |
|-----------|------|-------------|---------|
| `specversion` | String | CloudEvents spec version | `"1.0"` |
| `id` | String | Unique event identifier (UUID) | `"550e8400-e29b-41d4-a716-446655440000"` |
| `source` | URI | Event producer identifier | `"urn:reactive-platform:checkout-service"` |
| `type` | String | Event type in reverse DNS | `"org.example.checkout.OrderCompleted"` |

### Optional Attributes (Recommended)

| Attribute | Type | Description | Example |
|-----------|------|-------------|---------|
| `subject` | String | Event subject (entity ID) | `"order-123"` |
| `time` | Timestamp | Event timestamp (ISO 8601) | `"2024-01-15T10:30:00Z"` |
| `datacontenttype` | String | Data encoding | `"application/json"` |
| `dataschema` | URI | Schema for data validation | `"urn:reactive-platform:schemas:order-completed:v1"` |

### Event Data

The `data` field contains the domain-specific payload as JSON:

```json
{
  "specversion": "1.0",
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "source": "urn:reactive-platform:checkout-service",
  "type": "org.example.checkout.OrderCompleted",
  "subject": "order-123",
  "time": "2024-01-15T10:30:00Z",
  "datacontenttype": "application/json",
  "data": {
    "orderId": "order-123",
    "customerId": "cust-456",
    "totalAmount": 99.99,
    "items": [...]
  }
}
```

## Naming Conventions

### Event Types

Use reverse DNS notation matching the producing service's package:

```
org.example.{service}.{EventName}

Examples:
  org.example.checkout.OrderCompleted
  org.example.checkout.PaymentProcessed
  org.example.cart.CartCreated
  org.example.cart.ProductAdded
  org.example.audit.AuditEventReceived
```

### Event Sources

Use URN format identifying the platform and service:

```
urn:reactive-platform:{service-name}

Examples:
  urn:reactive-platform:checkout-service
  urn:reactive-platform:cart-service
  urn:reactive-platform:audit-service
```

### Stream Keys

Use colon-delimited hierarchical format:

```
{domain}:{event-category}

Examples:
  orders:completed      # Order completion events
  audit:events          # Audit trail events
  carts:updates         # Cart modification events
  payments:processed    # Payment events
```

### Consumer Groups

Name after the consuming service:

```
{service-name}-group

Examples:
  audit-service-group
  order-service-group
  notification-service-group
```

### Dead Letter Queues

Append `:dlq` suffix to the source stream:

```
{stream-key}:dlq

Examples:
  orders:completed:dlq
  audit:events:dlq
```

## Architecture

```
┌─────────────────────┐         ┌─────────────────────┐
│  Publishing Service │         │  Consuming Service  │
│                     │         │                     │
│  ┌───────────────┐  │         │  ┌───────────────┐  │
│  │ Domain Logic  │  │         │  │ Domain Logic  │  │
│  └───────┬───────┘  │         │  └───────▲───────┘  │
│          │          │         │          │          │
│  ┌───────▼───────┐  │         │  ┌───────┴───────┐  │
│  │ CloudEvent-   │  │         │  │ EventConsumer │  │
│  │ Publisher     │  │         │  │ (extends base)│  │
│  └───────┬───────┘  │         │  └───────▲───────┘  │
│          │          │         │          │          │
│  ┌───────▼───────┐  │         │  ┌───────┴───────┐  │
│  │ CloudEvent-   │  │         │  │ CloudEvent-   │  │
│  │ Serializer    │  │         │  │ Serializer    │  │
│  └───────┬───────┘  │         │  └───────▲───────┘  │
└──────────┼──────────┘         └──────────┼──────────┘
           │                               │
           ▼                               │
    ┌──────────────────────────────────────┴───┐
    │           Redis Streams                   │
    │  ┌─────────────────┐  ┌────────────────┐ │
    │  │ orders:completed│  │ orders:        │ │
    │  │ (main stream)   │  │ completed:dlq  │ │
    │  └─────────────────┘  └────────────────┘ │
    └──────────────────────────────────────────┘
```

## Publishing Events

### Configuration

```yaml
# application.yml
events:
  stream-key: orders:completed
  source: urn:reactive-platform:checkout-service
  publish-timeout: 5s
```

### Publisher Bean

```java
@Configuration
public class EventPublisherConfig {

    @Bean
    public CloudEventPublisher cloudEventPublisher(
            ReactiveRedisTemplate<String, String> redisTemplate,
            CloudEventSerializer serializer,
            EventProperties properties) {
        return new RedisStreamEventPublisher(redisTemplate, serializer, properties);
    }
}
```

### Publishing

```java
@Service
public class OrderCompletedEventPublisher {

    private final CloudEventPublisher publisher;
    private final CloudEventSerializer serializer;
    private final EventProperties properties;

    public Mono<Void> publish(Order order) {
        CloudEvent event = serializer.buildEvent(
            properties.getOrderCompletedType(),  // "org.example.checkout.OrderCompleted"
            URI.create(properties.getSource()),   // "urn:reactive-platform:checkout-service"
            order.id(),                           // subject
            new OrderCompletedData(order)         // data payload
        );

        return publisher.publish(event);  // Fire-and-forget
        // OR
        return publisher.publishAndAwait(event);  // Wait for confirmation
    }
}
```

## Consuming Events

### Configuration

```yaml
# application.yml
events:
  consumer:
    stream-key: orders:completed
    consumer-group: order-service-group
    consumer-name: ${HOSTNAME:order-consumer-1}
    batch-size: 100
    poll-interval: 100ms
    max-retries: 3
    retry-delay: 1s
```

### Consumer Implementation

Extend `EventConsumer` and implement `handleEvent`:

```java
@Component
public class OrderCompletedConsumer extends EventConsumer {

    private final OrderRepository orderRepository;
    private final CloudEventSerializer serializer;

    public OrderCompletedConsumer(
            ReactiveRedisTemplate<String, String> redisTemplate,
            CloudEventSerializer serializer,
            EventStreamProperties properties,
            OrderRepository orderRepository) {
        super(redisTemplate, serializer, properties);
        this.orderRepository = orderRepository;
        this.serializer = serializer;
    }

    @PostConstruct
    public void init() {
        initializeConsumerGroup().subscribe();
    }

    @Scheduled(fixedDelayString = "${events.consumer.poll-interval:100}")
    public void poll() {
        readEvents()
            .flatMap(this::processRecord)
            .subscribe();
    }

    @Override
    protected Mono<Void> handleEvent(CloudEvent event) {
        OrderCompletedData data = serializer.extractData(event, OrderCompletedData.class);

        return orderRepository.save(toOrderEntity(data))
            .doOnSuccess(saved -> log.info("Saved order: {}", saved.id()))
            .then();
    }

    @Override
    protected boolean isRetryable(Throwable e) {
        // Add domain-specific retry logic
        return super.isRetryable(e) || e instanceof OptimisticLockException;
    }
}
```

## Error Handling

### Retry Strategy

The base `EventConsumer` provides exponential backoff retry:

```
Attempt 1: Immediate
Attempt 2: After retry-delay (e.g., 1s)
Attempt 3: After 2x retry-delay (e.g., 2s)
Attempt 4: After 4x retry-delay (e.g., 4s)
...up to max-retries
```

### Retryable vs Non-Retryable Errors

| Error Type | Retryable | Action |
|------------|-----------|--------|
| `TransientDataAccessException` | Yes | Retry with backoff |
| `R2dbcTransientResourceException` | Yes | Retry with backoff |
| `TimeoutException` | Yes | Retry with backoff |
| `OptimisticLockException` | Yes | Retry with backoff |
| `JsonProcessingException` | No | Dead letter immediately |
| `ValidationException` | No | Dead letter immediately |
| `NullPointerException` | No | Dead letter immediately |

Override `isRetryable()` to customize:

```java
@Override
protected boolean isRetryable(Throwable e) {
    if (e instanceof MyDomainException mde) {
        return mde.isTransient();
    }
    return super.isRetryable(e);
}
```

### Dead Letter Queue

Failed events are automatically moved to `{stream-key}:dlq`:

```json
{
  "eventId": "550e8400-e29b-41d4-a716-446655440000",
  "payload": "{original CloudEvent JSON}",
  "error": "Database connection refused",
  "errorClass": "io.r2dbc.spi.R2dbcNonTransientResourceException",
  "timestamp": "2024-01-15T10:35:00Z"
}
```

### DLQ Monitoring

Monitor DLQ depth and alert:

```java
@Scheduled(fixedRate = 60000)
public void monitorDlq() {
    redisTemplate.opsForStream()
        .size(properties.getDeadLetterStreamKey())
        .subscribe(size -> {
            if (size > 100) {
                log.warn("DLQ depth high: {}", size);
                metrics.gauge("events.dlq.depth", size);
            }
        });
}
```

## Observability

### Structured Logging

Use structured fields for all event operations:

```java
log.info("Event published",
    kv("eventId", event.getId()),
    kv("eventType", event.getType()),
    kv("subject", event.getSubject()),
    kv("streamKey", properties.getStreamKey()));

log.info("Event consumed",
    kv("eventId", event.getId()),
    kv("eventType", event.getType()),
    kv("processingTimeMs", duration.toMillis()));

log.error("Event processing failed",
    kv("eventId", eventId),
    kv("error", e.getMessage()),
    kv("errorClass", e.getClass().getName()));
```

### Metrics

Export these metrics:

| Metric | Type | Labels | Description |
|--------|------|--------|-------------|
| `events_published_total` | Counter | `type`, `stream` | Events published |
| `events_consumed_total` | Counter | `type`, `stream`, `status` | Events consumed (success/failure) |
| `events_processing_duration_seconds` | Histogram | `type` | Processing time |
| `events_dlq_depth` | Gauge | `stream` | Dead letter queue size |
| `events_consumer_lag` | Gauge | `stream`, `group` | Consumer lag |

### Tracing

Propagate trace context through events:

```java
// Publisher: Add trace context as extension
CloudEvent event = CloudEventBuilder.v1()
    .withExtension("traceparent", Span.current().getSpanContext().toString())
    .build();

// Consumer: Extract and continue trace
String traceParent = event.getExtension("traceparent");
// Create child span with parent context
```

## Anti-patterns

### Custom Event Formats

```java
// DON'T - proprietary format
record MyEvent(String id, String type, Object data) {}
redisTemplate.opsForStream().add(streamKey, Map.of("event", serialize(myEvent)));

// DO - use CloudEvents
CloudEvent event = serializer.buildEvent(type, source, subject, data);
publisher.publish(event);
```

### Custom Consumer Implementation

```java
// DON'T - duplicate infrastructure code
@Scheduled(fixedDelay = 100)
public void consume() {
    redisTemplate.opsForStream().read(...)
        .flatMap(record -> {
            // Custom parsing...
            // Custom retry logic...
            // Custom DLQ handling...
        });
}

// DO - extend EventConsumer
public class MyConsumer extends EventConsumer {
    @Override
    protected Mono<Void> handleEvent(CloudEvent event) {
        // Only domain logic here
    }
}
```

### Fire-and-Forget Without Logging

```java
// DON'T - silent failures
publisher.publish(event).subscribe();

// DO - log failures
publisher.publish(event)
    .doOnError(e -> log.error("Failed to publish event", kv("eventId", event.getId()), e))
    .subscribe();
```

### Blocking in Event Handler

```java
// DON'T - blocks event loop
@Override
protected Mono<Void> handleEvent(CloudEvent event) {
    repository.save(entity).block();  // BLOCKING!
    return Mono.empty();
}

// DO - stay reactive
@Override
protected Mono<Void> handleEvent(CloudEvent event) {
    return repository.save(entity).then();
}
```

### Missing Idempotency

```java
// DON'T - duplicate processing on retry
@Override
protected Mono<Void> handleEvent(CloudEvent event) {
    return createOrder(event);  // Creates duplicate on retry!
}

// DO - ensure idempotency
@Override
protected Mono<Void> handleEvent(CloudEvent event) {
    return orderRepository.existsById(event.getSubject())
        .flatMap(exists -> exists
            ? Mono.empty()  // Already processed
            : createOrder(event));
}
```

### No Dead Letter Monitoring

```java
// DON'T - DLQ grows silently

// DO - monitor and alert
@Scheduled(fixedRate = 60000)
public void checkDlq() {
    // Alert if DLQ has items
}
```

## Configuration Reference

### Publisher Properties

```yaml
events:
  stream-key: orders:completed       # Redis stream key
  source: urn:reactive-platform:checkout-service
  publish-timeout: 5s                # Timeout for publishAndAwait
```

### Consumer Properties

```yaml
events:
  consumer:
    stream-key: orders:completed     # Stream to consume from
    consumer-group: my-service-group # Consumer group name
    consumer-name: ${HOSTNAME:consumer-1}  # Unique consumer ID
    batch-size: 100                  # Max events per poll
    poll-interval: 100ms             # Polling frequency
    max-retries: 3                   # Retry attempts before DLQ
    retry-delay: 1s                  # Initial retry delay
    dead-letter-suffix: :dlq         # DLQ stream suffix
```

## Reference

- `libs/backend/platform/platform-events/` - Event infrastructure
- `apps/checkout-service/src/.../event/` - Publisher example
- `docs/templates/backend/_template_event_consumer.md` - Consumer template
- [CloudEvents Specification](https://cloudevents.io/)
