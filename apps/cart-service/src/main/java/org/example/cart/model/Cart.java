package org.example.cart.model;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import org.example.model.customer.CartCustomer;
import org.example.model.discount.AppliedDiscount;
import org.example.model.fulfillment.Fulfillment;
import org.example.model.product.CartProduct;

/**
 * The complete cart aggregate.
 *
 * @param id the cart UUID
 * @param storeNumber the store context
 * @param customerId customer identifier (nullable for anonymous carts)
 * @param customer customer details (nullable)
 * @param products products in the cart
 * @param discounts applied discounts
 * @param fulfillments fulfillment options
 * @param totals calculated totals
 * @param createdAt creation timestamp
 * @param updatedAt last update timestamp
 */
public record Cart(
        String id,
        int storeNumber,
        String customerId,
        CartCustomer customer,
        List<CartProduct> products,
        List<AppliedDiscount> discounts,
        List<Fulfillment> fulfillments,
        CartTotals totals,
        Instant createdAt,
        Instant updatedAt) {
    /**
     * Create a new empty cart.
     *
     * @param id the cart ID
     * @param storeNumber the store number
     * @param customerId the customer ID (nullable)
     * @return a new empty cart
     */
    public static Cart create(String id, int storeNumber, String customerId) {
        Instant now = Instant.now();
        return new Cart(
                id,
                storeNumber,
                customerId,
                null,
                new ArrayList<>(),
                new ArrayList<>(),
                new ArrayList<>(),
                CartTotals.empty(),
                now,
                now);
    }

    /**
     * Create a new cart with updated products and recalculated totals.
     *
     * @param products the new product list
     * @return a new cart with updated products and totals
     */
    public Cart withProducts(List<CartProduct> products) {
        return new Cart(
                id,
                storeNumber,
                customerId,
                customer,
                new ArrayList<>(products),
                discounts,
                fulfillments,
                CartTotals.calculate(products, discounts, fulfillments),
                createdAt,
                Instant.now());
    }

    /**
     * Create a new cart with updated customer.
     *
     * @param customer the customer
     * @return a new cart with updated customer
     */
    public Cart withCustomer(CartCustomer customer) {
        return new Cart(
                id,
                storeNumber,
                customer != null ? customer.customerId() : null,
                customer,
                products,
                discounts,
                fulfillments,
                totals,
                createdAt,
                Instant.now());
    }

    /**
     * Create a new cart with updated discounts and recalculated totals.
     *
     * @param discounts the new discount list
     * @return a new cart with updated discounts and totals
     */
    public Cart withDiscounts(List<AppliedDiscount> discounts) {
        return new Cart(
                id,
                storeNumber,
                customerId,
                customer,
                products,
                new ArrayList<>(discounts),
                fulfillments,
                CartTotals.calculate(products, discounts, fulfillments),
                createdAt,
                Instant.now());
    }

    /**
     * Create a new cart with updated fulfillments and recalculated totals.
     *
     * @param fulfillments the new fulfillment list
     * @return a new cart with updated fulfillments and totals
     */
    public Cart withFulfillments(List<Fulfillment> fulfillments) {
        return new Cart(
                id,
                storeNumber,
                customerId,
                customer,
                products,
                discounts,
                new ArrayList<>(fulfillments),
                CartTotals.calculate(products, discounts, fulfillments),
                createdAt,
                Instant.now());
    }

    /**
     * Get the total number of items in the cart.
     *
     * @return the item count
     */
    public int itemCount() {
        return products.stream().mapToInt(CartProduct::quantity).sum();
    }
}
