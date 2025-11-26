package org.example.reactivetest.error;

import java.util.List;
import java.util.Map;

public class ValidationException extends RuntimeException {
    private final List<ValidationError> errors;

    public ValidationException(List<ValidationError> errors) {
        super("Validation failed: " + errors.size() + " error(s)");
        this.errors = errors;
    }

    public List<ValidationError> getErrors() {
        return errors;
    }

    public Map<String, Object> toDetailsMap() {
        return Map.of("validationErrors", errors);
    }

    public record ValidationError(String field, String message) {}
}