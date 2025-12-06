# Redis Pub/Sub Template

This template defines the standard structure for reactive Redis Pub/Sub used for **real-time notifications and ephemeral event fan-out**.

Replace `{Entity}`, `{entity}`, and `{identifier}` with your domain-specific names (e.g., `Cart`/`cart`/`cartId`, `Order`/`order`/`orderId`).

## When to Use Redis Pub/Sub

Use Redis Pub/Sub for:
- **Real-time notifications** - Push updates to connected clients (WebSocket, SSE)
- **Ephemeral event fan-out** - Events that should reach all subscribers but don't need persistence
- **Cross-instance coordination** - Broadcasting events across horizontally-scaled service instances
- **GraphQL subscriptions** - Delivering subscription updates to subscribers (see ADR 004)
- **Live updates** - UI notifications, dashboard updates, collaborative features

Do NOT use Redis Pub/Sub for:
- **Durable events** - Events that must survive restarts or be replayed (use Redis Streams or Kafka)
- **Exactly-once processing** - Events requiring acknowledgment (use Redis Streams with consumer groups)
- **Audit trails** - Events requiring persistence for compliance (use Redis Streams + Cassandra)
- **Message queues** - Work distribution across workers (use Redis Streams or RabbitMQ)
- **Caching** - Data storage with TTL (use Redis key-value, see `_template_redis_cache.md`)

### Key Characteristic: Fire-and-Forget

Redis Pub/Sub is inherently ephemeral:
- **No persistence**: Messages are delivered only to currently connected subscribers
- **No replay**: Disconnected subscribers miss messages; they must re-fetch current state on reconnect
- **No acknowledgment**: Publishers don't know if anyone received the message
- **Low latency**: Sub-millisecond delivery to all subscribers

This is ideal for real-time UX where:
- Missing a message is acceptable (client re-fetches state)
- Low latency is critical
- Simplicity is preferred over durability guarantees

## Dependencies

Add to `build.gradle.kts`:

```kotlin
dependencies {
    implementation("org.springframework.boot:spring-boot-starter-data-redis-reactive")
}
```

## Configuration

`application.yml`:

```yaml
spring:
  data:
    redis:
      host: ${REDIS_HOST:localhost}
      port: ${REDIS_PORT:6379}
      timeout: 1000ms
      lettuce:
        pool:
          max-active: 16
          max-idle: 8
          min-idle: 2
          max-wait: 100ms

# Application-specific pub/sub configuration
pubsub:
  {entity}:
    channel-prefix: "{entity}:"
    channel-suffix: ":events"
```

## Channel Naming Conventions

Consistent channel naming enables predictable subscription patterns.

### Pattern: `{domain}:{identifier}:{event-type}` or `{domain}:{identifier}:events`

```java
// Entity-specific channels
"{entity}:{id}:events"              // All events for a specific entity

// Scoped channels
"{entity}:store:{storeNumber}:events"   // All events for entities in a store
"{entity}:region:{region}:updates"      // Regional updates

// Broadcast channels
"system:maintenance"                // System-wide announcements
"prices:updates"                    // Global price change notifications
```

### Channel Builder Pattern

```java
public final class PubSubChannels {
    private PubSubChannels() {}

    public static String {entity}Events(String id) {
        return "{entity}:" + id + ":events";
    }

    public static String {entity}EventsForStore(int storeNumber) {
        return "{entity}:store:" + storeNumber + ":events";
    }

    public static String {entity}EventsPattern(String idPattern) {
        return "{entity}:" + idPattern + ":events";
    }
}
```

## Event Model

Define event types as records for immutability and clear contracts.

```java
package org.example.{domain}.event;

import java.time.Instant;

/**
 * Event published when an {entity} is modified.
 *
 * <p>Contains the event type, affected {entity}, and timestamp.
 * The full {entity} state is included so subscribers have complete context.
 */
public record {Entity}Event(
        {Entity}EventType eventType,
        String {entity}Id,
        {Entity} {entity},
        Instant timestamp
) {
    public static {Entity}Event of({Entity}EventType type, {Entity} {entity}) {
        return new {Entity}Event(type, {entity}.id(), {entity}, Instant.now());
    }
}

public enum {Entity}EventType {
    CREATED,
    UPDATED,
    DELETED,
    // Add domain-specific event types as needed
    // e.g., ITEM_ADDED, ITEM_REMOVED, STATUS_CHANGED, etc.
}
```

## Publisher Implementation

```java
package org.example.{domain}.pubsub;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.example.{domain}.event.{Entity}Event;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

/**
 * Publishes {entity} events to Redis Pub/Sub for real-time notifications.
 *
 * <p>Channel pattern: {entity}:{id}:events
 *
 * <p>Publishing is fire-and-forget; failures are logged but don't break
 * the calling flow. This ensures mutations succeed even if Redis is unavailable.
 */
@Component
public class {Entity}EventPublisher {

    private final ReactiveRedisTemplate<String, String> redisTemplate;
    private final ObjectMapper objectMapper;

    public {Entity}EventPublisher(
            ReactiveRedisTemplate<String, String> redisTemplate,
            ObjectMapper objectMapper) {
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
    }

    /**
     * Publish an {entity} event to subscribers.
     *
     * @param event the {entity} event to publish
     * @return Mono completing when published (or on error)
     */
    public Mono<Void> publish({Entity}Event event) {
        return serialize(event)
                .flatMap(json ->
                        redisTemplate.convertAndSend(channel(event.{entity}Id()), json))
                .doOnSuccess(count ->
                        // count = number of subscribers that received the message
                        log.debug("Published {} to {} subscribers", event.eventType(), count))
                .doOnError(e ->
                        log.warn("Failed to publish {entity} event: {}", e.getMessage()))
                .onErrorResume(e -> Mono.empty())  // Don't fail mutations on publish error
                .then();
    }

    private String channel(String id) {
        return "{entity}:" + id + ":events";
    }

    private Mono<String> serialize({Entity}Event event) {
        return Mono.fromCallable(() -> objectMapper.writeValueAsString(event))
                .onErrorMap(JsonProcessingException.class,
                        e -> new RuntimeException("Failed to serialize {entity} event", e));
    }
}
```

## Subscriber Implementation

```java
package org.example.{domain}.pubsub;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.example.{domain}.event.{Entity}Event;
import org.springframework.data.redis.connection.ReactiveSubscription;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.data.redis.listener.ChannelTopic;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * Subscribes to {entity} events from Redis Pub/Sub.
 *
 * <p>Returns a Flux that emits {entity} events for the specified {entity}.
 * The Flux completes when the subscriber disconnects or an error occurs.
 */
@Component
public class {Entity}EventSubscriber {

    private final ReactiveRedisTemplate<String, String> redisTemplate;
    private final ObjectMapper objectMapper;

    public {Entity}EventSubscriber(
            ReactiveRedisTemplate<String, String> redisTemplate,
            ObjectMapper objectMapper) {
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
    }

    /**
     * Subscribe to events for a specific {entity}.
     *
     * @param id the {entity} ID to subscribe to
     * @return Flux of {entity} events (infinite until cancelled)
     */
    public Flux<{Entity}Event> subscribe(String id) {
        return redisTemplate.listenTo(ChannelTopic.of(channel(id)))
                .map(ReactiveSubscription.Message::getMessage)
                .flatMap(this::deserialize)
                .doOnSubscribe(s -> log.debug("Subscribed to {entity} events: {}", id))
                .doOnCancel(() -> log.debug("Unsubscribed from {entity} events: {}", id))
                .onErrorResume(e -> {
                    log.warn("Error in {entity} subscription: {}", e.getMessage());
                    return Flux.empty();
                });
    }

    /**
     * Subscribe to events matching a pattern (e.g., all {entities} for a store).
     *
     * @param pattern the channel pattern (e.g., "{entity}:store:1234:*")
     * @return Flux of {entity} events from all matching channels
     */
    public Flux<{Entity}Event> subscribePattern(String pattern) {
        return redisTemplate.listenToPattern(pattern)
                .map(ReactiveSubscription.Message::getMessage)
                .flatMap(this::deserialize)
                .onErrorResume(e -> Flux.empty());
    }

    private String channel(String id) {
        return "{entity}:" + id + ":events";
    }

    private Mono<{Entity}Event> deserialize(String json) {
        return Mono.fromCallable(() -> objectMapper.readValue(json, {Entity}Event.class))
                .onErrorResume(JsonProcessingException.class, e -> {
                    log.warn("Failed to deserialize {entity} event: {}", e.getMessage());
                    return Mono.empty();
                });
    }
}
```

## Integration with Service Layer

### Publishing Events on Mutations

```java
package org.example.{domain}.service;

import org.example.{domain}.event.{Entity}Event;
import org.example.{domain}.event.{Entity}EventType;
import org.example.{domain}.pubsub.{Entity}EventPublisher;
import org.example.{domain}.repository.{Entity}Repository;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Service
public class {Entity}Service {

    private final {Entity}Repository repository;
    private final {Entity}EventPublisher eventPublisher;

    public Mono<{Entity}> create({Entity} {entity}) {
        return repository.save({entity})
                .flatMap(saved ->
                        // Publish event after successful mutation
                        eventPublisher.publish({Entity}Event.of({Entity}EventType.CREATED, saved))
                                .thenReturn(saved)
                );
    }

    public Mono<{Entity}> update({Entity} {entity}) {
        return repository.save({entity})
                .flatMap(saved ->
                        eventPublisher.publish({Entity}Event.of({Entity}EventType.UPDATED, saved))
                                .thenReturn(saved)
                );
    }

    public Mono<Void> delete(String id) {
        return repository.findById(id)
                .flatMap({entity} ->
                        repository.delete({entity})
                                .then(eventPublisher.publish(
                                        {Entity}Event.of({Entity}EventType.DELETED, {entity})))
                );
    }
}
```

## GraphQL Subscription Integration

For GraphQL subscriptions using Spring for GraphQL 2.0 with SSE transport.

### GraphQL Schema

```graphql
type Subscription {
  {entity}Updated({entity}Id: ID!): {Entity}Event!
}

type {Entity}Event {
  eventType: {Entity}EventType!
  {entity}: {Entity}!
  timestamp: DateTime!
}

enum {Entity}EventType {
  CREATED
  UPDATED
  DELETED
  # Add domain-specific event types
}
```

### Subscription Resolver

```java
package org.example.{domain}.graphql;

import org.example.{domain}.event.{Entity}Event;
import org.example.{domain}.pubsub.{Entity}EventSubscriber;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.SubscriptionMapping;
import org.springframework.stereotype.Controller;
import reactor.core.publisher.Flux;

/**
 * GraphQL subscription resolver for {entity} updates.
 *
 * <p>Uses Redis Pub/Sub for cross-instance event fan-out.
 * SSE transport is used by default (no WebSocket configuration needed).
 */
@Controller
public class {Entity}SubscriptionController {

    private final {Entity}EventSubscriber eventSubscriber;

    public {Entity}SubscriptionController({Entity}EventSubscriber eventSubscriber) {
        this.eventSubscriber = eventSubscriber;
    }

    /**
     * Subscribe to updates for a specific {entity}.
     *
     * <p>Returns a Flux that emits {Entity}Event whenever the {entity} is modified.
     * Clients connect via SSE: GET /graphql with Accept: text/event-stream
     *
     * @param {entity}Id the {entity} ID to subscribe to
     * @return Flux of {entity} events
     */
    @SubscriptionMapping
    public Flux<{Entity}Event> {entity}Updated(@Argument String {entity}Id) {
        return eventSubscriber.subscribe({entity}Id);
    }
}
```

### Client Integration (Browser EventSource)

```javascript
// Browser client using native EventSource API
const query = `subscription { {entity}Updated({entity}Id: "${id}") { eventType {entity} { id /* other fields */ } } }`;
const url = `/graphql?query=${encodeURIComponent(query)}`;

const eventSource = new EventSource(url, {
  headers: { 'Authorization': `Bearer ${token}` }
});

eventSource.onmessage = (event) => {
  const { data } = JSON.parse(event.data);
  const {entity}Event = data.{entity}Updated;
  console.log('{Entity} updated:', {entity}Event.eventType, {entity}Event.{entity});
  updateUI({entity}Event.{entity});
};

eventSource.onerror = (error) => {
  console.error('SSE connection error:', error);
  // EventSource automatically attempts reconnection
  // On reconnect, fetch current state
  fetchCurrentState(id);
};

// Clean up on unmount
window.addEventListener('beforeunload', () => eventSource.close());
```

## Testing

```java
package org.example.{domain}.pubsub;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;
import reactor.core.publisher.Flux;
import reactor.test.StepVerifier;

import java.time.Duration;
import java.util.List;

@SpringBootTest
@Testcontainers
class {Entity}EventPubSubTest {

    @Container
    static GenericContainer<?> redis = new GenericContainer<>(DockerImageName.parse("redis:7-alpine"))
            .withExposedPorts(6379);

    @DynamicPropertySource
    static void registerProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.data.redis.host", redis::getHost);
        registry.add("spring.data.redis.port", redis::getFirstMappedPort);
    }

    @Autowired
    private {Entity}EventPublisher publisher;

    @Autowired
    private {Entity}EventSubscriber subscriber;

    @Autowired
    private ReactiveRedisTemplate<String, String> redisTemplate;

    @BeforeEach
    void setUp() {
        redisTemplate.execute(connection -> connection.serverCommands().flushAll())
                .blockLast();
    }

    @Test
    void shouldPublishAndReceiveEvent() {
        String id = "test-{entity}-123";
        {Entity} {entity} = new {Entity}(id, /* other fields */);
        {Entity}Event event = {Entity}Event.of({Entity}EventType.CREATED, {entity});

        // Subscribe first (Pub/Sub requires subscriber before publish)
        StepVerifier.create(
                subscriber.subscribe(id)
                        .doOnSubscribe(s ->
                                // Publish after subscription is established
                                publisher.publish(event).subscribe())
                        .take(1)
                        .timeout(Duration.ofSeconds(5))
        )
        .expectNextMatches(received ->
                received.eventType() == {Entity}EventType.CREATED &&
                received.{entity}Id().equals(id))
        .verifyComplete();
    }

    @Test
    void shouldHandleMultipleSubscribers() {
        String id = "test-{entity}-456";
        {Entity} {entity} = new {Entity}(id, /* other fields */);
        {Entity}Event event = {Entity}Event.of({Entity}EventType.UPDATED, {entity});

        // Two subscribers receive the same event
        var sub1 = subscriber.subscribe(id).take(1);
        var sub2 = subscriber.subscribe(id).take(1);

        StepVerifier.create(
                Flux.merge(sub1, sub2)
                        .doOnSubscribe(s -> publisher.publish(event).subscribe())
                        .timeout(Duration.ofSeconds(5))
        )
        .expectNextCount(2)
        .verifyComplete();
    }

    @Test
    void shouldNotReceiveEventsForOtherEntities() {
        String id1 = "{entity}-1";
        String id2 = "{entity}-2";
        {Entity} {entity}2 = new {Entity}(id2, /* other fields */);
        {Entity}Event event = {Entity}Event.of({Entity}EventType.CREATED, {entity}2);

        // Subscribe to {entity}-1 but publish to {entity}-2
        StepVerifier.create(
                subscriber.subscribe(id1)
                        .doOnSubscribe(s -> publisher.publish(event).subscribe())
                        .timeout(Duration.ofMillis(500))
        )
        .expectTimeout(Duration.ofMillis(500))
        .verify();
    }
}
```

## Anti-Patterns

### Expecting Message Durability

```java
// DON'T - relying on Pub/Sub for durable events
public Mono<Void> recordAuditEvent(AuditEvent event) {
    return publisher.publish(event);  // Lost if no subscribers!
}

// DO - use Redis Streams for durable events
public Mono<Void> recordAuditEvent(AuditEvent event) {
    return redisTemplate.opsForStream()
            .add(StreamRecords.newRecord().ofObject(event).withStreamKey("audit:events"));
}
```

### Blocking on Publish Result

```java
// DON'T - making mutations depend on publish success
public Mono<{Entity}> create({Entity} {entity}) {
    return repository.save({entity})
            .flatMap(saved ->
                publisher.publish(event)
                        .map(count -> {
                            if (count == 0) throw new RuntimeException("No subscribers!");
                            return saved;
                        }));
}

// DO - publish is fire-and-forget; mutation succeeds regardless
public Mono<{Entity}> create({Entity} {entity}) {
    return repository.save({entity})
            .flatMap(saved ->
                publisher.publish(event)
                        .onErrorResume(e -> Mono.empty())  // Don't fail mutation
                        .thenReturn(saved));
}
```

### Publishing Large Payloads

```java
// DON'T - publishing entire entity graphs
public Mono<Void> publish({Entity}Event event) {
    // Entity with nested objects, full related entities, binary data...
    return publisher.publish(event);  // Huge JSON payload
}

// DO - publish minimal event; subscribers fetch details if needed
public Mono<Void> publish({Entity}Event event) {
    var minimalEvent = new {Entity}Event(
            event.eventType(),
            event.{entity}Id(),
            event.timestamp(),
            null  // Don't include full entity; subscriber fetches if needed
    );
    return publisher.publish(minimalEvent);
}
```

### Missing Reconnection Handling

```javascript
// DON'T - assuming connection never breaks
const eventSource = new EventSource(url);
eventSource.onmessage = (e) => updateUI(JSON.parse(e.data));
// What happens when connection drops? UI shows stale data!

// DO - handle reconnection and re-fetch current state
const eventSource = new EventSource(url);
eventSource.onmessage = (e) => updateUI(JSON.parse(e.data));
eventSource.onopen = () => fetchCurrentState();  // Re-fetch on reconnect
eventSource.onerror = (e) => {
  if (eventSource.readyState === EventSource.CONNECTING) {
    showReconnectingIndicator();
  }
};
```

## Pub/Sub vs. Streams Decision Guide

| Requirement | Use Pub/Sub | Use Streams |
|-------------|-------------|-------------|
| Real-time notifications | ✅ | ⚠️ Overkill |
| Message durability | ❌ | ✅ |
| Replay/catch-up | ❌ | ✅ |
| Exactly-once delivery | ❌ | ✅ |
| Consumer groups | ❌ | ✅ |
| GraphQL subscriptions | ✅ | ❌ |
| Audit events | ❌ | ✅ |
| Work distribution | ❌ | ✅ |
| Latency-critical | ✅ (~1ms) | ⚠️ (~5ms) |

## Checklist

Before using this template, verify:

- [ ] Added Redis reactive starter dependency
- [ ] Defined consistent channel naming patterns (use channel builder class)
- [ ] Event model is serializable (record with Jackson annotations if needed)
- [ ] Publisher handles errors gracefully (doesn't break mutations)
- [ ] Subscriber handles disconnection gracefully
- [ ] Client-side reconnection logic is implemented
- [ ] Added integration tests with Testcontainers
- [ ] Documented channel patterns for ops/debugging

## Related Templates

- `_template_redis_cache.md` - For caching with TTL
- `_template_redis_streams.md` - For durable event streaming (audit, work queues)

## References

- ADR 004: GraphQL Subscriptions Architecture - Decision to use Redis Pub/Sub for subscriptions
- [Spring for GraphQL SSE Subscriptions](https://docs.spring.io/spring-graphql/reference/)
- [Redis Pub/Sub Documentation](https://redis.io/docs/interact/pubsub/)
