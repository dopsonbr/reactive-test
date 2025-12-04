# Repository

## Purpose
Provides reactive persistence layer for shopping cart data using Postgres with R2DBC.

## Behavior
Abstracts cart storage behind CartRepository interface, with PostgresCartRepository handling domain-to-entity conversion and JSONB serialization for nested collections (products, discounts, fulfillments).

## Quirks
- Cart ID is UUID in database, String in domain model
- All nested collections stored as JSONB columns in Postgres
- Empty collections default to empty lists if JSONB is null
- JSON serialization errors propagate as Mono.error
