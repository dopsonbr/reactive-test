# repository

## Boundaries
Files requiring careful review: ProductEntity.java (database schema mapping)

## Conventions
- Extend R2dbcRepository for reactive repositories
- Use @Table and @Column annotations for explicit mapping
- Entity records are immutable

## Warnings
- SKU must be provided (not auto-generated) when creating products
- Changing ProductEntity requires corresponding Flyway migration
