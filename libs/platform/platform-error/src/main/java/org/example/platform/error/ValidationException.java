package org.example.platform.error;

import java.util.List;
import java.util.Map;

/**
 * Exception thrown when request validation fails.
 * Contains a list of field-level validation errors.
 */
public class ValidationException extends RuntimeException {
    private final List<ValidationError> errors;

    public ValidationException(List<ValidationError> errors) {
        super("Validation failed: " + errors.size() + " error(s)");
        this.errors = errors;
    }

    public List<ValidationError> getErrors() {
        return errors;
    }

    /**
     * Convert errors to a map suitable for inclusion in ErrorResponse details.
     */
    public Map<String, Object> toDetailsMap() {
        return Map.of("validationErrors", errors);
    }

    /**
     * A single field validation error.
     */
    public record ValidationError(String field, String message) {}
}
