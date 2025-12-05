package org.example.customer.repository;

import org.example.model.customer.Customer;
import org.example.model.customer.CustomerType;
import org.example.model.customer.LoyaltyTier;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/** Domain repository interface for customer operations. */
public interface CustomerRepository {

    Mono<Customer> findById(String customerId);

    Mono<Customer> findByEmail(int storeNumber, String email);

    Mono<Customer> findByPhone(int storeNumber, String phone);

    Flux<Customer> findByStore(int storeNumber);

    Flux<Customer> findByStoreAndType(int storeNumber, CustomerType type);

    Flux<Customer> findChildAccounts(String parentCustomerId);

    Flux<Customer> search(int storeNumber, String searchTerm);

    Flux<Customer> findActiveByStore(int storeNumber, int page, int size);

    Mono<Customer> save(Customer customer);

    Mono<Void> deleteById(String customerId);

    Mono<Boolean> exists(String customerId);

    Mono<Boolean> existsByEmail(int storeNumber, String email);

    Mono<Long> countByStore(int storeNumber);

    Mono<Long> countByStoreAndType(int storeNumber, CustomerType type);

    Flux<Customer> findByLoyaltyTier(int storeNumber, LoyaltyTier tier);
}
