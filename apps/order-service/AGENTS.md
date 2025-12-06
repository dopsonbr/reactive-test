# AGENTS.md - Order Service

## Overview

Order service provides read and update access to sold orders. It shares the `checkoutdb.orders` table with checkout-service but only performs read and update operations (no inserts).

## Architecture

```
org.example.order
├── config/           # R2DBC and JSON configuration
├── controller/       # REST endpoints
├── dto/              # Request/response DTOs
├── graphql/          # GraphQL resolvers
│   └── input/        # GraphQL input types
├── model/            # Domain models
├── repository/       # Data access layer
├── service/          # Business logic
└── validation/       # Request validation
```

## Key Patterns

### Reactive Programming
All operations use Project Reactor (`Mono`/`Flux`). Controllers return reactive types directly.

### Dual API Support
Both REST and GraphQL APIs are provided for the same operations:
- REST: Traditional HTTP endpoints in `controller/`
- GraphQL: Query/Mutation resolvers in `graphql/`

### Non-Fail-Fast Validation
Validation collects all errors before failing, using `ValidationException` with multiple `ValidationError` items.

### Repository Abstraction
`OrderRepository` interface allows swapping implementations. `PostgresOrderRepository` uses R2DBC with JSONB column support.

## Testing Guidelines

### Unit Tests
- Mock `OrderService` in controller tests
- Mock `OrderRepository` in service tests
- Use `StepVerifier` for reactive assertions

### Integration Tests
- Use `@DirtiesContext` to isolate database state
- Testcontainers for PostgreSQL
- Disable Flyway in tests (`spring.flyway.enabled=false`)

## Common Tasks

### Adding a New Query
1. Add query to `operations.graphqls`
2. Add method to `OrderQueryController` with `@QueryMapping`
3. Add validation if needed to `GraphQLInputValidator`
4. Add service method if needed

### Adding a New Mutation
1. Add mutation to `operations.graphqls`
2. Add method to `OrderMutationController` with `@MutationMapping`
3. Add validation to `GraphQLInputValidator`
4. Implement business logic in `OrderService`

### Modifying Order Model
1. Update `Order.java` and `OrderEntity.java`
2. Update `PostgresOrderRepository` mapping methods
3. Update GraphQL schema if exposing new fields
4. Update tests

## Dependencies

- **platform-error**: `ValidationException`, `GlobalErrorHandler`
- **platform-webflux**: Request context propagation
- **platform-security**: OAuth2 scope validation
- **shared-model-***: Shared domain types (discount, fulfillment, product)

## Database

Uses the same PostgreSQL database as checkout-service:
- Database: `checkoutdb`
- Table: `orders`
- Connection: R2DBC (reactive)
- JSONB columns: `line_items`, `applied_discounts`, `fulfillment_details`, `customer_snapshot`
