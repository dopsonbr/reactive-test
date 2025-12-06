package org.example.order.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.example.order.model.FulfillmentType;
import org.example.order.model.Order;
import org.example.order.model.OrderStatus;
import org.example.order.model.PaymentStatus;
import org.example.order.service.OrderService;
import org.example.order.validation.OrderRequestValidator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

/** Unit tests for OrderController. */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class OrderControllerTest {

  @Mock private OrderService orderService;
  @Mock private OrderRequestValidator validator;

  private OrderController controller;
  private Order testOrder;
  private UUID orderId;

  @BeforeEach
  void setUp() {
    controller = new OrderController(orderService, validator);
    orderId = UUID.randomUUID();
    testOrder = createTestOrder(orderId, OrderStatus.CREATED);
  }

  @Nested
  class GetOrderById {

    @Test
    void existingOrder_returnsOrder() {
      when(validator.validateOrderId(orderId)).thenReturn(Mono.empty());
      when(orderService.findById(orderId)).thenReturn(Mono.just(testOrder));

      StepVerifier.create(controller.getOrderById(orderId)).expectNext(testOrder).verifyComplete();
    }

    @Test
    void validationFails_propagatesError() {
      RuntimeException validationError = new RuntimeException("Validation failed");
      when(validator.validateOrderId(orderId)).thenReturn(Mono.error(validationError));
      // The .then() operator evaluates its argument eagerly, so we must mock findById
      when(orderService.findById(orderId)).thenReturn(Mono.empty());

      StepVerifier.create(controller.getOrderById(orderId))
          .expectError(RuntimeException.class)
          .verify();
    }
  }

  @Nested
  class GetOrderByNumber {

    @Test
    void existingOrder_returnsOrder() {
      String orderNumber = "ORD-12345";
      when(validator.validateOrderNumber(orderNumber)).thenReturn(Mono.empty());
      when(orderService.findByOrderNumber(orderNumber)).thenReturn(Mono.just(testOrder));

      StepVerifier.create(controller.getOrderByNumber(orderNumber))
          .expectNext(testOrder)
          .verifyComplete();
    }

    @Test
    void validationFails_propagatesError() {
      String orderNumber = "INVALID";
      RuntimeException validationError = new RuntimeException("Validation failed");
      when(validator.validateOrderNumber(orderNumber)).thenReturn(Mono.error(validationError));
      // The .then() operator evaluates its argument eagerly, so we must mock findByOrderNumber
      when(orderService.findByOrderNumber(orderNumber)).thenReturn(Mono.empty());

      StepVerifier.create(controller.getOrderByNumber(orderNumber))
          .expectError(RuntimeException.class)
          .verify();
    }
  }

  @Nested
  class GetOrdersByStore {

    @Test
    void validStore_returnsOrders() {
      int storeNumber = 100;
      when(validator.validateStoreNumber(storeNumber)).thenReturn(Mono.empty());
      when(orderService.findByStore(storeNumber)).thenReturn(Flux.just(testOrder));

      StepVerifier.create(controller.getOrdersByStore(storeNumber))
          .expectNext(testOrder)
          .verifyComplete();
    }

    @Test
    void noOrders_returnsEmpty() {
      int storeNumber = 100;
      when(validator.validateStoreNumber(storeNumber)).thenReturn(Mono.empty());
      when(orderService.findByStore(storeNumber)).thenReturn(Flux.empty());

      StepVerifier.create(controller.getOrdersByStore(storeNumber)).verifyComplete();
    }

    @Test
    void validationFails_propagatesError() {
      int invalidStore = 0;
      RuntimeException validationError = new RuntimeException("Invalid store");
      when(validator.validateStoreNumber(invalidStore)).thenReturn(Mono.error(validationError));

      StepVerifier.create(controller.getOrdersByStore(invalidStore))
          .expectError(RuntimeException.class)
          .verify();
    }
  }

  @Nested
  class GetOrdersByCustomer {

    @Test
    void validCustomer_returnsOrders() {
      String customerId = "cust-123";
      when(validator.validateCustomerId(customerId)).thenReturn(Mono.empty());
      when(orderService.findByCustomer(customerId)).thenReturn(Flux.just(testOrder));

      StepVerifier.create(controller.getOrdersByCustomer(customerId))
          .expectNext(testOrder)
          .verifyComplete();
    }

    @Test
    void multipleOrders_returnsAll() {
      String customerId = "cust-123";
      Order order2 = createTestOrder(UUID.randomUUID(), OrderStatus.CONFIRMED);
      when(validator.validateCustomerId(customerId)).thenReturn(Mono.empty());
      when(orderService.findByCustomer(customerId)).thenReturn(Flux.just(testOrder, order2));

      StepVerifier.create(controller.getOrdersByCustomer(customerId))
          .expectNext(testOrder)
          .expectNext(order2)
          .verifyComplete();
    }

    @Test
    void validationFails_propagatesError() {
      String customerId = "";
      RuntimeException validationError = new RuntimeException("Invalid customer ID");
      when(validator.validateCustomerId(customerId)).thenReturn(Mono.error(validationError));

      StepVerifier.create(controller.getOrdersByCustomer(customerId))
          .expectError(RuntimeException.class)
          .verify();
    }
  }

  @Nested
  class SearchOrders {

    @Test
    void byCustomerId_returnsOrders() {
      when(validator.validateSearchRequest(any())).thenReturn(Mono.empty());
      when(orderService.findByCustomer("cust-123")).thenReturn(Flux.just(testOrder));

      StepVerifier.create(controller.searchOrders(null, "cust-123", null, null, null, null, null))
          .expectNextMatches(response -> response.orders().size() == 1)
          .verifyComplete();
    }

    @Test
    void byStoreAndStatus_returnsOrders() {
      when(validator.validateSearchRequest(any())).thenReturn(Mono.empty());
      when(orderService.findByStoreAndStatus(100, OrderStatus.CREATED))
          .thenReturn(Flux.just(testOrder));

      StepVerifier.create(controller.searchOrders(100, null, "CREATED", null, null, null, null))
          .expectNextMatches(response -> response.orders().size() == 1)
          .verifyComplete();
    }

    @Test
    void noFilters_returnsEmptyResponse() {
      when(validator.validateSearchRequest(any())).thenReturn(Mono.empty());

      StepVerifier.create(controller.searchOrders(null, null, null, null, null, null, null))
          .expectNextMatches(response -> response.orders().isEmpty() && response.totalCount() == 0)
          .verifyComplete();
    }
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
        .paymentStatus(PaymentStatus.CAPTURED)
        .status(status)
        .lineItems(List.of())
        .appliedDiscounts(List.of())
        .createdAt(Instant.now())
        .updatedAt(Instant.now())
        .build();
  }
}
