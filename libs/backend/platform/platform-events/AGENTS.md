# Platform Events Agent Guidelines

Reusable CloudEvents infrastructure for Redis Streams publishing and consuming.

## Key Files

| File | Purpose |
|------|---------|
| `CloudEventPublisher.java` | Publisher interface (fire-and-forget or await confirmation) |
| `RedisStreamEventPublisher.java` | Redis Streams implementation of publisher |
| `CloudEventSerializer.java` | JSON serialization/deserialization for CloudEvents |
| `EventConsumer.java` | Abstract base class for consuming events from Redis Streams |
| `EventStreamProperties.java` | Configuration properties for stream key, consumer group, retries |
| `EventsAutoConfiguration.java` | Spring Boot auto-configuration |

## Common Tasks

### Publish an Event

1. Inject `CloudEventPublisher` and `CloudEventSerializer`:
   ```java
   @Service
   public class CheckoutService {
       private final CloudEventPublisher publisher;
       private final CloudEventSerializer serializer;

       public Mono<Void> publishOrderCompleted(Order order) {
           CloudEvent event = serializer.buildEvent(
               "org.example.checkout.OrderCompleted",
               URI.create("urn:reactive-platform:checkout-service"),
               order.id().toString(),
               order);
           return publisher.publishAndAwait(event).then();
       }
   }
   ```
2. Use `publish()` for fire-and-forget (errors logged but not propagated)
3. Use `publishAndAwait()` when you need confirmation or error handling

### Consume Events

1. Extend `EventConsumer` and implement `handleEvent()`:
   ```java
   @Component
   public class OrderEventConsumer extends EventConsumer {

       public OrderEventConsumer(
               ReactiveRedisTemplate<String, String> redisTemplate,
               CloudEventSerializer serializer,
               OrderEventProperties properties) {
           super(redisTemplate, serializer, properties);
       }

       @Override
       protected Mono<Void> handleEvent(CloudEvent event) {
           Order order = serializer.extractData(event, Order.class);
           return orderRepository.save(order);
       }
   }
   ```
2. Call `initializeConsumerGroup()` on application startup
3. Use `readEvents()` to poll for new events
4. Use `processRecord()` to deserialize, handle, and acknowledge

### Configure Event Streams

Add to `application.yml`:
```yaml
platform:
  events:
    stream-key: orders:completed
    consumer-group: order-service-group
    consumer-name: ${HOSTNAME:order-1}
    batch-size: 10
    poll-interval: 100ms
    max-retries: 3
    retry-delay: 1s
```

### Extract Typed Data from CloudEvent

```java
Order order = serializer.extractData(event, Order.class);
```

### Build CloudEvent with Typed Data

```java
CloudEvent event = serializer.buildEvent(
    "org.example.checkout.OrderCompleted",
    URI.create("urn:reactive-platform:checkout-service"),
    orderId,
    orderData);
```

## Patterns in This Library

### CloudEvents Format

Events follow [CloudEvents v1.0 specification](https://cloudevents.io/):

```json
{
  "specversion": "1.0",
  "id": "uuid",
  "source": "urn:reactive-platform:checkout-service",
  "type": "org.example.checkout.OrderCompleted",
  "subject": "order-id",
  "time": "2025-01-01T12:00:00Z",
  "datacontenttype": "application/json",
  "data": { ... }
}
```

### Redis Stream Record Format

Events are stored in Redis Streams with these fields:
- `eventId` - CloudEvent ID
- `eventType` - CloudEvent type
- `payload` - Full CloudEvent JSON

### Error Handling

- **Transient errors**: Automatic retry with exponential backoff (configurable)
- **Permanent failures**: Move to dead letter stream (`{stream-key}:dlq`)
- **Fire-and-forget**: `publish()` logs errors but doesn't propagate
- **Awaited publish**: `publishAndAwait()` returns error on failure

### Consumer Groups

- Each consumer must have unique `consumerName` within its group
- Group created automatically via `initializeConsumerGroup()`
- Unacknowledged messages can be claimed by other consumers

## Anti-patterns to Avoid

- Publishing without a stream key configured
- Consuming without initializing consumer group first
- Blocking in `handleEvent()` - always return reactive types
- Ignoring dead letter queue - monitor and process failed events
- Using same consumer name across instances - causes message loss

## Boundaries

Files that require careful review before changes:
- `CloudEventSerializer.java` - Changes affect event wire format
- `EventConsumer.java` - Changes affect all consumers

## Conventions

- Event types follow pattern: `org.example.{service}.{EventName}`
- Event sources follow pattern: `urn:reactive-platform:{service-name}`
- Stream keys follow pattern: `{entity}:{event-type}` (e.g., `orders:completed`)
- Consumer groups follow pattern: `{service-name}-group`
- Dead letter suffix is `:dlq` (e.g., `orders:completed:dlq`)

## Warnings

- `EventStreamProperties` defaults may not be suitable for production
- Retryable errors determined by exception class name matching
- Dead letter records include error message and class for debugging
- Jackson ObjectMapper must be configured for your data types (e.g., JavaTimeModule)
