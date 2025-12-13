# 059_EVENT_STREAM_UNIFICATION

**Status: READY**

---

## Overview

Unify the event-stream patterns across the platform by consolidating all event publishers and consumers onto the `platform-events` library with CloudEvents v1.0 compliance. This is a **breaking change** that eliminates the custom `AuditEvent` format in favor of native CloudEvents.

**Related Plans:**
- `055B_PLATFORM_EVENTS.md` - Original platform-events implementation
- `057_ORDER_SERVICE_OWN_DB_AND_EVENT_CONSUMER.md` - Order service event consumption (depends on this plan)

## Goals

1. Migrate audit-service consumer to extend `EventConsumer` base class
2. Replace `AuditEvent` with `AuditEventData` as CloudEvent payload (breaking change)
3. Eliminate duplicate event infrastructure code
4. Establish events standard and template for future consumers

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Schema change | Breaking change | Cleaner architecture, no conversion layer |
| Audit fields location | All in CloudEvent `data` payload | Clean separation of envelope vs domain data |
| Migration strategy | Big bang | Simpler, audit events are non-critical |
| Database schema | Unchanged | Wire format changes, storage model stays |

## CloudEvent Structure

```
CloudEvent (envelope)
├── id: "uuid"                           ← event identifier
├── source: "/cart-service"              ← publishing service
├── type: "org.example.audit.CART_CREATED"
├── subject: "CART:cart-123"             ← entityType:entityId
├── time: "2025-12-12T..."
└── data: {                              ← AuditEventData
      storeNumber: 100,
      userId: "user01",
      sessionId: "sess-uuid",
      traceId: "trace-uuid",
      payload: { ... }                   ← event-specific details
    }
```

## References

**Standards:**
- `docs/standards/backend/events.md` - CloudEvents patterns (created by this plan)

**Templates:**
- `docs/templates/backend/_template_event_consumer.md` - Consumer implementation template (created by this plan)

## Architecture

### Current State (Two Parallel Systems)

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CURRENT ARCHITECTURE                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  checkout-service                    cart-service                    │
│  ┌─────────────────┐                ┌─────────────────┐             │
│  │ CloudEvent-     │                │ Audit-          │             │
│  │ Publisher       │                │ EventPublisher  │             │
│  │ (platform-      │                │ (platform-      │             │
│  │  events)        │                │  audit)         │             │
│  └────────┬────────┘                └────────┬────────┘             │
│           │                                  │                       │
│           ▼                                  ▼                       │
│  ┌─────────────────┐                ┌─────────────────┐             │
│  │ orders:completed│                │ audit-events    │             │
│  │ (CloudEvents)   │                │ (Custom format) │             │
│  └────────┬────────┘                └────────┬────────┘             │
│           │                                  │                       │
│           │                     ┌────────────┘                       │
│           │                     ▼                                    │
│           │            ┌─────────────────┐                          │
│           │            │ AuditEvent-     │                          │
│           │            │ Consumer        │                          │
│           │            │ (CUSTOM impl)   │◄── Duplicates platform!  │
│           │            └─────────────────┘                          │
│           ▼                                                          │
│  ┌─────────────────┐                                                │
│  │ order-service   │                                                │
│  │ (future plan    │                                                │
│  │  057)           │                                                │
│  └─────────────────┘                                                │
└─────────────────────────────────────────────────────────────────────┘
```

### Target State (Unified on platform-events)

```
┌─────────────────────────────────────────────────────────────────────┐
│                         TARGET ARCHITECTURE                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  checkout-service                    cart-service                    │
│  ┌─────────────────┐                ┌─────────────────┐             │
│  │ CloudEvent-     │                │ RedisStream-    │             │
│  │ Publisher       │                │ AuditPublisher  │◄── Changed  │
│  │ (platform-      │                │ (uses Cloud-    │             │
│  │  events)        │                │  EventSerializer│             │
│  └────────┬────────┘                └────────┬────────┘             │
│           │                                  │                       │
│           ▼                                  ▼                       │
│  ┌─────────────────┐                ┌─────────────────┐             │
│  │ orders:completed│                │ audit:events    │             │
│  │ (CloudEvents)   │                │ (CloudEvents)   │◄── Changed  │
│  └────────┬────────┘                └────────┬────────┘             │
│           │                                  │                       │
│           │                     ┌────────────┘                       │
│           │                     ▼                                    │
│           │            ┌─────────────────┐                          │
│           │            │ AuditEvent-     │                          │
│           │            │ Consumer        │                          │
│           │            │ extends Event-  │◄── Changed               │
│           │            │ Consumer        │                          │
│           │            └─────────────────┘                          │
│           ▼                                                          │
│  ┌─────────────────┐                                                │
│  │ order-service   │                                                │
│  │ OrderCompleted- │                                                │
│  │ Consumer        │                                                │
│  │ extends Event-  │                                                │
│  │ Consumer        │                                                │
│  └─────────────────┘                                                │
└─────────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
Publisher                    Wire                     Consumer                  DB
────────                    ────                     ────────                  ──
AuditEventData  →  CloudEvent  →  Redis  →  CloudEvent  →  AuditRecord  →  PostgreSQL
(domain data)      (envelope)               (deserialize)   (map fields)     (unchanged)
```

### Dependency Order

```
Phase 1: Documentation (COMPLETE)
        │
        ▼
Phase 2: platform-audit → CloudEvents
        │
        ▼
Phase 3: audit-service Consumer Migration
        │
        ▼
Phase 4: Cleanup (cart-service, integration test)
        │
        ▼
Plan 057 can proceed (order-service consumer)
```

---

## Phase 1: Documentation (COMPLETE)

Standards and templates have been created as part of this plan initiation.

### 1.1 Events Standard

**Files:**
- CREATE: `docs/standards/backend/events.md` ✓

### 1.2 Event Consumer Template

**Files:**
- CREATE: `docs/templates/backend/_template_event_consumer.md` ✓

---

## Phase 2: Migrate platform-audit to CloudEvents

**Prereqs:** Phase 1 complete
**Blockers:** None

### 2.1 Rename AuditEvent to AuditEventData

**Files:**
- RENAME: `libs/backend/platform/platform-audit/src/main/java/org/example/platform/audit/AuditEvent.java`
  → `AuditEventData.java`

**Implementation:**

The record becomes the CloudEvent data payload (no envelope fields):

```java
package org.example.platform.audit;

import java.util.Map;

/**
 * Audit event data payload for CloudEvents.
 *
 * <p>This record represents the domain-specific data carried in a CloudEvent.
 * The CloudEvent envelope provides: id, source, type, subject, time.
 *
 * @param entityType Type of entity (e.g., "CART", "ORDER")
 * @param entityId Entity identifier
 * @param storeNumber Store context
 * @param userId User who performed the action
 * @param sessionId Session context
 * @param traceId Distributed tracing ID
 * @param payload Event-specific data
 */
public record AuditEventData(
    String entityType,
    String entityId,
    int storeNumber,
    String userId,
    String sessionId,
    String traceId,
    Map<String, Object> payload
) {
    public static AuditEventDataBuilder builder() {
        return new AuditEventDataBuilder();
    }

    public static class AuditEventDataBuilder {
        private String entityType;
        private String entityId;
        private int storeNumber;
        private String userId;
        private String sessionId;
        private String traceId;
        private Map<String, Object> payload = Map.of();

        public AuditEventDataBuilder entityType(String entityType) {
            this.entityType = entityType;
            return this;
        }

        public AuditEventDataBuilder entityId(String entityId) {
            this.entityId = entityId;
            return this;
        }

        public AuditEventDataBuilder storeNumber(int storeNumber) {
            this.storeNumber = storeNumber;
            return this;
        }

        public AuditEventDataBuilder userId(String userId) {
            this.userId = userId;
            return this;
        }

        public AuditEventDataBuilder sessionId(String sessionId) {
            this.sessionId = sessionId;
            return this;
        }

        public AuditEventDataBuilder traceId(String traceId) {
            this.traceId = traceId;
            return this;
        }

        public AuditEventDataBuilder payload(Map<String, Object> payload) {
            this.payload = payload != null ? payload : Map.of();
            return this;
        }

        public AuditEventData build() {
            return new AuditEventData(
                entityType, entityId, storeNumber, userId, sessionId, traceId, payload);
        }
    }
}
```

### 2.2 Update AuditEventPublisher Interface

**Files:**
- MODIFY: `libs/backend/platform/platform-audit/src/main/java/org/example/platform/audit/AuditEventPublisher.java`

**Implementation:**

```java
package org.example.platform.audit;

import reactor.core.publisher.Mono;

/**
 * Publisher interface for audit events.
 */
public interface AuditEventPublisher {

    /**
     * Publishes an audit event (fire-and-forget).
     *
     * @param eventType Event type (e.g., "CART_CREATED")
     * @param data Audit event data payload
     * @return Mono completing when published (errors are logged, not propagated)
     */
    Mono<Void> publish(String eventType, AuditEventData data);

    /**
     * Publishes an audit event and awaits confirmation.
     *
     * @param eventType Event type
     * @param data Audit event data payload
     * @return Mono with the record ID, or error if publish fails
     */
    Mono<String> publishAndAwait(String eventType, AuditEventData data);
}
```

### 2.3 Update RedisStreamAuditPublisher

**Files:**
- MODIFY: `libs/backend/platform/platform-audit/src/main/java/org/example/platform/audit/RedisStreamAuditPublisher.java`

**Implementation:**

```java
package org.example.platform.audit;

import java.net.URI;
import java.util.Map;
import org.example.platform.events.CloudEventSerializer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.connection.stream.RecordId;
import org.springframework.data.redis.connection.stream.StreamRecords;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import io.cloudevents.CloudEvent;
import reactor.core.publisher.Mono;

/**
 * Redis Streams implementation of AuditEventPublisher using CloudEvents format.
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
            .onErrorResume(e -> {
                log.warn("Failed to publish audit event: eventType={}, entityId={}, error={}",
                    eventType, data.entityId(), e.getMessage());
                return Mono.empty();
            });
    }

    @Override
    public Mono<String> publishAndAwait(String eventType, AuditEventData data) {
        return publishInternal(eventType, data)
            .map(RecordId::getValue)
            .timeout(properties.publishTimeout())
            .doOnSuccess(recordId ->
                log.debug("Published audit event: eventType={}, recordId={}", eventType, recordId))
            .doOnError(e ->
                log.error("Failed to publish audit event: eventType={}, entityId={}, error={}",
                    eventType, data.entityId(), e.getMessage()));
    }

    private Mono<RecordId> publishInternal(String eventType, AuditEventData data) {
        return Mono.defer(() -> {
            String type = "org.example.audit." + eventType;
            String subject = data.entityType() + ":" + data.entityId();

            CloudEvent cloudEvent = serializer.buildEvent(type, source, subject, data);
            String payload = serializer.serialize(cloudEvent);

            Map<String, String> fields = Map.of(
                "eventId", cloudEvent.getId(),
                "eventType", cloudEvent.getType(),
                "payload", payload
            );

            return redisTemplate.opsForStream()
                .add(StreamRecords.newRecord().in(properties.streamKey()).ofMap(fields));
        });
    }
}
```

### 2.4 Update AuditAutoConfiguration

**Files:**
- MODIFY: `libs/backend/platform/platform-audit/src/main/java/org/example/platform/audit/AuditAutoConfiguration.java`

**Implementation:**

Add `CloudEventSerializer` dependency and `source` URI configuration:

```java
@Bean
@ConditionalOnProperty(name = "audit.enabled", havingValue = "true", matchIfMissing = true)
public AuditEventPublisher auditEventPublisher(
        ReactiveRedisTemplate<String, String> redisTemplate,
        CloudEventSerializer cloudEventSerializer,
        AuditProperties properties,
        @Value("${spring.application.name:unknown}") String applicationName) {
    URI source = URI.create("/" + applicationName);
    return new RedisStreamAuditPublisher(redisTemplate, cloudEventSerializer, properties, source);
}
```

### 2.5 Add platform-events Dependency

**Files:**
- MODIFY: `libs/backend/platform/platform-audit/build.gradle.kts`

**Implementation:**

```kotlin
dependencies {
    api(platform(project(":libs:backend:platform:platform-bom")))
    annotationProcessor(platform(project(":libs:backend:platform:platform-bom")))

    // Platform libraries
    api(project(":libs:backend:platform:platform-events"))
    api(project(":libs:backend:platform:platform-logging"))
    api(project(":libs:backend:platform:platform-resilience"))

    // Core dependencies
    api("org.springframework.boot:spring-boot-starter-webflux")
    api("org.springframework.boot:spring-boot-starter-data-redis-reactive")
    api("org.springframework.boot:spring-boot-jackson2")

    // Auto-configuration support
    implementation("org.springframework.boot:spring-boot-autoconfigure")
    annotationProcessor("org.springframework.boot:spring-boot-configuration-processor")

    // Test dependencies
    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("io.projectreactor:reactor-test")
}
```

### 2.6 Update NoOpAuditPublisher

**Files:**
- MODIFY: `libs/backend/platform/platform-audit/src/main/java/org/example/platform/audit/NoOpAuditPublisher.java`

**Implementation:**

```java
package org.example.platform.audit;

import reactor.core.publisher.Mono;

/**
 * No-op implementation for testing or when audit is disabled.
 */
public class NoOpAuditPublisher implements AuditEventPublisher {

    @Override
    public Mono<Void> publish(String eventType, AuditEventData data) {
        return Mono.empty();
    }

    @Override
    public Mono<String> publishAndAwait(String eventType, AuditEventData data) {
        return Mono.just("no-op");
    }
}
```

---

## Phase 3: Migrate audit-service Consumer

**Prereqs:** Phase 2 complete (CloudEvents format on wire)
**Blockers:** None

### 3.1 Refactor AuditEventConsumer to Extend EventConsumer

**Files:**
- MODIFY: `apps/audit-service/src/main/java/org/example/audit/consumer/AuditEventConsumer.java`

**Implementation:**

```java
package org.example.audit.consumer;

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
 * <p>Extends platform EventConsumer for standardized Redis Streams consumption
 * with retry and dead-letter queue handling.
 */
@Component
public class AuditEventConsumer extends EventConsumer {

    private static final Logger log = LoggerFactory.getLogger(AuditEventConsumer.class);
    private static final String EVENT_TYPE_PREFIX = "org.example.audit.";

    private final AuditRepository auditRepository;
    private final CloudEventSerializer serializer;

    public AuditEventConsumer(
            ReactiveRedisTemplate<String, String> redisTemplate,
            CloudEventSerializer serializer,
            EventStreamProperties properties,
            AuditRepository auditRepository) {
        super(redisTemplate, serializer, properties);
        this.auditRepository = auditRepository;
        this.serializer = serializer;
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
        AuditRecord record = mapToRecord(event, data);

        return auditRepository.saveRecord(record)
            .doOnSuccess(saved -> log.debug("Saved audit event: eventId={}", saved.eventId()))
            .then();
    }

    private AuditRecord mapToRecord(CloudEvent event, AuditEventData data) {
        String eventType = extractEventType(event.getType());

        return new AuditRecord(
            null,  // id (auto-generated)
            event.getId(),
            eventType,
            data.entityType(),
            data.entityId(),
            data.storeNumber(),
            data.userId(),
            data.sessionId(),
            data.traceId(),
            event.getTime() != null ? event.getTime().toInstant() : java.time.Instant.now(),
            data.payload()
        );
    }

    private String extractEventType(String fullType) {
        // "org.example.audit.CART_CREATED" → "CART_CREATED"
        if (fullType != null && fullType.startsWith(EVENT_TYPE_PREFIX)) {
            return fullType.substring(EVENT_TYPE_PREFIX.length());
        }
        return fullType;
    }
}
```

### 3.2 Update AuditRepository Interface

**Files:**
- MODIFY: `apps/audit-service/src/main/java/org/example/audit/repository/AuditRepository.java`

**Implementation:**

Add `saveRecord` method, keep existing query methods:

```java
package org.example.audit.repository;

import org.example.audit.domain.AuditRecord;
import org.example.audit.domain.TimeRange;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * Repository interface for audit event storage and retrieval.
 */
public interface AuditRepository {

    /**
     * Saves an audit record to the database.
     *
     * @param record The audit record to save
     * @return The saved audit record with generated ID
     */
    Mono<AuditRecord> saveRecord(AuditRecord record);

    /**
     * Finds an audit record by event ID.
     *
     * @param eventId The event ID
     * @return The audit record if found
     */
    Mono<AuditRecord> findByEventId(String eventId);

    /**
     * Finds audit records for a specific entity.
     */
    Flux<AuditRecord> findByEntity(
        String entityType, String entityId, TimeRange timeRange, String eventType, int limit);

    /**
     * Finds audit records by user.
     */
    Flux<AuditRecord> findByUser(String userId, TimeRange timeRange, int limit);

    /**
     * Finds audit records by store and entity type.
     */
    Flux<AuditRecord> findByStoreAndEntityType(
        int storeNumber, String entityType, TimeRange timeRange, String eventType, int limit);
}
```

### 3.3 Update R2dbcAuditRepository

**Files:**
- MODIFY: `apps/audit-service/src/main/java/org/example/audit/repository/R2dbcAuditRepository.java`

**Implementation:**

Simplify to work directly with `AuditRecord`:

```java
@Override
public Mono<AuditRecord> saveRecord(AuditRecord record) {
    return template.insert(record)
        .doOnSuccess(r -> log.debug("Saved audit record: eventId={}", r.eventId()))
        .doOnError(e -> log.error("Failed to save audit record: eventId={}, error={}",
            record.eventId(), e.getMessage()));
}

@Override
public Mono<AuditRecord> findByEventId(String eventId) {
    return template.selectOne(
        Query.query(Criteria.where("event_id").is(eventId)),
        AuditRecord.class);
}
```

### 3.4 Update application.yml

**Files:**
- MODIFY: `apps/audit-service/src/main/resources/application.yml`

**Implementation:**

Replace `audit.consumer` with `platform.events`:

```yaml
# Platform events consumer configuration
platform:
  events:
    stream-key: audit:events
    consumer-group: audit-service
    consumer-name: ${HOSTNAME:audit-consumer-1}
    batch-size: 100
    poll-interval: 100ms
    max-retries: 3
    retry-delay: 1s
```

Remove the old `audit.consumer` section.

### 3.5 Delete Custom DeadLetterHandler

**Files:**
- DELETE: `apps/audit-service/src/main/java/org/example/audit/consumer/DeadLetterHandler.java`

Base `EventConsumer` provides DLQ handling via `handleDeadLetter()`.

### 3.6 Delete AuditConsumerProperties

**Files:**
- DELETE: `apps/audit-service/src/main/java/org/example/audit/config/AuditConsumerProperties.java`

Use `EventStreamProperties` from platform-events instead.

### 3.7 Add platform-events Dependency to audit-service

**Files:**
- MODIFY: `apps/audit-service/build.gradle.kts`

**Implementation:**

Ensure platform-events is available (may come transitively via platform-audit):

```kotlin
dependencies {
    implementation(project(":libs:backend:platform:platform-events"))
    implementation(project(":libs:backend:platform:platform-audit"))
    // ... existing dependencies
}
```

---

## Phase 4: Cleanup & Verification

**Prereqs:** Phase 3 complete
**Blockers:** None

### 4.1 Delete Duplicate AuditEvent from cart-service

**Files:**
- DELETE: `apps/cart-service/src/main/java/org/example/cart/audit/AuditEvent.java`
- DELETE: `apps/cart-service/src/main/java/org/example/cart/audit/AuditEventPublisher.java`
- DELETE: `apps/cart-service/src/main/java/org/example/cart/audit/NoOpAuditEventPublisher.java`

### 4.2 Update Cart Service Audit Usage

**Files:**
- MODIFY: Any cart-service code that creates audit events

**Implementation:**

Update to use new API:

```java
// Before
AuditEvent event = AuditEvent.cartEvent("CART_CREATED", cartId, storeNumber, userId, sessionId, data);
publisher.publish(event);

// After
AuditEventData data = AuditEventData.builder()
    .entityType("CART")
    .entityId(cartId)
    .storeNumber(storeNumber)
    .userId(userId)
    .sessionId(sessionId)
    .traceId(traceId)
    .payload(eventData)
    .build();
publisher.publish("CART_CREATED", data);
```

### 4.3 Create Integration Test

**Files:**
- CREATE: `apps/audit-service/src/test/java/org/example/audit/integration/AuditConsumerIntegrationTest.java`

**Implementation:**

Verify end-to-end flow:
1. Publish CloudEvent to Redis Stream
2. Consumer processes event
3. Record saved to PostgreSQL
4. Verify failed events land in DLQ

### 4.4 Update CLAUDE.md References

**Files:**
- MODIFY: `CLAUDE.md`

**Implementation:**

Add events standard to standards reference table:

```markdown
| `docs/standards/backend/events.md` | CloudEvents patterns |
```

---

## Files Summary

| Action | File | Purpose |
|--------|------|---------|
| COMPLETE | `docs/standards/backend/events.md` | CloudEvents standard |
| COMPLETE | `docs/templates/backend/_template_event_consumer.md` | Consumer template |
| RENAME | `platform-audit/.../AuditEvent.java` → `AuditEventData.java` | Data payload record |
| MODIFY | `platform-audit/.../AuditEventPublisher.java` | New interface signature |
| MODIFY | `platform-audit/.../RedisStreamAuditPublisher.java` | CloudEvents publishing |
| MODIFY | `platform-audit/.../NoOpAuditPublisher.java` | Match new interface |
| MODIFY | `platform-audit/.../AuditAutoConfiguration.java` | Wire CloudEventSerializer |
| MODIFY | `platform-audit/build.gradle.kts` | Add platform-events dependency |
| MODIFY | `audit-service/.../AuditEventConsumer.java` | Extend EventConsumer |
| MODIFY | `audit-service/.../AuditRepository.java` | Add saveRecord method |
| MODIFY | `audit-service/.../R2dbcAuditRepository.java` | Simplify implementation |
| MODIFY | `audit-service/application.yml` | Use platform.events prefix |
| DELETE | `audit-service/.../DeadLetterHandler.java` | Remove duplicate |
| DELETE | `audit-service/.../AuditConsumerProperties.java` | Use EventStreamProperties |
| DELETE | `cart-service/.../audit/AuditEvent.java` | Remove duplicate |
| DELETE | `cart-service/.../audit/AuditEventPublisher.java` | Remove duplicate |
| DELETE | `cart-service/.../audit/NoOpAuditEventPublisher.java` | Remove duplicate |
| MODIFY | cart-service audit usage | Update to new API |
| CREATE | `audit-service/.../AuditConsumerIntegrationTest.java` | Verify migration |
| MODIFY | `CLAUDE.md` | Add events standard ref |

---

## Testing Strategy

1. **Unit Tests:**
   - `RedisStreamAuditPublisher` produces valid CloudEvents
   - `AuditEventConsumer.handleEvent()` correctly maps CloudEvent to AuditRecord

2. **Integration Tests:**
   - Publish audit event → verify CloudEvents format in Redis Stream
   - Consume CloudEvent → verify record saved to database
   - Simulate failure → verify event lands in DLQ with CloudEvents format

3. **No Backward Compatibility:**
   - This is a breaking change; old format events will fail parsing
   - Deploy publisher and consumer together

---

## Documentation Updates

| File | Update Required |
|------|-----------------|
| `CLAUDE.md` | Add `docs/standards/backend/events.md` to standards reference table |
| `libs/backend/platform/platform-audit/README.md` | Update to reference CloudEvents format |
| `libs/backend/platform/platform-events/README.md` | Add link to events standard |
| `apps/audit-service/AGENTS.md` | Update consumer implementation guidance |

---

## Checklist

- [x] Phase 1: Documentation complete (events.md, template created)
- [ ] Phase 2: platform-audit migrated to CloudEvents
  - [ ] 2.1 Rename AuditEvent to AuditEventData
  - [ ] 2.2 Update AuditEventPublisher interface
  - [ ] 2.3 Update RedisStreamAuditPublisher
  - [ ] 2.4 Update AuditAutoConfiguration
  - [ ] 2.5 Add platform-events dependency
  - [ ] 2.6 Update NoOpAuditPublisher
- [ ] Phase 3: audit-service consumer migration
  - [ ] 3.1 Refactor AuditEventConsumer
  - [ ] 3.2 Update AuditRepository interface
  - [ ] 3.3 Update R2dbcAuditRepository
  - [ ] 3.4 Update application.yml
  - [ ] 3.5 Delete DeadLetterHandler
  - [ ] 3.6 Delete AuditConsumerProperties
  - [ ] 3.7 Add platform-events dependency
- [ ] Phase 4: Cleanup and verification
  - [ ] 4.1 Delete cart-service audit duplicates
  - [ ] 4.2 Update cart-service audit usage
  - [ ] 4.3 Create integration test
  - [ ] 4.4 Update CLAUDE.md
- [ ] All tests passing
- [ ] Documentation updated
- [ ] Plan archived to `docs/plans/completed/`
