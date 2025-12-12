# repository.product

## Boundaries
none

## Conventions
- All HTTP calls are decorated with ReactiveResilience
- Request context headers (x-store-number, x-order-number, etc.) are required

## Warnings
- Product-service must be available; circuit breaker will open after threshold
