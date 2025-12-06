# Error

## Purpose
Provides centralized error handling for the reactive application, translating exceptions into structured HTTP responses.

## Behavior
Intercepts Resilience4j exceptions (circuit breaker open, timeout, bulkhead full) and HTTP client errors, returning consistent JSON error responses with appropriate status codes (503 for circuit breaker, 504 for timeout) and trace correlation.

## Quirks
- Circuit breaker exceptions return 503 Service Unavailable, not 500
- Timeout exceptions return 504 Gateway Timeout
- All errors include OpenTelemetry trace/span IDs for correlation
