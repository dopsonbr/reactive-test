package org.example.checkout.repository;

import java.util.UUID;
import org.example.checkout.model.Order;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/** Repository interface for Order persistence. */
public interface OrderRepository {

  /**
   * Find an order by ID.
   *
   * @param orderId the order ID
   * @return the order if found
   */
  Mono<Order> findById(UUID orderId);

  /**
   * Find an order by order number.
   *
   * @param orderNumber the order number
   * @return the order if found
   */
  Mono<Order> findByOrderNumber(String orderNumber);

  /**
   * Find all orders for a store.
   *
   * @param storeNumber the store number
   * @return flux of orders
   */
  Flux<Order> findByStoreNumber(int storeNumber);

  /**
   * Find all orders for a customer.
   *
   * @param customerId the customer ID
   * @return flux of orders
   */
  Flux<Order> findByCustomerId(String customerId);

  /**
   * Find orders by store and status.
   *
   * @param storeNumber the store number
   * @param status the order status
   * @return flux of orders
   */
  Flux<Order> findByStoreNumberAndStatus(int storeNumber, String status);

  /**
   * Save an order.
   *
   * @param order the order to save
   * @return the saved order
   */
  Mono<Order> save(Order order);

  /**
   * Update order status.
   *
   * @param orderId the order ID
   * @param status the new status
   * @return the updated order
   */
  Mono<Order> updateStatus(UUID orderId, String status);

  /**
   * Check if an order exists.
   *
   * @param orderId the order ID
   * @return true if order exists
   */
  Mono<Boolean> exists(UUID orderId);
}
