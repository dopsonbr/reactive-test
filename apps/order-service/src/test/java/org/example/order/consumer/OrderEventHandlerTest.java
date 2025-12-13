package org.example.order.consumer;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.example.model.order.FulfillmentType;
import org.example.model.order.Order;
import org.example.model.order.OrderStatus;
import org.example.model.order.PaymentStatus;
import org.example.order.repository.OrderRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

/** Unit tests for OrderEventHandler. */
@ExtendWith(MockitoExtension.class)
class OrderEventHandlerTest {

  @Mock private OrderRepository orderRepository;

  private OrderEventHandler handler;

  @BeforeEach
  void setUp() {
    handler = new OrderEventHandler(orderRepository);
  }

  @Test
  void handleOrderCompleted_newOrder_insertsAndReturnsTrue() {
    UUID orderId = UUID.randomUUID();
    Order order = createTestOrder(orderId);
    String checkoutSessionId = UUID.randomUUID().toString();
    String eventId = UUID.randomUUID().toString();

    when(orderRepository.insertIfAbsent(any(Order.class))).thenReturn(Mono.just(true));

    StepVerifier.create(handler.handleOrderCompleted(checkoutSessionId, order, eventId))
        .verifyComplete();

    verify(orderRepository).insertIfAbsent(order);
  }

  @Test
  void handleOrderCompleted_existingOrder_idempotentNoError() {
    UUID orderId = UUID.randomUUID();
    Order order = createTestOrder(orderId);
    String checkoutSessionId = UUID.randomUUID().toString();
    String eventId = UUID.randomUUID().toString();

    // insertIfAbsent returns false when order already exists
    when(orderRepository.insertIfAbsent(any(Order.class))).thenReturn(Mono.just(false));

    StepVerifier.create(handler.handleOrderCompleted(checkoutSessionId, order, eventId))
        .verifyComplete();

    verify(orderRepository).insertIfAbsent(order);
  }

  @Test
  void handleOrderCompleted_repositoryError_propagatesError() {
    UUID orderId = UUID.randomUUID();
    Order order = createTestOrder(orderId);
    String checkoutSessionId = UUID.randomUUID().toString();
    String eventId = UUID.randomUUID().toString();

    RuntimeException error = new RuntimeException("Database error");
    when(orderRepository.insertIfAbsent(any(Order.class))).thenReturn(Mono.error(error));

    StepVerifier.create(handler.handleOrderCompleted(checkoutSessionId, order, eventId))
        .expectError(RuntimeException.class)
        .verify();
  }

  private Order createTestOrder(UUID id) {
    return Order.builder()
        .id(id)
        .storeNumber(100)
        .orderNumber("ORD-" + id.toString().substring(0, 8))
        .customerId("cust-123")
        .fulfillmentType(FulfillmentType.DELIVERY)
        .subtotal(BigDecimal.valueOf(100.00))
        .discountTotal(BigDecimal.ZERO)
        .taxTotal(BigDecimal.valueOf(8.00))
        .fulfillmentCost(BigDecimal.valueOf(5.00))
        .grandTotal(BigDecimal.valueOf(113.00))
        .paymentStatus(PaymentStatus.COMPLETED)
        .status(OrderStatus.CREATED)
        .lineItems(List.of())
        .appliedDiscounts(List.of())
        .createdAt(Instant.now())
        .updatedAt(Instant.now())
        .build();
  }
}
