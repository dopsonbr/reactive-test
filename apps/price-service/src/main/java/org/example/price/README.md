# org.example.price

## Purpose
Provides reactive pricing data for products, supporting both service-to-service lookups and merchant portal management.

## Behavior
Exposes REST endpoints to retrieve individual product prices, list all prices with pagination, and update prices. Uses R2DBC for non-blocking database access and integrates platform libraries for logging, error handling, and security.

## Quirks
- Uses manual `R2dbcEntityTemplate.insert()` for new entities to avoid R2DBC treating non-null IDs as updates
- SKU serves as both business identifier and database primary key
