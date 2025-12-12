# repository.fulfillment

## Boundaries
none

## Conventions
- All HTTP calls are decorated with ReactiveResilience
- Uses internal request/response records for API contracts

## Warnings
- Fulfillment-service must be available; circuit breaker will open after threshold
