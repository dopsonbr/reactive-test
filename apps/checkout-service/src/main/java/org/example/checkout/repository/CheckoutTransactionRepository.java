package org.example.checkout.repository;

import java.util.UUID;
import org.example.checkout.model.CheckoutTransactionStatus;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/** Repository for checkout transaction log. */
public interface CheckoutTransactionRepository
    extends ReactiveCrudRepository<CheckoutTransactionEntity, UUID> {

  Mono<CheckoutTransactionEntity> findByCheckoutSessionId(String checkoutSessionId);

  Flux<CheckoutTransactionEntity> findByStoreNumber(int storeNumber);

  Flux<CheckoutTransactionEntity> findByStatus(CheckoutTransactionStatus status);

  @Query(
      "SELECT * FROM checkout_transactions "
          + "WHERE event_published = false AND status = 'COMPLETED' "
          + "ORDER BY completed_at ASC LIMIT :limit")
  Flux<CheckoutTransactionEntity> findPendingEventPublish(int limit);
}
