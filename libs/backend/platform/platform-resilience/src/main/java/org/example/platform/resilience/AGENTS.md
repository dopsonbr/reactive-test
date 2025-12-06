# Resilience

## Boundaries
Files requiring careful review: ReactiveResilience.java (decorator order is critical)

## Conventions
- Use transformDeferred() to ensure operators are applied per-subscription
- Name parameter must match Resilience4j configuration keys in application.yml
- Always apply all four patterns in the documented order

## Warnings
- Changing decorator order will break resilience behavior (e.g., retry before timeout will retry the timeout, not the operation)
- Circuit breaker state is shared across all callers using the same name
