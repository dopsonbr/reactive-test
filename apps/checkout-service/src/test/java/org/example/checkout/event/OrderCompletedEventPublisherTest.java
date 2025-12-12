package org.example.checkout.event;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import io.cloudevents.CloudEvent;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.example.model.order.Order;
import org.example.model.order.OrderStatus;
import org.example.model.order.PaymentStatus;
import org.example.platform.events.CloudEventPublisher;
import org.example.platform.events.CloudEventSerializer;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

class OrderCompletedEventPublisherTest {

  private CloudEventPublisher cloudEventPublisher;
  private OrderCompletedEventPublisher publisher;

  @BeforeEach
  void setUp() {
    cloudEventPublisher = mock(CloudEventPublisher.class);
    ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());
    CloudEventSerializer serializer = new CloudEventSerializer(objectMapper);
    CheckoutEventProperties properties = new CheckoutEventProperties();

    publisher = new OrderCompletedEventPublisher(cloudEventPublisher, serializer, properties);
  }

  @Test
  void shouldPublishOrderCompletedEvent() {
    Order order =
        Order.builder()
            .id(UUID.randomUUID())
            .storeNumber(100)
            .orderNumber("ORD-001")
            .grandTotal(new BigDecimal("99.99"))
            .status(OrderStatus.PAID)
            .paymentStatus(PaymentStatus.COMPLETED)
            .lineItems(List.of())
            .appliedDiscounts(List.of())
            .createdAt(Instant.now())
            .build();

    when(cloudEventPublisher.publishAndAwait(any(CloudEvent.class)))
        .thenReturn(Mono.just("record-123"));

    StepVerifier.create(publisher.publishOrderCompleted(order, "session-456"))
        .expectNext("record-123")
        .verifyComplete();

    ArgumentCaptor<CloudEvent> eventCaptor = ArgumentCaptor.forClass(CloudEvent.class);
    verify(cloudEventPublisher).publishAndAwait(eventCaptor.capture());

    CloudEvent event = eventCaptor.getValue();
    assertThat(event.getType()).isEqualTo("org.example.checkout.OrderCompleted");
    assertThat(event.getSource().toString()).isEqualTo("urn:reactive-platform:checkout-service");
    assertThat(event.getSubject()).isEqualTo(order.id().toString());
  }
}
