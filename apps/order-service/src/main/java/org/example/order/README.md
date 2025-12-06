# order

## Purpose
Order service provides reactive order management with GraphQL and REST APIs, R2DBC persistence, and search capabilities.

## Behavior
Exposes order CRUD operations via GraphQL mutations/queries and REST endpoints. Persists orders to PostgreSQL with reactive R2DBC. Supports order search by customer, date range, and status filters.

## Quirks
- Component scanning includes platform packages (logging, error, security) for cross-cutting concerns
- Uses both GraphQL (primary) and REST (legacy) interfaces
