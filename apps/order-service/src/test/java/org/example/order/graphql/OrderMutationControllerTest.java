package org.example.order.graphql;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.example.order.graphql.input.UpdateFulfillmentInput;
import org.example.order.model.FulfillmentDetails;
import org.example.order.model.FulfillmentType;
import org.example.order.model.Order;
import org.example.order.model.OrderStatus;
import org.example.order.model.PaymentStatus;
import org.example.order.service.OrderService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

/** Unit tests for OrderMutationController. */
@ExtendWith(MockitoExtension.class)
class OrderMutationControllerTest {

  @Mock private OrderService orderService;
  @Mock private GraphQLInputValidator validator;

  private OrderMutationController controller;
  private Order testOrder;
  private UUID orderId;

  @BeforeEach
  void setUp() {
    controller = new OrderMutationController(orderService, validator);
    orderId = UUID.randomUUID();
    testOrder = createTestOrder(orderId, OrderStatus.CREATED);
  }

  @Nested
  class UpdateOrderStatus {

    @Test
    void validTransition_updatesStatus() {
      String id = orderId.toString();
      Order updated = testOrder.withStatus(OrderStatus.CONFIRMED);
      when(validator.validateUpdateStatus(id, OrderStatus.CONFIRMED)).thenReturn(Mono.empty());
      when(orderService.updateStatus(orderId, OrderStatus.CONFIRMED))
          .thenReturn(Mono.just(updated));

      StepVerifier.create(controller.updateOrderStatus(id, OrderStatus.CONFIRMED))
          .assertNext(order -> assertThat(order.status()).isEqualTo(OrderStatus.CONFIRMED))
          .verifyComplete();
    }

    @Test
    void validationFails_propagatesError() {
      String id = UUID.randomUUID().toString();
      RuntimeException error = new RuntimeException("Validation failed");
      when(validator.validateUpdateStatus(id, OrderStatus.CONFIRMED)).thenReturn(Mono.error(error));
      // The .then() operator evaluates its argument eagerly, so we must mock updateStatus
      when(orderService.updateStatus(UUID.fromString(id), OrderStatus.CONFIRMED))
          .thenReturn(Mono.empty());

      StepVerifier.create(controller.updateOrderStatus(id, OrderStatus.CONFIRMED))
          .expectError(RuntimeException.class)
          .verify();
    }

    @Test
    void invalidTransition_propagatesServiceError() {
      String id = orderId.toString();
      RuntimeException error = new RuntimeException("Invalid transition");
      when(validator.validateUpdateStatus(id, OrderStatus.DELIVERED)).thenReturn(Mono.empty());
      when(orderService.updateStatus(orderId, OrderStatus.DELIVERED)).thenReturn(Mono.error(error));

      StepVerifier.create(controller.updateOrderStatus(id, OrderStatus.DELIVERED))
          .expectError(RuntimeException.class)
          .verify();
    }
  }

  @Nested
  class UpdateFulfillment {

    @Test
    void withTrackingNumber_updatesFulfillment() {
      String id = orderId.toString();
      UpdateFulfillmentInput input = new UpdateFulfillmentInput(null, "TRACK123", "FedEx", null);
      Order updated = testOrder; // simplified - in reality would have updated fulfillment

      when(validator.validateUpdateFulfillment(id, input)).thenReturn(Mono.empty());
      when(orderService.findById(orderId)).thenReturn(Mono.just(testOrder));
      when(orderService.updateFulfillment(eq(orderId), any(FulfillmentDetails.class)))
          .thenReturn(Mono.just(updated));

      StepVerifier.create(controller.updateFulfillment(id, input))
          .expectNext(updated)
          .verifyComplete();
    }

    @Test
    void withFulfillmentDate_updatesFulfillment() {
      String id = orderId.toString();
      UpdateFulfillmentInput input =
          new UpdateFulfillmentInput("2024-12-15T10:00:00Z", null, null, null);
      Order updated = testOrder;

      when(validator.validateUpdateFulfillment(id, input)).thenReturn(Mono.empty());
      when(orderService.findById(orderId)).thenReturn(Mono.just(testOrder));
      when(orderService.updateFulfillment(eq(orderId), any(FulfillmentDetails.class)))
          .thenReturn(Mono.just(updated));

      StepVerifier.create(controller.updateFulfillment(id, input))
          .expectNext(updated)
          .verifyComplete();
    }

    @Test
    void withInstructions_updatesFulfillment() {
      String id = orderId.toString();
      UpdateFulfillmentInput input = new UpdateFulfillmentInput(null, null, null, "Leave at door");
      Order updated = testOrder;

      when(validator.validateUpdateFulfillment(id, input)).thenReturn(Mono.empty());
      when(orderService.findById(orderId)).thenReturn(Mono.just(testOrder));
      when(orderService.updateFulfillment(eq(orderId), any(FulfillmentDetails.class)))
          .thenReturn(Mono.just(updated));

      StepVerifier.create(controller.updateFulfillment(id, input))
          .expectNext(updated)
          .verifyComplete();
    }

    @Test
    void validationFails_propagatesError() {
      String id = UUID.randomUUID().toString();
      UpdateFulfillmentInput input = new UpdateFulfillmentInput(null, null, null, null);
      RuntimeException error = new RuntimeException("Validation failed");
      when(validator.validateUpdateFulfillment(id, input)).thenReturn(Mono.error(error));
      // The .then() operator evaluates its argument eagerly, so we must mock findById
      when(orderService.findById(UUID.fromString(id))).thenReturn(Mono.empty());

      StepVerifier.create(controller.updateFulfillment(id, input))
          .expectError(RuntimeException.class)
          .verify();
    }

    @Test
    void orderNotFound_propagatesError() {
      String id = orderId.toString();
      UpdateFulfillmentInput input = new UpdateFulfillmentInput(null, "TRACK123", null, null);
      RuntimeException error = new RuntimeException("Not found");

      when(validator.validateUpdateFulfillment(id, input)).thenReturn(Mono.empty());
      when(orderService.findById(orderId)).thenReturn(Mono.error(error));

      StepVerifier.create(controller.updateFulfillment(id, input))
          .expectError(RuntimeException.class)
          .verify();
    }

    @Test
    void preservesExistingFulfillmentDetails() {
      String id = orderId.toString();
      FulfillmentDetails existing =
          new FulfillmentDetails(
              FulfillmentType.DELIVERY,
              Instant.parse("2024-12-01T10:00:00Z"),
              null,
              null,
              "Original instructions",
              "OLD-TRACK",
              "UPS");
      Order orderWithFulfillment =
          Order.builder()
              .id(orderId)
              .storeNumber(100)
              .orderNumber("ORD-123")
              .customerId("cust-123")
              .fulfillmentType(FulfillmentType.DELIVERY)
              .subtotal(BigDecimal.valueOf(100))
              .discountTotal(BigDecimal.ZERO)
              .taxTotal(BigDecimal.valueOf(8))
              .fulfillmentCost(BigDecimal.valueOf(5))
              .grandTotal(BigDecimal.valueOf(113))
              .paymentStatus(PaymentStatus.CAPTURED)
              .status(OrderStatus.CREATED)
              .lineItems(List.of())
              .appliedDiscounts(List.of())
              .fulfillmentDetails(existing)
              .createdAt(Instant.now())
              .updatedAt(Instant.now())
              .build();

      // Only update tracking number, carrier should be preserved
      UpdateFulfillmentInput input = new UpdateFulfillmentInput(null, "NEW-TRACK", null, null);

      when(validator.validateUpdateFulfillment(id, input)).thenReturn(Mono.empty());
      when(orderService.findById(orderId)).thenReturn(Mono.just(orderWithFulfillment));
      when(orderService.updateFulfillment(eq(orderId), any(FulfillmentDetails.class)))
          .thenReturn(Mono.just(orderWithFulfillment));

      StepVerifier.create(controller.updateFulfillment(id, input))
          .expectNext(orderWithFulfillment)
          .verifyComplete();
    }
  }

  @Nested
  class CancelOrder {

    @Test
    void validCancellation_cancelsOrder() {
      String id = orderId.toString();
      String reason = "Customer requested cancellation";
      Order cancelled = testOrder.withStatus(OrderStatus.CANCELLED);

      when(validator.validateCancelOrder(id, reason)).thenReturn(Mono.empty());
      when(orderService.cancelOrder(orderId, reason)).thenReturn(Mono.just(cancelled));

      StepVerifier.create(controller.cancelOrder(id, reason))
          .assertNext(order -> assertThat(order.status()).isEqualTo(OrderStatus.CANCELLED))
          .verifyComplete();
    }

    @Test
    void validationFails_propagatesError() {
      String id = UUID.randomUUID().toString();
      String reason = "";
      RuntimeException error = new RuntimeException("Validation failed");
      when(validator.validateCancelOrder(id, reason)).thenReturn(Mono.error(error));
      // The .then() operator evaluates its argument eagerly, so we must mock cancelOrder
      when(orderService.cancelOrder(UUID.fromString(id), reason)).thenReturn(Mono.empty());

      StepVerifier.create(controller.cancelOrder(id, reason))
          .expectError(RuntimeException.class)
          .verify();
    }

    @Test
    void invalidOrderState_propagatesServiceError() {
      String id = orderId.toString();
      String reason = "Customer requested";
      RuntimeException error = new RuntimeException("Cannot cancel delivered order");

      when(validator.validateCancelOrder(id, reason)).thenReturn(Mono.empty());
      when(orderService.cancelOrder(orderId, reason)).thenReturn(Mono.error(error));

      StepVerifier.create(controller.cancelOrder(id, reason))
          .expectError(RuntimeException.class)
          .verify();
    }
  }

  @Nested
  class AddOrderNote {

    @Test
    void validNote_addsToInstructions() {
      String id = orderId.toString();
      String note = "Customer called about delivery";
      Order updated = testOrder;

      when(validator.validateAddNote(id, note)).thenReturn(Mono.empty());
      when(orderService.findById(orderId)).thenReturn(Mono.just(testOrder));
      when(orderService.updateFulfillment(eq(orderId), any(FulfillmentDetails.class)))
          .thenReturn(Mono.just(updated));

      StepVerifier.create(controller.addOrderNote(id, note)).expectNext(updated).verifyComplete();
    }

    @Test
    void existingInstructions_appendsNote() {
      String id = orderId.toString();
      FulfillmentDetails existing =
          new FulfillmentDetails(
              FulfillmentType.DELIVERY, null, null, null, "Existing note", null, null);
      Order orderWithInstructions =
          Order.builder()
              .id(orderId)
              .storeNumber(100)
              .orderNumber("ORD-123")
              .customerId("cust-123")
              .fulfillmentType(FulfillmentType.DELIVERY)
              .subtotal(BigDecimal.valueOf(100))
              .discountTotal(BigDecimal.ZERO)
              .taxTotal(BigDecimal.valueOf(8))
              .fulfillmentCost(BigDecimal.valueOf(5))
              .grandTotal(BigDecimal.valueOf(113))
              .paymentStatus(PaymentStatus.CAPTURED)
              .status(OrderStatus.CREATED)
              .lineItems(List.of())
              .appliedDiscounts(List.of())
              .fulfillmentDetails(existing)
              .createdAt(Instant.now())
              .updatedAt(Instant.now())
              .build();

      String note = "New note";

      when(validator.validateAddNote(id, note)).thenReturn(Mono.empty());
      when(orderService.findById(orderId)).thenReturn(Mono.just(orderWithInstructions));
      when(orderService.updateFulfillment(eq(orderId), any(FulfillmentDetails.class)))
          .thenReturn(Mono.just(orderWithInstructions));

      StepVerifier.create(controller.addOrderNote(id, note))
          .expectNext(orderWithInstructions)
          .verifyComplete();
    }

    @Test
    void validationFails_propagatesError() {
      String id = UUID.randomUUID().toString();
      String note = "";
      RuntimeException error = new RuntimeException("Validation failed");
      when(validator.validateAddNote(id, note)).thenReturn(Mono.error(error));
      // The .then() operator evaluates its argument eagerly, so we must mock findById
      when(orderService.findById(UUID.fromString(id))).thenReturn(Mono.empty());

      StepVerifier.create(controller.addOrderNote(id, note))
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
        .paymentStatus(PaymentStatus.CAPTURED)
        .status(status)
        .lineItems(List.of())
        .appliedDiscounts(List.of())
        .createdAt(Instant.now())
        .updatedAt(Instant.now())
        .build();
  }
}
