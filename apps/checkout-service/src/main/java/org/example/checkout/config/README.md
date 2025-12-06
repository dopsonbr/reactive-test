# config

## Purpose

Spring configuration for R2DBC database access and OAuth2 security.

## Behavior

R2dbcConfiguration provides custom JSONB converters for nested object serialization in PostgreSQL. SecurityConfig establishes OAuth2 resource server with JWT validation and scope-based authorization for checkout operations.
