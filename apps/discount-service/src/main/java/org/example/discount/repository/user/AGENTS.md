# repository.user

## Boundaries

Files that require careful review before changes:
- `UserRepository.java` - external service contract

## Conventions

- Returns Mono<UserContext>
- Should implement resilience patterns when converted to HTTP client

## Warnings

- Currently stubbed implementation (needs HTTP client for production)
- External service dependency (user-service must be available)
