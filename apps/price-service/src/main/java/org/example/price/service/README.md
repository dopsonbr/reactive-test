# org.example.price.service

## Purpose
Implements business logic for price retrieval, listing, and updates.

## Behavior
Orchestrates repository calls for price operations, applies defaults for currency, and handles upsert logic by checking existence before insert or update.

## Quirks
- Uses R2dbcEntityTemplate.insert() for new entities to avoid R2DBC's non-null ID update behavior
- Currency defaults to USD when not provided
