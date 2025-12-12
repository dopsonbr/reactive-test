package org.example.platform.events;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
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
