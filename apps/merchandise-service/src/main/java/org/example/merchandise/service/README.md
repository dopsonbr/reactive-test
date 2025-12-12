# service

## Purpose
Implements business logic for product merchandise operations.

## Behavior
Orchestrates repository calls, maps entities to DTOs, and enforces business rules for product management.

## Quirks
- Uses R2dbcEntityTemplate for UPDATE operations to set updatedAt timestamp
- Returns MerchandiseResponse for external callers, ProductEntity for internal operations
