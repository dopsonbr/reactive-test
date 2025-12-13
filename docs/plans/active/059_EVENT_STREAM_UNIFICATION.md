# 059_EVENT_STREAM_UNIFICATION

**Status: DRAFT**

---

## Overview

Unify the event-stream patterns across the platform by consolidating all event publishers and consumers onto the `platform-events` library with CloudEvents v1.0 compliance. Currently, audit-service uses a custom consumer implementation while checkout-service uses platform-events. This plan eliminates the parallel frameworks.

**Related Plans:**
- `055B_PLATFORM_EVENTS.md` - Original platform-events implementation
- `057_ORDER_SERVICE_OWN_DB_AND_EVENT_CONSUMER.md` - Order service event consumption (depends on this plan)

## Goals

1. Migrate audit-service consumer to extend `EventConsumer` base class
2. Convert audit events to CloudEvents format while maintaining backward compatibility
3. Eliminate duplicate event infrastructure code
4. Establish events standard and template for future consumers

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
│  │ CloudEvent-     │                │ CloudEvent-     │             │
│  │ Publisher       │                │ Publisher       │◄── Changed  │
│  │ (platform-      │                │ (platform-      │             │
│  │  events)        │                │  events)        │             │
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

### Dependency Order

```
Documentation (this PR)
        │
        ├── Phase 1: Standards & Templates (already complete)
        │
        ▼
Phase 2: platform-audit → CloudEvents
        │
        ▼
Phase 3: audit-service Consumer Migration
        │
        ▼
Phase 4: Verification & Cleanup
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

### 2.1 Add CloudEvents Wrapper to AuditEvent

**Files:**
- MODIFY: `libs/backend/platform/platform-audit/src/main/java/org/example/platform/audit/AuditEvent.java`

**Implementation:**

Add method to convert AuditEvent to CloudEvent format:

```java
public CloudEvent toCloudEvent(URI source) {
    Map<String, Object> data = new LinkedHashMap<>();
    data.put("entityType", entityType);
    data.put("entityId", entityId);
    data.put("storeNumber", storeNumber);
    data.put("userId", userId);
    data.put("sessionId", sessionId);
    data.put("traceId", traceId);
    data.put("data", this.data);

    return CloudEventBuilder.v1()
        .withId(eventId)
        .withSource(source)
        .withType("org.example.audit." + eventType)
        .withSubject(entityType + ":" + entityId)
        .withTime(OffsetDateTime.ofInstant(timestamp, ZoneOffset.UTC))
        .withDataContentType("application/json")
        .withData("application/json", objectMapper.writeValueAsBytes(data))
        .build();
}
```

### 2.2 Update RedisStreamAuditPublisher

**Files:**
- MODIFY: `libs/backend/platform/platform-audit/src/main/java/org/example/platform/audit/RedisStreamAuditPublisher.java`

**Implementation:**

Use CloudEventSerializer for consistent wire format:

```java
public class RedisStreamAuditPublisher implements AuditEventPublisher {

    private final ReactiveRedisTemplate<String, String> redisTemplate;
    private final CloudEventSerializer serializer;
    private final AuditProperties properties;
    private final URI source;

    @Override
    public Mono<Void> publish(AuditEvent event) {
        CloudEvent cloudEvent = event.toCloudEvent(source);
        String payload = serializer.serialize(cloudEvent);

        return redisTemplate.opsForStream()
            .add(properties.streamKey(), Map.of(
                "eventId", cloudEvent.getId(),
                "eventType", cloudEvent.getType(),
                "payload", payload
            ))
            .then();
    }
}
```

### 2.3 Add platform-events Dependency to platform-audit

**Files:**
- MODIFY: `libs/backend/platform/platform-audit/build.gradle.kts`

**Implementation:**

```kotlin
dependencies {
    api(project(":libs:backend:platform:platform-events"))
    // existing dependencies...
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
@Component
public class AuditEventConsumer extends EventConsumer {

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
        AuditEventData data = serializer.extractData(event, AuditEventData.class);
        return auditRepository.save(toEntity(event, data)).then();
    }
}
```

### 3.2 Create AuditEventData Record

**Files:**
- CREATE: `apps/audit-service/src/main/java/org/example/audit/consumer/AuditEventData.java`

**Implementation:**

```java
public record AuditEventData(
    String entityType,
    String entityId,
    int storeNumber,
    String userId,
    String sessionId,
    String traceId,
    Map<String, Object> data
) {}
```

### 3.3 Update Configuration Properties

**Files:**
- MODIFY: `apps/audit-service/src/main/java/org/example/audit/config/AuditConsumerProperties.java`

**Implementation:**

Implement `EventStreamProperties` interface:

```java
@ConfigurationProperties(prefix = "events.consumer")
public record AuditConsumerProperties(
    String streamKey,
    String consumerGroup,
    String consumerName,
    int batchSize,
    Duration pollInterval,
    int maxRetries,
    Duration retryDelay
) implements EventStreamProperties {
    // Interface method implementations...
}
```

### 3.4 Update application.yml

**Files:**
- MODIFY: `apps/audit-service/src/main/resources/application.yml`

**Implementation:**

Rename properties to match standard:

```yaml
events:
  consumer:
    stream-key: audit:events
    consumer-group: audit-service-group
    consumer-name: ${HOSTNAME:audit-consumer-1}
    batch-size: 100
    poll-interval: 100ms
    max-retries: 3
    retry-delay: 1s
```

### 3.5 Delete Custom DeadLetterHandler

**Files:**
- DELETE: `apps/audit-service/src/main/java/org/example/audit/consumer/DeadLetterHandler.java`

**Implementation:**

Base `EventConsumer` provides DLQ handling. Remove custom implementation.

---

## Phase 4: Verification & Cleanup

**Prereqs:** Phase 3 complete
**Blockers:** None

### 4.1 Remove Duplicate AuditEvent from cart-service

**Files:**
- DELETE: `apps/cart-service/src/main/java/org/example/cart/audit/AuditEvent.java`
- MODIFY: `apps/cart-service/src/main/java/org/example/cart/audit/CartAuditService.java` (import platform version)

### 4.2 Integration Test

**Files:**
- MODIFY: `apps/audit-service/src/test/java/org/example/audit/integration/AuditConsumerIntegrationTest.java`

**Implementation:**

Verify:
1. CloudEvents format published by cart-service
2. Consumed by audit-service using new consumer
3. Stored in audit database
4. Failed events land in DLQ with correct format

### 4.3 Update CLAUDE.md References

**Files:**
- MODIFY: `CLAUDE.md`

**Implementation:**

Add events standard to standards reference table.

---

## Files Summary

| Action | File | Purpose |
|--------|------|---------|
| CREATE | `docs/standards/backend/events.md` | CloudEvents standard |
| CREATE | `docs/templates/backend/_template_event_consumer.md` | Consumer template |
| MODIFY | `libs/backend/platform/platform-audit/build.gradle.kts` | Add platform-events dep |
| MODIFY | `libs/backend/platform/platform-audit/.../AuditEvent.java` | CloudEvents conversion |
| MODIFY | `libs/backend/platform/platform-audit/.../RedisStreamAuditPublisher.java` | Use serializer |
| MODIFY | `apps/audit-service/.../AuditEventConsumer.java` | Extend EventConsumer |
| CREATE | `apps/audit-service/.../AuditEventData.java` | Event data record |
| MODIFY | `apps/audit-service/.../AuditConsumerProperties.java` | Implement interface |
| MODIFY | `apps/audit-service/src/main/resources/application.yml` | Rename properties |
| DELETE | `apps/audit-service/.../DeadLetterHandler.java` | Remove duplicate |
| DELETE | `apps/cart-service/.../audit/AuditEvent.java` | Remove duplicate |
| MODIFY | `apps/cart-service/.../audit/CartAuditService.java` | Import platform version |
| MODIFY | `apps/audit-service/.../AuditConsumerIntegrationTest.java` | Verify migration |
| MODIFY | `CLAUDE.md` | Add events standard ref |

---

## Testing Strategy

1. **Unit Tests:**
   - `AuditEvent.toCloudEvent()` produces valid CloudEvents
   - `AuditEventConsumer.handleEvent()` correctly maps data

2. **Integration Tests:**
   - Publish AuditEvent → verify CloudEvents format in Redis Stream
   - Consume CloudEvent → verify entity saved to database
   - Simulate failure → verify event lands in DLQ

3. **Backward Compatibility:**
   - During migration, consumer handles both old and new formats
   - Add `@Deprecated` to old format parsing, remove after migration verified

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
- [ ] Phase 3: audit-service consumer extends EventConsumer
- [ ] Phase 4: Cleanup and verification
- [ ] All tests passing
- [ ] Documentation updated
- [ ] Plan archived to `docs/plans/completed/`
