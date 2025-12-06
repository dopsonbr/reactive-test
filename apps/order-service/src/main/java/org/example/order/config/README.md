# config

## Purpose
Provides Spring Data R2DBC configuration for reactive PostgreSQL database access with custom JSONB column handling.

## Behavior
Registers bidirectional converters between PostgreSQL JSONB types and the JsonValue wrapper, enabling type-safe JSON storage and retrieval in entity fields without manual serialization.

## Quirks
- Converters apply automatically to all JsonValue fields in R2DBC entities
- Uses PostgreSQL-specific io.r2dbc.postgresql.codec.Json type
