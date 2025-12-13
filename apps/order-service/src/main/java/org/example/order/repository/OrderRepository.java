package org.example.order.repository;

import java.time.Instant;
import java.util.UUID;
import org.example.model.order.Order;
import org.example.model.order.OrderStatus;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * Repository interface for Order domain objects.
 *
 * <p>Provides read and update access to orders. Note: order-service does not create orders
 * (checkout-service handles creation).
 */
public interface OrderRepository {

  /** Find order by ID. */
  Mono<Order> findById(UUID orderId);

  /** Find order by order number. */
  Mono<Order> findByOrderNumber(String orderNumber);

  /** Find all orders for a store. */
  Flux<Order> findByStoreNumber(int storeNumber);

  /** Find all orders for a customer. */
  Flux<Order> findByCustomerId(String customerId);

  /** Find orders by store and status. */
  Flux<Order> findByStoreNumberAndStatus(int storeNumber, OrderStatus status);

  /** Search orders with date range and pagination. */
  Flux<Order> searchOrders(
      int storeNumber, Instant startDate, Instant endDate, int limit, int offset);

  /** Count orders matching search criteria. */
  Mono<Long> countSearchOrders(int storeNumber, Instant startDate, Instant endDate);

  /** Update order (for status changes, fulfillment updates, etc.). */
  Mono<Order> update(Order order);

  /** Check if order exists. */
  Mono<Boolean> exists(UUID orderId);

  /**
   * Insert order if it doesn't already exist (idempotent).
   *
   * <p>Uses INSERT ... ON CONFLICT DO NOTHING for idempotent inserts from event consumers.
   *
   * @param order the order to insert
   * @return Mono<Boolean> true if inserted, false if already existed
   */
  Mono<Boolean> insertIfAbsent(Order order);
}
