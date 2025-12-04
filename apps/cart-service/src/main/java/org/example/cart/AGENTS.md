# Cart Service

## Boundaries
Files requiring careful review: SecurityConfig.java (authorization rules), CartRequestValidator.java (business constraints), CartService.java (orchestration logic), PostgresCartRepository.java (JSON serialization)

## Conventions
- All service methods return Mono or Flux (reactive streams)
- Controllers propagate RequestMetadata via Reactor Context using ContextKeys
- All mutations publish AuditEvent (currently no-op)
- Validation collects all errors before throwing ValidationException
- External clients wrap calls with ReactiveResilience (circuit breaker, retry, timeout)
- Cart totals recalculate on every mutation
- JSON serialization for nested collections (products, discounts, fulfillments) uses ObjectMapper

## Warnings
- Do not bypass CartRequestValidator; it enforces store number (1-2000), SKU (6 digits), quantity (1-999) constraints
- CartEntity uses JSONB columns; schema changes require migration coordination
- Security scopes are `cart:read` and `cart:write`; do not add method-level auth without updating SecurityConfig
- Anonymous carts have null customerId; handle nulls throughout the flow
