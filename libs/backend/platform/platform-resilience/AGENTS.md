# Platform Resilience

## Boundaries

Files requiring careful review: `ReactiveResilience.java` (decorator order is critical)

## Conventions

- All resilience instances configured via application.yml, not code
- Decorator order is fixed: timeout → circuit breaker → retry → bulkhead
- Instance names in `decorate()` must match resilience4j instance names in config
- All decorators use `transformDeferred()` for proper lazy evaluation

## Warnings

- Changing decorator order breaks resilience semantics (timeout must be innermost)
- Circuit breaker state is shared across all calls with the same instance name
- Bulkhead limits apply per-instance, not per-call
- Missing resilience4j config for an instance name will throw at runtime
