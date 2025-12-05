package org.example.platform.audit;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import reactor.test.StepVerifier;

class NoOpAuditPublisherTest {

  private NoOpAuditPublisher publisher;

  @BeforeEach
  void setUp() {
    publisher = new NoOpAuditPublisher();
  }

  @Test
  void publish_completesSuccessfully() {
    AuditEvent event = createTestEvent();

    StepVerifier.create(publisher.publish(event)).verifyComplete();
  }

  @Test
  void publishAndAwait_returnsNoopId() {
    AuditEvent event = createTestEvent();

    StepVerifier.create(publisher.publishAndAwait(event))
        .assertNext(
            recordId -> {
              assertThat(recordId).startsWith("noop-");
              assertThat(recordId).contains(event.eventId());
            })
        .verifyComplete();
  }

  private AuditEvent createTestEvent() {
    return AuditEvent.create(
        AuditEventType.CART_CREATED,
        EntityType.CART,
        "cart-123",
        100,
        "user01",
        "session-uuid",
        "trace-uuid",
        Map.of("test", true));
  }
}
