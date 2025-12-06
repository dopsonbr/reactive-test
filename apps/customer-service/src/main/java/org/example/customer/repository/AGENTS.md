# repository

## Boundaries

Files that require careful review before changes:
- `PostgresCustomerRepository.java` - JSON serialization logic affects all nested data
- `CustomerEntity.java` - schema changes require database migrations

## Conventions

- CustomerRepository is the domain interface
- PostgresCustomerRepository handles entity mapping and JSON serialization
- CustomerEntityRepository extends ReactiveCrudRepository
- Nested objects stored as JSONB columns
- customerId is the business identifier, id is the database primary key
- Email uniqueness constraint at database level per store

## Warnings

- Changing JSON serialization breaks existing data compatibility
- Parent-child relationship uses parentCustomerId field in B2BInfo JSONB
- Query methods for search require custom repository implementations
