# graphql.input

## Purpose
Provides immutable input types for GraphQL mutations and queries in the Order Service.

## Behavior
Java records map directly to GraphQL input types defined in schema.graphqls. Each record provides type-safe parameter binding for GraphQL operations with optional default value methods for pagination and constraints.

## Quirks
- `OrderSearchInput` enforces limit bounds (1-100, default 50) and non-negative offset (default 0) via helper methods
- All fields are nullable to support partial updates and optional search criteria
