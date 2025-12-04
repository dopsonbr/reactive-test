package org.example.cart.repository;

import java.util.UUID;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;

/**
 * Reactive repository for Cart entities.
 *
 * <p>Uses Spring Data R2DBC for non-blocking Postgres access.
 */
@Repository
public interface CartEntityRepository extends ReactiveCrudRepository<CartEntity, UUID> {

    /** Find all carts for a specific store. */
    Flux<CartEntity> findByStoreNumber(int storeNumber);

    /** Find all carts for a specific customer. */
    Flux<CartEntity> findByCustomerId(String customerId);
}
