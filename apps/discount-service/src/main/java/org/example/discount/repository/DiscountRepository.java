package org.example.discount.repository;

import org.example.model.discount.Discount;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/** Repository for accessing discount data. */
public interface DiscountRepository {

    /**
     * Find a discount by its ID.
     *
     * @param discountId the discount ID
     * @return the discount if found
     */
    Mono<Discount> findById(String discountId);

    /**
     * Find a discount by its promo code.
     *
     * @param code the promo code
     * @return the discount if found
     */
    Mono<Discount> findByCode(String code);

    /**
     * Find all active discounts for a store.
     *
     * @param storeNumber the store number
     * @return stream of active discounts
     */
    Flux<Discount> findActiveByStore(int storeNumber);

    /**
     * Find all auto-apply discounts for a store.
     *
     * @param storeNumber the store number
     * @return stream of auto-apply discounts
     */
    Flux<Discount> findAutoApplyByStore(int storeNumber);
}
