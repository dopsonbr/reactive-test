package org.example.discount.exception;

/** Exception thrown when a non-employee attempts to apply a markdown. */
public class UnauthorizedMarkdownException extends RuntimeException {

    public UnauthorizedMarkdownException(String message) {
        super(message);
    }
}
