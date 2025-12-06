package org.example.checkout.repository;

import java.util.UUID;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * Reactive repository for Order entities.
 *
 * <p>Uses Spring Data R2DBC for non-blocking Postgres access.
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
}
