# Price Repository

## Purpose
Fetches product pricing from an external price service.

## Behavior
Uses cache-aside pattern: checks Redis cache first, fetches from HTTP service on miss, then caches the result. Returns a fallback price ("0.00") on failure after resilience decorators exhaust retries.

## Quirks
- Cache-aside (not fallback-on-error): Always consults cache before HTTP
- Fallback price is hardcoded to "0.00"
- Circuit breaker state logged on errors
