package org.example.discount.service;

import org.example.discount.exception.InvalidDiscountException;
import org.example.discount.repository.DiscountRepository;
import org.example.model.discount.Discount;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/** Service for discount operations. */
@Service
public class DiscountService {

    private final DiscountRepository repository;

    public DiscountService(DiscountRepository repository) {
        this.repository = repository;
    }

    /**
     * Validate a promo code for a store.
     *
     * @param code the promo code
     * @param storeNumber the store number
     * @return the discount if valid
     * @throws InvalidDiscountException if code is invalid or expired
     */
    public Mono<Discount> validateCode(String code, int storeNumber) {
        return repository
                .findByCode(code)
                .filter(Discount::isValid)
                .filter(d -> d.appliesTo(storeNumber))
                .switchIfEmpty(Mono.error(new InvalidDiscountException(code)));
    }

    /**
     * Get all auto-apply discounts for a store.
     *
     * @param storeNumber the store number
     * @return stream of auto-apply discounts
     */
    public Flux<Discount> getAutoApplyDiscounts(int storeNumber) {
        return repository.findAutoApplyByStore(storeNumber);
    }

    /**
     * Get all active discounts for a store.
     *
     * @param storeNumber the store number
     * @return stream of active discounts
     */
    public Flux<Discount> getActiveDiscounts(int storeNumber) {
        return repository.findActiveByStore(storeNumber);
    }

    /**
     * Find a discount by ID.
     *
     * @param discountId the discount ID
     * @return the discount if found
     */
    public Mono<Discount> findById(String discountId) {
        return repository.findById(discountId);
    }
}
