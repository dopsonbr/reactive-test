# Audit

## Purpose
Provides audit event tracking for cart operations, capturing user actions with request context for compliance and debugging.

## Behavior
Publishes structured audit events containing operation type, entity identifiers, user context, and event-specific payloads. Currently logs events locally via no-op implementation; designed for future integration with audit storage system.

## Quirks
- No-op publisher is active by default (audit.enabled=false)
- Events include full request metadata (store, user, session) from Reactor Context
- Event IDs are auto-generated UUIDs with timestamps
