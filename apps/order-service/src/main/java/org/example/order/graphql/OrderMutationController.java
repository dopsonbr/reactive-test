package org.example.order.graphql;

import java.time.Instant;
import java.util.UUID;
import org.example.model.order.FulfillmentDetails;
import org.example.model.order.Order;
import org.example.model.order.OrderStatus;
import org.example.order.graphql.input.UpdateFulfillmentInput;
import org.example.order.service.OrderService;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import reactor.core.publisher.Mono;

/**
 * GraphQL mutation resolver for order operations. Provides write operations with parity to REST
 * POST/PUT/DELETE endpoints.
 */
@Controller
public class OrderMutationController {

  private final OrderService orderService;
  private final GraphQLInputValidator validator;

  public OrderMutationController(OrderService orderService, GraphQLInputValidator validator) {
    this.orderService = orderService;
    this.validator = validator;
  }

  @MutationMapping
  @PreAuthorize("hasAuthority('SCOPE_order:write')")
  public Mono<Order> updateOrderStatus(@Argument String id, @Argument OrderStatus status) {
    return validator
        .validateUpdateStatus(id, status)
        .then(orderService.updateStatus(UUID.fromString(id), status));
  }

  @MutationMapping
  @PreAuthorize("hasAuthority('SCOPE_order:write')")
  public Mono<Order> updateFulfillment(
      @Argument String id, @Argument UpdateFulfillmentInput input) {
    return validator
        .validateUpdateFulfillment(id, input)
        .then(
            orderService
                .findById(UUID.fromString(id))
                .flatMap(
                    order -> {
                      // Build updated fulfillment details from current and input
                      FulfillmentDetails current = order.fulfillmentDetails();
                      FulfillmentDetails updated =
                          new FulfillmentDetails(
                              current != null ? current.type() : order.fulfillmentType(),
                              input.fulfillmentDate() != null
                                  ? Instant.parse(input.fulfillmentDate())
                                  : (current != null ? current.scheduledDate() : null),
                              current != null ? current.deliveryAddress() : null,
                              input.pickupLocation() != null
                                  ? input.pickupLocation()
                                  : (current != null ? current.pickupLocation() : null),
                              input.instructions() != null
                                  ? input.instructions()
                                  : (current != null ? current.instructions() : null));
                      return orderService.updateFulfillment(UUID.fromString(id), updated);
                    }));
  }

  @MutationMapping
  @PreAuthorize("hasAuthority('SCOPE_order:write')")
  public Mono<Order> cancelOrder(@Argument String id, @Argument String reason) {
    return validator
        .validateCancelOrder(id, reason)
        .then(orderService.cancelOrder(UUID.fromString(id), reason));
  }

  @MutationMapping
  @PreAuthorize("hasAuthority('SCOPE_order:write')")
  public Mono<Order> addOrderNote(@Argument String id, @Argument String note) {
    return validator
        .validateAddNote(id, note)
        .then(
            orderService
                .findById(UUID.fromString(id))
                .flatMap(
                    order -> {
                      // Append note to fulfillment instructions
                      FulfillmentDetails current = order.fulfillmentDetails();
                      String existingInstructions =
                          current != null && current.instructions() != null
                              ? current.instructions()
                              : "";
                      String updatedInstructions =
                          existingInstructions.isEmpty()
                              ? note
                              : existingInstructions + "\n" + note;

                      FulfillmentDetails updated =
                          new FulfillmentDetails(
                              current != null ? current.type() : order.fulfillmentType(),
                              current != null ? current.scheduledDate() : null,
                              current != null ? current.deliveryAddress() : null,
                              current != null ? current.pickupLocation() : null,
                              updatedInstructions);
                      return orderService.updateFulfillment(UUID.fromString(id), updated);
                    }));
  }
}
