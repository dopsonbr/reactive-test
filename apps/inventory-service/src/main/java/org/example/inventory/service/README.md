# Service

## Purpose
Business logic layer for inventory operations.

## Behavior
Orchestrates repository calls, transforms entities to DTOs, and handles upsert logic for inventory updates.

## Quirks
- Uses R2dbcEntityTemplate.insert() instead of repository.save() for new records to avoid R2DBC treating non-null IDs as updates
