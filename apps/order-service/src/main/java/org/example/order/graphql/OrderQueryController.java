package org.example.order.graphql;

import java.time.Instant;
import java.util.UUID;
import org.example.model.order.Order;
import org.example.model.order.OrderStatus;
import org.example.order.dto.OrderSearchResponse;
import org.example.order.graphql.input.OrderSearchInput;
import org.example.order.service.OrderService;
import org.example.order.service.OrderService.OrderSearchCriteria;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * GraphQL query resolver for order operations. Provides read-only access to order data with parity
 * to REST GET endpoints.
 */
@Controller
public class OrderQueryController {

  private final OrderService orderService;
  private final GraphQLInputValidator validator;

  public OrderQueryController(OrderService orderService, GraphQLInputValidator validator) {
    this.orderService = orderService;
    this.validator = validator;
  }

  @QueryMapping
  @PreAuthorize("hasAuthority('SCOPE_order:read')")
  public Mono<Order> order(@Argument String id) {
    return validator
        .validateOrderId(id)
        .then(orderService.findById(UUID.fromString(id)))
        .onErrorResume(
            ResponseStatusException.class,
            e -> {
              if (e.getStatusCode().value() == 404) {
                return Mono.empty(); // Return null for non-existent order
              }
              return Mono.error(e);
            });
  }

  @QueryMapping
  @PreAuthorize("hasAuthority('SCOPE_order:read')")
  public Mono<Order> orderByNumber(@Argument String orderNumber) {
    return validator
        .validateOrderNumber(orderNumber)
        .then(orderService.findByOrderNumber(orderNumber))
        .onErrorResume(
            ResponseStatusException.class,
            e -> {
              if (e.getStatusCode().value() == 404) {
                return Mono.empty();
              }
              return Mono.error(e);
            });
  }

  @QueryMapping
  @PreAuthorize("hasAuthority('SCOPE_order:read')")
  public Flux<Order> orders(
      @Argument int storeNumber,
      @Argument OrderStatus status,
      @Argument Integer limit,
      @Argument Integer offset) {
    return validator
        .validateStoreNumber(storeNumber)
        .then(validator.validatePagination(limit, offset))
        .thenMany(
            Flux.defer(
                () -> {
                  if (status != null) {
                    return orderService.findByStoreAndStatus(storeNumber, status);
                  }
                  // Default search with pagination
                  OrderSearchCriteria criteria =
                      OrderSearchCriteria.builder()
                          .storeNumber(storeNumber)
                          .limit(limit != null ? limit : 50)
                          .offset(offset != null ? offset : 0)
                          .build();
                  return orderService.search(criteria);
                }));
  }

  @QueryMapping
  @PreAuthorize("hasAuthority('SCOPE_order:read')")
  public Flux<Order> ordersByCustomer(@Argument String customerId) {
    return validator
        .validateCustomerId(customerId)
        .thenMany(orderService.findByCustomer(customerId));
  }

  @QueryMapping
  @PreAuthorize("hasAuthority('SCOPE_order:read')")
  public Mono<OrderSearchResponse> searchOrders(@Argument OrderSearchInput input) {
    return validator
        .validateOrderSearch(input)
        .then(
            Mono.defer(
                () -> {
                  Instant startDate =
                      input.startDate() != null ? Instant.parse(input.startDate()) : Instant.EPOCH;
                  Instant endDate =
                      input.endDate() != null ? Instant.parse(input.endDate()) : Instant.now();

                  OrderSearchCriteria criteria =
                      OrderSearchCriteria.builder()
                          .storeNumber(input.storeNumber())
                          .startDate(startDate)
                          .endDate(endDate)
                          .limit(input.limitOrDefault())
                          .offset(input.offsetOrDefault())
                          .build();

                  return Mono.zip(
                          orderService.search(criteria).collectList(),
                          orderService.countSearch(criteria))
                      .map(
                          tuple ->
                              OrderSearchResponse.of(
                                  tuple.getT1(),
                                  tuple.getT2(),
                                  input.offsetOrDefault() / input.limitOrDefault(),
                                  input.limitOrDefault()));
                }));
  }
}
