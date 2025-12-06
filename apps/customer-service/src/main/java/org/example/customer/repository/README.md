# repository

## Purpose

Persistence layer for customer data using PostgreSQL with R2DBC reactive access.

## Behavior

CustomerRepository interface defines domain operations; PostgresCustomerRepository implements with R2DBC, mapping between Customer domain model and CustomerEntity database records. Uses JSONB columns for nested objects (addresses, wallet, loyalty, b2bInfo).
