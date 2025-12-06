# repository.customer

## Boundaries

Files that require careful review before changes:
- `CustomerRepository.java` - external service contract

## Conventions

- Returns Mono<LoyaltyInfo>
- Should implement resilience patterns when converted to HTTP client

## Warnings

- Currently stubbed implementation (needs HTTP client for production)
- External service dependency (customer-service must be available)
