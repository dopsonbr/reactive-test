package org.example.order.repository;

import java.time.Instant;
import java.util.UUID;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * Reactive repository for Order entities.
 *
 * <p>Uses Spring Data R2DBC for non-blocking Postgres access. Shares the orders table with
 * checkout-service.
 */
@Repository
public interface OrderEntityRepository extends ReactiveCrudRepository<OrderEntity, UUID> {

  /** Find all orders for a specific store. */
  Flux<OrderEntity> findByStoreNumber(int storeNumber);

  /** Find all orders for a specific customer. */
  Flux<OrderEntity> findByCustomerId(String customerId);

  /** Find order by order number. */
  Mono<OrderEntity> findByOrderNumber(String orderNumber);

  /** Find all orders by status. */
  Flux<OrderEntity> findByStatus(String status);

  /** Find orders by store and status. */
  Flux<OrderEntity> findByStoreNumberAndStatus(int storeNumber, String status);

  /** Search orders by store with date range and pagination. */
  @Query(
      "SELECT * FROM orders WHERE store_number = :storeNumber "
          + "AND created_at >= :startDate AND created_at <= :endDate "
          + "ORDER BY created_at DESC LIMIT :limit OFFSET :offset")
  Flux<OrderEntity> searchOrders(
      int storeNumber, Instant startDate, Instant endDate, int limit, int offset);

  /** Count orders matching search criteria. */
  @Query(
      "SELECT COUNT(*) FROM orders WHERE store_number = :storeNumber "
          + "AND created_at >= :startDate AND created_at <= :endDate")
  Mono<Long> countSearchOrders(int storeNumber, Instant startDate, Instant endDate);
}
