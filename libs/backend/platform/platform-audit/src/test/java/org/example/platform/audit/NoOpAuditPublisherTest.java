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
    AuditEventData data = createTestData();

    StepVerifier.create(publisher.publish("CART_CREATED", data)).verifyComplete();
  }

  @Test
  void publishAndAwait_returnsNoopId() {
    AuditEventData data = createTestData();

    StepVerifier.create(publisher.publishAndAwait("CART_CREATED", data))
        .assertNext(recordId -> assertThat(recordId).isEqualTo("noop"))
        .verifyComplete();
  }

  private AuditEventData createTestData() {
    return AuditEventData.builder()
        .entityType("CART")
        .entityId("cart-123")
        .storeNumber(100)
        .userId("user01")
        .sessionId("session-uuid")
        .traceId("trace-uuid")
        .payload(Map.of("test", true))
        .build();
  }
}
