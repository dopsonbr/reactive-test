package org.example.platform.logging;

/** Log data payload for errors with optional circuit breaker state. */
public record ErrorLogData(
        String type,
        String service,
        String errorType,
        String errorMessage,
        String circuitBreakerState,
        int retryAttempt) {
    public ErrorLogData(String service, String errorType, String errorMessage) {
        this("error", service, errorType, errorMessage, null, 0);
    }

    public ErrorLogData(
            String service, String errorType, String errorMessage, String circuitBreakerState) {
        this("error", service, errorType, errorMessage, circuitBreakerState, 0);
    }
}
