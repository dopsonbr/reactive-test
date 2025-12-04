package org.example.cart.repository;

import org.example.cart.model.Cart;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/** Repository interface for Cart persistence. */
public interface CartRepository {

    /**
     * Find a cart by ID.
     *
     * @param cartId the cart ID
     * @return the cart if found
     */
    Mono<Cart> findById(String cartId);

    /**
     * Find all carts for a store.
     *
     * @param storeNumber the store number
     * @return flux of carts
     */
    Flux<Cart> findByStoreNumber(int storeNumber);

    /**
     * Find all carts for a customer.
     *
     * @param customerId the customer ID
     * @return flux of carts
     */
    Flux<Cart> findByCustomerId(String customerId);

    /**
     * Save a cart.
     *
     * @param cart the cart to save
     * @return the saved cart
     */
    Mono<Cart> save(Cart cart);

    /**
     * Delete a cart by ID.
     *
     * @param cartId the cart ID
     * @return completion signal
     */
    Mono<Void> deleteById(String cartId);

    /**
     * Check if a cart exists.
     *
     * @param cartId the cart ID
     * @return true if cart exists
     */
    Mono<Boolean> exists(String cartId);
}
