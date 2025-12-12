# repository

## Purpose
Reactive data access layer for user and preference persistence using Spring Data R2DBC.

## Behavior
Provides non-blocking database operations for user and preference entities with domain model conversion.

## Quirks
- Uses R2DBC entity repositories for database access
- Repository implementations convert between entities and domain models
