# org.example.price.repository

## Purpose
Provides reactive database access for price entities using Spring Data R2DBC.

## Behavior
Defines entity mapping to the prices table and repository interface for CRUD operations with pagination support.

## Quirks
- PriceEntity uses SKU as @Id, which complicates inserts (requires R2dbcEntityTemplate.insert() for new records)
- findAllBy(Pageable) provides paginated access without custom SQL
