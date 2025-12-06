package org.example.order.controller;

import java.time.Instant;
import java.util.UUID;
import org.example.order.dto.OrderSearchRequest;
import org.example.order.dto.OrderSearchResponse;
import org.example.order.model.Order;
import org.example.order.model.OrderStatus;
import org.example.order.service.OrderService;
import org.example.order.service.OrderService.OrderSearchCriteria;
import org.example.order.validation.OrderRequestValidator;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/** REST controller for order operations. */
@RestController
@RequestMapping("/orders")
public class OrderController {

  private final OrderService orderService;
  private final OrderRequestValidator validator;

  public OrderController(OrderService orderService, OrderRequestValidator validator) {
    this.orderService = orderService;
    this.validator = validator;
  }

  /** Get order by ID. */
  @GetMapping("/{orderId}")
  @PreAuthorize("hasAuthority('SCOPE_order:read')")
  public Mono<Order> getOrderById(@PathVariable UUID orderId) {
    return validator.validateOrderId(orderId).then(orderService.findById(orderId));
  }

  /** Get order by order number. */
  @GetMapping("/number/{orderNumber}")
  @PreAuthorize("hasAuthority('SCOPE_order:read')")
  public Mono<Order> getOrderByNumber(@PathVariable String orderNumber) {
    return validator
        .validateOrderNumber(orderNumber)
        .then(orderService.findByOrderNumber(orderNumber));
  }

  /** Search orders with optional filters. */
  @GetMapping
  @PreAuthorize("hasAuthority('SCOPE_order:read')")
  public Mono<OrderSearchResponse> searchOrders(
      @RequestParam(required = false) Integer storeNumber,
      @RequestParam(required = false) String customerId,
      @RequestParam(required = false) String status,
      @RequestParam(required = false) Instant startDate,
      @RequestParam(required = false) Instant endDate,
      @RequestParam(required = false) Integer page,
      @RequestParam(required = false) Integer size) {

    OrderSearchRequest request =
        new OrderSearchRequest(storeNumber, customerId, status, startDate, endDate, page, size);

    return validator
        .validateSearchRequest(request)
        .then(
            Mono.defer(
                () -> {
                  // If customer ID is provided, search by customer
                  if (customerId != null && !customerId.isBlank()) {
                    return orderService
                        .findByCustomer(customerId)
                        .collectList()
                        .map(
                            orders ->
                                OrderSearchResponse.of(
                                    orders, orders.size(), request.pageOrDefault(), orders.size()));
                  }

                  // If store number is provided, search by store with optional status filter
                  if (storeNumber != null) {
                    if (status != null && !status.isBlank()) {
                      return orderService
                          .findByStoreAndStatus(
                              storeNumber, OrderStatus.valueOf(status.toUpperCase()))
                          .collectList()
                          .map(
                              orders ->
                                  OrderSearchResponse.of(
                                      orders,
                                      orders.size(),
                                      request.pageOrDefault(),
                                      orders.size()));
                    }

                    // Search with date range and pagination
                    OrderSearchCriteria criteria =
                        OrderSearchCriteria.builder()
                            .storeNumber(storeNumber)
                            .startDate(startDate != null ? startDate : Instant.EPOCH)
                            .endDate(endDate != null ? endDate : Instant.now())
                            .limit(request.sizeOrDefault())
                            .offset(request.offset())
                            .build();

                    return Mono.zip(
                            orderService.search(criteria).collectList(),
                            orderService.countSearch(criteria))
                        .map(
                            tuple ->
                                OrderSearchResponse.of(
                                    tuple.getT1(),
                                    tuple.getT2(),
                                    request.pageOrDefault(),
                                    request.sizeOrDefault()));
                  }

                  // No store or customer filter - return empty results
                  return Mono.just(
                      OrderSearchResponse.of(
                          java.util.List.of(),
                          0,
                          request.pageOrDefault(),
                          request.sizeOrDefault()));
                }));
  }

  /** List orders by store. */
  @GetMapping("/store/{storeNumber}")
  @PreAuthorize("hasAuthority('SCOPE_order:read')")
  public Flux<Order> getOrdersByStore(@PathVariable int storeNumber) {
    return validator
        .validateStoreNumber(storeNumber)
        .thenMany(orderService.findByStore(storeNumber));
  }

  /** List orders by customer. */
  @GetMapping("/customer/{customerId}")
  @PreAuthorize("hasAuthority('SCOPE_order:read')")
  public Flux<Order> getOrdersByCustomer(@PathVariable String customerId) {
    return validator
        .validateCustomerId(customerId)
        .thenMany(orderService.findByCustomer(customerId));
  }
}
