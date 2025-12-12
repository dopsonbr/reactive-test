package org.example.platform.events;

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
