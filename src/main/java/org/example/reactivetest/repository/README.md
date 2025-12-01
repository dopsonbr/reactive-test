# Repository

## Purpose
Provides reactive HTTP clients for external services (price, inventory, merchandise) with resilience patterns and fallback handling.

## Behavior
Each repository wraps WebClient calls with circuit breakers, retries, timeouts, and bulkheads via ReactiveResilience, returning fallback values when services fail. Inventory uses cache-aside and fallback-only patterns with Redis; price and merchandise use static fallbacks.

## Quirks
- Inventory returns -1 (backordered) when both HTTP and cache fail
- Price returns "0.00" on failure
- Merchandise returns "Description unavailable" on failure
- Redis cache operations are best-effort and never block the request
