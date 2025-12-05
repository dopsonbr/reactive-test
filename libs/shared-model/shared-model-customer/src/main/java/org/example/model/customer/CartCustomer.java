package org.example.model.customer;

/**
 * Simplified customer representation for cart context. This provides a minimal view of customer
 * data needed for cart operations.
 *
 * @param customerId the unique customer identifier
 * @param name the customer's name
 * @param email the customer's email address
 */
public record CartCustomer(String customerId, String name, String email) {

    /**
     * Create a CartCustomer from a full Customer object.
     *
     * @param customer the full customer
     * @return a simplified CartCustomer
     */
    public static CartCustomer fromCustomer(Customer customer) {
        return new CartCustomer(customer.customerId(), customer.name(), customer.email());
    }
}
