# 054B: Platform Events Library

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create `platform-events` library for CloudEvents-based Redis Streams publishing/consuming

**Architecture:** Wraps CloudEvents SDK with reactive Redis Streams integration, providing publisher and consumer base classes

**Tech Stack:** CloudEvents SDK 4.0.1, Spring Data Redis Reactive, Jackson

---

## Task 1: Add CloudEvents to Version Catalog

**Files:**
- Modify: `gradle/libs.versions.toml`

**Step 1: Add cloudevents version and libraries**

In `gradle/libs.versions.toml`, add to `[versions]` section (after archunit):

```toml
cloudevents = "4.0.1"
```

Add to `[libraries]` section (after archunit-junit5):

```toml
# CloudEvents
cloudevents-core = { module = "io.cloudevents:cloudevents-core", version.ref = "cloudevents" }
cloudevents-json-jackson = { module = "io.cloudevents:cloudevents-json-jackson", version.ref = "cloudevents" }
```

Add to `[bundles]` section:

```toml
cloudevents = ["cloudevents-core", "cloudevents-json-jackson"]
```

**Step 2: Verify syntax**

Run: `./gradlew help`

Expected: No errors (validates TOML syntax)

**Step 3: Commit**

```bash
git add gradle/libs.versions.toml
git commit -m "build: add CloudEvents SDK to version catalog"
```

---

## Task 2: Create Module Structure

**Files:**
- Create: `libs/backend/platform/platform-events/build.gradle.kts`
- Modify: `settings.gradle.kts`

**Step 1: Create build.gradle.kts**

Create file `libs/backend/platform/platform-events/build.gradle.kts`:

```kotlin
plugins {
    id("platform.library-conventions")
}

dependencies {
    api(platform(project(":libs:backend:platform:platform-bom")))
    annotationProcessor(platform(project(":libs:backend:platform:platform-bom")))

    // CloudEvents SDK
    api(libs.bundles.cloudevents)

    // Spring Data Redis Reactive
    api("org.springframework.boot:spring-boot-starter-data-redis-reactive")

    // Jackson for JSON serialization (Spring Boot provides version)
    api("org.springframework.boot:spring-boot-jackson2")

    // Platform libraries
    api(project(":libs:backend:platform:platform-logging"))

    // Auto-configuration support
    implementation("org.springframework.boot:spring-boot-autoconfigure")
    annotationProcessor("org.springframework.boot:spring-boot-configuration-processor")

    // Test dependencies
    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("io.projectreactor:reactor-test")
}
```

**Step 2: Add to settings.gradle.kts**

In `settings.gradle.kts`, add after line 19 (after platform-audit):

```kotlin
include("libs:backend:platform:platform-events")
```

**Step 3: Verify module recognized**

Run: `./gradlew :libs:backend:platform:platform-events:tasks`

Expected: Task list output

**Step 4: Commit**

```bash
git add libs/backend/platform/platform-events/build.gradle.kts settings.gradle.kts
git commit -m "feat(platform-events): add module structure"
```

---

## Task 3: Create EventStreamProperties Configuration

**Files:**
- Create: `libs/backend/platform/platform-events/src/main/java/org/example/platform/events/EventStreamProperties.java`
- Test: `libs/backend/platform/platform-events/src/test/java/org/example/platform/events/EventStreamPropertiesTest.java`

**Step 1: Write the failing test**

Create file `libs/backend/platform/platform-events/src/test/java/org/example/platform/events/EventStreamPropertiesTest.java`:

```java
package org.example.platform.events;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Duration;
import org.junit.jupiter.api.Test;

class EventStreamPropertiesTest {

  @Test
  void shouldHaveDefaultValues() {
    EventStreamProperties props = new EventStreamProperties();

    assertThat(props.getStreamKey()).isEqualTo("events:default");
    assertThat(props.getConsumerGroup()).isEqualTo("default-group");
    assertThat(props.getConsumerName()).isNotEmpty();
    assertThat(props.getBatchSize()).isEqualTo(10);
    assertThat(props.getPollInterval()).isEqualTo(Duration.ofMillis(100));
    assertThat(props.getPublishTimeout()).isEqualTo(Duration.ofSeconds(5));
    assertThat(props.getMaxRetries()).isEqualTo(3);
    assertThat(props.getRetryDelay()).isEqualTo(Duration.ofSeconds(1));
  }

  @Test
  void shouldAllowCustomConfiguration() {
    EventStreamProperties props = new EventStreamProperties();
    props.setStreamKey("orders:completed");
    props.setConsumerGroup("order-service-group");
    props.setBatchSize(20);

    assertThat(props.getStreamKey()).isEqualTo("orders:completed");
    assertThat(props.getConsumerGroup()).isEqualTo("order-service-group");
    assertThat(props.getBatchSize()).isEqualTo(20);
  }
}
```

**Step 2: Run test to verify it fails**

Run: `./gradlew :libs:backend:platform:platform-events:test --tests EventStreamPropertiesTest`

Expected: FAIL

**Step 3: Write minimal implementation**

Create file `libs/backend/platform/platform-events/src/main/java/org/example/platform/events/EventStreamProperties.java`:

```java
package org.example.platform.events;

import java.time.Duration;
import java.util.UUID;
import org.springframework.boot.context.properties.ConfigurationProperties;

/** Configuration properties for event stream publishing and consuming. */
@ConfigurationProperties(prefix = "platform.events")
public class EventStreamProperties {

  private String streamKey = "events:default";
  private String consumerGroup = "default-group";
  private String consumerName = "consumer-" + UUID.randomUUID().toString().substring(0, 8);
  private int batchSize = 10;
  private Duration pollInterval = Duration.ofMillis(100);
  private Duration publishTimeout = Duration.ofSeconds(5);
  private int maxRetries = 3;
  private Duration retryDelay = Duration.ofSeconds(1);
  private String deadLetterStreamSuffix = ":dlq";

  public String getStreamKey() {
    return streamKey;
  }

  public void setStreamKey(String streamKey) {
    this.streamKey = streamKey;
  }

  public String getConsumerGroup() {
    return consumerGroup;
  }

  public void setConsumerGroup(String consumerGroup) {
    this.consumerGroup = consumerGroup;
  }

  public String getConsumerName() {
    return consumerName;
  }

  public void setConsumerName(String consumerName) {
    this.consumerName = consumerName;
  }

  public int getBatchSize() {
    return batchSize;
  }

  public void setBatchSize(int batchSize) {
    this.batchSize = batchSize;
  }

  public Duration getPollInterval() {
    return pollInterval;
  }

  public void setPollInterval(Duration pollInterval) {
    this.pollInterval = pollInterval;
  }

  public Duration getPublishTimeout() {
    return publishTimeout;
  }

  public void setPublishTimeout(Duration publishTimeout) {
    this.publishTimeout = publishTimeout;
  }

  public int getMaxRetries() {
    return maxRetries;
  }

  public void setMaxRetries(int maxRetries) {
    this.maxRetries = maxRetries;
  }

  public Duration getRetryDelay() {
    return retryDelay;
  }

  public void setRetryDelay(Duration retryDelay) {
    this.retryDelay = retryDelay;
  }

  public String getDeadLetterStreamSuffix() {
    return deadLetterStreamSuffix;
  }

  public void setDeadLetterStreamSuffix(String deadLetterStreamSuffix) {
    this.deadLetterStreamSuffix = deadLetterStreamSuffix;
  }

  public String getDeadLetterStreamKey() {
    return streamKey + deadLetterStreamSuffix;
  }
}
```

**Step 4: Run test to verify it passes**

Run: `./gradlew :libs:backend:platform:platform-events:test --tests EventStreamPropertiesTest`

Expected: PASS

**Step 5: Commit**

```bash
git add libs/backend/platform/platform-events/src/
git commit -m "feat(platform-events): add EventStreamProperties configuration"
```

---

## Task 4: Create CloudEventSerializer

**Files:**
- Create: `libs/backend/platform/platform-events/src/main/java/org/example/platform/events/CloudEventSerializer.java`
- Test: `libs/backend/platform/platform-events/src/test/java/org/example/platform/events/CloudEventSerializerTest.java`

**Step 1: Write the failing test**

Create file `libs/backend/platform/platform-events/src/test/java/org/example/platform/events/CloudEventSerializerTest.java`:

```java
package org.example.platform.events;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import io.cloudevents.CloudEvent;
import io.cloudevents.core.builder.CloudEventBuilder;
import java.net.URI;
import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class CloudEventSerializerTest {

  private CloudEventSerializer serializer;
  private ObjectMapper objectMapper;

  @BeforeEach
  void setUp() {
    objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());
    serializer = new CloudEventSerializer(objectMapper);
  }

  @Test
  void shouldSerializeCloudEventToJson() {
    CloudEvent event =
        CloudEventBuilder.v1()
            .withId(UUID.randomUUID().toString())
            .withSource(URI.create("urn:example:checkout-service"))
            .withType("org.example.OrderCompleted")
            .withData("application/json", "{\"orderId\":\"123\"}".getBytes())
            .build();

    String json = serializer.serialize(event);

    assertThat(json).contains("org.example.OrderCompleted");
    assertThat(json).contains("urn:example:checkout-service");
    assertThat(json).contains("orderId");
  }

  @Test
  void shouldDeserializeJsonToCloudEvent() {
    String json =
        """
        {
          "specversion": "1.0",
          "id": "test-id-123",
          "source": "urn:example:checkout-service",
          "type": "org.example.OrderCompleted",
          "datacontenttype": "application/json",
          "data": {"orderId": "123"}
        }
        """;

    CloudEvent event = serializer.deserialize(json);

    assertThat(event.getId()).isEqualTo("test-id-123");
    assertThat(event.getSource().toString()).isEqualTo("urn:example:checkout-service");
    assertThat(event.getType()).isEqualTo("org.example.OrderCompleted");
  }

  @Test
  void shouldExtractTypedDataFromCloudEvent() {
    record TestData(String orderId, int amount) {}

    CloudEvent event =
        CloudEventBuilder.v1()
            .withId("test-id")
            .withSource(URI.create("urn:test"))
            .withType("test.event")
            .withData("application/json", "{\"orderId\":\"ABC\",\"amount\":100}".getBytes())
            .build();

    TestData data = serializer.extractData(event, TestData.class);

    assertThat(data.orderId()).isEqualTo("ABC");
    assertThat(data.amount()).isEqualTo(100);
  }

  @Test
  void shouldBuildCloudEventWithTypedData() {
    record OrderData(String orderId) {}
    OrderData data = new OrderData("ORD-123");

    CloudEvent event =
        serializer.buildEvent(
            "org.example.OrderCompleted",
            URI.create("urn:example:checkout-service"),
            "ORD-123",
            data);

    assertThat(event.getType()).isEqualTo("org.example.OrderCompleted");
    assertThat(event.getSubject()).isEqualTo("ORD-123");
    assertThat(new String(event.getData().toBytes())).contains("ORD-123");
  }
}
```

**Step 2: Run test to verify it fails**

Run: `./gradlew :libs:backend:platform:platform-events:test --tests CloudEventSerializerTest`

Expected: FAIL

**Step 3: Write minimal implementation**

Create file `libs/backend/platform/platform-events/src/main/java/org/example/platform/events/CloudEventSerializer.java`:

```java
package org.example.platform.events;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.cloudevents.CloudEvent;
import io.cloudevents.core.builder.CloudEventBuilder;
import io.cloudevents.core.data.PojoCloudEventData;
import io.cloudevents.jackson.JsonCloudEventData;
import java.net.URI;
import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;

/** Serializes and deserializes CloudEvents using Jackson. */
public class CloudEventSerializer {

  private static final String SPEC_VERSION = "1.0";
  private static final String DATA_CONTENT_TYPE = "application/json";

  private final ObjectMapper objectMapper;

  public CloudEventSerializer(ObjectMapper objectMapper) {
    this.objectMapper = objectMapper;
  }

  /**
   * Serialize a CloudEvent to JSON string.
   *
   * @param event the CloudEvent to serialize
   * @return JSON string representation
   */
  public String serialize(CloudEvent event) {
    try {
      Map<String, Object> map = new java.util.LinkedHashMap<>();
      map.put("specversion", event.getSpecVersion().toString());
      map.put("id", event.getId());
      map.put("source", event.getSource().toString());
      map.put("type", event.getType());

      if (event.getSubject() != null) {
        map.put("subject", event.getSubject());
      }
      if (event.getTime() != null) {
        map.put("time", event.getTime().toString());
      }
      if (event.getDataContentType() != null) {
        map.put("datacontenttype", event.getDataContentType());
      }
      if (event.getDataSchema() != null) {
        map.put("dataschema", event.getDataSchema().toString());
      }
      if (event.getData() != null) {
        byte[] dataBytes = event.getData().toBytes();
        Object dataObj = objectMapper.readValue(dataBytes, Object.class);
        map.put("data", dataObj);
      }

      return objectMapper.writeValueAsString(map);
    } catch (JsonProcessingException e) {
      throw new EventSerializationException("Failed to serialize CloudEvent", e);
    }
  }

  /**
   * Deserialize JSON string to CloudEvent.
   *
   * @param json JSON string
   * @return CloudEvent instance
   */
  @SuppressWarnings("unchecked")
  public CloudEvent deserialize(String json) {
    try {
      Map<String, Object> map = objectMapper.readValue(json, Map.class);

      CloudEventBuilder builder =
          CloudEventBuilder.v1()
              .withId((String) map.get("id"))
              .withSource(URI.create((String) map.get("source")))
              .withType((String) map.get("type"));

      if (map.containsKey("subject")) {
        builder.withSubject((String) map.get("subject"));
      }
      if (map.containsKey("time")) {
        builder.withTime(OffsetDateTime.parse((String) map.get("time")));
      }
      if (map.containsKey("datacontenttype")) {
        builder.withDataContentType((String) map.get("datacontenttype"));
      }
      if (map.containsKey("dataschema")) {
        builder.withDataSchema(URI.create((String) map.get("dataschema")));
      }
      if (map.containsKey("data")) {
        byte[] dataBytes = objectMapper.writeValueAsBytes(map.get("data"));
        builder.withData(DATA_CONTENT_TYPE, dataBytes);
      }

      return builder.build();
    } catch (JsonProcessingException e) {
      throw new EventSerializationException("Failed to deserialize CloudEvent", e);
    }
  }

  /**
   * Extract typed data from CloudEvent.
   *
   * @param event the CloudEvent
   * @param dataType the expected data type class
   * @return deserialized data object
   */
  public <T> T extractData(CloudEvent event, Class<T> dataType) {
    if (event.getData() == null) {
      return null;
    }
    try {
      return objectMapper.readValue(event.getData().toBytes(), dataType);
    } catch (Exception e) {
      throw new EventSerializationException("Failed to extract data from CloudEvent", e);
    }
  }

  /**
   * Build a CloudEvent with typed data.
   *
   * @param type event type (e.g., "org.example.OrderCompleted")
   * @param source event source URI
   * @param subject event subject (e.g., order ID)
   * @param data typed data object
   * @return CloudEvent instance
   */
  public <T> CloudEvent buildEvent(String type, URI source, String subject, T data) {
    try {
      byte[] dataBytes = objectMapper.writeValueAsBytes(data);

      return CloudEventBuilder.v1()
          .withId(UUID.randomUUID().toString())
          .withSource(source)
          .withType(type)
          .withSubject(subject)
          .withTime(OffsetDateTime.now())
          .withDataContentType(DATA_CONTENT_TYPE)
          .withData(DATA_CONTENT_TYPE, dataBytes)
          .build();
    } catch (JsonProcessingException e) {
      throw new EventSerializationException("Failed to build CloudEvent", e);
    }
  }

  /** Exception thrown when event serialization/deserialization fails. */
  public static class EventSerializationException extends RuntimeException {
    public EventSerializationException(String message, Throwable cause) {
      super(message, cause);
    }
  }
}
```

**Step 4: Run test to verify it passes**

Run: `./gradlew :libs:backend:platform:platform-events:test --tests CloudEventSerializerTest`

Expected: PASS

**Step 5: Commit**

```bash
git add libs/backend/platform/platform-events/src/
git commit -m "feat(platform-events): add CloudEventSerializer"
```

---

## Task 5: Create CloudEventPublisher Interface

**Files:**
- Create: `libs/backend/platform/platform-events/src/main/java/org/example/platform/events/CloudEventPublisher.java`

**Step 1: Create interface**

Create file `libs/backend/platform/platform-events/src/main/java/org/example/platform/events/CloudEventPublisher.java`:

```java
package org.example.platform.events;

import io.cloudevents.CloudEvent;
import reactor.core.publisher.Mono;

/** Publisher interface for CloudEvents. */
public interface CloudEventPublisher {

  /**
   * Publish a CloudEvent (fire-and-forget).
   *
   * <p>Errors are logged but not propagated.
   *
   * @param event the CloudEvent to publish
   * @return Mono completing when publish attempt is done
   */
  Mono<Void> publish(CloudEvent event);

  /**
   * Publish a CloudEvent and await confirmation.
   *
   * @param event the CloudEvent to publish
   * @return Mono with the record ID on success, error on failure
   */
  Mono<String> publishAndAwait(CloudEvent event);
}
```

**Step 2: Commit**

```bash
git add libs/backend/platform/platform-events/src/main/java/org/example/platform/events/CloudEventPublisher.java
git commit -m "feat(platform-events): add CloudEventPublisher interface"
```

---

## Task 6: Create RedisStreamEventPublisher

**Files:**
- Create: `libs/backend/platform/platform-events/src/main/java/org/example/platform/events/RedisStreamEventPublisher.java`
- Test: `libs/backend/platform/platform-events/src/test/java/org/example/platform/events/RedisStreamEventPublisherTest.java`

**Step 1: Write the failing test**

Create file `libs/backend/platform/platform-events/src/test/java/org/example/platform/events/RedisStreamEventPublisherTest.java`:

```java
package org.example.platform.events;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import io.cloudevents.CloudEvent;
import io.cloudevents.core.builder.CloudEventBuilder;
import java.net.URI;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.connection.stream.RecordId;
import org.springframework.data.redis.connection.stream.StreamRecords;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.data.redis.core.ReactiveStreamOperations;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

class RedisStreamEventPublisherTest {

  private ReactiveRedisTemplate<String, String> redisTemplate;
  private ReactiveStreamOperations<String, Object, Object> streamOps;
  private RedisStreamEventPublisher publisher;
  private EventStreamProperties properties;

  @BeforeEach
  @SuppressWarnings("unchecked")
  void setUp() {
    redisTemplate = mock(ReactiveRedisTemplate.class);
    streamOps = mock(ReactiveStreamOperations.class);
    when(redisTemplate.opsForStream()).thenReturn(streamOps);

    ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());
    CloudEventSerializer serializer = new CloudEventSerializer(objectMapper);
    properties = new EventStreamProperties();
    properties.setStreamKey("test:events");

    publisher = new RedisStreamEventPublisher(redisTemplate, serializer, properties);
  }

  @Test
  void shouldPublishEventToRedisStream() {
    CloudEvent event =
        CloudEventBuilder.v1()
            .withId(UUID.randomUUID().toString())
            .withSource(URI.create("urn:test"))
            .withType("test.event")
            .withData("application/json", "{\"key\":\"value\"}".getBytes())
            .build();

    RecordId recordId = RecordId.of("1234567890-0");
    when(streamOps.add(any())).thenReturn(Mono.just(recordId));

    StepVerifier.create(publisher.publishAndAwait(event))
        .expectNext("1234567890-0")
        .verifyComplete();
  }

  @Test
  void shouldHandlePublishErrorGracefully() {
    CloudEvent event =
        CloudEventBuilder.v1()
            .withId(UUID.randomUUID().toString())
            .withSource(URI.create("urn:test"))
            .withType("test.event")
            .build();

    when(streamOps.add(any())).thenReturn(Mono.error(new RuntimeException("Redis unavailable")));

    // Fire-and-forget publish should not propagate error
    StepVerifier.create(publisher.publish(event)).verifyComplete();
  }
}
```

**Step 2: Run test to verify it fails**

Run: `./gradlew :libs:backend:platform:platform-events:test --tests RedisStreamEventPublisherTest`

Expected: FAIL

**Step 3: Write minimal implementation**

Create file `libs/backend/platform/platform-events/src/main/java/org/example/platform/events/RedisStreamEventPublisher.java`:

```java
package org.example.platform.events;

import io.cloudevents.CloudEvent;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.connection.stream.RecordId;
import org.springframework.data.redis.connection.stream.StreamRecords;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import reactor.core.publisher.Mono;

/** Redis Streams implementation of CloudEventPublisher. */
public class RedisStreamEventPublisher implements CloudEventPublisher {

  private static final Logger log = LoggerFactory.getLogger(RedisStreamEventPublisher.class);

  private final ReactiveRedisTemplate<String, String> redisTemplate;
  private final CloudEventSerializer serializer;
  private final EventStreamProperties properties;

  public RedisStreamEventPublisher(
      ReactiveRedisTemplate<String, String> redisTemplate,
      CloudEventSerializer serializer,
      EventStreamProperties properties) {
    this.redisTemplate = redisTemplate;
    this.serializer = serializer;
    this.properties = properties;
  }

  @Override
  public Mono<Void> publish(CloudEvent event) {
    return publishInternal(event)
        .then()
        .onErrorResume(
            e -> {
              log.warn(
                  "Failed to publish event: type={}, id={}, error={}",
                  event.getType(),
                  event.getId(),
                  e.getMessage());
              return Mono.empty();
            });
  }

  @Override
  public Mono<String> publishAndAwait(CloudEvent event) {
    return publishInternal(event)
        .map(RecordId::getValue)
        .timeout(properties.getPublishTimeout())
        .doOnSuccess(
            recordId ->
                log.debug("Published event: type={}, id={}, recordId={}",
                    event.getType(), event.getId(), recordId))
        .doOnError(
            e ->
                log.error(
                    "Failed to publish event: type={}, id={}, error={}",
                    event.getType(),
                    event.getId(),
                    e.getMessage()));
  }

  private Mono<RecordId> publishInternal(CloudEvent event) {
    return Mono.defer(
        () -> {
          String json = serializer.serialize(event);
          Map<String, String> fields = Map.of(
              "eventId", event.getId(),
              "eventType", event.getType(),
              "payload", json);

          return redisTemplate
              .opsForStream()
              .add(StreamRecords.newRecord().in(properties.getStreamKey()).ofMap(fields));
        });
  }
}
```

**Step 4: Run test to verify it passes**

Run: `./gradlew :libs:backend:platform:platform-events:test --tests RedisStreamEventPublisherTest`

Expected: PASS

**Step 5: Commit**

```bash
git add libs/backend/platform/platform-events/src/
git commit -m "feat(platform-events): add RedisStreamEventPublisher"
```

---

## Task 7: Create EventConsumer Base Class

**Files:**
- Create: `libs/backend/platform/platform-events/src/main/java/org/example/platform/events/EventConsumer.java`
- Test: `libs/backend/platform/platform-events/src/test/java/org/example/platform/events/EventConsumerTest.java`

**Step 1: Write the failing test**

Create file `libs/backend/platform/platform-events/src/test/java/org/example/platform/events/EventConsumerTest.java`:

```java
package org.example.platform.events;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import io.cloudevents.CloudEvent;
import java.util.Map;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.connection.stream.MapRecord;
import org.springframework.data.redis.connection.stream.RecordId;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.data.redis.core.ReactiveStreamOperations;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

class EventConsumerTest {

  private ReactiveRedisTemplate<String, String> redisTemplate;
  private ReactiveStreamOperations<String, Object, Object> streamOps;
  private CloudEventSerializer serializer;
  private EventStreamProperties properties;

  @BeforeEach
  @SuppressWarnings("unchecked")
  void setUp() {
    redisTemplate = mock(ReactiveRedisTemplate.class);
    streamOps = mock(ReactiveStreamOperations.class);
    when(redisTemplate.opsForStream()).thenReturn(streamOps);

    ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());
    serializer = new CloudEventSerializer(objectMapper);
    properties = new EventStreamProperties();
    properties.setStreamKey("test:events");
    properties.setConsumerGroup("test-group");
  }

  @Test
  void shouldProcessRecordAndAcknowledge() {
    // Create a test event JSON
    String eventJson =
        """
        {
          "specversion": "1.0",
          "id": "test-123",
          "source": "urn:test",
          "type": "test.event",
          "data": {"message": "hello"}
        }
        """;

    MapRecord<String, Object, Object> record =
        MapRecord.create(
            "test:events",
            Map.of("eventId", "test-123", "eventType", "test.event", "payload", eventJson));

    // Track if handler was called
    AtomicReference<CloudEvent> receivedEvent = new AtomicReference<>();

    // Mock acknowledge
    when(streamOps.acknowledge(anyString(), anyString(), any(RecordId.class)))
        .thenReturn(Mono.just(1L));

    TestEventConsumer consumer =
        new TestEventConsumer(redisTemplate, serializer, properties, receivedEvent);

    StepVerifier.create(consumer.processRecord(record)).verifyComplete();

    assertThat(receivedEvent.get()).isNotNull();
    assertThat(receivedEvent.get().getId()).isEqualTo("test-123");
    assertThat(receivedEvent.get().getType()).isEqualTo("test.event");
  }

  /** Test implementation of EventConsumer. */
  static class TestEventConsumer extends EventConsumer {

    private final AtomicReference<CloudEvent> receivedEvent;

    TestEventConsumer(
        ReactiveRedisTemplate<String, String> redisTemplate,
        CloudEventSerializer serializer,
        EventStreamProperties properties,
        AtomicReference<CloudEvent> receivedEvent) {
      super(redisTemplate, serializer, properties);
      this.receivedEvent = receivedEvent;
    }

    @Override
    protected Mono<Void> handleEvent(CloudEvent event) {
      receivedEvent.set(event);
      return Mono.empty();
    }
  }
}
```

**Step 2: Run test to verify it fails**

Run: `./gradlew :libs:backend:platform:platform-events:test --tests EventConsumerTest`

Expected: FAIL

**Step 3: Write minimal implementation**

Create file `libs/backend/platform/platform-events/src/main/java/org/example/platform/events/EventConsumer.java`:

```java
package org.example.platform.events;

import io.cloudevents.CloudEvent;
import java.time.Duration;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.connection.stream.Consumer;
import org.springframework.data.redis.connection.stream.MapRecord;
import org.springframework.data.redis.connection.stream.ReadOffset;
import org.springframework.data.redis.connection.stream.StreamOffset;
import org.springframework.data.redis.connection.stream.StreamReadOptions;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.util.retry.Retry;

/** Base class for CloudEvent consumers using Redis Streams. */
public abstract class EventConsumer {

  private static final Logger log = LoggerFactory.getLogger(EventConsumer.class);

  protected final ReactiveRedisTemplate<String, String> redisTemplate;
  protected final CloudEventSerializer serializer;
  protected final EventStreamProperties properties;

  protected EventConsumer(
      ReactiveRedisTemplate<String, String> redisTemplate,
      CloudEventSerializer serializer,
      EventStreamProperties properties) {
    this.redisTemplate = redisTemplate;
    this.serializer = serializer;
    this.properties = properties;
  }

  /**
   * Initialize the consumer group. Call this on startup.
   *
   * @return Mono completing when group is created
   */
  public Mono<Void> initializeConsumerGroup() {
    return redisTemplate
        .opsForStream()
        .createGroup(properties.getStreamKey(), properties.getConsumerGroup())
        .onErrorResume(
            e -> {
              if (e.getMessage() != null && e.getMessage().contains("BUSYGROUP")) {
                log.debug("Consumer group already exists: {}", properties.getConsumerGroup());
                return Mono.empty();
              }
              // Stream might not exist, create it
              return redisTemplate
                  .opsForStream()
                  .add(properties.getStreamKey(), Map.of("init", "true"))
                  .then(
                      redisTemplate
                          .opsForStream()
                          .createGroup(properties.getStreamKey(), properties.getConsumerGroup()))
                  .onErrorResume(e2 -> Mono.empty());
            })
        .then()
        .doOnSuccess(v -> log.info("Consumer group initialized: {}", properties.getConsumerGroup()));
  }

  /**
   * Read events from the stream.
   *
   * @return Flux of records
   */
  @SuppressWarnings("unchecked")
  public Flux<MapRecord<String, Object, Object>> readEvents() {
    return redisTemplate
        .opsForStream()
        .read(
            Consumer.from(properties.getConsumerGroup(), properties.getConsumerName()),
            StreamReadOptions.empty()
                .count(properties.getBatchSize())
                .block(Duration.ofMillis(50)),
            StreamOffset.create(properties.getStreamKey(), ReadOffset.lastConsumed()))
        .onErrorResume(
            e -> {
              log.warn("Failed to read from stream: {}", e.getMessage());
              return Flux.empty();
            });
  }

  /**
   * Process a single record. Deserializes the event, calls handler, and acknowledges.
   *
   * @param record the Redis stream record
   * @return Mono completing when processing is done
   */
  public Mono<Void> processRecord(MapRecord<String, Object, Object> record) {
    return Mono.defer(
        () -> {
          Map<Object, Object> values = record.getValue();
          String eventId = values.get("eventId") != null ? values.get("eventId").toString() : null;
          String payload = values.get("payload") != null ? values.get("payload").toString() : null;

          if (payload == null) {
            log.warn("Record has no payload: {}", record.getId());
            return acknowledge(record);
          }

          return parseAndHandle(eventId, payload, record);
        });
  }

  private Mono<Void> parseAndHandle(
      String eventId, String payload, MapRecord<String, Object, Object> record) {
    return Mono.defer(
            () -> {
              CloudEvent event = serializer.deserialize(payload);
              return handleEvent(event);
            })
        .retryWhen(
            Retry.backoff(properties.getMaxRetries(), properties.getRetryDelay())
                .filter(this::isRetryable)
                .doBeforeRetry(
                    signal ->
                        log.warn(
                            "Retrying event processing: eventId={}, attempt={}",
                            eventId,
                            signal.totalRetries() + 1)))
        .then(acknowledge(record))
        .doOnSuccess(v -> log.debug("Processed event: eventId={}", eventId))
        .onErrorResume(
            e -> {
              log.error("Failed to process event: eventId={}, error={}", eventId, e.getMessage());
              return handleDeadLetter(eventId, payload, e, record);
            });
  }

  /**
   * Handle a CloudEvent. Subclasses implement this to process events.
   *
   * @param event the CloudEvent
   * @return Mono completing when handling is done
   */
  protected abstract Mono<Void> handleEvent(CloudEvent event);

  /**
   * Determine if an error is retryable.
   *
   * @param e the error
   * @return true if should retry
   */
  protected boolean isRetryable(Throwable e) {
    String className = e.getClass().getName();
    return className.contains("TransientDataAccessException")
        || className.contains("R2dbcTransientResourceException")
        || className.contains("TimeoutException");
  }

  /**
   * Handle a permanently failed event.
   *
   * @param eventId event ID
   * @param payload original payload
   * @param error the error
   * @param record the record
   * @return Mono completing when dead letter handling is done
   */
  protected Mono<Void> handleDeadLetter(
      String eventId, String payload, Throwable error, MapRecord<String, Object, Object> record) {
    return redisTemplate
        .opsForStream()
        .add(
            properties.getDeadLetterStreamKey(),
            Map.of(
                "eventId", eventId != null ? eventId : "unknown",
                "payload", payload != null ? payload : "",
                "error", error.getMessage() != null ? error.getMessage() : "unknown",
                "errorClass", error.getClass().getName()))
        .doOnSuccess(id -> log.info("Moved to dead letter: eventId={}, dlqId={}", eventId, id))
        .then(acknowledge(record));
  }

  private Mono<Void> acknowledge(MapRecord<String, Object, Object> record) {
    return redisTemplate
        .opsForStream()
        .acknowledge(properties.getStreamKey(), properties.getConsumerGroup(), record.getId())
        .then();
  }
}
```

**Step 4: Run test to verify it passes**

Run: `./gradlew :libs:backend:platform:platform-events:test --tests EventConsumerTest`

Expected: PASS

**Step 5: Commit**

```bash
git add libs/backend/platform/platform-events/src/
git commit -m "feat(platform-events): add EventConsumer base class"
```

---

## Task 8: Create Auto-Configuration

**Files:**
- Create: `libs/backend/platform/platform-events/src/main/java/org/example/platform/events/EventsAutoConfiguration.java`
- Create: `libs/backend/platform/platform-events/src/main/resources/META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`

**Step 1: Create auto-configuration class**

Create file `libs/backend/platform/platform-events/src/main/java/org/example/platform/events/EventsAutoConfiguration.java`:

```java
package org.example.platform.events;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.data.redis.core.ReactiveRedisTemplate;

/** Auto-configuration for platform-events. */
@AutoConfiguration
@ConditionalOnClass(ReactiveRedisTemplate.class)
@EnableConfigurationProperties(EventStreamProperties.class)
public class EventsAutoConfiguration {

  @Bean
  @ConditionalOnMissingBean
  public CloudEventSerializer cloudEventSerializer(ObjectMapper objectMapper) {
    return new CloudEventSerializer(objectMapper);
  }
}
```

**Step 2: Create auto-configuration imports file**

Create directory and file `libs/backend/platform/platform-events/src/main/resources/META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`:

```
org.example.platform.events.EventsAutoConfiguration
```

**Step 3: Verify build**

Run: `./gradlew :libs:backend:platform:platform-events:build`

Expected: BUILD SUCCESSFUL

**Step 4: Commit**

```bash
git add libs/backend/platform/platform-events/src/
git commit -m "feat(platform-events): add auto-configuration"
```

---

## Task 9: Add AGENTS.md Documentation

**Files:**
- Create: `libs/backend/platform/platform-events/AGENTS.md`

**Step 1: Create AGENTS.md**

Create file `libs/backend/platform/platform-events/AGENTS.md`:

```markdown
# platform-events

Reusable CloudEvents infrastructure for Redis Streams publishing and consuming.

## Package Structure

```
org.example.platform.events/
├── CloudEventPublisher.java      # Publisher interface
├── RedisStreamEventPublisher.java # Redis Streams implementation
├── CloudEventSerializer.java     # JSON serialization
├── EventConsumer.java            # Base consumer class
├── EventStreamProperties.java    # Configuration properties
└── EventsAutoConfiguration.java  # Spring Boot auto-config
```

## Usage

### Publishing Events

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

### Consuming Events

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

### Configuration

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

## CloudEvents Format

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

## Error Handling

- **Transient errors**: Automatic retry with exponential backoff
- **Permanent failures**: Move to dead letter stream (`{stream-key}:dlq`)
- **Fire-and-forget**: `publish()` logs errors but doesn't propagate
- **Awaited publish**: `publishAndAwait()` returns error on failure
```

**Step 2: Commit**

```bash
git add libs/backend/platform/platform-events/AGENTS.md
git commit -m "docs(platform-events): add AGENTS.md documentation"
```

---

## Task 10: Run Full Test Suite

**Step 1: Run all platform-events tests**

Run: `./gradlew :libs:backend:platform:platform-events:test`

Expected: All tests PASS

**Step 2: Run build**

Run: `./gradlew :libs:backend:platform:platform-events:build`

Expected: BUILD SUCCESSFUL

**Step 3: Verify across workspace**

Run: `pnpm nx run-many -t build --projects=tag:backend`

Expected: Build completes (services not yet using this library)

---

## Completion Checklist

- [ ] CloudEvents added to version catalog
- [ ] Module structure created
- [ ] EventStreamProperties implemented
- [ ] CloudEventSerializer implemented
- [ ] CloudEventPublisher interface defined
- [ ] RedisStreamEventPublisher implemented
- [ ] EventConsumer base class implemented
- [ ] Auto-configuration added
- [ ] AGENTS.md documentation added
- [ ] All tests passing
- [ ] All changes committed
