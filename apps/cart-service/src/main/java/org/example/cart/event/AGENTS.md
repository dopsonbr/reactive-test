# Event

## Boundaries
Files requiring careful review: CartEventType.java (changes impact GraphQL schema and subscribers)

## Conventions
- CartEvent is immutable record with factory method CartEvent.of()
- All events include complete cart state for subscriber context
- Event types map one-to-one with mutation operations

## Warnings
- Adding event types requires GraphQL schema update
- Events must be JSON-serializable for Redis Pub/Sub
