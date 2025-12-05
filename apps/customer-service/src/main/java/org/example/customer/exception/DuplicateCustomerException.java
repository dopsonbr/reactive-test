package org.example.customer.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Exception thrown when attempting to create a customer with a duplicate email in the same store.
 */
@ResponseStatus(HttpStatus.CONFLICT)
public class DuplicateCustomerException extends RuntimeException {

    public DuplicateCustomerException(int storeNumber, String email) {
        super(
                String.format(
                        "Customer with email %s already exists in store %d", email, storeNumber));
    }
}
