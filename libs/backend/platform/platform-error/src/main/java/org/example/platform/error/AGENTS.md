# Error

## Boundaries
Files requiring careful review: GlobalErrorHandler.java (modifies HTTP status mappings for resilience patterns)

## Conventions
- Circuit breaker exceptions map to 503 Service Unavailable
- Timeout exceptions map to 504 Gateway Timeout
- All error responses include trace correlation metadata
- Error logging uses structured format with trace/span IDs

## Warnings
- Changing status code mappings affects monitoring and alerting thresholds
- Error handler runs outside normal reactive context; trace info extracted from OpenTelemetry API
