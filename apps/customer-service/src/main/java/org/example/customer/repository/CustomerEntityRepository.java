package org.example.customer.repository;

import java.util.UUID;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/** Spring Data R2DBC repository for customer entities. */
@Repository
public interface CustomerEntityRepository extends ReactiveCrudRepository<CustomerEntity, UUID> {

  Mono<CustomerEntity> findByCustomerId(String customerId);

  Flux<CustomerEntity> findByStoreNumber(int storeNumber);

  Flux<CustomerEntity> findByStoreNumberAndCustomerType(int storeNumber, String customerType);

  Mono<CustomerEntity> findByStoreNumberAndEmail(int storeNumber, String email);

  @Query("SELECT * FROM customers WHERE store_number = :storeNumber AND phone = :phone")
  Mono<CustomerEntity> findByStoreNumberAndPhone(int storeNumber, String phone);

  @Query("SELECT * FROM customers WHERE parent_customer_id = :parentId")
  Flux<CustomerEntity> findByParentCustomerId(String parentId);

  @Query(
      """
      SELECT * FROM customers
      WHERE store_number = :storeNumber
      AND (
          customer_id = :searchTerm
          OR LOWER(email) = LOWER(:searchTerm)
          OR phone = :searchTerm
      )
      """)
  Flux<CustomerEntity> searchByIdEmailOrPhone(int storeNumber, String searchTerm);

  @Query(
      """
      SELECT * FROM customers
      WHERE store_number = :storeNumber
      AND status = 'ACTIVE'
      ORDER BY updated_at DESC
      LIMIT :limit OFFSET :offset
      """)
  Flux<CustomerEntity> findActiveByStorePaginated(int storeNumber, int limit, int offset);

  Mono<Long> countByStoreNumber(int storeNumber);

  Mono<Long> countByStoreNumberAndCustomerType(int storeNumber, String customerType);

  @Query(
      """
      SELECT * FROM customers
      WHERE store_number = :storeNumber
      AND loyalty_json ->> 'tier' = :tier
      """)
  Flux<CustomerEntity> findByStoreNumberAndLoyaltyTier(int storeNumber, String tier);

  Mono<Boolean> existsByStoreNumberAndEmail(int storeNumber, String email);
}
