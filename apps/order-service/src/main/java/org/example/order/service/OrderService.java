package org.example.order.service;

import java.time.Instant;
import java.util.UUID;
import org.example.model.order.FulfillmentDetails;
import org.example.model.order.Order;
import org.example.model.order.OrderStatus;
import org.example.order.repository.OrderRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * Service for order operations.
 *
 * <p>Provides read and update access to orders created by checkout-service.
 */
@Service
public class OrderService {

  private final OrderRepository orderRepository;

  public OrderService(OrderRepository orderRepository) {
    this.orderRepository = orderRepository;
  }

  /** Find order by ID. */
  public Mono<Order> findById(UUID orderId) {
    return orderRepository
        .findById(orderId)
        .switchIfEmpty(
            Mono.error(
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found: " + orderId)));
  }

  /** Find order by order number. */
  public Mono<Order> findByOrderNumber(String orderNumber) {
    return orderRepository
        .findByOrderNumber(orderNumber)
        .switchIfEmpty(
            Mono.error(
                new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "Order not found: " + orderNumber)));
  }

  /** Find all orders for a store. */
  public Flux<Order> findByStore(int storeNumber) {
    return orderRepository.findByStoreNumber(storeNumber);
  }

  /** Find all orders for a customer. */
  public Flux<Order> findByCustomer(String customerId) {
    return orderRepository.findByCustomerId(customerId);
  }

  /** Find orders by store and status. */
  public Flux<Order> findByStoreAndStatus(int storeNumber, OrderStatus status) {
    return orderRepository.findByStoreNumberAndStatus(storeNumber, status);
  }

  /** Search orders with criteria. */
  public Flux<Order> search(OrderSearchCriteria criteria) {
    return orderRepository.searchOrders(
        criteria.storeNumber(),
        criteria.startDate(),
        criteria.endDate(),
        criteria.limit(),
        criteria.offset());
  }

  /** Count orders matching search criteria. */
  public Mono<Long> countSearch(OrderSearchCriteria criteria) {
    return orderRepository.countSearchOrders(
        criteria.storeNumber(), criteria.startDate(), criteria.endDate());
  }

  /** Update order status. */
  public Mono<Order> updateStatus(UUID orderId, OrderStatus newStatus) {
    return orderRepository
        .findById(orderId)
        .switchIfEmpty(
            Mono.error(
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found: " + orderId)))
        .flatMap(
            order -> {
              validateStatusTransition(order.status(), newStatus);
              Order updated = OrderMutations.withStatus(order, newStatus);
              return orderRepository.update(updated);
            });
  }

  /** Update fulfillment details. */
  public Mono<Order> updateFulfillment(UUID orderId, FulfillmentDetails fulfillmentDetails) {
    return orderRepository
        .findById(orderId)
        .switchIfEmpty(
            Mono.error(
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found: " + orderId)))
        .flatMap(
            order -> {
              Order updated = OrderMutations.withFulfillmentDetails(order, fulfillmentDetails);
              return orderRepository.update(updated);
            });
  }

  /** Cancel an order. */
  public Mono<Order> cancelOrder(UUID orderId, String reason) {
    return orderRepository
        .findById(orderId)
        .switchIfEmpty(
            Mono.error(
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found: " + orderId)))
        .flatMap(
            order -> {
              if (!canCancel(order.status())) {
                return Mono.error(
                    new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Cannot cancel order in status: " + order.status()));
              }
              Order updated = OrderMutations.withStatus(order, OrderStatus.CANCELLED);
              return orderRepository.update(updated);
            });
  }

  /** Check if order exists. */
  public Mono<Boolean> exists(UUID orderId) {
    return orderRepository.exists(orderId);
  }

  private void validateStatusTransition(OrderStatus current, OrderStatus next) {
    // Define valid status transitions based on shared-model-order OrderStatus enum
    boolean valid =
        switch (current) {
          case CREATED -> next == OrderStatus.PAID || next == OrderStatus.CANCELLED;
          case PAID -> next == OrderStatus.PROCESSING || next == OrderStatus.CANCELLED;
          case PROCESSING -> next == OrderStatus.SHIPPED || next == OrderStatus.CANCELLED;
          case SHIPPED -> next == OrderStatus.DELIVERED;
          case DELIVERED -> next == OrderStatus.REFUNDED;
          case CANCELLED, REFUNDED -> false;
        };

    if (!valid) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST,
          String.format("Invalid status transition from %s to %s", current, next));
    }
  }

  private boolean canCancel(OrderStatus status) {
    return status == OrderStatus.CREATED
        || status == OrderStatus.PAID
        || status == OrderStatus.PROCESSING;
  }

  /** Search criteria for order queries. */
  public record OrderSearchCriteria(
      int storeNumber, Instant startDate, Instant endDate, int limit, int offset) {

    public static Builder builder() {
      return new Builder();
    }

    public static class Builder {
      private int storeNumber;
      private Instant startDate = Instant.EPOCH;
      private Instant endDate = Instant.now();
      private int limit = 50;
      private int offset = 0;

      public Builder storeNumber(int storeNumber) {
        this.storeNumber = storeNumber;
        return this;
      }

      public Builder startDate(Instant startDate) {
        this.startDate = startDate;
        return this;
      }

      public Builder endDate(Instant endDate) {
        this.endDate = endDate;
        return this;
      }

      public Builder limit(int limit) {
        this.limit = limit;
        return this;
      }

      public Builder offset(int offset) {
        this.offset = offset;
        return this;
      }

      public OrderSearchCriteria build() {
        return new OrderSearchCriteria(storeNumber, startDate, endDate, limit, offset);
      }
    }
  }
}
