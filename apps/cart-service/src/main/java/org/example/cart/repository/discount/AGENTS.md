# repository.discount

## Boundaries
none

## Conventions
- All HTTP calls are decorated with ReactiveResilience
- Uses internal request/response records for API contracts

## Warnings
- Discount-service must be available; circuit breaker will open after threshold
