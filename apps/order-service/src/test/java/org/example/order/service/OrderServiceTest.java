package org.example.order.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
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
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

/** Unit tests for OrderService. */
@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

  @Mock private OrderRepository orderRepository;

  private OrderService orderService;

  private Order testOrder;
  private UUID orderId;

  @BeforeEach
  void setUp() {
    orderService = new OrderService(orderRepository);
    orderId = UUID.randomUUID();
    testOrder = createTestOrder(orderId, OrderStatus.CREATED);
  }

  @Test
  void findById_existingOrder_returnsOrder() {
    when(orderRepository.findById(orderId)).thenReturn(Mono.just(testOrder));

    StepVerifier.create(orderService.findById(orderId))
        .assertNext(order -> assertThat(order.id()).isEqualTo(orderId))
        .verifyComplete();
  }

  @Test
  void findById_nonExistingOrder_returnsNotFound() {
    when(orderRepository.findById(orderId)).thenReturn(Mono.empty());

    StepVerifier.create(orderService.findById(orderId))
        .expectErrorMatches(
            ex ->
                ex instanceof ResponseStatusException
                    && ((ResponseStatusException) ex).getStatusCode() == HttpStatus.NOT_FOUND)
        .verify();
  }

  @Test
  void findByStore_returnsOrders() {
    when(orderRepository.findByStoreNumber(100)).thenReturn(Flux.just(testOrder));

    StepVerifier.create(orderService.findByStore(100))
        .assertNext(order -> assertThat(order.storeNumber()).isEqualTo(100))
        .verifyComplete();
  }

  @Test
  void findByCustomer_returnsOrders() {
    when(orderRepository.findByCustomerId("cust-123")).thenReturn(Flux.just(testOrder));

    StepVerifier.create(orderService.findByCustomer("cust-123"))
        .assertNext(order -> assertThat(order.customerId()).isEqualTo("cust-123"))
        .verifyComplete();
  }

  @Test
  void updateStatus_validTransition_updatesOrder() {
    Order updatedOrder = OrderMutations.withStatus(testOrder, OrderStatus.PAID);
    when(orderRepository.findById(orderId)).thenReturn(Mono.just(testOrder));
    when(orderRepository.update(any())).thenReturn(Mono.just(updatedOrder));

    StepVerifier.create(orderService.updateStatus(orderId, OrderStatus.PAID))
        .assertNext(order -> assertThat(order.status()).isEqualTo(OrderStatus.PAID))
        .verifyComplete();
  }

  @Test
  void updateStatus_invalidTransition_returnsBadRequest() {
    Order shippedOrder = createTestOrder(orderId, OrderStatus.SHIPPED);
    when(orderRepository.findById(orderId)).thenReturn(Mono.just(shippedOrder));

    StepVerifier.create(orderService.updateStatus(orderId, OrderStatus.CREATED))
        .expectErrorMatches(
            ex ->
                ex instanceof ResponseStatusException
                    && ((ResponseStatusException) ex).getStatusCode() == HttpStatus.BAD_REQUEST)
        .verify();
  }

  @Test
  void cancelOrder_validStatus_cancelsOrder() {
    Order cancelledOrder = OrderMutations.withStatus(testOrder, OrderStatus.CANCELLED);
    when(orderRepository.findById(orderId)).thenReturn(Mono.just(testOrder));
    when(orderRepository.update(any())).thenReturn(Mono.just(cancelledOrder));

    StepVerifier.create(orderService.cancelOrder(orderId, "Customer request"))
        .assertNext(order -> assertThat(order.status()).isEqualTo(OrderStatus.CANCELLED))
        .verifyComplete();
  }

  @Test
  void cancelOrder_invalidStatus_returnsBadRequest() {
    Order deliveredOrder = createTestOrder(orderId, OrderStatus.DELIVERED);
    when(orderRepository.findById(orderId)).thenReturn(Mono.just(deliveredOrder));

    StepVerifier.create(orderService.cancelOrder(orderId, "Customer request"))
        .expectErrorMatches(
            ex ->
                ex instanceof ResponseStatusException
                    && ((ResponseStatusException) ex).getStatusCode() == HttpStatus.BAD_REQUEST)
        .verify();
  }

  private Order createTestOrder(UUID id, OrderStatus status) {
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
        .status(status)
        .lineItems(List.of())
        .appliedDiscounts(List.of())
        .createdAt(Instant.now())
        .updatedAt(Instant.now())
        .build();
  }
}
