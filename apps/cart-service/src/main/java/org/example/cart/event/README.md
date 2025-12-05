# Event

## Purpose
Defines cart event models for real-time subscription notifications.

## Behavior
Provides immutable event records containing event type, cart ID, complete cart state, and timestamp for publishing to GraphQL subscribers via Redis Pub/Sub.

## Quirks
- Events contain full cart snapshot, not just delta
- Timestamp generated at event creation time
