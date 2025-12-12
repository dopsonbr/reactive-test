# repository.customer

## Boundaries
none

## Conventions
- All HTTP calls are decorated with ReactiveResilience
- 404 responses on validation return false, not errors

## Warnings
- Customer-service must be available; circuit breaker will open after threshold
