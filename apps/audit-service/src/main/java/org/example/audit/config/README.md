# config

## Purpose
Provides Spring Boot configuration for database connectivity and Redis Streams consumer behavior.

## Behavior
Enables R2DBC auditing for PostgreSQL entities and binds external properties for the audit event consumer. Properties can be customized via `application.yml` under `audit.consumer.*` to control stream consumption, batch sizes, retry logic, and polling intervals.

## Quirks
- AuditConsumerProperties provides defaults if properties are missing or invalid
- R2DBC auditing requires entity fields annotated with `@CreatedDate`, `@LastModifiedDate`, etc.
