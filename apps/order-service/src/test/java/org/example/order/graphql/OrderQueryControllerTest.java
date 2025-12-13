package org.example.order.graphql;

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
import org.example.order.graphql.input.OrderSearchInput;
import org.example.order.service.OrderService;
import org.example.order.service.OrderService.OrderSearchCriteria;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

/** Unit tests for OrderQueryController. */
@ExtendWith(MockitoExtension.class)
class OrderQueryControllerTest {

  @Mock private OrderService orderService;
  @Mock private GraphQLInputValidator validator;

  private OrderQueryController controller;
  private Order testOrder;
  private UUID orderId;

  @BeforeEach
  void setUp() {
    controller = new OrderQueryController(orderService, validator);
    orderId = UUID.randomUUID();
    testOrder = createTestOrder(orderId, OrderStatus.CREATED);
  }

  @Nested
  class OrderQuery {

    @Test
    void existingOrder_returnsOrder() {
      String id = orderId.toString();
      when(validator.validateOrderId(id)).thenReturn(Mono.empty());
      when(orderService.findById(orderId)).thenReturn(Mono.just(testOrder));

      StepVerifier.create(controller.order(id)).expectNext(testOrder).verifyComplete();
    }

    @Test
    void nonExistingOrder_returnsEmpty() {
      String id = orderId.toString();
      when(validator.validateOrderId(id)).thenReturn(Mono.empty());
      when(orderService.findById(orderId))
          .thenReturn(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND)));

      StepVerifier.create(controller.order(id)).verifyComplete();
    }

    @Test
    void validationFails_propagatesError() {
      String id = UUID.randomUUID().toString();
      RuntimeException error = new RuntimeException("Validation failed");
      when(validator.validateOrderId(id)).thenReturn(Mono.error(error));
      // The .then() operator evaluates its argument eagerly, so we must mock findById
      when(orderService.findById(UUID.fromString(id))).thenReturn(Mono.empty());

      StepVerifier.create(controller.order(id)).expectError(RuntimeException.class).verify();
    }

    @Test
    void nonNotFoundError_propagates() {
      String id = orderId.toString();
      when(validator.validateOrderId(id)).thenReturn(Mono.empty());
      when(orderService.findById(orderId))
          .thenReturn(Mono.error(new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR)));

      StepVerifier.create(controller.order(id)).expectError(ResponseStatusException.class).verify();
    }
  }

  @Nested
  class OrderByNumberQuery {

    @Test
    void existingOrder_returnsOrder() {
      String orderNumber = "ORD-12345";
      when(validator.validateOrderNumber(orderNumber)).thenReturn(Mono.empty());
      when(orderService.findByOrderNumber(orderNumber)).thenReturn(Mono.just(testOrder));

      StepVerifier.create(controller.orderByNumber(orderNumber))
          .expectNext(testOrder)
          .verifyComplete();
    }

    @Test
    void nonExistingOrder_returnsEmpty() {
      String orderNumber = "ORD-NOTFOUND";
      when(validator.validateOrderNumber(orderNumber)).thenReturn(Mono.empty());
      when(orderService.findByOrderNumber(orderNumber))
          .thenReturn(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND)));

      StepVerifier.create(controller.orderByNumber(orderNumber)).verifyComplete();
    }

    @Test
    void validationFails_propagatesError() {
      String orderNumber = "INVALID";
      RuntimeException error = new RuntimeException("Validation failed");
      when(validator.validateOrderNumber(orderNumber)).thenReturn(Mono.error(error));
      // The .then() operator evaluates its argument eagerly, so we must mock findByOrderNumber
      when(orderService.findByOrderNumber(orderNumber)).thenReturn(Mono.empty());

      StepVerifier.create(controller.orderByNumber(orderNumber))
          .expectError(RuntimeException.class)
          .verify();
    }
  }

  @Nested
  class OrdersQuery {

    @Test
    void byStoreWithStatus_returnsFilteredOrders() {
      int storeNumber = 100;
      when(validator.validateStoreNumber(storeNumber)).thenReturn(Mono.empty());
      when(validator.validatePagination(any(), any())).thenReturn(Mono.empty());
      when(orderService.findByStoreAndStatus(storeNumber, OrderStatus.CREATED))
          .thenReturn(Flux.just(testOrder));

      StepVerifier.create(controller.orders(storeNumber, OrderStatus.CREATED, null, null))
          .expectNext(testOrder)
          .verifyComplete();
    }

    @Test
    void byStoreWithoutStatus_usesPagination() {
      int storeNumber = 100;
      when(validator.validateStoreNumber(storeNumber)).thenReturn(Mono.empty());
      when(validator.validatePagination(any(), any())).thenReturn(Mono.empty());
      when(orderService.search(any(OrderSearchCriteria.class))).thenReturn(Flux.just(testOrder));

      StepVerifier.create(controller.orders(storeNumber, null, 50, 0))
          .expectNext(testOrder)
          .verifyComplete();
    }

    @Test
    void defaultPagination_usesDefaults() {
      int storeNumber = 100;
      when(validator.validateStoreNumber(storeNumber)).thenReturn(Mono.empty());
      when(validator.validatePagination(any(), any())).thenReturn(Mono.empty());
      when(orderService.search(any(OrderSearchCriteria.class))).thenReturn(Flux.just(testOrder));

      StepVerifier.create(controller.orders(storeNumber, null, null, null))
          .expectNext(testOrder)
          .verifyComplete();
    }

    @Test
    void validationFails_propagatesError() {
      int invalidStore = 0;
      RuntimeException error = new RuntimeException("Invalid store");
      when(validator.validateStoreNumber(invalidStore)).thenReturn(Mono.error(error));
      // The .then() operator evaluates its argument eagerly, so we must mock validatePagination
      when(validator.validatePagination(null, null)).thenReturn(Mono.empty());

      StepVerifier.create(controller.orders(invalidStore, null, null, null))
          .expectError(RuntimeException.class)
          .verify();
    }

    @Test
    void paginationValidationFails_propagatesError() {
      int storeNumber = 100;
      RuntimeException error = new RuntimeException("Invalid pagination");
      when(validator.validateStoreNumber(storeNumber)).thenReturn(Mono.empty());
      when(validator.validatePagination(-1, -1)).thenReturn(Mono.error(error));

      StepVerifier.create(controller.orders(storeNumber, null, -1, -1))
          .expectError(RuntimeException.class)
          .verify();
    }
  }

  @Nested
  class OrdersByCustomerQuery {

    @Test
    void validCustomer_returnsOrders() {
      String customerId = "cust-123";
      when(validator.validateCustomerId(customerId)).thenReturn(Mono.empty());
      when(orderService.findByCustomer(customerId)).thenReturn(Flux.just(testOrder));

      StepVerifier.create(controller.ordersByCustomer(customerId))
          .expectNext(testOrder)
          .verifyComplete();
    }

    @Test
    void multipleOrders_returnsAll() {
      String customerId = "cust-123";
      Order order2 = createTestOrder(UUID.randomUUID(), OrderStatus.PAID);
      when(validator.validateCustomerId(customerId)).thenReturn(Mono.empty());
      when(orderService.findByCustomer(customerId)).thenReturn(Flux.just(testOrder, order2));

      StepVerifier.create(controller.ordersByCustomer(customerId))
          .expectNext(testOrder)
          .expectNext(order2)
          .verifyComplete();
    }

    @Test
    void noOrders_returnsEmpty() {
      String customerId = "cust-empty";
      when(validator.validateCustomerId(customerId)).thenReturn(Mono.empty());
      when(orderService.findByCustomer(customerId)).thenReturn(Flux.empty());

      StepVerifier.create(controller.ordersByCustomer(customerId)).verifyComplete();
    }

    @Test
    void validationFails_propagatesError() {
      String customerId = "";
      RuntimeException error = new RuntimeException("Invalid customer");
      when(validator.validateCustomerId(customerId)).thenReturn(Mono.error(error));

      StepVerifier.create(controller.ordersByCustomer(customerId))
          .expectError(RuntimeException.class)
          .verify();
    }
  }

  @Nested
  class SearchOrdersQuery {

    @Test
    void validInput_returnsSearchResponse() {
      OrderSearchInput input = new OrderSearchInput(100, null, null, null, null, 20, 0);
      when(validator.validateOrderSearch(input)).thenReturn(Mono.empty());
      when(orderService.search(any(OrderSearchCriteria.class))).thenReturn(Flux.just(testOrder));
      when(orderService.countSearch(any(OrderSearchCriteria.class))).thenReturn(Mono.just(1L));

      StepVerifier.create(controller.searchOrders(input))
          .assertNext(
              response -> {
                assertThat(response.orders()).hasSize(1);
                assertThat(response.totalCount()).isEqualTo(1);
              })
          .verifyComplete();
    }

    @Test
    void withDateRange_parsesCorrectly() {
      OrderSearchInput input =
          new OrderSearchInput(
              100, null, null, "2024-01-01T00:00:00Z", "2024-12-31T23:59:59Z", 50, 0);
      when(validator.validateOrderSearch(input)).thenReturn(Mono.empty());
      when(orderService.search(any(OrderSearchCriteria.class))).thenReturn(Flux.just(testOrder));
      when(orderService.countSearch(any(OrderSearchCriteria.class))).thenReturn(Mono.just(1L));

      StepVerifier.create(controller.searchOrders(input))
          .assertNext(response -> assertThat(response.orders()).hasSize(1))
          .verifyComplete();
    }

    @Test
    void validationFails_propagatesError() {
      OrderSearchInput input = new OrderSearchInput(0, null, null, null, null, null, null);
      RuntimeException error = new RuntimeException("Validation failed");
      when(validator.validateOrderSearch(input)).thenReturn(Mono.error(error));

      StepVerifier.create(controller.searchOrders(input))
          .expectError(RuntimeException.class)
          .verify();
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
        .paymentStatus(PaymentStatus.COMPLETED)
        .status(status)
        .lineItems(List.of())
        .appliedDiscounts(List.of())
        .createdAt(Instant.now())
        .updatedAt(Instant.now())
        .build();
  }
}
